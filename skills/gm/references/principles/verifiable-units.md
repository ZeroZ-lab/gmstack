# Verifiable units

**Apply when**: multi-step work — sweeps, migrations, runs of similar edits — and when stacking commits or PRs.

**Do**
- Break the work into small units that each end in a check.
- Verify each unit before starting the next.
- Order delivery so each step proves itself: one commit or PR per unit, each green on its own.

**Not this**
- One giant change verified only at the end.
- A commit that leaves the build red for the next one to fix.
