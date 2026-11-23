# Playbook: review

**When**: the user asks to review a branch, a PR, a commit range, or work-in-progress changes.

**Start**: before step 1, create the task list from the steps below: one `TaskCreate` per step, verbatim. If `TaskCreate` is listed but not loaded, load it first with `ToolSearch` (`select:TaskCreate,TaskUpdate,TaskList`). A step that names a skill invokes it with the Skill tool, even when the change looks trivial.

The output is a review, not a fix. Change code only if the user asks.

1. Restate the goal: review `<range>` against `<spec or stated goal>`.
2. Pin the range with the `review` skill's caller steps. Bad ref or empty diff → stop and say so.
3. Find the spec (plan document, issue, PRD, acceptance criteria) and the author's evidence (verify report, test runs). Missing → note it; the review still runs.
4. Run the `verify` skill on the head revision so the reviewer has current evidence. If that would disturb the user's working tree, say so and skip instead.
5. Dispatch the review per the `review` skill: one fresh reviewer, or two in parallel (spec + correctness, standards + tests) for a large or risky diff. Wait for every verdict.
6. Read each finding against the code yourself. Drop a finding only with a stated reason; never drop a blocking one silently.
7. Report: the verdict; blocking findings, then should-fix, then nits, each with `file:line`; protected-file changes; evidence checked; findings you disagree with and why. With two reviewers, keep their reports side by side.
