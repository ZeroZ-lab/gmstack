# Principles

Twelve short rules the playbooks cite. Read a principle in full before applying it.

| Principle | Apply when |
|---|---|
| [Attack the premise](#attack-the-premise) | two fixes sharing one assumption have failed |
| [Data shape first](#data-shape-first) | before writing logic |
| [Fix root causes](#fix-root-causes) | debugging |
| [Guard the boundaries](#guard-the-boundaries) | validation, error handling, adapters |
| [Guard the context window](#guard-the-context-window) | large outputs, long files, fan-out reads |
| [Idempotent operations](#idempotent-operations) | commands, setup steps, loops that may rerun |
| [Model the domain](#model-the-domain) | stateful or heavily branching logic |
| [Prove it works](#prove-it-works) | before declaring anything done |
| [Smallest change](#smallest-change) | sizing a diff; tempted to add layers or abstractions |
| [Subtract before adding](#subtract-before-adding) | sequencing an addition, refactor, or rewrite |
| [Test behavior, not implementation](#test-behavior-not-implementation) | writing, changing, or keeping a test |
| [Verifiable units](#verifiable-units) | multi-step work, stacking commits or PRs |

## Attack the premise
**Apply when**: two or more fixes that rest on the same assumption have failed.

**Do**
- Stop fixing. Write the shared assumption down in one sentence.
- Test that assumption directly with the cheapest experiment that could disprove it.
- Only then write the next fix, on whatever the experiment showed.

**Not this**
- A third variation of the same fix.
- Adding retries or sleeps to hide a cause you have not found.

## Data shape first
**Apply when**: before writing logic.

**Do**
- Write down the core types and data structures first: what is stored, what flows between modules, what concurrent actors share.
- Settle the shape, then write the functions that move it.
- Make illegal states unrepresentable where the language allows (tagged unions, branded IDs, non-optional required fields).

**Not this**
- Starting with control flow and discovering the data model halfway through.
- A bag of optional fields where only some combinations are valid.

## Fix root causes
**Apply when**: debugging.

**Do**
- Trace each symptom back to the first place the system went wrong, and fix it there.
- Add a guard only when the state it handles is legitimate input, not to suppress a bug upstream.
- Keep the reproduction as a regression test.

**Not this**
- Catching and ignoring the exception where it surfaces.
- Special-casing the one input from the bug report.

## Guard the boundaries
**Apply when**: wiring validation, error handling, or adapters to frameworks, networks, files, or users.

**Do**
- Parse and validate external data once, at the system boundary, into internal types.
- Inside the boundary, trust the types; keep business logic pure.
- Handle errors on one path; translate external errors to internal ones at the edge.

**Not this**
- Defensive null checks deep inside business logic.
- Raw request objects passed through every layer.

## Guard the context window
**Apply when**: large command outputs, long files, repeated reads, or planning that fans out across many files.

**Do**
- Route bulk reading and searching to subagents; keep only their summaries in the main thread.
- Read the part of a file you need, not the whole file.
- Write long results to a file and reference its path.

**Not this**
- Dumping a full log or a 2,000-line file into the conversation.
- Re-reading the same file in every step.

## Idempotent operations
**Apply when**: designing commands, setup or migration steps, scripts, or loops that may crash and rerun.

**Do**
- Make running an operation twice converge to the same end state as running it once.
- Check-then-act on the target state ("create if missing"), not on a remembered history.
- Make partial runs safe to resume.

**Not this**
- A setup script that fails or duplicates data on its second run.
- A migration that assumes it has never run before.

## Model the domain
**Apply when**: writing stateful logic, code that branches a lot, or the same shape assumption repeated across files.

**Do**
- Encode the domain in a structure: a state machine, a typed model, a lookup table or registry, a reducer.
- Put transitions in one place so an illegal transition is impossible or fails loudly.

**Not this**
- The same `if status == ... && flag ...` scattered across modules.
- Booleans that together encode a state (`isLoading && !isError && hasData`).

## Prove it works
**Apply when**: after any task, before declaring it done.

**Do**
- Verify against the real artifact: run the program, call the endpoint, open the page, run the test that exercises the change.
- Record the evidence: command, exit code, log path or output.
- For a bug, show the failing case before and the passing case after.

**Not this**
- "It compiles", "the types check", or "it should work".
- A test that passes but never exercises the changed code.

## Smallest change
**Apply when**: sizing a diff, or tempted to add an abstraction, layer, option, or parameter "for later".

**Do**
- Find the smallest change that meets the goal, and make that one.
- Prefer deleting code over adding code; prefer editing one call site over adding a new mechanism.
- Add an abstraction only when a second real caller exists today.

**Not this**
- A config option nobody asked for.
- A wrapper with one caller.
- "While I'm here" edits outside the task's scope.

## Subtract before adding
**Apply when**: sequencing an addition, refactor, or rewrite.

**Do**
- First remove dead code, unused flags, and obsolete paths in the area you will touch, as its own verified step.
- Then build the new thing on the simpler base.
- When a new API replaces an old one, migrate every caller and delete the old API in the same wave.

**Not this**
- Layering new code beside old code and leaving both.
- Keeping a compatibility shim nobody calls.

## Test behavior, not implementation
**Apply when**: writing, changing, or deciding whether to keep a test.

**Do**
- Assert what the code's users can observe: return values, outputs, side effects at the boundary.
- A good test fails when that behavior breaks and keeps passing when only the internals change.
- Cover the core path, the failure path, and the edges.

**Not this**
- Asserting that a private helper was called N times.
- Snapshot tests nobody reads.
- Mocking the thing under test.

## Verifiable units
**Apply when**: multi-step work — sweeps, migrations, runs of similar edits — and when stacking commits or PRs.

**Do**
- Break the work into small units that each end in a check.
- Verify each unit before starting the next.
- Order delivery so each step proves itself: one commit or PR per unit, each green on its own.

**Not this**
- One giant change verified only at the end.
- A commit that leaves the build red for the next one to fix.
