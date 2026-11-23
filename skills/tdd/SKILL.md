---
name: tdd
description: Test-driven development for features and bug fixes — agree the seams, then loop one vertical slice at a time (failing test, watch it fail for the right reason, minimal code, watch it pass), keeping the red and green runs as evidence. Use when building a feature or fixing a bug test-first, when the user mentions TDD, red-green, or a regression test, or when a gmstack playbook reaches its implement step.
---

# TDD

**If you did not watch the test fail, you do not know that it tests anything.** This skill turns that into evidence: every test you add comes with a recorded red run and a recorded green run.

Read [references/good-tests.md](references/good-tests.md) before writing or changing a test.

## When it applies

- **Always** for a behavior change — feature, bug fix, changed rule — when a correct seam exists (see *Seams*).
- **Not** for throwaway prototypes, generated code, pure config, or docs.
- **No correct seam** → that is a finding, not a license to skip verification. Use the closest executable check (a script, a CLI run diffed against a known-good output, a curl, a browser script), record why no test seam exists, and log it as a risk. A bad test is worse than no test: never write one just to tick the box.

## Seams

A seam is the public boundary where you observe behavior without reaching inside: a function's signature, a CLI's arguments and output, an HTTP endpoint, a UI as a user drives it.

Before the first test, write down the seams you will test and, for each, one line on what it catches and what it misses. If the user is around, show them the list; if not, proceed with it and include it in the report. Spend tests on critical paths and tricky logic, not on every getter.

A **correct** seam reproduces the real pattern as it happens at the call site. If the only reachable seam is too shallow (a unit test cannot recreate the chain that triggered a bug), a test there gives false confidence: use a deeper seam or an executable check.

## The loop

Work in **vertical slices**: one seam, one test, one minimal implementation per cycle. Never write all the tests first — bulk tests encode imagined behavior. Each slice is a tracer bullet; let what it teaches shape the next.

For each slice:

1. **Red — write one failing test.** One behavior, a name that states it, expected values from an independent source (the spec, a worked example, a literal), real code rather than mocks.
2. **Watch it fail — for the right reason.** Run just that test. Quote the failure *content*, not just "FAIL": it must be the predicted mismatch (expected `X`, got `Y`), not an import error, a typo, or a crash elsewhere.
   - It passes → you are testing existing behavior, or the test is wrong. Fix the test.
   - It errors → fix the error and rerun until it fails correctly.
3. **Green — write the least code that passes.** No options, no extra branches, no "while I'm here".
4. **Watch it pass.** Rerun the test. Then run the project's **full** test suite — a green single test is not a green suite. Any failure, including one you did not cause, goes in the report by name.
5. **Next slice.**

Refactoring is not part of the loop. Do it after the slices are green, with the suite as the safety net, and keep behavior unchanged.

## Code written before its test

If implementation code already exists for behavior that has no test (yours or someone else's), the test you add now proves nothing until you have seen it fail. Prove it:

1. Write the test against the current code; it passes.
2. Temporarily revert or stash the implementation (or break the specific line the test targets).
3. Run the test; it must fail with the predicted mismatch. Quote it.
4. Restore the implementation; the test passes again. Confirm with `git diff` that the restore is exact.

## Bug fixes

The regression test is the bug's minimal reproduction, turned into a test at a correct seam. Its red run must show the **user's exact symptom**. Where the project commits as it goes, the failing test lands before or with the fix — never after it.

## Rules

- Never change a test to match a wrong implementation.
- Never weaken an existing assertion unless the expected behavior genuinely changed, and say why. Deleting or skipping a test is a protected change (see the `verify` skill).
- Mock only at system boundaries: external APIs, time, randomness, sometimes the database or filesystem. Never mock your own modules.
- Flaky tests are bugs: pin time, seed randomness, isolate the filesystem.

## Rationalizations to refuse

| Thought | Reality |
|---|---|
| "Too simple to test" | Simple code breaks; the test takes a minute. |
| "I'll add tests after" | A test written after passes immediately and proves nothing. Use *Code written before its test*. |
| "I already tried it by hand" | A manual run leaves no rerunnable record. |
| "This test is hard to write" | Hard to test usually means hard to use: revisit the interface. |
| "The suite is slow, I'll run just mine" | Run the full suite before calling the slice done. |

## Evidence to report

For each test added:

```
<test name> · red: <command> → "<quoted failure>" · green: <command> → pass
```

Plus the full-suite run (command, exit code, counts) and, where no test seam existed, the executable check used instead and why.
