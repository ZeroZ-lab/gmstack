#!/usr/bin/env node
// Checks and resolves project playbooks for gmstack.
//
// Project playbooks live in two folders, one Markdown file each:
//   user:    ${XDG_CONFIG_HOME:-~/.config}/gmstack/playbooks/   (applies in every repo)
//   project: <repo root>/.gm/playbooks/
//
// Frontmatter:
//   extends: feature, bug-fix   bundled playbooks this one changes; empty = standalone playbook
//   when: <one sentence>        the requests it serves
//
// An extending playbook's body is a list of changes, each anchored on a quoted run of a
// bundled step's own words:
//   - **After** "Run the `verify` skill.": Run `npm run docs:check`.
//   - **Before** "<quote>": <new step>
//   - **Replace** "<quote>": <new step text>
//   - **In** "<quote>": <text appended to that step>
// A standalone playbook has numbered steps like a bundled one.
//
// Usage (from the repo root, or pass --root):
//   node check-playbooks.mjs                 check every project playbook; list them
//   node check-playbooks.mjs --show <name>   print the playbook with project changes applied
//                                            (<name> is a bundled or standalone playbook)
// Exit: 0 ok (notes may print), 1 problems found (nothing is resolved), 2 usage error.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BUNDLED = resolve(dirname(fileURLToPath(import.meta.url)), "../playbooks");
const VERBS = ["After", "Before", "Replace", "In"];
const CHANGE = /^ {0,3}[-*]\s+\*\*(After|Before|Replace|In)\*\*\s*(.*)$/;
const flat = (s) => s.replace(/\s+/g, " ").trim();
// Steps that carry a non-negotiable. Replacing one is allowed but gets a note.
const GUARDED = /`(verify|review|tdd|checklist)` skill|independent review|Count\* script/i;

function repoRoot(start) {
  try {
    return execFileSync("git", ["-C", start, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return start;
  }
}

function splitFrontmatter(text) {
  const m = text.replace(/^﻿/, "").replaceAll("\r\n", "\n").match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!m) return { front: null, body: text.replaceAll("\r\n", "\n") };
  return { front: m[1], body: text.replaceAll("\r\n", "\n").slice(m[0].length) };
}

const field = (front, key) => {
  const v = front?.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"))?.[1] ?? "";
  return v.replace(/\s+#.*$/, "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
};

// Splits a playbook body into blocks: numbered top-level steps and the text between them
// (headings, prose). A step continues over indented lines, blank lines inside it, and a
// fenced block that follows it; a heading or an unindented paragraph ends it.
export function parseSteps(body) {
  const blocks = [];
  let step = null;
  let text = [];
  let fence = false;
  const flush = () => { if (text.length) blocks.push({ type: "text", lines: text }); text = []; };
  for (const line of body.replace(/^\uFEFF/, "").split("\n")) {
    const isFence = /^\s*(```|~~~)/.test(line);
    if (fence) { (step ? step.lines : text).push(line); if (isFence) fence = false; continue; }
    const start = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (start) {
      flush();
      step = { type: "step", lines: [start[2]] };
      blocks.push(step);
    } else if (step && (line.trim() === "" || /^\s+\S/.test(line) || isFence)) {
      step.lines.push(line);
    } else {
      step = null;
      text.push(line);
    }
    if (isFence) fence = true;
  }
  flush();
  // Trailing blank lines of a step belong to the text after it.
  for (const b of blocks) if (b.type === "step") {
    b.trail = 0;
    while (b.lines.length > 1 && b.lines.at(-1).trim() === "") { b.lines.pop(); b.trail++; }
  }
  const steps = blocks.filter((b) => b.type === "step");
  for (const s of steps) { s.text = s.lines.join("\n"); s.flat = flat(s.text); }
  return { blocks, steps };
}

// Change items in an extending playbook. Continuation lines are indented.
function parseChanges(body, problems, path) {
  const changes = [];
  let current = null;
  for (const line of body.split("\n")) {
    const m = line.match(CHANGE);
    if (m) {
      const q = m[2].match(/^"([^"]+)"\s*[:—–-]?\s*(.*)$/);
      if (!q) {
        problems.push(`${path}: "**${m[1]}**" needs a quoted anchor, as in **${m[1]}** "words of a bundled step": ...`);
        current = null;
        continue;
      }
      current = { verb: m[1], anchor: flat(q[1]), text: q[2] };
      changes.push(current);
    } else if (current && /^\s+\S/.test(line)) {
      current.text += "\n" + line.trim();
    } else if (line.trim()) {
      current = null;
    }
  }
  for (const c of changes) {
    c.text = c.text.trim();
    if (!c.text) problems.push(`${path}: **${c.verb}** "${c.anchor}" has no text after the anchor`);
  }
  return changes;
}

export function loadBundled(dir = BUNDLED) {
  const out = new Map();
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
    out.set(f.slice(0, -3), parseSteps(readFileSync(join(dir, f), "utf8")));
  }
  return out;
}

export function playbookDirs(root, env = process.env) {
  const config = env.XDG_CONFIG_HOME || join(env.HOME || homedir(), ".config");
  return [
    { scope: "user", dir: join(config, "gmstack/playbooks"), label: "~/.config/gmstack/playbooks" },
    { scope: "project", dir: join(root, ".gm/playbooks"), label: ".gm/playbooks" },
  ];
}

export function check(root, { bundledDir = BUNDLED, env = process.env } = {}) {
  const bundled = loadBundled(bundledDir);
  const problems = [];
  const notes = [];
  const playbooks = [];
  for (const { scope, dir, label } of playbookDirs(root, env)) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
      const path = `${label}/${f}`;
      const name = f.slice(0, -3);
      const { front, body } = splitFrontmatter(readFileSync(join(dir, f), "utf8"));
      if (front === null) { problems.push(`${path}: no frontmatter (needs "extends:" and "when:")`); continue; }
      const when = field(front, "when");
      if (!when) problems.push(`${path}: frontmatter needs a "when:" line`);
      if (!/^extends:/m.test(front)) problems.push(`${path}: frontmatter needs an "extends:" line (empty for a standalone playbook)`);
      const bases = field(front, "extends").replace(/^\[(.*)\]$/, "$1").split(",").map((s) => s.trim()).filter(Boolean);
      const pb = { scope, path, name, when, bases, changes: [], steps: null };
      playbooks.push(pb);
      for (const b of bases) if (!bundled.has(b)) problems.push(`${path}: extends "${b}", which this gmstack has no playbook for (have: ${[...bundled.keys()].join(", ")})`);

      if (bases.length === 0) {
        pb.steps = parseSteps(body);
        if (pb.steps.steps.length === 0) problems.push(`${path}: a standalone playbook needs numbered steps`);
        if (body.split("\n").some((l) => CHANGE.test(l))) problems.push(`${path}: has **After/Before/Replace/In** changes but extends nothing`);
        if (bundled.has(name)) problems.push(`${path}: standalone playbook "${name}" has the same name as a bundled playbook; rename it, or extend "${name}" instead`);
        continue;
      }

      pb.changes = parseChanges(body, problems, path);
      if (pb.changes.length === 0) problems.push(`${path}: extends ${bases.join(", ")} but has no **After/Before/Replace/In** changes`);
      if (parseSteps(body).steps.length) problems.push(`${path}: numbered steps in an extending playbook are not applied; write each as an **After**/**Before** change`);
      for (const c of pb.changes) {
        c.hits = [];
        for (const b of bases.filter((b) => bundled.has(b))) {
          const idx = bundled.get(b).steps.map((s, i) => (s.flat.includes(c.anchor) ? i : -1)).filter((i) => i >= 0);
          if (idx.length > 1) problems.push(`${path}: **${c.verb}** "${c.anchor}" matches steps ${idx.map((i) => i + 1).join(" and ")} of ${b}; quote more words so it names one step`);
          else if (idx.length === 1) c.hits.push({ base: b, step: idx[0] });
        }
        if (c.hits.length === 0 && bases.every((b) => bundled.has(b))) {
          problems.push(`${path}: **${c.verb}** "${c.anchor}" matches no step of ${bases.join(", ")} in this gmstack version; the bundled step was probably reworded. Re-anchor it on the current text; do not guess where it goes`);
        }
        for (const h of c.hits) {
          if (c.verb === "Replace" && GUARDED.test(bundled.get(h.base).steps[h.step].flat)) {
            notes.push(`${path}: replaces ${h.base} step ${h.step + 1}, which carries a gmstack non-negotiable (verify, review, tdd, or evidence). The non-negotiables still apply to the replacement.`);
          }
        }
      }
    }
  }
  // A standalone name defined in both folders: project wins.
  const standalone = playbooks.filter((p) => p.bases.length === 0);
  for (const p of standalone) {
    if (p.scope === "user" && standalone.some((q) => q.scope === "project" && q.name === p.name)) {
      notes.push(`${p.path}: shadowed by the project playbook of the same name`);
      p.shadowed = true;
    }
  }
  // Two Replace changes on one step conflict.
  const replaced = new Map();
  for (const p of playbooks) for (const c of p.changes) if (c.verb === "Replace") for (const h of c.hits ?? []) {
    const key = `${h.base}#${h.step}`;
    if (replaced.has(key)) problems.push(`${p.path}: replaces ${h.base} step ${h.step + 1}, which ${replaced.get(key)} also replaces; keep one`);
    else replaced.set(key, p.path);
  }
  return { bundled, playbooks, problems, notes };
}

// Renders blocks back to Markdown. Bundled steps keep their numbers, so cross-references
// such as "since the step-6 run" stay true; an inserted step takes the previous step's number
// plus a letter (6a, 6b). Numbering restarts after a heading, as in handoff's two sections.
function render(blocks) {
  const out = [];
  let n = 0;
  let letter = 0;
  for (const b of blocks) {
    if (b.type === "text") {
      if (b.lines.some((l) => /^#{1,6}\s/.test(l))) { n = 0; letter = 0; }
      out.push(...b.lines);
      continue;
    }
    const [first, ...rest] = b.lines;
    const label = b.inserted ? `${n}${String.fromCharCode(97 + letter++)}` : String(++n);
    if (!b.inserted) letter = 0;
    out.push(`${label}. ${first}`, ...rest, ...Array(b.trail ?? 0).fill(""));
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const asStep = (text) => {
  const [first, ...rest] = text.split("\n");
  return { type: "step", inserted: true, lines: [first, ...rest.map((l) => `   ${l}`)] };
};

// Apply every project change that extends `name`. User folder first, then project.
export function resolvePlaybook(result, name) {
  const { bundled, playbooks } = result;
  const own = playbooks.find((p) => p.name === name && p.bases.length === 0 && !p.shadowed);
  if (own) return `<!-- ${own.path} -->\n${render(own.steps.blocks)}`;
  if (!bundled.has(name)) return null;
  const base = bundled.get(name);
  const edits = new Map(base.steps.map((s) => [s, { before: [], after: [], appended: [], replaced: null }]));
  const sources = [];
  for (const p of playbooks) {
    const mine = p.changes.filter((c) => (c.hits ?? []).some((h) => h.base === name));
    if (!mine.length) continue;
    sources.push(`- ${p.name} (${p.path}) — applies when: ${p.when}`);
    for (const c of mine) {
      const e = edits.get(base.steps[c.hits.find((h) => h.base === name).step]);
      const tagged = `[${p.name}] ${c.text}`;
      if (c.verb === "Before") e.before.push(tagged);
      else if (c.verb === "After") e.after.push(tagged);
      else if (c.verb === "Replace") e.replaced = `[replaced by ${p.name}] ${c.text}`;
      else e.appended.push(tagged);
    }
  }
  const blocks = [];
  for (const b of base.blocks) {
    if (b.type === "text") { blocks.push(b); continue; }
    const e = edits.get(b);
    blocks.push(...e.before.map(asStep));
    const main = e.replaced ? { ...asStep(e.replaced), inserted: false } : { type: "step", lines: [...b.lines] };
    const after = e.after.map(asStep);
    (after.at(-1) ?? main).trail = b.trail;
    for (const a of e.appended) main.lines.push(...a.split("\n").map((l, i) => `   ${i ? "  " : "- "}${l}`));
    blocks.push(main, ...after);
  }
  const note = sources.length
    ? ["> Project changes applied; each changed step is tagged with its playbook's name.", ...sources.map((s) => `> ${s}`), "> A tagged step whose playbook's `when` does not fit this task stays in the task list as `skip: when does not apply`.", ""]
    : ["> No project playbook changes this playbook.", ""];
  const rendered = render(blocks);
  const [title, ...rest] = rendered.split("\n");
  return [title, "", ...note, ...rest].join("\n").replace(/\n{3,}/g, "\n\n");
}

function main(argv) {
  const args = argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  if (args.includes("-h") || args.includes("--help")) {
    console.log("usage: check-playbooks.mjs [--root <dir>] [--show <playbook>]");
    return 0;
  }
  const root = repoRoot(resolve(opt("--root") ?? process.cwd()));
  const result = check(root);
  const show = opt("--show");
  if (args.includes("--show") && !show) { console.error("--show needs a playbook name"); return 2; }

  for (const n of result.notes) console.log(`note: ${n}`);
  if (result.problems.length) {
    for (const p of result.problems) console.log(`problem: ${p}`);
    console.log(`\n${result.problems.length} problem(s). Project playbooks were not applied. Report these lines to the user; do not guess where an unanchored change belongs.`);
    return 1;
  }
  if (show) {
    const text = resolvePlaybook(result, show);
    if (text === null) {
      // An extension has no steps of its own: point at the playbook(s) it changes.
      const ext = result.playbooks.find((p) => p.name === show && p.bases.length);
      if (ext) console.error(`"${show}" extends ${ext.bases.join(", ")} and has no steps of its own: run --show ${ext.bases[0]} to read that playbook with this change applied`);
      else console.error(`no bundled or standalone playbook named "${show}"`);
      return 2;
    }
    console.log(text);
    return 0;
  }
  if (!result.playbooks.length) { console.log("No project playbooks (.gm/playbooks/ or ~/.config/gmstack/playbooks/)."); return 0; }
  console.log("Project playbooks:");
  for (const p of result.playbooks) {
    const kind = p.bases.length ? `extends ${p.bases.join(", ")}` : "standalone";
    console.log(`- ${p.name} · ${kind} · when: ${p.when} · ${p.path}${p.shadowed ? " · shadowed" : ""}`);
  }
  console.log("\nok");
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv);
