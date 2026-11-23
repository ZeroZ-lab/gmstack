---
name: unslop
description: Edit prose to remove AI writing patterns — filler, hype vocabulary, hedging, formulaic structure, chatbot phrases — while keeping the meaning and the author's judgment. Covers replies, reports, docs, READMEs, PR descriptions, commit messages, and articles in English or Chinese. Use when writing or revising any prose that people will read, when the user asks to de-AI, tighten, or unslop text, or when a gmstack playbook writes its report.
---

# Unslop

Prose that sounds machine-made costs the reader attention and trust. Edit it until every sentence carries a fact, a decision, or an instruction.

This is editing, not disguise. Never add typos, fake anecdotes, invented numbers, or filler "voice" to seem human. If the text lacks substance — no specifics, no stance — say so; do not invent it.

## Rules

Rule numbers are stable; other skills cite them.

**Say something**
1. Cut sentences that would fit unchanged in any other project's text. Name the mechanism, the number, the file, the decision.
2. No generic openers or closers ("In today's fast-paced world…", "In conclusion…", "I hope this helps"). Start with the point; stop when it is made.
3. No vague attribution ("experts say", "it is widely known"). Name the source or delete.
4. No praise or agreement openers ("Great question!", "You're absolutely right"). Respond directly.

**Plain words**
5. Avoid AI vocabulary: delve, crucial, pivotal, robust, seamless, leverage, utilize, foster, empower, landscape, realm, tapestry, testament, underscore, showcase, elevate, unlock, journey. Use the plain word.
6. Say "is" or "has", not "serves as", "stands as", "boasts".
7. No abstract metaphor nouns where a concrete word exists (paradigm, north star, flywheel, game-changer).
8. Cut filler: "in order to" → "to"; delete "it is important to note that", "it's worth mentioning".
9. Cut intensifiers and adverbs; give the number instead ("very fast" → "in 40 ms").

**Honest structure**
10. No "not just X, but Y" or "it's not about X, it's about Y". State the point.
11. Don't force ideas into threes.
12. No trailing "-ing" phrases that add nothing ("…, ensuring a smooth experience").
13. One hedge at most per claim. Label uncertainty once: measured, inferred, or guess.
14. One name per thing. Do not rotate synonyms for variety.
15. One idea per sentence. Split a sentence the reader has to reread.
16. Active voice; name the actor unless it does not matter.

**Formatting**
17. No bold label that restates its own line ("**Performance:** Performance improved…").
18. Don't bold every term; bold only what the reader must not miss.
19. Sentence-case headings. No decorative emojis.
20. A colon introduces a list or an example. Avoid em dashes as all-purpose connectors; use a period or a comma.
21. Don't turn every paragraph into bullets. Bullets are for parallel items; reasoning stays in sentences.

**Chinese text (中文)**
22. 删套话和总结腔：「值得注意的是」「从某种意义上来说」「总的来说」「归根结底」「在当下快速变化的环境中」。
23. 删「这不仅……也……」「不是……而是……」之类的对称句式，直接说判断。
24. 删段首铺垫的正确废话和段尾重复上一句的小结句。
25. 抽象词换成具体对象、场景、代价；打散每段都是「三句完整论证」的平均节奏。

## Process

1. **Diagnose first.** List the three to five worst spots before editing. If the text is mostly fine, fix only those.
2. **Keep what matters.** The author's judgments, structure, examples, and facts stay. Edit the sentences, not the argument.
3. **Edit.** Apply the rules. Prefer deleting a sentence over rewording it.
4. **Check meaning.** Every fact and decision in the original is still there, unchanged.

For long articles, edit the opening, the key argument paragraphs, and the ending first; rewrite the whole piece only when the structure itself is formulaic, and only if asked.

## Output

The edited text. For a substantial edit, add a short list of what changed and anything that needs the author's input (missing specifics, an unclear stance).
