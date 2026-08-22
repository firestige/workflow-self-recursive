<a id="ee-execution"></a>
# Project Execution System Design

<a id="ee-execution-1"></a>
## 1. Metadata and Authority

| Field | Value |
| --- | --- |
| Document identity | `execution.identity.001` |
| Publication status | `WORKING_REVIEW_CANDIDATE`; prior bounded review, translation, and fresh-reader closure apply to earlier bytes only. These changed bytes require fresh deterministic parity/publication binding and user or reader review before exact publication. |
| Exact publication binding | The external publication set/application record must bind this byte stream and the companion canonical Concept byte stream by SHA-256, record the applicable review, SD-12, fresh-reader, and deterministic-verification evidence, and prove exact installation. This document intentionally declares no self-digest or companion digest. |
| Authority after promotion | Sole versionless English Project Execution System Design authority |
| Normative language | English |
| Translation | [`project-execution-system.zh-CN.md`](project-execution-system.zh-CN.md) is a non-normative tracking translation. English is the sole semantic authority. Whenever an English section changes, its Chinese counterpart is retranslated from the current English section and replaced as a whole; Chinese maintenance does not preserve or incrementally evolve prior Chinese wording. |
| Source authority commit | `575f4c3217ef5ff2ef2f8655e03ee147b16ac07b` |
| Concept authority | [`concept.identity.001`](../../agent-architecture.md#ee-concept), promoted atomically as the companion member |
| Prior canonical Execution baseline | `execution.identity.001`; Git blob `7c9e13846141f95dc04dc3c44534767113b7d19e`; SHA-256 `4d459b2a15a7ca5591d0fa493e0fb82b62dfe6f502fc703e21eab566727e66bb` |
| Composition authority | [`docs/workflow-composition-model.md`](../../workflow-composition-model.md); Git blob `b5412f5b9fc605f7d82d85fc3fc399f80b2fa25a`; SHA-256 `0df16622d8183eecaddc602cbe6800841a8be523de2d3b93b4c0540082092d03` |
| Confirmed intent | `EE-WORKFLOW-IMPORT-BRIEF`; SHA-256 `7c9b1064084cf5f256f27bc5efd021bed0374910e1430586eebeb695344d4c6d` |
| Confirmed direction | `EE-WORKFLOW-IMPORT-SKELETON`; SHA-256 `86a2a61a324d9bb7ca90108b433ded2f883bc91d9f60dadee87ac7d11feb8e46` |
| Historical direction review | `EE-WORKFLOW-IMPORT-SD05-ARCH-RECHECK`; SHA-256 `2c4fbaef0db617ccfc9ce20be8b5470a7251938744cc2d5d792f5ed9ed197c4a`; `PASS`; applies to the prior large Workflow-import direction |
| Feasibility | `EE-WORKFLOW-IMPORT-SD06-APPLICATION`; SHA-256 `c6714b9c850536273a00b929559f6d71b8ff2c8aeb1f2aaf8054c14c53ca5795`; `FEASIBILITY_CONFIRMED` |
| Targeted simplification authority | `EE-WORKFLOW-IMPORT-MVP-SIMPLIFICATION-RR`; removes mechanisms only, adds no feasibility question, and authorizes bounded affected review |
| Historical expansion inputs | `EE-WORKFLOW-IMPORT-SD07-CP01` SHA-256 `f4c3ef4a09867fc05e2782aefec7616f02b96132cb7ccddf158156ba526e1d85`; `CP02` SHA-256 `0d16e85e4f944720aa49a54ff7c60f2545f925d7a9576067128e860a2ae98d84`; `CP03` SHA-256 `e6f1f054bcf2252684f9e587e09a058e3f40f885bfbbc7011d99fc6d4732a4cd`; apply to the prior large Workflow-import expansion |
| Historical large-workflow review lineage | Problem–Solution, Architecture, and Quality review results from the larger Workflow-import design remain historical evidence for unchanged content only. |
| Historical large-workflow Finding accounting | `EE-WORKFLOW-IMPORT-SD10-AGGREGATION` is historical and is not the Finding account for this targeted simplification. |
| Historical design-parameter and handoff closure | `EE-WORKFLOW-IMPORT-SD12-CLOSURE-HANDOFF`; SHA-256 `60f24178d3a2f8991d6af2f974e4ed03d35aedc0064d9d253b3773e732e18ea7`; `SUCCEEDED` |
| Historical large-workflow Fresh Reader lineage | `EE-WORKFLOW-IMPORT-SD13-FRESH-READER-RESULT` applies to prior bytes and remains historical. |
| Historical controlled integration authority | `EE-WORKFLOW-IMPORT-SD14-REVISION-REQUEST`; SHA-256 `135ab9647fc6e30318735eff3cef858853cec75f47704e6eaaabd13ecbc59b2e`; deterministic report SHA-256 `1eda28b1c73a8b7d931ab58207d34796173a06bf20cdfae0e17accb2a3a3dc18`; applies to the prior large Workflow-import integration |
| Bounded affected reviews | Problem–Solution SHA-256 `807863cb6c7887eccdb2720df5ace0afd8e4833f763a029928f44ed1e30e92ae`; Architecture SHA-256 `b220e1114d166cc5a55e34635f847ac2c1af0cf1777bb9c6a6c08dbadf5cdf98`; Quality SHA-256 `b64927087758a987a1f5a4d461035c379970ad84af57133714462ea19ac22f77`; converged on two treatment groups |
| Unified bounded treatment | `EE-WORKFLOW-IMPORT-MVP-SIMPLIFICATION-SD10-TREATMENT`; SHA-256 `da22b3356aa34c3bcf6e3977a3277ef5b0d9c1e8beef35f4fe0db7dd5e72caf6` |
| Prior focused bounded recheck | `EE-WORKFLOW-IMPORT-MVP-SIMPLIFICATION-SD10-BOUNDED-RECHECK`; SHA-256 `1b5664afd796910beb8b505bbaadd889fbb7fb098b02c141abb27cdba4e74955`; `CLOSED_FIXED`; open Findings `0`; applies to earlier bytes only |
| Prior translation and fresh-reader closure | Whole-section translation parity SHA-256 `3c236a404392e1d496e33d4adcdd70000d0db2a2453dcbd7df40813612f77c20`; fresh-reader result SHA-256 `1062561d35422bfacfa7e430f381e5fb25a5a2a911fe8daa5e3499eac5fc2a75`; translation treatment SHA-256 `927a02c6d88eba3571e39c010681b8b47dc956e9a8bafea6812aa9cda91c5d14`; focused recheck SHA-256 `6777175a4e78e363d24ddc3f6bc657b66e9f5a6c2e9fd0042dd210705035c18e`; applies to earlier bytes only. Current changed bytes are pending fresh deterministic parity and user or reader review |

Authority order is: confirmed user intent; normative Concept; current Execution semantics; Workflow composition model; the reviewed direction and feasibility evidence; the [Observation Catalog](../../contracts/observation/observation-catalog.md), [OTel Observation Profile](../../contracts/observation/otel-observation-profile.md), [Execution–Evidence Interaction Contract](../../contracts/execution-evidence/interaction-contract.md), and [Metric Catalog](../../contracts/evaluation/metric-catalog.md) only for their split draft companion scopes. The [Evidence System](../evidence/evidence-system.md) remains a peer owner. This document owns Execution Modules, Interfaces, Package-to-Delivery binding, custody/current-slot lifecycle, Runtime Adapter behavior, and outbound Observation behavior. It does not own Package publication policy, Evidence internals, Observation fact meaning, the payload registry, metric schema, or physical storage schema.

The protected `system-design` and `implementation` Workflow Packages are initial verified distribution content and conformance fixtures, not redesign targets outside the R6 corrections authorized below. No disposable workspace artifact is required to interpret this document; the identities above are provenance only.

### R6 Delivery-admission and Runtime Adapter projection

For Iteration 2 Runner, Execution owns `agentops.delivery-admission@1.0.0` at `system-contracts/delivery-admission/delivery-admission-contract.json`. Admission deterministically resolves `agentops.workflow-dsl@1.1.0` author intent into one deeply frozen `RunnerActivationContext`; this includes exact Agent, model, Driver, provider-model, resource, capability, workspace, and local path bindings. G01 receives only that admitted value, never the eight documents, eight root schemas, or shared meta schema.

Execution also owns the unique TypeScript projection `execution-system/src/execution/runtime-adapter.ts`. Its `ExecutionRuntimeAdapter` public operation set is exactly `execute`, `inspect`, and `cancel`. Runner/G05 implements and consumes that import surface. Resume, recovery, checkpoint, thread, and provider-session operations remain private behind the Adapter and must not be copied into or exposed through an Execution public interface.
<a id="ee-execution-2"></a>
## 2. Design Context

workflow-self-recursive runs valuable logical Workflows through a small host-neutral execution seam and optionally emits factual Observation. Execution is embedded per repository/workspace. DSH rc.6 is the first Runtime Adapter; DSH owns native Session and Workflow State and does not support resume. A later runner Adapter may retain richer pause/resume behavior privately without changing Core semantics.

The first distribution contains the protected Implementation and System Design Workflow Packages. Contributors may publish other Packages conforming to the open Agent Ops Workflow composition model. GitHub is the first remote host, and the plugin may bundle the two initial Packages. GitHub and bundle are private Adapters at one Package Source seam.

This is a trusted local preview for an individual or small team. The configured GitHub repository is public, users control installation configuration, and concurrent Package management is not a product requirement. The design handles ordinary faults by validation and typed early return. It does not build authentication, authorization, signing, hostile-Package or prompt-injection defense, sandboxing, multi-user coordination, distributed locking, Package transactions, production recovery, HA, mirror failover, or automatic eviction.

Actors and ownership:

- **Host or Intake** translates host/chat syntax into a generic Workflow selector, task intent, worktree reference, configured source, and selected Runtime context.
- **Execution Core** sequences canonical worktree/exclusive admission, Package preparation only for `NEW`, Manifest creation/persistence, Runtime lifecycle, result validation, and Observation.
- **Delivery Binding** resolves and validates Packages, owns simple local Package storage, returns one exact resolved Package, and constructs Manifest content.
- **Runtime Interaction** owns canonical worktree exclusivity, the current Delivery slot, Manifest persistence, Runtime invocation, recovery, and final handling.
- **GitHub and plugin-bundle Adapters** fetch explicitly selected Package content.
- **DSH Runtime/Profile** owns native Session/Workflow State and terminal truth.
- **Evidence** receives optional one-way Observation and never controls Execution.

<a id="ee-execution-3"></a>
## 3. Problem, Goals, and Scope

The existing Delivery Binding begins too late: it assumes the caller already has exact Workflow identities and never explains where a Workflow Package comes from. Moving download, cache lookup, validation, and Runtime compatibility into Host code would keep Delivery Binding shallow and make each host reproduce the same behavior.

The goal is an implementable local-preview path from a generic selector to DSH:

```text
WorkflowSelector
→ ResolvedWorkflowPackage(name, exactVersion, packageDigest, localPath, workflowId)
→ DeliveryManifest
→ DSH Runtime Adapter
```

A successful call first obtains `NEW` admission, resolves one exact local Package, creates and persists a Delivery Manifest before DSH effect, and validates the Runtime result against that Manifest. `CONTENDED` and `RECOVERY` return before Package work. For `NEW`, a valid local hit does not contact GitHub. A miss downloads from the configured public GitHub repository or accepts an explicitly selected bundle, validates before publishing `READY`, and never falls back to another source/version. Any selector, fetch, Package, cache, compatibility, contention, or Manifest error returns at its own phase. Package preparation failure releases the ordinary holder, creates no Delivery, and is not a Delivery outcome.

In scope are generic Intake, exact/sticky-latest selectors, local hit, public GitHub miss/refresh, explicit bundle input, contributed conforming Packages, `MISSING/STAGING/READY` storage, ordinary format/required-resource/relationship/version/digest checks, DSH compatibility checks, immutable Manifest binding, existing current-slot recovery, DSH result validation, and unchanged Observation.

Out of scope are Package ranking/fallback, ambient completion, authentication/authorization/RBAC, credentials for the public source, signing, hostile input isolation, injection defense, sandboxing, concurrent Package correctness, queueing/fairness, distributed locks, Package transaction/proof/hold protocols, automated eviction, production download/recovery guarantees, registry/marketplace, HA/failover, repository naming/layout, physical schema, another Runtime implementation, Evidence redesign, runner revision, and changes to the protected Packages.

Success means an implementer can build the path through the three existing Modules with simple state and typed results, without inventing another lifecycle before the Delivery Manifest.

<a id="ee-execution-4"></a>
## 4. Design Drivers

| Driver | Required outcome | Structural consequence |
| --- | --- | --- |
| Delivery Binding depth | Hosts do not implement Package import choreography | M01 exposes one resolve/prepare operation and owns private Source/Store seams |
| Admit before request Package work | contender and stored recovery avoid needless selector/cache/download work | Core calls M02 first; only `NEW` calls M01 |
| Prepare before Delivery | acquisition or validation failure is not a Delivery failure | under the ordinary `NEW` holder, M01 completes before Core creates Manifest content or invokes DSH |
| Exact binding | alias or Release movement cannot alter a created Delivery | resolved value contains exact version, digest, local path, and Workflow ID |
| Docker-like local-first | valid exact/latest hit avoids GitHub; bare name means latest | Store lookup precedes Source Adapter; sticky alias points to a `READY` exact Package |
| Ordinary fault containment | malformed/unavailable input stops early without a recovery subsystem | typed early-return results at selector, source, validation, cache, admission, and Manifest phases |
| Simple exclusivity | one current DSH Delivery per worktree | M02 attempts exclusive admission and immediately returns `CONTENDED` when unavailable |
| No fallback/default completion | failure never chooses another source/version/resource | one configured source or explicit bundle; DSH validates before native effect |
| Open contribution | compatible third-party Package uses the common path | composition and DSH checks, no first-party allow-list |
| Preview restraint | complexity must match trusted local use | no security platform, concurrent Store protocol, automatic eviction, or production recovery |
| Observation non-control | telemetry failure cannot alter outcome | unchanged one-way M03 Interface |

Numeric latency, timeout, capacity, and retention settings remain implementation/operations choices unless measured facts later force a design change.

<a id="ee-execution-5"></a>
## 5. Problem Decomposition

1. **Admit or recover.** Canonicalize the worktree and return `CONTENDED`, stored `RECOVERY`, or an exclusive `NEW` holder before interpreting the new Package selector.
2. **Resolve and prepare a Package for `NEW`.** Use a valid local exact/sticky alias when available, otherwise fetch one configured candidate, validate it, publish it as `READY`, and return one exact `ResolvedWorkflowPackage`.
3. **Create and run one Delivery.** Under the same ordinary holder, construct and persist a Manifest from the resolved Package, invoke DSH, validate its result, and maintain the existing current-slot lifecycle.
4. **Observe bounded facts.** After a Delivery exists, map actual facts to the existing best-effort Observation profile without controlling execution.

These map directly to Delivery Binding (M01), Runtime Interaction (M02), and Delivery Observation (M03). Package source and storage mechanics remain inside M01; native Runtime lifecycle remains inside M02. The deletion test justifies all three Modules: removing one spreads its policy across Host/Core/Adapters. No fourth Module is justified.

<a id="ee-execution-6"></a>
## 6. System Structure

```mermaid
flowchart LR
    Host[Host or Intake] -->|execute generic request| Core[Execution Core]
    Core -->|admit first| M02[Runtime Interaction]
    Core -->|NEW: resolveWorkflowPackage| M01[Delivery Binding]
    M01 --> Source[private Package Source Interface]
    GitHub[Public GitHub Release Adapter] --> Source
    Bundle[Plugin Bundle Adapter] --> Source
    M01 --> Store[private Local Package Store]
    Core -->|persist / run| M02
    M02 --> Runtime[private Runtime Adapter Interface]
    DSH[DSH Adapter and Session] --> Runtime
    runner[Later runner Adapter] --> Runtime
    M02 -. bounded facts after Manifest .-> M03[Delivery Observation]
    M01 -. exact bound facts .-> M03
    M03 -. best-effort OTLP .-> Evidence[Evidence Admission peer]
```

### Delivery Binding (`execution.milestone.01`), deepened

M01 hides selector parsing, exact/sticky lookup, GitHub/bundle acquisition, staging, Package validation, DSH compatibility checks, `READY` publication, alias update, resolved-value construction, Manifest content construction, and result-binding checks. Its main caller-facing operation is:

```text
resolveWorkflowPackage(selector, configuredSource, runtimeTarget, refresh?)
  -> ResolvedWorkflowPackage
  | WorkflowImportError
```

The result is a plain immutable value: `name`, `exactVersion`, `packageDigest`, `localPath`, and `workflowId`. It is not a capability, proof, hold, or lifecycle state. M01 additionally constructs Manifest content from a Delivery context plus that value and validates a bounded Runtime result against the Manifest. Callers never coordinate Source or Store steps themselves.

### Runtime Interaction (`execution.milestone.02`), preserved and bounded

M02 hides canonical worktree derivation, immediate exclusive admission, current-slot state, Manifest persistence, start uncertainty, Runtime invocation, inspection, recovery, final handling, authorized abandonment, and private runner lifecycle mapping. It remains the unique writer of custody/current-slot state and persister of the current Manifest. It does not interpret selectors, download Packages, or write Package Store state.

The preview does not add a second pre-Manifest lifecycle. Before a Manifest exists, failure releases the ordinary in-process/OS-backed exclusive holder and returns. A process death releases that holder. If death occurs after the Manifest becomes visible, the existing occupied-slot recovery reads that Manifest on the next call. No `ARMED`/commit-unknown/reconciliation state is introduced.

### Delivery Observation (`execution.milestone.03`)

M03 maps bounded actual Delivery facts to the adopted allow-listed standard-first Observation Profile, owns privacy/redaction and exporter isolation, and returns diagnostics only. It does not own source facts or control execution. Custody-only attempts and preparation rejection produce no Delivery Observation. The exact carrier/EventName/common/family registry and complete Review-family shapes are owned by the [OTel Observation Profile](../../contracts/observation/otel-observation-profile.md); technology-neutral fact meaning, identity, missingness, privacy, lineage, usage, and relationship semantics are owned by the [Observation Catalog](../../contracts/observation/observation-catalog.md); transport interaction is owned by the [Execution–Evidence Interaction Contract](../../contracts/execution-evidence/interaction-contract.md). M3 does not own the payload registry or Evidence durable storage semantics.

Specifically, proposed profile `1.0.0` carries forward the adopted semantics and adds the owner-supplied C55–C57 mappings; `0.3.0` is non-resolving legacy history only. The current profile uses official OTLP/HTTP binary protobuf Trace and Log export, one sampled Delivery root with nested Workflow/Agent/model/tool Spans, ten EventNames, and the closed 57-common/10-Implementation/6-System-Design field registries. One family may use common plus its own fields, never its sibling's. Stock DSH Session JSON telemetry stays disabled. Every Event has stable `agentops.event.id`; every Span is identified by its native `(trace_id, span_id)` tuple. Standard token usage remains on model Spans, while other provider-native quantities use typed usage Events with exact kind/unit/source/source-ID/completeness; missing never means zero and no conversion or price is inferred.

Review summary, Finding, Fix, and Recheck still select one complete named base-plus-variant shape. Every Finding carries one bounded privacy-safe factual summary, a Finding-specific scope identity, and exactly one typed Artifact/section/component/requirement target; multi-target Findings repeat the complete assertion per target edge. Owner-known Role lineage carries both version-local Role ID and family-scoped lineage ID; unknown lineage is omitted, never inferred from name or position. M03 emits no prompt, message, tool argument/result, source/diff, credential, or raw-error body and never infers quality, causality, reviewer effectiveness, or relationship from names, order, counts, or grouping. Administrative unresolved/abandonment state remains M02 state and is not a first-profile Observation.

Implementation facts retain typed test summary and one implementation summary per coverage scope/tool/format/report Artifact. System Design retains common review relationships, Fresh Reader review summary, and deterministic-verification summary. Observed Agent/model/tool calls and durations stay on standard Spans; family summaries carry only owner-observed loop/intervention facts. Before emission M03 selects one whole shape and requires its entire base and variant additions—never a fragment or implicit inheritance.

For ordinary and Recheck summaries, owner input with a nonnegative observed count emits C17 exactly, including zero; absence of a count fact omits C17. Omission is the whole wire signal for no count fact. Invalid count type/range emits no malformed Observation. C17 remains prohibited on Finding shapes. C27 remains required only where the existing profile requires Recheck semantics. Assertion, target, status, Fix, and Recheck identities remain distinct; exact retry is a no-op and compatible later lifecycle facts append rather than rewrite the assertion. Every lifecycle record repeats the immutable assertion and exact typed target coordinates required by its selected shape.

### Private seams

- The **Package Source Interface** is real because GitHub and bundle are two Adapters. It accepts an exact or latest candidate request and returns candidate bytes plus ordinary version/digest metadata, or a typed not-found/fetch failure. It does not construct resolved values or Manifests.
- The **Local Package Store** is private M01 state. Lookup exposes only `MISSING` or `READY`; `STAGING` is never addressable. The implementation may use a temporary directory and rename to publish a complete Package, but the System Design does not require a transaction manager or concurrent-writer protocol.
- The **Runtime Adapter Interface** accepts a persisted exact Manifest binding. DSH and later runner differ privately; no native type crosses Core.

Dependency direction is acyclic toward Core-owned meaning. Host does not orchestrate M01 internals; M02 never accesses Source/Store; source Adapters never construct Manifests; M01 does not depend on Evidence; DSH does not choose Package identity.

<a id="ee-execution-7"></a>
## 7. Collaboration and End-to-End Flows

### Branch-free successful Delivery

```mermaid
sequenceDiagram
    actor User
    participant Host as Host / Intake
    participant Core as Execution Core
    participant RI as Runtime Interaction
    participant DB as Delivery Binding
    participant SS as Source and Store
    participant DSH as DSH Runtime Adapter
    participant DO as Delivery Observation

    User->>Host: run selector with task intent
    Host->>Core: execute(generic request)
    Core->>RI: admit(canonical worktree)
    RI-->>Core: NEW exclusive holder
    Core->>DB: resolveWorkflowPackage(...)
    DB->>SS: lookup READY exact or sticky latest
    SS-->>DB: MISSING
    DB->>SS: fetch configured candidate into STAGING
    DB->>DB: validate format, closure, version, digest, DSH compatibility
    DB->>SS: publish exact Package READY, update requested latest alias
    SS-->>DB: local exact Package
    DB-->>Core: ResolvedWorkflowPackage
    Core->>DB: createManifest(delivery context, resolved Package)
    DB-->>Core: immutable Manifest content
    Core->>RI: persist Manifest/current slot
    Core->>RI: run persisted Delivery
    RI->>DSH: activate exact local Package
    DSH-->>RI: correlation and terminal result
    RI->>DB: validate result against Manifest
    DB-->>RI: valid result
    RI->>RI: final handling, clear slot, release holder
    Core->>DO: bounded actual Delivery facts
    Core-->>Host: final Delivery outcome
```

The successful ordering is admit `NEW`, resolve/prepare, construct Manifest, persist current Manifest, mark start uncertainty, invoke DSH, validate result, finalize, then observe. Package preparation occurs under the ordinary Delivery exclusivity holder but has no Delivery identity or Delivery Observation. This holder prevents another current Delivery; it is not a Package proof, hold, transaction, or concurrent Store protocol.

Every selector, source, Package, version, digest, cache, and DSH compatibility branch owned by M01 occurs only after M02 returns `NEW`. Any such failure releases the ordinary holder and returns before Manifest persistence, Delivery creation, Runtime/Session/worktree effect, or Observation. Canonical worktree and request-shape checks needed by M02 to perform admission remain M02 preconditions. `CONTENDED` and `RECOVERY` never call M01, Source, or Store.

### Valid local exact or sticky-latest hit

M01 parses the selector and asks Store first. `name@exactVersion` resolves only the matching `READY` Package. Bare `name` and `name@latest` use the local sticky alias when it points to `READY`. Unless the caller explicitly requests refresh, M01 makes zero Source call. The returned exact fields are copied into the Manifest, so later alias movement affects only later calls.

### Public GitHub miss or explicit refresh

On `MISSING`, or explicit refresh of latest, M01 asks only the configured public GitHub Adapter. Exact selection requests that exact Release; latest selection requests the source's latest Release. The Adapter selects one versioned Package asset and stages it privately. M01 validates before Store publication. For latest, Store updates the alias only after the exact Package is `READY`. Failure returns a typed error and leaves any previous `READY` Package/alias usable.

### Explicit plugin bundle

A bundle is used only when the caller/configuration explicitly selects it. The bundle Adapter supplies the same generic candidate shape as GitHub; M01 runs the same validation, Store publication, resolved-value, and Manifest path. Bundle is not a fallback when GitHub fails.

### Invalid selector

After `NEW`, unsupported or ambiguous selector syntax returns `INVALID_WORKFLOW_SELECTOR` before Source or Store mutation. Core releases the ordinary holder; no Manifest, Delivery, Runtime/Session/worktree effect, or Observation exists.

### GitHub unavailable or Package not found

A required remote lookup that cannot reach/download returns `WORKFLOW_FETCH_FAILED`. A missing requested Release/asset returns `WORKFLOW_NOT_FOUND`. Neither calls the bundle Adapter or tries another version. Core releases the ordinary `NEW` holder; no Manifest or Delivery exists.

### Invalid or incomplete Package

Malformed Package index, missing required owned/referenced resource, unresolved relationship, unsupported composition, or invalid identity returns `WORKFLOW_PACKAGE_INVALID`. The candidate remains non-addressable, Core releases the ordinary `NEW` holder, and no Manifest or Delivery exists.

### Version or digest mismatch

A candidate whose declared/resolved version disagrees with the request returns `WORKFLOW_VERSION_MISMATCH`. Digest disagreement returns `WORKFLOW_DIGEST_MISMATCH`. M01 does not publish `READY` or reinterpret the candidate as another version; Core releases the ordinary `NEW` holder.

### DSH incompatibility

After `NEW`, M01 checks that the selected Package contains the declared DSH implementation/routes and required configuration before returning the resolved value. Missing or unsupported DSH inputs return `WORKFLOW_DSH_INCOMPATIBLE`; Core releases the ordinary holder before Manifest persistence, Delivery creation, Session, provider/Driver, worktree effect, or Observation. This check returns an error; it does not create a persisted proof object.

### Cache publication failure

Failure to make a validated candidate `READY` returns `WORKFLOW_CACHE_PUBLISH_FAILED`, then Core releases the ordinary `NEW` holder. `STAGING` is ignored by future lookups and may be removed best effort. Initial-fill failure leaves lookup `MISSING`; refresh-candidate failure leaves the prior `READY` exact Package and sticky alias unchanged. The preview promises no crash/power-loss matrix or concurrent refresh correctness.

### Delivery contention

M02 attempts the existing per-worktree exclusive admission before Core calls M01. A live/current holder returns `CONTENDED` immediately. Core does not wait, queue, steal, resolve/download a Package, access request-specific Store state, create a Manifest, invoke DSH, or emit Delivery Observation.

### Occupied-slot recovery

If admission finds an existing current Manifest, M02 returns recovery for that stored Delivery. Core ignores the new selector/task and does not call M01, Source, or Store. It follows the existing DSH inspection/result/authorized-abandonment rules and never starts, resumes, or replaces the stored DSH Delivery.

### Manifest creation or persistence failure

If M01 cannot construct a complete Manifest, Core releases the exclusive holder and returns `DELIVERY_BINDING_FAILED`. If M02 cannot persist the Manifest/current slot, it releases the holder and returns `DELIVERY_CREATE_FAILED`. Neither error is a Delivery outcome and neither invokes DSH or M03. A process death after the Manifest becomes visible is handled by ordinary occupied-slot recovery; no separate commit-resolution protocol exists.

### DSH activation, invalid result, and Observation loss

The DSH Adapter validates that the persisted Manifest points to the exact local `READY` Package before native invocation. It does not scan ambient paths or replace resources. After invocation, existing `START_UNCERTAIN`, `START_FAILED`, `RESULT_UNRESOLVED`, terminal-result, final-handling, and exact authorized-abandonment rules remain. Disabled/refused/timed-out/tail-loss Observation changes no Runtime result or slot handling.

### Later runner lifecycle

runner satisfies the same Core-owned lifecycle meaning but may privately park resumable state, checkpoint, release physical custody, and reacquire valid custody. Those mechanics do not become DSH or public Core requirements, and this revision changes no runner profile/code.

<a id="ee-execution-8"></a>
## 8. Data, State, Identity, and Ownership

### Binding data

```text
WorkflowSelector
→ ResolvedWorkflowPackage
→ DeliveryManifest
→ Adapter-private DSH Session/Workflow State
→ bounded result validated against Manifest
```

`ResolvedWorkflowPackage` contains `name`, `exactVersion`, `packageDigest`, `localPath`, and `workflowId`. The local path identifies the validated `READY` materialization for this installation; version and digest provide the stable content check used by Manifest construction and DSH activation. Source metadata may be retained as bounded diagnostics/provenance, but it is not an authorization identity or capability.

The Manifest binds exactly one Delivery/task relationship, the resolved exact Package fields, logical Workflow/implementation, Runtime/version/configuration, intent reference, and bounded source context. It excludes mutable aliases, raw Package/Prompt/message/tool/source/credential bodies, Runtime checkpoints, Evidence receipts, and native custody/Session identifiers. Physical fields remain downstream representation work.

### Authoritative state

| State | Unique writer | Readers | Rule |
| --- | --- | --- | --- |
| selector/configured source | Host/Intake | Core/M01 | generic input; source is trusted configuration |
| Store `STAGING`/`READY` and sticky alias | M01 through Store | M01; DSH materializer reads exact `READY` path | staging is private; alias points only to ready exact Package; no automatic eviction |
| resolved exact Package value | M01 | Core/M01/M02/Runtime Adapter | immutable value for one call; never re-resolved during Manifest/activation |
| canonical exclusivity/current slot | M02 | Core/M02 | admission precedes M01; `CONTENDED`/`RECOVERY` do no new Package work; one current Delivery |
| Manifest content | M01 constructs; M02 persists | Core, Runtime Adapter, M03 | persistence creates the current Delivery binding |
| native Session/Workflow State/result | Runtime | M02 observes bounded projection | Runtime-owned |
| Observation representation | M03 | exporter/Evidence | transient/best-effort and non-controlling |

There is no Prepared Binding store, proof identity, hold/reference count, liveness transfer, pre-Manifest authority, or Package-transaction state.

### Local Package Store

```mermaid
stateDiagram-v2
    [*] --> MISSING
    MISSING --> STAGING: stage initial candidate privately
    STAGING --> MISSING: initial validation or publish fails
    STAGING --> READY: initial candidate validates and publishes
    READY --> READY: exact/local hit
    READY --> READY: refresh candidate fails, discard candidate, keep prior Package and alias
    READY --> READY: refresh succeeds, publish new exact, then update alias
```

`MISSING` and `READY` are lookup outcomes. `STAGING` describes the private lifecycle of a new candidate, never a hit. For initial fill there is no prior value, so candidate failure leaves `MISSING`. During refresh, candidate staging exists beside the current `READY` Package and alias; it does not transition that visible lookup state. Failure discards or ignores only the candidate, while success publishes the new exact Package and then changes the alias. This is sequential local state handling, not a transaction or concurrent-writer protocol. Temporary residue may be removed best effort and has no semantic state. The preview does not evict `READY` Packages automatically and therefore needs no active-Delivery reference tracking.

### Current Delivery slot

The existing slot remains `EMPTY → BOUND → START_UNCERTAIN → RUNNING_CORRELATED → TERMINAL_HANDLING → EMPTY`, with conclusive `START_FAILED`, blocking `RESULT_UNRESOLVED`, and exact administrative closure branches. Package preparation occurs while M02 holds exclusive `NEW` admission but before any slot state is written. Process death before Manifest persistence leaves no Delivery; death after persistence leaves the occupied Manifest for existing recovery.

```mermaid
stateDiagram-v2
    [*] --> EMPTY
    EMPTY --> BOUND: persist exact Manifest
    BOUND --> START_UNCERTAIN: before Runtime invocation
    BOUND --> EMPTY: exact authorized pre-start closure
    START_UNCERTAIN --> RUNNING_CORRELATED: conclusive correlation
    START_UNCERTAIN --> START_FAILED: conclusive non-start
    START_FAILED --> EMPTY: final handling
    START_UNCERTAIN --> EMPTY: exact administrative closure / no outcome
    RUNNING_CORRELATED --> TERMINAL_HANDLING: valid terminal result
    RUNNING_CORRELATED --> RESULT_UNRESOLVED: lost handle or invalid/ambiguous result
    RESULT_UNRESOLVED --> RUNNING_CORRELATED: inspection proves live correlation
    RESULT_UNRESOLVED --> TERMINAL_HANDLING: reconciliation proves valid terminal
    RESULT_UNRESOLVED --> EMPTY: exact administrative closure / no outcome
    TERMINAL_HANDLING --> EMPTY: clear before release
```

<a id="ee-execution-9"></a>
## 9. Interfaces, Dependencies, Seams, and Adapters

| Interface meaning | Caller-visible input | Result/error | Ordering/configuration |
| --- | --- | --- | --- |
| External Core operation | worktree, selector, task intent, configured source or explicit bundle, selected Runtime context, optional refresh | final Delivery outcome, `CONTENDED`, exact recovery, or typed pre-Delivery error | one host call; no native fields; M02 admission first |
| M01 create Manifest | resolved Package plus complete Delivery/task/worktree/Runtime/intent context | immutable Manifest or `DELIVERY_BINDING_FAILED` | no source/cache/alias lookup |
| M02 admit | canonicalizable worktree | `NEW` holder, `CONTENDED`, exact `RECOVERY`, or custody/identity error | first Core call; immediate; no wait/queue/preemption; non-`NEW` never calls M01 |
| M01 resolve/prepare | `NEW` holder context, selector, configured source, Runtime target, refresh flag | `ResolvedWorkflowPackage` or `INVALID_WORKFLOW_SELECTOR`, `WORKFLOW_NOT_FOUND`, `WORKFLOW_FETCH_FAILED`, `WORKFLOW_PACKAGE_INVALID`, `WORKFLOW_VERSION_MISMATCH`, `WORKFLOW_DIGEST_MISMATCH`, `WORKFLOW_DSH_INCOMPATIBLE`, `WORKFLOW_CACHE_PUBLISH_FAILED` | after `NEW`; local-first; at most one Source Adapter; no fallback; no Delivery |
| M02 persist/run/finalize | exact holder and Manifest, then bounded Runtime result | existing occupied lifecycle outcomes/errors or `DELIVERY_CREATE_FAILED` | Manifest before Runtime effect; existing start/result uncertainty semantics |
| M01 validate result | exact Manifest plus bounded Runtime result | valid result or typed mismatch | no Package/source reinterpretation |
| M03 observe | bounded post-Delivery facts | local diagnostics only | existing profile/privacy; no control effect |

The Source Interface accepts one candidate request. The public GitHub Adapter obtains Release metadata and one versioned asset; the bundle Adapter reads one explicitly selected bundled Package. Source-native fields remain private. Not-found and ordinary transport failures are distinct typed results.

The Store implementation performs lookup, private candidate staging, complete publication, exact conflict detection, and sticky-alias update after the new exact Package is `READY`. Initial failure leaves `MISSING`; refresh failure preserves the prior `READY` Package and alias. A local filesystem implementation may stage in a sibling temporary directory and rename into the final exact path. That is an implementation technique for avoiding partial hits, not a production transaction protocol. No caller sees Store choreography.

The Runtime Adapter accepts only the persisted Manifest and resolves its exact local `READY` path. DSH validates before native effect and privately projects it. Existing representative rc.6 feasibility evidence proves only the seam direction, not production conformance.

<a id="ee-execution-10"></a>
## 10. Failure, Recovery, and System-wide Behavior

| Failure domain | Containment |
| --- | --- |
| selector | after `NEW`, `INVALID_WORKFLOW_SELECTOR` before Source/Store mutation; release holder; no Manifest/Delivery/Runtime/Observation |
| local lookup | `STAGING` is ignored; invalid `READY` metadata is `WORKFLOW_PACKAGE_INVALID` |
| GitHub/bundle source | not found is `WORKFLOW_NOT_FOUND`; unavailable/interrupted transfer is `WORKFLOW_FETCH_FAILED`; no fallback |
| Package validation | format/required-resource/relationship/identity failure is `WORKFLOW_PACKAGE_INVALID` |
| version/digest | explicit mismatch codes; do not publish `READY` |
| DSH compatibility | after `NEW`, `WORKFLOW_DSH_INCOMPATIBLE`; release holder before Manifest/Delivery/native effect/Observation |
| Store publication | `WORKFLOW_CACHE_PUBLISH_FAILED`; initial fill remains `MISSING`, refresh preserves prior `READY`+alias; release holder; temporary residue is best-effort cleanup |
| Delivery admission | first; `CONTENDED` or `RECOVERY` has no M01/Source/Store call; no wait/queue/steal/new Manifest |
| Manifest construction/persistence | `DELIVERY_BINDING_FAILED` or `DELIVERY_CREATE_FAILED`; release exclusive holder; no Runtime/M03 |
| Runtime start/result | preserve existing `START_UNCERTAIN`, `START_FAILED`, `RESULT_UNRESOLVED`, conclusive inspection, final handling, and exact abandonment |
| process death | OS releases live holder; no persisted Manifest means no Delivery; persisted Manifest means existing occupied-slot recovery |
| Observation/export | diagnostics only; execution path is unchanged |

Pre-Delivery cancellation stops the current operation, performs best-effort staging cleanup, releases any live exclusive holder, and returns a pre-Delivery cancellation result. It is not Delivery `CANCELLED`. Post-Manifest cancellation remains Runtime-owned when supported and is represented truthfully. There is no background Package reconciler, durable queue, blind retry, automatic failover, or cleanup authority protocol.

All M01 failure rows above assume M02 already returned `NEW`; they release that same ordinary holder. M02 may reject malformed canonical-worktree or admission request shape before returning `NEW`, because those checks belong to admission rather than Workflow selector/Package validation.

<a id="ee-execution-11"></a>
## 11. Quality Attribute Realization

| Quality | Context and threshold | Mechanism | Trade-off/residual risk | Verification |
| --- | --- | --- | --- | --- |
| Exactness | created Delivery cannot drift | exact resolved value copied into Manifest; DSH checks local digest/version | physical canonicalization downstream | binding/alias-movement fixtures |
| Fault containment | ordinary import failure creates no Delivery | typed early return before Manifest | no production recovery guarantee | Interface negative fixtures |
| Responsiveness | occupied/recovery returns before Package work; valid `NEW` local hit avoids network | M02-first admission, then local-first lookup | sticky latest may be stale | admission/M01/source spies |
| Maintainability | Hosts learn one import operation | deep M01 with private Source/Store seams | M01 has broad internal behavior | Interface tests and deletion test |
| Evolvability | new conforming Package/source Adapter need not change Core semantics | open composition model and real two-Adapter Source seam | publication governance downstream | contribution/paired-Adapter fixtures |
| Compatibility | complete Package is usable by selected DSH | ordinary M01 validation and Adapter-first activation | representative evidence is limited | protected/contributed/no-default fixtures |
| Privacy/operability | bounded phase-correct diagnostics and post-Delivery Observation | typed errors and unchanged M03 allow-list | best-effort loss accepted | telemetry/body-marker fixtures |
| Resource efficiency | no Core DB/history/outbox or automated eviction | one asset, local `READY` cache | disk use grows until manual cleanup | bounded resource observation |

Concurrency scalability, adversarial security, authentication/authorization, production HA/recovery, marketplace, registry federation, and automatic failover are `NOT_APPLICABLE` to the confirmed trusted local preview. They reopen design only when the deployment/trust/scale context changes.

<a id="ee-execution-12"></a>
## 12. Risks and Trade-offs

| Risk | Impact | Treatment/owner | Reopen condition |
| --- | --- | --- | --- |
| sticky latest is stale | user may not receive newest Release | explicit refresh; document Docker-like local-first behavior | product requires always-online freshness |
| public GitHub unavailable | cache miss cannot run | typed early return; existing `READY` Package remains usable | product requires availability/failover target |
| M01 owns broad import behavior | implementation may become hard to navigate | keep one small public operation and private cohesive helpers/seams | independent consumer/authority or measured Interface failure appears |
| local Store residue/disk growth | temporary or old Packages consume disk | best-effort staging cleanup and manual cache removal; no automatic eviction | measured use requires managed retention/eviction |
| DSH compatibility check is incomplete | failure could occur at activation | validate all declared required resources before effect; preserve honest Runtime errors | production Packages require new capability semantics |
| trusted-preview context changes | current validation becomes insufficient | explicit scope and reopen triggers | untrusted source/operator, remote shared service, credentials, hostile tenant, or stronger DSH security boundary |
| Observation/runner regression | unrelated authority could be disturbed | preserve M03 and Adapter-private runner semantics byte-for-meaning | control coupling, public resume, or runner code change |

<a id="ee-execution-13"></a>
## 13. Acceptance and Verification

### Design acceptance trace

| Scenario | Mechanism | Expected outcome | Verification state |
| --- | --- | --- | --- |
| generic intake (`SC-WI-00`) | one generic Core operation | no host/DSH/source-native field crosses Core | implementation type scan planned |
| exact local hit (`SC-WI-01`) | Store lookup before Source | exact resolved value; zero Source call | Interface fixture planned |
| exact miss (`SC-WI-02`) | one configured GitHub Release asset | validated exact Package becomes `READY` | Source/Store fixture planned |
| sticky latest (`SC-WI-03`) | alias points to `READY` exact Package | zero Source call on hit; no active drift | alias fixture planned |
| explicit refresh (`SC-WI-04`) | candidate staging beside prior `READY`; publish exact before alias update | success installs new exact then alias; failure discards candidate and preserves prior `READY`+alias | initial-fill versus refresh Store fixture planned |
| contribution (`SC-WI-05`) | shared composition/DSH validation | conforming third-party Package uses same path | production conformance planned |
| invalid/incompatible (`SC-WI-06`) | M02 `NEW`, then ordinary M01 validation and typed error | release ordinary holder; no Manifest, Delivery, DSH/Runtime/worktree effect, or Observation; non-`NEW` performs no M01/Source/Store work | admission/M01/Source/Store spy and negative matrix planned |
| preparation/Manifest failure (`SC-WI-07`) | early return before/at Manifest persistence | no Delivery outcome or Observation | Core/M01 negative fixtures planned |
| explicit bundle (`SC-WI-08`) | second private Source Adapter | same validation/resolution path; no fallback | paired Adapter evidence exists; production fixture planned |
| evolution (`SC-WI-09`) | exact fields copied into Manifest | later alias/Release affects later Delivery only | movement fixture planned |
| no ambient (`SC-WI-10`) | Adapter-first exact local validation | missing resource rejects before native effect | production no-default negatives planned |
| host portability (`SC-WI-11`) | generic Core, private Adapters | no native type/public resume | type/contrast fixture planned |
| GitHub outage/not-found (`SC-WI-12`) | typed Source result | local hit works; required remote call returns without Delivery/fallback | dead-network/not-found fixture planned |
| Delivery contention | M02 before M01 | `CONTENDED`; no wait, queue, Package work, or Manifest | admission/M01/Source/Store spy fixture planned |
| occupied recovery | M02 before M01; stored Manifest authority | existing Delivery inspected; no new selector Package work or replacement | existing recovery plus M01/Source/Store spy fixture |
| DSH success/result | exact persisted Manifest | one native Session path and exact result validation | production end-to-end planned |
| Observation loss | unchanged one-way M03 | identical Delivery outcome and slot handling | existing loss fixtures planned |

### Implementation acceptance plan

Tests cross the M01, M02, and Runtime Adapter Interfaces and assert observable results. Required coverage is the named local-hit/miss/bundle/validation/cache/contention/Manifest/DSH/result/Observation branches above. Tests do not prescribe private directory names, helper functions, lock primitives, or GitHub client library. This revision adds no Spike and no production security, concurrency schedule, response-loss, power-loss, transaction, hold, eviction, or HA matrix.

### Preserved existing Execution acceptance

| Existing concern | Required unchanged outcome | Verification responsibility |
| --- | --- | --- |
| Start uncertainty | unknown start remains occupied/blocking; only conclusive non-start or exact authorized closure clears | crash/restart and conclusive-inspection fixtures |
| Lost handle or invalid/ambiguous result | `RESULT_UNRESOLVED` remains occupied; no fabricated result or blind replay | malformed/lost-handle/reconciliation fixtures |
| Authorized abandonment | exact current authority clears with no Runtime outcome/history/same-Delivery retry | positive, stale, mismatched authorization fixtures |
| Observation failure/privacy | identical execution outcome; zero prohibited body markers | disable/refusal/timeout/tail-loss and privacy scans |
| Profile mapping | exact proposed `1.0.0` carrier, ten EventNames, 57+10+6 registries, family exclusion; `0.3.0` is non-resolving legacy history | OTel Profile deterministic registry/table/type checks and production conformance |
| Review composition and Finding scope | exactly one complete named shape; bounded assertion plus one typed target; complete repetition for multi-target edges | complete-shape, endpoint, multi-target, privacy, duplicate/conflict fixtures |
| Count presence semantics | C17 zero/positive/omission remain distinct; invalid values and Finding carriers cannot land malformed count state | ordinary/Recheck zero/positive/absence and negative fixtures |
| Role lineage and usage | local/lineage pair remains distinct; provider-native quantities remain exact kind/unit/source groups | lineage duplicate/conflict/privacy and usage compatibility fixtures |
| Span/Event identity | Event ID and `(trace_id, span_id)` retain exact dedup/conflict meaning | new/identical/conflicting identity fixtures |
| Later runner | private resume remains available without public resume/native leakage | contrasting DSH/runner lifecycle/type fixture |

<a id="ee-execution-14"></a>
## 14. Decisions, Downstream Work, and Rejected Alternatives

For the three MVP Evaluation/BI owner facts, Execution's boundary is exact: the Runtime/Execution result owner supplies C55 only from a complete start-to-terminal elapsed measurement; the Workflow owner supplies C56 as its exact furthest reached stage at terminal outcome; and the Runtime/provider model owner supplies C57 as the bounded provider-scoped canonical model identity on a model-call Span. C57 attribution also carries the local Role identity and joins to C06 from the Delivery root binding. Delivery Observation copies these supplied scalars when available; it does not compute, infer, alias-normalize, backfill, schedule, or settle them.

### Decision register

| ID | Decision |
| --- | --- |
| `DEC-WI-01` | Keep M01 deep across selector, Source/Store, validation, resolved Package, Manifest construction, and result validation; do not add a fourth Module. |
| `DEC-WI-02` | M02 performs canonical worktree/exclusive admission first. `CONTENDED` and `RECOVERY` do no new-selector Package work; only `NEW` calls M01. M01 still completes preparation before Manifest persistence creates the current Delivery binding. |
| `DEC-WI-03` | GitHub and bundle are private Adapters at one Package Source seam. Source selection is trusted configuration, not an authority/capability protocol. |
| `DEC-WI-04` | Composition and selected DSH compatibility remain ordinary validation steps returning typed errors; no persisted proof identities exist. |
| `DEC-WI-05` | M01 returns a plain immutable `ResolvedWorkflowPackage` and never an opaque Prepared Binding, hold, or caller-managed capability. |
| `DEC-WI-06` | Pre-Delivery failures use phase-typed early return and ordinary holder/staging cleanup; they do not form a transaction, Delivery outcome, or Observation. |
| `DEC-WI-07` | The first GitHub mechanism uses one versioned Release asset; exact/latest resolution follows Docker-like local-first behavior. |
| `DEC-WI-08` | Store lookup exposes `MISSING`/`READY`; `STAGING` is private and non-addressable; latest alias changes only after exact `READY`; no automatic eviction. |
| `DEC-WI-09` | The preview adds no pre-Manifest lifecycle. Existing current-slot authority starts with persisted Manifest and preserves existing DSH uncertainty/recovery after that point. |
| `DEC-WI-10` | No authentication, authorization, signing, injection defense, sandbox, concurrent Store protocol, distributed lock, HA, failover, or production recovery mechanism is designed until a stated trust/exposure/scale trigger changes. |

Existing Execution decisions remain in force: three deep Modules; Runtime-owned Workflow outcome behind a Core-owned Adapter seam; one-current-slot lifecycle with no Execution history; standard-first allow-listed best-effort Observation; canonical worktree revalidation; conclusive handling of persisted Runtime uncertainty; and the adopted Observation semantics now encoded by proposed Profile `1.0.0`. This revision adds only the explicit C55–C57 owner mapping and changes no Runtime, Evidence, or runner execution semantics.

Rejected for this preview: Host-owned Package import; Package import inside M02/DSH; a fourth Module; first-party Package allow-list; mutable alias in Manifest; automatic GitHub-to-bundle fallback; source/version fallback; ambient completion; opaque Prepared Binding; proof/capability identity; Package hold/reference-count/liveness transfer; commit-resolution state machine; concurrent cache correctness; automated eviction; authentication/authorization/security platform; registry/marketplace; HA/failover; DSH-native Core types; runner change.

### Non-owning local view of Concept-owned downstream obligations

The Concept obligation register remains the owner-complete authority. The Execution-local view is limited to:

| Obligation | Execution meaning | Return trigger |
| --- | --- | --- |
| `concept.obligation.010` | represent exact resolved Package/Manifest fields and typed errors without adding proof/transaction semantics | physical form enables re-resolution, ambient completion, native leakage, or pre-Delivery outcome |
| `concept.obligation.011` | implement Core/M01/M02/M03 collaboration and named early-return branches | bypass, drift, wait/queue, new lifecycle/Module, Observation control, or runner change |
| `concept.obligation.012` | choose/publish the public repository Release asset and explicit bundle descriptors | mutable/ambiguous/incomplete asset, allow-list, rewrite, bypass, or fallback |
| `concept.obligation.013` | implement `MISSING/STAGING/READY` Store and sticky alias-after-ready | partial hit, prior-ready loss, or a real requirement for concurrent writers/eviction |
| `concept.obligation.014` | qualify complete protected/contributed Package projection through DSH without ambient completion | rewrite, post-effect rejection, missing capability, or native leak |
| `concept.obligation.015` | choose ordinary fetch/cache resource settings within current simple semantics | measurements or context require different ownership/Interface/security/reliability semantics |

No machine schema modification is part of this revision. Observation meaning, wire profile, interaction flow, and metric reading are handled by their split draft companions; physical representation is handled separately and cannot reopen the explicit MVP non-goals through this System Design.

<a id="ee-execution-15"></a>
## 15. Module Deepening and Implementation Handoff

Recommended detailed-design order is:

1. **Runtime Interaction**, freezing M02-first `CONTENDED/RECOVERY/NEW` admission, the ordinary holder, Manifest persistence, and existing current-slot/DSH recovery without adding pre-Manifest state.
2. **Delivery Binding**, defining `resolveWorkflowPackage` for `NEW`, selector rules, Source/Store internals, validation order, resolved-value construction, Manifest construction, result validation, typed errors, and holder release on pre-Manifest return.
3. **DSH Runtime Adapter**, projecting a persisted Manifest to the exact local `READY` Package and proving no ambient completion for the two protected and contributed conforming Packages.
4. **Delivery Observation**, only if exact Package fields require new scalar mapping; otherwise its current profile and tests remain unchanged.

Module Detailed Design must explain executable control and data flow, not restate these decisions as a checklist. The M01 Interface is the primary import test surface; Source/Store test Adapters remain private. Implementation should prefer a temporary staging directory plus complete publish/rename, simple typed results, and ordinary cleanup. It must not add caller choreography, a Prepared handle, proof store, reference count, transaction manager, background reconciler, concurrent-writer schedule, credential flow, security scanner, automatic eviction, fallback, or ambient Package lookup.

Return for a new System Design version only if evidence requires a new Module or semantic writer, Package rewrite, mutable active binding, source/version fallback, concurrent/shared Store correctness, automated eviction, authentication/authorization, hostile-source isolation, remote multi-user operation, HA/failover, changed current-slot semantics, public native type, Observation control dependency, or runner change.

### Document completion check

- [x] The trusted local/public-GitHub/individual-or-small-team preview context and explicit reopen triggers shape the design.
- [x] The three existing Modules remain, with implementable responsibilities, small Interfaces, private seams, and acyclic dependencies.
- [x] The successful flow is branch-free and all required local-hit/miss/bundle/validation/cache/contention/Manifest/DSH branches are named with typed outcomes.
- [x] `ResolvedWorkflowPackage` and `MISSING/STAGING/READY` replace the former proof/Prepared-hold/transaction machinery.
- [x] M02 admission precedes Package work; only `NEW` prepares; preparation precedes Delivery creation; Manifest persistence precedes DSH effect; pre-Delivery failure creates no Delivery outcome or Observation.
- [x] Exact/local-first/sticky-latest/no-fallback/no-ambient/open-contribution/DSH-first semantics remain.
- [x] Existing current-slot recovery, M03 Observation, Evidence relationship, protected Packages, and runner semantics remain unchanged.
- [x] Acceptance is Interface-oriented and does not demand Spike, production security, concurrency schedule, transaction, response-loss, power-loss, eviction, or HA evidence.

Publication remains governed by the external exact-byte publication record and the Concept-owned obligation register. These candidate bytes contain no Workflow routing authority.
