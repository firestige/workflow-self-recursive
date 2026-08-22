# Runner Module Detailed Design

## 1. Status and authority

| Field | Value |
| --- | --- |
| Status | `WAVE4_ENTRY_REVIEW_CANDIDATE`; implementation conformance is not implied |
| Stable identity | Runner / Runner Runtime Adapter |
| System owner | Project Execution System |
| External interface | Execution-owned `ExecutionRuntimeAdapter` |
| Companion | [Chinese non-normative companion](runner.zh-CN.md) |
| Related design | [Execution System](../../project-execution-system.md), [Runner Runtime Profile](../../../runtime/runner-runtime-profile.md) |

This document absorbs the stable module design from the frozen Iteration 2 design lineage. The lineage records remain provenance; delivery-goal names and revision-specific question/answer context are not long-term product identities. If this document conflicts with the Execution-owned external interface or a published Contract, those owners govern.

## 2. Identity and purpose

Runner is the embedded Runtime Adapter that executes a fully admitted Workflow activation. Its stable identity does not name LangGraph or any other replaceable implementation dependency. LangGraph is the currently selected Workflow Host substrate; it may be replaced by a compatible Host Adapter without changing the Execution-facing interface or an in-flight Delivery.

Runner accepts only a deeply frozen `RunnerActivationContext`. Delivery admission has already validated and resolved the Workflow Package, schemas, resources, Agent/model/Driver/provider bindings, workspace and correlation. Runner never reads the raw Package document set, root schemas, shared meta, selector, source Adapter or admission service.

Runner implements exactly the public operations owned by Execution:

```text
execute(activation)
inspect(delivery)
cancel(delivery)
```

Resume, recovery, checkpoint, native session and retirement operations remain private composition capabilities.

## 3. Creation plane

Execution Runtime Interaction selects a Runtime Adapter and freezes the selected configuration identity. A private `RunnerFactory` then materializes one Runner instance from that exact configuration.

```text
Execution Runtime Adapter selection + configuration identity
  → RunnerFactory
      → Workspace and Publication Manager
      → configured Provider Adapter Factory registry instance
          → exact Provider Adapter Factory
          → concrete Provider runtime
      → exact configured Workflow Host Adapter Factory
          → concrete Workflow Host
      → Managed Agent Invocation
      → Lifecycle Coordinator
  → ExecutionRuntimeAdapter
```

`RunnerFactoryConfig` is a closed, immutable composition value. It contains exact storage roots, selected Workflow Host engine and Provider factory keys/configuration needed to create the instance. It does not contain preconstructed provider-native services, arbitrary callbacks, ambient discovery, priority ordering or fallback rules.

Provider creation uses a closed exact-key registry instance owned by Runner composition. Provider Factory SPI and concrete Provider factories are owned by Managed Agent Invocation. Duplicate keys, unknown keys, invalid configuration or startup failure fail before the Runner is published.

Workflow Host creation uses the one exact configured factory. The current configuration selects `engine: "langgraph"`. There is no Host registry, priority selection or fallback. A future engine extends a closed configuration union and supplies its own compatible factory.

Factory selection is creation-time only. An active Delivery retains the exact Runner, Host, Provider and configuration identities with which it started; configuration reload or dependency availability never substitutes an in-flight implementation.

## 4. Call plane and dependency direction

The main Agent Action path is:

```text
Execution → Lifecycle Coordinator → Workflow Host → Managed Agent Invocation
```

The complete capability graph is:

```text
Lifecycle Coordinator → deterministic activation compiler
Lifecycle Coordinator → Workflow Host
Lifecycle Coordinator → Managed Invocation control
Lifecycle Coordinator → Workspace/Publication lifecycle
Workflow Host → Managed Invocation action capability
Workflow Host → Workspace/Custody capability
```

Workspace authority reaches Managed Invocation only as a signed `AuthorizedWorkspaceCapability` value carried in a Host dispatch. Managed Invocation never receives the Workspace/Custody service. Return values complete the originating call and do not create reverse dependencies.

The deterministic activation compiler is a composition helper, not another Runtime module. It consumes the admitted activation, validates exact closure and binding identities, and emits a minimal execution plan. It owns no durable state and performs no admission, Provider, Host or Workspace effect.

## 5. Module ownership

| Module | Owns | Does not own |
| --- | --- | --- |
| [Lifecycle Coordinator](lifecycle-coordinator.md) | Adapter lifecycle, external bridges, cancel/recovery coordination, terminal settlement | graph decisions, Provider sessions, Git mutation |
| [Workflow Host](workflow-host.md) | thread, graph path, dataflow, barriers, checkpoints, suspensions, terminal proposal | Provider-native state, Delivery settlement, publication |
| [Managed Agent Invocation](managed-agent-invocation.md) | Provider invocation, native session, credentials, Journal, structured completion | graph progression, Workflow Wait, Custody service |
| [Workspace and Publication Manager](workspace-publication-manager.md) | baseline, savepoint, workspace authority, restore, result preservation, publication | Action result semantics, graph path, terminal arbitration |

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
5. Terminal order is proposal → preserve result → known publication → one retirement authorization → owner-scoped retirement → four known owner facts → immutable settlement → optional Observation.
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

Reopen this design if a Runtime must become a remote service, multiple active instances share one current slot, a Provider or Host requires runtime fallback, native state must cross the Execution public seam, or a shared Contract cannot express a required cross-owner fact.
