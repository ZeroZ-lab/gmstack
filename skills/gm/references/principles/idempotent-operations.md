# Idempotent operations

**Apply when**: designing commands, setup or migration steps, scripts, or loops that may crash and rerun.

**Do**
- Make running an operation twice converge to the same end state as running it once.
- Check-then-act on the target state ("create if missing"), not on a remembered history.
- Make partial runs safe to resume.

**Not this**
- A setup script that fails or duplicates data on its second run.
- A migration that assumes it has never run before.
