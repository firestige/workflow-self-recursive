# Agent Ops Workflow Definition DSL — Contract Surface

> **Status: REVIEW_CANDIDATE, not published, no conformance claims.** This document is the **DSL surface of the Workflow Contract** deferred by [`workflow-composition-model.md`](../../workflow-composition-model.md) §4.3: the definition source for the final fields and the merge algorithm. It turns "machine-readable Workflow Definition" from a design principle into a closed, machine-checkable format. Semantics are frozen as a candidate for downstream validation (fast path, [Contract Lifecycle Management](../contract-lifecycle.md) §4.3); until the schemas, registry, fixtures, and validation evidence are published, no implementation may claim physical conformance to this Contract (following the honest-lifecycle convention of `EE-OBL-001`).
>
> **Normative language: English.** The Chinese file [`workflow-definition-dsl.zh-CN.md`](workflow-definition-dsl.zh-CN.md) is a non-normative tracking translation. Whenever an English section changes, its Chinese counterpart is retranslated from the current English section and replaced as a whole; Chinese maintenance does not preserve or incrementally evolve prior Chinese wording.
>
> **Ownership.** This document is the Contract document of the super project, located under `docs/contracts/workflow/`; its normative machine representation (JSON Schemas, example Package, validators) lives in [`system-contracts/workflow-dsl/`](../../../system-contracts/workflow-dsl/). `workflow-package/` carries executable Workflows and their resources only; it does not carry the Contract.

## 1. Scope, Position, and Dependencies

| Field | Value |
| --- | --- |
| Status | `REVIEW_CANDIDATE` per [Contract Lifecycle Management](../contract-lifecycle.md) (fast path §4.3); Contract revision `agentops.workflow-dsl@0.1.0` |
| Upstream authority | [`workflow-composition-model.md`](../../workflow-composition-model.md) (governing, especially §4, §6, §7, §8, §9, §11, §12, §13, §14), [`agent-architecture.md`](../../agent-architecture.md) (§3 stable concepts, §4 cross-system invariants), [`systems/runtime/first-party-langgraph-runtime-profile.md`](../../systems/runtime/first-party-langgraph-runtime-profile.md) (§3 scope, especially Builder/compiler as non-goal; §13–14 evidence discipline) |
| Aligned design-time semantics | [`workflow-package/implementation/workflow.md`](../../../workflow-package/implementation/workflow.md), `agents/routes.md`, `schemas/*.schema.md`, `templates/*.template.json`, `composition-conformance.md`; [`workflow-package/system-design/workflow.md`](../../../workflow-package/system-design/workflow.md), `agents/routes.md`, `schemas/*.schema.md` (this document translates and closes their semantics; it does not redefine them) |
| This Contract answers | The two items deferred by §4.3: the **final fields** (§5 + the normative schemas under `system-contracts/workflow-dsl/schemas/`) and the **merge algorithm** (§7, the verifiable authority/composition-order rules) |
| This Contract does not define | Definition→Implementation compilation/execution, builder/authoring tools, physical directory names, LangGraph/Driver native APIs, Runtime-private state formats |
| Translation parity obligation | English/Chinese anchors, headings, tables, IDs, fields, enums and links stay paired with the companion [`workflow-definition-dsl.zh-CN.md`](workflow-definition-dsl.zh-CN.md) |

**Explicitly not in scope** (consistent with FPLG §41):

1. No compilation/execution of "Definition → LangGraph `StateGraph`" — that is FPLG/Execution-layer work.
2. No builder / simple-configuration authoring tool — the MVP starts directly from the machine-readable Definition.
3. No reinvention of graph concepts — the DSL inherits the industry-standard graph primitives (node / edge / conditional edge / state schema / reducer / checkpoint / interrupt), aligned 1:1 with LangGraph semantics, without promoting its physical API identity.
4. No pseudo-YAML — the meaning, allowed values, and constraints of every field are closed in this document and in the normative schemas (composition model §9/§230).

**Language neutrality of Definitions.** The DSL itself is open: the human-readable text inside a Definition (e.g., `purpose`, `meaning`, prompt and Skill resource content) is **not restricted to any language** — third-party Workflow authors may write it in the language of their choice. First-party Packages follow the project's English-first policy for human-readable text. This document, as a Contract, is English-authoritative regardless of the language used inside any Definition.

## 2. Layered Model and Physical Representation Neutrality

### 2.1 The four layers

| Layer | What it is | Who writes it | In the Package? |
| --- | --- | --- | --- |
| **Workflow Definition** | The versioned, technology-neutral, machine-readable declaration of the logical Workflow (graph / state schema / transition / Action / Gate / budget / Wait / recovery / terminal / Role route / Artifact template / validation / handoff) | Package owner | Yes, canonical |
| **Workflow Implementation** | The executable realization of one Definition by a Runtime Profile (first-party: compiled to a LangGraph JS `StateGraph`) | Runtime/compile layer | No, Runtime-private compile product |
| **Workflow Package Snapshot** | The immutable, complete, resolved identity-and-relationship closure of a Package for one Delivery | Execution admission authority | No (produced at admission) |
| **Workflow State** | The mutable run state of one Delivery (current Action, results, Artifacts, budgets, Wait, recovery, terminal proposal) | Selected Runtime Profile exclusively | No |

Layer invariant: **the Runtime accepts only the compiled Implementation; the Implementation must not change the Action, legal-transition, Gate, or terminal semantics declared by the Definition** (composition model §4.2). This DSL defines only the machine-readable format of the Definition layer and its closure rules.

### 2.2 Physical representation neutrality

- **Semantic identity is the fields and rules, not the bytes.** The identity of this Contract is the semantic model of §5–§11.
- **The normative encoding is JSON** (validatable with JSON Schema draft-07). The 8 schema files under `system-contracts/workflow-dsl/schemas/` are the normative machine form.
- Any other physical encoding (YAML/CBOR/…) is allowed only as a representation that **maps losslessly, bijectively to the normative JSON** with unchanged field semantics after round-trip; no encoding may introduce LangGraph/Driver physical fields (Appendix C).
- It is forbidden to promote LangGraph's physical API identity to Contract-canonical identity: the `StateGraph` class name, `langgraph.json`, native checkpoint/thread IDs, native reducer function names, etc. (composition model §12 smells, §13 red lines). These belong to the Implementation/compile layer.

### 2.3 Instruction authority order (overview)

The recommended instruction authority order (composition model §8) is fixed by this Contract as the **canonical order**; every Package must declare it and may not deviate (§7.1):

```text
Workflow/Action authority → Role prompt → Action Prompt → Skill instructions → Artifact/user content
```

A later layer cannot expand the authority of an earlier layer; an Artifact is processed data and does not become configuration instructions merely because it contains imperative text; conflicts fail closed and never rely on Driver-implicit priority.

## 3. Document Set Overview and Package Closure

A conforming Workflow Package consists of **1 Package Index + 6 Definition documents** (physical files may be merged, but authority may not; `package.json`'s `documents` field gives relative paths; this Contract does not mandate fixed directory names):

| Document kind | File (example) | Content | Normative schema |
| --- | --- | --- | --- |
| `agentops.package` | `package.json` | Package identity/purpose/status/ownership, document set, **owned/referenced resource index**, authority declaration, environment requirements, compatibility range | `schemas/package.schema.json` |
| `agentops.workflow-definition` | `workflow.json` | workflow identity, state schema (reducers), graph (nodes/edges/conditional edges/terminals), waits, budgets, recovery, handoffs/consumedHandoffs | `schemas/workflow-definition.schema.json` |
| `agentops.actions` | `actions.json` | Action catalog: input/result schema, responsibleAuthority, allowedRoutes, execution (single/parallel), selector, escalation, gate, budget, wait, recovery | `schemas/actions.schema.json` |
| `agentops.roles` | `roles.json` | Role stable responsibility, authority boundary (concerns/writePermissions/prohibited), independence | `schemas/roles.schema.json` |
| `agentops.routes` | `routes.json` | Role route → Agent binding: Role prompt, Agent definition, Action prompts, Skills, model, tools, Driver, session policy, access, escalation | `schemas/routes.schema.json` |
| `agentops.artifacts` | `artifacts.json` | Output/intermediate Artifact templates (first-class resources: real content or fixed reference), section coverage, completion, lifecycle, dependency validity | `schemas/artifacts.schema.json` |
| `agentops.validation` | `validation.json` | deterministic validators, aggregation rules, review-lens definitions, conformance corpus (positive/negative/recovery) | `schemas/validation.schema.json` |

Shared definitions (identity / contentIdentity / sourceLocator / schemaRef / inlineSchema / predicate / reducer / resourceRef / authorityOrder) live in `schemas/agentops.meta.schema.json`.

### 3.1 Package closure rules (machine-checked)

1. The 6 documents listed in `documents` exist and their `kind` and `schemaVersion` match;
2. `package.definition.contentIdentity` == `sha256(documents.workflow)`;
3. Every resource id referenced by routes/artifacts/template/selector is declared in `resources.owned|referenced`;
4. Each owned resource's `path` exists and `contentIdentity` == `sha256(path)`; each referenced resource must carry `sourceLocator` and must not carry `path`;
5. `authority.order` equals the canonical order and `conflictMode` is `fail-closed`;
6. No ambient fallback: any missing resource, content-identity mismatch, or undeclared reference makes the Package **non-admissible** (admission/recovery fails explicitly or enters the Workflow's declared recovery path; it never re-resolves to another version).

## 4. Core Graph Semantics (industry standard, aligned 1:1 with LangGraph semantics)

The graph semantics of this DSL align item by item with the industry-standard model (of which LangGraph semantics are a representative), retaining **semantics only**, never physical API:

| Industry/LangGraph semantics | This DSL construct | Notes |
| --- | --- | --- |
| node | `graph.nodes[].id` + `action` | Graph execution unit; each node binds one Action |
| edge (static transition) | `graph.edges[]` (`from`/`to`/`condition`) | `to` may be a node or `terminal:<id>` |
| conditional edge (condition function) | `graph.conditionalEdges[]` (`judge` + `conditions[].when` predicate → `target`, `default`) | Branch structure belongs to the Workflow; the **judgment** belongs to state predicates or a Planner Action (§4.1) |
| state schema | `state.fields[]` (name/type/items/schema/reducer) | See §4.2 reducers |
| reducer (state merge) | built-in `reducer` vocabulary + custom | See §4.2 |
| checkpoint (durability) | `graph.nodes[].checkpoint` (mode + bindings) | See §4.3 |
| interrupt / resume | `waits[]` + Action `waitPolicy` | See §4.4 |
| terminal (END) | `graph.terminals[]` + `terminal:<id>` references | See §4.5 |
| parallel branches + barrier (static form of Send) | Action `execution.mode: "parallel"` (branches + join.barrier) | See §4.6 |

### 4.1 Predicate vocabulary (closed)

`predicate` allows only three combinators (`allOf` / `anyOf` / `not`) and atomic assertions `{field, op, value}`, with `op` closed to:

`eq | ne | gt | gte | lt | lte | exists | notExists | in | notIn | contains | notContains`

- `field` is a dotted path into Workflow State (e.g., `aggregation.routing`);
- `exists/notExists` must not carry `value`; all other ops require `value`;
- `contains/notContains`: array membership or string substring;
- Rules beyond this vocabulary are **not allowed as free-form code** in the Definition; they must reference a deterministic validator resource (`gate.deterministic` / `validator`).

This keeps conditional-edge semantics fully decidable and machine-checkable at the Definition layer; complex judgments are explicitly delegated to content-addressed deterministic validators rather than plausible-looking pseudo-code.

**Judgment authority of a conditional edge.** A `conditionalEdges` entry declares a `judge`:
- `judge.kind: state` (default): `conditions[].when` predicates are evaluated over Workflow State (structured results only).
- `judge.kind: planner`: the Runtime first invokes the declared Planner Action's Agent to judge (possibly unstructured) context semantically; the Agent returns a structured classification conforming to `resultSchema`; the Runtime validates it and then evaluates `conditions[].when` over that classification to select the target. Judgment belongs to the Agent; branch structure belongs to the Workflow. The Planner Action must declare its allowed routes and remain non-recursive.

### 4.2 State and reducers (closed)

- State field types are closed to `string | integer | number | boolean | array | object | artifactRef`; arrays require `items`; object/artifactRef may fix a `schema` reference;
- **Built-in reducer vocabulary** (closed semantics):

| reducer | Semantics |
| --- | --- |
| `overwrite` (default) | last write wins |
| `append` | array append (optional dedup rule); used for accumulating data such as findings |
| `merge` | shallow object merge |
| `keepFirst` | keep only the first write |
| `sum` / `max` / `min` | numeric aggregation; used for budgets/counters (e.g., `reviewIterations`) |
| `custom` | must reference a deterministic, content-addressed Package-owned function; binding happens at the Implementation/compile layer |

- The reducer of a field is part of the Definition semantics: **changing reducer semantics is a semantic change (MAJOR)** (§11).

### 4.3 Checkpoint

- A node may declare `checkpoint.mode ∈ {always, on-wait, on-terminal-proposal, never}` (default `always`) and `bindings`;
- **Minimum binding set** (Contract requirement; missing any of these fails closed): `delivery, snapshot, actionAttempt, manifestRevision, gitTree`; may extend with `artifactVersions, pendingWait, budgets, lastProgress`;
- The physical checkpoint ID / thread ID is Runtime-private and is **not** product Workflow identity (composition model §12 smell).

### 4.4 Wait / interrupt / resume

- `waits[]` declares: `kind ∈ {user, external, spike}`, `triggerAction`, `resumeAction`, `resumeSchema`, `correlation {identitySource, staleRejected: true, duplicateRejected: true}`, `expiry`;
- An Action binds a Wait through `waitPolicy {kind, wait}`;
- Semantics: one Wait binds exactly **one** pending measurement/decision or **one** coordination request; only an exact authorized pending answer may resume; stale/mismatched/duplicate answers have no effect (fail closed); expiry is a deterministic policy event (renewal-and-resume or `INCOMPLETE`), **never success and never silent cancellation**;
- The Definition declares Wait semantics; the Implementation layer compiles them into the Runtime's interrupt/resume mechanism.

### 4.5 Terminal

- `graph.terminals[]`: `id` (e.g., `SUCCESS`), `kind ∈ {success, failure, incomplete, cancelled, custom}`, `meaning`, `validation[]` (validator references), `proposalCheckpoint` (default true: a checkpointed terminal proposal precedes settlement);
- Edge targets reference `terminal:<id>`; budget exhaustion / cancellation / non-retryable failure enter terminals through **runtime-enforced terminal transitions** (not ordinary edges), see §6.4.

### 4.6 Parallel branches and barrier (v1 scope)

- Action `execution.mode: "parallel"`: `branches[]` (each with `route` + `isolation ∈ {session-isolated, shared}` + `required`) plus `join` (`mode ∈ {all, aggregator}`, `barrier: true` mandatory);
- Semantics: parallel branches are **mutually isolated** until the barrier (session isolation, no visibility into each other's conclusions; shared raw evidence ≠ shared conclusions); the join must be declared explicitly (`all` or an `aggregator` action); aggregation rules are declared in `validation.aggregation`;
- v1 does not introduce a dynamic fan-out (Send) construct: static parallel branches + state reducers already cover both first-party Workflows (IM-12 dual lens, SD-09 three lenses). Dynamic fan-out is a candidate extension requiring a Contract revision (avoiding half-closed pseudo-YAML).

## 5. Final Fields (deferred question one of §4.3)

The normative complete field set is the 8 JSON Schemas under `system-contracts/workflow-dsl/schemas/`. This section gives the **field catalog** of each document kind (name / required / meaning and constraints) for human reading; machine validation follows the schemas. Any field whose meaning is unclosed, or not covered by the schema, makes the document invalid (`additionalProperties: false` enforces closure).

### 5.1 `agentops.package` (`package.json`)

| Field | Required | Meaning and constraints |
| --- | --- | --- |
| `kind` | yes | `const: "agentops.package"` |
| `schemaVersion` | yes | `agentops.workflow-dsl@X.Y.Z` |
| `package.name` | yes | `^[a-z][a-z0-9-]*$` |
| `package.version` | yes | semver `MAJOR.MINOR.PATCH` |
| `package.purpose` | yes | the problem solved and success/terminal meaning |
| `package.status` | yes | `DRAFT \| CONFIRMED \| DEPRECATED` |
| `package.admissibility` | no | `ADMISSIBLE \| DESIGN_REFERENCE \| EXAMPLE_NON_ADMISSIBLE`; non-ADMISSIBLE packages cannot be admitted as production Snapshots |
| `package.ownership` | yes | `owner` + `authoritySource` |
| `package.definition` | yes | `name/version/contentIdentity`; contentIdentity must equal the sha256 of the workflow document |
| `documents` | yes | relative paths of the 6 documents (workflow/actions/roles/routes/artifacts/validation) |
| `resources.owned[]` | yes | see §5.8; owner=owned must carry `path` and must not carry `sourceLocator` |
| `resources.referenced[]` | yes | owner=referenced must carry `sourceLocator` and must not carry `path` |
| `authority.order` | yes | must equal the canonical order (§7.1) |
| `authority.conflictMode` | yes | `const: "fail-closed"` |
| `environmentRequirements[]` | no | environment capability declarations, no credentials |
| `compatibility` | yes | `minContractVersion`/`maxContractVersion` (the Contract range this Package declares compatibility with) |

### 5.2 `agentops.workflow-definition` (`workflow.json`)

| Field | Required | Meaning and constraints |
| --- | --- | --- |
| `kind` / `schemaVersion` | yes | `agentops.workflow-definition` / `agentops.workflow-dsl@X.Y.Z` |
| `workflow.{id,name,version,purpose,contractVersion}` | yes | independent Definition version identity (composition model §4.1) |
| `state.fields[]` | yes | see §4.2; `name` pattern `^[a-z][a-z0-9_]*$` |
| `graph.start` | yes | must be a node id |
| `graph.nodes[]` | yes | `id` + `action` (the action must exist in the actions document) + optional `checkpoint` |
| `graph.edges[]` | no | `id/from/to` + optional `condition`; a node must not have both static out-edges and conditional edges |
| `graph.conditionalEdges[]` | no | `id/source/judge?/conditions[]/default`; at least 1 condition; `judge` = state predicates or a Planner Action (§4.1) |
| `graph.terminals[]` | yes | `id/kind/meaning` + optional `validation[]`/`proposalCheckpoint` |
| `waits[]` | no | see §4.4 |
| `budgets[]` | no | `id/scope/resource` (`time|tokens|context|custom`, custom requires `resourceName`) + `evaluator` (script registration point, schemaRef) + `onExhaustion` + optional `action`/`accounting`; **no numeric limit in configuration** (§6.4) |
| `recovery[]` | no | `id/mode` + optional `scope/action/condition`; `noBlindReplay: true` mandatory |
| `handoffs[]` | no | upstream handoff declarations; `semanticOnly: true` mandatory, downstream control fields forbidden (§10) |
| `consumedHandoffs[]` | no | downstream consumption declarations; `mustNotWeaken: true` mandatory, `preservesSemantics` byte-faithful (§10) |

### 5.3 `agentops.actions` (`actions.json`)

| Field | Required | Meaning and constraints |
| --- | --- | --- |
| `actions[]` | yes | — |
| `id/name/purpose` | yes | — |
| `inputSchema` / `resultSchema` | no / yes | `schemaOrInline`: fixed reference (schemaRef) or restricted inline schema |
| `responsibleAuthority` | yes | `{kind: role, role}` (Agent Action; composition model §11) or `{kind: runtime, validator}` (pure deterministic Action; Runtime authority) |
| `allowedRoutes[]` | role actions only | Agent Actions (`kind: role`): ≥1 route ids declared in the roles/routes documents. Runtime Actions (`kind: runtime`) declare none — they have no Agent binding |
| `execution` | yes | `{mode: single}` or `{mode: parallel, branches[], join{barrier: true}}` (§4.6) |
| `selector` | yes | `{kind: deterministic}` or `{kind: planner, action, proposalSchema, allowedTargets, nonRecursive: true}` (§6.3) |
| `allowedSuccessors[]` | yes (≥1) | must **equal** the graph out-edge set of the Action's node(s) (§6.2 machine check) |
| `escalation` | no | `{allowed, scope: "route-within-allowed", cannotChange[]}` (§6.9) |
| `gate` | yes | `preconditions[]/postconditions[]` (predicates) + `deterministic[]` (validator references) + `freeTextBypass: "prohibited"` |
| `budget` / `waitPolicy` / `recovery` | no | references to budget/wait/recovery ids declared in the workflow document |

### 5.4 `agentops.roles` (`roles.json`)

| Field | Required | Meaning and constraints |
| --- | --- | --- |
| `roles[]` | yes | — |
| `id/name/responsibility` | yes | — |
| `authorityBoundary.concerns[]` | yes | chosen from the closed concern vocabulary (§7.2); declares which concerns this Role prompt may instruct |
| `authorityBoundary.writePermissions[]` | yes | `target` + `scope` (e.g., run-workspace write, finding write, approved-manifest commit) |
| `authorityBoundary.prohibited[]` | yes | explicit prohibitions |
| `independence` | no | `{isolation: session-isolated/shared, barrier, sharedRawEvidenceOnly}` |

### 5.5 `agentops.routes` (`routes.json`)

| Field | Required | Meaning and constraints |
| --- | --- | --- |
| `routes[]` | yes | — |
| `id/role` | yes | role must exist in the roles document |
| `agent.definition` | yes | resource reference (agent-definition) |
| `agent.managedProjection` | yes | `const: "required"`: only managed projection of the frozen route is admitted; ambient/default substitution is forbidden |
| `resources.rolePrompt` | yes | resource reference |
| `resources.actionPrompts[]` | yes | `{action, prompt}`: one Action Prompt resource per action |
| `resources.skills[]` / `tools[]` | no | resource reference lists |
| `resources.model` / `driver` | yes | resource references |
| `resources.sessionPolicy` | yes | `{freshness: fresh-per-episode/continuous-within-goal/resumable-within-admitted-dialogue, isolation: isolated/shared, resumeRule?}` |
| `access[]` | yes | `{target, mode: read/write/execute}` |
| `escalationAllowed` | yes | boolean |

### 5.6 `agentops.artifacts` (`artifacts.json`)

| Field | Required | Meaning and constraints |
| --- | --- | --- |
| `artifacts[]` | yes | — |
| `id/name/kind` | yes | `kind ∈ {output, intermediate}` |
| `template` | yes | **oneOf**: `{content}` (real template content; name-only is never admissible) or `{reference}` (fixed resource reference with exact content identity) |
| `sections[]` | no | `{topic, questions[], completionCondition, naRule?}`: exposes the real table of contents/topics and decidable completion conditions |
| `lifecycle` | yes | `{states[], storageKind: RUN_WORKSPACE/REPOSITORY_DELIVERABLE, retentionClass}` |
| `dependencyValidity` | no | `CURRENT/STALE_PENDING_IMPACT/INVALIDATED/REVALIDATED` |
| `producedBy` / `consumedBy[]` | no | action references |

### 5.7 `agentops.validation` (`validation.json`)

| Field | Required | Meaning and constraints |
| --- | --- | --- |
| `validators[]` | yes | `{id, purpose, input, output, deterministic: true}` |
| `aggregation[]` | yes | `{id, scope(action), rule ∈ {no-voting, merge-common-cause, preserve-provenance}, arbiter(role), prohibited[]}` |
| `review[]` | yes | `{id, lens, role, isolation: "session-isolated", barrier: true, admission.findingShape}` |
| `conformance[]` | yes | `{id, class ∈ {positive, negative, recovery}, scenario, preconditions, expected}` |

### 5.8 Resource entries (owned / referenced)

| Field | Required | Meaning and constraints |
| --- | --- | --- |
| `id` | yes | stable identity |
| `kind` | yes | `role-prompt/action-prompt/skill/template/schema/validator/agent-definition/tool/model/driver/cli/conformance/artifact-template/documentation` |
| `owner` | yes | `owned \| referenced` |
| `path` | owned only | in-package relative path; must exist and digest must match |
| `sourceLocator` | referenced only | `{repository, path, ref?}`; floating aliases are forbidden in a Snapshot |
| `contentIdentity` | yes | `sha256:<64 hex>`; owned = real file digest; referenced = content-comparable identity |
| `use` | yes | who consumes this resource and why |

## 6. Semantic Rules (by concept)

### 6.1 Action

- Every Action has explicit input, a structured result, and a responsible authority: an Agent Action names a Role (`responsibleAuthority.kind=role`); a pure deterministic Action names Runtime authority (`kind=runtime` + a deterministic validator).
- Agents only **propose** results; legitimacy and validity are two distinct Gates (composition model §7): selection legitimacy (route/selector) is validated by the Runtime; result validity is validated by the result schema and the gate. Agent free text cannot bypass a Gate.

### 6.2 Transition and successor closure

- The Workflow decides the legal successor set; `allowedSuccessors` must be **item-for-item equal** to the graph out-edge set (machine check; the example checker implements this rule).
- A Planner or any selector may choose only within that set; an out-of-set proposal is rejected and State does not advance.

### 6.3 Selector

- `deterministic`: the Runtime evaluates the declared edges/conditional edges directly (no Agent needed).
- `planner`: the Workflow invokes the Planner Action's Agent through an **explicit Planner Action** and requires a structured selection proposal (conforming to `proposalSchema`); the Runtime validates that the proposal is within `allowedTargets` before advancing. The Planner Action itself must declare its allowed routes and `nonRecursive: true` (a Planner cannot select itself).
- The same Planner pattern serves **semantic branch judgment**: a conditional edge with `judge.kind: planner` uses the Planner Action's structured classification to decide which branch to take (§4.1). Since Agent output is often unstructured text, deterministic predicates apply to structured state/results only; anything requiring reading meaning belongs to the Planner Action.
- "Planner decides the next action" ≠ "Planner invents the flow": deterministic flow is fixed by configuration.

### 6.4 Budget

- A budget declares a **resource dimension** from the closed set `time | tokens | context | custom` (`custom` dimensions — e.g. attempts, iterations — declare a `resourceName`) and an **evaluator**, a content-addressed **script registration point** (`schemaRef`) that the Runtime invokes to obtain the budget conclusion. **No numeric limit ever appears in configuration**; the exact limit is project/runtime policy bound at admission (this is the established Implementation Workflow pattern: configuration binds a registration point, the Runtime calls the script).
- `onExhaustion ∈ {incomplete, wait, recovery}`; budget consumption enters Workflow State (e.g., `attempts` accumulates via the `sum` reducer); **exhaustion never relaxes a Gate**; exhaustion enters the declared terminal/wait/recovery path (e.g., `terminal:INCOMPLETE`, preserving current state, reason, and resume Action).
- A retry keeps the same Goal/rung content identity and gains a new attempt identity; repeating the same failure without new diagnosis consumes budget and does not constitute progress.

### 6.5 Recovery

- Semantic recovery allows only (FPLG `FPLG-DRV-006`): known `continue`, known `restartFromSavepoint`, or explicit uncertainty entering `intervene` (durable Intervention); `fail` is for non-retryable failures.
- `noBlindReplay: true` is mandatory: blind replay is forbidden; checkpoint binding identities must be re-resolved before recovery, and mismatch fails closed.

### 6.6 Gate

- `preconditions` / `postconditions` are predicates; `deterministic[]` references deterministic validators; `freeTextBypass: "prohibited"` is mandatory.
- Missing resources, illegal transitions, Driver substitution, and Runtime drift all fail closed or become visible facts (composition model §14 Q11).

### 6.7 Artifact template (first-class resource)

- Output/intermediate Artifact templates must have **real content or a fixed reference** (§5.6); a name-only listing is not closed (composition model §4.3/§12).
- A template defines the artifact's coverage (topic/questions/completion/naRule); it does **not** carry Workflow transitions or Agent questioning order.
- An Artifact is data; its lifecycle states (WORKING→…→SUPERSEDED) and dependency validity (CURRENT→STALE_PENDING_IMPACT→…) follow `artifact-lifecycle.md` semantics: immutable versions, no in-place overwrite, changes first enter pending-impact analysis.

### 6.8 Aggregation / Review

- Parallel results are **never decided by majority**; `validation.aggregation` declares rule/arbiter/prohibited; the sole adjudication authority is explicit.
- Lenses claiming independence must declare `isolation: session-isolated` + `barrier: true`; shared raw evidence ≠ shared conclusions (composition model §11).
- Finding admission: severity/disposition is decided by the source lens; the aggregator cannot close Findings or change severity unilaterally.

### 6.9 Escalation

- Only widens route choice within `allowedRoutes`; it can **never** change the frozen Goal, writer authority, Gate, or successor set (`cannotChange` declaration).
- Route/model escalation cannot expand authority or bypass a Gate.

### 6.10 Role and route resolution (mechanization of composition model §7)

A route selection must satisfy all of the following (else fail closed):

1. the route is declared by the current Action and Role (`actions.allowedRoutes` ∩ `routes.role`);
2. the selector has Workflow authorization for the choice (§6.3);
3. budget, independence (isolation), tool, and model constraints are satisfied (route declarations);
4. when a planner is used, the selection proposal conforms to `proposalSchema`;
5. the selection and its rationale enter Workflow State or a structured Artifact.

## 7. Merge Algorithm (deferred question two of §4.3: verifiable authority/composition-order rules)

### 7.1 Canonical authority order (fixed by the Contract)

This Contract fixes the composition model §8 recommended order as the **only admissible order**:

```text
1. workflow_action   —— the Action's machine-declared constraints (allowedRoutes/gate/budget/successors/forbidden effects)
2. role_prompt       —— Role stable responsibility, authority, write permissions, prohibitions
3. action_prompt     —— this Action's mission, inputs, target artifacts, completion conditions
4. skill             —— operating procedure, design constraints, inspection methods
5. artifact_user     —— Artifact inputs and user content (data, not instructions)
```

**Check rule R1 (order verifiable)**: every Package must declare this order in `package.authority.order`; a declaration that differs from the canonical order → **admission failure**. Rationale: allowing arbitrary orders would reintroduce the Driver-implicit-priority problem; the canonical order is this product's stable semantics.

### 7.2 Constraint intersection

Each layer declares a **machine-readable authority boundary** (concern vocabulary):

`responsibility | authority | write-permission | mission | method | transition-selection | gate | budget | terminal | data | session | tool | model | route`

- Role layer: `roles.authorityBoundary.concerns` + `writePermissions` + `prohibited`;
- Action layer: `actions.gate/selector/allowedSuccessors/forbidden effects` (`escalation.cannotChange`, implicit role boundary);
- Action Prompt / Skill / Artifact: DSL v1 requires the route's resource entries to declare `use` (consumption intent) and relies on the boundary rules of §7.3; full per-layer concern declarations are left to Task 2's Package migration (lossless to design-time semantics; only machine fields are added).

**Check rule R2 (restrict only, never expand)**: the effective authority after composition = the **intersection** of all declared layers. Any later layer's declared boundary outside the space already declared by an earlier layer (e.g., a Skill whose `use` claims "decides transitions" while the Action's selector is deterministic) → static conflict → fail closed.

**Check rule R3 (missing fails)**: any instruction-bearing resource (Role prompt / Action Prompt / Skill) that is not bound in a route, or whose boundary is undeclared/not subset-comparable → admission failure (no "looks fine" default).

### 7.3 Conflict determination and the honest boundary

- **Machine-decidable part**: declared concern overreach, write-permission overreach (e.g., a Skill claiming to write production paths while the Role has no such permission), selector/planner conflicts, `allowedSuccessors` overreach, contradictory reducer semantics — all fail closed statically.
- **Text-level conflicts** (contradictory natural-language instructions) are not fully decidable. This Contract's treatment: (a) every layer must declare machine boundaries so the decidable part is detected; (b) text-level contradictions are verified as **negative conformance scenarios** (the `conf.negative.authority` class); (c) resources with undeclared boundaries fail closed at admission. **Resolving** conflicts via the Driver's implicit override order is forbidden.

### 7.4 Driver has no priority

The Driver/session policy is **not an authority layer**: it cannot reorder, override, or substitute the merge result. The merge result is a **frozen instruction bundle** (with each resource's content identity) handed to the Driver, which may only project it and cannot take Workflow control in reverse (composition model §5 authority table).

### 7.5 Merge result and recomputability

The merge algorithm is deterministic: given (Package, Action, Route) → collect resources in canonical order (`rolePrompt → actionPrompts[action] → skills → model/tools/driver/sessionPolicy`) → boundary checks (R1–R3) → output the frozen instruction bundle (ordered resource references + content identities + authority proof). A verifier can independently recompute the same bundle; any mismatch fails closed. **R5**: merging modifies no resource content; it only produces the composition-order proof.

### 7.6 Relation to the Package Snapshot

The merge proof (authority order + boundary checks + resource content identities) is part of the Snapshot resolution closure (the "Authority order" and "Resolution proof" groups of `package-snapshot.schema.md`), frozen at admission and immutable during a run.

## 8. Owned and Referenced (machine rules)

| Rule | owned | referenced |
| --- | --- | --- |
| Maintenance location | in-package; owner, version, location discoverable | out-of-package; no authorship copied |
| Identity | `contentIdentity == sha256(path)`, machine-checked | `sourceLocator + contentIdentity` content-comparable; floating aliases (`latest`/bare name) forbidden in a Snapshot |
| Consumption | referenced by route/artifact/template id | same |
| Invalidation | missing file / digest mismatch → admission failure | unresolvable/mismatched content identity → admission or recovery fails explicitly |

Machine checks: owned resource paths exist and digests match; referenced resource sourceLocators are complete and identities are comparable; any undeclared route/resource reference fails closed; environment defaults, current CLI settings, or Driver fallbacks may never substitute (composition model §4.4).

## 9. Package Snapshot vs Workflow State Separation (machine rules)

### 9.1 Snapshot (immutable)

Frozen at admission; minimally contains: Package identity/version/digest, Definition identity, all owned/referenced resource content identities, route bindings (Action→Role→route→Agent/Prompt/Skill/model/tool/Driver/session identity), the authority declaration and merge proof, environment requirements, and the resolution proof (no ambient fallback). **State changes cannot rewrite the Snapshot**; configuration updates must produce a new Snapshot for a new Delivery.

### 9.2 Workflow State (mutable) and checkpoint bindings

State is written exclusively by the Selected Runtime Profile: current Action/attempt, completed results, Artifact references, budget consumption, Wait, recovery information, terminal proposal. Every persisted checkpoint must bind the minimum set (§4.3): `delivery, snapshot, actionAttempt, manifestRevision, gitTree` (plus applicable artifact versions / pending wait / budgets / last progress).

### 9.3 Machine rules

1. A checkpoint whose Snapshot identity differs from the current Delivery's Snapshot → fail closed, enter explicit reconciliation/`INCOMPLETE`;
2. Recovery re-resolves all bound identities; missing, corrupt, same-identity-different-content, or Git-tree drift → fail closed; never guess state from "the latest file";
3. `UNMANAGED_SIMULATION` may use the same field shapes but may only report `SIMULATION_PASSED/FAILED/INCOMPLETE`; it cannot write formal State or publish a formal terminal (`IM-DEC-001`).

## 10. Cross-Workflow Handoff Authority (machine rules)

### 10.1 Upstream (handoffs)

An upstream Artifact defines only **facts, semantic constraints, unclosed obligations, and invalidation conditions** within its own domain. The `handoffs[]` field set is schema-restricted to `semanticOnly` (`domainSemantics / invalidationConditions / semanticDependency / requiredEvidence / returnLocation / reopenCondition`); any downstream Action/Gate/Wait/terminal field is **forbidden** (schema-level `additionalProperties: false` + `semanticOnly: true`). The upstream cannot define downstream flow through Artifact content.

### 10.2 Downstream (consumedHandoffs)

The downstream must preserve upstream semantics and owns the authority to classify and map obligations into its own lifecycle. `consumedHandoffs[]` declares: `classification / owner / affectedLocal / preservesSemantics{semanticDependency, reopenCondition} / mustNotWeaken: true`.

### 10.3 Machine rules

1. **Byte fidelity**: the two `preservesSemantics` fields must be **byte-for-byte equal** to the corresponding upstream handoff fields (when the upstream package is resolvable); mismatch → fail closed;
2. The downstream cannot silently weaken, rewrite, or impersonate a satisfied obligation; a downstream result that overturns frozen upstream semantics → the current Delivery stops and requests a new upstream Artifact version;
3. The concrete obligation classes/fields/routing are decided by the consuming Package, not enumerated by this Contract (composition model §4.6).

## 11. Version Compatibility Strategy

### 11.1 Version axes

| Axis | Rule |
| --- | --- |
| Package version | semver `MAJOR.MINOR.PATCH` |
| Definition version | independent version identity (`workflow.version`), decoupled from the Package version (composition model §4.1) |
| Contract version | `agentops.workflow-dsl@X.Y.Z`; this document = `0.1.0` (pre-release) |
| Snapshot | binds all exact versions + content identities; one Delivery binds one Snapshot |

### 11.2 Compatibility classes

| Change | Class | Rule |
| --- | --- | --- |
| Adding optional fields/resources, adding Actions/nodes (without changing existing semantics), text fixes | MINOR/PATCH, backward compatible | existing Snapshots/Deliveries unaffected |
| Changing Action semantics, adding/removing/changing transitions/gates/terminals, changing reducer semantics, changing authority order or boundaries | **MAJOR (semantic change)** | requires a new Definition version + new Package major + new Snapshot; applies only to new Deliveries |
| Adding a state field (with a default reducer) | compatible | — |
| Removing a state field / changing reducer behavior | breaking | MAJOR |
| Same identity, different content (digest mismatch) | forbidden | fail closed (FPLG `FPLG-DEC-002`, `EE-AC-012`) |
| `latest`/bare-name selection | resolution-time only | resolved to `exactVersion` before the Manifest is created; alias movement affects only later Deliveries (agent-architecture §4 invariant 14) |

### 11.3 Conformance and versions

A Definition claiming conformance to `agentops.workflow-dsl@X.Y.Z` must: pass that version's schema validation + pass the closure/merge/§8–§10 machine rules + pass the conformance corpus; a Runtime Profile claiming conformance must: compile the Definition into an Implementation without changing Action/transition/Gate/terminal semantics, verify Snapshot bindings, pass the corpus, and leak no native IDs (§12).

## 12. Conformance Requirements

### 12.1 Three levels of conformance

| Level | Subject | Evidence |
| --- | --- | --- |
| Document conformance | a single DSL document | JSON Schema validation (`system-contracts/workflow-dsl/schemas/`) + `additionalProperties: false` closure |
| Package conformance | the whole Package | document level + §3.1 closure + §7 merge proof + §8–§10 machine rules + **conformance corpus** (positive/negative/recovery scenarios, e.g., the 6 scenarios in `system-contracts/workflow-dsl/examples/minimal/validation.json`) |
| Implementation/Runtime conformance | Runtime Profile / compile layer | compilation without changing Definition semantics, Snapshot-binding validation, passing the corpus, forbidden-field scan, no native-ID leakage; **no physical-conformance claim before schemas/registry/fixtures/validation evidence are published** |

### 12.2 Machine-check checklist (core items; the example checker implements these)

1. JSON parses; kind/schemaVersion match;
2. all references resolve (documents, owned paths, action/role/route/wait/budget/recovery/validator/artifact/resource ids);
3. `allowedSuccessors` == graph out-edge set; a node does not mix static and conditional out-edges;
4. closed vocabularies: reducer / predicate op / authority order / session freshness / isolation;
5. owned and definition digests match; referenced sourceLocators complete;
6. forbidden-field scan (Appendix C): no LangGraph/Driver physical tokens in any Definition.

### 12.3 Conformance corpus

Every Package must declare at least: the legal main path (positive), illegal transition / overreach / missing resource / authority overreach (negative), Wait/resume correlation, budget exhaustion, crash recovery, cancellation (recovery). Corpus scenarios are part of the Package (`validation.conformance[]`) and must be executable by a Runtime or simulator.

## 13. §14 Q12: Runtime Replacement Does Not Change Definition/Package/Snapshot Semantics

> "If LangGraph or a Driver is replaced, which Contract, Artifact, and Workflow semantics remain unchanged?" — **Answer: yes, all Definition/Package/Snapshot semantics remain unchanged.**

| Layer | Affected by Runtime replacement? | Why |
| --- | --- | --- |
| Workflow Definition (graph/state/transition/Action/Gate/budget/Wait/recovery/terminal/route/artifact/handoff) | **unchanged** | the DSL contains only semantic fields and closed vocabularies, zero LangGraph/Driver physical fields (Appendix C scan enforces) |
| Package (index/owned/referenced/authority/merge proof) | **unchanged** | resource and identity closure does not reference the Runtime |
| Package Snapshot | **unchanged** | the identity-and-relationship closure frozen at admission is Runtime-independent |
| Workflow State semantics (separation, minimum checkpoint bindings, Wait/resume, terminal-settlement rules) | **unchanged** | the Contract declares semantics; physical checkpoint/thread/interrupt IDs are Runtime-private |
| Workflow Implementation | **changes** | the compile product (e.g., a LangGraph `StateGraph`) is recompiled per Runtime |
| Driver projection | **changes** | the projection of the frozen instruction bundle changes per Driver |

Replacement boundary condition: the new Runtime must conform (§12.1 level 3) — compile without changing Definition semantics, accept the same Snapshot binding, introduce no ambient fallback. Therefore replacing LangGraph or a Driver requires no change to the Definition, Package, or Snapshot (composition model §13: "the implementation can be replaced without changing the conceptual relations of the Workflow Package, Snapshot, and State").

## 14. Minimal Definition Example

The complete example lives at [`system-contracts/workflow-dsl/examples/minimal/`](../../../system-contracts/workflow-dsl/examples/minimal/) (`package.json` + 6 documents + 10 owned resource files) and has passed mechanical closure checks (JSON, reference resolution, closed vocabularies, `allowedSuccessors` == out-edge set, digest matching, no LangGraph/Driver physical fields). The example covers:

- **graph**: start → `node.intake` → `node.review` (parallel dual lens) → `node.aggregate` (conditional edges) → `node.finalize` / `node.review` (re-review loop) / `terminal:FAILED`;
- **state + reducers**: `status`(overwrite), `context`(merge), `findings`(append), `reviewIterations`(sum), `aggregation`(overwrite);
- **conditional edge**: `cedge.aggregate` with three predicates + default;
- **checkpoint**: `node.intake` declares the minimum binding set;
- **Wait/recovery**: `wait.user-confirm` (user, resume=intake), `wait.external-obligation` (external); `recovery.default`(continue), `recovery.review-restart`(restartFromSavepoint), `recovery.intervene`;
- **terminal**: `SUCCESS/FAILED/INCOMPLETE/CANCELLED`;
- **Role route**: 3 Roles, 5 routes (including the blackbox/whitebox isolated routes with parallel execution + aggregator join);
- **owned/referenced**: 10 owned resources (real digests) + 5 referenced resources (sourceLocator + content-comparable identity);
- **authority**: canonical order + fail-closed; bidirectional handoffs (upstream `handoff.verification` + downstream `consume.design-obligation`).

The item-for-item equality between the graph in `workflow.json` and the `allowedSuccessors` in `actions.json` is verified by the checker — this is the mechanical proof of the §6.2 successor closure.

## 15. Appendix A: Implementation workflow.md → DSL Lossless Mapping

Against `workflow-package/implementation/workflow.md` (every Action/transition/Gate/Wait/budget/recovery/terminal is losslessly expressible):

| workflow.md element | DSL expression |
| --- | --- |
| IM-01..IM-18 Action Catalog (§4) | one `actions.json` action per IM-*: input/result schema, responsibleAuthority (role, e.g., Goal Facilitator), allowedRoutes, gate, budget, waitPolicy, recovery |
| Transition Authority table (§3, "the diagram never overrides this table") | edges/conditionalEdges in `workflow.json`: each "valid condition/result → successor" row is an edge with a condition or a conditional-edge branch; deterministic conditions are predicates |
| IM-01/IM-02 "fact-consuming Action → IM-01R" | edge + condition (e.g., missing fact → `IM-01R`); IM-01R's "return only to the recorded Action" = exact edge target + Wait/external correlation |
| IM-06 "deterministic Workflow selector" | `selector: {kind: "deterministic"}` (no Planner Agent) |
| Planner/semantic selection (composition model §6) | `selector: {kind: "planner", action, proposalSchema, allowedTargets, nonRecursive}` |
| `WAITING_FOR_USER` / `WAITING_FOR_EXTERNAL` (§10) | `waits[]` kind=user/external + exact `resumeAction` + stale/duplicate rejection |
| budget exhaustion → recoverable `INCOMPLETE` (§10) | `budgets[]` `onExhaustion: "incomplete"` → `terminal:INCOMPLETE` (state preserved; Gate never relaxed) |
| `INCOMPLETE/CANCELLED/FAILED/VERIFIED_IMPLEMENTATION_READY` (§1) | `graph.terminals[]` (success=VERIFIED_IMPLEMENTATION_READY, etc.); terminal proceeds via checkpointed proposal |
| IM-12 dual-lens parallel isolation + barrier (§4) | `action.review` style: `execution.mode: "parallel"` + branches(isolation: session-isolated) + join(aggregator, barrier) |
| IM-13 Aggregation (§4) | `validation.aggregation`: preserve-provenance, arbiter, prohibited (voting/severity/finding closure) |
| Finding severity/disposition (§7) | `validation.review` admission (findingShape) + `validation.validators` checking source-lens-valid dispositions |
| IM-11/IM-16/IM-18 CLI deterministic Gates (§4, §12) | `responsibleAuthority: {kind: "runtime", validator}` + `gate.deterministic[]` referencing Package CLI validators |
| Git/commit boundaries (§5, §11, §16) | gate postconditions + terminal validation + `escalation.cannotChange`; no default publish/merge |
| Artifact lifecycle/dependency validity (§9, artifact-lifecycle.md) | `artifacts.json` lifecycle + dependencyValidity + retentionClass; checkpoint bindings include artifactVersions/gitTree |
| upstream obligation classification (§2) | `consumedHandoffs[]`: classification/owner/affectedLocal/preservesSemantics/mustNotWeaken |
| stop on design-semantic change (§1, §10) | §10.3 rule: overturning frozen upstream semantics stops the Delivery and requests a new version |
| Route Invariants (routes.md) | routes schema: managedProjection required, writer isolation, session freshness/isolation, escalationAllowed |

## 16. Appendix B: System Design workflow.md → DSL Lossless Mapping

Against `workflow-package/system-design/workflow.md`:

| workflow.md element | DSL expression |
| --- | --- |
| SD-01..SD-15 Action Catalog (§4) | one `actions.json` action per SD-* |
| SD-01R returns only to the recorded requester (§4) | Wait/external + resume_lens exact correlation (edge target + correlation) |
| SD-03 "Runtime persists the wait, validates identity, freezes the artifact" (§4) | `wait.user-confirm` + gate postconditions (freeze proof) |
| SD-06/SD-12 `WAITING_FOR_SPIKE` (§4, §11) | `waits[]` kind=spike + correlation (exact request identity/content digest) + expiry policy + resumeAction |
| SD-09 three-lens parallel isolation + barrier (§4, §9) | `execution.mode: "parallel"` with three branches (session-isolated) + join(aggregator=SD-10, barrier) |
| SD-10 routing (evidence→SD-01R, Brief→SD-11H, skeleton→SD-04, draft→SD-11, conflict→SD-11H) | `conditionalEdges` predicates (over the aggregation result's routing field) + exact edge targets |
| SD-11H Human Decision Admission (§8 six conditions) | `waits[]` kind=user + resumeSchema (Decision Record schema) + gate preconditions (evidence exhausted, direction conflict, correct owner, complete materials) |
| SD-14/SD-15 "Runtime deterministic validator; no Agent Role" (§4) | `responsibleAuthority: {kind: "runtime", validator}`; `validators[]` references |
| SD-11 non-unconditional return to SD-09 (return_action validation) | exact edges/conditional-edges targets + `allowedSuccessors` equality check |
| Unknown Classification (§5 CONFIRMED/DERIVABLE/DESIGN_EXPLORATION/TO_BE_MEASURED/DEFERRED/USER_DECISION_REQUIRED/BLOCKED) | state fields (enum values) + predicate conditional edges + waits (USER_DECISION_REQUIRED→user wait; BLOCKED→external wait/incomplete) |
| Budget (§10) and INCOMPLETE records | `budgets[]` + `terminal:INCOMPLETE` preserving resume Action/required input |
| Wait expiry semantics (§11) | waits.expiry (renewal/INCOMPLETE; expiry is never success or silent cancellation) |
| downstream obligation handoff (§6, §12) | `handoffs[]` (semanticOnly; owner/evidence/return/reopen complete) + downstream `consumedHandoffs[]` byte fidelity |
| Session and review rules (§9) | routes.sessionPolicy (fresh-per-episode/isolated) + roles.independence (barrier) |
| SD-15 cleanup Gate (§4) | terminal validation + gate.deterministic (no intermediate files; no workflow intermediates in Git) |

## 17. Appendix C: Forbidden Physical Fields and Scan Rules

The following tokens must **not** appear in any Definition document (field names or string values). Scan rule: lowercase all document strings and do substring matching; any hit fails closed. They may exist only at the Implementation/compile layer.

| Category | Forbidden tokens (examples, non-exhaustive) |
| --- | --- |
| LangGraph classes/APIs | `stategraph`, `langgraph.json`, `langgraph`, `annotations.root`, `add_messages`, `last_value`, `send api`, `memorysaver`, `sqlitesaver`, `checkpoint_id`, `thread_id`, `interrupt(` |
| Driver-native | `codex`, `copilot` (as field identities/values; descriptive prose is not in scope — the scan targets machine fields and resource identities) |
| native checkpoint/thread | any native checkpoint/thread identity used as product identity |

Rules: **zero** physical tokens in Definition/Package/Snapshot; `schemaVersion` references only `agentops.workflow-dsl@X.Y.Z`; Runtime-private identities (native checkpoint IDs, thread IDs, session handles) never enter the Manifest/Evidence (agent-architecture §4 invariants 9 and 12).

## 18. Change and Evolution

- This Contract is the **definition source** of the DSL surface: Task 2 (`workflow-machine-definition`) migrates the two first-party Workflows into machine-readable Definitions conforming to this DSL, with semantics consistent with the design-time documents ("making documents conform to a Runtime-private format" is forbidden, composition model §9).
- Any change to physical representation, graph vocabulary, reducer vocabulary, predicate ops, or authority order must go through a Contract revision (`agentops.workflow-dsl@X.Y.Z`); it may not be implemented as field drift inside a Package.
- Dynamic fan-out, additional selector types, and multi-tenant/security mechanisms are explicit exclusions or candidate extensions requiring a new Contract decision before admission.

### 18.1 Known limitations (validated during Task 2 migration; decision record: `gap-review-decisions.md`)

| Limitation | Status |
| --- | --- |
| Parallel actions cannot express per-branch roles (single `responsibleAuthority`); SD-09's three lenses use a nominal role with per-lens enforcement via `validation.review` + branch routes | accepted MVP scope (same class as multi-action concurrency; may return as multi-action concurrency if the first-party Runtime supports it natively) |
| Dynamic branch-subset activation (e.g. SD-09 recheck of only invalidated lenses) | accepted as Runtime scheduling detail, not workflow semantics |
| Wait resume targets are fixed (`wait.resumeAction`); a logical wait that routes by a recorded `resume_action` is expressed as one wait per trigger Action | semantically equivalent; no DSL change |

### 18.2 Revision record (0.1.0 REVIEW_CANDIDATE, pre-freeze)

Per `gap-review-decisions.md`: budgets now use resource dimensions + evaluator registration points (no numeric limits); Runtime-authority Actions declare no `allowedRoutes`; conditional edges gained the `judge` declaration (state predicates or Planner Action judgment). Definitions and checker updated accordingly; all closure checks PASS. Freeze targets `1.0.0`.
