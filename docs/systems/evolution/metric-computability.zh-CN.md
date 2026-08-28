# Evolution Metric Computability — Iteration 5 候选（中文追踪）

> **状态：** Wave5 实现候选，2026-08-28。owner 已批准的 [Metric Catalog 2.0 评审候选](../../contracts/evaluation/metric-catalog-2-candidate.zh-CN.md) 是当前实现目标；2.0 完成 Contract 生命周期前，已发布 1.0.0 仍是不可变历史。本文只把候选的 12 个 coordinates 分配给 Evolution calculator/input slots，不发布 Contract。英文 companion：[`metric-computability.md`](metric-computability.md)。

## 1. Calculator 通用契约

每个 exact `metric_id@version` 恰好映射一个 Python module 与一个 pure calculator entry point。Resolution/normalization 在 calculator 外完成；calculator 只接收 immutable typed input slice，不能查询 Evidence、读取其他 metric、选择 engine 或 fallback 到另一算法。

每个成功解析 side 都返回全部 12 entries。Evolution 先通过 consumer-side Delivery population gate 解释 Evidence 现有 resource-granular expiry states：每个因 retention 不再 eligible 的 Delivery 及其 contained inputs，在形成 numerator、denominator、coverage 或 minimum-sample count 前退出当前 population。Task metric 只使用 active memberships；全部 membership 均因 retention 不再 eligible 的 Task 不进入 Task-metric counts。Otherwise active Delivery 即使 required input missing/invalid 也仍保持 eligible；该输入不进入受影响 metric 的 coverage numerator，其他 metric 继续。Evidence 因 retention 产生的 Trace-detail `PARTIAL` 不会变成 metric partial coverage。Receipt 保留完整 resolved membership/read set，并用 `EXPIRED_DELIVERY` 将该排除与 active missing reading 区分。该规则不新增 Evidence lifecycle API 或 physical GC behavior。Coverage/exclusion 按 `agentops.evaluation.metric-catalog@2.0.0` 评审候选持续发布。

共同禁止：按名称猜 Task membership；用 Trace closure 判 terminal；按 Delivery ID/time/arrival 绑定 model call；把 absent 当 zero；currency/unit conversion；估算 cost；合成 token total；把 Workflow 顺序当 recorded reach；因果或改进表述。

## 2. Physical input map

| Input reading | 首版 physical source | Exact binding/lifecycle |
|---|---|---|
| Task declaration/membership | accepted Evidence Task projection | exact `task_id`、explicit Delivery membership 与 Manifest digest、Evolution-declared logical `as_of`；不按名称推断 |
| admitted Workflow/Role configuration | exact Evidence Delivery Manifest projection；optional digest-matched Workflow source content 负责 validation/enrichment | Manifest 冻结 Snapshot + Role-prompt identity/digest 作为 event-time cohort；observed C30 选择该 coordinate。External bytes 不是公式真值输入；不使用 self-reported template Event、current checkout、source name 或 time inference |
| Delivery terminal/outcome/C55/C56 | Delivery Summary/Event typed Facts | exact `delivery_id`；open 保持 open；C55/C56 只读 direct field |
| repair relationship | typed Fact/relationship projection | exact recorded finding/fix identities，不按相邻关系推断 |
| model-call identity/tuple | recorded Trace NODE + matching attribution projection | exact `(trace_id, span_id)` + provider+C57 model+C30 Role+C06 Runtime；先应用 Delivery lifecycle gate，再形成 call units |
| native call duration | recorded Trace NODE | exact Span；不用 Delivery elapsed 或 BI timestamp subtraction |
| input/output tokens | recorded Trace NODE | exact Span；input/output 分离 |
| reported Usage | typed Usage Fact | exact kind/unit/value/source/source_id；metric-specific identity/tuple linkage 仍须精确 |

首版直接使用 existing Trace NODE 的 latency/token measurement。Selection-scoped Event Fact 只能通过其已记录的 native OTLP LogRecord Trace/Span context，以及该 Trace 的 accepted Delivery-root binding 与 Delivery 关联；Evidence 的 exact `delivery_id` Fact filter 完成此 lookup。Uncorrelated Event 留在该 Delivery reading 之外，并按对应 missingness/coverage rule 处理；Evolution 绝不用 C01、timestamp、arrival order、name 或 proximity 修补。若 Usage Fact 没有 exact Event-to-model-call binding，在同一 Delivery 多调用时不能精确归因；该 candidate unit 不能提供 call-attributed cost/source input，metric 按 Catalog coverage/exclusion rules 处理，其他 eligible units 仍可发布 value。禁止猜测。未来 exact call-binding projection 属于 contract alignment，不需要 cross-route transaction snapshot。

## 3. 12-calculator matrix

| Metric / Python slot | Kind/unit；min sample | Required input/join | Compatibility、withholding 与禁止解释 |
|---|---|---|---|
| `role-template-rework-rate@2.0.0` / `role_template_rework_rate.py` | rate/ratio；20 个 Delivery/template exposure | terminal Delivery；由 observed C30 选择的 exact Manifest-bound Snapshot/Role-prompt coordinate；recorded `FINDING_FIX` relationship | 每个 Delivery 对每个 exact template 计一次，同一 Task 的多个 Delivery 不合并；同一 Delivery 多次修复只计一次；完整 traversal 中没有 fix 是 covered zero；repair input unavailable 是 missing；expired input 退出 candidate population；无因果归因 |
| `role-template-trajectory-partial-cost@2.0.0` / `role_template_trajectory_partial_cost.py` | money/reported money unit；20 个 Delivery/template exposure | 同一 terminal Delivery/Manifest/Snapshot/observed-Role exposure + 同 Delivery reported money Usage | 只合并 exact kind/unit/source/source_id；不能仅因共享 Task 就合并另一 Delivery 的 Usage；不定价、不换算、不归因；只能称 partial recorded Usage，不能称 total cost |
| `role-model-task-outcome-rate@2.0.0` / `role_model_task_outcome_rate.py` | rate/ratio；20 | terminal Task + Catalog-required complete provider/model/Role/Runtime attribution | incomplete projection eligibility 与 open/mixed 严格按 Catalog 处理；每 outcome 与 exact cohort slice 一 numerator；不宣称 model causality |
| `operational-latency-ms@2.0.0` / `operational_latency_ms.py` | duration/ms；1 | Trace NODE native duration + exact Span 上 complete tuple | invalid duration/tuple 排除 call；发布 contributing count；不用 C55/timestamp/zero |
| `trajectory-partial-cost@2.0.0` / `trajectory_partial_cost.py` | money/reported money unit；20 | exact Delivery-linked reported money Usage | 只合并 exact kind/unit/source/source_id；缺失关联只降低本 metric coverage；不能标 total cost |
| `task-cohort-comparison-eligibility@2.0.0` / `task_cohort_comparison_eligibility.py` | rate/ratio；20 | selected defined Tasks + §6.2 classification | denominator 保留全部 defined Tasks；发布每个 exclusion；不重建 membership/cohort |
| `delivery-stage-reach@2.0.0` / `delivery_stage_reach.py` | rate/ratio；1 | terminal Delivery + direct C56 stage | 每 exact recorded stage 一 numerator；missing/invalid C56 降低本 metric coverage，且不证明 stage 未执行；不按 authored order 推断 |
| `delivery-terminal-outcome-rate@2.0.0` / `delivery_terminal_outcome_rate.py` | rate/ratio；1 | exact terminal Delivery outcome | 每 outcome 一 numerator；open 排除；不推断 Task outcome |
| `delivery-cycle-time-ms@2.0.0` / `delivery_cycle_time_ms.py` | duration/ms；1 | terminal Delivery + direct C55 | invalid/missing C55 排除；发布 contributing count；不用 timestamp/model latency |
| `operational-token-usage@2.0.0` / `operational_token_usage.py` | quantity/tokens；1 | Trace NODE input/output fields + exact Span tuple | 按 exact model/Role 分离 input/output；missing 排除；不合成 total |
| `operational-attributable-cost@2.0.0` / `operational_attributable_cost.py` | money/reported money unit；1 | reported money Usage + complete tuple + native Trace/Span exact Event-to-call binding | 只合并 exact model/Role/kind/unit/source/source_id；缺失精确绑定降低本 metric coverage；不按 Delivery/time join、不定价/估算/转换 |
| `operational-usage-availability@2.0.0` / `operational_usage_availability.py` | rate/ratio；1 | 所有 exact eligible attributed model calls；explicit applicable usage-source；complete tuple | 每个 eligible call 保留在 denominator；只有 explicit applicable source 进入 numerator；missing classification 同时反映在 coverage，不等于 zero token usage，也不自动使整个 metric unavailable |

Catalog 拥有 exact formula、内层 evaluation unit、numerator/denominator、minimum sample 与 coverage policy。Evolution 的 consumer-side Delivery population gate 不把 Task/model-call metric 改写成 Delivery metric，也不改变 Evidence retention；本文只拥有 Evolution module/input assignment 与 fail-closed physical reading。

## 4. Normalization 与 compare boundary

Resolver 对 stable IDs 做 bytewise canonical sort，验证 closed enum/revision，分离 compatibility coordinates，只转换 representation 而不转换 unit。Integer/money minor unit 保持 integer；decimal string 按声明 precision/rounding 转 `Decimal`；ratio numerator/denominator 保持 exact integer，ratio value 使用约分后的 canonical rational string；只有 BI 将百分数或小数显示值四舍五入到小数点后两位。

Calculator 不比较 sides。左右独立 12-item sets 形成后，comparison layer 对齐相同 metric coordinate，再按 exact candidate measure/slice key 对齐，并检查 Catalog 要求的 kind/unit/cohort/provider/runtime/Role/source/source_id。只有兼容 aligned slice 才按 authoritative unit 发布 `delta = after - before`；其他 slice typed withheld，所有可用 Before/After slices 保留。

## 5. Conformance matrix

复用并扩展 existing identity、duplicate/conflict、pagination、completeness、retention、expiry fixtures，证明：12 个 candidate slots 恰好各一次；两个 removed coordinate 及 alias 均不可调用；zero/absence 分离；每个 metric/slice 独立发布 coverage；minimum sample withheld value 但不隐藏 coverage；open/mixed Task fail closed；per-call join 只用 exact Span；mixed Usage coordinates 不合并；增加 expired Delivery 不改变 value/numerator/denominator/coverage/sample count；增加 active 且 required input missing/invalid 的 Delivery 只形成 applicable coverage gap；all-expired population 返回 `NO_POPULATION`；单 metric unavailable 不使 set 失败；incompatible sides 无 Delta；calculator 不导入 HTTP、DB、frontend、其他 calculator 或 engine selector。
