<a id="interaction-contract"></a>
# Execution–Evidence Interaction Contract

> **DRAFT — NOT A PUBLISHED CONTRACT.** This document is a meaning-preserving authority split from superseded `EE-CONTRACT-DRAFT-001`, plus one post-split meaning amendment recorded as `EE-CRITICAL-OTLP-AGGREGATE-ADMISSION-PARITY-2026-08-17`: the external ingest response is the standard OTLP aggregate success/partial-success with bounded rejected counts/reasons, and `accepted`/`duplicate`/`conflict`/`rejected` remain Admission-internal per-record disposition only; provenance remains in Git history. It owns the transport and interaction obligations between Execution (producer) and Evidence (acceptor): endpoint, internal per-record disposition, partial success, batch sibling isolation, retry/timeout/ambiguous commit, version compatibility, generic profile-invalid atomic rejection, and downstream publication/conformance obligations. It owns no wire registry, no complete-shape or identity-tuple detail, and no durable storage model.

<a id="interaction-contract-1"></a>
## 1. Metadata and Authority

| Field | Value |
| --- | --- |
| Document identity | `EE-INTERACTION-001` |
| Status | `DRAFT_NOT_PUBLISHED` |
| Normative language | English |
| Origin | Meaning-preserving authority split from superseded `EE-CONTRACT-DRAFT-001`, plus one post-split meaning amendment recorded as `EE-CRITICAL-OTLP-AGGREGATE-ADMISSION-PARITY-2026-08-17` (standard OTLP aggregate ingest response; per-record disposition remains Admission-internal); provenance remains in Git history |
| Semantic authorities | [Concept](../../agent-architecture.md), [Execution Design](../../systems/execution/project-execution-system.md), [Evidence Design](../../systems/evidence/evidence-system.md) |
| Representation companion | [OTel Observation Profile](../observation/otel-observation-profile.md), proposed version `0.2.0` |
| Semantic companion | [Observation Catalog](../observation/observation-catalog.md) |
| Confirmed direction | `EE-SKELETON`, SHA-256 `73b3481a099983b57ee9e1dd512c6ed23823f0d045085f9ef585db70be13949a` |
| Translation parity obligation | English/Chinese anchors, headings, tables, IDs, fields, enums and links are paired, per [Concept `EE-AC-017`](../../agent-architecture.md) |

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

Evidence exposes a single local, loopback-only ingest endpoint that accepts one bounded, supported OTLP batch per request. The first local-only release requires no application-level authentication on the loopback ingest endpoint. There is no externally reachable database listener, and there is no reverse interface from Evidence to Execution.

The `ingest` interface:

| Interface | Input | Result / error | Invariants |
| --- | --- | --- | --- |
| `ingest` | bounded supported OTLP batch | standard OTLP success or partial-success aggregate with bounded rejected counts/reasons | no execution outcome; no per-record response vector; siblings independent |

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

Each record is validated independently. A valid sibling may be accepted while an invalid sibling is rejected in the same batch. The external OTLP response reports only the standard aggregate success or partial-success result with bounded rejected counts and reasons; it does not create an all-or-nothing batch transaction, does not expose internal per-record disposition labels, and never reports an execution outcome.

The transaction boundary is per valid record, not per batch. First accepted write wins. Ordinary retry is safe because identity and content digest decide duplicate versus conflict.

<a id="interaction-contract-6"></a>
## 6. Retry, Timeout, and Ambiguous Commit

- **Identical retry**: re-submitting an identical record (same identity and digest) converges internally to duplicate/already accepted; no effect repeats. The external response remains the standard OTLP aggregate result, not a per-record duplicate label.
- **Conflicting retry**: re-submitting the same identity with different content is an internal conflict/rejection; the first accepted record is never overwritten. The external response exposes only the aggregate rejected count/reason permitted by OTLP partial success, not a per-record conflict label.
- **Ambiguous commit**: if the record became accepted but the acknowledgement path failed, a later same-identity request converges internally to duplicate/already accepted. No queue, replay worker, or compensation is required, and the sender receives no per-record duplicate label.
- **Failure before acceptance**: a failure before the record becomes accepted leaves no accepted record and no partial effect; readers see either no state or the complete accepted slice, never a half-state; a later same-identity request is new.
- **Timeout / tail loss / refusal**: best-effort export, refusal, timeout, or tail loss never changes the Runtime outcome and never produces a durability or complete-delivery claim. The sender does not reconstruct lost facts from any later state.

<a id="interaction-contract-7"></a>
## 7. Version Compatibility

Manifest, lifecycle/result, Observation Profile, each Workflow-family schema, and factual semantics are explicitly versioned. Compatibility is declared against exact profile/family/semantic coordinates, never inferred from matching names or field spelling.

A record is **profile-invalid** when it carries unsupported Resource/Scope/profile/family coordinates, an unlisted or wrong-family field, an invalid closed value or type, prohibited content, or any shape that fails the complete validation of the [OTel Observation Profile](../observation/otel-observation-profile.md). Profile-invalid rejection is atomic: the whole logical record is rejected with zero partial projection. Evidence never silently ignores an invalid field or partially admits a malformed record, and it never accepts a coordinate it does not explicitly support.

Version compatibility is evaluated per record; a batch may contain records of different family schema values, each validated against the same profile version.

<a id="interaction-contract-8"></a>
## 8. Publication and Conformance Obligations

This split remains `DRAFT_NOT_PUBLISHED`. No implementation or physical artifact may claim Contract conformance until the released physical Contract is published and its executable validators pass.

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
