# Subtract before adding

**Apply when**: sequencing an addition, refactor, or rewrite.

**Do**
- First remove dead code, unused flags, and obsolete paths in the area you will touch, as its own verified step.
- Then build the new thing on the simpler base.
- When a new API replaces an old one, migrate every caller and delete the old API in the same wave.

**Not this**
- Layering new code beside old code and leaving both.
- Keeping a compatibility shim nobody calls.
