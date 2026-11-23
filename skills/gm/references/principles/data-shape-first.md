# Data shape first

**Apply when**: before writing logic.

**Do**
- Write down the core types and data structures first: what is stored, what flows between modules, what concurrent actors share.
- Settle the shape, then write the functions that move it.
- Make illegal states unrepresentable where the language allows (tagged unions, branded IDs, non-optional required fields).

**Not this**
- Starting with control flow and discovering the data model halfway through.
- A bag of optional fields where only some combinations are valid.
