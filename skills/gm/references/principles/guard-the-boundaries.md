# Guard the boundaries

**Apply when**: wiring validation, error handling, or adapters to frameworks, networks, files, or users.

**Do**
- Parse and validate external data once, at the system boundary, into internal types.
- Inside the boundary, trust the types; keep business logic pure.
- Handle errors on one path; translate external errors to internal ones at the edge.

**Not this**
- Defensive null checks deep inside business logic.
- Raw request objects passed through every layer.
