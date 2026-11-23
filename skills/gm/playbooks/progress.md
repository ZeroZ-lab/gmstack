# Playbook: progress

**When**: the user asks how far along the project is, to check progress, or what to do next.

1. Restate the goal: report where `<project>` stands against its checklist.
2. Read CHECKLIST.md. Missing → offer the init playbook and stop.
3. Run the `verify` skill, so test, lint, and secret-scan evidence is current.
4. Run the `checklist` skill's *Audit* operation: recheck stale PASS rows, count statuses, list FAIL and BLOCKED rows, list gate items not PASS.
5. Check the open risks (CHECKLIST.md at tier M, `docs/risks.md` from tier S): each needs an owner and a plan. List any that lack one.
6. Update CHECKLIST.md with every row whose status changed.
7. Report:
   - Status counts from the *Count* script, and the change since the last update if the header shows one
   - Rows that changed in this run (ID, old → new, why)
   - FAIL and BLOCKED rows with reasons
   - Release readiness in one line (blocking gate items not PASS)
   - The next three items, favoring blocking gates, then lower-tier items
