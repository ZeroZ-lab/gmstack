# Playbook: gate

**When**: the user asks whether the project can be released, is ready to ship, or wants a pre-release check.

**Start**: before step 1, create the task list from the steps below: one `TaskCreate` per step, verbatim. If `TaskCreate` is listed but not loaded, load it first with `ToolSearch` (`select:TaskCreate,TaskUpdate,TaskList`). A step that names a skill invokes it with the Skill tool, even when the change looks trivial.

The answer is **releasable** or **not releasable**, with the blockers. There is no "mostly releasable".

1. Restate the goal: decide whether `<project>` at `<commit>` can be released.
2. Read CHECKLIST.md. Missing → the answer is **not releasable: no CHECKLIST.md**; offer the init playbook and stop.
3. Run the `verify` skill. Keep the exit code and log path; GATE-03 depends on it.
4. Recheck every stale PASS row via the `checklist` skill's *Recheck* operation.
5. Check that no protected verification file changed since the last release (or the first commit, if none) without recorded approval: `git log --format='%h %cs %s' <base>..HEAD -- <verify entry> <CI config> <lint/test/coverage config> CODEOWNERS`. List each change and whether its approval is on record. An unapproved loosening fails GATE-03.
   - **No baseline** (not a git repo, or no commits yet) → this check is **BLOCKED: no baseline commit**, never passed. Absence of history proves nothing, so GATE-03 cannot be PASS until a baseline commit exists.
6. Evaluate each GATE row against fresh evidence. Write the evidence for each; a row without fresh evidence is not PASS.
7. Independent review: spawn a fresh subagent with the goal, CHECKLIST.md, the verify log path, and your gate verdicts. Ask it to try to refute each PASS on a **blocking** gate item from the evidence alone. Any refuted item is not PASS.
8. Update CHECKLIST.md: GATE rows and any rows changed in step 4. Then run the `checklist` skill's *Count* script; its release verdict must agree with yours. If they disagree, find out why before reporting.
9. Report:
   - Verdict: **releasable** or **not releasable**, with the script's status counts
   - Blocking gate items not PASS, each with the reason and what would clear it
   - Non-blocking gate items not PASS
   - verify summary
   - Protected-file changes found in step 5
   - Independent review verdict
