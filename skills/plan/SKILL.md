---
name: plan
description: Design a change before coding it — trace what it touches, sketch two shapes and pick one, then write the data shapes, interfaces, files, acceptance criteria, and test-first tasks an implementer needs. Use for /plan, "design this", a feature, or any change that crosses a module boundary or alters a shared signature, schema, or contract.
---

# Plan

A plan is the set of decisions an implementer cannot make alone: which files, which names and signatures, which values the spec pins, which tests prove each task, and what "done" means. It leaves the rest — the bodies of functions — to the implementer.

## Size it

| Change | Plan |
|---|---|
| One file, obvious test | No plan document. One line in the task list. |
| A few files, one module | A short plan in the task list or the PR description: data shape, signatures, acceptance criteria. |
| Crosses a module boundary, changes a shared signature, schema, or contract, or will be split across agents | A plan document (below). |

## Steps

1. **Restate the goal** and the acceptance criteria. If the project has a PRD or README requirements, quote the requirement; if the criteria are missing, write them as observable behavior ("`tinycalc --precision 2 1 2.345` prints `3.35`").
2. **Trace** every system the change touches: callers, callees, data stores, config, tests. Read the code; list the files.
3. **Sketch two shapes.** For each: the core types, the signatures that change, where each piece of state lives. Pick the one where each piece of state has one owner, each task has one way to do it, and callers need to know the least. Record in two or three lines why the other lost. When workarounds keep appearing in a sketch, redesign instead of patching.
4. **Name the data shape first**, then the interfaces between modules (exact names, parameters, return types, error cases).
5. **Write the tasks.** Each task is the smallest unit that carries its own test cycle and could be rejected by a reviewer on its own. Fold setup and docs into the task that needs them.
6. **Write the review focus**: up to five inputs or conditions the spec does not mention but a reasonable user will hit (empty input, huge input, concurrent use, partial failure…). For each, name the expected behavior and the task whose tests pin it.
7. **Check the plan against the project's rules**: AGENTS.md conventions, protected files, the approval list. A task that needs a protected change or a new dependency is flagged for approval in the plan itself.

## Plan document

Save to `docs/plans/<YYYY-MM-DD>-<slug>.md`. From tier S, a decision with lasting consequences also gets an ADR in `docs/architecture/adr/`.

```markdown
# <Change> plan

**Goal:** <one sentence>
**Acceptance criteria:**
- <observable behavior 1>
- <observable behavior 2>

**Chosen shape:** <2-3 sentences> · **Rejected:** <the other shape, and why it lost>

## Data shapes
<types / schemas, as code>

## Interfaces
- `<name>(<params>) -> <return>` in `<file>` — errors: <cases>

## Review focus
- <input or condition> → <expected behavior> · pinned by Task <n>

## Needs approval
<protected-file changes, new dependencies — or "none">

## Tasks

### Task 1: <name>
Files: create `<path>` · modify `<path>:<lines>` · test `<path>`
Consumes: <signatures from earlier tasks> · Produces: <signatures later tasks use>
1. Failing test `<name>`: <assertions with exact values>
2. Run `<command>` → expect FAIL: <predicted message>
3. Implement `<signature>` in `<file>` — <one line on approach if the test leaves a choice>
4. Run `<command>` → expect PASS; run the full suite
```

## While implementing

The plan is a contract, not a wish. When implementation deviates — a signature changes, a task splits — update the plan and note who accepted the change and why. Never edit the plan just to match what was built without that note. Unresolved disagreements stay visible in the plan.

## Output

The plan (or its path), the chosen shape and why, the acceptance criteria, and anything that needs approval before work starts.
