# Iteration 4 Wave 1 Evidence Design Alignment

| Field | Value |
| --- | --- |
| Result | `PASS` |
| Completed at | `2026-08-25T15:06:37Z` |
| Approved merge commit | `1af7cd9fe8ca43659864a47e73f744a55d7d9558` |
| Pull request | <https://github.com/firestige/workflow-self-recursive/pull/100> |
| PR CI | <https://github.com/firestige/workflow-self-recursive/actions/runs/32862911667> — PASS |
| Main CI | <https://github.com/firestige/workflow-self-recursive/actions/runs/32863287977> — PASS |
| Scope issue | <https://github.com/firestige/workflow-self-recursive/issues/97> — CLOSED |

## Approved outcome

- Evidence is a loopback-only data service: Admission, Projection, Query & API, retention, and internal PostgreSQL; it hosts no UI, Grafana, Agent Decisions view, user-facing listener, or presentation proxy.
- M03 is `Query & API`. Its versioned read-only API is the sole external read boundary for BI and Evolution; PostgreSQL has no external listener or consumer credential path.
- `query-facts` and `query-trace` expose committed state only with bounded filtering/pagination, provenance, four-state completeness, availability/expiry, and compatibility coordinates. They define no Metric formula and infer no causality.
- `expire` remains M03-owned and operates over the four independently governed data lifecycle classes.
- The local preview has no application-level authentication on loopback ingest/query. Internal read-only inspection/backup uses a distinct least-privilege read-only database role; restore/migration uses a separate controlled write-capable operational role.
- Concept `acceptance.010`, `acceptance.013`, `obligation.004`, `decision.012`, and the top-level dependency diagram now assign Evidence API/data-service versus BI presentation ownership explicitly.

## Authority synchronization

- English authority and zh-CN companions updated:
  - `docs/systems/evidence/evidence-system.md`
  - `docs/systems/evidence/evidence-system.zh-CN.md`
  - `docs/agent-architecture.md`
  - `docs/agent-architecture.zh-CN.md`
- #50 updated with the pure-API topology and application/read-only/write-role permission split: <https://github.com/firestige/workflow-self-recursive/issues/50>.
- #55 updated to say BI uses `evidence.api`, holds no PostgreSQL credential, and does not fabricate an API secret in the authless loopback preview: <https://github.com/firestige/workflow-self-recursive/issues/55>.
- `issues.md` and `evidence-conflicts.md` record the later no-three-card decision: #50 owns semantic+machine contract work and wave11 owns the publication gate.

## Review disposition

The user explicitly approved the reviewed draft on 2026-08-25. An independent fresh reader initially rejected the draft with five blockers: stale top-level human-view ownership, two EN/zh-CN curated-view divergences, ambiguous read-only versus restore credentials, and residual curated/proxy wording. All B1–B5 were corrected. The second read found every blocker PASS, no new semantic parity or topology contradiction, and correct owner migration.

The documents remain `WORKING_REVIEW_CANDIDATE`. Wave 1 makes no `FROZEN`, publication, production-conformance, or cross-implementation claim.

## Verification

| Check | Result |
| --- | --- |
| EN/zh-CN anchor, H2, and line-count structural parity | PASS |
| Relative Markdown links in all four files | PASS |
| Stale positive ownership scan (`Query & Presentation`, Evidence App owner, same-origin Viewer, curated/proxy topology) | PASS — none |
| `git diff --check` | PASS |
| Independent fresh-reader C1–C7 and B1–B5 review | PASS after remediation |
| PR and final main full qualification | PASS |

## Remaining downstream gates

- Wave 2 must freeze the Python implementation/deployment baseline; npm name reservation is not a runtime or publisher decision.
- #50 must later produce both semantic and machine `evidence.query` artifacts.
- Wave 11 must complete contract publication and exact binding before any FROZEN claim.
