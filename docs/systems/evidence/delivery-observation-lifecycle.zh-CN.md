# Delivery Observation 生命周期 — Evidence Query 1.0 候选

> **状态：** Iteration 5 设计候选，2026-08-28。本文定义拟由
> `evidence.query@1.0.0` 承载的 breaking Delivery-level lifecycle semantics。
> 已冻结的 `evidence.query@0.1.0` bytes 与历史语义保持不变。英文 companion：
> [`delivery-observation-lifecycle.md`](delivery-observation-lifecycle.md)。

## 1. Authority 与单位边界

Evidence 拥有 recorded observation lifecycle。Delivery 是 Evolution 数据集的逻辑 retention
边界。Task membership、accepted provenance 与 immutable Delivery Manifest 继续作为永不过期的
identity authority，但不会因此把已过期 Delivery 留在当前 metric population。

Delivery lifecycle 是外层 gate，不替换 Metric Catalog 的内层 evaluation unit：metric 仍可按
Delivery/template exposure、Task 或 exact model call 计数。Evolution 先移除每个 `EXPIRED`
Delivery 及其全部输入，再对剩余 Delivery 应用各 metric 已发布的 evaluation-unit 与 coverage
规则。

## 2. Closed observation states

| State | 含义 | 对 metric population 的影响 |
|---|---|---|
| `ACTIVE` | Delivery 仍属当前 observation population，且没有 recorded integrity gap。 | applicable inputs 正常进入 metric eligibility/coverage。 |
| `PARTIAL` | Delivery 仍然有效，但 Evidence 可证明存在数据洞或 invalid required record。 | Delivery 留在 applicable base population；受影响 metric 的坏/缺输入不进入 coverage numerator，其他 metric 继续。 |
| `EXPIRED` | Delivery 已跨过 committed logical retention boundary。 | 该 Delivery 的全部输入同时退出当前 metric numerator、denominator、coverage 与 minimum-sample count。 |

Retention 绝不产生 `PARTIAL`。Active 与 expired Delivery 混合时只按 active 子集计算，不能仅因
存在 exclusion 就标 partial。若 selected Deliveries 全部 expired，metrics 返回
`NO_POPULATION`；receipt 可保留 `EXPIRED` identity/exclusion reason，但不重建 detail。

Metric coverage `PARTIAL`（`0 < covered < eligible`）与 compare `PARTIAL_COMPARE` 是另外两个
closed concepts，不是 Delivery lifecycle state 的别名。

## 3. Integrity gap 与 invalid record

Evidence 只能基于 recorded、可机械验证的输入把 active Delivery 标为 `PARTIAL`：

- accepted Trace structure 所要求的 recorded parent/link endpoint 缺失；
- record 的 Delivery/record identity 可独立验证，但因 closed schema、type、range 或
  identity-conflict reason 被拒绝。

第二种情况由 Evidence 保存 sanitized Delivery integrity marker。Marker 只包含 validated
Delivery identity、stable source/record identity 或 category、closed reason code 与
accepted-safe provenance；绝不保存非法 measurement，不把 rejected content 升格为 Fact，也不创建
Metric Result。若 request 自身的 Delivery identity 无法验证，它只能是 admission/transport failure，
不得污染任一 Delivery。

若一个 leaf Span 完全没有出现，且没有 recorded reference、expected-count declaration 或 sequence
coordinate，系统无法证明它缺失，禁止推断。当前 Observation contract 没有 Span expected-count 或
export-group sequence Oracle。

另外，Evolution 可能发现 accepted input 不满足 metric-specific domain rule。这时 active
Delivery/evaluation unit 留在该 metric coverage denominator，但不进入 coverage numerator。
Evolution 报告 metric-specific gap，不改写 Evidence 的 recorded Delivery state，也不升级 invalid
value。

## 4. Logical expiry 与 physical scrubbing

Logical expiry 在 Delivery scope 原子提交。一个 non-expiring Delivery expiry tombstone 生效后，
该 Delivery 的所有 queryable Fact/Trace input 都不能进入当前 metric resolution。后台 storage
maintenance 可 bounded、逐条清理 physical records，但 per-record GC marker 与 batch progress 只是
internal bookkeeping，绝不影响 public Delivery state，也绝不产生 `PARTIAL`。

Snapshot 只能看到 logical expiry 前或后的 Delivery，不能仅因 scrub batch 尚未完成就看到 public
half-expired Delivery。

## 5. Query 与 Evolution handoff

Evidence Query 1.0 在 Task membership 以及 Delivery-filtered Fact/Trace traversal 中暴露 exact
Delivery observation state；membership identity 在 expiry 后仍可查询。Evolution 把 state/exclusion
reason 绑定进 `ResolvedEvaluationContext`，在 normalization 前划分 Delivery，禁止 expired Facts、
Trace nodes、Usage、template exposure、model call 或 Task classification 泄漏进 calculator。

对 active/partial Delivery，missing/invalid required input 仍按 metric 分开处理：

- applicable evaluation unit 留在该 metric coverage denominator；
- 只有 valid covered input 进入 coverage numerator；
- `0 / N` 是 `NO_COVERAGE`，`0 < C < N` 是 coverage `PARTIAL`，`N / N` 是 `FULL`；
- unavailable input 不能变成 zero，invalid input 不能参与 arithmetic。

## 6. Conformance

Evidence 必须证明 logical Delivery expiry 对 query snapshot 原子、physical scrub progress 不改变 public
state、retention 不产生 `PARTIAL`、可归属 Delivery 的 invalid input 会产生 `PARTIAL`、不可归属的
invalid input 不会，以及 unreferenced missing leaf 不被推断。Evolution 必须证明：增加 expired
Delivery 不改变任一 metric 的 value、numerator、denominator、coverage 或 minimum-sample count；增加
active 且 required input missing/invalid 的 Delivery 只改变 applicable metric coverage；all-expired
selection 返回 `NO_POPULATION`；active/expired 混合不会使整个 selection 变成 partial/expired。
