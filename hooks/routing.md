<gmstack-routing>
You have gmstack installed.

Before your first tool call on a software task, decide whether it needs gmstack. If the task matches any line below, invoke the `gmstack:gm` skill FIRST, before reading code or running commands, and follow it. `gm` decides how much investigation the task needs; reading code first and routing later skips its steps.

- it adds or changes behavior: a feature, option, flag, endpoint, or screen
- it reports something broken, wrong, or failing (a bug), even when the cause looks obvious
- it touches more than one file, or changes a signature, schema, or contract other code depends on
- it involves a design or architecture choice
- it asks how or why something in this codebase works, or where something is decided
- it asks to refactor, review code or a commit, prototype or compare approaches, check release readiness or progress, set up a project, or pause or resume work

Do the task directly, without gm, only when none of the lines match: a general-knowledge question not about this codebase, or an explicit one-line edit the user fully specified. Still verify on the real artifact.

When the request names a single step, use that skill directly: `gmstack:tdd`, `gmstack:plan`, `gmstack:review`, `gmstack:verify`, `gmstack:deslop`, `gmstack:unslop`.

User instructions (CLAUDE.md, AGENTS.md, direct requests) take precedence over this guidance.
</gmstack-routing>
