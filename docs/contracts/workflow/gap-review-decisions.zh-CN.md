# Workflow DSL — 缺口评审决策（0.1.x 修订输入，中文翻译）

> **状态：`agentops.workflow-dsl@0.1.0`（REVIEW_CANDIDATE）的已采纳评审输入。** 这些决策解决 Task 2 迁移两个 first-party Workflow 时发现的六项 DSL 缺口。它们喂给 G1 语义 review；Contract revision 在冻结前保持 `0.1.0`（Contract 未发布，REVIEW_CANDIDATE 阶段不需要升版本；冻结目标 `1.0.0`）。
>
> **规范语言：英文。** 本文件是 [`gap-review-decisions.md`](gap-review-decisions.md) 的非规范跟踪翻译。

## 决策

| ID | 缺口 | 决策 | 行动 |
| --- | --- | --- | --- |
| DSL-1 / DSL-S4 | `budget.limit` 是必填 number，但 workflow 语义把数值额度留给 project/runtime policy | **修订。** budget 声明资源维度（闭合集 `time \| tokens \| context \| custom`，custom 维度如 attempts 用 `resourceName`）+ **脚本注册点**（`evaluator`，content-addressed 引用），runtime 调用脚本获得预算结论。**配置中永不出现数值额度。** 这是 Implementation Workflow 的既有实践：配置绑定注册点，runtime 调用脚本。 | 修订 schema（§budgets）、spec（§5.2、§6.4）；两个 first-party Definition 补回 `budgets[]`（evaluator 注册点）；删除占位数值绕行 |
| DSL-2 | 纯确定性 Action（`responsibleAuthority.kind: runtime`——IM-06、SD-14、SD-15）没有 Agent route，但 `allowedRoutes` 被强制 `minItems: 1`，被迫编造占位 route | **修订。** Runtime authority 的 Action 没有 Agent 绑定，因此不声明 `allowedRoutes`（省略或空）。Agent Action（`kind: role`）保持 `minItems: 1`。 | 修订 schema（`allowedRoutes` 移出 required；if/then role⇒minItems 1）、spec（§5.3）；删除 IM-06 的 custodian route 绑定与 `role.runtime-custodian` / `route.runtime.deterministic` 占位 |
| DSL-S1（判断 authority） | 条件边谓词只对结构化状态求值；Agent 输出常为非结构化文本，语义判断必须交给 agent | **修订。** `conditionalEdges` 增加 `judge` 声明：`judge.kind: state`（结构化谓词，现状）或 `judge.kind: planner`（runtime 先调用 Planner Action 的 Agent 做语义判断，要求返回符合 `resultSchema` 的结构化分类；runtime 校验后按 `conditions[].when` 谓词对该分类选分支）。判断归 agent，分支结构归 workflow。 | 修订 schema（§conditionalEdges）、spec（§4.1、§5.2、§6.3） |
| DSL-S1（分支子集激活） | SD-09 复检应只重跑失效 lens；v1 无动态分支激活 | **接受为已知限制。** 这是 runtime 调度（优化），不是 workflow 语义；保留全 3 分支 parallel 声明 + purpose/conformance 中的复检范围说明。 | 记录进 spec known limitations + 核对表 |
| DSL-S2 | 并行 action 多 role（SD-09 三 lens）无法用单个 `responsibleAuthority` 表达 | **接受（MVP 范围）。** 单 action 多 role 并行与多 action 并发同属并行协调机制（barrier/wait 协调），MVP 不做。若第一方 Runtime（LangGraph）原生支持且无需自研协调代码，后续可补——形式可能更接近"多 action 并发"而非"单 action 多 role"。 | 记录为已知限制 + trade-off；保留 nominal role 绕行 |
| DSL-S3 | `wait.resumeAction` 是固定值，而 workflow.md 按"记录的 resume_action"路由 wait | **关闭为 non-issue。** 把一个逻辑 wait 拆成每触发 Action 一个 wait（resume == trigger）语义等价。恢复后的动态路由由"精确 resume 回触发点 + 该触发点的条件边再路由"覆盖。不改 DSL。 | 在核对表中说明等价性 |

## 对 Contract 与 Definition 的影响

1. **Schema**（`system-contracts/workflow-dsl/schemas/`）：
   - `workflow-definition.schema.json`：`budgets[].resource` → `time|tokens|context|custom`，新增 `resourceName`（仅 custom）与 `evaluator`（schemaRef，必填），删除 `limit`；`conditionalEdges[].judge` 新增。
   - `actions.schema.json`：`allowedRoutes` 移出 required；if/then —— `responsibleAuthority.kind == role` ⇒ `allowedRoutes.minItems 1`。
2. **Spec**（`docs/contracts/workflow/workflow-definition-dsl.md` + companion）：§4.1 谓词/判断 authority、§4 映射表、§5.2 字段目录（budgets、conditionalEdges）、§5.3 allowedRoutes、§6.3 selector/planner 判断、§6.4 预算语义、新增 known limitations（§18）。
3. **Definitions**（`workflow-package/*/definition/`）：
   - Implementation：IM-06 删除 `allowedRoutes`；补回 `budgets[]`（attempts 走 `custom` + evaluator 注册点）。
   - System Design：删除 `role.runtime-custodian`、`route.runtime.deterministic` 与 `resources/runtime-custodian.role.md`；SD-14/SD-15 删除 `allowedRoutes`；6 条 budgets 转为新 schema（evaluator 注册点）。
4. **Checker**（`system-contracts/workflow-dsl/tools/check-example.cjs`）：`allowedRoutes >= 1` 仅对 role authority 的 Action 强制。
5. 重新验证两个 Definition（checker PASS）、更新两份语义保真核对表，然后提交全部修订供合并 G1 review。
