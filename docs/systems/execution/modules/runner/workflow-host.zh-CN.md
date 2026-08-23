# Workflow Host Submodule 详细设计

## 1. 状态与角色

| 字段 | 值 |
| --- | --- |
| 状态 | `ITERATION_2_IMPLEMENTED_DOCUMENT_CALIBRATION_CANDIDATE` |
| Submodule | Workflow Host |
| 当前 Adapter | LangGraph Workflow Host Adapter |
| 结构权威 | GitHub issue `execution-system#64` |
| 实现证据 | `execution-system/src/host` |
| Companion | [英文规范原文](workflow-host.md)；本文是 non-normative 中文 companion |

Workflow Host 在 private durable thread 上执行 admitted control graph。稳定模块身份不依赖 LangGraph。当前 Adapter 使用 LangGraph 与 SQLite；其他 substrate 可以实现同一 capability，而不改变 Runner 或 Execution identity。

## 2. 创建边界

Workflow Host 拥有 closed `WorkflowHostAdapterFactory` contract 和各 concrete factory。LangGraph factory 校验 exact configuration，创建 private checkpointer/thread storage，并返回 `CoordinatorHost` capability。

RunnerFactory 选择唯一 exact configured factory，当前为 `engine: "langgraph"`，并装配返回的 Host。不存在 Host registry、ambient discovery、preference order 或 fallback。creation failure 阻止 Runner 发布。Factory construction 不编译或启动 Delivery。

## 3. 职责

Host 拥有 private thread/checkpoint identity、compiled control graph/typed dataflow interpretation、exact execution-site lookup、Invocation dispatch materialization、declared decision/successor、selected parallel set/barrier、Workflow Wait/same-episode Action suspension、Host-owned deterministic operations、Host-side result/schema/Gate validation、commit data edge 前的 Workspace coordination、terminal proposal、stop、inspection、recovery 和 Host retirement facts。

Host 不拥有 Delivery admission、Provider-native session state、credential、publication、final settlement 或 external interaction UI。

## 4. Static topology 与 dynamic path

control topology 是 static/closed，执行 path 是 dynamic。Planner 是普通 admitted Action；其 typed result 只能选择 declared successor 或 declared non-empty parallel subset。

parallel node 缺少 `selection` 表示选择全部 declared branches；存在时从 declared source port 读取 declared non-empty subset；`required: true` 只约束当前 selected set；barrier 只等待该 set；undeclared、empty 或 stale selection 在 branch effect 前失败。

Host 不在运行时创建 topology，也不把 undeclared Agent proposal 当作 successor。

## 5. Action execution 与 data commit

在 Agent site，Host 从 compiled activation/current committed state 物化 exact Action、executor、typed input、session affinity 和 signed Workspace capability，然后调用 `HostInvocation`。

Invocation completion 只是提交给 Host 的 proposal。committed Workflow state 改变前：Host 校验 structured result schema/Gate；预览完整 declared State/Artifact/data-edge update；Workspace/Custody 独立校验 signed capability 与 observed workspace/read state；只有两者都接受才应用 preview、记录 next savepoint 并 checkpoint new state。

Host reject 或 Workspace reject 恢复 prior savepoint。restore uncertainty 进入 Intervention，不能被 terminalize 成 known failure。

## 6. 两种 suspension

`action-input` 保持同一 Action episode、execution site、invocation identity 和 native session。Host checkpoint quiescent suspension，之后用 exact correlated response 调用 `continueWithInput`。它不推进 edge，也不创建 Workflow Wait。

`workflow-wait` 只在 Action/Host operation 已返回且 declared graph 显式等待 external approval/decision/workflow result 时存在。它按 declared Wait semantic 推进，并只接受 exact admitted control result。

两种 disposition/resume operation 不得互换。

## 7. Failure、recovery 与 retirement

nonretryable Invocation/Host-operation failure 在存在时遵循 exact declared event-successor；corrupt/undeclared target fail closed。unknown Invocation/Custody state 形成 Intervention，不猜测 route。

Recovery directive 为 `continue`、`restart-from-savepoint` 或 `intervene`。checkpoint 与 Custody savepoint 分别独立 known，不能相互替代。

Host retirement 只处理 owner-scoped state。它校验 exact authorization/thread correlation，只删除 Host-owned thread/checkpoint record，并持久化 minimal owner fact。same authorization 重放同一 fact；different authorization fail closed。durable storage operation 对同一 thread 的 independent Host instance 串行化 destructive cleanup，且只执行一次。

## 8. Substrate boundary 与验证

LangGraph node handler、conditional edge、checkpointer schema、SQLite operation 都是 current Adapter 私有细节；除 closed Host selection/config value 外，不进入 shared Contract 或 `RunnerFactoryConfig`。

测试必须覆盖 exact factory selection/startup failure、dynamic decision/subset、selected barrier、dataflow/schema fail-close、真实 Invocation/Custody collaboration、两种 suspension、preview-before-Custody、restore uncertainty、recovery、cross-instance retirement，以及 Host 不能访问 Coordinator-only capability 的 import boundary。

如果 substrate 无法保持 stable-boundary semantic、要求公开 native thread state 或需要 in-flight engine substitution，则重新打开本设计。
