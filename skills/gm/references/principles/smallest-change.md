# Smallest change

**Apply when**: sizing a diff, or tempted to add an abstraction, layer, option, or parameter "for later".

**Do**
- Find the smallest change that meets the goal, and make that one.
- Prefer deleting code over adding code; prefer editing one call site over adding a new mechanism.
- Add an abstraction only when a second real caller exists today.

**Not this**
- A config option nobody asked for.
- A wrapper with one caller.
- "While I'm here" edits outside the task's scope.
