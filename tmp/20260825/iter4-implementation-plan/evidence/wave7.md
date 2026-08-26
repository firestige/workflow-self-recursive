# Wave7 evidence.api implementation candidate evidence

Status: `PASS — IMPLEMENTATION_CANDIDATE` (2026-08-26)

Issue #50 remains OPEN. This wave does not claim Contract conformance, `FROZEN`, publication, retention execution, database-role separation, backup/restore acceptance, or stable Evidence release.

## Immutable input and component checkpoint

- Contract: `evidence.query@0.1.0`, lifecycle `REVIEW_CANDIDATE`.
- Wave6 input manifest: `docs/contracts/evidence-query/wave6-input-manifest.json`.
- Current required manifest SHA-256: `4d048b0a0a7b66fd7645a96f8bc3013ce1a695b22ad5c8b48eb6cecbe6b2e55f`.
- Current approved Wave6 shared-interface commit: `291aed453b49f34b66970581e0bdc7d303229e5c`.
- Wave7 Evidence component commit: `fe8b4ad4e6ddb6cb6fa661aa2e2279ab56c62d91`.
- Pre-Wave8 Raw-lifecycle correction commit: `e0a367dfc16658d374a8c948c7676448dcef109e` (`fix(query): decouple projections from raw debug`).
- Corrected superproject pin checkpoint: `2fe76766353571b9390b82c84cbdef8a6eb6099c`.
- Wave7 superproject pin checkpoint: `26c0e390395056c4db44dbb1a8b8372e63c08f45`.
- Branch: `iter4/implementation`; component checkpoint pushed to `origin/iter4/implementation`.

The manifest digest is asserted by the Wave7 API test. Wave7 was originally implemented against `bf631ac`; the approved Wave6 reopening replaced only the ambiguous bare expiry owner with `(resource_class, resource_kind, owner_key)` at `291aed4`. Wave7 was requalified against that replacement manifest after its Raw-lifecycle correction. Query-specific enriched rows, bounded faults, snapshot adapter, HTTP adapter, and tests remain confined to Wave7 query/transport/test paths plus application assembly. Wave7 introduced no dependency, lockfile, migration, core schema, Contract document, or retention path change.

## Implemented candidate

- `GET /v1/evidence/facts` and `GET /v1/evidence/traces` are the only query successes; request bodies, write methods, arbitrary methods, unknown routes, unacceptable media types, repeated/unknown/empty/list/wildcard/malformed/incompatible/out-of-range filters, and malformed or mismatched cursors fail closed with bounded typed JSON.
- Facts expose only projected owned fields, stable public identities, exact accepted provenance, compatibility coordinates, completeness/availability/expiry truth, and exact recorded relationships. Arbitrary accepted attributes and internal effect names are not exposed.
- Trace results expose only recorded nodes, parent edges, and links. No endpoint is inferred. Link output strips duplicate/internal payload coordinates.
- PostgreSQL pages use a bounded `REPEATABLE READ READ ONLY` transaction lease on the existing ten-connection runtime pool. Fact and Trace keyset ordering matches the published public sort keys. Cursor tokens are server-side opaque, bind route/filter/limit, replay deterministically, and never fall forward to newer state.
- Lease TTL defaults to 60 seconds and is configurable only through 10–300 whole seconds; capacity defaults to four and is configurable only through 1–8. Completed unpaged requests release their lease; cursor traversals remain replayable for their live lease.
- Delivery traversal counts exact Delivery-root-bound Traces inside the same snapshot and returns `QUERY_BOUND_EXCEEDED` above 32 rather than a truncated success.
- The application database lifespan wires Admission and Query to one runtime pool. The existing listener topology remains loopback-published with no application-level authentication.

## Test evidence

Successful final commands:

```text
make check PYTHON_VERSION=3.14
  Ruff format: PASS (48 files)
  Ruff lint: PASS
  strict mypy: PASS (26 source files)
  unit: 82 PASS
  wheel/sdist build: PASS

make unit PYTHON_VERSION=3.13
  unit: 82 PASS

./scripts/integration-test.sh
  PostgreSQL 18.4 migration + integration: 8 PASS

./scripts/deployment-smoke.sh
  pinned container build/migration/health: PASS
  loopback health response: {"status":"ok"}

git diff bf631ac -- src/wsr_evidence/storage/read_model.py \
  src/wsr_evidence/storage/postgresql.py
  no output (exact frozen/core boundary preserved)
```

One earlier integration invocation encountered a transient PostgreSQL container exit after Compose health but before Alembic connected. An immediate clean rerun passed, and the final clean integration run above passed 8/8; no product or harness change was needed for that transient.

## #50 acceptance mapping

| #50 acceptance | Evidence |
| --- | --- |
| Read only committed facts | PostgreSQL repeatable-read integration excludes a commit made after snapshot acquisition; existing atomic-core rollback/uncommitted tests remain green |
| Explicit C17 zero; absence never zero | `test_fact_query_preserves_explicit_zero_and_manifest_binding`; `test_absent_c17_produces_no_observed_count_field` |
| No metric formula | Query only selects and shapes projection-owned values; owned-field/no-leak test and architecture dependency test pass |
| No causal inference | `test_trace_query_returns_only_recorded_node_and_link_without_inference`; PostgreSQL Trace order oracle |
| Expiry is unavailable, not absent | `test_expired_detail_is_unavailable_not_absent`; active four-state truth-table parameterization |
| Independent API Contract | Wave6 approved English authority and whole-document zh-CN translation; unchanged in Wave7 |
| Facts, Trace, provenance/truth/compatibility available | Exact golden fact response plus Trace node/link and owned relationship tests |
| Loopback-only read API, no writes/auth/consumer DB path | HTTP negative tests, existing config/CLI tests, and deployment smoke; no credentials or DB path in response shapes |
| Inspection/backup and restore/migration roles separated | Assigned to Wave10 integration/deployment acceptance; not claimed by Wave7 |

## Contract gaps and handoff

No Wave6 Contract or shared-interface gap was required to implement Wave7. During implementation, a provisional change had enriched the Wave6 `StoredEffect` and placed query faults in the storage layer; architecture tests exposed the boundary violation before checkpoint. It was replaced with a Wave7-private query adapter/model, and the approved shared/core files were restored byte-for-byte before the final gates and commit.

Wave7 is an implementation candidate only. Wave9 still owns independent machine schemas/fixtures/validators and fresh-reader gates; Wave10 owns integrated retention/query, role separation, backup/restore, and release-manifest acceptance; Wave11 owns publication, owner approval, `FROZEN`, and final #50 closure.

## Pre-Wave8 Raw-lifecycle correction

The Wave8 entry audit distinguished cross-system concepts from physical implementations: Observation and Evaluation remain conceptual contracts; Execution/Evidence/BI/Evolution implement producer, durable projection, computation/presentation, and consumer responsibilities without taking ownership of those concepts. `RAW_DEBUG` is only the bounded accepted logical payload copy. It is neither the Observation root fact nor a Metric reference target.

The audit found that the initial Wave7 adapter still selected `accepted_records.logical_record`, and response shaping used it for non-contribution fields and compatibility. That made the implementation inconsistent with the already-approved Wave6 rule that Raw debug defaults to `PT0S` and is never queryable. The correction:

- removes `logical_record` from the Wave7-private `QueryEffect` seam and PostgreSQL SELECT;
- shapes fields, relationships, completeness and compatibility only from Projection owner key/payload plus retained accepted provenance;
- filters Span-derived facts by exact accepted Span source identity and Delivery-root facts by Projection payload;
- persists the exact workflow-family scalar in the Delivery-root projection payload;
- proves with a PostgreSQL oracle that scrubbing the accepted Raw payload to `{}` does not change Fact filtering, Delivery Trace traversal, or returned root fields.

Correction gates: Python 3.13 unit 84 PASS; Python 3.14 unit 84 PASS; PostgreSQL integration 9 PASS; Ruff format/lint PASS; strict mypy PASS; wheel/sdist build PASS. No Contract, migration, core schema, dependency, Metric formula, Evaluation reading, or retention default changed.

## Final Wave6 machine-semantics requalification

Wave7 now binds only replacement manifest `e605720c5b225fa9228e2a4b1a8001f3235482ed83dc214e4c766e5caa6e1706`; Evidence binding commit is `f9bfd3776057645e6cbebb7ac685a82d48ddbdb4`. Requalification added exact timestamp/q-value negatives, registry-ordered fields, per-Trace summaries, typed projection/Trace identities, empty expired relationship arrays, and manifest assertion coverage. Final gates are Python 3.14 112 unit + Ruff/strict mypy/build PASS, Python 3.13 112 unit PASS, and PostgreSQL 12 integration PASS. The API remains an implementation candidate; #50 remains OPEN and no conformance/FROZEN claim is made.
