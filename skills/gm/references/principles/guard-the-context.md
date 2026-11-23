# Guard the context window

**Apply when**: large command outputs, long files, repeated reads, or planning that fans out across many files.

**Do**
- Route bulk reading and searching to subagents; keep only their summaries in the main thread.
- Read the part of a file you need, not the whole file.
- Write long results to a file and reference its path.

**Not this**
- Dumping a full log or a 2,000-line file into the conversation.
- Re-reading the same file in every step.
