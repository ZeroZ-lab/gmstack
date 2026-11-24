# Playbook: investigation

**When**: the user wants an answer, not a change — "why does X happen?", "how does Y work?", "where is Z decided?", "is this safe?", "what would it take to…?".

**Start**: before step 1, create the task list from the steps below: one `TaskCreate` per step, verbatim. If `TaskCreate` is listed but not loaded, load it first with `ToolSearch` (`select:TaskCreate,TaskUpdate,TaskList`). A step that names a skill invokes it with the Skill tool, even when the change looks trivial. A question gets the task list too: the steps below are how the answer earns its evidence labels, and step 5 is easy to drop without it.

The output is an answer backed by evidence. **No code changes.** Temporary probes (a scratch script, a debug run) are allowed outside the repo's tracked files and are removed afterwards.

1. Restate the question in one sentence, and what a complete answer looks like.
2. Gather evidence. Read the code paths involved; use `git log -p` / `git blame` for "why" questions; run the program or a probe to observe actual behavior. Route wide searches to subagents and keep only their summaries (see [guard-the-context](../references/principles/guard-the-context.md)).
3. Form the answer. Where competing explanations exist, list them and check each against the evidence until one survives.
4. Label every claim: **measured** (you ran or read it — cite command output or `file:line`), **inferred** (follows from measured facts — say from which), or **guess** (say what would confirm it).
5. Clean up probes: delete scratch files; confirm `git status` shows nothing new from you.
6. Report: the answer first, in one or two sentences; then the evidence, claim by claim with labels; then open questions and what would settle them. If the investigation found a defect or a risk, name it and suggest the playbook to handle it (bug-fix, refactor) — do not start it unasked.
