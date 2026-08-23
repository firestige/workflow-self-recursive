# Workflow Host Module Detailed Design

## 1. Status and role

| Field | Value |
| --- | --- |
| Status | `WAVE4_ENTRY_REVIEW_CANDIDATE` |
| Module | Workflow Host |
| Current Adapter | LangGraph Workflow Host Adapter |
| Companion | [Chinese non-normative companion](workflow-host.zh-CN.md) |

Workflow Host owns execution of the admitted control graph on a private durable thread. Its stable module identity is independent of LangGraph. The current Adapter uses LangGraph and SQLite; another substrate may implement the same capability without changing Runner or Execution identities.

## 2. Creation boundary

Workflow Host owns a closed `WorkflowHostAdapterFactory` contract and each concrete factory. The LangGraph factory validates its exact configuration, creates the private checkpointer/thread storage and returns a `CoordinatorHost` capability.

RunnerFactory selects the one exact configured factory, currently `engine: "langgraph"`, and assembles the returned Host. There is no Host registry, ambient discovery, preference order or fallback. Creation failure prevents Runner publication. Factory construction does not compile or start a Delivery.

## 3. Responsibilities

Host owns:

- private thread and checkpoint identity;
- interpretation of the compiled control graph and typed dataflow;
- exact execution-site lookup and Invocation dispatch materialization;
- declared decision and successor selection;
- selected parallel branch set and selected barrier;
- Workflow Wait and same-episode Action suspension;
- Host-owned deterministic operations;
- Host-side result/schema/Gate validation;
- coordination with Workspace/Custody before committing data edges;
- terminal proposal, stop, inspection, recovery and Host retirement facts.

Host does not own Delivery admission, Provider-native session state, credentials, publication, final settlement or external interaction UI.

## 4. Static topology, dynamic path

The control topology is static and closed; the path through it is dynamic. A Planner is an ordinary admitted Action. Its typed result may select only declared successors or a declared non-empty subset of parallel branches.

For a parallel node:

- missing `selection` means all declared branches are selected;
- present `selection` reads the declared source port and must produce a declared non-empty subset;
- `required: true` constrains only the current selected set;
- the barrier waits for exactly that selected set;
- an undeclared, empty or stale selection fails before branch effect.

Host never creates topology at runtime and never uses an undeclared Agent proposal as a successor.

## 5. Action execution and data commit

At an Agent site, Host materializes the exact Action, executor, typed input, session affinity and signed Workspace capability from the compiled activation and current committed state. It then calls `HostInvocation`.

An Invocation completion is only a proposal to Host. Before committed Workflow state changes:

1. Host validates the structured result against the admitted result schema/Gate.
2. Host previews the complete declared State/Artifact/data-edge update.
3. Workspace/Custody independently validates the signed capability and observed workspace/read state.
4. Only when both accept does Host apply the preview, record the next savepoint and checkpoint the new state.

Host rejection or Workspace rejection restores the prior savepoint. Restore uncertainty becomes Intervention and cannot be terminalized as a known failure.

## 6. Two suspension kinds

`action-input` preserves the same Action episode, execution site, invocation identity and native session. Host checkpoints a quiescent suspension and later calls `continueWithInput` for the exact correlated response. It does not advance an edge or create a Workflow Wait.

`workflow-wait` exists only after an Action or Host operation has returned and the declared graph explicitly waits for external approval, decision or workflow result. It advances through the declared Wait semantics and resumes only with the exact admitted control result.

The two dispositions and their resume operations are never interchangeable.

## 7. Failure, recovery and retirement

Nonretryable Invocation or Host-operation failure follows an exact declared event-successor when one exists. A corrupt or undeclared failure target fails closed. Unknown Invocation/Custody state produces Intervention, not a guessed route.

Recovery is directive-based: `continue`, `restart-from-savepoint`, or `intervene`. A checkpoint and Custody savepoint are independently known; neither substitutes for the other.

Host retirement is owner-scoped. It verifies the exact retirement authorization and thread correlation, deletes only Host-owned thread/checkpoint records, and persists a minimal durable owner fact. Same-authorization retry returns the same fact; different authorization fails closed. The durable storage operation serializes independent Host instances for the same thread and performs destructive cleanup once.

## 8. Substrate boundary and verification

LangGraph details—node handlers, conditional edges, checkpointer schema and SQLite operations—are private to the current Adapter. They do not enter shared Contracts or `RunnerFactoryConfig` beyond the closed Host selection/configuration value.

Required tests cover:

- exact factory selection/configuration and startup failure;
- static topology with dynamic single-target and subset selection;
- all-selected and affected-subset barriers;
- dataflow closure and fail-closed schema keywords;
- production Managed Invocation and Workspace collaboration;
- same-episode multiple input turns and separate Workflow Wait;
- preview-before-Custody ordering and double validation;
- restore uncertainty, stop and three-way recovery;
- cross-instance retirement idempotency and pending recovery;
- import boundary proving Host cannot access Coordinator-only capabilities.

Reopen if a selected substrate cannot preserve stable-boundary semantics, requires public native thread state, or needs an in-flight engine substitution.
