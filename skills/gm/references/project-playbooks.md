# Project playbooks

A project can change gmstack's bundled playbooks or add its own, without forking the plugin.

## Where they live

| Folder | Applies to |
|---|---|
| `.gm/playbooks/` at the repo root | this repository (commit it) |
| `~/.config/gmstack/playbooks/` (or `$XDG_CONFIG_HOME/gmstack/playbooks/`) | every repository, for one user |

One Markdown file per playbook. The file name, minus `.md`, is the playbook's name. When both folders change the same bundled playbook, the user folder's changes come first, then the project's. A standalone playbook in the project folder shadows a user one of the same name.

## Frontmatter

```markdown
---
extends: feature, bug-fix
when: the change touches the public CLI's flags or output
---
```

- `extends` — the bundled playbooks this one changes, comma-separated. Leave it empty (`extends:`) for a standalone playbook.
- `when` — one sentence naming the requests it serves. A change from a playbook whose `when` does not fit the task is kept in the task list as `skip: when does not apply`.

## Changing a bundled playbook

The body is a list of changes. Each starts with a verb in bold and a quoted run of the bundled step's own words, then the new text:

```markdown
- **Before** "Investigate: read the code": Read `docs/cli.md` for the current flag style.
- **After** "Run the `verify` skill.": Regenerate `docs/cli.md` with `npm run docs`.
- **In** "Update docs the feature changes": also add a runnable example under `examples/`.
- **Replace** "Commit only if the user": Commit with a `Signed-off-by` trailer, only if the user allows it.
```

| Verb | Effect |
|---|---|
| `Before` | inserts a new step before the anchored step |
| `After` | inserts a new step after it |
| `In` | appends a sub-item to it |
| `Replace` | replaces its text |

Rules:

- The quote must be a substring of exactly one step of each playbook it extends. Quote enough words to name one step; whitespace is normalized.
- Continue a change on indented lines.
- Bundled steps keep their numbers; an inserted step takes the previous number plus a letter (`6a`), so cross-references like "the step-6 run" stay true.
- Numbered steps in an extending playbook are not applied. Write each as a `Before` or `After` change.
- Two playbooks may not `Replace` the same step.
- Replacing a step that runs `verify`, `review`, `tdd`, or records evidence prints a note. The non-negotiables in `gm` still apply to whatever replaces it. A project playbook changes steps; it never lifts a non-negotiable.

## A standalone playbook

`extends:` empty, then numbered steps, as in a bundled playbook:

```markdown
---
extends:
when: the user asks for release notes
---

# Playbook: release-notes

1. Read the CHANGELOG `Unreleased` section and the commits since the last tag.
2. Draft the notes per the `unslop` skill.
3. Show the draft; publish nothing without the user's yes.
```

Its name must differ from every bundled playbook. To change a bundled one, extend it instead.

## Checking

From the repo root:

```
node <gmstack>/skills/gm/scripts/check-playbooks.mjs              # check and list
node <gmstack>/skills/gm/scripts/check-playbooks.mjs --show feature  # print feature with changes applied
```

Exit 0 means every change is anchored. Exit 1 prints `problem:` lines and resolves nothing. That happens when a playbook extends one this gmstack version lacks, or quotes step text a gmstack upgrade has reworded. Re-anchor the change on the current wording; `gm` never guesses where an unanchored change belongs. Exit 2 is a usage error.

Run the check in CI to catch a broken anchor when you upgrade gmstack.
