<a id="evidence-query"></a>
# Evidence Query Contract

| Field | Value |
| --- | --- |
| Contract revision | `evidence.query@0.1.0` |
| Lifecycle status | `REVIEW_CANDIDATE` |
| Owner | Evidence Query & API (M03) |
| Semantic closure approved | `firestige`, 2026-08-26 |
| Wave 9 clarification reopen approved | `firestige`, 2026-08-26; no revision bump before first publication |
| Normative language | English |
| Translation | [`evidence-query.zh-CN.md`](evidence-query.zh-CN.md) — non-normative tracking translation; whole-document parity required |
| Semantic authority | [Evidence System Design](../../systems/evidence/evidence-system.md), especially Query & API, lifecycle, ownership, and access sections |
| Upstream fact authority | FROZEN [Observation Catalog](../observation/observation-catalog.md) and [OTel Observation Profile](../observation/otel-observation-profile.md), wire Profile `1.0.0` |
| Machine representation | planned `system-contracts/evidence-query/` revision `0.1.0`; absent until Wave 9 |
| Shared interface candidate | `evidence-system/src/wsr_evidence/storage/read_model.py` at `af0e1086d02b3a27ab962bf0921cd749c118edfc` |
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

Opaque resource-ID bytes are deliberately implementation-private. A machine validator checks nonempty/byte bounds and black-box equality/stability vectors; it must not invent or require one delimiter, escaping, or tuple serialization for public IDs.

Every non-Trace relationship endpoint has the closed shape `{ "kind": <endpoint-kind>, "key": <owner-key> }`. Endpoint kinds are `FINDING`, `FINDING_TARGET`, `FIX`, `RECHECK`, `ROLE`, `ROLE_LINEAGE`, `SPAN`, `DELIVERY`, and `MODEL_ROLE`. `key` follows the bounded scalar-array rule for `owner_key`; endpoint kind and tuple arity/meaning are fixed by the §4 projection matrix. An endpoint is never a bare display string or an untyped array.

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

The public Projection matrix is normative. Field IDs refer to Observation Profile `1.0.0`; `?` means the field is present only when the upstream complete shape carries it. No other field or relationship is owned by that resource kind.

| Fact kind | Source | Exact `owner_key` | Projected `fields` | Exact relationship |
| --- | --- | --- | --- | --- |
| `EVENT_CONTRIBUTION` | Event | `[event_name,C09]` | every admitted field owned by that Event contribution, including explicit C17 when present; Resource/Scope and arbitrary attributes excluded | none |
| `FINDING_ASSERTION` | Event | `[C18,C51]` | C13,C14,C15,C20,C28,C29,C33,C34,C36,C37,C49,C50 | none |
| `FINDING_TARGET` | Event | `[C18,C51,C52,C53,C54-or-null]` | C18,C51,C52,C53,C54? | `FINDING_TARGET`: `FINDING:[C18,C51]` → `FINDING_TARGET:[C18,C51,C52,C53,C54-or-null]` |
| `FINDING_STATUS` | Event | `[C18,C51,C12]` | C18,C51,C12,C19,C33,C34,C36,C37 | none; every status contribution remains independent |
| `FINDING_FIX` | Event | `[C18,C51,C52,C53,C54-or-null,C21]` | C18,C51,C12,C21,C22,C33,C34,C36,C37 | `FINDING_FIX`: `FIX:[C21]` → the exact `FINDING_TARGET` tuple |
| `FINDING_RECHECK` | Event | `[C18,C51,C52,C53,C54-or-null,C23]` | C18,C51,C12,C23,C24,C25,C26?,C27,C33,C34,C35,C36,C37,C38 | `FINDING_RECHECK`: `RECHECK:[C23]` → the exact `FINDING_TARGET` tuple |
| `ROLE_LINEAGE` | Event | `[C49,C30]` | C30,C31,C32?,C49 | `ROLE_LINEAGE`: `ROLE:[C49,C30]` → `ROLE_LINEAGE:[C49,C31]`; C32, when present, remains a field rather than an inferred second edge |
| `DELIVERY_ROOT_BINDING` | Span | `[trace_id]` | C01,C06,C07,C08 | `DELIVERY_ROOT`: `SPAN:[trace_id,span_id]` → `DELIVERY:[C01]` |
| `MODEL_ATTRIBUTION` | Span | `[provider,C57,C30,C06,trace_id,span_id]` | `gen_ai.provider.name`,`gen_ai.request.model`,C57,C30,C06 | `MODEL_ATTRIBUTION`: `SPAN:[trace_id,span_id]` → `MODEL_ROLE:[provider,C57,C30,C06]` |

`MODEL_ATTRIBUTION` is a factual relationship and belongs only to `FACTUAL_PROJECTION`. The same accepted Span may also project model fields into its `NODE`; that copy is Trace detail. Expiring either class never deletes, reconstructs, or changes the other.

`compatibility` always contains all four named fields. `family_schema`, `event_name`, and `completeness` are each string-or-null; `dimensions` is always an array. `event_name` and completeness are non-null only when the source contribution carries them. Dimension membership is exact: `usage` uses C42–C45, `implementation.summary` uses I05/I08/I09/I10, `test.summary` uses C28/C29, `review.summary` and `FINDING_ASSERTION` use C13/C14, and `MODEL_ATTRIBUTION` uses `gen_ai.provider.name`/C57/C30/C06. Other kinds have no dimensions. Missing applicable coordinates omit only their dimension entries; they never remove one of the four compatibility object fields.

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

For a `NODE`, `node` has exactly `span_id`, `span_name`, `span_kind`, `start_time_unix_nano`, `end_time_unix_nano`, `span_status`, `span_flags`, `trace_state`, and `fields`. The two nanosecond values are the upstream unsigned decimal strings; `span_kind` is `INTERNAL` or `CLIENT`; `span_status` is `UNSET`, `OK`, or `ERROR`; `span_flags` is `0..4294967295`; and `trace_state` is null or the exact recorded string up to 512 UTF-8 bytes. `fields` contains at most 73 admitted Profile field IDs or standard OTel names and excludes carrier envelopes and arbitrary attributes.

For `PARENT_EDGE`, `edge` has exactly `from` and `to`. For `LINK`, it has `from`, `to`, plus optional `trace_state` and `flags` only when those values were recorded. Each endpoint has exactly `{ "trace_id", "span_id" }`. `from` is the accepted recording Span; `to` is the recorded parent or link target. Parent edges and links are returned even when `to` was never observed; Query never manufactures that node. The item discriminator is exact: `NODE` requires non-null `node` and null `edge`; both edge kinds require null `node` and non-null `edge`.

Trace expiry is resource-granular, so a bounded expiry batch may leave one Trace or one Delivery traversal partially available. The response adds `trace_summaries`, an array ordered by `trace_id`, with exactly `{ "trace_id", "state" }` for every matching accepted Trace. Per-Trace `state` is `AVAILABLE` when all retained detail is active, `PARTIAL` when active and expired detail coexist, and `EXPIRED` when accepted identity remains but no detail is active. A direct unknown `trace_id` and a Delivery with no exact root binding have no summary.

The response-level `trace_state` is required and is `ABSENT` when `trace_summaries=[]`, `EXPIRED` when every summary is expired, `AVAILABLE` when every summary is available, and `PARTIAL` for every other nonempty mixture. `items` contains only active recorded nodes/edges; expired detail never produces a marker item. `EXPIRED` and `ABSENT` have `items=[]` and `next_cursor=null`. `PARTIAL` is explicit unavailability, not permission to reconstruct missing detail.

The `/traces` success envelope therefore adds exactly `trace_state` and `trace_summaries`. The complete summary array is identical on every page of one snapshot and is not paginated because Delivery traversal is bounded to 32 Traces. `AVAILABLE` or `PARTIAL` may have an empty continuation page only after the cursor has reached the end; their initial page has at least one active item.

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

Query parameters are a closed allow-list. Repeated parameters, comma-separated lists, unknown parameters, empty values, arbitrary field selection, ASCII control bytes, and decoded value bytes `,`, `*`, `%`, or `\\` are invalid. No regex, substring, wildcard, or SQL-like operator exists; other punctuation is an exact literal rather than operator syntax.

All filters on one request are conjunctive. On `/facts`, `event_name` alone implicitly restricts results to `EVENT_CONTRIBUTION`; when `kind` is also present it must equal that value. `delivery_id` and `trace_id` may appear together and select their exact intersection. `family_schema` is an exact historical coordinate, not restricted to the two current family values. Query strings are compared as exact UTF-8 bytes with no Unicode or case normalization.

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

The first page acquires one PostgreSQL `REPEATABLE READ READ ONLY` snapshot lease. Every continuation page reads the same transaction snapshot. The opaque cursor binds the route, Contract/read-model revisions, normalized filters, limit, snapshot lease, and last emitted sort key. Cursor contents are authenticated or server-side opaque and never accepted as caller authority. Normalization sorts parameter names, inserts `limit=100` when omitted, and renders UTC timestamp filters with exactly six fractional digits and `Z`; therefore omitted limit and explicit `100`, parameter order, and equivalent UTC timestamp spellings are the same binding. A cursor request must repeat every non-cursor normalized filter from the first page; it may omit or explicitly provide the equivalent default limit.

Snapshot leases are bounded: default 60 seconds, configurable from 10 through 300 seconds; default maximum 4 concurrent leases, configurable from 1 through 8 so the approved ten-connection runtime pool retains capacity for Admission and maintenance. Expired, evicted, restarted, unknown, tampered, wrong-route, wrong-filter, wrong-limit, or wrong-revision cursors fail closed. They never restart from the newest state or silently skip to an approximate key. A client starts a new traversal explicitly.

Repeated first-page requests against the same committed database state need not reuse the same token, but return identical resources and ordering. Replaying the same valid cursor against its live snapshot returns the same page and next cursor. Concurrent Admission after snapshot acquisition is invisible to that traversal; a new first page acquired after the commit may see the newer committed state. Uncommitted or rolled-back state is never visible.

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

A syntactically invalid or authentication-failing cursor is `INVALID_CURSOR`. A structurally valid authenticated cursor whose lease is unknown, evicted, expired, or lost on restart is `CURSOR_EXPIRED`. GET with any nonempty body is `INVALID_FILTER`.

Request classification is deterministic: first match the path (`ROUTE_NOT_FOUND` for an unlisted path), then require exact GET (`METHOD_NOT_ALLOWED`), then reject a body, then negotiate `Accept`, then check service/lease availability, then normalize filters and validate the cursor. Within filter/cursor validation, non-cursor filters are validated before cursor syntax, binding, and lease lookup. The first failure in this order is the only returned error; errors never expose a partial page.

Missing `Accept` is equivalent to `*/*`. A comma-separated media range accepts the request when at least one of `application/json`, `application/*`, or `*/*` has a valid `q` value greater than zero. Media types and parameter names are case-insensitive; other parameters do not change selection. A `q` value is a decimal from 0 through 1 with at most three fractional digits; an invalid value makes only that range unacceptable. If no supported positive range remains, the result is `NOT_ACCEPTABLE`.

An empty fact result and an absent Trace return `200`; this prevents transport errors from masquerading as truth. Errors never return a partial `items` page.

Conforming negative tests prove that no query route accepts a body or write method; no route exposes Raw, accepted logical records, projection-effect names, database metadata, SQL, credentials, arbitrary attributes, a remote listener, or a consumer database path.

<a id="evidence-query-9"></a>
## 9. Shared read-model and expiry interface

Query and Retention share a stable internal semantic port, not database tables. The implementation language may represent it idiomatically, but the operations and values are fixed:

```text
acquire_snapshot(query, filters, limit, clock_now) -> SnapshotPage
continue_snapshot(cursor, clock_now) -> SnapshotPage
read_expiry(resource_class, resource_kind, owner_key, snapshot) -> ExpiryRecord | ACTIVE
plan_expiry(resource_class, policy_revision, cutoff, ttl_seconds, limit) -> ExpiryBatch
apply_expiry(batch_identity, clock_now) -> ExpiryResult
```

`SnapshotPage` contains exact Contract/read-model revisions, snapshot identity, ordered public resources, and continuation. It contains no SQL row or mutable dictionary escape hatch. `ExpiryOwner` is the exact pair of public `resource_kind` and Projection `owner_key`; owner keys are not required to be disjoint across resource kinds. `ExpiryRecord` contains resource class, the exact ExpiryOwner coordinate, policy revision, expired-at, and the minimum bounded tombstone coordinates required to distinguish expired from absent. It contains no expired value/body. `ExpiryBatch` is deterministic for one policy revision/cutoff and is idempotent by `batch_identity`.

`ExpiryRecord.source` is exactly the Event/Span source identity from §3. Its `compatibility` is an ordered bounded pair list: factual markers retain the exact §4 compatibility coordinates; a `DELIVERY_ROOT_BINDING` marker may additionally retain internal pair `delivery_id` solely so an exact Delivery traversal survives factual-detail expiry; Raw and Trace markers use an empty list. The internal pair is never emitted inside the public four-field compatibility object.

The internal values are closed:

| Value | Exact fields and bounds |
| --- | --- |
| `SnapshotPage` | `contract_revision`, `read_model_revision`, `snapshot_id`, `resources` (0..limit ordered public resources), `next_cursor` |
| `ExpiryOwner` | `resource_kind` and exact `owner_key`; `owner_key` has 1..16 bounded scalars under §4; the pair, never the bare owner key, is the expiry identity within one resource class |
| `ExpiryRecord` | `resource_class`, `owner_key`, `source`, `resource_kind`, `recorded_at`, `compatibility`, `policy_revision`, `expires_at`, `expired_at`; no value/body |
| `ExpiryBatch` | `batch_identity`, `resource_class`, `policy_revision`, `cutoff`, nonnegative integer `ttl_seconds`, and 0..1000 ExpiryOwner members in canonical ascending order |
| `ExpiryResult` | exact `batch_identity`, nonnegative `selected`, `expired`, and `already_expired` counts with `expired + already_expired = selected` |

`selected` equals the exact member count of the applied batch. Planning `ACCEPTED_PROVENANCE`, applying an unknown/mixed-class member, or finding a planned resource missing without its committed marker fails the internal operation and commits neither marker nor scrub; it never returns a partial `ExpiryResult` or an HTTP query error.

`resource_kind` is `RAW_DEBUG` for a Raw-debug owner, the public Trace kind (`NODE`, `PARENT_EDGE`, `LINK`) for Trace detail, or one of the nine public Fact kinds in §4 for factual projection. Internal projection-effect names are never port values. `MODEL_ATTRIBUTION` is valid only in `FACTUAL_PROJECTION`.

Batch canonical bytes use the versioned framing `evidence-expiry-batch-v1`. They are the UTF-8 bytes of that literal plus LF followed, without an outer container, by the scalar encodings of `resource_class`, `policy_revision`, the UTC `cutoff` rendered with exactly six fractional digits and `Z`, integer `ttl_seconds`, and the member array. A scalar encoding always ends in LF: null=`n`+LF; boolean=`b0`/`b1`+LF; integer=`i` plus canonical base-10+LF; finite number=`f` plus its IEEE-754 binary64 big-endian bits as 16 lower-case hex+LF; string=`s` plus UTF-8 byte length, colon, exact UTF-8 bytes, and LF. An array is `a` plus decimal element count+LF followed by its encoded elements. Each member is the two-element array `[resource_kind,owner_key]`; members are ordered by the bytewise lexicographic encoding of that complete array. No Unicode normalization occurs. `batch_identity` is lower-case SHA-256 hex over these exact bytes. Replanning the same inputs yields the same identity; any cutoff, TTL, kind, scalar type, value, or member change changes the canonical input. Applying the same identity again reports every previously committed member as `already_expired` without another mutation. Two resources in the same class may have equal bare owner keys; they remain independently addressable because their `resource_kind` differs.

The closed `resource_class` enum is `RAW_DEBUG`, `ACCEPTED_PROVENANCE`, `TRACE_DETAIL`, `FACTUAL_PROJECTION`.

- `RAW_DEBUG` maintenance scrubs/deletes bounded diagnostic/logical payload while retaining accepted identity/digest/profile/family provenance.
- `ACCEPTED_PROVENANCE` is immutable and has no automatic expiry operation; attempting one fails closed.
- `TRACE_DETAIL` removes only Trace nodes, parent edges, links, and their node-local field copies and writes bounded expiry markers. It never removes `MODEL_ATTRIBUTION`.
- `FACTUAL_PROJECTION` removes only factual contribution/relationship projections and writes bounded expiry markers.

The port implementation may use retention-owned tables/migrations and existing core rows, but may not rewrite the Wave3 core schema, mutate accepted identity/digest/provenance, expose storage representation to Query, or couple two resource classes in one implicit deletion. The Raw payload currently colocated with accepted identity is classified as `RAW_DEBUG`; scrubbing it is not mutation of the immutable identity/digest/profile/family tuple.

Every read uses one committed snapshot. Every expiry batch is one transaction: deletion/scrub and its expiry marker commit together or neither does. A concurrent reader sees either the complete pre-expiry resource or the complete expired representation, never a missing gap. A concurrent Admission of a distinct identity is independent. Same-identity retry continues to compare the retained digest and never recreates expired detail.

The shared clock is an injected UTC clock. Policy cutoff is computed once per batch from that clock and persisted with exact `ttl_seconds` in the batch identity. For each member, `expires_at = recorded_at + ttl_seconds`; the committed marker preserves that eligibility instant and the actual `expired_at`. Database wall clock, process uptime, file mtime, and client time are not policy authority.

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

The lifecycle base instant is `accepted_at` for `RAW_DEBUG` and Projection `recorded_at` for Trace and factual resources. A startup policy applies retroactively to every still-active resource using that immutable base: shortening or lengthening a TTL changes its displayed eligibility and later planning after restart. It never unexpires an already committed marker. An expired public Fact reports the marker's preserved `expires_at`, not a value recomputed from a later process policy; `expired_at` remains internal provenance. `NEVER` yields null public `expires_at` and no batch.

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
| partial/mixed Trace expiry | exact per-Trace summaries and response `PARTIAL`; active items only | hidden expired Trace/resource or reconstructed detail |
| parent/link with missing endpoint | recorded edge returned exactly | inferred endpoint or dropped edge |
| incompatible unit/source/completeness | separate resources/groups | conversion or cross-sum |
| stable pagination | same live snapshot/cursor yields identical page; later commits excluded | duplicate/skip/newest-state fallback |
| cursor expiry/restart/tamper | bounded typed error | approximate continuation |
| unknown filter/method/body | bounded typed error and zero state effect | permissive ignore or write route |
| concurrent expiry/read | whole pre-expiry or whole expired view | transient absence without tombstone |
| equal owner key across two resource kinds | independently planned/read/applied by exact ExpiryOwner pair | collision, winner selection, coupled expiry, or fail-on-valid-data |
| batch digest vector and policy restart | exact framed bytes/TTL/base instant and preserved expired eligibility | language-local JSON digest or recomputed marker under later policy |
| same-identity retry after expiry | digest-based duplicate/conflict; no detail recreation | accepted payload rehydration |
| listener/database boundary | loopback API only; no external PostgreSQL/consumer credential | remote listener or direct SQL path |

Semantic review reopens this candidate if any field, enum, default, error, endpoint, ordering, or ownership rule remains a choice for Wave7/8/9; if a stable snapshot requires changing the Wave3 core transaction/schema; if expiry requires rewriting accepted identity/provenance or coupled deletion; or if an implementation requires a new dependency, formula, inference, authentication, remote exposure, or non-factual data.
