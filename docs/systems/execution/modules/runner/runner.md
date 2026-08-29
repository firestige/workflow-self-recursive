# Runner Module Detailed Design

## 1. Status and authority

| Field | Value |
| --- | --- |
| Status | `ITERATION_2_DOCUMENT_CALIBRATION_CANDIDATE`; implementation shipped, broader conformance is not implied |
| Stable identity | Runner; Execution module M02 |
| System owner | Project Execution System |
| Structure authority | GitHub issue [#47](https://github.com/firestige/workflow-self-recursive/issues/47) and child issues [#62–#66](https://github.com/firestige/workflow-self-recursive/issues/62) |
| Implementation evidence | `execution-system/src/{interpreter,coordinator,host,invocation,custody,composition}` at the pinned Iteration 2 submodule revision |
| Core interface | `execute`, `inspect`, `cancel`; currently typed by `ExecutionRuntimeAdapter` |
| Companion | [Chinese non-normative companion](runner.zh-CN.md) |
| Parent design | [Execution System](../../project-execution-system.md) |
| Traceability | [Runner traceability and implementation record](traceability.md) |

> **Historical boundary:** The configured Provider keys/runtime creation below is the published 1.x/Iteration 2 path. New 2.0 Deliveries follow the [Role-to-Provider binding candidate](../../repository-role-model-binding.md): exact Role descriptors are frozen in the Manifest, installation composition supplies one owner-factory registry, only Providers actually used by that Manifest receive realms, and runtime/session/recovery exact-match without credentials, priority, fallback, or rebinding.

This document calibrates the prior design to the issue-authoritative Iteration 2 structure. Runner is Execution module M02, not a product System, subsystem, implementation behind another M02 module, or fourth Execution module. Its five internal units are submodules: Interpreter, Lifecycle Coordinator, Workflow Host, Managed Agent Invocation, and Custody. `ExecutionRuntimeAdapter` is the current Core-to-Runner type name, not an already-promoted polymorphic Runner abstraction. Only if multiple Runner implementations become necessary may M02 be promoted into such an abstraction, and each concrete implementation must receive a distinct name. The [traceability companion](traceability.md) indexes design IDs and evidence without creating another behavior owner.

## 2. Identity and purpose

Runner is the embedded Execution module that executes a fully admitted Workflow activation. Its stable identity does not name LangGraph or any other replaceable implementation dependency. LangGraph is the currently selected Workflow Host substrate; it may be replaced by a compatible Host Adapter without changing the Execution-facing interface or an in-flight Delivery.

Runner accepts only a deeply frozen `RunnerActivationContext`. `execution.delivery` has already completed worktree admission, Package resolution, Manifest binding/persistence, and projection of exact Package, resource, Agent/model/Driver/provider, workspace, and correlation bindings. Runner never owns Package Source/Store, worktree admission, current-slot state, or Manifest persistence, and never reads raw Package/schema documents or selectors.

Runner implements exactly the public operations owned by Execution:

```text
execute(activation)
inspect(delivery)
cancel(delivery)
```

Resume, recovery, checkpoint, native session and retirement operations remain private composition capabilities.

## 3. Creation plane

Execution freezes the exact Runner configuration identity. A private `RunnerFactory` materializes one Runner instance from that configuration; it does not select among Runner implementations.

```text
Execution Runner configuration identity
  → RunnerFactory
      → Interpreter
      → Custody
      → configured Provider Adapter Factory registry instance
          → exact Provider Adapter Factory
          → concrete Provider runtime
      → exact configured Workflow Host Adapter Factory
          → concrete Workflow Host
      → Managed Agent Invocation
      → Lifecycle Coordinator
  → Runner (M02), exposed through ExecutionRuntimeAdapter
```

`RunnerFactoryConfig` is a closed, immutable composition value. It contains exact storage roots, selected Workflow Host engine and Provider factory keys/configuration needed to create the instance. It does not contain preconstructed provider-native services, arbitrary callbacks, ambient discovery, priority ordering or fallback rules.

Provider creation uses a closed exact-key registry instance owned by Runner composition. Provider Factory SPI and concrete Provider factories are owned by Managed Agent Invocation. Duplicate keys, unknown keys, invalid configuration or startup failure fail before the Runner is published.

Workflow Host creation uses the one exact configured factory. The current configuration selects `engine: "langgraph"`. There is no Host registry, priority selection or fallback. A future engine extends a closed configuration union and supplies its own compatible factory.

Factory selection is creation-time only. An active Delivery retains the exact Runner, Host, Provider and configuration identities with which it started; configuration reload or dependency availability never substitutes an in-flight implementation.

## 4. Call plane and dependency direction

The main Agent Action path is:

```text
Execution Core → Runner (M02) / Lifecycle Coordinator → Workflow Host → Managed Agent Invocation
```

The complete capability graph is:

```text
Lifecycle Coordinator → Interpreter
Lifecycle Coordinator → Workflow Host
Lifecycle Coordinator → Managed Invocation control
Lifecycle Coordinator → Custody lifecycle
Workflow Host → Managed Invocation action capability
Workflow Host → Custody capability
```

Workspace authority reaches Managed Invocation only as a signed `AuthorizedWorkspaceCapability` value carried in a Host dispatch. Managed Invocation never receives the Custody service. Return values complete the originating call and do not create reverse dependencies.

Interpreter is a first-class Runner submodule. Its `compileRunnerActivation` implementation consumes the admitted activation, validates exact closure and binding identities, and emits a minimal execution plan. It owns no durable state and performs no Delivery admission, Provider, Host, or Custody effect.

## 5. Submodule ownership

| Submodule | Owns | Does not own |
| --- | --- | --- |
| [Interpreter](interpreter.md) | admitted activation validation and Definition-to-executable-graph compilation | Delivery/worktree admission, durable state, graph progress |
| [Lifecycle Coordinator](lifecycle-coordinator.md) | Adapter lifecycle, external bridges, cancel/recovery coordination, terminal settlement | graph decisions, Provider sessions, Git mutation |
| [Workflow Host](workflow-host.md) | thread, graph path, dataflow, barriers, checkpoints, suspensions, terminal proposal | Provider-native state, Delivery settlement, publication |
| [Managed Agent Invocation](managed-agent-invocation.md) | Provider invocation, native session, credentials, Journal, structured completion | graph progression, Workflow Wait, Custody service |
| [Custody](custody.md) | savepoint, Git-tree identity, scoped workspace authority, restore, result preservation, publication | worktree admission/lifecycle, file-editing API, graph path |

Every durable fact has one writer. Caller-specific capabilities prevent a caller from reaching operations it does not own.

## 6. Configuration and extension rules

- Provider keys are exact and closed for a constructed Runner. No ambient plugin discovery, provider fallback or priority arbitration is allowed.
- The DSH Provider factory owns DSH-native bootstrap. It creates the real `AgentRegistry`, `SessionStore` and native session factory behind the Provider Adapter boundary.
- Copilot and Codex remain typed fail-closed Provider shells until their own production obligations are completed. Their presence cannot imply support or enable fallback.
- The Workflow Host factory owns construction of its selected substrate and private checkpoint storage. RunnerFactory owns only exact selection and instance assembly.
- Result validation support is a Runner-fixed, fail-closed internal capability injected into Managed Invocation. It is not a user-configurable policy and does not enter the shared activation Contract.
- Observation is a private, one-way, non-controlling port. Disablement, rejection, throwing or tail loss cannot alter lifecycle truth or block a completed Delivery.

## 7. Lifecycle invariants

1. Correlation and binding mismatches fail before child effect.
2. Unknown start or recovery disposition is preserved as unknown; Runner does not manufacture non-start or blindly retry.
3. Action-scoped input keeps the same episode and native session. It is distinct from Workflow Wait.
4. Host result validation and Workspace validation must both accept before result/data edges and the next savepoint are committed.
5. Terminal order is proposal → preserve result → known publication → one retirement authorization → owner-scoped retirement → four known durable-owner facts → immutable settlement → optional Observation. Interpreter has no durable state and is not a retirement owner.
6. Publication conflict is known and may settle; publication unknown cannot settle.
7. Partial retirement retries use the same authorization. Completed owners replay the same fact without repeating destructive cleanup.
8. Public Adapter shape remains exactly `execute`, `inspect`, `cancel`.

## 8. Verification and reopen conditions

Required conformance includes:

- exact configuration selection and duplicate/unknown factory-key negatives;
- construction with real Provider/Host factories and no preconstructed native services;
- import-DAG and caller-capability checks;
- admitted activation input and raw-Package rejection by construction;
- same-episode interaction, Workflow Wait, cancel and three-way recovery fixtures;
- real DSH local-transport acceptance path;
- workspace/checkpoint/result/publication/retirement/settlement ordering;
- Observation unavailability isolation;
- full, coverage, static-boundary, typecheck and build gates.

Reopen this design if Runner must become a remote service, multiple active instances share one Delivery, a second Runner implementation or Runner-selection need appears, a Provider or Host requires runtime fallback, native state must cross the Execution public seam, or a shared Contract cannot express a required cross-owner fact.
