# Runner Interpreter Submodule 详细设计

## 1. 状态与角色

| 字段 | 值 |
| --- | --- |
| 状态 | `ITERATION_2_IMPLEMENTED`；conformance 仅覆盖已交付测试与锁定 composition |
| Submodule | Runner Interpreter |
| 实现 | `execution-system/src/interpreter/compile-runner-activation.ts` |
| 结构权威 | GitHub issue [#47](https://github.com/firestige/workflow-self-recursive/issues/47) 与 [#62](https://github.com/firestige/workflow-self-recursive/issues/62) |
| Companion | [英文规范原文](interpreter.md)；本文是 non-normative 中文 companion |

Interpreter 是 Runner 的一次性 activation stage。它校验 fully admitted `RunnerActivationContext`，并编译出 Workflow Host 消费的 minimal stable graph。它只提供 validation/compilation fact 或 typed rejection；不签发 Delivery admission、不修改 Package Snapshot、不授予 Provider permission，也不推进 Workflow state。

## 2. 输入与输出

输入是一个 deeply frozen activation；其 package、definition、resource、authority、route、Agent/Provider、workspace 与 correlation binding 已由 Execution Delivery 在调用 Runner 前解析。

输出是 frozen `CompiledGraphActivation` 或 typed `CompileError`。Raw Package/schema document、selector、Package Store handle、Delivery-admission service、native thread/checkpoint/session/process ID 与 secret-bearing value 都在 boundary 被拒绝。

## 3. 校验与编译

Interpreter 校验 exact activation shape、deep freezing、binding digest、control/execution/dataflow closure、session/capability binding 与 compile identity。它编译 declared site、route、join、data edge、Wait、budget、validator 与 terminal mapping，但不改变 Contract meaning。

当前实现是 `compileRunnerActivation`；`validateRunnerActivation` 强制 admitted contract identity，并拒绝 forbidden/native/secret field。这些实现证据不会把 Delivery admission ownership 从 `execution.delivery` 转移给 Runner。

## 4. 依赖方向

Lifecycle Coordinator 在 Host start 前调用 Interpreter 一次。Interpreter 不依赖 Host、Invocation、Custody、Observation、Package Source、Package Store 或 Delivery current-slot state，也不拥有 durable state。

## 5. Failure 行为

任何 invalid、stale、unresolved、unsupported 或 mismatched activation 都在 Workflow progress/child effect 前失败。Interpreter 不从 ambient file、Runner default、Provider default 或 fallback route 修复不完整 activation。

## 6. 验证与 reopen 条件

所需证据覆盖 deep-freeze/digest check、forbidden/native/secret field rejection、unresolved action/control/dataflow negative、unsupported capability、deterministic compile identity，以及从构造上拒绝 raw Package。

当已发布 Workflow Contract 改变 admitted activation meaning、编译需要新的 cross-owner input，或 Interpreter 必须修改 Delivery/Package truth 时，重新打开本设计。
