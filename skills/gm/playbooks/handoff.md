# Playbook: handoff

**When**: pausing work for later or for someone else ("let's stop here", "hand this off", "I'll continue tomorrow"), or picking work back up ("continue where we left off", "resume").

The handoff note lives in `.gm/trail/<task-slug>.md`. `.gm/trail/` is git-ignored: notes are local working state, not project history.

## Pause

1. Bring the work to a safe point: no half-applied edit, nothing running in the background. If verify is red, leave it red and say so — do not hide it.
2. Run the `verify` skill so the note records the real current state.
3. Write `.gm/trail/<task-slug>.md`:

```markdown
# <task>

- Paused: <YYYY-MM-DD HH:MM UTC> · Branch: <branch> @ <short commit>
- Uncommitted: <git status --short summary, or "none">

## Goal
<one sentence> · Playbook: <name>, at step <n>

## Done (with evidence)
- <item> — <evidence>

## Not done
- <item> — <why / what blocks it>

## Current state
verify: <command> · exit=<N> · <log path> · <failing steps, if any>

## Next steps
1. <the very next action, concrete enough to start without rereading the conversation>

## Open decisions (need the user)
- <question> — options: <a / b>

## Don't forget
<gotchas, assumptions made, things that looked wrong but were left alone>
```

4. Make sure `.gm/trail/` is in `.gitignore`; add it if missing.
5. Report the note's path and its *Next steps* and *Open decisions*.

## Resume

1. List `.gm/trail/`; pick the note the user means, or the most recent.
2. Read it, then **check it against reality**: `git status`, current branch and commit, and a fresh `verify` run. The note is a claim; the repo is the fact. Report any drift (new commits, changed files, a different verify result).
3. Restate the goal and continue from the note's playbook step, copying the remaining steps into the task list.
4. When the task is done, delete the note or mark it `Status: done` at the top.
