<a id="interaction-contract"></a>
# Execution–Evidence Interaction Contract

> **REVIEW CANDIDATE — NOT A PUBLISHED CONTRACT.** This document is a meaning-preserving authority split from superseded `EE-CONTRACT-DRAFT-001`, plus one post-split meaning amendment recorded as `EE-CRITICAL-OTLP-AGGREGATE-ADMISSION-PARITY-2026-08-17`: the external ingest response is the standard OTLP aggregate success/partial-success with bounded rejected counts/reasons, and `accepted`/`duplicate`/`conflict`/`rejected` remain Admission-internal per-record disposition only; provenance remains in Git history. It owns the transport and interaction obligations between Execution (producer) and Evidence (acceptor): endpoint, internal per-record disposition, partial success, batch sibling isolation, retry/timeout/ambiguous commit, version compatibility, generic profile-invalid atomic rejection, and downstream publication/conformance obligations. It owns no wire registry, no complete-shape or identity-tuple detail, and no durable storage model.

<a id="interaction-contract-1"></a>
## 1. Metadata and Authority

| Field | Value |
| --- | --- |
| Document identity | `interaction.identity.001` |
| Status | `REVIEW_CANDIDATE` |
| Normative language | English |
| Origin | Meaning-preserving authority split from superseded `EE-CONTRACT-DRAFT-001`, plus one post-split meaning amendment recorded as `EE-CRITICAL-OTLP-AGGREGATE-ADMISSION-PARITY-2026-08-17` (standard OTLP aggregate ingest response; per-record disposition remains Admission-internal); provenance remains in Git history |
| Semantic authorities | [Concept](../../agent-architecture.md), [Execution Design](../../systems/execution/project-execution-system.md), [Evidence Design](../../systems/evidence/evidence-system.md) |
| Representation companion | [OTel Observation Profile](../observation/otel-observation-profile.md), proposed version `1.0.0` |
| Semantic companion | [Observation Catalog](../observation/observation-catalog.md) |
| Confirmed direction | `EE-SKELETON`, SHA-256 `73b3481a099983b57ee9e1dd512c6ed23823f0d045085f9ef585db70be13949a` |
| Translation parity obligation | English/Chinese anchors, headings, tables, IDs, fields, enums and links are paired, per [Concept `concept.acceptance.017`](../../agent-architecture.md) |

This document owns how Execution submits observations and how Evidence acknowledges them. It does not own what a fact means (Observation Catalog), how a fact is encoded (OTel Observation Profile), or how an accepted fact is durably stored and queried (Evidence System Design).

<a id="interaction-contract-2"></a>
## 2. Purpose, Scope, and Non-goals

Execution emits optional, one-way, best-effort Observation; Evidence accepts and acknowledges it. Observation is non-controlling: disablement, refusal, sampling, timeout, or tail loss cannot change the Runtime result or slot handling, and Evidence never returns an execution outcome or a receipt that Execution must wait for.

In scope:

- the ingest endpoint and its standard OTLP aggregate acknowledgement;
- internal accepted / duplicate / conflict / rejected Admission disposition;
- partial success and batch sibling isolation;
- retry, timeout, and ambiguous-commit convergence;
- version compatibility and generic profile-invalid atomic rejection;
- downstream publication and conformance obligations.

Non-goals: execution control, receipt/outbox/queue/cursor semantics, replay or compensation workers, durable storage and retention, query presentation, and any callback from Evidence into Execution. The exact wire registry, complete shapes, identity tuples, and conflict matrices are owned by the [OTel Observation Profile](../observation/otel-observation-profile.md) and are not restated here.

<a id="interaction-contract-3"></a>
## 3. Transport and Endpoint

The factual transport is OTLP/HTTP through official binary protobuf Trace and Log exporters, exactly as pinned in the [OTel Observation Profile §4](../observation/otel-observation-profile.md#otel-profile-4). Stock DSH rc.6 OTLP/JSON is disabled and not routed to Evidence.

Evidence exposes exactly one configured loopback-only HTTP base URL. Standard OTLP paths are appended to that same base: `/v1/traces` accepts `ExportTraceServiceRequest` and `/v1/logs` accepts `ExportLogsServiceRequest`, each with `Content-Type: application/x-protobuf`. No alternate ingest path, OTLP/JSON path, second signal-specific base URL, or remotely bound listener is conforming. The first local-only release requires no application-level authentication on this loopback interface. There is no externally reachable database listener and no reverse interface from Evidence to Execution.

The producer groups each request by signal, exact profile version and exact Workflow family/schema coordinate. One request is family-homogeneous: it may batch records from multiple Deliveries only when all explicit family coordinates resolve to the same group; different groups are split into different requests. `request.family_schema` in the logical conformance form records that grouping assertion and is not an alternate OTLP header. A mixed-family request is a global batch-shape failure before per-record Admission. This grouping requirement constrains the Contract surface; production exporter batching remains downstream implementation work.

The `ingest` interface:

| Interface | Input | Result / error | Invariants |
| --- | --- | --- | --- |
| `POST {base}/v1/traces` | bounded official protobuf `ExportTraceServiceRequest` | standard Trace Export response or protobuf `Status` | logical Span count is the OTLP Span count; Resource/Scope envelopes are not count units |
| `POST {base}/v1/logs` | bounded official protobuf `ExportLogsServiceRequest` | standard Logs Export response or protobuf `Status` | logical Event count is the OTLP LogRecord count; Resource/Scope envelopes are not count units |

The response is an aggregate acknowledgement of Evidence ingest only. It is never an execution outcome, never a per-record disposition payload, and never a prerequisite for Execution progress.

<a id="interaction-contract-4"></a>
## 4. Per-Record Disposition

Each record admitted by Observation Admission receives exactly one internal disposition:

| Disposition | Trigger | Meaning |
| --- | --- | --- |
| accepted | the record passes the complete validation of the [OTel Observation Profile](../observation/otel-observation-profile.md) and its record identity is new | the record and every required initial effect are accepted together |
| duplicate | the record identity and canonical content digest match an already-accepted record | already accepted; no mutation; contributes nothing again |
| conflict | the record identity matches an already-accepted record but its canonical content differs, or the record fails an invariant/conflict rule of the profile | rejected without overwrite; the first accepted record is unchanged |
| rejected | the record fails profile validation (unsupported coordinates, malformed content, prohibited content) or an applicable lifecycle endpoint rule | rejected with zero partial projection for that record |

Disposition is decided per record inside Admission. Identity and digest comparison, and every invariant/conflict rule, are defined in the [OTel Observation Profile](../observation/otel-observation-profile.md#otel-profile-7); this contract owns only the disposition names and their Admission meaning. These labels are not serialized in the external ingest response, and the response never carries a per-record disposition vector.

A record that is rejected carries zero accepted effects for that record. A record that conflicts never overwrites a prior accepted record.

<a id="interaction-contract-5"></a>
## 5. Partial Success and Batch Sibling Isolation

After request-level validation succeeds, each logical Span or Event is validated independently. One logical Span maps one-to-one to one OTLP Span, and one logical Event maps one-to-one to one OTLP LogRecord. A valid sibling may be accepted while an invalid sibling is rejected in the same request. Resource, Scope, ResourceSpans/ResourceLogs, and ScopeSpans/ScopeLogs are envelopes and never rejected-count units.

The response mapping is exact and signal-specific:

| Admission/request result | HTTP result | OTLP body |
| --- | --- | --- |
| empty request, all accepted, accepted+duplicate, or duplicate-only | `200` | signal Export response with `partial_success` unset |
| accepted/duplicate mixed with conflict/rejected | `200` | signal Export response with partial success; Trace uses `rejected_spans`, Logs uses `rejected_log_records`; only conflict+rejected logical records are counted |
| all logical records are conflict/rejected because of permanent data invalidity | `400` | protobuf `google.rpc.Status`; never a signal partial-success body |
| protobuf decode failure, wrong content type, unsupported exact profile/family coordinate, or global batch-shape failure | `400` | protobuf `google.rpc.Status`; request failure has zero per-record effects |
| encoded request exceeds the published byte limit | `413` | protobuf `google.rpc.Status`; zero per-record effects |
| overload / unavailable | `429` / `503` | protobuf `google.rpc.Status`; retryable with identical bytes and identities |
| gateway failure / timeout | `502` / `504` | protobuf `google.rpc.Status`; retryable with identical bytes and identities |

No response contains `accepted`, `duplicate`, `conflict`, `rejected`, or any per-record vector. A request-level failure occurs before record admission and therefore cannot partially accept siblings.

The transaction boundary is per valid record, not per batch. First accepted write wins. Ordinary retry is safe because identity and content digest decide duplicate versus conflict.

<a id="interaction-contract-6"></a>
## 6. Retry, Timeout, and Ambiguous Commit

- **Identical retry**: a retry resubmits identical request bytes and record identities. Each already committed same-identity/same-digest logical record converges internally to duplicate/already accepted; no effect repeats. The external response remains the standard OTLP aggregate result, not a per-record duplicate label.
- **Conflicting retry**: re-submitting the same identity with different content is an internal conflict/rejection; the first accepted record is never overwritten. The external response exposes only the aggregate rejected count/reason permitted by OTLP partial success, not a per-record conflict label.
- **Ambiguous commit**: if acceptance may have committed but no response was observed, the only conforming retry is the identical request. Committed records converge by identity+canonical digest to duplicate; uncommitted records remain new. No queue, replay worker, or compensation is required, and the sender receives no per-record duplicate label.
- **Failure before acceptance**: a failure before the record becomes accepted leaves no accepted record and no partial effect; readers see either no state or the complete accepted slice, never a half-state; a later same-identity request is new.
- **Timeout / refusal**: no HTTP response is a transport attempt/result state, not a pseudo OTLP response. The sender may retry the identical request; it never varies identity or payload to guess commit state.
- **Tail loss**: a best-effort exporter may lose an unobserved request before or during shutdown. This is a transport loss state, not an OTLP response and not a durability claim; the sender does not reconstruct facts from Runtime or later Evidence state.

<a id="interaction-contract-7"></a>
## 7. Version Compatibility

Manifest, lifecycle/result, Observation Profile, each Workflow-family schema, producer, and acceptor are explicitly versioned. The Super Project release binds the exact revisions and SHA-256 digests that passed the joint gates. Its release tag certifies only that exact combination; it is not a compatibility promise for other revisions.

A record is **profile-invalid** when it carries unsupported Resource/Scope/profile/family coordinates, an unlisted or wrong-family field, an invalid closed value or type, prohibited content, or any shape that fails the complete validation of the [OTel Observation Profile](../observation/otel-observation-profile.md). Profile-invalid rejection is atomic: the whole logical record is rejected with zero partial projection. Evidence never silently ignores an invalid field or partially admits a malformed record, and it never accepts a coordinate it does not explicitly support.

The MVP producer emits only the exact profile revision in its released combination, and the acceptor admits only the exact profile/family tuples in that combination or in the published closed compatibility matrix. `implementation@1` and `system-design@1` are exact tuples, not ranges. PATCH/MINOR describes permitted source evolution only: SemVer never automatically widens emission, admission, or conformance. Every additional cross-release entry must list exact producer revision, acceptor revision, profile/family tuple, applicability boundary, historical fixtures, and joint-gate evidence. Any unlisted combination fails closed. A conformance claim always binds exact revisions and digests even when an acceptor has multiple explicit matrix entries.

<a id="interaction-contract-8"></a>
## 8. Publication and Conformance Obligations

This split is `REVIEW_CANDIDATE`. Profile `0.3.0` is `NON_RESOLVING_LEGACY_HISTORY_ONLY`. Candidate `1.0.0` machine schemas, registry, fixtures, validators, and publication inventory are present in `system-contracts/observation/`, but are not released. No implementation or physical artifact may claim Contract conformance until every lifecycle gate and owner approval pass.

Downstream owners still must publish and prove:

1. machine-schema language, filenames, package and registry layout;
2. exact string character sets and maximum lengths, digest/canonicalization algorithms where not already fixed, cardinality budgets, batch/page limits and operational defaults;
3. machine-valid Manifest, lifecycle/result, Observation Profile and family schemas encoding the exact registries, complete shapes, target relations, activity identity, and usage coordinates fixed by the [OTel Observation Profile](../observation/otel-observation-profile.md);
4. packaged positive, negative, base/endpoint, multi-target, duplicate/conflict, partial-success, sampling, privacy, lineage, crash/recovery, completeness, usage and retention fixtures;
5. physical storage tables, columns, indexes, constraints, migrations and retention defaults (owned by the Evidence System Design, not by this contract);
6. production Adapter, Admission, Projection and App code, redaction and bounded diagnostics;
7. executable validators, cross-implementation validation and release/publication record; and
8. capacity, latency, queue/backpressure, security-expansion and retention tuning.

Downstream work may refine physical encoding and prove the proposal. It may not privately select another carrier, fact-class taxonomy, field meaning, lineage rule, standard/custom split, usage/missingness model, or privacy boundary without reopening System Design. The retained legacy implementation line remains quarantined legacy evidence and is not conformance proof; downstream physical cutover must inventory and atomically replace/remove or authorizedly repair the complete legacy graph, update all consumers and entrypoints, establish new digests, and validate a new baseline.
