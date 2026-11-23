# Model the domain

**Apply when**: writing stateful logic, code that branches a lot, or the same shape assumption repeated across files.

**Do**
- Encode the domain in a structure: a state machine, a typed model, a lookup table or registry, a reducer.
- Put transitions in one place so an illegal transition is impossible or fails loudly.

**Not this**
- The same `if status == ... && flag ...` scattered across modules.
- Booleans that together encode a state (`isLoading && !isError && hasData`).
