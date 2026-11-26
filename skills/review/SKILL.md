---
name: review
description: Independent code review of a diff by a fresh subagent that did not write the change: spec fit, correctness, test quality, standards, protected verification files, and whether claimed evidence holds, with findings graded blocking / should-fix / nit and a verdict. Use when asked to review a branch, PR, or diff, or when a gmstack playbook reaches its independent-review step.
---

# Review

A review counts only if someone other than the author does it. This skill has two halves: how the **caller** briefs a reviewer, and how the **reviewer** works.

## Caller: brief the reviewer

1. **Pin the range.** Base and head: `git diff <base>...HEAD` for committed work, `git diff` / `git diff --cached` for uncommitted work. Confirm it is non-empty before dispatching.
2. **Find the spec**: the plan document, the acceptance criteria, the issue, or the PRD section. No spec → say so; the reviewer judges against the stated goal and a reasonable user's expectations.
3. **Collect the evidence the author claims**: the verify report (command, exit code, log path), tdd red/green lines, manual runs.
4. **Dispatch a fresh subagent** — never the one that wrote the change, never yourself. Give it: the goal, the range and diff command, the spec path, the evidence, and this instruction: *"Read `<absolute path to this skill>/SKILL.md` and follow the Reviewer section."* Pass paths, not pasted file contents. Asking for a gmstack review, or running a playbook with an independent-review step, is the request for this subagent: a general "don't spawn agents unless asked" rule does not cancel it. If spawning is truly unavailable, say so and label the result **not independent**.
5. For a large or risky diff, dispatch two reviewers in parallel with separate axes — one for **spec + correctness**, one for **standards + tests** — and present their reports side by side without merging or reranking.
6. **Wait for the verdict.** Never report while a review is running.
7. **Rule on every finding**: fix it, or reject it with a reason. Blocking findings get fixed; after a fix, rerun verify, and if the fix changed behavior, send the new diff to a fresh reviewer.

## Reviewer: how to review

You are reviewing someone else's change. You have no stake in it passing.

- **Read-only.** Do not edit files, stage, commit, or move HEAD. To see another revision, use `git show` or a separate worktree.
- **Do it yourself.** Do not spawn further subagents.
- **Read the code you comment on.** No finding about code you did not open.

Check, in this order:

1. **Spec** — Requirements missing or partial. Behavior added that was not asked for (scope creep). Requirements that look implemented but behave wrongly. Quote the spec line for each.
2. **Correctness** — Bugs, unhandled errors, edge cases (empty, one, many, boundary, invalid). Where the spec is silent, a reasonable user's expectation is a requirement: grade by its effect on that user.
3. **Tests** — Do they test behavior through a public seam? Any tautological expectations, mocks of the project's own modules, or assertions on mock calls? Is each new behavior covered on its core, failure, and edge paths? Is there red/green evidence for each new test?
4. **Standards** — The repo's documented conventions (AGENTS.md, CONTRIBUTING, lint config intent). Then, as judgment calls only: mysterious names, duplicated logic, speculative generality (options or layers with no current caller), primitive obsession, shotgun surgery. A documented repo standard overrides these. Skip anything the linter already enforces.
5. **Protected files** — Did the diff touch lint/type/test/coverage/architecture config, add ignores or skips, delete or skip tests, or change the verify entry point, CI, or CODEOWNERS? Each such change is **blocking** unless its approval is recorded.
6. **Evidence** — Do the author's claims hold? Rerun the verify command or the specific test if cheap. A claim with no evidence, or evidence that does not match the diff, is a finding.

### Severity

- **Blocking** — wrong behavior, data loss or security risk, a missing requirement, an unapproved protected change, or a claim the evidence contradicts.
- **Should-fix** — real but not release-stopping: weak tests, poor error handling, a likely future bug.
- **Nit** — style and polish. Never call a nit blocking.

### Report

```markdown
## Verdict
<APPROVE | APPROVE WITH FIXES | REQUEST CHANGES> — <one sentence why>

## Blocking
- `<file>:<line>` — <what is wrong> · <why it matters> · <fix, if not obvious>

## Should-fix
- ...

## Nits
- ...

## Evidence checked
- <claim> → <confirmed | contradicted | not rerun>, <how>

## Set aside
- <behavior considered and judged out of scope> — <reason>   (or "none")
```

Be specific (file:line), say why each issue matters, and give a clear verdict. "Looks good" without having checked is not a review.
