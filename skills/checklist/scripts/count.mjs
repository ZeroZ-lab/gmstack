#!/usr/bin/env node
// Counts CHECKLIST.md rows by status and checks the release gate.
//
// Usage: node count.mjs [path/to/CHECKLIST.md]   (default: ./CHECKLIST.md)
//
// Reads every markdown table row whose first cell is a checklist ID (e.g. DEF-01, GATE-03).
// Prints status counts, rows that are FAIL or BLOCKED, gate items not PASS, the release
// verdict, and format problems.
//
// Exit codes: 0 = counted, no format problems · 1 = format problems found · 2 = file unreadable
import { readFileSync } from "node:fs";

const STATUSES = ["NOT STARTED", "IN PROGRESS", "PASS", "FAIL", "BLOCKED", "N/A"];
const BLOCKING_GATES = new Set(["GATE-01", "GATE-02", "GATE-03", "GATE-04", "GATE-05", "GATE-06"]);
const ID = /^[A-Z]+-\d{2}$/;
const DATED = /\b\d{4}-\d{2}-\d{2}\b|\b[0-9a-f]{7,40}\b/;

const path = process.argv[2] ?? "CHECKLIST.md";
let text;
try {
  text = readFileSync(path, "utf8");
} catch (e) {
  console.error(`count: cannot read ${path}: ${e.message}`);
  process.exit(2);
}

const rows = [];
const problems = [];
let header = null;
const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

for (const [i, line] of text.split("\n").entries()) {
  if (!line.trim().startsWith("|")) { header = null; continue; }
  const c = cells(line);
  if (c.every((x) => /^:?-{3,}:?$/.test(x))) continue; // separator row
  if (c[0] === "ID") { header = c.map((h) => h.toLowerCase()); continue; }
  if (!ID.test(c[0]) || !header) continue;
  const col = (name) => c[header.findIndex((h) => h.startsWith(name))] ?? "";
  const row = { id: c[0], status: col("status").toUpperCase(), evidence: col("evidence"), line: i + 1 };
  rows.push(row);
  if (!STATUSES.includes(row.status)) problems.push(`line ${row.line}: ${row.id} has unknown status "${row.status}"`);
  if (row.status === "PASS" && !DATED.test(row.evidence)) problems.push(`line ${row.line}: ${row.id} is PASS but its evidence has no date or commit`);
  if (row.status === "N/A" && !/confirmed by/i.test(row.evidence)) problems.push(`line ${row.line}: ${row.id} is N/A without "confirmed by <name>"`);
}

const seen = new Map();
for (const r of rows) {
  if (seen.has(r.id)) problems.push(`line ${r.line}: ${r.id} duplicates line ${seen.get(r.id)}`);
  else seen.set(r.id, r.line);
}

const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
for (const r of rows) if (r.status in counts) counts[r.status]++;

const gates = rows.filter((r) => r.id.startsWith("GATE-"));
const openGates = gates.filter((r) => r.status !== "PASS");
const missingBlocking = [...BLOCKING_GATES].filter((id) => !seen.has(id));
const openBlocking = openGates.filter((r) => BLOCKING_GATES.has(r.id)).map((r) => r.id).concat(missingBlocking);
for (const id of missingBlocking) problems.push(`${id} (blocking) is missing from the checklist`);

console.log(`CHECKLIST: ${path} · ${rows.length} rows`);
console.log("");
console.log("| Status | Count |");
console.log("|---|---|");
for (const s of STATUSES) console.log(`| ${s} | ${counts[s]} |`);
console.log("");
const bad = rows.filter((r) => r.status === "FAIL" || r.status === "BLOCKED");
console.log(`FAIL / BLOCKED: ${bad.length ? bad.map((r) => `${r.id} (${r.status})`).join(", ") : "none"}`);
console.log(`Gate items not PASS: ${openGates.length ? openGates.map((r) => `${r.id} (${r.status})`).join(", ") : "none"}`);
console.log(`Release verdict: ${openBlocking.length ? `NOT RELEASABLE — blocking gate items not PASS: ${openBlocking.join(", ")}` : "blocking gate items all PASS"}`);
console.log("");
if (problems.length) {
  console.log(`Format problems (${problems.length}):`);
  for (const p of problems) console.log(`- ${p}`);
  process.exit(1);
}
console.log("Format problems: none");
