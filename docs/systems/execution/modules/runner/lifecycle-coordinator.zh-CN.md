# Runner Lifecycle Coordinator Submodule 详细设计

## 1. 状态与角色

| 字段 | 值 |
| --- | --- |
| 状态 | `ITERATION_2_IMPLEMENTED_DOCUMENT_CALIBRATION_CANDIDATE` |
| Submodule | Runner Lifecycle Coordinator |
| Public projection | Execution-owned `ExecutionRuntimeAdapter` |
| 结构权威 | GitHub issue `execution-system#63` |
| 实现证据 | `execution-system/src/coordinator` |
| Companion | [英文规范原文](lifecycle-coordinator.md)；本文是 non-normative 中文 companion |

Coordinator 是 Runner 的 lifecycle 和 composition-facing control submodule。在当前 Runner 内，它实现 Core seam，但不扩张 public operations。它通过 narrow capability 编排 submodule 并拥有 durable Runner lifecycle truth；不解释 graph internals，也不执行 Agent 工作。

## 2. 职责

Coordinator 拥有 exact Delivery/activation correlation、deterministic compiler 调用、向 Workflow Host 交付 compiled activation、Action-input 与 Workflow-control bridge coordination、cancellation/inspection/three-way recovery、terminal proposal handling、result preservation/publication ordering、单一 retirement authorization、partial-retirement reconciliation、immutable settlement、private non-controlling Observation 调用点，以及 Coordinator-owned transient state 的 retirement。

它不拥有 graph path selection、Provider session、workspace byte、checkpoint content、Package admission 或 Observation delivery guarantee。

## 3. Public 与 private surface

唯一 public surface 是 `ExecutionRuntimeAdapter` 的 `execute`、`inspect`、`cancel`。内部可以恢复 Action、Workflow Wait 或 child，但这些 operation 不复制到 Execution interface。

Coordinator 消费 `CompileRunnerActivation`、`CoordinatorHost`、`CoordinatorInvocationControl`、`CoordinatorCustody`、相互独立的 Action Interaction/Workflow Control bridge，以及 private `RunnerObservationPort`。

Action Interaction 和 Workflow Control 恢复不同 state machine。Action input 恢复同一 episode/session；Workflow control result 恢复 declared Workflow Wait。

## 4. Durable lifecycle

Coordinator 为每个 exact Delivery correlation 持久化足够状态，以区分 start requested/disposition unknown、active stable Host disposition、cancel requested、terminal proposal known、result preserved、publication known/unknown、partial owner retirement facts、immutable terminal settlement 和 intervention required。

identity-equivalent retry 重放 durable state。相同 Delivery identity 但 manifest/activation correlation 不同，在 effect 前失败。conclusive compiler rejection 只有在 Delivery slot 不存在且 correlation 安全时才能形成 `START_FAILED`；Host call error 不能证明 Host 没有产生 effect。

Cancellation 是 monotonic。durable cancellation intent 可见后不启动新的 Action/Workflow bridge call。已等待的 child result 必须与更新的 durable intent reconcile，不能用 stale active/terminal state 覆盖它。

## 5. 推进到 stable boundary

Coordinator 只让 Host 推进到下一个 durable stable boundary：

- `action-input`：发出 exact Action Interaction request，然后恢复同一 thread/episode；
- `workflow-wait`：发出 exact external Workflow request，然后用 correlated admitted result 恢复；
- `intervention`：保存 explicit unresolved state 供 inspection/recovery；
- `terminal-proposal`：进入 terminal coordination。

unknown bridge/child disposition 保持 unknown。Recovery 根据 known Host、Invocation、Custody facts 选择 `continue`、`restart-from-savepoint` 或 `intervene`；不得把 process exit、timeout 或缺失 response 当成 non-start proof。

## 6. Terminal coordination

强制顺序为：

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

`published`、`already-at-target`、`conflict` 都是 known publication disposition；`unknown` 不是。retirement partial 或 Observation failure 不回滚 business terminal truth/preserved result。

一个 authorization 标识 retirement operation 和 exact Delivery。已完成 owner fact 持久保存，retry 只调用仍 unknown 的 owner 并复用同一 authorization。`retained-for-recovery` 是 known，可以 settle；`unknown` 不可。

settlement owner tuple 的顺序与类型严格为 Coordinator、Host、Invocation、Custody。写入后 Observation 和 inspection 都不能修改其 bytes。

## 7. Observation boundary

Observation 是 lifecycle truth 持久化后的 private one-way call point。Runner 不规定 transport、outbox、retry queue、storage 或 mapping。Observation 可以 disabled/unavailable/reject/throw/返回 rejected promise/永不 settle；所有情况都不能阻塞或改变返回的 Delivery outcome。production mapping/composition 归 Observation owner。

## 8. Failure 与验证

correlation mismatch、unsafe activation rejection、ambiguous start、stale control、cancel race、publication unknown 和 owner-retirement unknown 必须 fail closed，并按情况形成 typed rejection、unknown 或 intervention，而不是 fabricated completion。

测试必须覆盖 lifecycle replay/correlation rejection、simultaneous execute/cancel、Action/Workflow bridge 分离、recovery 时 cancel-before-bridge、全部 publication disposition、partial retirement、four-known-facts-before-settlement、Observation failure/non-settling isolation，以及 Adapter own keys 严格为三个 public operation。

如果 Execution 需要新增 public operation、cross-process multi-writer coordination 成为产品要求，或 terminal truth 必须依赖外部 Observation acknowledgement，则重新打开本设计。
