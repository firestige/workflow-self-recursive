<a id="metric-catalog"></a>
# Metric Catalog（中文翻译）

> **HUMAN SPECIFICATION——不是 MACHINE SCHEMA。** 本文件定义 MVP 15-metric Evaluation Catalog 的 human semantics。Metric-catalog machine schema 与 example instance 目前不存在；创建并验证该 representation 归 issue #44。与 [Observation Catalog](../observation/observation-catalog.md) 的 semantic link 是 human correspondence，绝不是 machine binding。

<a id="metric-catalog-1"></a>
## 1. 元数据与权威性

| 字段 | 值 |
| --- | --- |
| 文档身份 | `evaluation.identity.001` |
| 状态 | `DRAFT_NOT_PUBLISHED` |
| 规范语言 | 英文 |
| Machine companion | 不存在；issue #44 拥有未来 `system-contracts/evaluation/` schema、example 与 validator |
| Semantic companion | [Observation Catalog](../observation/observation-catalog.md) |
| Representation companion | [OTel Observation Profile](../observation/otel-observation-profile.md)，proposed version `0.3.0` |
| Owner | `evidence-governance-owner` |
| 翻译一致性义务 | English/Chinese anchors、headings、tables、IDs、fields、enums 与 links 保持成对，依据 [Concept `concept.acceptance.017`](../../agent-architecture.md) |

本文件是每个 field 与 metric *意味着什么*、以及应如何阅读的 semantic authority。未来 machine companion 必须编码这些 semantics；不一致属于 representation defect，不得静默重定义本文件。

<a id="metric-catalog-2"></a>
## 2. 目的与权威边界

Metric catalog 声明 evidence-governance owner 计算并发布的 measurement，每个都关联一个或多个 human evaluation question。Metric 由 accepted Observation fact 加 evaluation-level input 计算得出；它们是 presentation 与 governance artifact，本身不是 Observation fact。

本文件：

- 定义每个 target schema field 与 15 个 declared metric；
- 为每个 metric 陈述它引用哪些 Observation Catalog fact class 与 field，作为 human semantic link；
- 拥有 metric formula、reading rule、sample/coverage gate 与 evaluation-level cohort/task reading；
- 记录 catalog 自身强加的硬边界（无 score、无 backfill、无 causal claim、无 cross-context comparison）。

本文件不：

- 发布 machine schema、example、validator、implementation 或 conformance claim；
- 重定义 Observation fact、wire field、Admission 或 Projection compatibility key；
- 实现 Projection-owned fact eligibility 或 BI rendering；或
- 把 `question_refs`、evaluation cohort 或 formula 变成 Observation field。

Issue #44 必须把这份 15-metric catalog 机器编码，包括 per-metric input reference、catalog-wide `metric_id` uniqueness 与 `value_semantics.missing` never-zero rule。该工作存在前，任何 file 或 legacy implementation 都不得声称 machine authority 或 conformance。

<a id="metric-catalog-3"></a>
## 3. Schema 字段语义

| Field | Target machine shape | Human 含义 |
| --- | --- | --- |
| `metric_id` | identifier | stable metric identifier，catalog 内唯一 |
| `version` | `x.y.z` string | metric definition 自身的 version |
| `name` | non-empty string | human-readable metric name |
| `status` | `implemented` 或 `planned` | 仅为 descriptive legacy readiness；任一值都不证明当前 implementation 或 conformance |
| `question_refs` | 一个或多个 `{question_id, version}` | 该 metric 所服务的 human evaluation question；它们引用 Question Catalog，而非 Observation fact |
| `evaluation_unit` | non-empty string | metric 计算所针对的分析单元（task、packet、trajectory、call、fact、event） |
| `value_semantics.kind` | `rate`、`count`、`duration`、`quantity`、`money` 或 `state` | metric 发布的 value 种类 |
| `value_semantics.unit` | non-empty string | value 的 unit |
| `value_semantics.missing` | non-empty string | metric 表达不可用性的方式；始终为 “N/A when …”，绝不是 zero |
| `dimensions` | unique string array | consumer 可据以切分的 grouping axis |
| `filters` | unique string array | 约束哪些 record 进入 metric 的条件 |
| `time_window` | non-empty string | metric 计算的时间范围与 event-time/as-of semantics |
| `calculation` | non-empty string | 精确 computation，包括哪些内容作为 separate measure 发布 |
| `eligibility` | 一个或多个 string | record 进入 numerator 或 denominator 必须满足的 positive condition |
| `exclusions` | string array | 将 record 从 metric 移除的条件 |
| `minimum_sample` | integer ≥ 1 | eligible unit 的最小数量，低于该数量 metric 不发布 |
| `minimum_coverage` | number in [0,1] | minimum field/evidence coverage，低于该值 metric 不发布 |
| `uncertainty` | 一个或多个 string | 陈述的 limitation 与 interval |
| `forbidden_inference` | 一个或多个 string | metric 不得被用于得出的 conclusion |
| `owner` | non-empty string | 对 metric 负责的一方 |

未来 schema 可增加 bounded representation metadata，但不得削弱 `kind`、`unit` 或 `missing` 的 required meaning，也不得接纳 arbitrary semantic extension。

<a id="metric-catalog-4"></a>
## 4. Metric Value Kind

| Kind | 含义 | 典型 unit | Missing rule |
| --- | --- | --- | --- |
| `rate` | 满足某条件的 eligible unit 的比率 | `ratio` | 无 eligible unit 时为 N/A |
| `count` | changed 或 observed item 的精确 integer count | 例如 `changed components` | identity 不可用时为 N/A |
| `duration` | elapsed time measurement | `milliseconds` | start 或 end 不可用时为 N/A；unavailable 绝不是 zero |
| `quantity` | reported quantity 的总和 | `tokens` | 不可用时为 N/A；unavailable 绝不是 zero |
| `money` | reported cost 的 same-currency 总和 | source currency | 无可归属 same-currency cost 时为 N/A |
| `state` | 作为 separate measure 发布的 multi-dimensional profile | 例如 `multi-dimensional profile` | 每个 measure 单独 N/A；每个 measure 保留自己的 sample/coverage/unit |

Rate 报告 numerator 与 denominator。`money` 与 `quantity` metric 绝不隐式转换 currency 或 unit。`state` metric 分别发布多个 measure，绝不折叠为单一 score。

<a id="metric-catalog-5"></a>
## 5. 已声明 Metric

MVP catalog 精确声明 15 个 metric。`Definition class` 记录每个 metric 依据 issue #43 scope decision 存活的原因：`DIRECT` 使用已有 declared fact，`B_TASK_READING` 使用 §6.2 的 task reading，`A_PROFILE_0.3` 使用 issue #61 闭合的 Observation Profile `0.3.0` 输入。它是 documentation audit column，不是 implementation status 或 target machine-schema field。

| metric_id | v | definition class | kind / unit | evaluation unit | calculation | min sample / coverage | question refs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| model-role-utility-profile | 0.1.0 | A_PROFILE_0.3 | state / multi-dimensional profile | 每个 contributing call 都有一个 complete canonical provider/model/Role/Runtime attribution tuple 的 terminal task | 将 outcome、adjusted failure、retry、repair、reopen、latency、token、cost、intervention 与 reviewer-finding validity 作为 separate measure；每个 measure 保留自己的 eligibility、sample、coverage 与 unit；只在 evidence-ready peer 间做 Pareto | 20 / 0.8 | model-role-cost-effectiveness |
| role-template-rework-rate | 0.1.0 | B_TASK_READING | rate / ratio | 一个 event-time role-template cohort 内的 eligible terminal task | 至少有一个 linked attributable repair 的 terminal task / eligible terminal task；发布 numerator 与 denominator | 20 / 1.0 | template-utility |
| role-template-trajectory-partial-cost | 0.1.0 | B_TASK_READING | money / source currency | 一个 event-time role-template cohort 内的 eligible terminal task trajectory | 对 covered task trajectory 的 linked provider/host-reported cost 求和，按 exact currency/source/cost basis 分开；发布 coverage | 20 / 0.8 | template-utility |
| role-model-task-outcome-rate | 0.1.0 | DIRECT | rate / ratio | 有 complete canonical model-role attribution 的 eligible terminal task | 每个 unique task-outcome category 中的 task / eligible attributed terminal task；每类发布 numerator 与 denominator | 20 / 1.0 | model-role-cost-effectiveness |
| packet-rework-rate | 0.1.0 | DIRECT | rate / ratio | governance `0.2` implementation packet | 至少有一个 linked attributable repair 的 packet / eligible packet；发布 numerator 与 denominator | 1 / 1.0 | task-execution-workflow |
| operational-latency-ms | 0.1.0 | A_PROFILE_0.3 | duration / milliseconds | 有 native host-reported Span duration 的 operational model call | eligible call duration 总和 / contributing call；同时发布 contributing-call count | 1 / 1.0 | model-role-cost-effectiveness, project-model-usage |
| trajectory-partial-cost | 0.1.0 | DIRECT | money / source currency | 有 linked host/provider-reported cost 的 Delivery trajectory | 按 exact source、unit/currency 与 cost basis 分开求 linked cost 总和 / covered trajectory；发布 coverage | 20 / 0.8 | model-role-cost-effectiveness |
| task-cohort-comparison-eligibility | 0.1.0 | B_TASK_READING | rate / ratio | declared defined-task snapshot 中的 task | comparable eligible terminal task / defined task；分别发布每个 exclusion reason | 20 / 1.0 | evidence-decision-readiness |
| delivery-stage-reach | 0.1.0 | A_PROFILE_0.3 | rate / ratio | Delivery trajectory | 有 direct C56 reached-stage fact 的 Delivery / linked terminal Delivery；把 exact stage identity 作为 separate dimension 发布 | 1 / 1.0 | task-execution-workflow |
| delivery-terminal-outcome-rate | 0.1.0 | DIRECT | rate / ratio | explicitly terminated Delivery trajectory | 每个 recorded terminal outcome 中的 Delivery / explicitly terminated Delivery；每个 outcome 发布 numerator 与 denominator | 1 / 1.0 | task-execution-workflow |
| delivery-cycle-time-ms | 0.1.0 | A_PROFILE_0.3 | duration / milliseconds | 有 direct C55 elapsed time 的 explicitly terminated Delivery | eligible C55 millisecond 总和 / contributing terminal Delivery；同时发布 contributing-Delivery count | 1 / 1.0 | task-execution-workflow |
| operational-token-usage | 0.1.0 | DIRECT | quantity / tokens | 有 reported standard token usage 的 operational model call | identical cohort 内分别求 reported input/output token measure 总和；发布 coverage；total token absent 时不 synthesize | 1 / 1.0 | project-model-usage |
| operational-attributable-cost | 0.1.0 | DIRECT | money / source currency | 有 linked provider/host-reported project-attributable cost 的 operational call | 只求 exact same-source、same-unit/currency 与 same-cost-basis value 总和；发布 coverage | 1 / 1.0 | project-model-usage |
| operational-usage-availability | 0.1.0 | DIRECT | rate / ratio | eligible operational model call | 有 explicit applicable usage source 的 call / eligible model call；发布 numerator 与 denominator | 1 / 1.0 | project-model-usage, evidence-decision-readiness |
| direct-evidence-basis-rate | 0.1.0 | DIRECT | rate / ratio | eligible operational 或 Delivery fact | 有 direct accepted host/provider basis 的 fact / eligible fact；发布 numerator 与 denominator | 1 / 1.0 | evidence-decision-readiness |

移除的五个 metric 是 `configuration-utility-profile`、`configuration-component-comparison`、`configuration-reference-coverage`、`packet-escalation-rate` 与 `role-template-qualified-outcome-rate`。它们依赖 MVP 未定义的 C/D-class configuration、routing/escalation 或 qualified-outcome semantics；consumer 不得把它们保留为 hidden measure 或 alias。

Catalog common exclusion：归因到 adjusted model 或 template quality 的 infrastructure abort/failure；requirement 或 upstream dependency change；declared cohort exclusion；estimated 或 unattributed cost；mixed currency/unit/cost basis；unavailable 或 not-applicable value；unsupported contract record；incomplete attribution tuple；mixed task outcome；以及 open/non-terminal Delivery。Common eligibility：stable identity、需要时的 exact event-time assignment、complete Projection-owned compatibility/eligibility attribute、comparable cohort、direct accepted host/provider evidence，以及 money 的 exact currency/source/cost basis。

<a id="metric-catalog-6"></a>
## 6. 与 Observation Catalog 的 Human Semantic 关联

这些是 metric input 与 [Observation Catalog](../observation/observation-catalog.md) fact class / semantic field 之间的 **human semantic correspondence**。它们不是 machine binding：exact representation 由 proposed [OTel Observation Profile `0.3.0`](../observation/otel-observation-profile.md) 拥有，evaluation-level task/cohort reading 仍由本文件拥有。

| Metric input concept | Observation Catalog fact class / semantic field | Binding note |
| --- | --- | --- |
| terminal task outcome | Delivery Summary → Task identity、Delivery identity、Delivery outcome | task outcome 是 §6.2 的 fail-closed evaluation reading，绝不是新 Observation fact |
| delivery trajectory / terminal state | Delivery Summary → Delivery identity、Delivery outcome | explicit termination 是 Delivery outcome fact；open delivery 被排除 |
| task cohort / task identity | Delivery Summary → Task identity | task 是 exact grouping identity，绝不是 causality 或 ordering authority |
| task cohort / defined-task eligibility | Task identity 加 immutable evaluation-level defined-task/membership/cohort snapshot | snapshot 不是 Observation field；缺少它就不得声称 defined-task denominator 或 open-Delivery exclusion |
| role / responsibility | Role identity；writer/reviewer/recheck role identity | version-local Role identity；display name 不是 identity |
| model call / provider / runtime | recorded model-call activity 加 canonical model identity 与 model-to-Role attribution | 使用 complete provider+C57+C30+C06+Span tuple；无 free-form/list summary 或 alias inference |
| token usage | recorded causal activity token measurement | reported token measurement；absent 是 unavailable，绝不是 zero |
| native usage / cost | Usage → Usage kind、Usage unit、Usage value | money 仅在 minor unit 与 ISO currency 下；无 conversion 或 price inference |
| operational latency | recorded model-call activity native Span duration | direct host-reported call duration；不同于 Delivery elapsed time |
| Delivery cycle time | Delivery Summary → Delivery elapsed time | direct C55 millisecond；absence 是 unavailable，绝不是 zero |
| Delivery stage reach | Delivery Summary → Delivery stage reached | direct C56 exact Workflow stage identity；不解析 name 或推断 order |
| rework / repair | Review Finding → Fix-to-Finding edge；Finding status contribution | repair 记录 observed re-entry，绝不是 defect severity 或 causal fault |
| reviewer finding validity | Review Finding → Finding summary、Finding status；Review Summary → Review observed count | validity 是对 accepted Finding fact 的 human judgment |
| structural coverage | Implementation Summary → Coverage dimension / covered / total / scope / tool / format | 每个 fact 一个 dimension；pair 绝不合并为 score |
| Fresh Reader result | System Design Summary → Fresh Reader result、Fresh Reader finding count | closed result category |
| deterministic verification | System Design Summary → Verification result、Verification passed/failed checks | closed result category |
| evidence basis (direct host/provider) | Usage → Usage source；recorded causal activity provenance | direct observation 证明 occurrence，而非 semantic correctness |

### 6.1 A-class Profile `0.3.0` 输入

四个 A-class metric 仅在以下 exact input 下 definition-ready：

| Metric | Required direct input | Fail-closed missing rule |
| --- | --- | --- |
| `operational-latency-ms` | native model-call Span duration | absent/invalid duration 排除该 call；绝不以 C55 或 zero 替代 |
| `delivery-cycle-time-ms` | Delivery Summary C55 elapsed millisecond | absent C55 把该 Delivery 排除出 duration numerator 与 contributing count；绝不从 arrival time 推导 |
| `delivery-stage-reach` | Delivery Summary C56 exact reached-stage identity | absent C56 把该 Delivery 排除出 reached-stage numerator；绝不从 workflow order 或 text 推断 stage |
| `model-role-utility-profile` | complete provider+C57 canonical model+C30 Role+C06 Runtime+Span identity tuple | 任一 coordinate 缺失都使 attribution unavailable；绝不从 display name、alias、仅 ancestry 或 summary body 补齐 |

### 6.2 B-class terminal-task 与 cohort 读法

Task terminal state 是 evaluation reading，不是 Observation fact。它在一个 declared as-of cutoff 上按以下方式计算：

1. Evaluation owner 提供一个 immutable **defined-task snapshot**，包含 exact Task identity、explicit Delivery membership、event-time cohort coordinate 与 cutoff。该 snapshot 是 evaluation-level input；绝不从后来的 fact backfill。
2. 每个 declared Delivery member 只通过 exact Delivery 与 Task identity join。Cutoff 时没有 accepted terminal Delivery Summary 的 member 是 open/non-terminal；整个 task 对 terminal-task metric 不 eligible，并取得 exclusion reason `OPEN_DELIVERY`。
3. 若 task 的所有 declared member 都有 terminal summary，则收集 exact recorded outcome。所有 outcome identical 时，该值是唯一 terminal task outcome；value 不同时不推断 chronology 或 winner，task 取得 `MIXED_DELIVERY_OUTCOMES`，并从 outcome numerator 与 eligible-terminal denominator 排除。
4. 缺少 exact membership、Task identity 或 required cohort coordinate 的 task 分别取得 `UNDEFINED_TASK_MEMBERSHIP`、`MISSING_TASK_IDENTITY` 或 `INCOMPLETE_COHORT_COORDINATES`；absence 绝不重建。
5. Comparable cohort 要求 metric 声明的每个 dimension/filter exact equal，包括 applicable 时的 event-time role-template assignment 与 provider/Runtime/currency/cost-basis coordinate。Cross-context value 保持分离。

`task-cohort-comparison-eligibility` 以 immutable defined-task snapshot 的所有 task 为 denominator，以通过规则 2–5 的 task 为 numerator，并分别发布每个 exclusion reason。其他 terminal-task metric 只把 passing set 作为 eligible denominator。这使 excluded/open task 不会从 eligibility coverage 中消失，同时不进入 outcome、cost 与 rework formula。

### 6.3 Formula 与 Projection eligibility 归属

本 Catalog 拥有 metric formula：evaluation unit、numerator/denominator 或 separate measure、required projected attribute、exclusion、sample/coverage gate 与 forbidden inference。`evidence.projection` 拥有从 accepted fact 派生的 fact-level compatibility key 与 eligibility attribute。Evaluation 消费这些 attribute，但不得 repair 或 override；Projection 不得定义 Metric formula；BI 不得改变任一层。

### 6.4 Per-metric input 与 eligibility map

| Metric | Required projected/evaluation input | Metric-level eligibility and exclusions |
| --- | --- | --- |
| `model-role-utility-profile` | complete model-role tuple；unique terminal task outcome；linked duration/usage/repair/intervention/review fact | 每个 available measure 分别发布；排除 incomplete tuple、mixed/open task 与 incompatible cohort；一个 unavailable measure 绝不成为 zero，也不阻塞 unrelated measure |
| `role-template-rework-rate` | defined-task snapshot；exact event-time role template；unique terminal task outcome；linked repair | 排除 open/mixed/undefined task 与 backfilled/missing template assignment |
| `role-template-trajectory-partial-cost` | 相同 task/template input 加 linked direct cost | 排除 mixed currency/source/cost basis、estimated/unattributed cost 与 insufficient coverage |
| `role-model-task-outcome-rate` | unique terminal task outcome 加 complete model-role tuple | 排除 open/mixed task 与 incomplete attribution；在一个 eligible denominator 上每个 outcome 发布一个 numerator |
| `packet-rework-rate` | exact packet identity 与 linked repair | 排除 missing packet/repair identity 与 unsupported governance version |
| `operational-latency-ms` | native model-call Span duration | 排除 absent/invalid duration 与 incompatible provider/Runtime cohort |
| `trajectory-partial-cost` | exact Delivery linkage 与 direct reported cost | 排除 estimated/unattributed 或 incompatible currency/source/cost basis；发布 coverage |
| `task-cohort-comparison-eligibility` | immutable defined-task snapshot 与 §6.2 classification | denominator 包含每个 defined task；numerator 只含 comparable eligible terminal task；发布 exclusion |
| `delivery-stage-reach` | terminal Delivery identity 与 C56 | denominator 是 linked terminal Delivery；absent/invalid C56 不是 reached stage |
| `delivery-terminal-outcome-rate` | terminal Delivery identity 与 exact outcome | 每个 outcome 在 terminal Delivery 上一个 numerator；无 task-level inference |
| `delivery-cycle-time-ms` | terminal Delivery identity 与 C55 | 排除 absent/invalid C55；发布 contributing count |
| `operational-token-usage` | standard reported input/output token measurement | input/output 保持分离；排除 absent/incompatible measurement；绝不 synthesize missing total |
| `operational-attributable-cost` | direct linked project-attributable cost | 只允许 exact source/unit/currency/cost basis；无 estimate 或 conversion |
| `operational-usage-availability` | eligible model-call identity 与 explicit applicable usage source | denominator 保留 missing usage 的 eligible call；numerator 要求 explicit source；missing 不是 zero usage |
| `direct-evidence-basis-rate` | eligible fact identity 与 accepted host/provider provenance | direct basis 只证明 occurrence；unsupported 或 inferred provenance 被排除 |

<a id="metric-catalog-7"></a>
## 7. 阅读规则与禁止性主张

- **绝不把 separate measure 折叠为 score。** `state` metric 发布多个 measure；rate 发布 numerator 与 denominator。
- **绝不 backfill。** Event-time configuration/template assignment 绝不应用到历史 fact。
- **无 causal claim。** Outcome、cost 与 latency delta 是描述性的；single-component change 只允许 association language；multi-component change 只允许 bundle-level。
- **无 cross-context comparison。** Metric 在 role、task cohort、event-time configuration、provider/runtime boundary、cost basis 或 currency 之间不可比。
- **Partial 不是 total。** `money` 与 `quantity` metric 是 partial attributable value；绝不标记为 total cost 或 total usage。
- **Missing 绝不是 zero。** 每个 metric 的 `value_semantics.missing` 陈述一个 N/A condition；unavailability 不是 zero，也不是 completeness claim。
- **Sample 与 coverage gate 是硬的。** Metric 低于其 `minimum_sample` 或 `minimum_coverage` 时不发布。
- **Human ref 不是 machine field。** `question_refs` 与若干 dimension 是 human/evaluation reference；machine-required Observation field 仅由 [OTel Observation Profile](../observation/otel-observation-profile.md) 拥有。
