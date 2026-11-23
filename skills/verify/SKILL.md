---
name: verify
description: Run a project's verify entry point (format, lint, typecheck, build, test, arch, secret-scan), report a per-step PASS/FAIL/SKIPPED table with exit codes and the log path, and check the entry point against the gmstack verify contract. Use after any code change, before claiming work is done, when the user asks to run checks or verify, or when a gmstack playbook reaches its verify step.
---

# Verify

Verification is the evidence every gmstack result rests on. This skill runs the project's single verify entry point and reports exactly what happened. The contract the entry point must meet is in [references/verify-contract.md](references/verify-contract.md).

## Rules

1. **Report what ran, as it ran.** Never summarize a FAIL as "mostly passing". Never report a step you did not run. If the environment prevents a run, say which steps did not run and why.
2. **The verification system is protected.** Without explicit human approval, do not:
   - change lint, type-check, test, coverage, or architecture rule config
   - add ignore / skip / disable entries
   - delete or skip tests
   - change the verify entry point, CI config, or CODEOWNERS

   Never loosen a rule to make verify pass. If a fix seems to need one of these, stop and ask.
3. **A missing tool is a FAIL**, not a skip.

## Steps

1. **Find the entry point.** Read AGENTS.md for the named command. Otherwise look, in order, for `scripts/verify.sh`, a `verify` target in `Makefile`/`justfile`, or a `verify` script in `package.json`.
   - None found → report `BLOCKED: no verify entry point`. In a gmstack project, propose generating one per the contract (that is a change to a protected file, so it needs approval).
2. **Install dependencies** if they are missing (lockfile-respecting install: `npm ci`, `uv sync`, etc.).
3. **Run it** from the repo root. Capture the exit code and the log path it prints. Do not pipe the command through `tail`, `head`, or `tee`: a pipe replaces the entry point's exit code with the last command's. If you must pipe, use `set -o pipefail` or record `$?` from a separate run.
4. **Check the contract** when anything looks off: every step present and in order, no early exit, summary table printed, log written under `reports/`, non-zero exit on any FAIL. List each deviation.
5. **Report** using the format below.
6. **Hand evidence to the checklist** when the repo has a CHECKLIST.md: CI-02, AGT-03, and the items the steps cover (DEV-02, DEV-03, DEV-06, QA-01…) may change status. Use the `checklist` skill's evidence format.

## Report format

```
verify: <command> · exit=<N> · <log path>

| Step | Result | Exit | Time |
|---|---|---|---|
...

Failures:
- <step>: <one-line cause, quoted from the log>  (log line ~N)

Not run: <steps and why, or "none">
Contract deviations: <list, or "none">
```

When a step fails, read the relevant part of the log and quote the first real error, not the last line of noise.
