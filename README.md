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

Playbooks (in `skills/gm/playbooks/`): `init`, `gate` (can we release?), `progress` (where are we, what's next?).

Principles (in `skills/gm/references/principles/`): 12 short rules the playbooks cite — smallest change, data shape first, prove it works, fix root causes, and more.

## Try it locally

```bash
claude --plugin-dir /path/to/gmstack
```

Then, in a new or existing project:

```text
/gmstack:gm create a new project here
/gmstack:gm can we release?
/gmstack:gm how far along are we?
```

## Develop

```bash
npm run validate
```

Checks the manifest, skill frontmatter, every relative link, that `gm` lists every playbook and principle, and checklist item IDs.

Design and roadmap: [docs/DESIGN.md](docs/DESIGN.md).

Split out from [gm-skills](https://github.com/ZeroZ-lab/gm-skills), where it started as `checklist-project-init`.
