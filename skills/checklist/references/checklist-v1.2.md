# Engineering Checklist v1.2 — Item Catalog

Each item appears exactly once. Format: `ID Item · Tier [Tags]`.

- **Tier** is the lowest tier at which the item is required. Higher tiers include every item of lower tiers.
  - **M** — MVP / prototype
  - **S** — Standard, has real users
  - **C** — Critical: money, privacy, high availability, or compliance
- **Tags** gate an item: it is enabled only when every listed tag applies. An item whose tag does not apply is left out of the checklist entirely. That is not an N/A and needs no confirmation.
  - `[SVC]` long-running service · `[AUTH]` user accounts · `[UI]` has a UI · `[API]` exposes an API · `[DB]` has a database · `[LLM]` has LLM features · `[MOB]` mobile app · `[I18N]` multiple languages · `[LIB]` published as a library or CLI
  - An item listing two tags in separate brackets, such as `[UI][API]`, is enabled when **either** tag applies.

## 0 Definition — DEF
- DEF-01 Project name, goal, owner · M
- DEF-02 Target users and roles · M
- DEF-03 Scope and non-goals · M
- DEF-04 Tech stack and the reasons for it · M
- DEF-05 Tier, tags, and the reasons for them · M
- DEF-06 Project acceptance criteria · M
- DEF-07 Dev / Staging / Prod environment plan · S [SVC]

## 1 Product — PRD / UX
- PRD-01 Requirements document (at tier M, a section of the README) · M
- PRD-02 User stories + acceptance criteria + business rules · M
- PRD-03 Feature priority P0 / P1 / P2 · M
- PRD-04 Edge cases and failure scenarios · M
- PRD-05 Core business flows · S
- PRD-06 Non-functional requirements (performance, availability, security targets) · S
- PRD-07 Product metrics and instrumentation · S
- PRD-08 Compliance requirements identified (GDPR / PIPL / MLPS, etc.) · S
- UX-01 Loading, empty, and error states · M [UI]
- UX-02 Information architecture and interaction flows · S [UI]
- UX-03 UI guidelines / design system · S [UI]
- UX-04 Responsive layout · S [UI]
- UX-05 Accessibility · S [UI]
- UX-06 UX acceptance · S [UI]
- UX-07 Internationalization · M [I18N]

## 2 Architecture — ARC / API / DATA
- ARC-01 Architecture overview and system boundaries · M
- ARC-02 Module breakdown, responsibilities, dependency direction · M
- ARC-03 Decision records (README at tier M, ADRs from tier S) · M
- ARC-04 Layering and dependency rules machine-checked (verify's `arch` step enabled) · S
- ARC-05 Threat model · S
- ARC-06 Scalability design · C
- API-01 API spec + OpenAPI document · M [API]
- API-02 Error codes and error response shape · M [API]
- API-03 Authentication and authorization protocol · M [API]
- API-04 Idempotency design · S [API]
- DATA-01 Data model and schema · M [DB]
- DATA-02 Migrations are tooled and reversible · M [DB]
- DATA-03 Constraints, indexes, transaction boundaries · S [DB]
- DATA-04 Backup and restore, with a tested restore · S [DB]
- DATA-05 Data lifecycle, retention, and deletion · S [DB]

## 3 Development — DEV / GIT
- DEV-01 Consistent directory layout · M
- DEV-02 Formatter + linter · M
- DEV-03 Type checking · M
- DEV-04 Naming, error handling, and logging conventions written down · M
- DEV-05 Config separated from code, `.env.example` provided · M
- DEV-06 No secrets in the repo; secret scanning in pre-commit and CI · M
- DEV-07 Dependency lockfile · M
- DEV-08 Unified exception handling implemented · S
- DEV-09 No circular dependencies, checked by a tool · S
- DEV-10 Complexity, duplication, and dead-code checks · S
- DEV-11 Times in UTC, text in UTF-8 · S
- DEV-12 Feature flags · C
- GIT-01 Branching strategy · M
- GIT-02 Commit convention · M
- GIT-03 PR template + code review rules · S
- GIT-04 CODEOWNERS covering the protected verification files · S

## 4 Quality — QA
- QA-01 Unit tests covering real business logic · M
- QA-02 Core, failure, and edge paths covered · M
- QA-03 Tests isolated and repeatable, not dependent on flaky external services · M
- QA-04 Integration tests · S
- QA-05 End-to-end tests · S
- QA-06 API / contract tests · S [API]
- QA-07 Migration tests · S [DB]
- QA-08 Coverage target (threshold is protected) · S
- QA-09 Architecture tests · S
- QA-10 Test results and run logs retained and traceable · S
- QA-11 Compatibility tests · C
- QA-12 Data-structure compatibility checks · C

## 5 Security — SEC
- SEC-01 Authentication and permission model · M [AUTH]
- SEC-02 Input validation + output encoding · M
- SEC-03 Injection protection (SQL / command / path) · M
- SEC-04 XSS / CSRF protection · M [UI]
- SEC-05 SSRF protection · S [SVC]
- SEC-06 HTTPS / TLS enforced · M [SVC]
- SEC-07 CORS allowlist + security headers (CSP / HSTS) · M [UI][API]
- SEC-08 Safe error handling that leaks no internals · M
- SEC-09 Dependency vulnerability scanning · M
- SEC-10 Rate limiting · S [SVC]
- SEC-11 Sensitive-data classification and encryption at rest · S
- SEC-12 Key management · S
- SEC-13 Log redaction · S
- SEC-14 Access control on user data · S [AUTH]
- SEC-15 License compliance · S
- SEC-16 Least-privilege CI tokens; third-party Actions pinned to SHA · S
- SEC-17 SBOM, image scanning, trusted base images · C
- SEC-18 Build artifact integrity (signing / provenance) · C

## 6 Observability — OBS / Performance — PERF
- OBS-01 Structured logs with consistent fields and levels · M [SVC]
- OBS-02 Request ID / correlation ID · S [SVC]
- OBS-03 Log collection and search · S [SVC]
- OBS-04 Baseline metrics (traffic, error rate, latency, resources, connection pools) · S [SVC]
- OBS-05 Business metrics · S
- OBS-06 Alerts on core metrics · S [SVC]
- OBS-07 Distributed tracing (OpenTelemetry) · C
- OBS-08 Traces linked to logs · C
- PERF-01 Performance targets (P50 / P95 / P99) defined and a baseline measured · S
- PERF-02 Query optimization and caching strategy · S
- PERF-03 Automated benchmarks and performance regression checks · C
- PERF-04 Load and stress tests · C
- PERF-05 CPU / memory profiling · C

## 7 Reliability — REL
- REL-01 Timeouts on external calls · M
- REL-02 Retries with backoff · S
- REL-03 Graceful shutdown · S [SVC]
- REL-04 Resource limits and fault isolation · S [SVC]
- REL-05 Circuit breaking and degradation · C
- REL-06 High-availability design · C
- REL-07 RTO / RPO and disaster recovery · C
- REL-08 Failure drills · C

## 8 Delivery — CI / CD / Operations — OPS
- CI-01 Automated build · M
- CI-02 CI runs the verify entry point · M
- CI-03 CI failure blocks merge (branch protection) · M
- CI-04 CI runs security and dependency scans · S
- CI-05 Builds reproducible and traceable · S
- CD-01 Semantic versioning + release notes · M
- CD-02 Version compatibility and deprecation policy · S [API][LIB]
- CD-03 Automated deployment · S [SVC]
- CD-04 Environment isolation and config management · S [SVC]
- CD-05 Database migration rollout strategy · S [DB]
- CD-06 Rollback mechanism, rehearsed · S
- CD-07 Post-release health checks · S [SVC]
- CD-08 Gradual / canary releases · C
- OPS-01 Health checks, liveness and readiness probes · S [SVC]
- OPS-02 Runbook · S [SVC]
- OPS-03 Alerts have a named receiver and response process · S [SVC]
- OPS-04 Postmortems · S
- OPS-05 Production access control · S [SVC]
- OPS-06 Log retention policy · S [SVC]
- OPS-07 Cost monitoring · S
- OPS-08 On-call rotation · C

## 9 Governance — GOV
- GOV-01 README · M
- GOV-02 CHANGELOG · M
- GOV-03 Named maintainer · M
- GOV-04 Risk and tech-debt register with owners and plans (in CHECKLIST.md at tier M, `docs/risks.md` from tier S) · M
- GOV-05 CONTRIBUTING · S
- GOV-06 Dependency upgrade policy · S
- GOV-07 Periodic technical review · C

## 10 AI-assisted development — AGT
- AGT-01 AGENTS.md · M
- AGT-02 Key constraints are machine-checkable · M
- AGT-03 verify runs automatically after changes · M
- AGT-04 Verification system protected; changes need human approval · M
- AGT-05 Failures never disguised as passes; unrun checks clearly marked · M
- AGT-06 Deliveries include a change summary, acceptance-criteria walkthrough, and verification report · M
- AGT-07 Human approval for high-risk operations (per the AGENTS.md list) · M
- AGT-08 Change scope constrained, regression risk assessed · S
- AGT-09 External input and prompt-injection protection · S
- AGT-10 Human review kept for critical tasks · S
- AGT-11 Performance-sensitive changes run benchmarks · C
- AGT-12 Agent task success rate and defect rate tracked · C

## 11 LLM applications [LLM]
- LLM-01 Minimal eval set and regression evals · M
- LLM-02 Structured output validation · M
- LLM-03 Prompt versioning · S
- LLM-04 Hallucination, safety, and jailbreak tests · S
- LLM-05 Token cost and latency monitoring · S
- LLM-06 Model fallback and provider switching · C

## 12 Mobile [MOB]
- MOB-01 Crash reporting · S
- MOB-02 App store review and privacy manifest · S
- MOB-03 Forced upgrade and minimum version policy · S
- MOB-04 Offline and poor-network handling · S

## Release gate — GATE
Items marked **blocking** can never be skipped, at any tier.
- GATE-01 All P0 requirements done, key acceptance cases pass · blocking
- GATE-02 No unresolved blocking defects · blocking
- GATE-03 verify has no FAIL (steps not enabled at this tier may be SKIPPED), and no verification config was loosened without approval · blocking
- GATE-04 No unaccepted critical vulnerabilities, no leaked credentials · blocking
- GATE-05 Build succeeds, version fixed, release notes complete · blocking
- GATE-06 Verification report generated; every open risk has an owner and a plan · blocking
- GATE-07 Rollback plan verified · S
- GATE-08 Backup restore confirmed · S [DB]
- GATE-09 Performance meets the PERF-01 baseline · S
- GATE-10 Alerts have responders, runbook ready · S [SVC]
- GATE-11 Release owner sign-off · S
- GATE-12 Core paths observable and traceable · C
