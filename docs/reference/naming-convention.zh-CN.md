# 命名规范

**状态：评审草稿（2026-08-25）。** 本文首次以书面形式记录自 2026-08-19 起一直以事实标准（de facto）执行的命名治理决策。它是 issue [#36](https://github.com/firestige/workflow-self-recursive/issues/36)（"特性 ID 格式（单词[.单词]，无数字，含文档权威 ID 映射表）"）剩余验收项的交付物。在评审确认之前不主张发布权威地位。

## 1. 范围

命名治理覆盖三件决策，统一登记在 #36：

1. **仓库名** — 产品/仓库正式名称及其书写形式。
2. **引擎名** — 执行器的名称及配套角色词。
3. **资产 ID 格式** — 文档、契约与 issue 卡片共用的点号 ID 体系，含权威 ID 映射表。

不在本文范围：Workflow Contract 内部的 DSL 命名（由其契约文档负责）、文件路径（由仓库布局约定负责）。

## 2. 仓库名

- **正式名称：`workflow-self-recursive`**（小写、连字符、ASCII）。新产物一律使用此书写形式。
- **代号 `Agent Ops Ledger` 已退役**：只保留在历史记录（CHANGELOG、git history、旧 issue 卡片）中，任何新产物不得使用。
- **改名已执行**：commit `ed5d243`（2026-08-20）— FPLG → runner（268 处）、Agent Ops Ledger → workflow-self-recursive（53 处）、仓库 slug 变更（12 处）、EN↔ZH parity 保持、5 个 submodule 指针 bump。grep 验证：旧名在当前树中已清零。
- **Slug**：GitHub 仓库 `workflow-self-recursive`；npm 包使用 `wsr-<系统>` 命名空间（见 §6）。

## 3. 引擎与角色词

执行器名为 **`runner`**（执行器）。角色词（2026-08-19 裁决的命名体系）：

| 角色 | 含义 |
| --- | --- |
| `intake` | 宿主入口（当前为 DSH intake）；宿主入口 |
| `runner` | 执行器 — execution 的 module，运行 workflow 配置图 |
| `agent provider` | agent 能力提供者（DSH headless / Copilot SDK / Codex CLI Adapter 适配面） |

runner 之下的组件命名使用点号分类并绑定 owner 域，如 `execution.runner.host`、`execution.runner.interpreter`、`execution.runner.coordinator`、`execution.runner.invocation`、`execution.runner.custody`。组件改名遵循 feature-structure change-log 纪律（B 组变更记录），不做临时编辑。

## 4. 资产 ID 规则 — 名词[.名词]

资产 ID 最多三个点号分隔的名词：

```
owner.classification.asset
```

- **第一段 — owner**：资产的属主域前缀。完整单词、小写。注册表见 §5。
- **第二段 — classification**：owner 域内资产的分类（`acceptance`、`decision`、`contract`、`milestone`、`scenario`、`module`、`fixture`、`obligation`、`path`、`view`、`flow`、`driver`、`interface`、`submodule`、`open-work` 等）。一个分类即一个 family；family 是同一 owner 下同种资产的集合。
- **第三段 — asset**：具体资产的名称 — 完整单词（如 `invocation`、`custody`、`admission`）或零填充序号（如 `001`、`017`，用于枚举型资产）。**序号一旦出现，必须是 ID 的最后一段**：新 ID 不得在序号后附加字母后缀或子序号（历史形态 `runner.open-work.003.x`、`evidence.path.04a` 保留为 legacy）。

语法约束：

- 仅小写 ASCII；ID 内唯一分隔符为 `.`（不允许连字符、下划线、空格）
- **词段不含数字** — 序号是唯一数字段（这是 #36 "无数字"的书面化）
- 新 ID 不得使用缩写（§7）
- 序号为**三位、零填充、固定位于 ID 末尾**（`001`、`017`、`003`）。其他填充位数的历史 family（`execution.milestone.01`、`contract.gate.1`）及序号后带后缀的形态保留为 legacy；一切新编号 ID 一律以三位序号收尾

Feature 卡片在标题中使用同一规则，浅一层：`[type] owner.classification`（如 `[feature] evidence.admission`）或 runner 内部用 `[type] owner.classification.asset`（如 `[feature] execution.runner.invocation`）。

## 5. Owner 注册表与权威 ID 映射表

下表是事实标准的权威清单（2026-08-25 从当前树提取）。新 ID 必须归属已有行，或经决策扩展。

| Owner | 含义 | 分类 family | 示例 ID | 归属面 |
| --- | --- | --- | --- | --- |
| `concept` | 概念权威文档及其决策 | `identity`、`acceptance`、`obligation`、`decision`、`fixture` | `concept.identity.001`、`concept.acceptance.017`、`concept.obligation.011`、`concept.decision.018`、`concept.fixture.003` | `docs/agent-architecture.md` |
| `execution` | 执行系统 | `scenario`、`milestone`、`module`、`decision`、`open-work` | `execution.scenario.01`、`execution.milestone.02`、`execution.module.001`、`execution.open-work.003` | `docs/systems/execution/`、Execution issue 卡片 |
| `runner` | runner 引擎内部 | `acceptance`、`decision`、`scenario`、`view`、`flow`、`driver`、`interface`、`submodule`、`open-work` | `runner.scenario.01`、`runner.interface.004`、`runner.open-work.003.x`、`runner.driver.001`、`runner.flow.010` | `docs/systems/execution/modules/runner/` |
| `observation` | 观测契约 | `contract` | `observation.contract.001` | `docs/contracts/observation/` |
| `contract` | 契约生命周期 gate | `gate` | `contract.gate.1` | `docs/contracts/contract-lifecycle.md` |
| `evidence` | 证据系统 | `scenario`、`milestone`、`path` | `evidence.scenario.01`、`evidence.milestone.02`、`evidence.path.04a` | `docs/systems/evidence/` |
| `evaluation` | 评估 / 指标目录 | `contract`、`definition` | `evaluation.contract.001`、`[doc] evaluation.definition` | `docs/contracts/evaluation/` |
| `workflow` | workflow package 表面 | `definition`、`schema`、`authority`、`package`、`contract.publish` | `[doc] workflow.definition`、`[doc] workflow.contract.publish` | Issue 卡片 |
| `bi` | 可视化 / 报表面 | `factual`、`trace`、`serving` | `[feature] bi.factual` | Issue 卡片 |
| `product` | 产品级关注点 | `entry`、`independent` | `[feature] product.entry` | Issue 卡片 |
| `evolution` | 进化闭环 | `loop`、`evaluate`、`revise` | `[feature] evolution.loop` | Issue 卡片 |

`execution` 在使用中的其他 feature 卡片分类：`delivery`、`observation`、`runner`、`release`（`[feature] execution.delivery`、`[feature] execution.observation`、`[chore] execution.release`）。

## 6. 包命名（npm / DSH 插件）

- 命名空间：`wsr-<系统>`，**无 npm scope**。2026-08-25 裁决。
- 现状：`wsr-execution`（执行系统）、`dsh-wsr-execution`（产品级入口，当前承载 Execution 能力）。
- 预留：`wsr-evidence`、`wsr-evolution`（闭环用）。
- 理由：符合 DSH 生态惯例（无 scope 短名：`dsh-plugin`、`dsh-auto-update` 等）；安装命令简短；无需注册 npm 组织；与"系统为主体、DSH 为入口"的组织决策一致。

## 7. 缩写策略 — 一律禁止缩写

**问题**：agent 天然倾向使用缩写，而不是规范规定的完整单词。对策不是"批准缩写清单"，而是**严格禁止 + 选词纪律**，让完整单词本身足够短。

- **规则**：资产 ID **一律不允许缩写** — `owner` 段、`classification` 段、单词形 `asset` 段都不行。不存在官方批准缩写清单；任何不属于 §5 注册表完整词的 token 一律拒绝。
- **选词准则**（让完整词足够短、没人需要缩写的根本手段）：
  1. **简单** — 优先短小常用的词，不用复合描述。
  2. **明确** — 在所属 owner 域内只能有一个含义；禁止过载前缀。
  3. **符合行业惯例** — 使用行业既有的词（`runner`、`intake`、`contract`、`milestone`、`scenario`、`trace`），不自造词汇。
  - 选词得当的完整词和它的缩写一样短；如果某个词太长，修法是换更好的词，而不是缩写。
- **历史遗留 / 解析表** — 不得复用的历史缩写与过载前缀，及解析方式：

  | 遗留 token | 解析 |
  | --- | --- |
  | `FPLG` | → `runner`（commit `ed5d243` 改名） |
  | `SC`（过载） | → `runner.scenario` / `evidence.scenario`（commit `ec31cfe` 拆分） |
  | `exec`、`ev`、`obs`、`con` | → 一律用完整词 `execution`、`evidence`、`observation`、`contract` |
- **强制**：CI/grep 检查拒绝任何不在 §5 owner/classification 注册表中的 ID token，并拒绝词段中的数字；`pctl` 可承载该检查。落地前由评审拦截违规。

## 8. 评审记录

2026-08-25 已确认的决策：

1. **序号填充 — 已定**：三位、零填充、固定位于 ID 末尾。现有 legacy 形态（`execution.milestone.01`、`contract.gate.1`、`evidence.path.04a`）保留；清理迁移可选，如推进则另开 chore 卡。
2. **"无数字"澄清 — 已定**：词段不含数字；数字只以末尾三位序号的形式出现。
3. **缩写 — 已定**：一律禁止；选词必须遵守 §7 的简单 / 明确 / 符合行业惯例准则。
4. **文档地位 — 待定**：本文是 `docs/reference/` 参考文档（EN 权威 + ZH 跟踪翻译），非契约。下次提交前请确认落点。
