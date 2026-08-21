# Agent Ops Workflow Definition DSL — Contract Surface

> **Status: FROZEN and published.** Contract revision: `agentops.workflow-dsl@1.0.0`. This revision incorporates the [#77 Contract-owner decision](https://github.com/firestige/workflow-self-recursive/issues/77#issuecomment-5363955531), passed contract.gate.1–6, and received [explicit Contract-owner approval](https://github.com/firestige/workflow-self-recursive/issues/77#issuecomment-5365978215). The exact publication binding is recorded in `system-contracts/workflow-dsl/publication/publication-record-1.0.0.json`.
>
> **Normative language: English.** [`workflow-definition-dsl.zh-CN.md`](workflow-definition-dsl.zh-CN.md) is a non-normative wholesale translation. English changes invalidate the prior translation evidence.
>
> **Ownership.** This document owns the portable Workflow Definition Contract. Its normative JSON Schemas, minimal Package/Snapshot, checker, canonicalization helper, and executable fixture corpus live in [`system-contracts/workflow-dsl/`](../../../system-contracts/workflow-dsl/). `workflow-package/` contains first-party consumers, not a second Contract authority.

## 1. Scope and authority

| Field | Value |
| --- | --- |
| Contract revision | `agentops.workflow-dsl@1.0.0` |
| Lifecycle | `FROZEN`; published; `conformance_claim=DEFINITION_AND_VALIDATOR_ONLY` |
| Upstream authority | [`workflow-composition-model.md`](../../workflow-composition-model.md), [`agent-architecture.md`](../../agent-architecture.md), the two first-party Workflow semantic documents, and #77's latest owner decision |
| Machine representation | `system-contracts/workflow-dsl/` at the exact same revision |
| This Contract owns | portable Definition fields, graph/dataflow closure, Action/Role/Route authority, Package/Snapshot identity, canonicalization, typed Runtime event ports, and conformance inputs/oracles |
| Runtime owns | scheduling, persistence, attempt creation, retry execution, checkpoint storage, continuation restoration, provider adaptation, budget accounting, and terminal settlement |

The Contract defines what an admitted Runtime must preserve. It does not implement a Runtime. The included fixture runner is a test harness for the abstract operations used by the corpus; it is not a scheduler, persistence engine, retry engine, continuation store, or settlement engine.

### 1.1 Layer separation

| Layer | Mutability | Owner | Portable content |
| --- | --- | --- | --- |
| Workflow Definition | versioned | Package owner | graph, Actions, Roles, Routes, Artifact declarations, validators, budgets, Wait declarations, event edges |
| Workflow Package Snapshot | immutable per Delivery | admission/configuration identity authority | exact Package/Definition/document/resource/route/graph identities and digests |
| Workflow State | mutable per Delivery | selected Runtime | current graph node, Action invocation/attempt facts, results, Artifact refs, budgets, pending Wait, terminal proposal |
| Workflow Implementation | Runtime-private | selected Runtime | compiled graph, native callbacks/checkpoints/sessions |

Definition and Snapshot contain no provider-native checkpoint, session, invocation, or attempt identity. Runtime replacement must not change their portable semantics.

## 2. Normative document and schema set

A Package index names six Definition documents. A Snapshot is produced separately at admission.

| Kind | Typical file | Normative schema |
| --- | --- | --- |
| `agentops.package` | `package.json` | `schemas/package.schema.json` |
| `agentops.workflow-definition` | `workflow.json` | `schemas/workflow-definition.schema.json` |
| `agentops.actions` | `actions.json` | `schemas/actions.schema.json` |
| `agentops.roles` | `roles.json` | `schemas/roles.schema.json` |
| `agentops.routes` | `routes.json` | `schemas/routes.schema.json` |
| `agentops.artifacts` | `artifacts.json` | `schemas/artifacts.schema.json` |
| `agentops.validation` | `validation.json` | `schemas/validation.schema.json` |
| `agentops.workflow-package-snapshot` | admission output such as `snapshot.json` | `schemas/package-snapshot.schema.json` |

`schemas/agentops.meta.schema.json` is the ninth normative schema and supplies shared closed definitions. All documents use JSON Schema draft-07 and `additionalProperties: false` at every portable object boundary.

## 3. Identity, canonicalization, Package digest, and Snapshot

### 3.1 Canonical JSON

Canonicalization is defined over parsed JSON values with numbers represented as IEEE-754 binary64 values:

1. every string and object member name must contain Unicode scalar values; lone UTF-16 surrogates are rejected;
2. object member names are sorted by ascending UTF-16 code-unit sequence, matching ECMAScript `Array.prototype.sort` without a comparator;
3. array order is preserved exactly;
4. strings, finite numbers, booleans, and `null` use ECMAScript `JSON.stringify` serialization; this includes its exponent spelling, and negative zero is encoded as `0`;
5. non-finite numbers, `undefined`, functions, and other non-JSON values are rejected;
6. no whitespace is emitted.

A non-ECMAScript implementation must reproduce those exact UTF-16 ordering and binary64 serialization rules; it must not substitute Unicode code-point order, arbitrary-precision number serialization, or host-default map order.

`canonical_digest(value) = "sha256:" + lowercase_hex(SHA-256(UTF-8(canonical_json(value))))`.

Array order is semantic wherever declaration order is named by this Contract. Object member order is never semantic.

### 3.2 Package digest

`package.digest` is the canonical digest of the complete Package index after omitting only `package.digest`. The Package digest therefore binds the document paths, resource index, authority declaration, environment requirements, compatibility range, and Definition content identity without a self-reference.

`package.definition.contentIdentity` is separately the byte SHA-256 of the declared Workflow document. A mismatch in either digest rejects admission.

### 3.3 Snapshot content

The Snapshot binds:

- Snapshot identity and canonical digest;
- exact Package name/version/digest;
- exact Definition identity/version/content identity;
- the six document kinds and byte content identities;
- every owned/referenced resource identity, ownership class, and content identity;
- every `Action → Role → Route` binding;
- graph node, typed event-edge, and terminal identities;
- the canonical authority order and merge proof;
- the portable continuation binding vocabulary;
- `noAmbientFallback=true` and `allBindingsExact=true`.

The Snapshot digest is its canonical digest after omitting only `snapshot.digest`. State cannot rewrite a Snapshot. Any changed binding produces a new Snapshot for a new authorized Delivery.

### 3.4 Portable continuation binding vocabulary

Every applicable checkpoint binds the following exact portable facts:

`delivery | snapshot | graphNode | action | attempt | inputBindings | artifactBindings | branchResults | budgets | pendingWait`

`action` is the applicable Action identity, including a branch or aggregator Action when relevant. Provider checkpoint/session types are forbidden. The Snapshot records this vocabulary and the Definition declares it on applicable checkpointed nodes; the Runtime owns actual values and storage.

## 4. Action, Role, Route, and authority

### 4.1 Action is a reusable task template

Every Action declares `id`, `name`, `purpose`, `resultSchema`, `responsibleAuthority`, and `gate`; `inputSchema`, `allowedRoutes`, and `escalation` are conditional fields.

There are exactly two Action authority shapes:

| Shape | Required authority | Agent binding |
| --- | --- | --- |
| Agent Action | `{kind:"role", role:<exact Role>}` | one or more allowed Routes, all carrying that same one responsible Role |
| deterministic Action | `{kind:"runtime", validator:<exact deterministic validator>}` | no Role and no `allowedRoutes` |

An Action never carries graph position, parallel branches, join configuration, Wait target, recovery target, successor set, invocation identity, or attempt identity. Each actual invocation inherits only the intersection of its Action envelope, its one Role envelope when applicable, and its selected allowed Route.

### 4.2 Role and Route

A Role declares stable responsibility, a closed Workflow authority concern set, Artifact/result write custody, prohibitions, and optional independence requirements. Write custody is not a filesystem or provider permission grant.

A Route binds one Role to exact Agent definition, Role prompt, Action prompts, Skills, model, tools, Driver, session intent, and Workflow data-access intent. A Route is admissible for an Action only when:

1. the Route is listed in that Action's `allowedRoutes`;
2. the Route Role equals the Action's one responsible Role;
3. every resource is declared with the exact required kind and content identity;
4. managed projection is required;
5. the Route, Prompt, Skill, model, tool, Driver, or session cannot expand Action/Role authority.

Provider tool visibility and native side-effect authorization remain Runtime/Adapter concerns.

### 4.3 Canonical instruction merge

The only admissible authority order is:

```text
workflow_action → role_prompt → action_prompt → skill → artifact_user
```

The merge algorithm collects the Route's exact instruction resources in that order, separately binds model/tool/Driver/session dependencies, intersects the Action and Role envelopes, verifies Route authorization and resource closure, and emits an immutable merge proof. It changes no resource bytes and grants no provider permission. Missing or contradictory bindings fail closed.

## 5. Graph and control routing

### 5.1 Node kinds

The closed node vocabulary is:

`action | parallel | wait | wait-renewal | recovery | cleanup`

Ordinary edges contain only `{id, from, to}`. `to` is an exact node identity or `terminal:<exact terminal identity>`. A node without `routing` has at most one ordinary success successor; explicit fan-out is represented only by a parallel node. A node with `routing` has no ordinary edge. `wait` and `wait-renewal` nodes have no ordinary outgoing edge because their successful continuation is recorded rather than user-configurable. Exception handling uses typed event edges (§7), never Action targets.

### 5.2 Action node

An Action node declares `{id, kind:"action", action}` plus optional `budget`, `checkpoint`, `continuationSource`, and `routing`. It binds one graph position to one reusable Action.

A recovery node declares required `{id, kind:"recovery", recovery}` and optional `action`, `budget`, `checkpoint`, and `continuationSource:true`. `recovery` references one declared recovery policy; optional `action` names explicit recovery work but never a continuation target.

A cleanup node declares required `{id, kind:"cleanup", disposition, action}` and optional `budget` and `checkpoint`. `disposition` is `cancellation | failure | continuation`; `action` is the ordinary Action that performs the cleanup under its own authority. Cleanup closure remains constrained by §7.3.

### 5.3 Strict deterministic result routing

Mechanical branching is produced by a deterministic Action/validator as a top-level strict JSON boolean or closed enum property. A deterministic `routing` declares:

```json
{
  "kind": "deterministic",
  "output": "routing",
  "cases": [
    {"value": "accept", "target": "node.accept"},
    {"value": "revise", "target": "node.revise"}
  ]
}
```

The checker proves that `output` is a top-level property of the producing Action's `resultSchema` and that it is boolean or a closed enum. The `cases` form a total single-valued mapping over that closed result vocabulary: every allowed boolean/enum value appears exactly once, while different values may target the same node. An inline result schema is inspected directly. A referenced result schema used for routing must resolve to exact declared `schema` resource bytes, pass its content digest, and be materialized for admission; unavailable or non-JSON bytes fail closed without ambient fetching. Missing, duplicate, or extra case values reject admission. Missing, malformed, type-mismatched, or out-of-set Action result values fail the producing attempt. The Runtime does not coerce, traverse arbitrary JSON paths, compare objects/arrays, or treat malformed output as `false`.

### 5.4 Semantic routing and the internal Planner

Semantic routing exposes only user-owned business branches and one built-in fallback selection:

```json
{
  "kind": "semantic",
  "branches": [
    {"id": "branch.a", "meaning": "...", "target": "node.a"},
    {"id": "branch.b", "meaning": "...", "target": "node.b"}
  ],
  "fallback": {"kind": "question", "target": "node.ask"}
}
```

The Runtime-internal Planner is a strict `N → 1` closed-set classifier over the N declared, locally unique business branch IDs plus the selected built-in fallback. Duplicate branch IDs reject admission. The Definition does not expose classifier prompt, Planner Action, provider protocol, `proposalSchema`, `allowedTargets`, generic predicate, `ALL|SELECTED`, or invalidation algorithm.

- a successful classification returns exactly one declared branch ID;
- multiple plausible branches still produce one ID;
- business inability to classify selects the built-in fallback;
- an out-of-set/malformed response is an execution-format failure, not fallback;
- transient provider/Driver/format failure may retry the exact classifier invocation within budget;
- exhausted retry budget settles through `budget-exhausted` to `INCOMPLETE`;
- deterministic non-retryable configuration failure settles through `nonretryable-failure` to `FAILED`.

Semantic-routing nodes form the portable Planner invocation graph. Self-cycles and mutual cycles among those classifier invocations reject admission. This is a static graph check, not a Planner implementation.

## 6. Parallel nodes, immutable results, and join

### 6.1 Parallel is graph composition

A parallel node declares:

- `id`, `kind:"parallel"`;
- at least two `branches[]`, each `{id, action, required:true}`;
- positive integer `maxConcurrency`;
- exactly one `join`;
- optional `budget`, `checkpoint`, `continuationSource`, and post-join `routing`.

The node has no Action, Role, Route, or responsible authority. Every branch references a separately declared Action. Runtime invocation/attempt identities are private and cannot appear in the Definition.

All MVP branches are required. There is no optional-branch switch, dynamic branch creation, `ALL|SELECTED` activation, or completion-order semantics.

### 6.2 Barrier and branch result invariants

The join's barrier is intrinsic and closes only when every declared branch has exactly one current, admitted, successful result for the current input binding. `FAILED`, `INCOMPLETE`, `CANCELLED`, malformed, stale, duplicate-current, or unadmitted outcomes are not join inputs.

Each branch result is immutable, owned by its branch Action authority, and carries independent identity/lineage. Branches do not share-write Workflow State, another branch result, or the aggregate output. Wall-clock completion order affects no result map, digest, route, or authority.

An exact failed branch invocation may be retried while other still-current successful results are reused. There is no full-rerun mode; rerunning all branches means separately scheduling all relevant exact invocations.

### 6.3 Closed join union

| Join | Input | Producer/owner | Output |
| --- | --- | --- | --- |
| `collect` | complete branch-ID → result-reference collection | deterministic Runtime join operator under the parallel node identity | new map of references; bodies are not copied or interpreted |
| `reducer` | each branch Action's entire decoded JSON result payload | deterministic Runtime join operator under the parallel node identity | one new reduced result |
| `aggregator` | complete read-only branch result map | explicitly referenced ordinary aggregator Action, using only its own Action/Role/Route authority | one new aggregator-owned Artifact/result |

An aggregator inherits no branch authority, changes no branch identity/owner/provenance/disposition, and grants nothing back to branches. Natural-language Review/Finding/domain-priority aggregation must use an explicit aggregator Action.

### 6.4 Reducer vocabulary and exact rules

The closed reducers are:

| Operator | Entire branch payload type | Rule |
| --- | --- | --- |
| `sum|min|max` | JSON safe integer in inclusive `[-9007199254740991, 9007199254740991]` | read in branch declaration order; every `sum` intermediate and final value must remain safe |
| `all|any` | strict JSON boolean | read in branch declaration order; no coercion |
| `set-union` | array of non-null JSON scalars; numeric members must be safe integers | read branches in declaration order and members in array-index order; deduplicate by JSON type + exact value, preserving first occurrence |

The branch set is non-empty. Type mismatch, missing current result, duplicate current result, unadmitted result, or safe-integer overflow fails the whole join as non-retryable `FAILED`; no partial output is produced. A required object-field projection must be a separate deterministic Action or the join must use an aggregator.

## 7. Runtime continuation and typed event edges

### 7.1 Internal continuation has no user target

The following restore the exact recorded continuation and expose no configurable target:

- retryable Action or internal Planner failure;
- an authorized answer matching a pending Wait;
- crash/process recovery from an exact checkpoint;
- retry of one exact parallel branch invocation.

A stale, mismatched, or duplicate Wait answer is rejected with no State effect and the Wait stays pending. If restoration begins and the continuation is missing, corrupt, expired, or binding-mismatched, the source emits `continuation-invalid`.

### 7.2 Typed Runtime event vocabulary

Every event edge is `{id, from, event, to}` and references graph/terminal identities only.

| Event | Exact source applicability | Compatible targets |
| --- | --- | --- |
| `budget-exhausted` | exactly every node with a bound budget, plus every `wait-renewal`; forbidden otherwise | ordinary/parallel/recovery → Wait, recovery, or `incomplete` terminal; wait-renewal → `incomplete`; cancellation cleanup → `cancelled`; failure/continuation cleanup → `failure` |
| `wait-expired` | exactly every `wait`; forbidden otherwise | expiry-handling action/recovery, same-logical-Wait renewal, or `incomplete` terminal |
| `cancelled` | every non-terminal node | ordinary source → cancellation cleanup or `cancelled`; cancellation cleanup → `cancelled`; failure/continuation cleanup → `failure` |
| `nonretryable-failure` | every Action, parallel deterministic operator/join, wait-renewal, recovery effect, and cleanup; forbidden on pure Wait | ordinary source → failure cleanup or `failure`; cancellation cleanup → `cancelled`; failure/continuation cleanup → `failure` |
| `continuation-invalid` | exactly every node marked as a possible resume/restore/recovery source; forbidden on cleanup and other nodes | continuation/failure cleanup or `failure` terminal |

Each applicable `(source,event)` has exactly one edge. Missing, duplicate, prohibited, unknown-target, or incompatible-target edges reject admission. Normal success/business routing cannot use event ports.

### 7.3 Cleanup closure and sticky disposition

Cancellation cleanup can reach only `cancelled` terminals. Failure and continuation cleanup can reach only `failure` terminals. Cleanup failure, cancellation, or budget exhaustion appends evidence but cannot change the original disposition or start an unbounded cleanup cycle. A cleanup `budget-exhausted` edge terminates directly according to the sticky disposition.

A `nonretryable-failure` path in the current Delivery cannot reach a node that schedules the original failed Action or deterministic operator again. Restoring that capability requires corrected configuration/environment and a new authorized Delivery.

Runtime disposition and terminal kind are distinct layers: `INCOMPLETE` is settled only by an `incomplete` terminal, `FAILED` only by `failure`, and `CANCELLED` only by `cancelled`.

### 7.4 Wait and bounded renewal

A Wait declaration carries `id`, `kind`, `purpose`, exact answer schema when applicable, and correlation rules requiring stale/duplicate rejection. It carries no trigger/resume/restart Action target.

A `wait-renewal` node references the same logical Wait and declares nonnegative `maxRenewals`. The initial count is `0`. When `count < maxRenewals`, successful renewal atomically increments persisted count, creates a new request identity/version, preserves the continuation, and deterministically returns to the same Wait. This built-in return is not a user-reconnectable event edge.

When `count >= maxRenewals`, no request is created; the renewal node emits its sole `budget-exhausted` edge to an exact `incomplete` terminal. `maxRenewals=0` means no renewal after the first expiry.

## 8. State, budget, recovery, terminal, and Artifact fields

### 8.1 Workflow State declaration

`state.fields[]` declares name, closed JSON-oriented type, optional items/schema, requiredness, and description. It does not declare shared-write reducers. The removed `overwrite`, `append`, `merge`, `keepFirst`, custom reducer, writer precedence, last-write-wins, parallel append, and shallow-merge fields are invalid.

Mutable Workflow State is Runtime-owned. Parallel branch data crosses the barrier only through immutable result identities and the declared join.

### 8.2 Budget

A budget declares exact identity, resource dimension (`time|tokens|context|custom`), custom name when applicable, a content-addressed deterministic evaluator registration, and accounting meaning. Numeric limits remain admitted project/runtime policy. The graph node binds the budget; its exact `budget-exhausted` edge owns the target. A budget never relaxes a Gate.

### 8.3 Recovery

The portable recovery policy vocabulary is `continue | checkpoint-recovery | intervene | fail`, always with `noBlindReplay:true`. Recovery declares no Action target or generic predicate. Exact continuation/checkpoint bindings are revalidated before effect.

### 8.4 Terminal

Terminals declare exact `id`, `kind`, `meaning`, optional validators, and checkpointed-proposal behavior. `kind` is `success|failure|incomplete|cancelled|custom`; standard Runtime dispositions use only their compatible standard kinds. Multiple terminals may share the same kind.

### 8.5 Artifact

Artifacts remain immutable versioned outputs/intermediates with real inline template content or an exact resource reference, lifecycle, optional section coverage and dependency validity, and exact producing/consuming Actions. A parallel node itself cannot acquire Agent authority or mutate branch-owned Artifacts.

## 9. Final machine fields

The JSON Schemas are normative. This catalog lets a downstream reader derive their organization without guessing.

### 9.1 Package index

Required top-level fields: `kind`, `schemaVersion`, `package`, `documents`, `resources`, `authority`, `compatibility`; `environmentRequirements` is optional.

`package` requires `name`, `version`, `digest`, `purpose`, `status`, `ownership`, and `definition`; `admissibility` is optional. `documents` names exactly Workflow/Actions/Roles/Routes/Artifacts/Validation. Resources form disjoint `owned` and `referenced` arrays. Authority order is constant and conflict mode is `fail-closed`.

### 9.2 Workflow document

Required: `kind`, `schemaVersion`, `workflow`, `state`, `graph`. Optional: `waits`, `budgets`, `recovery`, `handoffs`, `consumedHandoffs`.

`graph` requires `start`, `nodes`, `edges`, `eventEdges`, and `terminals`. Node-specific fields are closed by the node-kind union in §5–§7. Handoffs preserve upstream semantic-only authority and byte-faithful downstream consumption; they cannot carry downstream Action/Gate/Wait/terminal control.

### 9.3 Action/Role/Route/Artifact documents

- Actions use §4.1's two authority shapes and contain no graph composition or Runtime-private identities.
- Roles contain responsibility, authority boundary, and optional independence.
- Routes contain exact Agent/resources/session/access projections and never grant provider permission.
- Artifacts contain exact template, lifecycle, dependency validity, producer, and consumers.

### 9.4 Validation document

`validators[]` declares deterministic inputs/outputs. `aggregation[]` binds a parallel node to its explicit aggregator Action and rule. `review[]` binds each lens to its real branch Action and admitted Finding shape.

Every `conformance[]` entry is:

```json
{
  "id": "conf.example",
  "class": "positive | negative | recovery",
  "meaning": "optional human-readable source intent",
  "input": {"operation": "..."},
  "trace": [{"event": "..."}],
  "oracle": {"disposition": "..."}
}
```

Free-string `scenario/preconditions/expected` fields are invalid. The normative schema closes the small abstract operations admitted by the current corpus. Expanding it into production scheduling/persistence semantics is outside this Contract revision.

### 9.5 Snapshot document

The Snapshot fields and digest are exactly those in §3.3. It is not listed in `package.documents` because it is admission output, not author-owned Definition input.

## 10. Package closure and admission checks

Admission rejects unless all are true:

1. Package plus six documents parse and validate at the exact Contract revision;
2. all local identities are unique and every reference resolves with the expected kind;
3. owned resource bytes match content identities; referenced resources have exact comparable locators/identities;
4. Package Definition byte digest and canonical Package digest match;
5. graph start/targets, parallel branch Actions, join Action, routing result vocabulary, Wait/budget/recovery bindings, typed event ports, and terminal compatibility close;
6. semantic Planner invocation graph has no self/mutual cycle;
7. Action→Role→Route authority, instruction resource bindings, aggregator ownership, and review Action ownership close;
8. Snapshot document/resource/route/graph/authority bindings, merge proof, and canonical digest match;
9. forbidden Runtime/provider-native fields are absent;
10. positive, negative, and recovery fixture classes are present and their executable trace/oracle checks pass.

There is no ambient fallback or substitution on mismatch.

## 11. Conformance and fixture-harness boundary

| Level | Subject | Required evidence |
| --- | --- | --- |
| Document | one JSON document | normative schema pass |
| Package | Package + Definition closure + Snapshot candidate | checker pass, exact digests, executable positive/negative/recovery fixtures |
| Runtime | selected implementation in a later implementation lifecycle | preserves the admitted Definition/Snapshot and passes the applicable Contract corpus without native identity leakage |

The checked-in corpus runner evaluates only the abstract inputs declared by current fixtures and compares produced trace/oracle values. Runtime conformance requires later Runtime/Execution evidence; this Contract repository does not supply it.

No physical conformance claim is allowed while the revision is `REVIEW_CANDIDATE` or unpublished.

## 12. Version and compatibility

- `agentops.workflow-dsl@0.1.0` is `NON_RESOLVING_LEGACY_HISTORY_ONLY`.
- `agentops.workflow-dsl@1.0.0` is the first-release candidate and remains non-resolving until frozen publication.
- one Delivery binds one exact Snapshot and Contract revision;
- same identity with different content fails closed;
- aliases such as `latest` may be used only before resolution and never appear in a Snapshot;
- semantic change, closed-vocabulary change, removed field, changed authority, changed graph/event compatibility, or changed canonicalization requires a MAJOR revision;
- optional backward-compatible additions may use MINOR; non-semantic corrections may use PATCH.

SemVer never authorizes a Runtime to widen an admitted exact binding implicitly.

## 13. First-party migration obligations

The two first-party Definitions are Contract consumers and must pass the same schema/checker rules:

- System Design retains `node.sd-09` as a parallel node, removes nominal `action.sd-09`, creates distinct Problem–Solution, Architecture, and Quality & Acceptance Reviewer Actions, and retains `action.sd-10` as explicit Finding Aggregator;
- Implementation moves its multi-lens/multi-owner parallel work to graph parallel nodes with distinct branch Actions and explicit join ownership;
- every old generic predicate is replaced by a producing deterministic Action's top-level strict boolean/closed-enum result routing, or by semantic routing when meaning requires the internal Planner;
- Wait/retry/crash targets are removed in favor of recorded continuation and exact typed event edges;
- generator output must be byte/digest reproducible and the missing System Design `resources/runtime-custodian.role.md` boundary resource must resolve without creating an Agent Role.

These migrations prove consumer expressibility. They do not implement or test the production Runtime planned for later iterations.

## 14. Portable Builder projection

A visual Builder may render Action, parallel, Wait, renewal, recovery, cleanup, and terminal nodes plus normal and typed event ports. It must generate the same portable JSON and is validated by the same schemas/checker. It is an authoring projection, not a semantic or authority owner.

## 15. Forbidden portable fields

Definition, Package, and Snapshot reject Runtime/provider-native identities and APIs, including representative tokens:

`stategraph | langgraph | langgraph.json | checkpoint_id | thread_id | memorysaver | sqlitesaver | invocationId | attemptId | providerCheckpoint | sessionId`

They also reject the removed user surfaces:

`predicate field/op/value | JSON-path routing | shared State reducer | writer precedence | last-write-wins | parallel append | shallow merge | Action execution.mode=parallel | per-branch Role | optional branch | implicit aggregator | resumeAction | restartAction | targetActionId | ALL | SELECTED`

## 16. Change discipline

This candidate is limited to #77's owner decision and pre-existing English authorities. A reviewer may report contradictions, schema companion defects, Runtime implementation concerns, or enhancements, but only authority-linked blockers and schema companion defects may change the current candidate without owner review. Any new required identity, event, Artifact kind, admission condition, or normative obligation needs an exact authority citation and a new publication candidate binding.
