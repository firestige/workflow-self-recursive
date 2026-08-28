# Evidence Delivery Manifest Projection — Design Candidate

> **Status:** Iteration 5 cross-system Contract candidate, 2026-08-28. It extends the Profile 2 Task-binding and Evidence Query candidates; it does not modify the published Profile 1.0 or Evidence Query 0.1 Contracts. Chinese tracking companion: [`delivery-manifest-projection.zh-CN.md`](delivery-manifest-projection.zh-CN.md).

## 1. Purpose and authority chain

Evolution needs a portable historical reading that identifies the exact Workflow Package/Snapshot and admitted Role-to-model-selection bindings for each Delivery. Execution's persisted Delivery Manifest remains admission authority. Evidence stores an evidence-safe projection of that Manifest from the same M01-owned `task.binding` record that declares Task membership.

```mermaid
flowchart LR
    M["persisted Delivery Manifest"] --> B["one M01 task.binding record"]
    B --> A["Evidence atomic admission"]
    A --> T["Task declaration + membership"]
    A --> P["Delivery Manifest projection"]
    P --> Q["exact manifest-digest query"]
    Q --> E["Evolution source resolution"]
```

Evidence does not read Execution files or Workflow sources. The projection does not replace the full Manifest, authorize recovery, or prove that a model call occurred. Model-call Spans remain authority for actual C30/C57 use.

## 2. Carrier revision

Observation Profile `2.0.0` changes its `task.binding` carrier as follows:

- the OTLP LogRecord body remains empty;
- one required closed attribute, `agentops.delivery.manifest_projection`, contains canonical JSON;
- one required attribute, `agentops.delivery.manifest_projection_digest`, is lowercase SHA-256 over those exact UTF-8 canonical JSON bytes;
- C01 Delivery ID, C02 Task ID, C07 full Manifest digest and C09 Event ID are required; optional C58 carries Task display name;
- Profile 2 requires direct C01 on every supported Event and Span, and admission records internal record-to-Delivery membership so retention never infers ownership from Trace correlation or timestamps;
- the record is produced only from the already persisted Manifest and its exact Workflow Snapshot; Workflow-ID prefixes, event names, timestamps, source URLs, and ambient configuration cannot select or suppress this projection.

`C09` is deterministic and retry-stable: `task-binding-` plus the first 24 lowercase hexadecimal characters of `SHA-256(UTF-8(delivery_id))`. The same persisted Delivery/Manifest always re-emits the same Event identity and canonical content after transport retry or recovery; C09 is never random or regenerated from time.

The canonical projection is at most 64 KiB UTF-8 and contains at most 128 Role entries, matching the candidate Package/admission bound. Oversize is an admission/configuration failure before Runner effect; it is never truncated. Unknown fields and duplicate JSON members are rejected.

## 3. Closed portable shape

```json
{
  "schema_version": "execution.delivery-manifest-projection@1.0.0",
  "delivery_id": "delivery-…",
  "task_id": "task-…",
  "manifest_digest": "<sha256>",
  "workflow": {
    "package_name": "workflow-package",
    "exact_package_version": "2.0.0",
    "package_digest": "<sha256>",
    "workflow_id": "workflow.system-design",
    "workflow_version": "2.0.0",
    "snapshot_id": "workflow.system-design@2.0.0:<sha256>",
    "snapshot_digest": "<sha256>"
  },
  "repository_model_bindings": {
    "document_state": "PRESENT",
    "document_digest": "<sha256>",
    "resolved_map_digest": "<sha256>"
  },
  "roles": [
    {
      "role_id": "role.architecture-reviewer",
      "role_prompt_identity": "prompt.role.architecture-reviewer",
      "role_prompt_digest": "<sha256>",
      "agent_provider_id": "provider.dsh",
      "model_provider_id": "deepseek-official",
      "model_id": "deepseek-reasoner",
      "resolution_source": "REPOSITORY"
    }
  ]
}
```

Rules:

- `delivery_id`, `task_id`, and `manifest_digest` exactly equal C01, C02, and C07;
- Package, Workflow, Snapshot, Role, prompt, Agent Provider, LLM provider-route, and model identities are exact admitted identities, never display labels;
- `document_state` is `ABSENT` or `PRESENT`; the document digest is absent only for `ABSENT`;
- `resolution_source` is exactly `REPOSITORY` or `EXECUTION_DEFAULT`;
- Role entries are unique and bytewise sorted by `role_id`; the set equals all Agent-action Roles admitted for this Workflow Snapshot;
- credentials, credential references, endpoint, source URL, local path, Task prompt/attachments, tool content, and Provider-native configuration are prohibited;
- `manifest_digest` identifies the full persisted Manifest; `manifest_projection_digest` identifies this portable projection. They are distinct and cannot substitute for each other.

On every Manifest read, Evolution validates the closed Agent Provider/LLM-route/model entry shape and recomputes `resolved_map_digest` from the Manifest entries alone; failure is an internal projection incompatibility. When external Workflow content is available, Evolution may compare only the exact Role set and Role-prompt identity/digest as an enrichment-integrity check. That external mismatch is recorded as a bounded source diagnostic and cannot change a settled Metric Result. External content is not a second authority over this immutable Evidence projection. An internal projection shape/digest conflict or a projection-to-membership identity conflict makes the dependent reading `INCOMPATIBLE`.

## 4. Atomic Evidence projection

One accepted `task.binding` record atomically creates or validates all five effects:

1. `TASK_DECLARATION(task_id)`;
2. `DELIVERY_TASK_MEMBERSHIP(task_id, delivery_id, manifest_digest)`;
3. `DELIVERY_TASK_GUARD(delivery_id -> task_id, manifest_digest)`;
4. optional `TASK_DISPLAY_NAME(task_id -> display_name)`;
5. `DELIVERY_MANIFEST(manifest_digest -> canonical projection, projection_digest)`.

Any schema, identity, digest, duplicate, or conflict failure rejects the whole record. Evidence can never expose membership without the matching Manifest projection or vice versa. An identical retry is a duplicate; the same Manifest digest with different projection bytes is a conflict. These projections never expire even if dependent Facts or Traces expire.

Task display metadata is immutable in Iteration 5. `NEW_TASK` may supply one non-empty display name; every `REUSE_TASK` omits it. A later absent name is a no-op, the same non-empty name is idempotent, and a different non-empty name is a producer conflict that rejects that malformed owner record. Iteration 5 exposes no rename mutation. This does not endanger legal reuse because the closed reuse request cannot carry a display name.

## 5. Task discovery and membership query

The existing `evidence.query@1.0.0` Task candidate is part of this chain:

- `GET /v1/evidence/tasks?limit=<1..200>&cursor=...` lists Task IDs, optional immutable display names, and accepted provenance in bytewise Task-ID order;
- `GET /v1/evidence/tasks?task_id=<exact>&as_of=<normalized-UTC-RFC3339>&limit=<1..200>&cursor=...` returns exact Delivery membership with `manifest_digest`, immutable `recorded_at`, and accepted provenance;
- `recorded_at <= as_of` is the membership cutoff predicate; arrival order carries no causality;
- each traversal has its own repeatable-read snapshot/cursor binding. Later commits are excluded from that traversal, but no Task/Fact/Trace global snapshot is created;
- every returned membership has a matching non-expiring Manifest projection from the same accepted record transaction.

BI uses list mode for human selection. Evolution uses exact membership mode for the side's declared logical `as_of`; it never computes membership from the list response or display name.

## 6. Exact Manifest query

Evidence Query `1.0.0` adds:

```http
GET /v1/evidence/manifests?manifest_digest=<exact-lowercase-sha256>
```

The request has exactly one required parameter, no body, no pagination, no fuzzy lookup, no list mode, and no latest/version fallback. Success returns exactly one closed projection plus accepted provenance (`accepted_digest`, exact profile version, source) and its projection digest. Missing returns typed `NOT_FOUND`; conflicting stored content is an integrity error, never an arbitrary winner.

The route is independent of Fact and Trace traversal snapshots and adds no cross-route snapshot Oracle. Query 1.0 ordinary routes expose only active Delivery datasets. When terminal Delivery TTL expires, the Manifest, membership, Facts and Trace detail leave ordinary query atomically; exact Manifest lookup then returns `NOT_FOUND`. [`delivery-observation-lifecycle.md`](delivery-observation-lifecycle.md) owns the physical-deletion semantics.

## 7. Evolution use

For every Task membership, Evolution queries the exact Manifest digest and verifies Delivery/Task equality. It uses Package/Snapshot coordinates to resolve Workflow content from its ordered configured sources and uses each observed C30 Role to select the exact Role prompt. It uses the Manifest role map as admitted configuration and C30/C57 Spans as actual-use Facts.

The Manifest projection itself supplies the immutable event-time Role-template cohort coordinate: Workflow Snapshot identity/digest plus exact Role-prompt identity/digest. Metric calculation does not require external prompt bytes. Missing/invalid Manifest projection makes only dependent evaluation units unavailable/incompatible according to the Metric Catalog. Missing Workflow source content makes readable template detail/enrichment unavailable but does not change a settled Metric Result or erase unrelated Fact/Trace metrics.

## 8. Required conformance

Fixtures must prove atomic success/rejection, exact canonical digest, deterministic C09 retry/recovery, duplicate/conflict behavior, C01/C02/C07 equality, direct C01 association for every Profile 2 record, absent/present repository state, role sort/uniqueness/Snapshot cross-check, secret/path/endpoint rejection, oversize rejection, exporter byte-bound splitting with a near-limit single record, active-only exact Task/Manifest queries, atomic Delivery deletion, Task display-name immutability/fallback, and no Workflow-prefix or timestamp inference.
