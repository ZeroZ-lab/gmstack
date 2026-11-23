# Playbook: bug-fix

**When**: something is broken, throwing, wrong, or failing, and the cause is not yet proven.

Every line that ships traces to evidence. A change that "might help" is a hypothesis, not a fix; if evidence refutes it, revert it.

1. Restate the goal: the symptom (what happens), the expected behavior, and where it was seen.
2. **Build a feedback loop**: one command that drives the real bug path and asserts the user's exact symptom — a failing test, a CLI run diffed against expected output, a curl, a browser script. Run it and record the command and its red output. No red-capable command → do not start hypothesizing; try harder (fixture input, replayed payload, throwaway harness, more repetitions for flaky bugs), and if it is truly impossible, say what you tried and ask for access or a captured artifact.
3. **Minimize**: cut inputs, steps, and config one at a time, rerunning the loop each time, until every remaining element is needed to go red.
4. **Hypothesize**: write 3–5 ranked, falsifiable hypotheses ("if X is the cause, changing Y makes it disappear"). Test them one variable at a time, cheapest split first. Tag any temporary debug output with a unique prefix (e.g. `[DBG-7f3a]`) so it can be removed by one search. Two failed fixes on the same assumption → read [attack-the-premise](../references/principles/attack-the-premise.md).
5. **Confirm the root cause** with runtime evidence, and trace it to the first place the system went wrong (see [fix-root-causes](../references/principles/fix-root-causes.md)). If the fix would change an interface, schema, ownership, or a security or concurrency guarantee, run the `plan` skill first.
6. **Regression test** with the `tdd` skill: turn the minimized repro into a test at a correct seam; its red run must show the user's symptom. No correct seam → record that as a finding and keep the step-2 loop as the regression check.
7. **Fix**: the smallest change the evidence justifies.
8. Rerun the regression test and the original, un-minimized step-2 loop: both green. Then run the `verify` skill.
9. Clean up: remove every tagged debug line (search for the prefix) and any throwaway harness.
10. Independent review with the `review` skill, giving the reviewer the symptom, the root cause, and the before/after evidence.
11. Fix blocking findings; rerun verify; send behavior-changing fixes to a fresh reviewer.
12. Record: update affected CHECKLIST.md rows (QA-02 and others) with the `checklist` skill and run its *Count* script; add an open risk if no correct test seam existed; add a CHANGELOG `Unreleased` entry.
13. Run the `deslop` skill on the diff. Then the final verify: if any file changed since the step-8 run (fixes, deslop, docs, CHECKLIST.md), run the `verify` skill again. Report only this last run.
14. Commit only if the user or AGENTS.md allows it, the regression test with or before the fix. Never push.
15. Report: what was broken; the root cause and the evidence for it; the fix; the red output before and the green output after (trimmed to the assertion and counts), as tdd evidence lines; the final verify result; review verdict; CHECKLIST rows changed and the *Count* output; principles applied; what is not verified.
