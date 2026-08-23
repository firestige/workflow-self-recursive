# Runner 模块详细设计

## 1. 状态与权威

| 字段 | 值 |
| --- | --- |
| 状态 | `WAVE4_ENTRY_REVIEW_CANDIDATE`；不代表实现已符合要求 |
| 稳定身份 | Runner / Runner Runtime Adapter |
| System owner | Project Execution System |
| 外部接口 | Execution-owned `ExecutionRuntimeAdapter` |
| Companion | [英文规范原文](runner.md)；本文是 non-normative 中文 companion |
| 相关设计 | [Execution System](../../project-execution-system.zh-CN.md)、[Runner Runtime Profile](../../../runtime/runner-runtime-profile.zh-CN.md) |

本文从已冻结的 Iteration 2 设计谱系中吸收稳定的模块设计。谱系记录继续作为来源；交付 Goal 名称和特定 revision 的问答上下文不作为长期产品身份。如果本文与 Execution-owned 外部接口或已发布 Contract 冲突，以相应 owner 为准。

## 2. 身份与目的

Runner 是执行 fully admitted Workflow activation 的 embedded Runtime Adapter。它的稳定身份不包含 LangGraph 或其他可替换实现依赖。LangGraph 是当前选定的 Workflow Host substrate；未来可以由兼容 Host Adapter 替换，而不改变 Execution-facing 接口或 in-flight Delivery。

Runner 只接收 deeply frozen `RunnerActivationContext`。Delivery admission 已经校验并解析 Workflow Package、schema、resource、Agent/model/Driver/provider binding、workspace 和 correlation。Runner 不读取 raw Package document set、root schema、shared meta、selector、source Adapter 或 admission service。

Runner 严格实现 Execution owner 定义的三个 public operation：

```text
execute(activation)
inspect(delivery)
cancel(delivery)
```

Resume、recovery、checkpoint、native session 和 retirement operation 都留在 private composition capability 中。

## 3. 创建平面

Execution Runtime Interaction 选择 Runtime Adapter 并冻结所选 configuration identity。private `RunnerFactory` 根据该 exact configuration 物化一个 Runner instance。

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

`RunnerFactoryConfig` 是 closed immutable composition value。它包含创建实例所需的 exact storage root、所选 Workflow Host engine、Provider factory key/configuration。它不包含预构造的 provider-native service、任意 callback、ambient discovery、priority ordering 或 fallback rule。

Provider 创建使用 Runner composition 所有的 closed exact-key registry instance。Provider Factory SPI 和 concrete Provider factory 归 Managed Agent Invocation 所有。duplicate key、unknown key、invalid configuration 或 startup failure 必须在 Runner 发布前失败。

Workflow Host 创建使用唯一 exact configured factory。当前配置选择 `engine: "langgraph"`。不存在 Host registry、priority selection 或 fallback。未来 engine 通过扩展 closed configuration union 并提供兼容 factory 进入。

Factory selection 只发生在创建期。active Delivery 保持启动时的 exact Runner、Host、Provider 和 configuration identity；configuration reload 或 dependency availability 不得替换 in-flight implementation。

## 4. 调用平面与依赖方向

Agent Action 主路径是：

```text
Execution → Lifecycle Coordinator → Workflow Host → Managed Agent Invocation
```

完整 capability graph 是：

```text
Lifecycle Coordinator → deterministic activation compiler
Lifecycle Coordinator → Workflow Host
Lifecycle Coordinator → Managed Invocation control
Lifecycle Coordinator → Workspace/Publication lifecycle
Workflow Host → Managed Invocation action capability
Workflow Host → Workspace/Custody capability
```

Workspace authority 只以 signed `AuthorizedWorkspaceCapability` value 的形式随 Host dispatch 到达 Managed Invocation。Managed Invocation 永远不获得 Workspace/Custody service。返回值只完成原始调用，不形成 reverse dependency。

deterministic activation compiler 是 composition helper，不是另一个 Runtime module。它消费 admitted activation，校验 exact closure/binding identity 并产生 minimal execution plan。它没有 durable state，也不执行 admission、Provider、Host 或 Workspace effect。

## 5. 模块 ownership

| 模块 | 拥有 | 不拥有 |
| --- | --- | --- |
| [Lifecycle Coordinator](lifecycle-coordinator.zh-CN.md) | Adapter lifecycle、external bridge、cancel/recovery coordination、terminal settlement | graph decision、Provider session、Git mutation |
| [Workflow Host](workflow-host.zh-CN.md) | thread、graph path、dataflow、barrier、checkpoint、suspension、terminal proposal | Provider-native state、Delivery settlement、publication |
| [Managed Agent Invocation](managed-agent-invocation.zh-CN.md) | Provider invocation、native session、credential、Journal、structured completion | graph progression、Workflow Wait、Custody service |
| [Workspace and Publication Manager](workspace-publication-manager.zh-CN.md) | baseline、savepoint、workspace authority、restore、result preservation、publication | Action result semantic、graph path、terminal arbitration |

每个 durable fact 只有一个 writer。caller-specific capability 防止调用者触达不归其所有的 operation。

## 6. 配置与扩展规则

- constructed Runner 内的 Provider key 是 exact 且 closed；禁止 ambient plugin discovery、provider fallback 和 priority arbitration。
- DSH Provider factory 拥有 DSH-native bootstrap，负责在 Provider Adapter boundary 后创建真实 `AgentRegistry`、`SessionStore` 和 native session factory。
- Copilot/Codex 在各自 production obligation 完成前保持 typed fail-closed Provider shell；其存在不代表支持，也不得触发 fallback。
- Workflow Host factory 拥有所选 substrate 和 private checkpoint storage 的创建；RunnerFactory 只拥有 exact selection 与 instance assembly。
- result validation support 是 Runner 固定、fail-closed 的 internal capability，由 RunnerFactory 注入 Managed Invocation；它不是用户可配 policy，也不进入 shared activation Contract。
- Observation 是 private one-way non-controlling port；disabled、rejected、throwing 或 tail loss 都不能改变 lifecycle truth 或阻塞已完成 Delivery。

## 7. Lifecycle invariant

1. correlation/binding mismatch 在 child effect 前失败。
2. unknown start/recovery disposition 保持 unknown；Runner 不伪造 non-start，也不 blind retry。
3. Action-scoped input 保持同一 episode/native session，与 Workflow Wait 不同。
4. Host result validation 与 Workspace validation 必须都通过，才能提交 result/data edge 和 next savepoint。
5. terminal 顺序是 proposal → preserve result → known publication → one retirement authorization → owner-scoped retirement → four known owner facts → immutable settlement → optional Observation。
6. publication conflict 是 known，可进入 settlement；publication unknown 不可。
7. partial retirement retry 使用同一 authorization；已完成 owner 重放同一 fact，不重复 destructive cleanup。
8. public Adapter shape 始终严格为 `execute`、`inspect`、`cancel`。

## 8. 验证与 reopen 条件

必须证明 exact configuration selection、duplicate/unknown factory-key negative、真实 Provider/Host factory construction、import DAG/caller capability、admitted activation input、raw Package 不可达、两种 suspension、cancel/recovery、真实 DSH 本地 transport 路径、terminal ordering、Observation 隔离，以及 full/coverage/static/typecheck/build gate。

当 Runtime 必须变成 remote service、多个 active instance 共享 current slot、Provider/Host 必须运行时 fallback、native state 必须穿过 Execution public seam，或 shared Contract 无法表达必要 cross-owner fact 时，重新打开本设计。
