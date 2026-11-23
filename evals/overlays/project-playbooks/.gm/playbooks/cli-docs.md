---
extends: feature
when: the change adds or changes a command-line flag
---

- **After** "Run the `verify` skill.": Add or update the flag's entry in `docs/flags.md`: one line with the flag, what it does, and an example. Create the file if it is missing.
