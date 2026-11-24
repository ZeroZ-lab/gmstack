#!/usr/bin/env node
// Validates the gmstack plugin's structure. Exits non-zero on any problem.
//
// Checks:
//   1. .claude-plugin/plugin.json parses and has name "gmstack" and a semver version
//   2. every skills/<dir>/SKILL.md has frontmatter whose name equals <dir> and a description
//   3. every relative markdown link in skills/** resolves to an existing file inside the repo
//   4. every playbook and principle listed in skills/gm/SKILL.md exists, and every file in
//      those folders is listed (no orphans)
//   5. every checklist item ID in the catalog is unique and every GATE ID is present
//   6. package.json version matches plugin.json version
//   7. hooks/hooks.json parses, every hook script it names exists and is executable, and
//      every `gmstack:<skill>` named in hooks/routing.md is a real skill
//   8. every bundled playbook has numbered steps (project playbooks anchor on them) and the
//      **Start** line that makes the agent build the task list and invoke named skills
//   9. evals/*.json parse; every case names a real overlay, a known expectation or marker
//      kind, and a playbook or skill that exists
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const fail = (msg) => problems.push(msg);
const read = (p) => readFileSync(join(root, p), "utf8");

// 1. manifest
let manifest;
try {
  manifest = JSON.parse(read(".claude-plugin/plugin.json"));
  if (manifest.name !== "gmstack") fail(`plugin.json: name is "${manifest.name}", expected "gmstack"`);
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) fail(`plugin.json: version "${manifest.version}" is not semver`);
} catch (e) {
  fail(`plugin.json: ${e.message}`);
}

// 6. package.json version
if (existsSync(join(root, "package.json")) && manifest) {
  const pkg = JSON.parse(read("package.json"));
  if (pkg.version !== manifest.version) fail(`package.json version ${pkg.version} != plugin.json version ${manifest.version}`);
}

// 2. skills
const skillDirs = readdirSync(join(root, "skills")).filter((d) => statSync(join(root, "skills", d)).isDirectory());
for (const dir of skillDirs) {
  const p = `skills/${dir}/SKILL.md`;
  if (!existsSync(join(root, p))) { fail(`${p}: missing`); continue; }
  const m = read(p).match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) { fail(`${p}: no frontmatter`); continue; }
  const name = m[1].match(/^name:\s*(.+)$/m)?.[1].trim();
  const desc = m[1].match(/^description:\s*(.+)$/m)?.[1].trim();
  if (name !== dir) fail(`${p}: frontmatter name "${name}" != directory "${dir}"`);
  if (!desc) fail(`${p}: missing description`);
  else if (desc.length > 1024) fail(`${p}: description is ${desc.length} chars (max 1024)`);
}

// 3. relative links
const walk = (d) => readdirSync(join(root, d)).flatMap((f) => {
  const rel = `${d}/${f}`;
  return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
});
const mdFiles = walk("skills").filter((f) => f.endsWith(".md"));
for (const f of mdFiles) {
  // strip fenced code blocks so example links are not checked
  const text = read(f).replace(/```[\s\S]*?```/g, "");
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const abs = resolve(root, dirname(f), target.split("#")[0]);
    if (relative(root, abs).startsWith("..")) fail(`${f}: link "${target}" leaves the plugin`);
    else if (!existsSync(abs)) fail(`${f}: broken link "${target}"`);
  }
}

// 4. gm index completeness
const gm = read("skills/gm/SKILL.md");
for (const folder of ["playbooks", "references/principles"]) {
  const files = readdirSync(join(root, "skills/gm", folder)).filter((f) => f.endsWith(".md"));
  for (const f of files) if (!gm.includes(`(${folder}/${f})`)) fail(`skills/gm/${folder}/${f}: not listed in gm/SKILL.md`);
}

// 5. catalog IDs
const catalog = read("skills/checklist/references/checklist-v1.2.md");
const ids = [...catalog.matchAll(/^- ([A-Z]+-\d{2}) /gm)].map((m) => m[1]);
const seen = new Set();
for (const id of ids) { if (seen.has(id)) fail(`catalog: duplicate ID ${id}`); seen.add(id); }
for (let i = 1; i <= 12; i++) {
  const id = `GATE-${String(i).padStart(2, "0")}`;
  if (!seen.has(id)) fail(`catalog: missing ${id}`);
}

// 7. hooks
if (existsSync(join(root, "hooks/hooks.json"))) {
  try {
    const hooks = JSON.parse(read("hooks/hooks.json")).hooks ?? {};
    for (const groups of Object.values(hooks)) {
      for (const g of groups) for (const h of g.hooks ?? []) {
        for (const [, rel] of (h.command ?? "").matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"'\s]+)/g)) {
          const abs = join(root, rel);
          if (!existsSync(abs)) fail(`hooks.json: script ${rel} does not exist`);
          else if (!(statSync(abs).mode & 0o111)) fail(`hooks.json: script ${rel} is not executable`);
        }
      }
    }
  } catch (e) {
    fail(`hooks.json: ${e.message}`);
  }
  if (existsSync(join(root, "hooks/routing.md"))) {
    for (const [, name] of read("hooks/routing.md").matchAll(/gmstack:([a-z][a-z0-9-]*)/g)) {
      if (!skillDirs.includes(name)) fail(`hooks/routing.md: names unknown skill gmstack:${name}`);
    }
  }
}

// 8. bundled playbooks have steps
const { loadBundled } = await import("../skills/gm/scripts/check-playbooks.mjs");
const bundled = loadBundled();
for (const [name, p] of bundled) if (!p.steps.length) fail(`skills/gm/playbooks/${name}.md: no numbered steps`);
for (const name of bundled.keys()) {
  if (!/^\*\*Start\*\*: before step 1, create the task list/m.test(read(`skills/gm/playbooks/${name}.md`))) fail(`skills/gm/playbooks/${name}.md: missing the **Start** line (task list + invoke named skills)`);
}

// 9. eval suites
const overlayOk = (c, file) => {
  if (c.overlay && !existsSync(join(root, "evals/overlays", c.overlay))) fail(`${file}: case ${c.id} overlay "${c.overlay}" does not exist`);
};
const nameOk = (file, id, kind, name) => {
  if (kind === "skill" && !skillDirs.includes(name)) fail(`${file}: case ${id} names unknown skill "${name}"`);
};
if (existsSync(join(root, "evals/routing.json"))) {
  try {
    for (const c of JSON.parse(read("evals/routing.json")).cases) {
      overlayOk(c, "evals/routing.json");
      for (const alt of c.expect.split(/\|(?![^(]*\))/)) for (const cond of alt.split("&")) {
        const [kind, ...rest] = cond.split(":");
        if (cond === "direct" || kind === "show" || kind === "say") continue;
        if (kind === "skill") nameOk("evals/routing.json", c.id, "skill", rest.join(":"));
        else if (!bundled.has(cond)) fail(`evals/routing.json: case ${c.id} expects unknown playbook "${cond}"`);
      }
    }
  } catch (e) { fail(`evals/routing.json: ${e.message}`); }
}
if (existsSync(join(root, "evals/flow.json"))) {
  try {
    for (const c of JSON.parse(read("evals/flow.json")).cases) {
      overlayOk(c, "evals/flow.json");
      if (c.fixture !== "project" && c.fixture !== "empty") fail(`evals/flow.json: case ${c.id} fixture must be "project" or "empty"`);
      for (const step of c.steps) if (step.min !== undefined && !(Number.isInteger(step.min) && step.min > 0)) fail(`evals/flow.json: case ${c.id} step ${step.id} min must be a positive integer`);
      for (const step of c.steps) for (const m of step.any) {
        const [kind, ...rest] = m.replace(/^!/, "").split(":");
        if (m.replace(/^!/, "") === "agent") continue;
        if (!["skill", "read", "wrote", "bash", "changed", "tool"].includes(kind)) fail(`evals/flow.json: case ${c.id} step ${step.id} has unknown marker "${m}"`);
        else if (kind === "skill") nameOk("evals/flow.json", c.id, "skill", rest.join(":"));
        else if (kind === "tool") continue;
        else try { new RegExp(rest.join(":")); } catch (e) { fail(`evals/flow.json: case ${c.id} step ${step.id}: ${e.message}`); }
      }
    }
  } catch (e) { fail(`evals/flow.json: ${e.message}`); }
}

if (problems.length) {
  console.error(`gmstack validation failed (${problems.length}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`gmstack validation passed: ${skillDirs.length} skills, ${mdFiles.length} markdown files, ${ids.length} checklist items.`);
