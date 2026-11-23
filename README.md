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

A SessionStart hook tells Claude to use `gm` for multi-file changes, design choices, bugs with unknown causes, reviews, refactors, investigations, prototypes, and pause/resume, so you can describe the task without naming a skill. In a repo with `CHECKLIST.md`, it also notes that the repo is managed by gmstack.

It is on by default. To turn it off:

| Scope | How |
|---|---|
| One session | `GMSTACK_ROUTING=off claude` |
| One project | `mkdir -p .gmstack && echo off > .gmstack/routing` at the repo root |
| All projects | `mkdir -p ~/.config/gmstack && echo off > ~/.config/gmstack/routing` |

Principles (in `skills/gm/references/principles/`): 12 short rules the playbooks cite — smallest change, data shape first, prove it works, fix root causes, and more.

## Try it locally

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
```

Checks the manifest, skill frontmatter, every relative link, that `gm` lists every playbook and principle, checklist item IDs, and the hook config.

```bash
node scripts/eval-routing.mjs --fixture /path/to/a/gmstack-managed/project
```

Routing eval: runs each prompt in [evals/routing.json](evals/routing.json) through headless Claude Code in plan mode and checks which skill and playbook it chose. Prompts never name a skill.

Design and roadmap: [docs/DESIGN.md](docs/DESIGN.md).

Split out from [gm-skills](https://github.com/ZeroZ-lab/gm-skills), where it started as `checklist-project-init`.
