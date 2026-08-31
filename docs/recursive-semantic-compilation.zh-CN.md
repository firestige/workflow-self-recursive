# 递归语义编译

[English](recursive-semantic-compilation.md) | 中文

> **状态：** Owner 已在 [#159](https://github.com/firestige/workflow-self-recursive/issues/159) 中确认递归语义编译是基础文档原则。本文的详细映射仍是工作中的架构对齐：它组织现有产品原则，但本身不修改已发布 Contract、不证明 conformance，也不声称新增了 Runtime 能力。英文是语义正文，本文是中文跟踪 companion。

## 1. 目的

workflow-self-recursive 已经在 Workflow composition、Execution、Runner、Evidence 与 Evolution 中遵循同一种结构，但这套结构主要以分散的不变量表达：exact binding、immutable Snapshot、bounded Planner、typed result、Runner authority、fail-closed compilation、non-controlling Evidence、replaceable substrate 与 versioned Evolution。

本文用一个基础模型统一这些原则：

> **LLM 把未结构化的意图、上下文与证据提升为类型化语义表示；确定性系统负责校验、绑定、降级、执行，并将这些语义纳入权威 Runtime State。已提交的执行产生有界事实，这些事实作为独立 Evidence 被保留，并可用于合成和资格评定下一版本 Workflow。**

简写为：

> **语义上提，确定性下沉，证据驱动版本递归。**

这个模型称为**递归语义编译**。

它是一套设计评审视角。现有 Contract 与 owner invariant 仍是 conformance surface。任何 compiler-shaped type、重命名或重构，都需要针对具体 representation/authority mismatch 的独立已采纳 proposal。

## 2. 语义编译

当系统需要解释无法由固定规则穷举的含义时，LLM 最有价值。因此，它的架构产物不一定是最终界面、视频、图表、代码变更或 Workflow State，而是一个把预期含义显式化到足以由普通软件校验和物化的语义 proposal。

```text
未结构化意图 / 上下文 / 证据
        ↓ 概率性语义处理
类型化语义 proposal
        ↓ 确定性校验 / 绑定 / 提交
可执行表示或已提交的 Runtime 记录
```

类型化表示不只是一种序列化格式。它跨边界携带已声明的含义、身份、authority、compatibility 与 validation rule。JSON、YAML 或内存类型都可以作为其物理表示，但这些编码本身都不拥有语义。

确定性代码拥有那些一旦被概率性重新解释就会产生危害的工作：

- exact identity 与 resource binding；
- schema、closure、capability、policy 与 Gate validation；
- allowed control transition 与 budget enforcement；
- scheduling、persistence、recovery 与 commit ordering；
- Artifact 与 Workflow State update；
- factual Observation mapping；
- candidate 资格评定与 publication。

下层只能通过已声明 default、owner 定义的确定性 derivation，或在显式 allowed set 中选择来消解问题。它还可以绑定 exact identity、拒绝不完整 proposal，或缩小 allowed choice set；但不得发明、修复或重新解释所属上层从未声明的语义。

## 3. 带概率性语义效应的确定性 Runtime

Agent Workflow 并非完全确定性：已声明的 Action 可以调用 LLM。WSR 把这些调用视为确定性控制系统中显式、受限的概率性语义效应。

```text
权威 Workflow State
        ↓ 已声明的 Action / decision site
managed Agent invocation
        ↓
typed result proposal
        ↓ schema / Gate / allowed-set validation
确定性 commit 或 typed rejection
        ↓
下一权威 Workflow State
```

模型可以提出 selection、Finding、implementation result、Artifact 或 terminal outcome。Proposal 不是权威 Runtime State；其中的语义主张不会仅因被提交就成为外部真相，commit 只建立系统接受的记录。只有 owner 校验并提交后，proposal 才能进入权威 Runtime State。

由此得到一个核心区分：

> **概率处理器提出语义内容，确定性 owner 决定什么可以进入权威 Runtime State。**

Runner authority、Planner boundedness、typed Action result 与禁止 free-text 绕过 Gate，都是这一区分的推论。

## 4. 同一内核在三个尺度递归出现

递归语义编译不只是从 Workflow Package 到 executable graph 的路径。同一个“语义 proposal → 确定性物化”内核出现在三个尺度。

### 4.1 Workflow 创作

```text
人类意图
    ↓ 语义解释
Workflow 语义表示
    ↓ resolution / admission / compilation
可执行 Workflow
```

人可以直接创作该表示，Agent 也可以辅助合成。无论哪种情况，被执行的 authority 都是版本化、已校验的表示，而不是临时模型记忆或 prose。

### 4.2 Action 执行

```text
Action 上下文
    ↓ Agent 语义处理
typed ActionResult / Artifact proposal
    ↓ Runtime validation / commit
Workflow State 与 Artifact 事实
```

这一尺度防止 Agent-to-Agent prose 静默成为控制权威。面向人的 prose 仍然可以作为输出，但如果后续控制、validation、Evidence 或 Evolution 依赖其中的机器含义，它就必须通过 typed result 跨越边界。

### 4.3 Workflow 演进

```text
版本 N 的 Evidence
    ↓ 语义分析 / 合成
typed Workflow change proposal
    ↓ validation / 资格评定 / publication
Workflow 版本 N+1
```

因此，Self-recursion 不是 active Workflow 改写自己，而是当一个不可变版本的事实成为后续不可变版本的语义合成与确定性资格评定输入时，同一种架构再次出现。

## 5. 当前与计划概念的解释性映射

该模型澄清现有对象，而不要求把它们改成 compiler 术语。

| 架构角色 | WSR 概念 | 本文中的状态 | 含义 |
| --- | --- | --- | --- |
| 语义程序 | Workflow Definition 与 Package 闭合关系 | 已确立架构；exact shape 由 Contract 版本化 | 声明业务、控制、资源、Artifact、validation 与 authority 含义 |
| 精确版本材料 | Workflow Package / Snapshot | 当前实现与 Contract | 冻结已声明内容及其闭包与内容身份 |
| admitted/bound representation | Delivery Manifest 与 `RunnerActivationContext` | 当前实现；exact field 由 Contract 版本化 | 把 exact Package 绑定到 Delivery、resource、capability、workspace、Provider 与 model identity |
| backend lowering | `CompiledGraphActivation` | 当前实现 | Interpreter 产生的 minimal executable activation；当前包含 `LangGraphExecutionPlan`，因此并非 backend-neutral |
| 运行物化 | Runner、Workflow Host、Managed Agent Invocation 与 Custody | 当前架构与实现，受各 Module conformance status 约束 | 在保持 unique-writer authority 的前提下执行已声明控制和概率性效应点 |
| 语义效应结果 | ActionResult、Artifact、Finding、selection 或 terminal proposal | 现有 design/Contract family；enforcement 因 Workflow/result type 而异 | 把模型产生的含义带到确定性 validation/commit boundary |
| 认识论记录 | Observation 与 Evidence factual projection | 当前架构与实现，受已发布 profile coverage 约束 | 记录 committed execution 的有界事实，但不控制该 Delivery |
| 跨版本语义 proposal | Workflow revision proposal | 计划中的未来能力 | 针对 exact base version 表达候选变更；它不是 active Workflow authority |

当 *IR* 强调显式语义与确定性 transformation 时，它是有用的词；但它不要求新增公共 `WorkflowIR` 对象。在真实 mismatch 证明必须拆分以前，现有 Workflow Package 可以继续作为 semantic representation。

## 6. Evidence 是认识论边界

Execution 拥有 Delivery 的已提交 operational record。Evidence 拥有产品可以从 accepted Observation 支持的历史主张，并始终受显式 provenance、completeness、availability、compatibility 与 producer-correctness 限制。

```text
Agent proposal
    ↓ validation and commit
Runtime fact
    ↓ bounded、one-way Observation
Evidence fact / projection
```

因此，Evidence 不解析隐藏推理，不从 prose 推断缺失的 Runtime State，不把 absence 当作 zero，也不返回控制同一 Delivery 的结果。它的独立性不只是故障隔离，更是 operational truth 与历史运行知识之间的分离。

这种分离让后续 Evaluation 与 Evolution 可以消费事实，而不会成为另一个 Execution truth writer。

## 7. Compilation 与 Evolution 是不同的 transformation

**Compilation** 作用于一个固定语义版本。它的设计义务是保留已声明 Contract 及其 control、dataflow、binding、authority 与 validation invariant，否则拒绝输入。本文不声称已经给出形式化 observational-equivalence proof。

**Evolution** 可以主动改变 Role allocation、control structure、Route resource、Prompt 或 Skill 内容、model-binding policy、budget 或 result contract。因此，它不天然是 semantics-preserving compiler optimization，而是**证据驱动的语义再合成（evidence-guided semantic re-synthesis）**。

```text
Workflow N
    ↓ Execution
Evidence N
    ↓ evaluation 与语义再合成
针对 exact N 的 typed delta
    ↓ 资格评定与 publication
Workflow N+1
```

Evolution 输出是新版本 proposal，不是修改 active Snapshot、历史 Delivery 或 accepted Evidence 的许可。Static validation、replay、benchmark、review 或 controlled experiment 可以按 change class 对 proposal 进行资格评定；publication 仍是显式 authority boundary。

某些未来 transformation 可以被证明 semantics-preserving；另一些则有意改变行为以改善被评价的结果。设计必须区分这些类别，而不是把每种变化都称为 optimization pass。

## 8. 熵的局部化与成本

目标不是消灭 LLM，而是只为不可约的语义不确定性支付概率计算成本，并把可重复、可形式化的工作下沉到确定性结构。

例如：

- 用 Workflow State 保存全局阶段和 allowed successor，而不是依赖 Leader memory；
- 用 typed Artifact slice 替代 prose handoff；
- 只加载 Action 声明的 Prompt、Skill 与 input dependency；
- 在显式条件足够时使用 deterministic selector；
- 把更强模型留给 high-entropy decision 与 bounded escalation；
- 在后续 Workflow 版本中，把反复稳定的语义选择变成 proposed deterministic rule。

因此，长期优化目标是：

> **在保持质量、authority 与完成语义的前提下，最小化概率表面积。**

更少 token 或更低成本本身并不充分。删除 required Review、隐藏 Finding 或截断必要上下文，可能降低某个成本指标，却让 Workflow 变差。Evidence 与资格评定必须保留独立的质量和 authority constraint。

## 9. 基础原则

1. **Semantic lifting** — 模型把未结构化输入解释为显式、类型化、可评审的含义。
2. **Proposal before authority** — 模型输出在所属确定性边界校验并 commit 前只是 proposal。
3. **No semantic invention below the owner** — 下层可以 binding、validation、lowering 与 execution，但不得从 ambient state 或 prose 修复缺失含义。
4. **Deterministic realization** — State transition、Gate、budget、persistence、recovery 与 publication 是确定性 owner 职责。
5. **Typed semantic boundaries** — 当后续行为依赖跨边界机器含义时，该含义必须显式表示。
6. **Epistemic separation** — Evidence 保留由 accepted Observation 支持并携带显式认识限制的主张，永不成为该 execution 的控制依赖。
7. **Version recursion** — Evolution 创建新 candidate version，永不改写 active authority 或 accepted historical record。
8. **Semantic/backend separation** — 产品含义位于可替换 Host 与 Provider substrate 之上。
9. **Entropy localization** — 概率计算只用于已声明的 high-entropy semantic work；可形式化的重复工作可以下沉到确定性结构。

## 10. 词汇边界

该理论不合并三种有时都被称为 routing 的含义：

| 术语 | 职责 | 当前 authority |
| --- | --- | --- |
| Control-flow selector | 选择 allowed next Action 或 branch | Workflow 声明集合；Runtime 执行或校验选择 |
| Workflow Route | 把 Role 绑定到 Action prompt、Skill、tool、Driver、capability、access 与 session policy | Workflow Package |
| Model-binding policy | 把 Role 绑定到 exact Agent Provider / LLM route / model | DSL 2.0 候选中属于 Repository 与 Execution policy；Admission 冻结结果 |

同样，semantic representation、physical encoding、backend plan、Runtime State 与 Evidence projection 彼此相关但并不相同。便利的共同词汇不能抹掉它们的 authority 边界。

## 11. 对设计评审的推论

未来每一项 WSR 设计都应能够回答：

1. 哪些未结构化含义进入该边界？如果没有，也要明确。
2. 哪种 semantic representation 离开该边界？
3. 结果是 proposal、admitted binding、executable plan，还是 committed authoritative record？
4. 哪个 owner 校验并 commit 它？
5. 下层能否发明、修复或重新解释缺失含义？
6. 哪些 operation 是概率性的？为什么它们尚不能确定性执行？
7. 哪个 exact version、input、binding、provider/model attribution 与 lineage 使结果可追踪、可评估重放？Exact identity 不表示模型输出可以逐 bit 复现。
8. 哪些事实可以被观察而不成为控制依赖？
9. 如果组件演进 Workflow，它如何创建并资格评定新版本，而不是修改当前 authority？

这些问题是架构评审标准，不是引入 generic compiler framework 的命令。

## 12. 非目标

这条原则本身不提议：

- 重命名 Workflow Package、`RunnerActivationContext`、Interpreter 或 `CompiledGraphActivation`；
- 引入公共 `SourceIR`、`BoundIR` 或 `ExecutableIR` 类型；
- 替换 LangGraph 或增加一个推测性的第二 Host backend；
- 声称当前 `CompiledGraphActivation` 已经 backend-neutral；
- 把每个面向人的输出都变成复杂 schema；
- 允许 Evidence 控制 Execution；
- 允许 Evolution 修改 active Snapshot 或 accepted history；
- 暴露私有 chain-of-thought；
- 在没有确定性 validation 时把模型输出当作权威；
- 仅仅为了接近 compiler 术语而实施代码重构。

目标是让现有架构足够一致，使后续变化都可以由同一套共同模型评判。
