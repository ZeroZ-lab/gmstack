# Test behavior, not implementation

**Apply when**: writing, changing, or deciding whether to keep a test.

**Do**
- Assert what the code's users can observe: return values, outputs, side effects at the boundary.
- A good test fails when that behavior breaks and keeps passing when only the internals change.
- Cover the core path, the failure path, and the edges.

**Not this**
- Asserting that a private helper was called N times.
- Snapshot tests nobody reads.
- Mocking the thing under test.
