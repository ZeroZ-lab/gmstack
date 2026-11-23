# Fix root causes

**Apply when**: debugging.

**Do**
- Trace each symptom back to the first place the system went wrong, and fix it there.
- Add a guard only when the state it handles is legitimate input, not to suppress a bug upstream.
- Keep the reproduction as a regression test.

**Not this**
- Catching and ignoring the exception where it surfaces.
- Special-casing the one input from the bug report.
