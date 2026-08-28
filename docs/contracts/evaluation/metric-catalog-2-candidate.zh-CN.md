<a id="metric-catalog-2-candidate"></a>
# Metric Catalog 2.0 评审候选

> **人类语义规范——评审候选，尚未发布。** 本文是 `agentops.evaluation.metric-catalog@2.0.0` 评审候选的语义 authority。不可变的已发布 `1.0.0` 仍见 [Metric Catalog 1.0](metric-catalog.zh-CN.md)。Contract 生命周期发布 2.0.0 前，消费者不得把本候选宣传为已发布兼容目标。

## 1. 决策与兼容边界

候选严格包含 12 项 metric。删除 `packet-rework-rate` 和 `direct-evidence-basis-rate`，因为它们的产品问题和 eligible population 尚不足以支持无歧义实现。它们没有别名，也不产生 2.0 Metric Result。

删指标并修改 Usage 兼容语义属于 MAJOR revision。其余 metric 继承 1.0.0 语义，本文明确替换的内容除外。Observation 依赖仍精确绑定已发布的 `observation-contract@1.0.0`。

## 2. 精确 metric 集合

| metric_id | kind / unit | evaluation unit |
| --- | --- | --- |
| `role-template-rework-rate` | rate / ratio | 同一 event-time role-template cohort 中的 eligible terminal task |
| `role-template-trajectory-partial-cost` | money / 上报 money unit | 同一 event-time role-template cohort 中的 eligible terminal task trajectory |
| `role-model-task-outcome-rate` | rate / ratio | 具备完整 canonical model-role attribution 的 eligible terminal task |
| `operational-latency-ms` | duration / milliseconds | 具备原生 Span duration 的 attributed operational model call |
| `trajectory-partial-cost` | money / 上报 money unit | 关联已上报 money Usage 的 Delivery trajectory |
| `task-cohort-comparison-eligibility` | rate / ratio | declared defined-task snapshot 中的 task |
| `delivery-stage-reach` | rate / ratio | Delivery trajectory |
| `delivery-terminal-outcome-rate` | rate / ratio | 明确终止的 Delivery trajectory |
| `delivery-cycle-time-ms` | duration / milliseconds | 具备直接 C55 elapsed time 的明确终止 Delivery |
| `operational-token-usage` | quantity / tokens | 具备已上报 token Usage 的 attributed operational model call |
| `operational-attributable-cost` | money / 上报 money unit | 关联已上报 money Usage 的 attributed operational model call |
| `operational-usage-availability` | rate / ratio | attributed operational model call |

每项 metric definition 的版本均为 `2.0.0`。不存在 composite score，也不存在对被删 metric 的隐式替代。

## 3. 已上报 Usage 语义

Evolution 只消费已记录的 Usage。它不新增 `cost basis`、`estimated`、`unattributed` 或 `project-attributable` 分类，不推导价格，也不归一化单位。

- 只有 Usage `kind`、`unit`、`source`、`source_id` 以及该 metric 所有 cohort 维度都精确相等时，值才可进入同一兼容组。
- Money 只能与相同上报货币单位的 money 合并；token 只能与相同上报 token measure 的 token 合并；二者不得混合或相互换算。
- input/output token measure 保持分离；Evolution 不合成缺失的 total-token 值。
- 小数或百分数只是 BI 显示变换；Evolution 保留精确整数和精确有理数结果。
- `partial` 只表示“对 covered units 实际记录的兼容 Usage 求和”，不表示估算总花费。

call-scoped metric 中，Usage 只有通过原生 Trace/Span context 精确绑定 model call 才能贡献；Delivery/task-scoped metric 仍要求精确 Delivery/Task 关联。缺失关联会降低该 metric result 的 coverage，不得用时间、到达顺序或文本匹配修复。

## 4. 每项 metric 自己的 coverage

Coverage 不是独立的数据质量总分。每个 metric result、每个 selected slice 都发布自己的 `{numerator, denominator, raw_ratio, state, alert}`：

- denominator：满足该 metric identity、time-window、cohort 和 base-scope 规则的候选单元；
- numerator：其中计算该 metric 所需的全部直接输入都可用且兼容的候选单元；
- metric value：只使用 numerator population 计算；缺失候选保持 missing，绝不作为零加入。

例如 Evidence 暴露 20 个 in-scope Delivery，其中 16 个具备某项 metric 所需的全部输入，则该项 coverage 精确为 `16/20`、状态为 `PARTIAL`，metric value 只使用这 16 个 Delivery。同一批 20 个 Delivery 上的另一项 metric 可以有不同 coverage。

1.0 的 coverage 状态机、精确有理数、`LOW_COVERAGE` 阈值规则、coverage 永远发布以及独立的 `minimum_sample` 行为全部保持不变。

## 5. 生命周期与实现规则

机器候选位于 `system-contracts/evaluation-2-candidate/`，必须拒绝两个被删 coordinate 以及本文明确禁止的所有语义漂移。其状态为 `REVIEW_CANDIDATE`，没有 publication record，也不声明 conformance。Wave 5 可以对 owner 已批准的候选进行实现和测试，但正常 Contract gates 与 publication 完成前，不得声称已绑定发布版 2.0。

