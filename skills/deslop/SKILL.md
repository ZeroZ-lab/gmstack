---
name: deslop
description: Remove AI code slop from the current change before commit (narrating comments, defensive checks for impossible states, swallowed errors, type-dodging casts, speculative options, debug leftovers) without changing behavior, then rerun verify. Use before committing, when asked to clean up or deslop a diff, or when a gmstack playbook reaches its pre-commit step.
---

# Deslop

Clean the **current change** so it reads like the rest of the codebase. Behavior stays the same; verify proves it.

## Scope

The diff of this change only: `git diff <base>...HEAD` plus uncommitted work (`git diff HEAD`). The base is the PR's base branch, else the branch this one was cut from, else the default branch. Never edit lines outside the diff, even if they are sloppy — mention them instead.

A small diff still gets the pass. "Nothing to clean" is this skill's verdict, reached by reading every changed hunk against the table below; it is not a reason to skip running it.

## What to remove or fix

| Slop | Fix |
|---|---|
| Comments that narrate the code (`// increment i`, `// call the API`), restate the function name, or address the reader ("Here we…") | Delete. Keep comments that say *why*: a constraint, a non-obvious decision, a link to an issue. |
| Comments inconsistent with the file's style (JSDoc on every private helper in a file that has none) | Match the file. |
| Defensive checks for states the types or callers already rule out (`if (!user) return` right after a non-null lookup) | Delete. Validation belongs at the boundary. |
| `try/catch` that swallows, logs-and-continues, or rethrows unchanged | Delete, or handle on the project's one error path. |
| Casts that only silence the type checker (`as any`, `as unknown as T`, `!` on values that can be null, `# type: ignore`) | Fix the type. If it cannot be fixed in scope, keep it and report it. |
| Options, parameters, or wrappers with no current caller; abstractions with one implementation | Inline or delete. |
| Deep nesting | Early returns. |
| Debug output (`console.log`, `print`, tagged `[DBG-…]` lines), commented-out code, TODOs with no owner | Delete. A real TODO gets an owner: `TODO(<owner>): <task>`. |
| Names that are longer or vaguer than the file's convention (`processDataHandlerManager`) | Rename to match neighbors. |
| Duplicated logic introduced by the change | Extract once, if a second real caller exists in the diff. |

## Rules

1. **Behavior unchanged.** If a "cleanup" would change behavior, it is a fix, not deslop: leave it and report it, unless it is a clear bug you can prove with a test.
2. **Small edits.** No rewrites, no reformatting beyond what the formatter would do.
3. **Protected files are off-limits.** Lint, test, and coverage config, ignore files, the verify entry point, and CI stay untouched (see the `verify` skill).
4. **Verify after.** Run the `verify` skill. If anything that passed before now fails, revert the edit that broke it.

## Report

One or two sentences: what kinds of slop were removed and how many edits, the verify result, and any slop left in place with the reason (outside the diff, or a type that cannot be fixed in scope).

When nothing needed removing, the report is still one line: `deslop: <N> files, <M> hunks checked; nothing to clean`. That line is the evidence the step ran.
