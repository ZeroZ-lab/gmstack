# Good tests

## The test

A good test verifies behavior through a public interface. It reads like a specification ("user can check out with a valid cart") and survives a rewrite of the internals.

Before writing it, name the production change that would make it fail. If you cannot, the test does not test anything.

| Quality | Good | Bad |
|---|---|---|
| One behavior | `rejects an empty email` | `validates email and domain and whitespace` |
| Clear name | states what should happen | `test1`, `works` |
| Independent expectation | a literal or worked example | recomputed the way the code computes it |
| Real code | the module under test, real collaborators | mocks of your own modules |

## Anti-patterns

**Implementation-coupled** — mocks internal collaborators, tests private methods, asserts on call counts or order, or verifies through a side channel. Tell: it breaks on a refactor that kept behavior.

```ts
// BAD: verifies through the database instead of the interface
await createUser({ name: "Alice" });
expect(await db.query("SELECT * FROM users WHERE name = ?", ["Alice"])).toBeDefined();

// GOOD: verifies through the interface
const user = await createUser({ name: "Alice" });
expect((await getUser(user.id)).name).toBe("Alice");
```

**Tautological** — the expected value restates the implementation, so it passes by construction.

```ts
// BAD
const expected = items.reduce((s, i) => s + i.price, 0);
expect(calculateTotal(items)).toBe(expected);

// GOOD
expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15);
```

**Testing the mock** — the assertion checks that a mock did what the mock was told to do.

```ts
// BAD
const op = jest.fn().mockRejectedValueOnce(new Error()).mockResolvedValueOnce("ok");
await retry(op);
expect(op).toHaveBeenCalledTimes(2);

// GOOD
let attempts = 0;
const op = async () => { if (++attempts < 2) throw new Error("fail"); return "ok"; };
expect(await retry(op)).toBe("ok");
expect(attempts).toBe(2);
```

**Horizontal slicing** — all tests first, then all code. Tests written against imagined behavior lock in the wrong shape. One slice at a time.

**Test-only code in production** — hooks, flags, or methods that exist only for tests belong in test utilities.

## Mocking

Mock only at system boundaries: external APIs (payment, email), time, randomness, and sometimes the database or filesystem. Understand a dependency's side effects before mocking it.

Design boundaries to be easy to substitute:

- Pass dependencies in (`processPayment(order, paymentClient)`) instead of constructing them inside.
- Prefer one function per external operation (`api.getUser`, `api.createOrder`) over one generic `api.fetch(endpoint, options)`, so each fake returns one shape with no branching.

## Coverage of a slice

For each behavior: the core path, the failure path, and the edges (empty, one, many, boundary values, invalid input). Add the inputs a reasonable user would try even when the spec is silent on them.
