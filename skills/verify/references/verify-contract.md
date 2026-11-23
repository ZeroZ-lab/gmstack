# Verify entry-point contract

Every gmstack project has exactly one verify entry point that local runs and CI both call. This file defines what it must do. `init` generates an entry point that meets it; `verify` checks and runs it.

## Location

One of, in order of preference for the stack:

- `scripts/verify.sh` (plus `scripts/verify.ps1` when Windows is supported)
- a `verify` target in `Makefile` or `justfile`
- a `verify` script in `package.json`

The project's AGENTS.md names which one.

## Steps

Run these steps in this order: `format` → `lint` → `typecheck` → `build` → `test` → `arch` → `secret-scan`.

- **Run every step.** Do not stop at the first failure (no `set -e` across steps). Each step's result is recorded.
- `format` checks only (e.g. `prettier --check`, `ruff format --check`); it never rewrites files.
- `build` runs the project's real build with its real config (e.g. `npm run build`, `cargo build`, `go build ./...`). A passing `typecheck` does not prove the build works: the two often use different configs. A project with nothing to build prints `SKIPPED (no build)`.
- A step not enabled at the project's tier (e.g. `arch` at tier M) prints `SKIPPED (not enabled)` and does not count as a failure.
- A step whose tool is missing is **FAIL**, not SKIPPED. A missing tool is a broken setup, not an opt-out.

## Output

1. Each step's full output is appended to `reports/verify-<UTC timestamp>.log` (`reports/` is git-ignored).
2. At the end, print a summary table:

```
| Step        | Result  | Exit | Time  |
|-------------|---------|------|-------|
| format      | PASS    | 0    | 1.2s  |
| lint        | FAIL    | 1    | 3.4s  |
| typecheck   | PASS    | 0    | 5.0s  |
| build       | PASS    | 0    | 4.2s  |
| test        | PASS    | 0    | 8.1s  |
| arch        | SKIPPED | -    | -     |
| secret-scan | PASS    | 0    | 0.9s  |
Log: reports/verify-20261123T101500Z.log
```

3. Exit code: non-zero if any step FAILed, zero otherwise.

## Reference implementation (POSIX sh)

Adapt the commands per stack; keep the structure.

```sh
#!/bin/sh
# Verify entry point — see AGENTS.md. Protected file: changes need human approval.
set -u
cd "$(dirname "$0")/.."
mkdir -p reports
ts=$(date -u +%Y%m%dT%H%M%SZ)
log="reports/verify-$ts.log"
summary=""
failed=0

run_step() { # name, command...
  name=$1; shift
  start=$(date +%s)
  printf '\n===== %s: %s\n' "$name" "$*" >>"$log"
  if "$@" >>"$log" 2>&1; then res=PASS; code=0; else code=$?; res=FAIL; failed=1; fi
  dur=$(( $(date +%s) - start ))
  summary="$summary| $name | $res | $code | ${dur}s |\n"
}

skip_step() { # name
  printf '\n===== %s: SKIPPED (not enabled)\n' "$1" >>"$log"
  summary="$summary| $1 | SKIPPED | - | - |\n"
}

run_step format      npx prettier --check .
run_step lint        npx eslint .
run_step typecheck   npx tsc --noEmit
run_step build       npm run build
run_step test        npx vitest run
skip_step arch
run_step secret-scan gitleaks detect --no-banner --redact

printf '| Step | Result | Exit | Time |\n|---|---|---|---|\n'
printf "$summary"
printf 'Log: %s\n' "$log"
exit $failed
```

## Default tools by stack

| Stack | Format / Lint | Types | Tests | Architecture |
|---|---|---|---|---|
| TypeScript | Prettier + ESLint (or Biome) | `tsc --noEmit` | Vitest / Playwright | dependency-cruiser |
| Python | Ruff | mypy / pyright | pytest | import-linter |
| Go | gofmt + golangci-lint | `go vet` | `go test` | golangci-lint depguard |
| Java/Kotlin | Spotless + Checkstyle/Detekt | compiler | JUnit | ArchUnit |
| Rust | rustfmt + clippy | `cargo check` | `cargo test` | module visibility + custom checks |

Secret scanning is `gitleaks` in both pre-commit and CI, because pre-commit can be bypassed with `--no-verify`.

## CI

- CI calls the same entry point. Failure blocks merge; branch protection must be turned on by a human, so remind the user.
- GitHub Actions: top-level `permissions: contents: read`; third-party Actions pinned to a full commit SHA.
- Upload `reports/` as a build artifact so results are retained.
