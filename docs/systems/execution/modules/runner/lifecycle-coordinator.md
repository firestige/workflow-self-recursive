# Runner Lifecycle Coordinator Module Detailed Design

## 1. Status and role

| Field | Value |
| --- | --- |
| Status | `WAVE4_ENTRY_REVIEW_CANDIDATE` |
| Module | Runner Lifecycle Coordinator |
| Public projection | Execution-owned `ExecutionRuntimeAdapter` |
| Companion | [Chinese non-normative companion](lifecycle-coordinator.zh-CN.md) |

The Coordinator is Runner's lifecycle and composition-facing control module. It implements the Execution Adapter without widening its public operations. It coordinates modules through narrow capabilities and owns durable Delivery lifecycle truth; it does not interpret graph internals or perform Agent work.

## 2. Responsibilities

The Coordinator owns:

- exact Delivery/activation correlation at the Adapter boundary;
- deterministic compiler invocation and handoff of the compiled activation to Workflow Host;
- Action-input and Workflow-control bridge coordination;
- cancellation intent, inspection and three-way recovery coordination;
- terminal proposal handling, result preservation and publication ordering;
- one retirement authorization, partial-retirement reconciliation and immutable settlement;
- a private non-controlling Observation emission point;
- retirement of Coordinator-owned transient state.

It does not own graph path selection, Provider sessions, workspace bytes, checkpoint content, Package admission or Observation delivery guarantees.

## 3. Public and private surfaces

The only public surface is `execute`, `inspect`, and `cancel` from `ExecutionRuntimeAdapter`. Internal operations may resume an Action, resume a Workflow Wait or recover a child, but they are not copied to the Execution interface.

The Coordinator consumes:

- deterministic `CompileRunnerActivation`;
- `CoordinatorHost`;
- `CoordinatorInvocationControl`;
- `CoordinatorCustody`;
- separate Action Interaction and Workflow Control bridges;
- private `RunnerObservationPort`.

Action Interaction and Workflow Control remain distinct because they resume different state machines. An Action input resumes the same episode/session; a Workflow control result resumes a declared Workflow Wait.

## 4. Durable lifecycle

For each exact Delivery correlation, the Coordinator stores enough state to distinguish:

```text
start requested / disposition unknown
active stable Host disposition
cancel requested
terminal proposal known
result preserved
publication known or unknown
partial owner retirement facts
immutable terminal settlement
intervention required
```

Identity-equivalent retries replay the durable state. The same Delivery identity with different manifest or activation correlation fails before effect. A conclusive compiler rejection may form `START_FAILED` only when the Delivery slot is absent and the correlation is safe; Host call errors are not proof that no Host effect occurred.

Cancellation is monotonic. Once durable cancellation intent is visible, no new Action or Workflow bridge call starts. Results of an already awaited child call are reconciled against the newer durable intent and cannot overwrite it with stale active or terminal state.

## 5. Stable-boundary driving

The Coordinator asks Host to drive a thread only to the next durable stable boundary:

- `action-input`: issue the exact Action Interaction request, then resume the same thread and episode;
- `workflow-wait`: issue the exact external Workflow request, then resume with the correlated admitted result;
- `intervention`: preserve the explicit unresolved state for inspection/recovery;
- `terminal-proposal`: enter terminal coordination.

Unknown bridge or child disposition remains unknown. Recovery selects `continue`, `restart-from-savepoint`, or `intervene` from known Host, Invocation and Custody facts; it never treats process exit, timeout or missing response as proof of non-start.

## 6. Terminal coordination

The required order is:

```text
terminal proposal
→ preserve bounded result
→ obtain known publication disposition
→ create one RetirementAuthorizationRef
→ retire Host, Invocation and Custody owner state
→ close eligible Coordinator transient state
→ require coordinator/host/invocation/custody known facts
→ write immutable TerminalSettlementRecord
→ optionally emit Observation
```

`published`, `already-at-target`, and `conflict` are known publication dispositions. `unknown` is not. Business terminal truth and preserved result are not rolled back when retirement is partial or Observation fails.

One authorization identifies the retirement operation and exact Delivery. Completed owner facts are retained durably. Retry calls only owners still unknown and reuse the same authorization. `retained-for-recovery` is known and may settle; `unknown` cannot.

The settlement's owner tuple is ordered and exact: Coordinator, Host, Invocation, Custody. Once written, neither Observation nor later inspection may alter its bytes.

## 7. Observation boundary

Observation is a private one-way call point after lifecycle truth is durable. Runner does not prescribe transport, outbox, retry queue, storage or mapping semantics. Observation may be disabled or unavailable and may reject, throw, return a rejected promise or never settle. None of those conditions may block or change the returned Delivery outcome. Production mapping/composition belongs to the Observation owner.

## 8. Failure and verification

Fail-closed cases include correlation mismatch, unsafe activation rejection, ambiguous start, stale control, cancellation races, publication unknown and owner-retirement unknown. These become typed rejection, unknown state or intervention as appropriate; they do not fabricate completion.

Required tests cover:

- same Delivery/same correlation replay and different-correlation rejection;
- simultaneous execute/cancel and duplicate execute coordination;
- Action and Workflow bridge separation and stale response rejection;
- cancel-before-bridge on recovery;
- all known publication dispositions and unknown publication;
- partial same-authorization retirement and different-authorization rejection;
- four known facts before settlement and settlement immutability;
- Observation throw/rejection/non-settling isolation;
- adapter own keys exactly `execute`, `inspect`, `cancel`.

Reopen if Execution requires another public operation, cross-process multi-writer coordination becomes a product requirement, or terminal truth must depend on an external Observation acknowledgement.
