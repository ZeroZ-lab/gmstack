# Playbook: refactor

**When**: restructuring code without changing what it does — renaming, extracting, moving, simplifying, replacing an internal API, migrating callers.

**Start**: before step 1, create the task list from the steps below: one `TaskCreate` per step, verbatim. If `TaskCreate` is listed but not loaded, load it first with `ToolSearch` (`select:TaskCreate,TaskUpdate,TaskList`). A step that names a skill invokes it with the Skill tool, even when the change looks trivial.

The contract is **behavior unchanged**, proven by tests that ran before and after. A refactor that changes behavior is a feature or a fix: stop and switch playbooks.

1. Restate the goal: what gets simpler, and the target shape.
2. Investigate: read the code and list every caller of what will change.
3. **Pin current behavior.** Find the tests that cover the code. Where coverage is missing, add characterization tests first, at a public seam, asserting what the code does today (even where that looks wrong — note it, do not fix it). Prove each new test can fail with the `tdd` skill's *Code written before its test* procedure.
4. Run the `verify` skill and keep the result as the **baseline**.
5. Plan the units with the `plan` skill when the change crosses a module boundary or alters a shared signature. Read [subtract-before-adding](../references/principles.md#subtract-before-adding) and [verifiable-units](../references/principles.md#verifiable-units): delete dead code first, then reshape, one unit at a time. A new internal API ships together with the migration of every caller and the deletion of the old one.
6. For each unit: make the change, run the tests, keep them green. **Never edit a test's assertions to make it pass** — a test that fails means behavior changed. Moving or renaming a test without changing what it asserts is fine.
7. Run the `verify` skill. Every step that passed in the baseline still passes, and the test count did not drop.
8. Independent review with the `review` skill. Tell the reviewer the contract is behavior-unchanged and ask it to look for changed behavior, changed assertions, and dropped tests.
9. Fix blocking findings; rerun verify; send behavior-touching fixes to a fresh reviewer.
10. Run the `deslop` skill on the diff.
11. Record: update CHECKLIST.md rows this moves (DEV-09, DEV-10, ARC-02 and others) with the `checklist` skill and run its *Count* script.
12. Final verify if anything changed since step 7. Commit only if the user or AGENTS.md allows it, one commit per unit. Never push.
13. Report: what changed shape and why; the baseline and final verify results side by side, with test counts; characterization tests added (and any surprising behavior they pinned); review verdict; CHECKLIST rows and *Count* output; principles applied.
