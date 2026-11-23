# Playbook: prototype

**When**: a decision could be settled by trying it — "would approach A or B be faster?", "can library X do Y?", "will this design work?" — or the user asks for a spike or proof of concept.

A prototype answers a question. It is thrown away or rebuilt properly; it never slides into the product unreviewed.

1. Restate the question the prototype must answer, and the **decision criteria** written before building: what result picks which option (a number, a pass/fail behavior).
2. Choose where it lives: a scratch directory outside the repo, or a branch named `proto/<slug>`. Never on the main branch, never mixed into product files.
3. Time-box it: name the smallest experiment that can answer the question. For two or more competing approaches, build each to the same criteria (see [smallest-change](../references/principles/smallest-change.md) — the least code that measures the difference).
4. Build and run it. Record the commands and outputs that measure each criterion. For performance questions, measure more than once and note the spread.
5. Decide against the criteria from step 1. If the result is inconclusive, say so; do not stretch it into a decision.
6. Clean up: delete the scratch directory, or leave the `proto/` branch unmerged and say so. Prototype results never go into CHECKLIST.md.
7. Report: the decision (or "inconclusive"); the evidence per criterion; what the prototype did **not** test; and what building it properly would take (the next playbook — feature or refactor).
