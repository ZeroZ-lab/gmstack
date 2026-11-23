# Playbook: feature

**When**: adding new behavior — a feature, an option, an endpoint, a screen.

**Start**: before step 1, create the task list from the steps below: one `TaskCreate` per step, verbatim. If `TaskCreate` is listed but not loaded, load it first with `ToolSearch` (`select:TaskCreate,TaskUpdate,TaskList`). A step that names a skill invokes it with the Skill tool, even when the change looks trivial.

1. Restate the goal and the smallest change that delivers it.
2. Write the acceptance criteria as observable behavior. Take them from the PRD or README requirements if they exist; otherwise write them and add them there (PRD-02). Unclear criteria with the user around → ask once; user away → state your assumption and continue.
3. Investigate: read the code the feature touches — callers, callees, data, config, existing tests.
4. Plan with the `plan` skill, sized to the change. A change that crosses a module boundary or alters a shared signature, schema, or contract gets a plan document. Flag anything that needs approval (protected files, new dependencies) and stop for it before implementing that part.
5. Implement with the `tdd` skill, one vertical slice per acceptance criterion. Keep each slice's red and green evidence.
6. Run the `verify` skill.
7. Run the program on the real surface (CLI invocation, HTTP request, browser) for each acceptance criterion and record the command and output. Tests passing is not the same as the feature working.
8. Independent review with the `review` skill, giving the reviewer the acceptance criteria as the spec.
9. Fix blocking findings; rerun verify; send behavior-changing fixes to a fresh reviewer.
10. Update docs the feature changes (README usage, CHANGELOG `Unreleased`).
11. Record: update CHECKLIST.md rows this work moves (PRD-02, QA-01, QA-02, and any others) with the `checklist` skill, then run its *Count* script.
12. Run the `deslop` skill on the diff. Then the final verify: if any file changed since the step-6 run (fixes, deslop, docs, CHECKLIST.md), run the `verify` skill again. Report only this last run.
13. Commit only if the user or AGENTS.md allows it, in small verified units (test with or before its code). Never push.
14. Report: what was built; a table of acceptance criteria, each with its test (tdd red/green line) and its real-surface run (command → output); the chosen shape and why; the final verify result; review verdict and how each finding was resolved; CHECKLIST rows changed and the *Count* output; principles applied; what is not done or not verified.
