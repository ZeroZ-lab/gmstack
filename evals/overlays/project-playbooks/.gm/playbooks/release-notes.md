---
extends:
when: the user asks for release notes or a release announcement
---

# Playbook: release-notes

1. Read the CHANGELOG `Unreleased` section and `git log` since the last tag.
2. Draft the notes per the `unslop` skill: what changed for the user, one line per change.
3. Write the draft to `docs/release-notes/<version>.md`. Publish nothing.
