# Agent Ops Workflow Definition DSL — Contract Surface

> **Status: REVIEW_CANDIDATE, not published, no conformance claims.** This document is the **DSL surface of the Workflow Contract** deferred by [`workflow-composition-model.md`](../../workflow-composition-model.md) §4.3: the definition source for the final fields and the merge algorithm. It turns "machine-readable Workflow Definition" from a design principle into a closed, machine-checkable format. Semantics are frozen as a candidate for downstream validation (fast path, [Contract Lifecycle Management](../contract-lifecycle.md) §4.3); until the schemas, registry, fixtures, and validation evidence are published, no implementation may claim physical conformance to this Contract (following the honest-lifecycle convention of `concept.obligation.001`).
>
> **Normative language: English.** The Chinese file [`workflow-definition-dsl.zh-CN.md`](workflow-definition-dsl.zh-CN.md) is a non-normative tracking translation. Whenever an English section changes, its Chinese counterpart is retranslated from the current English section and replaced as a whole; Chinese maintenance does not preserve or incrementally evolve prior Chinese wording.
>
> **Ownership.** This document is the Contract document of the super project, located under `docs/contracts/workflow/`; its normative machine representation (JSON Schemas, example Package, validators) lives in [`system-contracts/workflow-dsl/`](../../../system-contracts/workflow-dsl/). `workflow-package/` carries executable Workflows and their resources only; it does not carry the Contract.

## 1. Scope, Position, and Dependencies

| Field | Value |
| --- | --- |
| Status | `REVIEW_CANDIDATE` per [Contract Lifecycle Management](../contract-lifecycle.md) (fast path §4.3); Contract revision `agentops.workflow-dsl@1.0.0` |
| Upstream authority | [`workflow-composition-model.md`](../../workflow-composition-model.md) (governing, especially §4, §6, §7, §8, §9, §11, §12, §13, §14), [`agent-architecture.md`](../../agent-architecture.md) (§3 stable concepts, §4 cross-system invariants), [`systems/runtime/first-party-langgraph-runtime-profile.md`](../../systems/runtime/first-party-langgraph-runtime-profile.md) (§3 scope, especially Builder/compiler as non-goal; §13–14 evidence discipline) |
| Aligned design-time semantics | [`workflow-package/implementation/workflow.md`](../../../workflow-package/implementation/workflow.md), `agents/routes.md`, `schemas/*.schema.md`, `templates/*.template.json`, `composition-conformance.md`; [`workflow-package/system-design/workflow.md`](../../../workflow-package/system-design/workflow.md), `agents/routes.md`, `schemas/*.schema.md` (this document translates and closes their semantics; it does not redefine them) |
| This Contract answers | The two items deferred by §4.3: the **final fields** (§5 + the normative schemas under `system-contracts/workflow-dsl/schemas/`) and the **merge algorithm** (§7, the verifiable authority/composition-order rules) |
| This Contract does not define | Definition→Implementation compilation/execution, builder/authoring tools, physical directory names, LangGraph/Driver native APIs, Runtime-private state formats |
| Translation parity obligation | English/Chinese anchors, headings, tables, IDs, fields, enums and links stay paired with the companion [`workflow-definition-dsl.zh-CN.md`](workflow-definition-dsl.zh-CN.md) |

### 1.1 Peer concern boundaries

The Workflow Definition, its machine representation, instruction authority, and Package organization are peer concerns. They close one Contract surface and may share this document, but none is an implementation subfeature of another:

| Concern | Owns | Does not own |
| --- | --- | --- |
| Workflow Definition | state, flow, judge, parallel, loop, wait, budget, recovery, Role, Action, and output semantics | schema/checker implementation, instruction composition, Package organization, Runtime execution |
| Machine representation | the 8 JSON Schemas, closure/reference/vocabulary/forbidden-field checker, and minimal machine example | new semantic decisions or Runtime behavior |
| Instruction authority | canonical order, Workflow-control constraint intersection, conflict handling, frozen merge proof, and authority custody chain | Provider tool grants, filesystem/network/credential permission, sandboxing, graph/domain semantics, Package storage layout, Driver-native precedence |
| Package organization | closure rules, owned/referenced resource semantics, and Snapshot/State separation | resource-internal schemas or Definition→Implementation compilation |
| runner implementation | compile and execute an admitted exact Definition/Snapshot without changing declared Action, transition, Gate, or terminal semantics | Contract authorship or re-selection of admitted authority |

The Definition concern is the semantic root for its eleven DSL subconcerns, which do not become separate Contract features. Machine schemas encode these peer-owned semantics; they do not reverse the authority direction. Runtime resource bindings declare what an admitted route requires; they never grant it. DSH or another selected Runtime remains the sole owner of native tool visibility, approval prompts, path/network/credential policy, and effect enforcement.

### 1.2 Definition semantic coverage (v1)

The eleven subconcerns below are one Definition semantic surface. Each has a canonical machine-readable declaration and a fail-closed rule; the runner only realizes those declarations and may not add, omit, or reinterpret them.

| Subconcern | Canonical declaration | Closed v1 semantics | Runner obligation |
| --- | --- | --- | --- |
| state | `state.fields[]` plus reducer definitions | closed field types and reducers; writes merge only by the declared reducer | persist and reduce without changing field or reducer meaning |
| flow | graph nodes, static/conditional edges, terminals, and Action `allowedSuccessors` | start is declared, reachability is checkable, and the exact legal successor set is closed; out-of-set transitions fail | compile only declared edges and reject illegal advancement |
| judge | `conditionalEdges[].judge`, closed predicates, or a non-recursive Planner Action | deterministic predicates inspect structured State; semantic judgment returns a schema-valid classification before branch selection | invoke the declared judge and validate its structured result; never invent a branch |
| parallel | Action `execution.mode: parallel`, branches, and `join.barrier` | the static branch set and join barrier are explicit; aggregation authority is declared and majority decision is forbidden | schedule declared branches and wait for the declared barrier |
| loop | declared graph cycles plus progress State, budget, Gate, and recovery bindings | only declared cycles may repeat; unchanged failure consumes budget and blind replay is forbidden | preserve attempt identity, evaluate progress/budget, and take only a declared exit/recovery path |
| wait | `waits[]` plus Action `waitPolicy` | one correlated pending obligation, exact authorized resume, deterministic expiry, stale/duplicate rejection | map to native interrupt/resume while preserving correlation and fail-closed behavior |
| budget | `budgets[]`, evaluator registration, State counter, and `onExhaustion` | resource dimension and evaluator are explicit; exhaustion never relaxes a Gate | call the admitted evaluator, persist consumption, and follow the declared exhaustion path |
| recovery | `recovery[]`, `noBlindReplay`, checkpoint bindings, and terminals | only known continue/restart, explicit intervene, or non-retryable fail are legal | re-resolve bindings and reject mismatch before any retry or resume |
| role | `roles[]`, Action `responsibleAuthority`, selectors, and routes | responsibility, authority boundary, independence, and admissible bindings are declared; a route requirement is not a Provider grant | select only an admitted route; leave native grants and effects to the selected Runtime/DSH |
| action | `actions[]` input/result schemas, authority, execution, selector, Gate, and successor bindings | input, structured result, responsible authority, validation, and legal continuation are explicit | execute the admitted binding and reject invalid result, Gate bypass, or successor |
| output | `artifacts[]`, templates, result schemas, validators, and terminal settlement | output shape, coverage/completion, lifecycle, validity, and settlement are declared facts rather than free-text success claims | materialize versioned Artifacts, run validators, and settle only through declared terminals |

Completeness is relative to this explicit v1 surface. A shape listed as unsupported in §18.1 is rejected or modeled by the documented v1 alternative; it is not filled by Runtime guesswork. Adding that shape later is Contract evolution under §11 and §18, not an implementation-side interpretation.

**Explicitly not in scope** (consistent with runner §41):

1. No compilation/execution of "Definition → LangGraph `StateGraph`" — that is runner/Execution-layer work.
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

### 3.2 Package semantic ownership and machine-proof boundary

The Package concern owns the six normative closure rules above, the owned/referenced resource lifecycle (§5.8 and §8), and Snapshot/State separation (§9). The schema concern owns their physical encodings in `package.schema.json`, the checker, fixtures, and published conformance evidence. Here, **machine-checkable** means that every rule has closed inputs, a deterministic predicate, and an explicit fail-closed outcome; it does not claim that a particular checker release already implements or passes the rule.

| Closure rule | Closed machine input | Required result on mismatch | Physical proof owner |
| --- | --- | --- | --- |
| Document set | Package index plus the six declared documents, their `kind`, and `schemaVersion` | reject admission | schema/checker |
| Definition identity | declared Definition identity plus bytes of `documents.workflow` | reject admission | schema/checker |
| Resource reference closure | all route/artifact/template/selector resource references plus the Package resource index | reject undeclared references | schema/checker |
| Owned/referenced shape and identity | owner, path or sourceLocator, contentIdentity, and resolved content | reject missing, mixed, floating, or mismatched bindings | schema/checker |
| Authority declaration | declared authority order and conflict mode plus the canonical values in §7 | reject expansion, reordering, or non-fail-closed conflict handling | schema/checker |
| No ambient fallback | the complete resolved closure and every attempted runtime binding | reject substitution or re-resolution; enter only a declared failure/recovery path | checker/admission |

Consequently, completion of the Package semantic Contract is independent of the publication status of its physical validator. A Package may claim semantic conformance only when these inputs and outcomes are declared; it may claim physical conformance only with the schema/checker evidence required by §12.

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
| `environmentRequirements[]` | no | compatibility prerequisites only; never credentials or authority grants |
| `compatibility` | yes | `minContractVersion`/`maxContractVersion` (the Contract range this Package declares compatibility with) |

### 5.2 `agentops.workflow-definition` (`workflow.json`)

| Field | Required | Meaning and constraints |
| --- | --- | --- |
| `kind` / `schemaVersion` | yes | `agentops.workflow-definition` / `agentops.workflow-dsl@X.Y.Z` |
| `workflow.{id,name,version,purpose,contractVersion}` | yes | independent Definition version identity (composition model §4.1) |
| `state.fields[]` | yes | see §4.2; `name` pattern `^[a-z][A-Za-z0-9_]*$` (lowercase initial; camelCase and snake_case are both valid) |
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
| `authorityBoundary.writePermissions[]` | yes | Workflow artifact/result authorship boundary as `target` + `scope` (e.g., run-workspace write, finding write, approved-manifest commit); not a filesystem or Provider permission grant |
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
| `resources.skills[]` / `tools[]` | no | exact resource/dependency references; a tool reference does not grant native use |
| `resources.model` / `driver` | yes | exact compatibility/dependency references, not authority layers |
| `resources.sessionPolicy` | yes | Workflow session intent `{freshness: fresh-per-episode/continuous-within-goal/resumable-within-admitted-dialogue, isolation: isolated/shared, resumeRule?}`; native Session state remains Runtime-private |
| `access[]` | yes | required Workflow data/Artifact access intent `{target, mode: read/write/execute}`; DSH Tool Policy independently authorizes the native effect |
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

- Semantic recovery allows only (runner `runner.driver.006`): known `continue`, known `restartFromSavepoint`, or explicit uncertainty entering `intervene` (durable Intervention); `fail` is for non-retryable failures.
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

### 7.2 Boundary classification and constraint intersection

This Contract uses **authority** only for Workflow semantic control. It does not define or emulate an Agent Provider permission system:

| Boundary class | Owner | Contract treatment |
| --- | --- | --- |
| Workflow semantic control | Workflow Action, Role, and admitted Route | machine-declared and subset-checkable here |
| exact model/tool/Driver/session dependencies | Package/Route owner; selected Runtime Adapter validates compatibility | content-bound requirements only; never grants |
| native tool visibility, approval, path/network/credential policy, and side-effect enforcement | DSH or another selected Runtime | passed through at the Adapter seam; not represented as portable authority |
| authentication, authorization platform, RBAC, sandboxing, hostile-Package defense | outside the trusted local MVP | no schema or implementation in this Contract |

The closed Role concern vocabulary is:

`responsibility | authority | write-permission | mission | method | transition-selection | gate | budget | terminal | data | session | route`

Here `write-permission` means custody to author a declared Workflow Artifact/result class; it does not mean filesystem permission. The machine authority carriers are:

- Action envelope: `responsibleAuthority`, `allowedRoutes`, `selector`, `gate`, `budget`, `allowedSuccessors`, and `escalation.cannotChange`;
- Role envelope: `roles.authorityBoundary.concerns` + Workflow-artifact `writePermissions` + `prohibited`;
- Route projection: an Action-authorized Route's declared Role identity, Action Prompt bindings when present, exact resource kinds/identities, Workflow `access` intent, and `managedProjection: required`.

Action Prompt and Skill content receives **no independent authority**. A resource entry's `kind`, content identity, and `use` establish identity, classification, and descriptive consumption intent; `use` is not a permission language and is not translated into a DSH grant.

**Check rule R2 (restrict only, never expand)**: effective Workflow authority is the intersection of the Action and applicable Role envelopes, projected through an Action-authorized Route. The Action's explicit `allowedRoutes` is the upper bound on Route/Role selection—including declared multi-lens or custody Routes whose Role differs from the nominal `responsibleAuthority`; an Action Prompt may be bound only through a Route listed by that Action. No Prompt, Skill, model, tool, Driver, session policy, or Adapter may add transition-selection, Gate, budget, terminal, successor, or escalation authority. Provider-native permission is deliberately outside this comparison.

**Check rule R3 (missing fails)**: a Role Action without a declared responsible Role boundary, an instruction-bearing resource not bound through any Route, a Route missing its schema-required resources, an incorrect resource kind, or an unresolved content identity fails admission. Action Prompt cardinality is Package semantics: a Route may bind zero, one, or multiple prompts for an Action, but every declared binding must name an Action that explicitly allows that Route. Missing Provider tool availability is instead a typed Runtime-compatibility/preflight failure; native permission approval or denial remains the Provider's result and is never ambiently replaced.

### 7.3 Conflict determination and the honest boundary

- **Machine-decidable part**: an Action Prompt bound through an unauthorized Route, an unbound instruction resource, a missing/incorrect resource binding kind, selector/planner conflict, `allowedSuccessors` overreach, Workflow-artifact authorship overreach, and contradictory reducer semantics — all fail closed statically.
- **Text-level conflicts** (contradictory natural-language instructions or a Prompt/Skill claiming control it cannot possess) are not fully decidable. They are verified as **negative conformance scenarios** (the `conf.negative.authority` class). The structured Action/Role/Route envelope remains authoritative regardless of the text, and the Runtime must not turn such text into control state. **Resolving** conflicts via Driver priority or a Provider permission setting is forbidden.

### 7.4 Driver has no priority

The Driver/session policy is **not an authority layer**: it cannot reorder, override, or substitute the merge result. The merge result is a **frozen instruction bundle** (with each resource's content identity) handed to the Driver, which may only project it and cannot take Workflow control in reverse (composition model §5 authority table).

### 7.5 Merge result and recomputability

The merge algorithm is deterministic: given (Package, Action, Route) → collect instruction resources in canonical order (`rolePrompt → actionPrompts[action] → skills`, with Artifact/user data last) and bind the exact model/tools/Driver/session requirements separately → boundary checks (R1–R3) → output the frozen instruction bundle (ordered instruction references + all dependency content identities + Workflow-authority proof). A verifier can independently recompute the same bundle; any mismatch fails closed. **R5**: merging modifies no resource content, grants no Provider permission, and only produces the composition-order proof.

### 7.6 Relation to the Package Snapshot

The merge proof (authority order + boundary checks + resource content identities) is part of the Snapshot resolution closure (the "Authority order" and "Resolution proof" groups of `package-snapshot.schema.md`), frozen at admission and immutable during a run.

### 7.7 Authority custody chain

Authority passes through one closed custody chain; every transition narrows or freezes authority and none permits reinterpretation:

```text
configuration repository / Workflow owner
  → Configuration Identity Authority
  → Admission + Manifest
  → runner activation / Runtime Profile seam
```

The repository and Workflow owner author the Definition, Package relationships, and exact resource versions. The Configuration Identity Authority resolves their explicit relationship closure into one immutable Package Snapshot. Admission decides admissibility and persists the Manifest that freezes the one exact Snapshot binding. The runner receives only that admitted binding, rechecks Workflow authority, dependency closure, selected-Runtime compatibility, and the merge proof before activation, then projects the request through the Runtime Adapter without ambient fallback or resource substitution. DSH owns its native Tool Policy and Native Tool Grant interaction; neither the runner nor this Contract fabricates a grant. A selected Driver is downstream of the frozen projection and never becomes an authority layer. Missing closure, changed content identity, merge-proof mismatch, or an unsupported required dependency fails closed before Workflow advancement.

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
| Contract version | `agentops.workflow-dsl@X.Y.Z`; this document = first-release candidate `1.0.0`, still unpublished until every gate and owner approval passes |
| Prior candidate | `agentops.workflow-dsl@0.1.0` is `NON_RESOLVING_LEGACY_HISTORY_ONLY`; Git history owns provenance and no current resolver or compatibility range may select it |
| Snapshot | binds all exact versions + content identities; one Delivery binds one Snapshot |

### 11.2 Compatibility classes

| Change | Class | Rule |
| --- | --- | --- |
| Adding optional fields/resources, adding Actions/nodes (without changing existing semantics), text fixes | MINOR/PATCH, backward compatible | existing Snapshots/Deliveries unaffected |
| Changing Action semantics, adding/removing/changing transitions/gates/terminals, changing reducer semantics, changing authority order or boundaries | **MAJOR (semantic change)** | requires a new Definition version + new Package major + new Snapshot; applies only to new Deliveries |
| Adding a state field (with a default reducer) | compatible | — |
| Removing a state field / changing reducer behavior | breaking | MAJOR |
| Same identity, different content (digest mismatch) | forbidden | fail closed (runner `runner.decision.002`, `concept.acceptance.012`) |
| `latest`/bare-name selection | resolution-time only | resolved to `exactVersion` before the Manifest is created; alias movement affects only later Deliveries (agent-architecture §4 invariant 14) |

### 11.3 Conformance and versions

A Definition claiming conformance to `agentops.workflow-dsl@X.Y.Z` must: pass that version's schema validation + pass the closure/merge/§8–§10 machine rules + pass the conformance corpus; a Runtime Profile claiming conformance must: compile the Definition into an Implementation without changing Action/transition/Gate/terminal semantics, verify Snapshot bindings, pass the corpus, and leak no native IDs (§12).

## 12. Conformance Requirements

### 12.1 Three levels of conformance

| Level | Subject | Evidence |
| --- | --- | --- |
| Document conformance | a single DSL document | JSON Schema validation (`system-contracts/workflow-dsl/schemas/`) + `additionalProperties: false` closure |
| Package conformance | the whole Package | document level + §3.1 closure + §7 merge proof + §8–§10 machine rules + **conformance corpus** (positive/negative/recovery scenarios, e.g., the 7 scenarios in `system-contracts/workflow-dsl/examples/minimal/validation.json`) |
| Implementation/Runtime conformance | Runtime Profile / compile layer | compilation without changing Definition semantics, Snapshot-binding validation, passing the corpus, forbidden-field scan, no native-ID leakage; **no physical-conformance claim before schemas/registry/fixtures/validation evidence are published** |

### 12.2 Machine-check checklist (core items; the example checker implements these)

1. JSON parses; kind/schemaVersion match;
2. all references resolve (documents, owned paths, action/role/route/wait/budget/recovery/validator/artifact/resource ids), and Route resource references have the required exact kind;
3. Action→Route authorization and instruction-resource bindings satisfy R2/R3; `allowedSuccessors` == graph out-edge set; a node does not mix static and conditional out-edges;
4. closed vocabularies: reducer / predicate op / Workflow authority concern / authority order / session freshness / isolation;
5. owned and definition digests match; referenced sourceLocators complete;
6. forbidden-field scan (Appendix C): no LangGraph/Driver physical tokens in any Definition.

### 12.3 Conformance corpus

Every Package must declare at least: the legal main path (positive), illegal transition / overreach / missing resource / authority overreach (negative), Wait/resume correlation, budget exhaustion, crash recovery, cancellation (recovery). Corpus scenarios are part of the Package (`validation.conformance[]`) and must be executable by a Runtime or simulator.

### 12.4 Workflow execution capability requirements

Any Runtime Profile claiming conformance must implement every **Workflow execution** capability the DSL can declare; these are orchestration semantics, not Provider-native tool permissions. The two first-party Definitions already exercise a subset. A conforming Runtime supports all of the following:

| DSL construct | Required Runtime capability |
| --- | --- |
| conditional edges, `judge.kind: state` | deterministic evaluation of closed-vocabulary predicates over Workflow State |
| conditional edges, `judge.kind: planner` | dispatch the declared Planner Action's Agent for semantic judgment of (possibly unstructured) context; validate the returned structured classification against `resultSchema`; then evaluate `conditions[].when` over that classification to select the branch; the target must be within the source Action's `allowedSuccessors` |
| parallel execution (`execution.mode: parallel`) | schedule all required branches (session-isolated or shared), enforce the `barrier`, then apply the declared `join` (`all` or `aggregator` action); branch isolation holds until the barrier closes |
| runtime-authority actions (`responsibleAuthority.kind: runtime`) | execute the declared deterministic validator directly — no Agent session, prompt, model, or route |
| budgets (`budgets[]`) | invoke the `evaluator` script registration point (content-addressed) to obtain the budget conclusion; on `onExhaustion` enter the declared terminal/wait/recovery path; exhaustion never relaxes a Gate |
| planner selectors (`selector.kind: planner`) | validate the structured selection proposal against `proposalSchema` and `allowedTargets` before advancing |
| waits / checkpoints / terminal settlement | durable correlated resume, minimum checkpoint bindings (§9.2), checkpointed terminal proposal (existing runner scope) |
| merge algorithm (R1–R3) and route resolution | recompute the frozen instruction bundle from the Snapshot; reject any mismatch |

A capability a Definition declares but the Runtime cannot honor is a hard failure at admission/activation (fail closed), never a silent degradation. This list is the executable contract for the runner Host (`runner.open-work.009` / `runner.open-work.012`) and for the Host-consumption gap `runner.open-work.003.1`.

**Implementation ownership.** The first-party implementation of these capabilities is the runner (LangGraph Workflow Host): the DSL is compiled to LangGraph semantics and the Host owns scheduling, barrier/join, judgment dispatch, budget-evaluator invocation, and route resolution. DSH is the current host Adapter; its bundled workflow capability does not carry Workflow-orchestration semantics — it is precisely the capability runner replaces — so no host/Adapter-native workflow capability is part of this Contract.

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

The complete example lives at [`system-contracts/workflow-dsl/examples/minimal/`](../../../system-contracts/workflow-dsl/examples/minimal/) (`package.json` + 6 documents + 8 owned resource files) and supplies inputs for mechanical closure checks (JSON Schema, reference resolution, closed vocabularies, `allowedSuccessors` == out-edge set, digest matching, no LangGraph/Driver physical fields). Its physical conformance status is established only by the schema/checker evidence required by §12, not by this semantic document. The example covers:

- **graph**: start → `node.intake` → `node.review` (parallel dual lens) → `node.aggregate` (conditional edges) → `node.finalize` / `node.review` (re-review loop) / `terminal:FAILED`;
- **state + reducers**: `status`(overwrite), `context`(merge), `findings`(append), `reviewIterations`(sum), `aggregation`(overwrite);
- **conditional edge**: `cedge.aggregate` with three predicates + default;
- **checkpoint**: `node.intake` declares the minimum binding set;
- **Wait/recovery**: `wait.user-confirm` (user, resume=intake), `wait.external-obligation` (external); `recovery.default`(continue), `recovery.review-restart`(restartFromSavepoint), `recovery.intervene`;
- **terminal**: `SUCCESS/FAILED/INCOMPLETE/CANCELLED`;
- **Role route**: 2 Roles, 4 routes (including the blackbox/whitebox isolated routes with parallel execution + aggregator join); deterministic `action.finalize` remains Runtime-owned and has no Agent route;
- **owned/referenced**: 8 owned resources (real digests) + 6 referenced resources (sourceLocator + content-comparable identity, including the budget evaluator registration);
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

### 18.1 Known limitations (validated during Task 2 migration)

| Limitation | Status |
| --- | --- |
| Parallel actions cannot express per-branch roles (single `responsibleAuthority`); SD-09's three lenses use a nominal role with per-lens enforcement via `validation.review` + branch routes | accepted: parallelism is action-level orchestration initiated by the Runtime (`execution.mode: parallel` is v1; first-party implementation is the runner/LangGraph Workflow Host — scheduling, barrier, join, branch isolation; no host/Adapter-native workflow capability enters the Contract); single-action multi-role expression is not done; **multi-action concurrency** (graph-level parallelism) is a candidate extension |
| Dynamic branch-subset activation (e.g. SD-09 recheck of only invalidated lenses) | accepted as Runtime scheduling detail, not workflow semantics |
| Wait resume targets are fixed (`wait.resumeAction`); a logical wait that routes by a recorded `resume_action` is expressed as one wait per trigger Action | semantically equivalent; no DSL change |
