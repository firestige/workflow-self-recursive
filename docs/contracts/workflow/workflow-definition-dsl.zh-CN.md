# Agent Ops Workflow Definition DSL — Contract 面（中文翻译）

> **状态：REVIEW_CANDIDATE，未发布，不可用于 conformance 声明。** 本文是 [`workflow-composition-model.md`](../../workflow-composition-model.md) §4.3 推迟的 **Workflow Contract 的 DSL 面**：最终字段与合并算法的定义源头。它把"机器可读 Workflow Definition"从设计原则变成闭合的机器可校验格式。语义已冻结为供下游验证的候选（快速路径，[Contract Lifecycle Management](../contract-lifecycle.md) §4.3）；在 schema、registry、fixtures 与验证证据发布之前，任何实现不得声称对该 Contract 的 physical conformance（沿用 `EE-OBL-001` 的诚实生命周期约定）。
>
> **规范语言：英文。** 本文件是 [`workflow-definition-dsl.md`](workflow-definition-dsl.md) 的非规范跟踪翻译。每当英文章节变更，其中文对应章节从当前英文章节整体重译并整篇替换；中文维护不保留或增量演进先前的中文措辞。
>
> **归属**：本 Contract 文档位于 super project 的 `docs/contracts/workflow/`；其规范机器表示（JSON Schema、示例 Package、校验器）位于 [`system-contracts/workflow-dsl/`](../../../system-contracts/workflow-dsl/)。`workflow-package/` 只承载可执行 Workflow 及其资源，不承载 Contract。

## 1. 定位、范围与依赖

| 字段 | 内容 |
| --- | --- |
| 状态 | 按 [Contract Lifecycle Management](../contract-lifecycle.md) 为 `REVIEW_CANDIDATE`（快速路径 §4.3）；Contract revision `agentops.workflow-dsl@0.1.0` |
| 上层依据 | [`workflow-composition-model.md`](../../workflow-composition-model.md)（governing，尤其 §4、§6、§7、§8、§9、§11、§12、§13、§14）、[`agent-architecture.md`](../../agent-architecture.md)（§3 稳定概念、§4 cross-system invariants）、[`systems/runtime/first-party-langgraph-runtime-profile.md`](../../systems/runtime/first-party-langgraph-runtime-profile.md)（§3 范围，尤其 Builder/compiler 为 non-goal；§13–14 证据纪律） |
| 对齐的 design-time 语义 | [`workflow-package/implementation/workflow.md`](../../../workflow-package/implementation/workflow.md)、`agents/routes.md`、`schemas/*.schema.md`、`templates/*.template.json`、`composition-conformance.md`；[`workflow-package/system-design/workflow.md`](../../../workflow-package/system-design/workflow.md)、`agents/routes.md`、`schemas/*.schema.md`（本文翻译并闭合它们的语义，不重定义） |
| 本 Contract 回答 | §4.3 推迟的两件事：**最终字段**（§5 + `system-contracts/workflow-dsl/schemas/` 规范 schema）与**合并算法**（§7，authority/组合顺序的可验证规则） |
| 本 Contract 不定义 | Definition→Implementation 编译/执行、builder/authoring 工具、物理目录名、LangGraph/Driver 原生 API、Runtime 私有状态格式 |

**明确不做**（与 FPLG §41 一致）：

1. 不实现"Definition → LangGraph `StateGraph`"的编译与执行 —— 那是 FPLG/Execution 层动作。
2. 不做 builder / 简单配置 authoring 工具 —— MVP 直接从机器可读 Definition 开始。
3. 不重新设计 graph 概念 —— 继承行业通用 graph 原语（node / edge / conditional edge / state schema / reducer / checkpoint / interrupt），语义与 LangGraph 1:1 对齐但不提升其物理 API 身份。
4. 不写成"伪 YAML" —— 每个字段的含义、允许值、约束在本文件与规范 schema 中闭合（composition model §9/§230）。

**Definition 的语言中立性。** DSL 本身是开放的：Definition 内的人类可读文本（如 `purpose`、`meaning`、Prompt 与 Skill 资源内容）**不限制语种** —— 第三方 Workflow 作者可以使用他们选择的语言。第一方 Package 对人类可读文本遵循项目的英文优先政策。本文作为 Contract，无论任何 Definition 内使用何种语言，都以英文为权威。

## 2. 分层模型与物理表示中立

### 2.1 四层语义

| 层 | 是什么 | 谁写 | 是否进 Package |
| --- | --- | --- | --- |
| **Workflow Definition** | 逻辑 Workflow 的版本化、技术中立、机器可读声明（graph / state schema / transition / Action / Gate / budget / Wait / recovery / terminal / Role route / Artifact template / validation / handoff） | Package owner | 是，canonical |
| **Workflow Implementation** | 某 Runtime Profile 对 Definition 的可执行实现（第一方：编译为 LangGraph JS `StateGraph`） | Runtime/编译层 | 否，Runtime 私有编译产物 |
| **Workflow Package Snapshot** | 一次 Delivery 对 Package 的不可变、完整、已解析 identity-and-relationship closure | Execution 准入 authority | 否（准入时产生） |
| **Workflow State** | 一次 Delivery 的可变运行状态（current Action、结果、Artifact、预算、Wait、recovery、terminal proposal） | Selected Runtime Profile 独占 | 否 |

定义层级的不变量：**Runtime 只接受编译后的 Implementation；Implementation 不得改变 Definition 声明的 Action、合法 transition、Gate 或终态语义**（composition model §4.2）。本 DSL 只定义 Definition 这一层的机器可读格式及其闭合规则。

### 2.2 物理表示中立

- **语义身份是字段与规则，不是字节。** 本 Contract 的 identity 是 §5–§11 的语义模型。
- **规范编码是 JSON**（可被 JSON Schema draft-07 校验）。`system-contracts/workflow-dsl/schemas/` 目录中的 8 个 schema 文件是规范机器形式。
- 其他物理编码（YAML/CBOR/…）只有在能**无损双向映射到规范 JSON 且往返后字段语义不变**时才允许作为表示；任何编码都不得引入 LangGraph/Driver 物理字段（附录 C）。
- 禁止把 LangGraph 的物理 API 身份提升为 Contract canonical identity：`StateGraph` 类名、`langgraph.json`、原生 checkpoint/thread ID、原生 reducer 函数名等（composition model §12 坏味道、§13 红线）。这些属于 Implementation/编译层。

### 2.3 指令 authority 顺序（总纲）

推荐的指令 authority 顺序（composition model §8）被本 Contract 固定为**规范序**，任何 Package 都必须声明且不得偏离（§7.1）：

```text
Workflow/Action authority → Role prompt → Action Prompt → Skill instructions → Artifact/user content
```

后者不能扩大前者 authority；Artifact 是被处理的数据，不因含有命令式文本而成为配置指令；冲突 fail closed，不依赖 Driver 隐式优先级。

## 3. 文档集总览与 Package 闭合

一个符合本 DSL 的 Workflow Package 由 **1 个 Package Index + 6 个 Definition 文档**组成（物理文件可合并，但 authority 不得合并；`package.json` 的 `documents` 字段给出相对路径，本 Contract 不规定固定目录名）：

| 文档 kind | 文件（示例） | 内容 | 规范 schema |
| --- | --- | --- | --- |
| `agentops.package` | `package.json` | Package identity/purpose/status/ownership、document set、**owned/referenced 资源索引**、authority 声明、环境要求、兼容范围 | `schemas/package.schema.json` |
| `agentops.workflow-definition` | `workflow.json` | workflow identity、state schema（reducer）、graph（nodes/edges/conditional edges/terminals）、waits、budgets、recovery、handoffs/consumedHandoffs | `schemas/workflow-definition.schema.json` |
| `agentops.actions` | `actions.json` | Action catalog：input/result schema、responsibleAuthority、allowedRoutes、execution（single/parallel）、selector、escalation、gate、budget、wait、recovery | `schemas/actions.schema.json` |
| `agentops.roles` | `roles.json` | Role 稳定职责、authority boundary（concerns/writePermissions/prohibited）、independence | `schemas/roles.schema.json` |
| `agentops.routes` | `routes.json` | Role route → Agent binding：Role prompt、Agent definition、Action prompts、Skills、model、tools、Driver、session policy、access、escalation | `schemas/routes.schema.json` |
| `agentops.artifacts` | `artifacts.json` | Output/intermediate Artifact template（一等资源：真实内容或固定引用）、section 覆盖、completion、lifecycle、dependency validity | `schemas/artifacts.schema.json` |
| `agentops.validation` | `validation.json` | deterministic validators、aggregation 规则、review lens 定义、conformance corpus（positive/negative/recovery） | `schemas/validation.schema.json` |

共享定义（identity / contentIdentity / sourceLocator / schemaRef / inlineSchema / predicate / reducer / resourceRef / authorityOrder）在 `schemas/agentops.meta.schema.json`。

### 3.1 Package 闭合规则（机械校验）

1. `documents` 中的 6 个文件都存在且 `kind` 与 `schemaVersion` 匹配；
2. `package.definition.contentIdentity` == `sha256(documents.workflow)`；
3. 所有被 routes/artifacts/template/selector 引用的资源 id 都在 `resources.owned|referenced` 中声明；
4. owned 资源的 `path` 存在且 `contentIdentity` == `sha256(path)`；referenced 资源必须带 `sourceLocator`，不得带 `path`；
5. `authority.order` 等于规范序，`conflictMode` 为 `fail-closed`；
6. 不存在 ambient fallback：任何 route/资源缺失、内容身份失配、未声明引用都使 Package **不可准入**（admission/recovery 显式失败或进入 Workflow 声明的恢复路径，不能重新解析成另一版本）。

## 4. 核心 graph 语义（继承行业标准，1:1 对齐 LangGraph 语义）

本 DSL 的 graph 语义与行业通用模型（LangGraph 语义是其代表）逐项对齐，但只保留**语义**，不保留任何物理 API。映射表：

| 行业/LangGraph 语义 | 本 DSL 构造 | 说明 |
| --- | --- | --- |
| node | `graph.nodes[].id` + `action` | 图的执行单元；每个 node 绑定一个 Action |
| edge（静态转移） | `graph.edges[]`（`from`/`to`/`condition`） | `to` 可以是 node 或 `terminal:<id>` |
| conditional edge（条件函数） | `graph.conditionalEdges[]`（`judge` + `conditions[].when` 谓词 → `target`，`default`） | 分支结构归 Workflow；**判断**归 state 谓词或 Planner Action（§4.1） |
| state schema | `state.fields[]`（name/type/items/schema/reducer） | 见 §4.2 reducer |
| reducer（状态合并） | `reducer` 内建词汇 + custom | 见 §4.2 |
| checkpoint（持久化） | `graph.nodes[].checkpoint`（mode + bindings） | 见 §4.3 |
| interrupt / resume | `waits[]` + Action `waitPolicy` | 见 §4.4 |
| terminal（END/终态） | `graph.terminals[]` + `terminal:<id>` 引用 | 见 §4.5 |
| 并行分支 + barrier（Send 语义的静态形式） | Action `execution.mode: "parallel"`（branches + join.barrier） | 见 §4.6 |

### 4.1 谓词词汇表（closed）

`predicate` 只允许三种组合子（`allOf` / `anyOf` / `not`）与原子断言 `{field, op, value}`，`op` 闭合为：

`eq | ne | gt | gte | lt | lte | exists | notExists | in | notIn | contains | notContains`

- `field` 是 Workflow State 的点分路径（如 `aggregation.routing`）；
- `exists/notExists` 不允许 `value`；其余 op 必须带 `value`；
- `contains/notContains`：数组成员或字符串子串；
- 语义超出词汇表的规则**不允许写成自由代码**，必须引用 deterministic validator 资源（`gate.deterministic` / `validator`）。

这保证条件边的语义在 Definition 层完全可判定、可机械校验；复杂判断显式委托给内容寻址的确定性校验器，而不是"看似可准入"的伪代码。

**条件边的判断 authority。** `conditionalEdges` 条目声明 `judge`：
- `judge.kind: state`（默认）：`conditions[].when` 谓词对 Workflow State 求值（仅结构化结果）。
- `judge.kind: planner`：runtime 先调用声明的 Planner Action 的 Agent 对（可能非结构化的）上下文做语义判断；Agent 返回符合 `resultSchema` 的结构化分类；runtime 校验后按 `conditions[].when` 对该分类选分支。判断归 agent，分支结构归 workflow。Planner Action 必须声明其 allowed routes 且保持非递归。

### 4.2 State 与 reducer（closed）

- state 字段类型闭合为 `string | integer | number | boolean | array | object | artifactRef`；array 需 `items`，object/artifactRef 可用 `schema` 固定引用；
- **内建 reducer 词汇表**（语义闭合）：

| reducer | 语义 |
| --- | --- |
| `overwrite`（默认） | 后写覆盖前写 |
| `append` | 数组追加（可配合 dedup 规则）；用于 findings 等累积 |
| `merge` | 对象浅合并 |
| `keepFirst` | 只保留首次写入 |
| `sum` / `max` / `min` | 数值聚合；用于预算/计数（如 `reviewIterations`） |
| `custom` | 必须引用 content-addressed 的确定性 Package-owned 函数；其绑定发生在 Implementation/编译层 |

- 同一字段的 reducer 是 Definition 语义的一部分：**改变 reducer 语义 = 语义变更（MAJOR）**（§11）。

### 4.3 Checkpoint

- node 可声明 `checkpoint.mode ∈ {always, on-wait, on-terminal-proposal, never}`（默认 `always`）与 `bindings`；
- **最小绑定集**（契约要求，缺失即 fail closed）：`delivery, snapshot, actionAttempt, manifestRevision, gitTree`；可扩展 `artifactVersions, pendingWait, budgets, lastProgress`；
- 物理 checkpoint ID / thread ID 是 Runtime 私有，**不是**产品 Workflow identity（composition model §12 坏味道）。

### 4.4 Wait / interrupt / resume

- `waits[]` 声明：`kind ∈ {user, external, spike}`、`triggerAction`、`resumeAction`、`resumeSchema`、`correlation {identitySource, staleRejected: true, duplicateRejected: true}`、`expiry`；
- Action 通过 `waitPolicy {kind, wait}` 绑定 Wait；
- 语义规则：一次 Wait 只绑定**一个**待决测量/决定或**一个**协调请求；只有 exact authorized pending answer 才能恢复；stale/mismatched/duplicate answer 无效果（fail closed）；expiry 是确定性策略事件（可续期恢复或进入 `INCOMPLETE`），**expiry 不是成功也不是静默取消**；
- Definition 声明 Wait 语义；Implementation 层把它编译为 Runtime 的 interrupt/resume 机制。

### 4.5 Terminal

- `graph.terminals[]`：`id`（如 `SUCCESS`）、`kind ∈ {success, failure, incomplete, cancelled, custom}`、`meaning`、`validation[]`（引用 validators）、`proposalCheckpoint`（默认 true：终态先形成 checkpointed terminal proposal，再 settlement）；
- 边目标用 `terminal:<id>` 引用；预算耗尽/取消/不可重试失败通过**运行时强制的 terminal 转移**进入（不是普通边），见 §6.4。

### 4.6 并行分支与 barrier（v1 范围）

- Action `execution.mode: "parallel"`：`branches[]`（每条 `route` + `isolation ∈ {session-isolated, shared}` + `required`）+ `join`（`mode ∈ {all, aggregator}`，`barrier: true` 强制）；
- 语义规则：并行分支在 barrier 之前**互相隔离**（session 隔离、看不到彼此结论；共享原始证据 ≠ 共享结论）；join 必须显式声明（`all` 或 `aggregator` 动作）；aggregation 规则在 `validation.aggregation` 声明；
- v1 不引入动态 fan-out（Send）构造：静态并行分支 + state reducer 已覆盖两个 first-party Workflow（IM-12 双 lens、SD-09 三 lens）。动态 fan-out 是候选扩展，需要 Contract revision 才能进入（避免半闭合伪 YAML）。

## 5. 最终字段（§4.3 推迟问题之一）

规范字段全集以 `system-contracts/workflow-dsl/schemas/` 下 8 个 JSON Schema 为权威。本节给出每个文档 kind 的**字段目录**（name / 必填 / 含义与约束），供人类阅读；机器校验以 schema 为准。任何字段含义未闭合、或 schema 未覆盖的字段，都使文档不合法（`additionalProperties: false` 强制闭合）。

### 5.1 `agentops.package`（`package.json`）

| 字段 | 必填 | 含义与约束 |
| --- | --- | --- |
| `kind` | 是 | `const: "agentops.package"` |
| `schemaVersion` | 是 | `agentops.workflow-dsl@X.Y.Z` |
| `package.name` | 是 | `^[a-z][a-z0-9-]*$` |
| `package.version` | 是 | semver `MAJOR.MINOR.PATCH` |
| `package.purpose` | 是 | 解决的问题与成功/终态含义 |
| `package.status` | 是 | `DRAFT \| CONFIRMED \| DEPRECATED` |
| `package.admissibility` | 否 | `ADMISSIBLE \| DESIGN_REFERENCE \| EXAMPLE_NON_ADMISSIBLE`；非 ADMISSIBLE 不得准入为生产 Snapshot |
| `package.ownership` | 是 | `owner` + `authoritySource` |
| `package.definition` | 是 | `name/version/contentIdentity`；contentIdentity 必须等于 workflow 文档的 sha256 |
| `documents` | 是 | 6 个文档相对路径（workflow/actions/roles/routes/artifacts/validation） |
| `resources.owned[]` | 是 | 见 §5.8；owner=owned 必须带 `path`，不得带 `sourceLocator` |
| `resources.referenced[]` | 是 | owner=referenced 必须带 `sourceLocator`，不得带 `path` |
| `authority.order` | 是 | 必须等于规范序（§7.1） |
| `authority.conflictMode` | 是 | `const: "fail-closed"` |
| `environmentRequirements[]` | 否 | 环境能力声明，不含凭据 |
| `compatibility` | 是 | `minContractVersion`/`maxContractVersion`（本包声明兼容的 Contract 范围） |

### 5.2 `agentops.workflow-definition`（`workflow.json`）

| 字段 | 必填 | 含义与约束 |
| --- | --- | --- |
| `kind` / `schemaVersion` | 是 | `agentops.workflow-definition` / `agentops.workflow-dsl@X.Y.Z` |
| `workflow.{id,name,version,purpose,contractVersion}` | 是 | Definition 独立版本身份（composition model §4.1） |
| `state.fields[]` | 是 | 见 §4.2；`name` 模式 `^[a-z][a-z0-9_]*$` |
| `graph.start` | 是 | 必须是 node id |
| `graph.nodes[]` | 是 | `id` + `action`（action 必须存在于 actions 文档）+ 可选 `checkpoint` |
| `graph.edges[]` | 否 | `id/from/to` + 可选 `condition`；node 不得同时有静态出边与条件边 |
| `graph.conditionalEdges[]` | 否 | `id/source/judge?/conditions[]/default`；conditions 至少 1 条；`judge` = state 谓词或 Planner Action（§4.1） |
| `graph.terminals[]` | 是 | `id/kind/meaning` + 可选 `validation[]`/`proposalCheckpoint` |
| `waits[]` | 否 | 见 §4.4 |
| `budgets[]` | 否 | `id/scope/resource`（`time|tokens|context|custom`，custom 需 `resourceName`）+ `evaluator`（脚本注册点，schemaRef）+ `onExhaustion` + 可选 `action`/`accounting`；**配置中无数值额度**（§6.4） |
| `recovery[]` | 否 | `id/mode` + 可选 `scope/action/condition`；`noBlindReplay: true` 强制 |
| `handoffs[]` | 否 | 上游 handoff 声明；`semanticOnly: true` 强制，禁止下游控制字段（§10） |
| `consumedHandoffs[]` | 否 | 下游消费声明；`mustNotWeaken: true` 强制，`preservesSemantics` 字节保真（§10） |

### 5.3 `agentops.actions`（`actions.json`）

| 字段 | 必填 | 含义与约束 |
| --- | --- | --- |
| `actions[]` | 是 | — |
| `id/name/purpose` | 是 | — |
| `inputSchema` / `resultSchema` | 否 / 是 | `schemaOrInline`：固定引用（schemaRef）或受限内联 schema |
| `responsibleAuthority` | 是 | `{kind: role, role}`（Agent Action，composition model §11）或 `{kind: runtime, validator}`（纯确定性 Action，Runtime authority） |
| `allowedRoutes[]` | 仅 role action | Agent Action（`kind: role`）：≥1 条 roles/routes 文档声明的 route id。Runtime Action（`kind: runtime`）不声明——它们没有 Agent 绑定 |
| `execution` | 是 | `{mode: single}` 或 `{mode: parallel, branches[], join{barrier: true}}`（§4.6） |
| `selector` | 是 | `{kind: deterministic}` 或 `{kind: planner, action, proposalSchema, allowedTargets, nonRecursive: true}`（§6.3） |
| `allowedSuccessors[]` | 是（≥1） | 必须**等于**该 Action 所在 node 的 graph 出边集（§6.2 机械校验） |
| `escalation` | 否 | `{allowed, scope: "route-within-allowed", cannotChange[]}`（§6.9） |
| `gate` | 是 | `preconditions[]/postconditions[]`（谓词）+ `deterministic[]`（validator 引用）+ `freeTextBypass: "prohibited"` |
| `budget` / `waitPolicy` / `recovery` | 否 | 引用 workflow 文档中声明的 budget/wait/recovery id |

### 5.4 `agentops.roles`（`roles.json`）

| 字段 | 必填 | 含义与约束 |
| --- | --- | --- |
| `roles[]` | 是 | — |
| `id/name/responsibility` | 是 | — |
| `authorityBoundary.concerns[]` | 是 | 从闭合 concern 词汇表选择（§7.2），声明该 Role prompt 可指令的关切 |
| `authorityBoundary.writePermissions[]` | 是 | `target` + `scope`（如 run-workspace 写、finding 写、approved-manifest commit） |
| `authorityBoundary.prohibited[]` | 是 | 明确禁止项 |
| `independence` | 否 | `{isolation: session-isolated/shared, barrier, sharedRawEvidenceOnly}` |

### 5.5 `agentops.routes`（`routes.json`）

| 字段 | 必填 | 含义与约束 |
| --- | --- | --- |
| `routes[]` | 是 | — |
| `id/role` | 是 | role 必须存在于 roles 文档 |
| `agent.definition` | 是 | 资源引用（agent-definition） |
| `agent.managedProjection` | 是 | `const: "required"`：只接受冻结 route 的 managed projection，禁止 ambient/default 替换 |
| `resources.rolePrompt` | 是 | 资源引用 |
| `resources.actionPrompts[]` | 是 | `{action, prompt}`：每个 action 绑定一个 Action Prompt 资源 |
| `resources.skills[]` / `tools[]` | 否 | 资源引用列表 |
| `resources.model` / `driver` | 是 | 资源引用 |
| `resources.sessionPolicy` | 是 | `{freshness: fresh-per-episode/continuous-within-goal/resumable-within-admitted-dialogue, isolation: isolated/shared, resumeRule?}` |
| `access[]` | 是 | `{target, mode: read/write/execute}` |
| `escalationAllowed` | 是 | bool |

### 5.6 `agentops.artifacts`（`artifacts.json`）

| 字段 | 必填 | 含义与约束 |
| --- | --- | --- |
| `artifacts[]` | 是 | — |
| `id/name/kind` | 是 | `kind ∈ {output, intermediate}` |
| `template` | 是 | **oneOf**：`{content}`（真实模板内容，name-only 永不合法）或 `{reference}`（固定资源引用，content identity 精确） |
| `sections[]` | 否 | `{topic, questions[], completionCondition, naRule?}`：暴露真实目录/topic 与可判定完成条件 |
| `lifecycle` | 是 | `{states[], storageKind: RUN_WORKSPACE/REPOSITORY_DELIVERABLE, retentionClass}` |
| `dependencyValidity` | 否 | `CURRENT/STALE_PENDING_IMPACT/INVALIDATED/REVALIDATED` |
| `producedBy` / `consumedBy[]` | 否 | action 引用 |

### 5.7 `agentops.validation`（`validation.json`）

| 字段 | 必填 | 含义与约束 |
| --- | --- | --- |
| `validators[]` | 是 | `{id, purpose, input, output, deterministic: true}` |
| `aggregation[]` | 是 | `{id, scope(action), rule ∈ {no-voting, merge-common-cause, preserve-provenance}, arbiter(role), prohibited[]}` |
| `review[]` | 是 | `{id, lens, role, isolation: "session-isolated", barrier: true, admission.findingShape}` |
| `conformance[]` | 是 | `{id, class ∈ {positive, negative, recovery}, scenario, preconditions, expected}` |

### 5.8 资源条目（owned / referenced）

| 字段 | 必填 | 含义与约束 |
| --- | --- | --- |
| `id` | 是 | 稳定 identity |
| `kind` | 是 | `role-prompt/action-prompt/skill/template/schema/validator/agent-definition/tool/model/driver/cli/conformance/artifact-template/documentation` |
| `owner` | 是 | `owned \| referenced` |
| `path` | owned 时 | 包内相对路径；必须存在且 digest 匹配 |
| `sourceLocator` | referenced 时 | `{repository, path, ref?}`；Snapshot 中不得为浮动 alias |
| `contentIdentity` | 是 | `sha256:<64 hex>`；owned=文件真实 digest；referenced=内容可比身份 |
| `use` | 是 | 该资源被谁消费、为何 |

## 6. 语义规则（按概念）

### 6.1 Action

- 每个 Action 有明确输入、结构化结果与 responsible authority：Agent Action 指定 Role（`responsibleAuthority.kind=role`）；纯确定性 Action 指定 Runtime authority（`kind=runtime` + deterministic validator）。
- Agent 只能**提议**结果；合法性与有效性是两个不同 Gate（composition model §7）：选择合法（route/selector）由 Runtime 校验，结果有效由 result schema + gate 校验。Agent 自由文本不能绕过 Gate。

### 6.2 Transition 与 successor 闭合

- Workflow 决定合法 successor 集合；`allowedSuccessors` 必须与 graph 出边集**逐项相等**（机械校验；示例 checker 已实现该规则）。
- Planner 或任何 selector 只能在该集合内选择 next Action/route；越界 proposal 被拒绝且不推进 State。

### 6.3 Selector

- `deterministic`：Runtime 直接求值声明边/条件边（不需要 Agent）。
- `planner`：Workflow 通过一个**显式 Planner Action** 调用其 Agent，要求返回结构化 selection proposal（符合 `proposalSchema`）；Runtime 校验 proposal 属于 `allowedTargets` 后才推进。Planner Action 自身必须声明 allowed routes，且 `nonRecursive: true`（Planner 不能选择自身）。
- 同一 Planner 模式服务于**语义分支判断**：`judge.kind: planner` 的条件边用 Planner Action 的结构化分类决定走哪个分支（§4.1）。由于 Agent 输出常为非结构化文本，确定性谓词只适用于结构化状态/结果；任何需要理解语义的判断归 Planner Action。
- "Planner 决定 next action" ≠ "Planner 发明流程"：确定性流程由配置固定。

### 6.4 Budget

- budget 声明**资源维度**（闭合集 `time | tokens | context | custom`；custom 维度如 attempts/iterations 需声明 `resourceName`）+ **evaluator**：content-addressed **脚本注册点**（`schemaRef`），runtime 调用它获得预算结论。**配置中永不出现数值额度**；精确额度是 project/runtime policy，在准入时绑定（这是 Implementation Workflow 的既有实践：配置绑定注册点，runtime 调用脚本）。
- `onExhaustion ∈ {incomplete, wait, recovery}`；预算消耗进入 Workflow State（如 `attempts` 用 `sum` reducer 累积）；**耗尽永不放松 Gate**；耗尽进入声明的 terminal/wait/recovery 路径（如 `terminal:INCOMPLETE`，保留当前状态、理由与 resume Action）。
- 重试保留同一 Goal/rung 内容身份、获得新 attempt identity；无新诊断的重复失败消耗预算且不构成进展。

### 6.5 Recovery

- 语义恢复只允许三种（FPLG `FPLG-DRV-006`）：已知 `continue`、已知 `restartFromSavepoint`、或明确不确定性进入 `intervene`（durable Intervention）；`fail` 用于非重试失败。
- `noBlindReplay: true` 强制：不允许盲目重放；恢复前必须重新解析 checkpoint 绑定身份，失配 fail closed。

### 6.6 Gate

- `preconditions` / `postconditions` 为谓词；`deterministic[]` 引用确定性校验器；`freeTextBypass: "prohibited"` 强制。
- 缺失资源、非法 transition、Driver substitution、Runtime drift 一律 fail closed 或形成可见事实（composition model §14 问 11）。

### 6.7 Artifact template（一等资源）

- Output/intermediate Artifact template 必须**有真实内容或固定引用**（§5.6）；只在清单写名字不闭合（composition model §4.3/§12）。
- Template 规定产物覆盖面（topic/questions/completion/naRule）；**不承担** Workflow transition 或 Agent 提问顺序。
- Artifact 是数据；其生命周期状态（WORKING→…→SUPERSEDED）与 dependency validity（CURRENT→STALE_PENDING_IMPACT→…）遵循 `artifact-lifecycle.md` 语义：不可变版本、无原地覆盖、变更先进入待影响分析。

### 6.8 Aggregation / Review

- 并行结果**不靠多数票**；`validation.aggregation` 声明 rule/arbiter/prohibited；唯一裁定 authority 显式。
- 声称独立的 lens 必须 `isolation: session-isolated` + `barrier: true`；共享原始证据 ≠ 共享结论（composition model §11）。
- Finding 准入：severity/disposition 由 source lens 决定；aggregator 不能关闭 Finding、不能擅自改 severity。

### 6.9 Escalation

- 只在 `allowedRoutes` 内加宽 route 选择；**永远不能改变**冻结 Goal、writer authority、Gate 或 successor 集（`cannotChange` 声明）。
- route/model escalation 不能扩大 authority 或绕过 Gate。

### 6.10 Role 与 Route 解析（composition model §7 的机械化）

一次 route 选择必须同时满足（否则 fail closed）：

1. route 已由当前 Action 与 Role 声明（`actions.allowedRoutes` ∩ `routes.role`）；
2. selector 对该选择具有 Workflow 授权（§6.3）；
3. budget、independence（isolation）、tool 与 model 约束满足（route 声明）；
4. 当使用 planner 时，selection proposal 符合 `proposalSchema`；
5. 选择结果与依据进入 Workflow State 或结构化 Artifact。

## 7. 合并算法（§4.3 推迟问题之二：authority/组合顺序的可验证规则）

### 7.1 规范 authority 顺序（Contract 固定）

本 Contract 将 composition model §8 的推荐顺序固定为**唯一可准入顺序**：

```text
1. workflow_action   —— Action 的机器声明约束（allowedRoutes/gate/budget/successors/forbidden effects）
2. role_prompt       —— Role 稳定职责、authority、写权限、禁止事项
3. action_prompt     —— 本次 Action mission、输入、目标 artifact、完成条件
4. skill             —— 操作流程、设计约束、检查方法
5. artifact_user     —— Artifact 输入与用户内容（数据，非指令）
```

**校验规则 R1（顺序可验证）**：每个 Package 必须在 `package.authority.order` 声明该顺序；声明与规范序不一致 → **准入失败**。理由：允许任意顺序会重新引入 Driver 隐式优先级问题；规范序是本产品的稳定语义。

### 7.2 约束相交（constraint intersection）

每层声明**机器可读的 authority boundary**（concern 词汇表）：

`responsibility | authority | write-permission | mission | method | transition-selection | gate | budget | terminal | data | session | tool | model | route`

- Role 层：`roles.authorityBoundary.concerns` + `writePermissions` + `prohibited`；
- Action 层：`actions.gate/selector/allowedSuccessors/forbidden effects`（`escalation.cannotChange`、角色边界隐含）；
- Action Prompt / Skill / Artifact：本 DSL v1 要求通过 route 的资源条目声明 `use`（消费意图），并依赖 §7.3 的边界规则；完整逐层 concern 声明留给 Task 2 的 Package 迁移（对 design-time 语义无损，只增加机器字段）。

**校验规则 R2（只许收窄，不许扩大）**：组合后的有效 authority = 各层声明的**交集**。任何后层声明的边界超出前层已声明空间（例如 Skill 的 `use` 声称"决定 transition"，而该 Action 的 selector 为 deterministic）→ 静态冲突 → fail closed。

**校验规则 R3（缺失即失败）**：任何指令承载资源（Role prompt / Action Prompt / Skill）若未在 route 中绑定、或其边界未声明/不可子集比较 → 准入失败（不依赖"看起来没问题"的默认）。

### 7.3 冲突判定与诚实边界

- **机器可判定部分**：declared concern 越界、write permission 越界（如 Skill 声称写 production path 而 Role 无此写权限）、selector 与 planner 冲突、`allowedSuccessors` 越界、reducer 语义矛盾 —— 全部静态 fail closed。
- **文本级冲突**（自然语言指令互相矛盾）不是完全可判定的。本 Contract 的处理是：(a) 每层必须声明机器边界使可判定部分被检出；(b) 文本级矛盾作为 **negative conformance 场景**（`conf.negative.authority` 类）验证；(c) 未声明边界的资源在准入时 fail closed。**不允许**用 Driver 的隐式覆盖顺序"解决"冲突。

### 7.4 Driver 无优先级

Driver/session policy **不是 authority 层**：不能重排、覆盖或替换合并结果。合并结果是传给 Driver 的**冻结指令束**（含各资源 content identity），Driver 只能投影，不能反向取得 Workflow 控制权（composition model §5 权责表）。

### 7.5 合并结果与可复算性

合并算法是确定性的：给定 (Package, Action, Route) → 按规范序收集资源（`rolePrompt → actionPrompts[action] → skills → model/tools/driver/sessionPolicy`）→ 边界检查（R1–R3）→ 输出冻结指令束（有序资源引用 + content identities + authority 证明）。验证器可独立复算同一指令束；任何失配 fail closed。**R5**：合并不修改任何资源内容；它只产生组合顺序证明。

### 7.6 与 Package Snapshot 的关系

合并证明（authority order + boundary checks + 资源 content identities）是 Snapshot 解析闭包的一部分（`package-snapshot.schema.md` 的 "Authority order" 与 "Resolution proof" 组），准入时冻结，运行中不可变。

## 8. Owned 与 Referenced（机械规则）

| 规则 | owned | referenced |
| --- | --- | --- |
| 维护位置 | 包内；owner、版本、位置可发现 | 包外；不复制创作权 |
| 身份 | `contentIdentity == sha256(path)`，机械校验 | `sourceLocator + contentIdentity` 内容可比；Snapshot 中禁止浮动 alias（`latest`/裸名） |
| 消费 | route/artifact/template 引用其 id | 同左 |
| 失效 | 文件缺失/digest 失配 → 准入失败 | 内容身份不可解析/失配 → 准入或 recovery 显式失败 |

机械校验：`resources.owned` 的 path 存在且 digest 匹配；`resources.referenced` 的 sourceLocator 完整且 identity 可比较；任何 route/资源引用未声明 → fail closed；不允许环境默认值、CLI 当前设置或 Driver fallback 替换（composition model §4.4）。

## 9. Package Snapshot 与 Workflow State 分离（机械规则）

### 9.1 Snapshot（不可变）

准入时冻结，内容至少包括：Package identity/version/digest、Definition identity、全部 owned/referenced 资源 content identity、route bindings（Action→Role→route→Agent/Prompt/Skill/model/tool/Driver/session identity）、authority 声明与合并证明、environment requirements、resolution proof（无 ambient fallback）。**State 变化不能改写 Snapshot**；配置更新必须产生新 Snapshot，用于新 Delivery。

### 9.2 Workflow State（可变）与 Checkpoint 绑定

State 由 Selected Runtime Profile 独占写入：current Action/attempt、已完成结果、Artifact 引用、预算消耗、Wait、recovery 信息、terminal proposal。每个持久化 checkpoint 必须绑定最小集（§4.3）：`delivery, snapshot, actionAttempt, manifestRevision, gitTree`（+ 适用的 artifact versions / pending wait / budgets / last progress）。

### 9.3 机械规则

1. checkpoint 的 Snapshot identity 与当前 Delivery 的 Snapshot 不一致 → fail closed，进入显式 reconciliation/`INCOMPLETE`；
2. 恢复时重新解析所有绑定身份；缺失、损坏、同 identity 不同内容、Git tree 漂移 → fail closed；不得从"最新文件"猜测状态；
3. `UNMANAGED_SIMULATION` 可以使用相同字段形状，但只能报告 `SIMULATION_PASSED/FAILED/INCOMPLETE`，不能写入正式 State、不能发布正式 terminal（`IM-DEC-001`）。

## 10. 跨 Workflow Handoff Authority（机械规则）

### 10.1 上游（handoffs）

上游 Artifact 只在其领域内定义**事实、语义约束、未闭合义务与失效条件**。`handoffs[]` 的字段集被 schema 限制为 `semanticOnly`（`domainSemantics / invalidationConditions / semanticDependency / requiredEvidence / returnLocation / reopenCondition`），**禁止**任何下游 Action/Gate/Wait/terminal 字段（schema 层 `additionalProperties: false` + `semanticOnly: true` 强制）。上游不能用 Artifact 内容替下游定义流程。

### 10.2 下游（consumedHandoffs）

下游必须保留上游语义，并拥有把义务分类与映射到自身生命周期的 authority。`consumedHandoffs[]` 声明：`classification / owner / affectedLocal / preservesSemantics{semanticDependency, reopenCondition} / mustNotWeaken: true`。

### 10.3 机械规则

1. **字节保真**：`preservesSemantics` 的两个字段必须与上游 handoff 的对应字段**逐字节相等**（上游包可解析时校验）；不等 → fail closed；
2. 下游不能静默弱化、改写或冒充已满足义务；下游结果若推翻冻结的上游语义 → 当前 Delivery 停止并请求新上游 Artifact 版本；
3. 具体义务类别/字段/路由由消费它的 Package 决定，不由本 Contract 统一枚举（composition model §4.6）。

## 11. 版本兼容策略

### 11.1 版本轴

| 轴 | 规则 |
| --- | --- |
| Package 版本 | semver `MAJOR.MINOR.PATCH` |
| Definition 版本 | 独立版本身份（`workflow.version`），与 Package 版本解耦（composition model §4.1） |
| Contract 版本 | `agentops.workflow-dsl@X.Y.Z`；本文件 = `0.1.0`（pre-release） |
| Snapshot | 绑定全部精确版本 + content identity；一个 Delivery 只绑一个 Snapshot |

### 11.2 兼容类别

| 变更 | 类别 | 规则 |
| --- | --- | --- |
| 新增可选字段/资源、新增 Action/node（不改既有语义）、文本修正 | MINOR/PATCH，向后兼容 | 既有 Snapshot/Delivery 不受影响 |
| 改变 Action 语义、增删/改变 transition/gate/terminal、改变 reducer 语义、改变 authority 顺序或边界 | **MAJOR（语义变更）** | 必须新 Definition 版本 + 新 Package major + 新 Snapshot；只用于新 Delivery |
| state 新增字段（带默认 reducer） | 兼容 | — |
| state 移除字段 / 改变 reducer 行为 | 破坏性 | MAJOR |
| 同 identity 不同内容（digest 失配） | 禁止 | fail closed（FPLG `FPLG-DEC-002`、`EE-AC-012`） |
| `latest`/裸名选择 | 仅解析期 | 在 Manifest 创建前解析为 `exactVersion`；alias 移动只影响后续 Delivery（agent-architecture §4 不变量 14） |

### 11.3 Conformance 与版本

一个 Definition 声称 conforms 到 `agentops.workflow-dsl@X.Y.Z` 必须：通过该版本 schema 校验 + 通过闭包/合并/§8–§10 机械规则 + 通过 conformance corpus；Runtime Profile 声称 conforms 必须：把 Definition 编译为 Implementation 而不改变 Action/transition/Gate/terminal 语义、校验 Snapshot binding、通过 corpus、不泄漏原生 ID（§12）。

## 12. Conformance 要求

### 12.1 三级 conformance

| 级 | 对象 | 证据 |
| --- | --- | --- |
| Document conformance | 单个 DSL 文档 | JSON Schema 校验（`system-contracts/workflow-dsl/schemas/`）+ `additionalProperties: false` 闭合 |
| Package conformance | 整个 Package | 文档级 + §3.1 闭包 + §7 合并证明 + §8–§10 机械规则 + **conformance corpus**（positive/negative/recovery 场景，如 `system-contracts/workflow-dsl/examples/minimal/validation.json` 的 6 个场景） |
| Implementation/Runtime conformance | Runtime Profile / 编译层 | 编译不改变 Definition 语义、Snapshot binding 校验、通过 corpus、禁止字段扫描、无原生 ID 泄漏；**schema/registry/fixtures/验证证据发布前不得声称 physical conformance** |

### 12.2 机械校验清单（示例 checker 已实现的核心项）

1. JSON 可解析、kind/schemaVersion 匹配；
2. 所有引用（documents、owned paths、action/role/route/wait/budget/recovery/validator/artifact/resource ids）可解析；
3. `allowedSuccessors` == graph 出边集；node 不同时拥有静态出边与条件边；
4. reducer / predicate op / authority order / session freshness / isolation 等词汇闭合；
5. owned digest、definition digest 匹配；referenced sourceLocator 完整；
6. 禁止物理字段扫描（附录 C）：Definition 中不得出现 LangGraph/Driver 物理 token。

### 12.3 Conformance corpus

每个 Package 至少声明：合法主路径（positive）、非法 transition / 越权 / 缺失资源 / authority 越界（negative）、Wait/resume 关联、预算耗尽、崩溃恢复、取消（recovery）。corpus 场景是 Package 的一部分（`validation.conformance[]`），运行时/模拟器必须可执行。

### 12.4 Runtime 能力要求

任何声称 conformance 的 Runtime Profile 必须实现 DSL 能声明的每项能力；两个 first-party Definition 已经使用了其中一部分。conforming Runtime 必须支持：

| DSL 构造 | 必需的 Runtime 能力 |
| --- | --- |
| 条件边，`judge.kind: state` | 对 Workflow State 确定性求值闭合词汇谓词 |
| 条件边，`judge.kind: planner` | 调度声明的 Planner Action 的 Agent 对（可能非结构化的）上下文做语义判断；校验返回的结构化分类符合 `resultSchema`；再按 `conditions[].when` 对该分类选分支；目标必须在源 Action 的 `allowedSuccessors` 内 |
| 并行执行（`execution.mode: parallel`） | 调度全部 required 分支（session-isolated 或 shared），强制执行 `barrier`，再应用声明的 `join`（`all` 或 `aggregator` action）；分支隔离在 barrier 关闭前必须成立 |
| runtime-authority action（`responsibleAuthority.kind: runtime`） | 直接执行声明的确定性 validator——无 Agent 会话、prompt、model 或 route |
| budgets（`budgets[]`） | 调用 `evaluator` 脚本注册点（content-addressed）获得预算结论；按 `onExhaustion` 进入声明的 terminal/wait/recovery 路径；耗尽永不放松 Gate |
| planner selector（`selector.kind: planner`） | 推进前校验结构化 selection proposal 符合 `proposalSchema` 且在 `allowedTargets` 内 |
| waits / checkpoints / terminal settlement | durable 关联 resume、最小 checkpoint 绑定（§9.2）、checkpointed terminal proposal（既有 FPLG 范围） |
| 合并算法（R1–R3）与 route 解析 | 从 Snapshot 复算冻结指令束；任何失配拒绝 |

Definition 声明了但 Runtime 无法兑现的能力，在准入/激活时是硬失败（fail closed），绝不静默降级。此清单是 FPLG Host（`FPLG-IMP-002` / `FPLG-IMP-005`）与 Host 消费 gap `FPLG-EXT-003.1` 的可执行契约。

**实现归属。** 这些能力的第一方实现是 FPLG（LangGraph Workflow Host）：DSL 编译为 LangGraph 语义，Host 拥有调度、barrier/join、判断分发、budget evaluator 调用与 route 解析。DSH 是当前宿主 Adapter；其自带 workflow 能力不承载 Workflow 编排语义——它正是 FPLG 要替换的能力——因此任何 Host/Adapter 原生的 workflow 能力都不是本 Contract 的一部分。

## 13. §14 验收第 12 问：换 Runtime 不改变 Definition/Package/Snapshot 语义

> "如果替换 LangGraph 或某个 Driver，哪些 Contract、Artifact 和 Workflow 语义仍保持不变？" —— **回答：是，全部 Definition/Package/Snapshot 语义保持不变。**

| 层 | 是否受 Runtime 替换影响 | 原因 |
| --- | --- | --- |
| Workflow Definition（graph/state/transition/Action/Gate/budget/Wait/recovery/terminal/route/artifact/handoff） | **不变** | DSL 只含语义字段与闭合词汇，零 LangGraph/Driver 物理字段（附录 C 扫描强制） |
| Package（index/owned/referenced/authority/合并证明） | **不变** | 资源与身份闭包不引用 Runtime |
| Package Snapshot | **不变** | 准入时冻结的 identity-and-relationship closure 与 Runtime 无关 |
| Workflow State 语义（分离、checkpoint 最小绑定、Wait/resume、terminal settlement 规则） | **不变** | Contract 声明语义；物理 checkpoint/thread/interrupt ID 是 Runtime 私有 |
| Workflow Implementation | **变** | 编译产物（如 LangGraph `StateGraph`）随 Runtime 更换重新编译 |
| Driver 投影 | **变** | 冻结指令束的投影方式随 Driver 更换 |

替换的边界条件：新 Runtime 必须 conforms（§12.1 第三级）—— 编译不改变 Definition 语义、接受同一 Snapshot binding、不引入 ambient fallback。因此替换 LangGraph 或某个 Driver 不需要改 Definition、Package 或 Snapshot（composition model §13："可以替换实现，而不改变 Workflow Package、Snapshot 和 State 的概念关系"）。

## 14. 最小 Definition 示例

完整示例位于 [`system-contracts/workflow-dsl/examples/minimal/`](../../../system-contracts/workflow-dsl/examples/minimal/)（`package.json` + 6 个文档 + 10 个 owned 资源文件），并已通过机械闭包校验（JSON、引用解析、词汇闭合、`allowedSuccessors` == 出边集、digest 匹配、无 LangGraph/Driver 物理字段）。示例覆盖：

- **graph**：start → `node.intake` → `node.review`（并行双 lens）→ `node.aggregate`（条件边）→ `node.finalize` / `node.review`（re-review 环）/ `terminal:FAILED`；
- **state + reducer**：`status`(overwrite)、`context`(merge)、`findings`(append)、`reviewIterations`(sum)、`aggregation`(overwrite)；
- **conditional edge**：`cedge.aggregate` 三个谓词 + default；
- **checkpoint**：`node.intake` 声明最小绑定集；
- **Wait/recovery**：`wait.user-confirm`（user，resume=intake）、`wait.external-obligation`（external）；`recovery.default`(continue)、`recovery.review-restart`(restartFromSavepoint)、`recovery.intervene`；
- **terminal**：`SUCCESS/FAILED/INCOMPLETE/CANCELLED`；
- **Role route**：3 个 Role、5 条 route（含 blackbox/whitebox 两条隔离 route + parallel execution + aggregator join）；
- **owned/referenced**：10 个 owned 资源（真实 digest）+ 5 个 referenced 资源（sourceLocator + 内容可比 identity）；
- **authority**：规范序 + fail-closed；handoffs 双向（上游 `handoff.verification` + 下游 `consume.design-obligation`）。

示例中 `workflow.json` 的 graph 与 `actions.json` 的 `allowedSuccessors` 的逐项相等关系由 checker 验证 —— 这是 §6.2"successor 闭合"的机械证明。

## 15. 附录 A：Implementation workflow.md → DSL 无损映射

对照 `workflow-package/implementation/workflow.md`（Action/transition/Gate/Wait/预算/恢复/terminal 全部可无损表达）：

| workflow.md 元素 | DSL 表达 |
| --- | --- |
| IM-01..IM-18 Action Catalog（§4） | `actions.json` 每个 IM-* 一个 action：input/result schema、responsibleAuthority（role，如 Goal Facilitator）、allowedRoutes、gate、budget、waitPolicy、recovery |
| Transition Authority 表（§3，"图示不得覆盖本表"） | `workflow.json` 的 edges/conditionalEdges：每行"valid condition/result → successor"是一个带 condition 的边或条件边分支；确定性条件 = 谓词 |
| IM-01/IM-02 等 "fact-consuming Action → IM-01R" | 边 + condition（如缺事实 → `IM-01R`）；IM-01R 的 "return only to recorded Action" = 边目标精确 + Wait/external 关联 |
| IM-06 "deterministic Workflow selector" | `selector: {kind: "deterministic"}`（无 Planner Agent） |
| Planner/语义选择（composition model §6） | `selector: {kind: "planner", action, proposalSchema, allowedTargets, nonRecursive}` |
| `WAITING_FOR_USER` / `WAITING_FOR_EXTERNAL`（§10） | `waits[]` kind=user/external + `resumeAction` 精确 + correlation stale/duplicate 拒绝 |
| 预算耗尽 → 可恢复 `INCOMPLETE`（§10） | `budgets[]` `onExhaustion: "incomplete"` → `terminal:INCOMPLETE`（保留状态，永不放松 Gate） |
| `INCOMPLETE/CANCELLED/FAILED/VERIFIED_IMPLEMENTATION_READY`（§1） | `graph.terminals[]`（success=VERIFIED_IMPLEMENTATION_READY 等）；终态先 checkpointed proposal |
| IM-12 双 lens 并行隔离 + barrier（§4） | `action.review` 式：`execution.mode: "parallel"` + branches(isolation: session-isolated) + join(aggregator, barrier) |
| IM-13 Aggregation（§4） | `validation.aggregation`：preserve-provenance、arbiter、prohibited（voting/severity/finding closure） |
| Finding severity/disposition（§7） | `validation.review` admission（findingShape）+ `validation.validators` 校验 source-lens-valid disposition |
| IM-11/IM-16/IM-18 CLI 确定性 Gate（§4、§12） | `responsibleAuthority: {kind: "runtime", validator}` + `gate.deterministic[]` 引用 Package CLI 校验器 |
| Git/commit 边界（§5、§11、§16） | gate postconditions + terminal validation + `escalation.cannotChange`；无默认 publish/merge |
| Artifact lifecycle/dependency validity（§9、artifact-lifecycle.md） | `artifacts.json` lifecycle + dependencyValidity + retentionClass；checkpoint bindings 含 artifactVersions/gitTree |
| 上游义务分类（§2） | `consumedHandoffs[]`：classification/owner/affectedLocal/preservesSemantics/mustNotWeaken |
| 停止 on design-semantic change（§1、§10） | §10.3 规则：推翻冻结上游语义 → 停止 Delivery，请求新版本 |
| Route Invariants（routes.md） | routes schema：managedProjection required、writer 隔离、session freshness/isolation、escalationAllowed |

## 16. 附录 B：System Design workflow.md → DSL 无损映射

对照 `workflow-package/system-design/workflow.md`：

| workflow.md 元素 | DSL 表达 |
| --- | --- |
| SD-01..SD-15 Action Catalog（§4） | `actions.json` 每个 SD-* 一个 action |
| SD-01R 只返回 recorded requester（§4） | Wait/external + resume_lens 精确关联（边目标 + correlation） |
| SD-03 "Runtime 持久化 wait、验证 identity、冻结 artifact"（§4） | `wait.user-confirm` + gate postconditions（冻结证明） |
| SD-06/SD-12 `WAITING_FOR_SPIKE`（§4、§11） | `waits[]` kind=spike + correlation（exact request identity/content digest）+ expiry policy + resumeAction |
| SD-09 三 lens 并行隔离 + barrier（§4、§9） | `execution.mode: "parallel"` 三分支（session-isolated）+ join(aggregator=SD-10, barrier) |
| SD-10 路由（evidence→SD-01R、Brief→SD-11H、skeleton→SD-04、draft→SD-11、冲突→SD-11H） | `conditionalEdges` 谓词（对 aggregation 结构化结果的 routing 字段）+ 边精确目标 |
| SD-11H Human Decision Admission（§8 六条件） | `waits[]` kind=user + resumeSchema（Decision Record schema）+ gate preconditions（证据耗尽、方向冲突、owner 正确、材料完整） |
| SD-14/SD-15 "Runtime deterministic validator; no Agent Role"（§4） | `responsibleAuthority: {kind: "runtime", validator}`；`validators[]` 引用 |
| SD-11 非无条件返回 SD-09（return_action 校验） | edges/conditionalEdges 精确目标 + `allowedSuccessors` 相等校验 |
| Unknown Classification（§5 CONFIRMED/DERIVABLE/DESIGN_EXPLORATION/TO_BE_MEASURED/DEFERRED/USER_DECISION_REQUIRED/BLOCKED） | state 字段（枚举值）+ 谓词条件边 + waits（USER_DECISION_REQUIRED→user wait；BLOCKED→external wait/incomplete） |
| 预算（§10）与 INCOMPLETE 记录 | `budgets[]` + `terminal:INCOMPLETE` 保留 resume Action/所需输入 |
| Wait expiry 语义（§11） | waits.expiry（renewal/INCOMPLETE；expiry 不是成功/静默取消） |
| 下游义务 handoff（§6、§12） | `handoffs[]`（semanticOnly；owner/evidence/return/reopen 完整）+ 下游 `consumedHandoffs[]` 字节保真 |
| 会话与 Review 规则（§9） | routes.sessionPolicy（fresh-per-episode/isolated）+ roles.independence（barrier） |
| SD-15 cleanup Gate（§4） | terminal validation + gate.deterministic（无中间文件、Git 无 workflow 中间物） |

## 17. 附录 C：禁止的物理字段与扫描规则

以下 token **不得**出现在任何 Definition 文档（字段名或字符串值）中。扫描规则：对文档全部字符串小写后做子串匹配，命中即 fail closed。它们只允许存在于 Implementation/编译层。

| 类别 | 禁止 token（示例，非穷尽） |
| --- | --- |
| LangGraph 类/API | `stategraph`, `langgraph.json`, `langgraph`, `annotations.root`, `add_messages`, `last_value`, `send api`, `memorysaver`, `sqlitesaver`, `checkpoint_id`, `thread_id`, `interrupt(` |
| Driver 原生 | `codex`, `copilot`（作为字段身份/值；正文描述性提及不在此列——扫描对象是机器字段与资源身份） |
| 原生 checkpoint/thread | 任何以原生 checkpoint/thread 身份充当产品 identity 的字段 |

规则：Definition/Package/Snapshot 中**零**物理 token；`schemaVersion` 只引用 `agentops.workflow-dsl@X.Y.Z`；Runtime 私有身份（原生 checkpoint ID、thread ID、会话句柄）永远不进入 Manifest/Evidence（agent-architecture §4 不变量 9、12）。

## 18. 变更与演进

- 本 Contract 是 DSL 面的**定义源头**：Task 2（`workflow-machine-definition`）把两个 first-party Workflow 迁移为符合本 DSL 的机器可读 Definition，语义与 design-time 文档保持一致（"使文档反向迁就 Runtime 私有格式"是禁止项，composition model §9）。
- 物理表示、graph 词汇、reducer 词汇、谓词 op、authority 顺序的任何变化都必须走 Contract revision（`agentops.workflow-dsl@X.Y.Z`），不能以 Package 内字段漂移实现。
- 动态 fan-out、更多 selector 类型、多租户/安全机制属于明确排除项或候选扩展，需要新的 Contract 决策后才能进入。

### 18.1 已知限制（Task 2 迁移中验证；决策记录：`gap-review-decisions.md`）

| 限制 | 状态 |
| --- | --- |
| 并行 Action 无法表达 per-branch role（单一 `responsibleAuthority`）；SD-09 三 lens 用 nominal role + `validation.review`/branch routes 逐 lens 强制 | 接受：并行是 Runtime 发起的 action 层编排（`execution.mode: parallel` 是 v1；第一方实现是 FPLG/LangGraph Workflow Host——调度、barrier、join、分支隔离；任何 Host/Adapter 原生的 workflow 能力不得进入 Contract）；单 action 多 role 表达不做；**多 action 并发**（graph 级并行）是候选扩展 |
| 动态分支子集激活（如 SD-09 复检只跑失效 lens） | 接受为 Runtime 调度细节，非 workflow 语义 |
| Wait resume 目标固定（`wait.resumeAction`）；按"记录的 resume_action"路由的逻辑 wait 表达为每触发 Action 一个 wait | 语义等价；不改 DSL |

### 18.2 修订记录（0.1.0 REVIEW_CANDIDATE，冻结前）

按 `gap-review-decisions.md`：budget 改为资源维度 + evaluator 注册点（无数值额度）；Runtime authority 的 Action 不再声明 `allowedRoutes`；条件边新增 `judge` 声明（state 谓词或 Planner Action 判断）。Definition 与 checker 已同步更新；全部闭包检查 PASS。冻结目标 `1.0.0`。
