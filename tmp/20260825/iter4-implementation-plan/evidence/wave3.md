# Iteration 4 Wave 3 — Admission + Projection Atomic Core

| Field | Value |
| --- | --- |
| Result | `PASS` |
| Completed at | `2026-08-25T16:15:07Z` (`2026-08-26T00:15:07+0800`, Asia/Shanghai) |
| Branch | component and superproject: `iter4/implementation` |
| Component checkpoint | `b4c181709fc4a145b964237d65c63c489e67c42d` |
| Prior Wave 3 checkpoint | `ab7f8023f06239caeb2c8ab2212c523a9aff9ee9` |
| Migration revision | `20260825_0001` (`core`) |
| Read-model interface | `CORE_READ_MODEL_VERSION = 1.0.0` |
| Issues | #48 and #49 remain `OPEN`; closure remains gated by Wave 11 |

## Conclusion

Wave 3 is PASS. Evidence now admits the frozen Observation Profile 1.0.0 over standard OTLP/HTTP protobuf, binds each Event ID or `(trace_id, span_id)` tuple to a cross-language canonical digest, and commits the accepted identity plus every required initial projection effect in one PostgreSQL transaction. No queue, outbox, replay/correction channel, evaluation formula, mutable current-status winner, query API, retention behavior, or publication action was introduced.

The user-corrected branch policy is in force: this is a pushed checkpoint on the single long-lived Iter4 feature branch. No Wave 3 PR or merge was created. Component-first squash/repin and the superproject squash merge are deferred until the complete Iter4 is ready.

## #48 Admission evidence

| Acceptance | Implementation / oracle |
| --- | --- |
| Exact Resource/Scope/profile/family and closed registry | `admission/validation.py`; exact Profile 1.0.0 pins, ten EventNames, family/schema pairing, family-specific summaries, Fresh Reader complete shape, standard Span operation allowlists, native Span shape and link bounds |
| Content minimization | empty LogRecord body, Span Events, Status message, Scope/Link attributes and all dropped-carrier states become isolated record rejection; attributes remain scalar and closed |
| Stable identity and digest | Event identity `('event', C09)`; Span identity `('span', trace_id, span_id)`; canonical serializer matches the frozen JavaScript/JCS vectors including `1.0`, `-0.0`, fixed/scientific boundaries |
| Atomic accepted row + projection | `accepted_records` and source-linked `projection_effects` share one Psycopg transaction; effect/precondition failure rolls back the accepted identity |
| First-write semantics | concurrent identical submissions yield exactly one `ACCEPTED` and one `DUPLICATE`; changed content/effect yields `CONFLICT` without overwrite |
| OTLP boundary | only aggregate standard protobuf success/partial-success is returned; internal dispositions are absent; malformed records are sibling-isolated; homogeneous family and cardinality budgets fail closed before landing |

## #49 Projection evidence

| Acceptance | Implementation / oracle |
| --- | --- |
| Trace projection | exactly one immutable `trace_node` per accepted Span tuple; explicit parent/link edges only; flags/trace-state preserved; no name/order-derived causality |
| Delivery/model binding | trace-local Delivery root is first-write bound; model attribution requires matching C06 and lands the exact `(provider,C57,C30,C06,trace_id,span_id)` tuple |
| Finding assertion and target | C18 first-binds C51; immutable `(C18,C51)` assertion stores C50 verbatim; C53 endpoint guard plus full typed target key makes multi-target arrival order independent |
| Lifecycle | status key is `(C18,C51,C12)`; Fix/Recheck keys are target-specific and append-only; assertion/target/fix preconditions and complete provenance are compared before commit |
| Missingness and compatibility | raw accepted attributes preserve absent C17 rather than synthesizing zero; compatibility keys retain profile/family, fact kind, completeness, unit/source coordinates; only `FINAL`/`LOWER_BOUND` complete groups are eligible |
| Evaluation boundary | projection records compatibility/eligibility only; no metric or scoring formula exists in Wave 3 |

## Stable storage and read seam

- Alembic `20260825_0001` creates `accepted_records` and `projection_effects`; every effect carries a restrictive foreign key to its source accepted identity.
- `CoreReadModel.scan_effects(kind, after_key, limit)` is versioned as `1.0.0`; the PostgreSQL adapter provides deterministic keyset pagination with bounded pages.
- `tests/fixtures/wave3_admission_projection.json` is the standalone golden admission/projection fixture. The repository-owned tests additionally cover native OTLP logs/traces, exact digest vectors, lifecycle and compatibility effects.

## Verification

| Command / oracle | Result |
| --- | --- |
| TDD focused RED/GREEN cycles | PASS; exposed and fixed incomplete native Span validation, lifecycle invariant/provenance comparison, JavaScript number canonicalization, carrier-level sibling isolation, batch cardinality, and missing read adapter |
| Positive frozen-contract corpus scan | PASS: 12 record-bearing `expected=ACCEPT` corpus records validated |
| `make check PYTHON_VERSION=3.13` | PASS: Ruff, strict mypy, 38 unit tests, wheel and sdist |
| `make check PYTHON_VERSION=3.14` | PASS: Ruff, strict mypy, 38 unit tests, wheel and sdist |
| `make integration` | PASS: PostgreSQL 18.4 + Alembic; 5 concurrency/idempotency/rollback/restart/lifecycle/model-binding/read-pagination tests |
| `make deployment` | PASS: digest-pinned images, explicit migration, healthy service, real OTLP protobuf POST, exactly one `accepted_records` row, cleanup |
| `git diff --check` | PASS |

## Local build evidence

| Artifact | SHA-256 |
| --- | --- |
| `wsr_evidence-0.1.0-py3-none-any.whl` | `06c4928353077f950d8494c2658f7553a7a14b3a4582bc9b2070e021639ee779` |
| `wsr_evidence-0.1.0.tar.gz` | `cfd13bdd4bdbee0d28ef8e1706d0a12dd52174191a6a4758116a08374288fe18` |

These are local qualification outputs, not published assets. Wave 4 owns release-lifecycle implementation readiness and Wave 11 owns real publication.

## Exit conditions and remaining gates

No Wave 3 exit condition fired. The frozen semantics fit a single repository and transaction, and the read-model seam exposes recorded facts without formulas or inference. Issues #48/#49 deliberately remain open until Wave 11 repeats the integrated deployment/release gates. Wave 4 is next under the user's sequential single-branch execution rule.
