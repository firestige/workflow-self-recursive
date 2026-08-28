# Evolution System — Iteration 5 详细设计候选（中文追踪）

> **状态：** Wave3 设计候选，2026-08-28。英文 [`evolution-system.md`](evolution-system.md) 是候选规范文本；本文是中文追踪 companion。本文记录已确认的设计方向，但本身不修改 published Contract，也不授权 Wave4 实现。

## 1. 权威与目的

Evolution 是 Iter5 中 `agentops.evaluation.metric-catalog@1.0.0` 全部 14 项 Metric Result 的唯一运行时权威。

- Evidence 拥有 accepted Facts 与 recorded Traces；Evolution 只经 Evidence Query 读取，不访问 PostgreSQL。
- Evaluation 是 metric 概念 Contract，不是可部署组件。
- Evolution 解析 BI 提交的 `EvaluationSelection`，用 Python 计算全部 published metrics，并返回 `ResolvedEvaluationContext` 回执和 `MetricResultSet`。
- BI 只展示 Metric Result，并可直接向 Evidence 做 Fact/Trace 下钻；BI 不计算 metric、不创造 Fact、不写回 Metric Result。
- Evolution 无状态；compute request 不创建持久服务资源，也不写 Evidence/数据库。

系统边界图见英文 companion 第 1 节。

## 2. 已确认的 cross-system 语义

### 2.1 Task identity、展示与 membership authority

Task selection 是已经裁决的产品方向，不是未决架构 blocker：

- 用户明确选择 Delivery 新建 Task 或复用已有 Task；默认新建，系统不得自行推断复用。
- Execution 创建或接受 exact `task_id`，Observation 沿 telemetry contract 传递该绑定。
- Evidence 拥有 accepted Task declaration 与 Delivery-to-Task admission/membership projection，并向 BI 提供 exact Task filter 与有界 Task list query。
- `task_id` 是稳定且唯一的 selection/deep-link identity；另设可选 `display_name` 作为人类可读展示元数据。名称非空时 BI 显示名称，缺少名称时才回退显示 `task_id`。request、receipt、membership、URL 与 equality 一律使用 ID，名称不得替代 ID。
- Evolution 从 Evidence 解析所选 Task population，并在 response receipt 中绑定 exact resolved membership。

针对 Catalog §6.2，Evolution 在该 side 声明的 logical `as_of` 上把 accepted declaration/membership materialize 为 receipt-bound immutable defined-task reading。“Immutable”只描述这次 response 的已解析输入，不创建第二个 manifest，也不把 Task authority 从 Evidence 转移出去。

当前 published contracts 尚未完整表达这条链路。将它写入适用的 contract revision 是后续获准的契约对齐工作（计划在 Wave4），不是剩余 owner 决策，也不需要创造第二个 Task authority。

### 2.2 最终稳定与 resolved Evidence read set

Observation 与 Evidence 要求最终稳定，而不是 Fact/Trace routes 的 transaction-wide simultaneity。上报期间，重复执行尚未解析的 selection 可以合法看到更多 accepted records；当没有新增 accepted Observation/Task membership 且 required data 尚未 retention expiry 时，同一 settled selection 收敛为稳定查询结果。

- 每个 Evidence traversal 继续遵守既有 route-local cursor/snapshot consistency rules。
- Evolution 必须完整遍历每个已绑定 query，不得悄悄重启 cursor，也不得把 partial traversal 表示为 complete。
- `ResolvedEvaluationContext` 绑定该次 response 实际使用的 exact resolved Evidence read set：canonical query coordinates、resolved population、input/provenance identities，以及 completeness/expiry state；它不声称存在一个跨 signal 的数据库事务快照。
- `delivery_id` 用于把记录归入 Delivery trajectory。若 metric 必须关联某一次 model call，则以 exact Span identity `(trace_id, span_id)` 完成关联；Delivery identity 本身粒度不足。
- 不新增 cross-route snapshot mechanism 或额外 final-stability oracle；扩展 projection 时复用现有 identity、duplicate/conflict、pagination、completeness、retention 与 expiry conformance rules。

Iter5 physical mapping 从 recorded Trace NODE 读取 native operational Span measurement。未来 Contract 可以额外投影 metric-readable Fact，但本设计不依赖它，也不得因此静默替换 exact model-call/lifecycle 语义。

## 3. Public compute model

Public surface 是 closed、versioned、无副作用的 `POST /api/evolution/v1/evaluations:compute`。使用 POST 是因为 selection/receipt 是有界结构，不代表 server mutation；settled Evidence 下相同请求在语义上幂等。

- `api_version` 必须是 `1`；unknown field/variant 均拒绝。
- `SINGLE` 恰含一个 `selection`；`COMPARE` 分别提供 `left`/`right`。
- 每个 `EvaluationSelection` 含 `selection_version: 1` 与 1–24 个无重复 exact `task_ids`，由 Evolution canonical sort。这是 closed count cap；由于合法 128-character ID 经 percent encoding 可能膨胀，BI 另行对完整 URL 执行 8 KiB limit。以后只能通过 published closed revision 增加 filter；禁止 `display_name`、alias、metric ID、layout 或 visualizer state。
- Selection 描述 population query，不是 metric set；Evolution 固定计算 API revision 绑定的 14 coordinates。
- Receipt 随 response 返回，不存在预制 manifest。
- 上报期间重复 unresolved selection 可看到新增 Evidence；settled 后 active Evidence 最终稳定，retention transition 可有意地产生 `EXPIRED`/`UNAVAILABLE`。

Response 使用 tagged side union：`side_result={receipt,metric_results[14]}` 或 `side_error={code,retryable,detail}`。`SINGLE` 成功必须有一个 `side_result`；FULL `COMPARE` 有两个 side results 与 14 个 Delta entries；`PARTIAL_COMPARE` 有一个成功 side、一个 side_error，14 个 Delta coordinate entries 全部为 `SIDE_UNRESOLVED`。成功 side 内单项缺失不能令 coordinate 消失。

Exact request examples 与英文 companion 第 3 节一致。

## 4. Selection resolution

意图中的 fail-closed pipeline 是：closed selection validation → canonical query → 遍历 bound Evidence queries → 绑定 exact resolved read set → Catalog binding → receipt → 14 isolated calculators。禁止把 display name 当 identity，也禁止 alias、ambient latest、recency、Task membership 推断、cursor 自动重启或把 partial traversal标成 complete。

每个 side resolution 开始时，Evolution 声明一个 logical evaluation `as_of` cutoff，并应用于 Task membership 与 terminal/cohort reading。它是 Catalog §6.2 cutoff，不是 Evidence snapshot token。每个 `/facts`/`/traces` traversal 仍只有自己的 route-local consistency coordinate；这些 token 不建立或近似 shared cutoff/snapshot。

对每个 `task_id`，Evolution 在 logical cutoff 解析 exact Task declaration 与 accepted Delivery membership，并 materialize 该 side 的 immutable defined-task reading。缺 identity/membership 或 event-time cohort coordinates 以 typed reason 排除；任一 member Delivery 没有 explicit terminal Delivery Summary 则 Task 为 open；terminal outcome 冲突则 mixed。Trace closure、timestamp、arrival order 均不能证明 Task terminal。后续复用可改变未来 read set，但不能改写已返回 receipt。

## 5. ResolvedEvaluationContext

Closed receipt shape 包含：

| Field | 语义 |
|---|---|
| `context_version` | exact receipt schema revision |
| `selection` | canonical `EvaluationSelection`，只含 exact IDs |
| `as_of` | Evolution 声明的 logical Evaluation Catalog cutoff；用于 membership/terminal/cohort reading，与 route snapshot token 分离 |
| `resolved_at` | response resolution 完成时间，仅供 operator diagnostic；不参与 membership、metric、ordering 或 causality reading |
| `task_population` | sorted Task IDs、optional display metadata、exact Delivery membership、event-time cohort coordinates、exclusion/terminal readings |
| `catalog` | exact Catalog coordinate、semantic digest、Observation dependency |
| `evidence_bindings` | Evidence Contract/profile/read-model coordinates；每次 route traversal 的 route、canonical filter、route-local snapshot/cursor coordinate、completion/error/expiry |
| `input_refs` | 实际进入 normalization/calculator 的 sorted exact Fact 与 Trace/Span identities，以及 accepted provenance refs |
| `population_state` | complete/partial/open/mixed/expired，保留具体 reason |

Receipt 是单次 response 的审计记录，不是 input manifest、持久 server resource、anti-forgery credential、deep-link requirement 或 cross-route transaction snapshot。BI 可展示/复制 receipt；重新打开 selection 时请求 current receipt。Stable IDs/coordinates 采用 bytewise canonical order；Evidence 返回数组顺序不携带语义。复用 published Evidence identities/digests，不新增 global snapshot digest 或 Oracle。

## 6. MetricResultSet 与 compare

- 每个成功解析的 side 必须恰好包含 14 个 published coordinates；单项 withheld 不影响其他 13 项。
- 每项分离 value truth、unit/compatibility、published numerator/denominator/contributing count、coverage、exclusion、missing input、provenance、uncertainty 与 forbidden reading。
- minimum sample 隐藏 value 时 coverage 仍可见。
- explicit zero、missing、lower bound、N/A、expired、incompatible 与 transport/service error 不得混同。
- Compare 分别解析 left/right；只有 coordinate、kind、unit 与 required compatibility 均匹配时才返回 Delta，否则返回 typed withheld reason。
- Before/After 是 Metric Result；Delta 是 Evolution 计算的 comparison result。

每个 `MetricResult` 使用 closed multi-slice shape：顶层只有 exact `metric` 与 canonical sorted `slices[]`；scalar metric 有一个 empty dimension-map slice，multi-output metric 按 exact outcome/stage/token direction/model-Role cohort/currency-source-basis key 分 slice。每个 slice 含 unique `slice_key`、closed truth `state`、可选 exact `value`、published `measures`、Catalog 声明的 numerator/denominator/contributing count、始终存在的 coverage 五字段、完整 compatibility、typed exclusions/missing、receipt provenance refs 与 reading limits。不得把 mixed slice truth 压成顶层 scalar。

`Delta` 在同一 metric coordinate 内按 exact published measure/slice key（如 outcome、stage、token direction、currency/source/cost-basis slice）对齐。兼容 slice 按 authoritative unit 计算 `delta = after - before`，并由符号得到 `INCREASE`/`DECREASE`/`NO_CHANGE`；不发布 percent change、rank、winner 或 good/bad。Ratio metric 可把同一 Evolution delta 标为 percentage points，BI 不另算。Unpaired、无 value 或 incompatible slice 只 withheld 该 slice，所有可用 Before/After slices 保留。

## 7. Exact numeric model

Calculator 使用 Python exact integer、money minor unit 与 `Decimal`。公共 decimal 使用 canonical decimal string；禁止 binary float、隐式 currency/unit conversion 与推断 precision。Ratio 保留 exact numerator/denominator；decimal expansion 声明 precision/rounding。

## 8. Calculator isolation

每个 metric coordinate 只映射一个纯 Python calculator module。Calculator 只消费 immutable normalized input slice，不访问 HTTP、Evidence、数据库、React、selection parser 或其他 metric implementation。Compare/delta 位于 calculator 外；无 runtime engine selector/fallback。

[`metric-computability.zh-CN.md`](metric-computability.zh-CN.md) 给出 14-calculator input/conformance matrix。首版 physical mapping 从 recorded Trace NODE 读取 native model-call duration 与 standard input/output token measurement，以 `(trace_id, span_id)` 做 per-call exact join；direct Usage/cost 仍来自 Fact。若当前 contract 不能把 Usage event 绑定到 exact model call，该 candidate unit 不能提供 call-attributed cost/source input；calculator 按 Catalog exact exclusion/coverage behavior 处理，其他 eligible units 仍可能产生 value。不能用 Delivery identity、timestamp 或 arrival order 修补。

## 9. Compatibility、error 与 conformance

错误按层级区分：

| Layer | 例子 | Response |
|---|---|---|
| Request | malformed JSON、unknown field/variant/version、empty/duplicate/over-limit Task set | bounded `400`，无 result；修正前不可 retry |
| Resolution side | Evidence transport failure、invalid cursor、incomplete traversal、Contract mismatch | 不得伪装 `UNAVAILABLE`，明确 retryability。SINGLE 失败或 COMPARE 两侧都失败时返回 bounded `502`/`503`；单侧失败返回 `PARTIAL_COMPARE`，保留成功 `side_result`、返回 typed `side_error`，并将全部 14 个 Delta coordinate entries 标为 `SIDE_UNRESOLVED`，因为失败侧 slice keys 未知 |
| Metric result | missing、lower bound、N/A、expired、sample insufficient、open/mixed Task、mixed unit/currency | HTTP success，保留 coordinate 与 typed truth/withheld reason；其他 metrics 继续 |
| Compare Delta | 一侧无 value 或 compatibility mismatch | 保留两侧，Delta typed withheld |

Metric truth closed enum 为 `AVAILABLE`、`LOWER_BOUND`、`NOT_APPLICABLE`、`UNAVAILABLE`、`EXPIRED`、`INCOMPATIBLE`；`SAMPLE_INSUFFICIENT` 是独立 value-withholding reason，coverage 仍发布。Request/upstream `ERROR` 不是 truth value；explicit zero 是 available value，绝不编码为 absence。

Coverage 始终按 Catalog 发布且不 gate eligible value；minimum sample 独立 withheld value。Mixed currency/unit/source/cost-basis 分离或 incompatible，禁止换算。Contract/API addition 除非进入新 exact revision，否则视为 incompatible；不以 SemVer range、alias 或 runtime fallback 选择实现。

Conformance 必须证明 14/14 registry、pure calculator boundary、相同 bound inputs 的 deterministic normalization、Decimal canonicalization、zero/absence、完整 pagination、受 expiry 约束的 final stability、Task open/mixed、compare incompatibility、no DB、no frontend formula。扩展现有 Evidence identity/conflict/pagination/completeness/retention/expiry fixtures，不新增 Task-specific 或 cross-route-snapshot Oracle 概念。
