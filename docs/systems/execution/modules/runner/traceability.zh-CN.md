# Runner 追踪与实现记录

## 1. 状态与归属

| 字段 | 值 |
| --- | --- |
| 状态 | `NON_NORMATIVE_SUPPORTING_RECORD` |
| 语义权威 | [英文 Runner 模块详细设计](runner.md)，仅随父级 [Execution System candidate](../../project-execution-system.md) 一同提升后生效 |
| System 层级 | Runner 是 Execution module M02；不是 System、subsystem，也不是另一 M02 module 后面的实现 |
| Companion | 本文是英文 [traceability.md](traceability.md) 的非规范跟踪翻译 |
| Provenance | Repository history；本文不对无法解析的外部 commit 作权威声明 |

Execution 拥有 Core boundary 与 M01–M03 的含义。Runner 拥有 M02 行为及其私有 submodule。本文不拥有行为，只索引设计 ID、实现选择、证据状态与开放工作。

当前架构只有一个 Runner，不存在 Runner-selection abstraction。历史 TypeScript 名称 `ExecutionRuntimeAdapter` 只表示当前 Core-to-Runner seam。未来若确实需要多个 Runner 实现，才可以把 M02 提升为 Runner 抽象，并且每个具体实现必须使用不同名称。

## 2. 当前实现选择

下列内容是可替换实现选择，不是稳定架构身份或 conformance 声明。

| Concern | 当前选择 |
| --- | --- |
| Workflow Host | LangGraph `1.4.12`、`@langchain/core` `1.2.9` |
| Checkpoint storage | `@langchain/langgraph-checkpoint-sqlite` `1.0.4`、`better-sqlite3` `12.11.1` |
| Managed Agent Provider | DeepSeek Harness `0.1.1-rc.2` |
| Validation | Zod `4.2.0` |
| Workspace/publication | Git `2.52.0` |

## 3. ID namespace 与归属

| ID family | 含义 |
| --- | --- |
| `runner.driver.001..010` | design driver |
| `runner.scenario.01..12` | scenario |
| `runner.flow.001..010` | end-to-end flow 及 step ID |
| `runner.view.001..011` | bounded data view |
| `runner.interface.001..005` | private capability interface |
| `runner.acceptance.001..014` | acceptance register |
| `runner.decision.001..015` | decision register |
| `runner.open-work.003.1..4`、`.006..013` | 剩余证据与实现工作 |
| `runner.submodule.001..005` | Runner 内部 submodule |
| `runner.settlement.001` | immutable terminal settlement record |

父级 `execution.scenario.*`、`execution.fixture.*`、`execution.decision.*`、`execution.open-work.*` 与 `execution.module.*` 属于 Execution System Design。原 Runner-level module ID family 因模糊 M02-to-submodule 层级而退役。

### Runner submodule

| ID | Submodule | 详细设计 |
| --- | --- | --- |
| `runner.submodule.001` | Lifecycle Coordinator | [lifecycle-coordinator.zh-CN.md](lifecycle-coordinator.zh-CN.md) |
| `runner.submodule.002` | Workflow Host | [workflow-host.zh-CN.md](workflow-host.zh-CN.md) |
| `runner.submodule.003` | Managed Agent Invocation | [managed-agent-invocation.zh-CN.md](managed-agent-invocation.zh-CN.md) |
| `runner.submodule.004` | Custody | [custody.zh-CN.md](custody.zh-CN.md) |
| `runner.submodule.005` | Interpreter | [interpreter.zh-CN.md](interpreter.zh-CN.md) |

### Design driver 定义

| ID | Driver |
| --- | --- |
| `runner.driver.001` | 独立 qualification 当前 Runner 实现 |
| `runner.driver.002` | Runner boundary 上 immutable admitted Delivery binding |
| `runner.driver.003` | typed、statically wired Provider integration |
| `runner.driver.004` | serialized workspace mutation safety |
| `runner.driver.005` | 使用 durable control truth，而非推断 progress |
| `runner.driver.006` | semantic recovery，且不 blind replay |
| `runner.driver.007` | owner-scoped retirement，并保留 settlement evidence |
| `runner.driver.008` | factual、minimized、non-controlling Observation |
| `runner.driver.009` | 适合当前 preview 的 local operation |
| `runner.driver.010` | 最小合理 deep structure：五个 private submodule |

### Scenario、flow 与 view 落点图

| Concern | Scenario | Flow | View | Interface |
| --- | --- | --- | --- | --- |
| authority 与 qualification | `runner.scenario.01` | `runner.flow.001` | `runner.view.001` | `runner.interface.001` |
| activation 与 version binding | `runner.scenario.02`、`runner.scenario.12` | `runner.flow.002`（`runner.flow.002.1..3`） | `runner.view.003` | `runner.interface.001`、`runner.interface.004`、`runner.interface.002` |
| managed invocation 与 mutation | `runner.scenario.03`、`runner.scenario.04` | `runner.flow.003` | `runner.view.011`、`runner.view.004` | `runner.interface.004`、`runner.interface.003`、`runner.interface.002` |
| bounded read fanout | `runner.scenario.05` | `runner.flow.004` | `runner.view.005` | `runner.interface.004`、`runner.interface.003` |
| wait 与 intervention | `runner.scenario.06` | `runner.flow.005`（`runner.flow.005.1..3`） | `runner.view.006` | `runner.interface.001`、`runner.interface.002` |
| crash 与 recovery | `runner.scenario.07` | `runner.flow.006`（`runner.flow.006.1..2`） | `runner.view.007` | `runner.interface.002`、`runner.interface.003`、`runner.interface.004` |
| cancellation | `runner.scenario.08` | `runner.flow.007`（`runner.flow.007.1..3`） | `runner.view.008` | `runner.interface.001`、`runner.interface.003`、`runner.interface.002`、`runner.interface.004` |
| publication 与 settlement | `runner.scenario.09` | `runner.flow.008`（`runner.flow.008.1..3`） | `runner.view.009` | `runner.interface.002`、`runner.interface.004` |
| Observation outage | `runner.scenario.10` | `runner.flow.009` | — | `runner.interface.005` |
| retirement | `runner.scenario.11` | `runner.flow.010`（`runner.flow.010.1..4`） | `runner.view.010` | `runner.interface.001`、`runner.interface.002`、`runner.interface.003`、`runner.interface.004` |

`runner.view.002` 记录 `runner.interface.001..005` 共同遵守的 static dependency direction。Interpreter 在 Host execution 前编译 admitted activation；它刻意保持内部能力，不创建另一个 Core-facing interface ID。

### Interface 定义

| ID | 含义 |
| --- | --- |
| `runner.interface.001` | 面向 already admitted activation 的当前 Core-to-Runner `execute` / `inspect` / `cancel` seam |
| `runner.interface.002` | Runner 内部拥有的 Workflow Host capability |
| `runner.interface.003` | Managed Agent Invocation capability |
| `runner.interface.004` | 拥有 savepoint、git-tree、scope、result、publication 与 settlement state 的 Custody capability |
| `runner.interface.005` | 单向、non-controlling Observation port |

## 4. Acceptance register

| ID | 要求结果 | 证据状态 |
| --- | --- | --- |
| `runner.acceptance.001` | Execution 保持唯一 Delivery assessor，failure 保持 fail-closed | design evidence available |
| `runner.acceptance.002` | exact admitted Package/thread；不伪造 progress | Iteration 2 implementation and test evidence |
| `runner.acceptance.003` | typed managed result；拒绝 bypass | Iteration 2 implementation and test evidence |
| `runner.acceptance.004` | DSH concrete path；unsupported Provider 无 fallback | Iteration 2 implementation and test evidence |
| `runner.acceptance.005` | bounded stable read；mutation 使 view 失效 | Iteration 2 implementation and test evidence |
| `runner.acceptance.006` | correlated resume；拒绝 stale input | Iteration 2 implementation and test evidence |
| `runner.acceptance.007` | continue、restart 或 intervene；不 blind replay | Iteration 2 implementation and test evidence |
| `runner.acceptance.008` | cancellation 收敛且不编造 terminal outcome | Iteration 2 implementation and test evidence |
| `runner.acceptance.009` | 保存 result，并守卫 publication | Iteration 2 implementation and test evidence |
| `runner.acceptance.010` | Observation 保持 non-controlling 且绑定 provenance | validator evidence only |
| `runner.acceptance.011` | authorized retirement 保留 settlement evidence | Iteration 2 implementation and test evidence |
| `runner.acceptance.012` | 新 configuration 只影响后续 Delivery，不替换 in-flight Delivery | Iteration 2 implementation and test evidence |
| `runner.acceptance.013` | 中英文结构与 ID set 保持一致 | deterministic documentation check |
| `runner.acceptance.014` | 每项 claim 路由到适用证据且不暗示未证明能力 | open evidence review |

## 5. Decision register

| ID | Decision |
| --- | --- |
| `runner.decision.001` | Runner 是 Execution module M02，不是 peer System 或 subsystem。 |
| `runner.decision.002` | Runner 只接受 fully admitted activation。 |
| `runner.decision.003` | Runner 包含五个 private submodule，并保持 single-writer ownership。 |
| `runner.decision.004` | Workflow suspension 与 invocation suspension 保持分离。 |
| `runner.decision.005` | Provider execution 穿过 typed managed seam，且无 fallback。 |
| `runner.decision.006` | Workspace view 有界，publication 受 guard。 |
| `runner.decision.007` | Recovery 是 three-way，绝不伪造 outcome。 |
| `runner.decision.008` | Retirement 遵循单一 authorization，并产生 immutable settlement。 |
| `runner.decision.009` | Observation 是 factual、minimized、non-controlling。 |
| `runner.decision.010` | Credential 是 action-scoped，且不进入 durable content。 |
| `runner.decision.011` | LangGraph 与 DSH 是可替换实现选择。 |
| `runner.decision.012` | 不替换 in-flight implementation identity。 |
| `runner.decision.013` | 历史 `ExecutionRuntimeAdapter` 名称不创建当前 Runner 抽象。 |
| `runner.decision.014` | 中英文 companion 保持结构与 ID parity。 |
| `runner.decision.015` | 区分已发布 Contract semantics 与尚未完成的 implementation proof。 |

## 6. Contract 与 open-work register

Workflow DSL `1.1.0` 与 Delivery Admission `1.0.0` 是当前输入。Observation Catalog、OTel Observation Profile 与 Execution–Evidence Interaction Contract `1.0.0` 已冻结并发布。其 machine package 目前只证明 validator；production mapping 与 cross-implementation conformance 仍未证明。

| ID | 当前 disposition |
| --- | --- |
| `runner.open-work.003.1` | parent `execution.open-work.001` 的 Runner-side evidence：证明 admitted-activation boundary 的 Workflow DSL compatibility |
| `runner.open-work.003.2` | parent `execution.open-work.002` 的 Runner-side evidence：在实现中证明 Delivery Admission 与 Manifest binding |
| `runner.open-work.003.3` | parent `execution.open-work.003` 的 Runner-side evidence：证明当前 Core-to-Runner seam；legacy runtime-profile SPI 名称仅属历史 |
| `runner.open-work.003.4` | parent `execution.open-work.004` 的 Runner-side evidence：证明 production Observation mapping 与 cross-implementation conformance |
| `runner.open-work.006` | canonical-identity representation-binding spike；保留原 ID 与 evidence 含义 |
| `runner.open-work.007` | OTel semantic-carrier spike；保留原 ID 与 evidence 含义 |
| `runner.open-work.008` | DSH-only MVP 之后的 Provider 工作 |
| `runner.open-work.009` | 完成 fault 与 recovery fixture corpus |
| `runner.open-work.010` | 完成 supported-substrate qualification evidence |
| `runner.open-work.011` | 必要时以 measured value 替换 operational default |
| `runner.open-work.012` | 证明精确 submodule interface 与 static dependency direction |
| `runner.open-work.013` | 在 production integration 中证明 Observation mapping 与 outage isolation |

Legacy uppercase profile identifier 与 `agent-ops.runtime-profile-spi@1.0.0` 只属于 Git 历史证据，不是当前权威、readiness state 或 active dependency name。

## 7. Iteration 2 证据路由

实现证据来自 pinned `execution-system` submodule，重点是 `src/interpreter`、`src/coordinator`、`src/host`、`src/invocation`、`src/custody` 与 `src/composition`。`execution-system/test/{interpreter,coordinator,host,invocation,custody,integration,providers,contracts}` 下的测试覆盖已实现 Runner boundary 与私有协作。该证据只证明已检入的 Iteration 2 实现；不证明 M01 Delivery、production Observation integration 或 cross-implementation conformance。
