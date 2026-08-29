# Evidence Delivery Retention 与 Evolution Disposition — Iteration 5 MVP

> **状态：** Evidence Query 1.0 candidate，2026-08-28。本文针对尚未发布的 Query 1.0 candidate
> 取代先前 Iteration 5 resource-granular retention 说明，不改写 frozen
> `evidence.query@0.1.0`。英文 companion 为 normative authority。

## 1. Delivery 是 retention 原子

Facts、recorded Trace detail、Task membership 与 evidence-safe Manifest 共同构成一份可查询的
Delivery 数据集，在 Query 1.0 中不得独立过期。只有存在 accepted terminal
`delivery.summary` 的 Delivery 才具备自动过期资格；该 terminal summary Projection 的
`recorded_at` 是 retention base。没有 accepted terminal summary 的 Delivery 不自动过期。

Candidate 默认 Delivery TTL 为 `P30D`，可配置范围 `P1D`–`P3650D` 或 `NEVER`。Scheduler 与
batch 保持有界、可配置，但 batch 选择 Delivery identity，而不是单个 projection resource。
每个 selected Delivery 在一个 transaction 中原子删除全部 queryable Facts、Trace detail、
membership、guard 与 Manifest projection。Reader 只能看到完整 pre-delete Delivery dataset 或
完全查不到该 dataset，绝不会看到 retention 制造的子集。

Raw debug 继续使用独立 privacy lifecycle 与既有即时清理默认值。Accepted-content
digest/provenance 与最小 internal deleted-Delivery guard 可以保留，只用于维持 duplicate/conflict
authority 并阻止迟到 record 复活已删除 Delivery；它们不是 queryable Delivery data、tombstone API
或可恢复 payload。

## 2. Query 与 metric 后果

普通 Evidence routes 只暴露 active Delivery：

- `/facts`、`/traces` 不返回 deleted Delivery 的任何 resource；
- `/tasks` 只列出至少含一个 active Delivery 的 Task，membership traversal 只返回 active Delivery；
- membership relation 是 Task 引用 authority；删除某个 Delivery 时，只有它持有最后一条 membership
  才删除 immutable Task declaration/display metadata，不单独存储 reference counter；
- deleted Delivery 的 exact Manifest lookup 不返回 queryable Manifest；
- Delivery 删除后的 direct Trace lookup对普通 consumer 与 absent detail 不可区分，不泄露或重建删除身份；
- retention 不产生 Trace `PARTIAL` 或 expired node/edge；`PARTIAL` 只描述 active Delivery 已知的 recorded data hole。

Evolution 无需 per-resource retention normalization，只解析 active membership 并基于这些输入计算。
Deleted Delivery 不进入 numerator、denominator、coverage 或 minimum-sample count；没有 active
Delivery 时 population 为空。Metric Result 是即时计算 response，不是 retained dataset，因此没有
独立 Metric Result 删除生命周期。

## 3. 物理删除且不可恢复

MVP expiry 是 automatic physical deletion，不是 logical deletion。BI 无法发现 deleted Delivery。
Iteration 5 不提供 trash、undelete、restore、retention hold、administrative recovery view，也不把
Trace 与 metric 当成两套 data-management lifecycle。未来若需要，必须通过新的显式 lifecycle 与
contract 设计。

Internal deleted-Delivery guard 不包含 Fact value、Trace node/edge、Manifest payload 或任何可恢复
dataset，只负责让迟到 Observation export 无法以相同 Delivery identity 复活已删除数据。

## 4. Active-data partiality

Active Delivery 仍可能缺少 required input 或含 invalid input，这不是 retention。Applicable
evaluation unit 继续进入该 metric 的 coverage denominator，只有 valid covered input 进入
numerator；invalid value 永不进入 arithmetic。

Evidence 不推断未上报 Span、expected-Span count 或 missing leaf。Recorded edge 的 target NODE
从未 observed 时保留 unresolved endpoint；它可以表示 recorded incompleteness，但 Evidence 与 BI
均不得把原因归为 expiry。

## 5. MVP exclusions

Iteration 5 不新增 disk-pressure/write-failure cleanup、logical deletion、restore、administrative
data-management UI、automatic capacity tuning、compaction recommendation 或 durable invalid-record
store。Delivery TTL、scheduler interval 与 Delivery batch bounds 仍是 startup configuration，修改后
需要显式 restart。
