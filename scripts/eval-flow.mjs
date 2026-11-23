#!/usr/bin/env node
// Flow eval: does gmstack carry a task through its playbook, step by step?
//
// Usage:
//   node scripts/eval-flow.mjs --fixture <path to a gmstack-managed git repo> [--model sonnet]
//                              [--only id,id] [--repeat 1] [--concurrency 2] [--max-turns 150]
//                              [--timeout-min 30]
//
// Each case copies the fixture (plus an optional overlay from evals/overlays/) into a temp
// directory and runs headless Claude Code there with this plugin loaded, edits accepted, and
// Bash allowed, so it is slow and spends real tokens (several minutes per case). The fixture
// itself is never touched. After the run the script checks evals/flow.json's markers against
// the stream-json transcript and the copy's git state, and prints one row per step plus each
// case's completion rate.
//
// Exit code: 0 when every step of every case passed, 1 otherwise, 3 when a case was cut short
// (usage limit, API error, timeout) and so could not be scored. Needs `claude` and `git`.
import { readFileSync, mkdtempSync, cpSync, rmSync, writeFileSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const fixture = args.fixture && resolve(args.fixture);
const model = args.model ?? "sonnet";
const concurrency = Number(args.concurrency ?? 2);
const maxTurns = String(args["max-turns"] ?? 150);
const timeoutMs = Number(args["timeout-min"] ?? 30) * 60_000;
const only = args.only ? new Set(args.only.split(",")) : null;
const repeat = Math.max(1, Number(args.repeat ?? 1));
if (!fixture) { console.error("eval-flow: --fixture <path> is required"); process.exit(2); }

const { cases } = JSON.parse(readFileSync(join(root, "evals/flow.json"), "utf8"));
const chosen = cases.filter((c) => !only || only.has(c.id));
// --repeat N runs each case N times (ids get a #n suffix) to show how stable each step is.
const selected = chosen.flatMap((c) => (repeat === 1 ? [c] : Array.from({ length: repeat }, (_, i) => ({ ...c, id: `${c.id}#${i + 1}`, base: c.id }))));
const outDir = mkdtempSync(join(tmpdir(), "gmstack-flow-"));
// A run cut short by a usage/rate limit or an API error measures nothing; report it as
// INCOMPLETE instead of scoring it.
const incompleteReason = (out) => {
  const result = out.split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).find((m) => m?.type === "result");
  if (!result) return "no result (killed or crashed)";
  const text = String(result.result ?? "");
  if (/hit your .*limit|usage limit|rate limit/i.test(text)) return text.split("\n")[0];
  if (result.is_error && result.subtype !== "error_max_turns") return `${result.subtype}: ${text.split("\n")[0]}`.slice(0, 160);
  return null;
};
const git = (cwd, ...a) => execFileSync("git", ["-C", cwd, ...a], { encoding: "utf8" });

function changedFiles(work, startHead) {
  const files = new Set();
  // committed since the start, staged, unstaged, and untracked
  if (startHead) for (const f of git(work, "diff", "--name-only", startHead, "HEAD").split("\n")) if (f) files.add(f);
  for (const line of git(work, "status", "--porcelain", "--untracked-files=all").split("\n")) {
    const f = line.slice(3).split(" -> ").pop();
    if (f) files.add(f.replace(/^"|"$/g, ""));
  }
  return files;
}

function evidence(out) {
  const ev = { skills: new Set(), reads: [], bash: [], agents: 0, tools: new Set() };
  for (const line of out.split("\n")) {
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    for (const block of msg?.message?.content ?? []) {
      if (block.type !== "tool_use") continue;
      const input = block.input ?? {};
      ev.tools.add(block.name);
      if (block.name === "Skill" && typeof input.skill === "string") ev.skills.add(input.skill.replace(/^gmstack:/, ""));
      if (block.name === "Read" && typeof input.file_path === "string") {
        ev.reads.push(input.file_path);
        const m = input.file_path.match(/skills\/([a-z-]+)\/SKILL\.md$/);
        if (m) ev.skills.add(m[1]);
      }
      if (block.name === "Bash" && typeof input.command === "string") ev.bash.push(input.command);
      if (block.name === "Agent" || block.name === "Task") ev.agents++;
    }
  }
  return ev;
}

function marker(m, ev, changed) {
  if (m === "agent") return ev.agents > 0;
  const [kind, ...rest] = m.split(":");
  const arg = rest.join(":");
  if (kind === "skill") return ev.skills.has(arg);
  if (kind === "tool") return ev.tools.has(arg);
  const re = new RegExp(arg);
  if (kind === "read") return ev.reads.some((p) => re.test(p));
  if (kind === "bash") return ev.bash.some((c) => re.test(c));
  if (kind === "changed") return [...changed].some((f) => re.test(f));
  throw new Error(`unknown marker "${m}"`);
}

function runCase(c) {
  return new Promise((done) => {
    const work = mkdtempSync(join(tmpdir(), `gmstack-flow-${c.id.replace("#", "-")}-`));
    cpSync(fixture, work, { recursive: true });
    if (c.overlay) cpSync(join(root, "evals/overlays", c.overlay), work, { recursive: true });
    let startHead = "";
    try {
      // A case's setup (e.g. planting a bug), leftover changes in the fixture, and the overlay
      // are the starting state, not changes the run made: commit them as a baseline in the copy.
      if (c.setup) execFileSync("sh", ["-c", c.setup], { cwd: work, stdio: "ignore" });
      git(work, "add", "-A");
      if (git(work, "status", "--porcelain")) git(work, "-c", "user.name=eval", "-c", "user.email=eval@localhost", "commit", "-qm", "eval baseline");
      startHead = git(work, "rev-parse", "HEAD").trim();
    } catch (e) {
      if (c.setup) { rmSync(work, { recursive: true, force: true }); return done({ id: c.id, steps: c.steps.map((s) => ({ id: s.id, pass: false })), exit: null, minutes: "0", stop: `setup failed: ${e.message.split("\n")[0]}`, changed: [] }); }
    }
    const started = Date.now();
    const child = spawn(
      "claude",
      ["-p", "--plugin-dir", root, "--model", model, "--max-turns", maxTurns, "--permission-mode", "acceptEdits",
        "--allowedTools", "Bash Read Write Edit Glob Grep Skill Agent Task ToolSearch TaskCreate TaskUpdate TaskList TaskGet TodoWrite", "--output-format", "stream-json", "--verbose", c.prompt],
      { cwd: work, stdio: ["ignore", "pipe", "pipe"] },
    );
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => {
      clearTimeout(timer);
      writeFileSync(join(outDir, `${c.id.replace("#", "-")}.jsonl`), out);
      const ev = evidence(out);
      let changed = new Set();
      try { changed = changedFiles(work, startHead); } catch {}
      const steps = c.steps.map((s) => ({ id: s.id, pass: s.any.some((m) => marker(m, ev, changed)) }));
      const result = out.split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).find((m) => m?.type === "result");
      rmSync(work, { recursive: true, force: true });
      done({ id: c.id, base: c.base ?? c.id, steps, incomplete: incompleteReason(out), exit: code, minutes: ((Date.now() - started) / 60000).toFixed(1), stop: result?.subtype ?? "no result", changed: [...changed] });
    });
  });
}

const results = [];
const queue = [...selected];
await Promise.all(
  Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const c = queue.shift();
      const r = await runCase(c);
      results.push(r);
      const passed = r.steps.filter((s) => s.pass).length;
      if (r.incomplete) console.error(`INCOMPLETE ${r.id}: ${r.incomplete}`);
      else console.error(`${passed}/${r.steps.length} ${r.id} (${r.minutes} min, ${r.stop})`);
    }
  }),
);

results.sort((a, b) => selected.findIndex((c) => c.id === a.id) - selected.findIndex((c) => c.id === b.id));
let total = 0;
let passedAll = 0;
const incomplete = results.filter((r) => r.incomplete);
for (const r of results) {
  if (r.incomplete) { console.log(`\n### ${r.id}: INCOMPLETE — ${r.incomplete}`); continue; }
  const passed = r.steps.filter((s) => s.pass).length;
  total += r.steps.length;
  passedAll += passed;
  console.log(`\n### ${r.id}: ${passed}/${r.steps.length} steps (${Math.round((100 * passed) / r.steps.length)}%) · ${r.minutes} min · ${r.stop}\n`);
  console.log("| Step | Result |\n|---|---|");
  for (const s of r.steps) console.log(`| ${s.id} | ${s.pass ? "PASS" : "MISS"} |`);
  console.log(`\nFiles changed: ${r.changed.join(", ") || "none"}`);
}
if (repeat > 1) {
  console.log(`\n### Step stability over ${repeat} runs (incomplete runs left out)\n`);
  for (const c of chosen) {
    const runs = results.filter((r) => r.base === c.id && !r.incomplete);
    console.log(`${c.id}: ${runs.length} scored run(s)`);
    console.log("| Step | Passed |\n|---|---|");
    for (const st of c.steps) console.log(`| ${st.id} | ${runs.filter((r) => r.steps.find((s) => s.id === st.id)?.pass).length}/${runs.length} |`);
    console.log("");
  }
}
console.log(`\nFlow completion: ${passedAll}/${total} steps (${total ? Math.round((100 * passedAll) / total) : 0}%) · model ${model} · transcripts: ${outDir}`);
if (incomplete.length) {
  console.log(`${incomplete.length} case(s) INCOMPLETE and left out of the rate; rerun them with --only ${incomplete.map((r) => r.id).join(",")}`);
  process.exit(3);
}
process.exit(passedAll === total ? 0 : 1);
