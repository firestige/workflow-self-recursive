# Evidence Retention 与 Evolution Expiry 处理 — Iteration 5 MVP

> **状态：** Iteration 5 澄清，2026-08-28。本文记录 Evidence 已实现的 retention mechanism，以及
> Evolution 消费 expiry state 时更窄的规则。本文不修改 frozen `evidence.query@0.1.0`，不新增
> retention subsystem，也不要求 Evidence Query 1.0 暴露 Delivery lifecycle API。英文 companion：
> [`delivery-observation-lifecycle.md`](delivery-observation-lifecycle.md)。

## 1. Evidence 现有机制

Evidence 已实现 automatic、resource-granular retention。Production assembly 随 API process 启动
一个 bounded retention loop：启动后立即执行一次，随后每次等待 configured interval 再执行。
每轮按 Raw debug、Trace detail、factual projection 的顺序，对每个 enabled lifecycle class 最多
plan/apply 一个 bounded batch。

该机制由时间与 policy 驱动，不由 ingest failure、free-space threshold、database size 或 write-path
capacity check 触发。某轮失败会记录日志，不终止 API；只由之后的 scheduled iteration 再次尝试。

| Class | 默认值 | 可配置范围 | 效果 |
|---|---:|---:|---|
| Raw debug | `PT0S` | `PT0S`–`P1D` | 清除 accepted raw payload；保留 accepted identity/provenance |
| Trace detail | `P30D` | `P1D`–`P365D` 或 `NEVER` | 清除 expired detail payload；query 保留已发布的 Trace availability/expiry state |
| Factual projection | `P365D` | `P30D`–`P3650D` 或 `NEVER` | 清除 projection payload；query 保留 explicit unavailable/expired tombstone |
| Accepted provenance | `NEVER` | 不可配置 | 保留 identity 与 accepted provenance |

默认每轮每个 enabled class 最多处理 500 resources（范围 1–1000）；默认 interval 为 60 秒（范围
10–3600 秒）。配置在 service startup 时读取；修改环境变量后必须重启。Query snapshot 继续提供
各 route 已发布的一致性，retention commit 独立进行。

## 2. Physical expiry 不等于 metric partiality

Frozen Evidence Query 0.1 忠实暴露现有 resource-granular behavior：同一 Trace 同时存在 active 与
expired detail 时可能返回 `PARTIAL`。该状态表示 retained Trace detail 只有一部分，不证明当前
observation 上报不完整；Evolution 不能把它翻译成 metric coverage `PARTIAL`。

Iteration 5 metric calculation 使用 Delivery 作为外层 population boundary：

- 若 Delivery-scoped read 表明发生 retention expiry，Evolution 在应用 Catalog 的 Task、model-call、
  template-exposure 或 Delivery evaluation unit 前，先排除该 Delivery 及其全部 inputs；
- 被排除 Delivery 不影响 metric numerator、denominator、coverage 或 minimum-sample count；
- active 与 retention-expired Deliveries 混合时只按 active 子集计算，不能仅因旧数据被移除就标
  metric-partial；
- 若没有 active Delivery，metric 为 `NO_POPULATION`；receipt 仍可解释 retained identity 与 expiry。

Active Delivery 的 required input missing/invalid 是另一回事：applicable evaluation unit 留在该
metric coverage denominator，只有 valid covered input 进入 coverage numerator。因此 `0 / N` 是
`NO_COVERAGE`，`0 < C < N` 是 coverage `PARTIAL`，`N / N` 是 `FULL`；invalid value 绝不参与
arithmetic。

Metric coverage `PARTIAL`、Evidence Trace detail `PARTIAL` 与 `PARTIAL_COMPARE` 是三个不同状态，
不得互相 alias。

## 3. 当前 invalid-input 限制

Evidence admission 不保存 rejected record；OTLP `partial_success` 只是 aggregate response，不是
durable Delivery-scoped disposition。因此，后续无法区分“record 因 invalid 被拒绝”和“record 从未
上报”。Evolution 可以报告 missing input，也可以拒绝它实际读到的 invalid accepted value，但在没有
durable marker 时不能声称 Evidence 记录了某个 Delivery 的 invalid input。

Iteration 5 不新增 invalid-record store、expected-Span count、export-group sequence，也不推断 missing
leaf。Recorded missing parent/link endpoint 可作为 orphan 显示；完全没有 reference 的 absent Span
不可知。

## 4. MVP 边界

MVP 保留现有 scheduler、TTL classes、environment configuration、resource-granular markers、bounded
batches 与 query states，不新增：

- disk-pressure 或 write-failure-triggered cleanup；
- manual Delivery deletion API 或 administrative UI；
- Delivery-atomic physical GC/tombstone protocol；
- durable Delivery-scoped invalid-record marker；
- automatic capacity tuning、compaction、vacuum policy 或 retention recommendation。

运维细节与 exact environment variables 见
[`evidence-system/docs/operations.zh-CN.md`](../../../evidence-system/docs/operations.zh-CN.md)。
