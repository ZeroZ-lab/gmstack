# gmstack

An evidence-first skill stack for AI-assisted software development, for Claude Code.

Tell `/gmstack:gm` what you want. It routes the task to a playbook, runs it step by step, and backs every "done" with verifiable evidence tracked in the repo's `CHECKLIST.md` — command + exit code + log path, CI link, file:line, or PR number.

## Skills

| Skill | What it does |
|---|---|
| `gm` | Entry point. Routes to a playbook; otherwise runs the default loop: goal → investigate → plan → change → verify → independent review → record → report |
| `init` | Creates or onboards a project under engineering checklist v1.2: tier (M/S/C), tags, skeleton, AGENTS.md, CHECKLIST.md, verify entry point, CI |
| `checklist` | Owns CHECKLIST.md: statuses, evidence format, staleness rechecks, audits |
| `verify` | Runs the project's single verify entry point and reports per-step PASS/FAIL/SKIPPED |
| `plan` | Designs a change before coding: trace, two shapes, data shapes, interfaces, acceptance criteria, test-first tasks |
| `tdd` | Seams first, then vertical slices: failing test → watch it fail for the right reason → minimal code → full suite green, with red/green evidence |
| `review` | Independent review by a fresh subagent: spec, correctness, tests, standards, protected files, and whether the claimed evidence holds |
| `deslop` | Removes AI code slop from the current diff before commit, behavior unchanged, verify after |
| `unslop` | Edits prose (reports, docs, PRs, commits; English and Chinese) to remove AI writing patterns |

Playbooks (in `skills/gm/playbooks/`): `feature`, `bug-fix`, `refactor`, `investigation`, `prototype`, `review`, `init`, `gate` (can we release?), `progress` (where are we, what's next?), `handoff` (pause and resume).

## Automatic routing

A SessionStart hook tells Claude to use `gm` for multi-file changes, design choices, bugs with unknown causes, reviews, refactors, investigations, prototypes, and pause/resume, so you can describe the task without naming a skill. In a repo with `CHECKLIST.md`, it also notes that the repo is managed by gmstack, and it lists any project playbooks (below) with their `when` lines.

It is on by default. To turn it off:

| Scope | How |
|---|---|
| One session | `GMSTACK_ROUTING=off claude` |
| One project | `mkdir -p .gmstack && echo off > .gmstack/routing` at the repo root |
| All projects | `mkdir -p ~/.config/gmstack && echo off > ~/.config/gmstack/routing` |

## Project playbooks

A project can change a bundled playbook or add its own in `.gm/playbooks/` (or, for one user across every repo, `~/.config/gmstack/playbooks/`). A change is anchored on a quoted run of the bundled step's own words:

```markdown
---
extends: feature
when: the change adds or changes a command-line flag
---

- **After** "Run the `verify` skill.": Add the flag's entry to `docs/flags.md`.
```

`gm` runs `skills/gm/scripts/check-playbooks.mjs` and reads the playbook through `--show <name>`, which prints it with every project change applied. When a gmstack upgrade rewords a step and an anchor no longer matches, the script fails and `gm` reports it instead of guessing. Format: [skills/gm/references/project-playbooks.md](skills/gm/references/project-playbooks.md). Run the check in CI to catch a broken anchor on upgrade.

Principles (in `skills/gm/references/principles/`): 12 short rules the playbooks cite — smallest change, data shape first, prove it works, fix root causes, and more.

## Install from GitHub

In Claude Code, add this repo as a plugin marketplace and install the plugin:

```text
/plugin marketplace add ZeroZ-lab/gmstack
/plugin install gmstack@gmstack
```

Restart Claude Code (or run `/reload-plugins`) so the skills and the SessionStart hook load. To upgrade later:

```text
/plugin marketplace update gmstack
```

Or from a shell, without opening Claude Code:

```bash
claude plugin marketplace add ZeroZ-lab/gmstack
```

```bash
claude plugin install gmstack@gmstack
```

It is also listed in the [gm-skills](https://github.com/ZeroZ-lab/gm-skills) marketplace: `/plugin marketplace add ZeroZ-lab/gm-skills`, then `/plugin install gmstack@gm-skills`.

## Try it locally

To run a checkout without installing it:

```bash
git clone https://github.com/ZeroZ-lab/gmstack.git
```

```bash
claude --plugin-dir /path/to/gmstack
```

Then, in a new or existing project:

```text
/gmstack:gm create a new project here
/gmstack:gm add a --json flag to the CLI
/gmstack:gm `calc 0.1 0.2` prints 0.30000000000000004
/gmstack:gm review the changes since main
/gmstack:gm can we release?
/gmstack:gm how far along are we?
```

## Develop

```bash
npm run validate
npm test
```

`validate` checks the manifest, skill frontmatter, every relative link, that `gm` lists every playbook and principle, checklist item IDs, the hook config, that every bundled playbook has numbered steps, and the eval suites' shape. `npm test` runs the unit tests for `check-playbooks.mjs`. CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs both on Node 20, 22, and 24, plus a syntax check of the hook scripts.

```bash
node scripts/eval-routing.mjs --fixture /path/to/a/gmstack-managed/project
```

Routing eval: runs each prompt in [evals/routing.json](evals/routing.json) through headless Claude Code with read-only tools and checks which skill and playbook it chose. Prompts never name a skill. Some cases add project playbooks from [evals/overlays/](evals/overlays/), including one with a broken anchor.

```bash
node scripts/eval-flow.mjs --fixture /path/to/a/gmstack-managed/git/repo
```

Flow eval: runs whole tasks from [evals/flow.json](evals/flow.json) on a throwaway copy of the fixture, with edits allowed, and checks one marker per playbook step (tdd invoked, verify run, a reviewer subagent spawned, CHECKLIST.md changed, no source file touched, and so on). Every playbook has at least one case; `init` starts from an empty repo, and the handoff cases plant uncommitted work or a saved note. It prints each case's completion rate. Slow: several minutes and real tokens per case. The agent runs with Bash on your machine, not in a sandbox, so run it where that is acceptable.

Design and roadmap: [docs/DESIGN.md](docs/DESIGN.md).

Split out from [gm-skills](https://github.com/ZeroZ-lab/gm-skills), where it started as `checklist-project-init`.
