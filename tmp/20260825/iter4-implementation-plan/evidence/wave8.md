# Wave8 evidence.retention implementation candidate evidence

Status: `PASS — IMPLEMENTATION_CANDIDATE` (2026-08-26)

Issue #51 remains OPEN. This wave proves the retention candidate and its bounded persistence behavior; it does not claim Contract `FROZEN`, production scheduling, production database-role separation, published artifacts, or final release acceptance.

## Immutable input and checkpoints

- Contract: `evidence.query@0.1.0`, lifecycle `REVIEW_CANDIDATE`.
- Wave6 input manifest: `docs/contracts/evidence-query/wave6-input-manifest.json`.
- Required and implemented manifest SHA-256: `4d048b0a0a7b66fd7645a96f8bc3013ce1a695b22ad5c8b48eb6cecbe6b2e55f`.
- Approved expiry-identity interface commit: `291aed453b49f34b66970581e0bdc7d303229e5c`.
- Wave6 semantic correction checkpoint: `e228144703800b27e7c66aa738bd7e20de46d031`.
- Wave6 repin checkpoint: `75789193f7565134a6dac49816c3134fed6eb861`.
- Wave8 Evidence component commit: `8602a31dee70b1a2568ef7c48208826582767651`.
- Wave8 superproject pin checkpoint: `eb3dccd05941c96f2ea95735503a7e0244a37827`.
- Branch: `iter4/implementation`; component checkpoint pushed to `origin/iter4/implementation`.

Observation and Evaluation remain cross-system concepts. This implementation owns only Evidence's physical lifecycle and expiry presentation. `RAW_DEBUG` is the accepted logical payload copy; it is neither an Observation root fact nor a Metric reference. Factual projections remain durable Observation fact representations until their independently configured physical expiry. No Evaluation metric formula or aggregation was added.

## Implemented candidate

- Startup projects the exact published environment variables into immutable `RetentionPolicy@1.0.0`. Invalid duration/integer/range values and the unsupported accepted-provenance variable fail before runtime effects.
- One fake/system-clock instant drives each run. Raw debug defaults to immediate eligibility, Trace detail to 30 days, factual projection to 365 days, and accepted identity/provenance has no expiry operation. `NEVER` is accepted only for Trace detail and factual projection.
- PostgreSQL planning is bounded and stably ordered. Identity is the approved triple `(resource_class, resource_kind, owner_key)`, so equal bare owner tuples belonging to different Fact kinds remain independently addressable.
- Applying a batch is transactional and concurrency-idempotent. Per-resource transaction advisory locks make one concurrent application expire the item and the other observe its persisted tombstone. A missing planned resource aborts the whole batch, including prior scrub and marker writes.
- Raw expiry scrubs only `logical_record`; canonical digest, profile/family coordinate, accepted identity, and provenance remain immutable. Admission still returns duplicate/conflict correctly after Raw scrub, and Query results do not depend on Raw.
- Trace and factual expiry scrub only their owned Projection payload and persist compatibility needed for explicit tombstone responses. Query returns `EXPIRED`/`UNAVAILABLE`, never absence, fabricated finality, reconstruction, or a recalculated historical value.
- Migration `20260826_0002` adds only the retention-owned marker table and index. It does not modify Wave3 core tables or the initial core migration.

## Test evidence

Successful final gates:

```text
Python 3.13 unit: 94 PASS
Python 3.14 unit: 94 PASS
Ruff format: PASS (53 files)
Ruff lint: PASS
strict mypy: PASS (29 source files)
wheel/sdist build: PASS
PostgreSQL 18.4 migration 0001 -> 0002 + integration: 12 PASS
loopback Compose build/migration/health smoke: PASS ({"status":"ok"})
git diff 291aed4 -- Wave3 core storage, 0001 migration, pyproject.toml, uv.lock: empty
git diff --check: PASS
```

An additional isolated PostgreSQL 18.4 oracle inserted an accepted record plus expiry marker, created a custom-format `pg_dump`, restored it into a fresh database, and compared accepted identity, canonical digest, profile/family provenance, resource class/kind/owner, policy revision, and batch identity. All restored values matched; the temporary databases and volume were then removed.

## #51 and Wave8 acceptance mapping

| Acceptance | Evidence |
| --- | --- |
| Raw / accepted identity-provenance / Trace / factual lifecycles are independent | Fake-clock planner test plus PostgreSQL lifecycle integration; accepted provenance planning is rejected and has no environment variable |
| Accepted identity/provenance is immutable | Raw scrub retains identity/digest/profile/family; duplicate/conflict admission still works; backup/restore comparison matches |
| Expired Trace detail is explicitly unavailable | Query before Trace expiry is `AVAILABLE`; after expiry and process restart it is `EXPIRED` with no detail items |
| Lower-bound/unavailable never becomes final | Tombstone query preserves recorded completeness and emits unavailable expiry truth; no finality transform exists |
| Historical values are not recomputed by a new formula | Retention only scrubs owned payload and writes compatibility tombstones; no Evaluation/formula dependency exists |
| Fake-clock truth table | `test_fake_clock_plans_only_configured_physical_lifecycles` and configured Query expiry-instant test |
| Concurrent/repeated/crash-recovery behavior | Concurrent application yields exactly one expiry; repeat yields `already_expired`; injected missing member rolls back marker and scrub; process restart preserves tombstones |
| Equal owner tuple across resource kinds | `test_equal_owner_keys_expire_independently_by_public_resource_kind` plans both and expires only the selected kind |
| Backup/restore persistence | Isolated `pg_dump`/`pg_restore` oracle matches immutable identity/provenance and expiry identity/state |
| No Wave3 core or Wave6 semantic drift | Core/dependency diff is empty; new migration uses the retention namespace; current manifest digest is asserted |

## Handoff and non-claims

No remaining Wave6 Contract gap was found after the approved expiry-identity correction. Wave8 provides `RetentionService.run_once`, validated settings, PostgreSQL maintenance, migration, and tests. Automatic scheduler assembly and operational interval execution remain Wave10 deployment work; leaving them unwired here avoids crossing the Wave8 ownership boundary. Wave10 also owns production read-only backup credentials and the supported backup/restore procedure, while this wave proves that the persisted retention state survives a real PostgreSQL dump/restore.

Wave9 still owns independent machine schemas, fixtures, validators, and the fresh-reader gate. Wave11 owns owner approval, publication, `FROZEN`, and final #51 closure.

## Final Wave6 machine-semantics requalification

Wave8 now binds only replacement manifest `e605720c5b225fa9228e2a4b1a8001f3235482ed83dc214e4c766e5caa6e1706`; shared-boundary commit is `0a1eef8bc77d65aae4a923df6b2fd17e81aba28d` and Evidence binding commit is `f9bfd3776057645e6cbebb7ac685a82d48ddbdb4`. Requalification closes exact Raw/Trace/Fact expiry owners, unique members, inclusive eligibility, TTL-bound digest, Projection-success Raw gate, preserved `expires_at`, exact compatibility pairs, and mixed Trace summaries. Final gates are Python 3.14 112 unit + Ruff/strict mypy/build PASS, Python 3.13 112 unit PASS, PostgreSQL 18.4 migrations `0001→0002→0003` plus 12 integration PASS. No Wave3 core/dependency change occurred; #51 remains OPEN and scheduling/production-role work remains Wave10.
