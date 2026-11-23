import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { check, resolvePlaybook, loadBundled } from "../skills/gm/scripts/check-playbooks.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const BUNDLED = resolve(here, "../skills/gm/playbooks");
const SCRIPT = resolve(here, "../skills/gm/scripts/check-playbooks.mjs");

// A temp repo root plus an isolated XDG config dir, so the real ~/.config is never read.
function setup(project = {}, user = {}) {
  const root = mkdtempSync(join(tmpdir(), "gm-pb-"));
  const config = join(root, ".cfg");
  mkdirSync(join(root, ".gm/playbooks"), { recursive: true });
  mkdirSync(join(config, "gmstack/playbooks"), { recursive: true });
  for (const [f, t] of Object.entries(project)) writeFileSync(join(root, ".gm/playbooks", f), t);
  for (const [f, t] of Object.entries(user)) writeFileSync(join(config, "gmstack/playbooks", f), t);
  return { root, env: { XDG_CONFIG_HOME: config, HOME: root } };
}
const pb = (front, body) => `---\n${front}\n---\n\n${body}\n`;
const run = (project, user, opts = {}) => {
  const { root, env } = setup(project, user);
  return check(root, { env, ...opts });
};
const has = (list, re) => assert.ok(list.some((l) => re.test(l)), `expected a line matching ${re}, got:\n${list.join("\n")}`);

test("every bundled playbook has numbered steps", () => {
  for (const [name, p] of loadBundled()) assert.ok(p.steps.length > 0, `${name} has no numbered steps`);
});

test("with no project changes, --show reproduces each bundled playbook", () => {
  const r = run();
  for (const f of readdirSync(BUNDLED)) {
    const name = f.slice(0, -3);
    const original = readFileSync(join(BUNDLED, f), "utf8").trim();
    const shown = resolvePlaybook(r, name).replace(/\n> No project playbook changes this playbook.\n/, "");
    assert.equal(shown.trim(), original, `round trip changed ${name}`);
  }
});

test("a valid extension applies Before, After, In, and Replace at the anchored steps", () => {
  const r = run({
    "docs.md": pb("extends: feature\nwhen: CLI output changes", [
      '- **Before** "Investigate: read the code": Read docs/cli.md.',
      '- **After** "Run the `verify` skill.": Regenerate docs.',
      '- **In** "Update docs the feature changes": also examples/.',
      '- **Replace** "Commit only if the user": Commit with a signed-off trailer.',
    ].join("\n")),
  });
  assert.deepEqual(r.problems, []);
  const out = resolvePlaybook(r, "feature");
  assert.match(out, /^2a\. \[docs\] Read docs\/cli\.md\.$/m);
  assert.match(out, /^3\. Investigate:/m);
  assert.match(out, /^6\. Run the `verify` skill\.\n6a\. \[docs\] Regenerate docs\.$/m);
  assert.match(out, /^10\. Update docs .*\n   - \[docs\] also examples\/\.$/m);
  assert.match(out, /^13\. \[replaced by docs\] Commit with a signed-off trailer\.$/m);
  assert.match(out, /^14\. Report:/m, "bundled numbers are kept");
  assert.match(out, /applies when: CLI output changes/);
});

test("user-folder changes come before project changes", () => {
  const r = run(
    { "p.md": pb("extends: bug-fix\nwhen: always", '- **After** "Rerun the regression test": project step') },
    { "u.md": pb("extends: bug-fix\nwhen: always", '- **After** "Rerun the regression test": user step') },
  );
  assert.deepEqual(r.problems, []);
  const out = resolvePlaybook(r, "bug-fix");
  assert.ok(out.indexOf("[u] user step") < out.indexOf("[p] project step"));
});

test("an anchor the bundled playbook no longer has is a problem, not a guess", () => {
  const r = run({ "x.md": pb("extends: feature\nwhen: x", '- **After** "Run the test suite": do it') });
  has(r.problems, /matches no step of feature.*do not guess/);
});

test("an upgrade that rewords a step breaks the anchor", () => {
  const bundledDir = mkdtempSync(join(tmpdir(), "gm-bundled-"));
  cpSync(BUNDLED, bundledDir, { recursive: true });
  const f = join(bundledDir, "feature.md");
  writeFileSync(f, readFileSync(f, "utf8").replace("6. Run the `verify` skill.", "6. Run verification."));
  const project = { "x.md": pb("extends: feature\nwhen: x", '- **After** "Run the `verify` skill.": regenerate docs') };
  assert.deepEqual(run(project).problems, []);
  has(run(project, {}, { bundledDir }).problems, /matches no step of feature/);
});

test("an anchor that matches two steps is ambiguous", () => {
  const r = run({ "x.md": pb("extends: feature\nwhen: x", '- **After** "verify": y') });
  has(r.problems, /matches steps .* of feature; quote more words/);
});

test("frontmatter and shape problems are reported", () => {
  const r = run({
    "a.md": "no frontmatter\n",
    "b.md": pb("extends: feature", '- **After** "Run the `verify` skill.": y'),
    "c.md": pb("extends: nope\nwhen: x", '- **After** "a": b'),
    "d.md": pb("extends: feature\nwhen: x", "- **After** no quote here"),
    "e.md": pb("extends: feature\nwhen: x", "Just prose, no changes."),
    "f.md": pb("extends: feature\nwhen: x", '1. a numbered step\n- **After** "Run the `verify` skill.": y'),
    "g.md": pb("when: x", "1. step"),
    "feature.md": pb("extends:\nwhen: x", "1. my own feature flow"),
    "h.md": pb("extends:\nwhen: x", "No steps."),
    "i.md": pb("extends: feature\nwhen: x", '- **After** "Run the `verify` skill.":'),
  });
  has(r.problems, /a\.md: no frontmatter/);
  has(r.problems, /b\.md: frontmatter needs a "when:" line/);
  has(r.problems, /c\.md: extends "nope"/);
  has(r.problems, /d\.md: "\*\*After\*\*" needs a quoted anchor/);
  has(r.problems, /e\.md: extends feature but has no/);
  has(r.problems, /f\.md: numbered steps in an extending playbook/);
  has(r.problems, /g\.md: frontmatter needs an "extends:" line/);
  has(r.problems, /feature\.md: standalone playbook "feature" has the same name/);
  has(r.problems, /h\.md: a standalone playbook needs numbered steps/);
  has(r.problems, /i\.md: .* has no text after the anchor/);
});

test("two playbooks replacing one step conflict", () => {
  const change = '- **Replace** "Commit only if the user": mine';
  const r = run({ "a.md": pb("extends: feature\nwhen: x", change), "b.md": pb("extends: feature\nwhen: x", change) });
  has(r.problems, /b\.md: replaces feature step 13, which .*a\.md also replaces/);
});

test("replacing a step that carries a non-negotiable prints a note", () => {
  const r = run({ "a.md": pb("extends: feature\nwhen: x", '- **Replace** "Run the `verify` skill.": run make check') });
  assert.deepEqual(r.problems, []);
  has(r.notes, /replaces feature step 6, which carries a gmstack non-negotiable/);
});

test("a standalone playbook resolves to its own steps; project shadows user", () => {
  const body = (who) => `# Playbook: notes\n\n1. ${who} step`;
  const r = run({ "notes.md": pb("extends:\nwhen: release notes", body("project")) }, { "notes.md": pb("extends:\nwhen: release notes", body("user")) });
  assert.deepEqual(r.problems, []);
  has(r.notes, /shadowed by the project playbook/);
  assert.match(resolvePlaybook(r, "notes"), /^1\. project step$/m);
});

test("CLI: exit 1 and no resolved playbook when there are problems; exit 0 otherwise", () => {
  const bad = setup({ "x.md": pb("extends: feature\nwhen: x", '- **After** "gone": y') });
  const r1 = spawnSync("node", [SCRIPT, "--root", bad.root, "--show", "feature"], { env: { ...process.env, ...bad.env }, encoding: "utf8" });
  assert.equal(r1.status, 1);
  assert.match(r1.stdout, /problem: .*matches no step/);
  assert.doesNotMatch(r1.stdout, /# Playbook: feature/);

  const good = setup({ "x.md": pb("extends: feature\nwhen: x", '- **After** "Run the `verify` skill.": y') });
  const r2 = spawnSync("node", [SCRIPT, "--root", good.root], { env: { ...process.env, ...good.env }, encoding: "utf8" });
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.match(r2.stdout, /- x · extends feature · when: x/);

  const r3 = spawnSync("node", [SCRIPT, "--root", good.root, "--show", "nope"], { env: { ...process.env, ...good.env }, encoding: "utf8" });
  assert.equal(r3.status, 2);
});

test("the examples in references/project-playbooks.md anchor on the current bundled steps", () => {
  const doc = readFileSync(resolve(here, "../skills/gm/references/project-playbooks.md"), "utf8");
  const blocks = [...doc.matchAll(/```markdown\n([\s\S]*?)```/g)].map((m) => m[1]);
  const changes = blocks.find((b) => b.includes("**Before**"));
  const standalone = blocks.find((b) => /^extends:\s*$/m.test(b));
  assert.ok(changes && standalone, "doc examples not found");
  const r = run({ "doc-example.md": pb("extends: feature\nwhen: doc example", changes.trim()), "release-notes.md": standalone });
  assert.deepEqual(r.problems, []);
});
