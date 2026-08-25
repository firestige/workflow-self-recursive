<a id="evidence-query"></a>
# Evidence Query Contract

| Field | Value |
| --- | --- |
| Contract revision | `evidence.query@0.1.0` |
| Lifecycle status | `REVIEW_CANDIDATE` |
| Owner | Evidence Query & API (M03) |
| Semantic closure approved | `firestige`, 2026-08-26 |
| Normative language | English |
| Translation | [`evidence-query.zh-CN.md`](evidence-query.zh-CN.md) — non-normative tracking translation; whole-document parity required |
| Semantic authority | [Evidence System Design](../../systems/evidence/evidence-system.md), especially Query & API, lifecycle, ownership, and access sections |
| Upstream fact authority | FROZEN [Observation Catalog](../observation/observation-catalog.md) and [OTel Observation Profile](../observation/otel-observation-profile.md), wire Profile `1.0.0` |
| Machine representation | planned `system-contracts/evidence-query/` revision `0.1.0`; absent until Wave 9 |
| Shared interface candidate | `evidence-system/src/wsr_evidence/storage/read_model.py` at `bf631ac542b6efda26dd94ba477d76fe366f183c` |
| Publication binding | none; candidate material is not a conformance target |
| Reopen condition | any need for a write endpoint, remote listener, application authentication, consumer database access, inferred causality, a Metric formula, a fifth lifecycle class, changed truth/expiry meaning, or an incompatible field/enum/authority change |

This revision is semantically closed for owner review. It may support fast-path implementation and machine-representation candidates, but no implementation may claim conformance until contract.gate.1–6 pass and the exact semantic and machine revisions reach `FROZEN` together.

<a id="evidence-query-1"></a>
## 1. Purpose, authority, and exclusions

`evidence.query` is the only external read boundary of Evidence. It returns committed projected facts and recorded Trace structure to BI and Evolution without exposing PostgreSQL, accepted-record storage, Raw debug data, projection tables, SQL, or internal effect names.

Evidence owns query representation, availability, expiry presentation, compatibility coordinates, pagination, and the read/retention seam. The Observation family remains the authority for fact meaning, identity, applicability, completeness, unit, privacy, relationship, and missingness. Query never grades, converts, estimates, recomputes, selects a current Finding status, reconstructs a missing fact, or infers an edge.

This contract defines no Metric formula, cohort rule, causal inference, presentation model, write operation, replay, correction, authentication scheme, remote access, or database credential. A successful response is not an execution outcome or proof that all possible observations exist.

“Fact” below means a committed Projection-owned contribution or relationship representation. It never means an arbitrary accepted payload or raw logical record.

<a id="evidence-query-2"></a>
## 2. Transport and endpoint surface

The Evidence service exposes the following endpoints on the same configured HTTP listener used for ingest. In loopback scope, the listener binds an IP loopback address. In the approved container topology, wildcard binding is permitted only inside the container while host publication remains loopback-only. PostgreSQL remains internal-only. The first local release has no application-level authentication.

| Method and path | Purpose | Success media type |
| --- | --- | --- |
| `GET /v1/evidence/facts` | page committed factual resources | `application/json` |
| `GET /v1/evidence/traces` | page recorded nodes and edges for exactly one Trace or Delivery | `application/json` |

Only `GET` is defined. `POST`, `PUT`, `PATCH`, `DELETE`, and any unlisted method or route have no query semantics and return a bounded error. Query accepts no request body. UTF-8 JSON responses use the exact shapes below; unknown response fields are prohibited for revision `0.1.0`.

<a id="evidence-query-3"></a>
## 3. Common envelope, scalar, and identity rules

Every successful response has this closed envelope:

| Field | Type | Rule |
| --- | --- | --- |
| `contract.name` | string | exactly `evidence.query` |
| `contract.revision` | string | exactly `0.1.0` |
| `observation_profile` | string | exactly the source wire Profile, initially `1.0.0` |
| `read_model_revision` | string | exactly `1.0.0` for this Contract revision |
| `snapshot` | string | opaque snapshot-lease token; identical on every page in one traversal |
| `items` | array | zero through requested `limit` resources |
| `next_cursor` | string or null | opaque continuation bound to this snapshot, route, revision, filters, limit, and last sort key |

JSON scalars are string, integer, finite number, boolean, or null. Integers outside the interoperable range `[-9007199254740991, 9007199254740991]`, non-finite numbers, binary bodies, arbitrary maps, and nested free-form extension fields are prohibited. Timestamps are UTC RFC 3339 strings with `Z` and at least microsecond precision. Digests are lower-case 64-character SHA-256 hex strings.

Public identities are explicit, never aliases:

| Identity | Shape |
| --- | --- |
| Event source | `{ "kind": "EVENT", "event_id": <nonempty string> }` |
| Span source | `{ "kind": "SPAN", "trace_id": <32 lower-case hex>, "span_id": <16 lower-case hex> }` |
| Fact resource ID | `fact:<source-kind>:<canonical source identity>:<fact-kind>:<canonical owner key>` |
| Trace item ID | canonical tuple of the exact recorded node, parent edge, or link; no display name participates |

The implementation may encode resource IDs as opaque strings, but equality must correspond exactly to these tuples and remain stable for revision `0.1.0`. It may not include a database row ID, mutable alias, list position, or arrival-order guess.

<a id="evidence-query-4"></a>
## 4. Fact resource

Each `/facts` item has the following closed fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | stable Fact resource ID |
| `kind` | closed enum | one of the Fact kinds below |
| `source` | Event or Span identity | exact accepted source identity |
| `recorded_at` | timestamp | committed Projection record time; display/provenance only, never causal order |
| `provenance` | object | exact accepted digest, profile version, nullable family schema, and owner coordinates |
| `compatibility` | object | exact aggregation/consumer-compatibility coordinates; no inferred default |
| `truth` | object | completeness, availability, expiry state, and nullable expiry time |
| `fields` | array | zero or more closed, typed projected fields ordered by upstream field ID/name |
| `relationships` | array | zero or more exact recorded non-Trace relationships ordered by relationship kind and endpoint tuple |

`kind` is closed to:

`EVENT_CONTRIBUTION`, `FINDING_ASSERTION`, `FINDING_TARGET`, `FINDING_STATUS`, `FINDING_FIX`, `FINDING_RECHECK`, `ROLE_LINEAGE`, `DELIVERY_ROOT_BINDING`, and `MODEL_ATTRIBUTION`.

One accepted source may yield multiple resources when Projection owns distinct identities, for example an assertion, target, status, Fix, and Recheck. Query does not collapse them into a mutable “current Finding.” Compatible first-write reuse does not create a duplicate item.

Resource IDs are nonempty and at most 8192 UTF-8 bytes. `owner_key` contains 1 through 16 scalars; any string scalar is nonempty and at most 256 UTF-8 bytes. `fields` contains at most 73 entries, `dimensions` at most 16, and `relationships` at most 16. Upstream field-specific limits remain stricter when applicable.

`provenance` has exactly:

| Field | Type | Rule |
| --- | --- | --- |
| `accepted_digest` | SHA-256 string | canonical digest of the first accepted logical record |
| `profile_version` | string | source Observation wire Profile |
| `family_schema` | string or null | exact source family schema; null only when the upstream shape does not carry one |
| `owner_key` | array of scalar values | exact Projection owner key for this resource |

`compatibility` has exactly `family_schema`, `event_name`, `completeness`, and `dimensions`. `event_name` is null for Span-derived or relationship-only resources. `dimensions` is an ordered array of `{ "field": <upstream field ID or standard OTel name>, "value": <scalar> }`. It contains only coordinates required by the Evidence Design: semantic/family version, measurement kind, unit-or-currency, source, source identity, completeness, and the applicable review/test/coverage/model coordinates. Missing coordinates remain absent; Query does not fill them from another record.

`fields` uses `{ "field": <upstream field ID or standard OTel name>, "value": <scalar> }`. The allowed names, types, closed enums, applicability, and privacy rules are exactly those of Observation Profile `1.0.0`; Query may return only values that Projection owns for the resource kind. It must not return Resource/Scope envelopes, raw OTLP, arbitrary `agentops.*`, prohibited bodies, or an unlisted field. `fields` is empty when factual detail expired; an empty array never synthesizes zero.

`relationships` uses exactly `{ "kind", "from", "to" }`. The closed kinds are `FINDING_TARGET`, `FINDING_FIX`, `FINDING_RECHECK`, `ROLE_LINEAGE`, `DELIVERY_ROOT`, and `MODEL_ATTRIBUTION`. Endpoints are exact stable identities carried by accepted facts. Task grouping, names, time order, or shared labels never create a relationship.

<a id="evidence-query-5"></a>
## 5. Trace resource

`GET /v1/evidence/traces` requires exactly one of `trace_id` or `delivery_id`. Supplying neither or both is invalid. A Delivery filter returns only Traces with an accepted exact Delivery-root binding; it never searches task, Workflow, Runtime, alias, or recency.

Each Trace item has these closed fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | stable Trace item ID |
| `trace_id` | 32-hex string | exact Trace identity |
| `kind` | closed enum | `NODE`, `PARENT_EDGE`, or `LINK` |
| `source` | Span identity | accepted Span that recorded the item |
| `recorded_at` | timestamp | committed Projection record time; not a causal inference |
| `truth` | object | availability/expiry for Trace detail; completeness is null |
| `node` | object or null | present only for `NODE` |
| `edge` | object or null | present only for `PARENT_EDGE` or `LINK` |

`node` contains exact recorded `span_id`, `span_name`, `span_kind`, start/end nanoseconds, Span status, flags, nullable trace state, and at most 73 closed admitted Span fields permitted by Observation Profile `1.0.0`. `edge` contains exact `from` and `to` Span identities and, for `LINK`, only the recorded link trace state and flags. Parent edges and links are returned as recorded; Query does not require the referenced endpoint to have been observed and does not manufacture missing nodes.

If accepted Span identity proves that a requested Trace once existed but its Trace detail expired, the response reports expiry only through the response-level `trace_state`; it never fabricates a marker node or edge. `trace_state` is required and is one of `AVAILABLE`, `EXPIRED`, or `ABSENT`; `items` is empty for `EXPIRED` and `ABSENT`. `ABSENT` means no matching accepted identity exists at the acquired snapshot; it never means no activity occurred outside Evidence.

The `/traces` success envelope therefore adds exactly `trace_state`. `AVAILABLE` may still have an empty page when a cursor has reached the end; initial `AVAILABLE` has at least one item. `EXPIRED` and `ABSENT` always have `items=[]` and `next_cursor=null`.

<a id="evidence-query-6"></a>
## 6. Truth, completeness, availability, and expiry

`truth` has exactly:

| Field | Type | Closed values |
| --- | --- | --- |
| `completeness` | string or null | `FINAL`, `LOWER_BOUND`, `NOT_APPLICABLE`, `UNAVAILABLE`, or null when the upstream fact carries no completeness claim |
| `availability` | string | `AVAILABLE` or `UNAVAILABLE` |
| `expiry` | string | `ACTIVE` or `EXPIRED` |
| `expires_at` | timestamp or null | exact policy-derived expiry instant when finite and known; otherwise null |

The truth table is normative:

| Recorded state | Value/detail | `completeness` | `availability` | `expiry` | Required reading |
| --- | --- | --- | --- | --- | --- |
| applicable final fact, including explicit numeric zero | present | `FINAL` | `AVAILABLE` | `ACTIVE` | exact owner-reported final fact; zero is valid only when explicitly recorded |
| observed applicable lower bound | present | `LOWER_BOUND` | `AVAILABLE` | `ACTIVE` | value is a lower bound, never a final total |
| fact explicitly not applicable | absent | `NOT_APPLICABLE` | `AVAILABLE` | `ACTIVE` | applicable owner reported that no value exists; its retained representation still has an independent data lifecycle |
| producer reports unavailable/sampled/lost | absent | `UNAVAILABLE` | `UNAVAILABLE` | `ACTIVE` | no numeric value; never zero |
| fact has no completeness coordinate | as recorded | null | `AVAILABLE` | `ACTIVE` | read only the owner-recorded categorical/relationship fact |
| retained identity proves detail was deleted | absent | original value or null | `UNAVAILABLE` | `EXPIRED` | event/resource existed; detail is unavailable, not absent |
| no accepted identity at snapshot | no resource | no item | no item | no item | no Evidence fact; no claim about unobserved real-world activity |

Expiry never rewrites `FINAL` to `UNAVAILABLE`, promotes `LOWER_BOUND` to `FINAL`, or changes `NOT_APPLICABLE`. Availability describes whether the retained representation still contains the value/detail; completeness remains the owner’s original claim when provenance retains it.

C17 is exact: a present accepted `agentops.review.observed.count=0` produces a numeric zero field. An absent C17 produces no observed-count field and no synthetic unavailable resource. A present zero with `LOWER_BOUND` remains recorded zero under a lower-bound claim; only `FINAL` makes it a final zero.

<a id="evidence-query-7"></a>
## 7. Filters, ordering, snapshots, and pagination

Query parameters are a closed allow-list. Repeated parameters, comma-separated lists, unknown parameters, empty values, unbounded wildcards, regex, substring search, SQL-like expressions, and arbitrary field selection are invalid.

`/facts` accepts:

| Parameter | Rule |
| --- | --- |
| `kind` | optional exact Fact-kind enum |
| `event_name` | optional exact closed Observation Profile `1.0.0` EventName; only compatible with `EVENT_CONTRIBUTION` |
| `family_schema` | optional exact nonempty value, maximum 128 UTF-8 bytes |
| `delivery_id` | optional exact nonempty value, maximum 256 UTF-8 bytes |
| `trace_id` | optional exact 32 lower-case hex |
| `recorded_from` / `recorded_to` | optional inclusive UTC timestamps; `from <= to`; interval at most 366 days |
| `limit` | optional integer `1..200`; default `100` |
| `cursor` | optional opaque continuation; when present, every other parameter must exactly repeat the first-page normalized values |

`/traces` accepts exactly one of `trace_id` or `delivery_id`, plus `limit` and `cursor` under the same rules. A Delivery traversal is bounded to at most 32 Traces in one snapshot; exceeding the bound returns `QUERY_BOUND_EXCEEDED`, never a truncated success presented as complete.

Facts sort ascending by `(recorded_at, kind, id)`. Trace items sort ascending by `(trace_id, kind-order, id)`, where kind-order is `NODE`, `PARENT_EDGE`, `LINK`. Sorting uses exact bytewise normalized identities, not locale, labels, display names, insertion order, or inferred causal order.

The first page acquires one PostgreSQL `REPEATABLE READ READ ONLY` snapshot lease. Every continuation page reads the same transaction snapshot. The opaque cursor binds the route, Contract/read-model revisions, normalized filters, limit, snapshot lease, and last emitted sort key. Cursor contents are authenticated or server-side opaque and never accepted as caller authority.

Snapshot leases are bounded: default 60 seconds, configurable from 10 through 300 seconds; default maximum 4 concurrent leases, configurable from 1 through 8 so the approved ten-connection runtime pool retains capacity for Admission and maintenance. Expired, evicted, restarted, unknown, tampered, wrong-route, wrong-filter, wrong-limit, or wrong-revision cursors fail closed. They never restart from the newest state or silently skip to an approximate key. A client starts a new traversal explicitly.

Within one snapshot, repeated first-page requests need not reuse the same token, but they return identical resources and ordering. Replaying the same valid cursor against its live snapshot returns the same page and next cursor. Concurrent Admission after snapshot acquisition is invisible to the traversal; a new first page sees a newer committed snapshot. Uncommitted or rolled-back state is never visible.

<a id="evidence-query-8"></a>
## 8. Error model and read-only negatives

Errors use `application/json` with exactly:

```json
{"error":{"code":"INVALID_FILTER","message":"bounded non-secret diagnostic"}}
```

`message` is nonempty, no more than 256 UTF-8 bytes, and contains no SQL, credentials, filesystem path, raw payload, body, stack trace, or driver text. `code` is closed:

| HTTP | Code | Trigger |
| --- | --- | --- |
| 400 | `INVALID_FILTER` | unknown, repeated, empty, incompatible, malformed, or out-of-range filter |
| 400 | `INVALID_CURSOR` | malformed/tampered cursor |
| 406 | `NOT_ACCEPTABLE` | client excludes `application/json` |
| 409 | `CURSOR_MISMATCH` | cursor route/filter/limit/Contract/read-model revision differs |
| 410 | `CURSOR_EXPIRED` | snapshot lease expired, was evicted, or disappeared on restart |
| 413 | `QUERY_BOUND_EXCEEDED` | Delivery Trace bound or another published result bound exceeded |
| 405 | `METHOD_NOT_ALLOWED` | method other than exact `GET` |
| 404 | `ROUTE_NOT_FOUND` | unlisted path; an absent fact/Trace is not this error |
| 500 | `QUERY_INTERNAL` | contained unexpected failure |
| 503 | `QUERY_UNAVAILABLE` | database/snapshot pool unavailable or lease capacity exhausted |

An empty fact result and an absent Trace return `200`; this prevents transport errors from masquerading as truth. Errors never return a partial `items` page.

Conforming negative tests prove that no query route accepts a body or write method; no route exposes Raw, accepted logical records, projection-effect names, database metadata, SQL, credentials, arbitrary attributes, a remote listener, or a consumer database path.

<a id="evidence-query-9"></a>
## 9. Shared read-model and expiry interface

Query and Retention share a stable internal semantic port, not database tables. The implementation language may represent it idiomatically, but the operations and values are fixed:

```text
acquire_snapshot(query, filters, limit, clock_now) -> SnapshotPage
continue_snapshot(cursor, clock_now) -> SnapshotPage
read_expiry(resource_class, owner_key, snapshot) -> ExpiryRecord | ACTIVE
plan_expiry(resource_class, policy_revision, cutoff, limit) -> ExpiryBatch
apply_expiry(batch_identity, clock_now) -> ExpiryResult
```

`SnapshotPage` contains exact Contract/read-model revisions, snapshot identity, ordered public resources, and continuation. It contains no SQL row or mutable dictionary escape hatch. `ExpiryRecord` contains resource class, exact owner key, policy revision, expired-at, and the minimum bounded tombstone coordinates required to distinguish expired from absent. It contains no expired value/body. `ExpiryBatch` is deterministic for one policy revision/cutoff and is idempotent by `batch_identity`.

The internal values are closed:

| Value | Exact fields and bounds |
| --- | --- |
| `SnapshotPage` | `contract_revision`, `read_model_revision`, `snapshot_id`, `resources` (0..limit ordered public resources), `next_cursor` |
| `ExpiryRecord` | `resource_class`, `owner_key`, `source`, `resource_kind`, `recorded_at`, `compatibility`, `policy_revision`, `expired_at`; no value/body |
| `ExpiryBatch` | `batch_identity`, `resource_class`, `policy_revision`, `cutoff`, and 0..1000 owner keys in canonical ascending order |
| `ExpiryResult` | exact `batch_identity`, nonnegative `selected`, `expired`, and `already_expired` counts with `expired + already_expired = selected` |

`batch_identity` is the SHA-256 digest of canonical `(resource_class, policy_revision, cutoff, ordered owner keys)`. Replanning the same inputs yields the same identity; applying the same identity again reports every previously committed member as `already_expired` without another mutation.

The closed `resource_class` enum is `RAW_DEBUG`, `ACCEPTED_PROVENANCE`, `TRACE_DETAIL`, `FACTUAL_PROJECTION`.

- `RAW_DEBUG` maintenance scrubs/deletes bounded diagnostic/logical payload while retaining accepted identity/digest/profile/family provenance.
- `ACCEPTED_PROVENANCE` is immutable and has no automatic expiry operation; attempting one fails closed.
- `TRACE_DETAIL` removes only Trace nodes/parent edges/links/model-detail projections and writes bounded expiry markers.
- `FACTUAL_PROJECTION` removes only factual contribution/relationship projections and writes bounded expiry markers.

The port implementation may use retention-owned tables/migrations and existing core rows, but may not rewrite the Wave3 core schema, mutate accepted identity/digest/provenance, expose storage representation to Query, or couple two resource classes in one implicit deletion. The Raw payload currently colocated with accepted identity is classified as `RAW_DEBUG`; scrubbing it is not mutation of the immutable identity/digest/profile/family tuple.

Every read uses one committed snapshot. Every expiry batch is one transaction: deletion/scrub and its expiry marker commit together or neither does. A concurrent reader sees either the complete pre-expiry resource or the complete expired representation, never a missing gap. A concurrent Admission of a distinct identity is independent. Same-identity retry continues to compare the retained digest and never recreates expired detail.

The shared clock is an injected UTC clock. Policy cutoff is computed once per batch from that clock and persisted in the batch identity. Database wall clock, process uptime, file mtime, and client time are not policy authority.

<a id="evidence-query-10"></a>
## 10. Lifecycle defaults and configuration

The first local release uses these closed defaults:

| Class | Default | Configurable range | Result |
| --- | --- | --- | --- |
| `RAW_DEBUG` | `PT0S` after successful import/projection | `PT0S..P1D` | scrub immediately by default; never queryable |
| `ACCEPTED_PROVENANCE` | `NEVER` | fixed, not configurable | retain immutable identity/digest/profile/family provenance |
| `TRACE_DETAIL` | `P30D` | `P1D..P365D` or `NEVER` | expire Trace detail independently and expose `EXPIRED` |
| `FACTUAL_PROJECTION` | `P365D` | `P30D..P3650D` or `NEVER` | expire factual values/relationships independently and expose unavailable/expired resources |
| maintenance batch | `500` resources | `1..1000` | one bounded expiry transaction |
| scheduler interval | `60` seconds | `10..3600` seconds | eligibility scan cadence; not expiry truth |

Durations are exact ISO 8601 whole-day values except `PT0S`; months and years are prohibited because their length is calendar-dependent. `NEVER` is the only infinite literal. Lower/upper bounds are inclusive.

Configuration comes only from the validated Evidence process environment at startup, projected into an immutable `RetentionPolicy` with revision `1.0.0`. The exact environment variables are `WSR_EVIDENCE_RAW_DEBUG_TTL`, `WSR_EVIDENCE_TRACE_DETAIL_TTL`, `WSR_EVIDENCE_FACTUAL_PROJECTION_TTL`, `WSR_EVIDENCE_RETENTION_BATCH_SIZE`, and `WSR_EVIDENCE_RETENTION_INTERVAL_SECONDS`; accepted provenance has no variable. Missing variables take the defaults. Invalid literals, out-of-range values, or any unsupported accepted-provenance retention variable fail startup before listener/database effects. Runtime reload does not change an in-progress batch or snapshot; a later batch binds the new exact policy values after an explicit process restart. Any change to the meaning or closed class set requires a new policy revision.

Expiry is eligibility, not a deadline guarantee. A resource remains `ACTIVE` until a committed expiry batch removes its detail. Query must not report `EXPIRED` merely because `expires_at` passed. `expires_at` may be shown while active as the policy-derived eligibility instant.

<a id="evidence-query-11"></a>
## 11. Compatibility and versioning

The compatibility tuple is `(contract.name, contract.revision, observation_profile, read_model_revision)`. Consumers must bind all four values and fail closed on an unsupported tuple.

- Contract PATCH: text or validation correction with unchanged JSON meaning.
- Contract MINOR: optional endpoint/resource field or optional filter that old consumers may ignore only after explicitly declaring that policy; revision `0.x` remains pre-release.
- Contract MAJOR: changed field meaning, authority, required field, route, pagination/snapshot rule, error mapping, closed enum, truth table, or lifecycle default/range.
- Observation Profile or read-model revision change is an independent coordinate and never silently aliases an older tuple.

Revision `0.1.0` prohibits unknown response fields, so a consumer that does not explicitly support a later MINOR must reject it rather than assume compatibility. Facts are never migrated or rewritten merely because the query Contract changes; the adapter selects the representation for the requested supported tuple.

<a id="evidence-query-12"></a>
## 12. Conformance oracles and reopen conditions

A candidate implementation and later machine representation must prove:

| Scenario | Required result | Forbidden result |
| --- | --- | --- |
| committed vs uncommitted record | only committed complete resource visible | half-state or dirty read |
| C17=`0`, C17 absent, C17 positive | numeric zero, no observed-count field, exact positive | absence converted to zero/unavailable |
| four completeness states | exact table in §6 | numeric value for N/A/unavailable or promotion to final |
| detail expiry | retained identity plus unavailable/expired representation | event treated as never accepted |
| Trace expiry | `trace_state=EXPIRED`, no invented node/edge | `ABSENT` or reconstructed Trace |
| parent/link with missing endpoint | recorded edge returned exactly | inferred endpoint or dropped edge |
| incompatible unit/source/completeness | separate resources/groups | conversion or cross-sum |
| stable pagination | same live snapshot/cursor yields identical page; later commits excluded | duplicate/skip/newest-state fallback |
| cursor expiry/restart/tamper | bounded typed error | approximate continuation |
| unknown filter/method/body | bounded typed error and zero state effect | permissive ignore or write route |
| concurrent expiry/read | whole pre-expiry or whole expired view | transient absence without tombstone |
| same-identity retry after expiry | digest-based duplicate/conflict; no detail recreation | accepted payload rehydration |
| listener/database boundary | loopback API only; no external PostgreSQL/consumer credential | remote listener or direct SQL path |

Semantic review reopens this candidate if any field, enum, default, error, endpoint, ordering, or ownership rule remains a choice for Wave7/8/9; if a stable snapshot requires changing the Wave3 core transaction/schema; if expiry requires rewriting accepted identity/provenance or coupled deletion; or if an implementation requires a new dependency, formula, inference, authentication, remote exposure, or non-factual data.
