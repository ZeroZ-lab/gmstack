# Playbook: init

**When**: creating a new project, or bringing an existing repo under gmstack.

**Start**: before step 1, create the task list from the steps below: one `TaskCreate` per step, verbatim. If `TaskCreate` is listed but not loaded, load it first with `ToolSearch` (`select:TaskCreate,TaskUpdate,TaskList`). A step that names a skill invokes it with the Skill tool, even when the change looks trivial.

1. Restate the goal: project name, what it is for, new or onboard.
2. Run the `init` skill's Step 0 (mode) and Step 1 (collect). Ask all questions in one batch.
3. Run the `init` skill's Step 2 (skeleton). In onboard mode, list existing files that were left untouched.
4. Run the `init` skill's Step 3 (CHECKLIST.md).
5. Run the `verify` skill. Record the real result; do not retry by loosening anything.
6. Update CHECKLIST.md from the verify result via the `checklist` skill.
7. Independent review: spawn a fresh subagent with the goal and the repo path. Ask it to check that (a) no CHECKLIST row is PASS without evidence in the required format, (b) no template file is marked PASS, (c) every enabled item matches the tier and tags, (d) `.gitignore` covers `.env` and `reports/`, (e) nothing contains a real secret. Fix what it finds.
8. Run gitleaks. Ask the user before the initial commit. Never push.
9. Report per the `init` skill's Step 4 list.
