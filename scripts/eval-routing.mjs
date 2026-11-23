#!/usr/bin/env node
// Routing eval: does gmstack route plain-language requests to the right playbook?
//
// Usage:
//   node scripts/eval-routing.mjs --fixture <path to a gmstack-managed project> [--model sonnet]
//                                 [--only id,id] [--concurrency 3] [--max-turns 8]
//
// Each case runs headless Claude Code in its normal mode on a fresh copy of the fixture
// ("project") or an empty directory ("empty"), with this plugin loaded via --plugin-dir. Only
// read-only tools are allowed (Read, Glob, Grep, Skill); anything else is denied, so a case
// cannot change files. (Plan mode is not used: it changes how Claude approaches the task and
// writes plan files into ~/.claude/plans.) The
// runner reads the stream-json transcript and records which gmstack skills were invoked and
// which gm playbook files were read, then compares with the case's expectation.
//
// Exit code: 0 when every case passes, 1 otherwise. Needs the `claude` CLI on PATH.
import { readFileSync, mkdtempSync, cpSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const fixture = args.fixture && resolve(args.fixture);
const model = args.model ?? "sonnet";
const concurrency = Number(args.concurrency ?? 3);
const maxTurns = String(args["max-turns"] ?? 8);
const only = args.only ? new Set(args.only.split(",")) : null;

const { cases } = JSON.parse(readFileSync(join(root, "evals/routing.json"), "utf8"));
const selected = cases.filter((c) => !only || only.has(c.id));
if (selected.some((c) => c.fixture === "project") && !fixture) {
  console.error("eval-routing: --fixture <path> is required for project cases");
  process.exit(2);
}

const outDir = mkdtempSync(join(tmpdir(), "gmstack-eval-"));

function runCase(c) {
  return new Promise((done) => {
    const work = mkdtempSync(join(tmpdir(), `gmstack-case-${c.id}-`));
    if (c.fixture === "project") cpSync(fixture, work, { recursive: true });
    const child = spawn(
      "claude",
      ["-p", "--plugin-dir", root, "--model", model, "--max-turns", maxTurns, "--permission-mode", "default",
        "--allowedTools", "Read Glob Grep Skill", "--output-format", "stream-json", "--verbose", c.prompt],
      { cwd: work, stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", () => {
      writeFileSync(join(outDir, `${c.id}.jsonl`), out);
      const skills = new Set();
      const playbooks = new Set();
      for (const line of out.split("\n")) {
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        for (const block of msg?.message?.content ?? []) {
          if (block.type !== "tool_use") continue;
          const input = block.input ?? {};
          if (block.name === "Skill" && typeof input.skill === "string") {
            skills.add(input.skill.replace(/^gmstack:/, ""));
          }
          const file = input.file_path ?? input.path ?? "";
          const m = typeof file === "string" && file.match(/skills\/gm\/playbooks\/([a-z-]+)\.md$/);
          if (m) playbooks.add(m[1]);
        }
      }
      rmSync(work, { recursive: true, force: true });
      const meets = (e) =>
        e === "direct" ? skills.size === 0
        : e.startsWith("skill:") ? skills.has(e.slice(6))
        : skills.has("gm") && playbooks.has(e);
      const pass = c.expect.split("|").some(meets);
      done({ id: c.id, expect: c.expect, pass, skills: [...skills], playbooks: [...playbooks] });
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
      console.error(`${r.pass ? "PASS" : "FAIL"} ${r.id}`);
    }
  }),
);

results.sort((a, b) => selected.findIndex((c) => c.id === a.id) - selected.findIndex((c) => c.id === b.id));
console.log("| Case | Expect | Result | Skills invoked | Playbooks read |");
console.log("|---|---|---|---|---|");
for (const r of results) {
  console.log(`| ${r.id} | ${r.expect} | ${r.pass ? "PASS" : "FAIL"} | ${r.skills.join(", ") || "-"} | ${r.playbooks.join(", ") || "-"} |`);
}
const passed = results.filter((r) => r.pass).length;
console.log(`\n${passed}/${results.length} passed · model ${model} · transcripts: ${outDir}`);
process.exit(passed === results.length ? 0 : 1);
