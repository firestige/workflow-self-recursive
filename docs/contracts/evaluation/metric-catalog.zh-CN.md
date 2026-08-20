<a id="metric-catalog"></a>
# Metric Catalog（中文翻译）

> **HUMAN SPECIFICATION——不是 MACHINE SCHEMA。** 本文件以 human 术语解释现有 machine metric catalog schema `metric-catalog-0.1.0`，位于 [`contracts/evaluation/metric-catalog-0.1.0.schema.json`](../../../contracts/evaluation/metric-catalog-0.1.0.schema.json)。它不修改该 schema、不发明新 metric，也不添加或删除 machine-required field。它陈述与 [Observation Catalog](../observation/observation-catalog.md) 的 human-readable semantic link；这些 link 仅是 semantic correspondence，绝不是 machine binding，也绝不声称某个 human input reference 目前是 machine-required field。

<a id="metric-catalog-1"></a>
## 1. 元数据与权威性

| 字段 | 值 |
| --- | --- |
| 文档身份 | `evaluation.identity.001` |
| 状态 | `DRAFT_NOT_PUBLISHED`（`draft` machine schema 的 human explanatory companion） |
| 规范语言 | 英文 |
| Machine authority | [`contracts/evaluation/metric-catalog-0.1.0.schema.json`](../../../contracts/evaluation/metric-catalog-0.1.0.schema.json) 与 example instance [`contracts/examples/metric-catalog-0.1.0.json`](../../../contracts/examples/metric-catalog-0.1.0.json) |
| Semantic companion | [Observation Catalog](../observation/observation-catalog.md) |
| Representation companion | [OTel Observation Profile](../observation/otel-observation-profile.md)，proposed version `0.2.0` |
| Owner | `evidence-governance-owner`（example instance 的 `owner` 值；schema 只要求一个 non-empty string） |
| 翻译一致性义务 | English/Chinese anchors、headings、tables、IDs、fields、enums 与 links 保持成对，依据 [Concept `concept.acceptance.017`](../../agent-architecture.md) |

Machine schema 是 metric record *是什么* 的唯一权威。本文件是每个 field *意味着什么* 以及每个 metric 应如何阅读的唯一 human explanation。当本文件与 schema 不一致时，以 schema 为准。

<a id="metric-catalog-2"></a>
## 2. 目的与权威边界

Metric catalog 声明 evidence-governance owner 计算并发布的 measurement，每个都关联一个或多个 human evaluation question。Metric 由 accepted Observation fact 加 evaluation-level input 计算得出；它们是 presentation 与 governance artifact，本身不是 Observation fact。

本文件：

- 忠实解释每个 schema field 与每个 declared metric；
- 为每个 metric 陈述它引用哪些 Observation Catalog fact class 与 field，作为 human semantic link；
- 记录 catalog 自身强加的硬边界（无 score、无 backfill、无 causal claim、无 cross-context comparison）。

本文件不：

- 修改 schema 或 example instance；
- 添加 metric 或改变 metric 的 status、calculation、gate 或 ref；
- 声称某个 metric 的 `question_refs` 或 dimension 目前在 OTel Observation Profile 中是 machine-required field。

Machine schema 尚未把若干 intended constraint 编码为 machine rule——包括 §6 的 per-metric input reference、catalog 内 `metric_id` 唯一性，以及 `value_semantics.missing` 的 never-zero rule。编码它们是 deferred downstream obligation；在此之前，本文件与 schema 不一致处以 schema 为准，且本轮修订不改变 schema 或 example instance。

<a id="metric-catalog-3"></a>
## 3. Schema 字段语义

| Field | Machine shape | Human 含义 |
| --- | --- | --- |
| `metric_id` | identifier | stable metric identifier，catalog 内唯一 |
| `version` | `x.y.z` string | metric definition 自身的 version |
| `name` | non-empty string | human-readable metric name |
| `status` | `implemented` 或 `planned` | metric 是当前计算（`implemented`）还是声明留待后续计算（`planned`）；`implemented` 是 quarantined legacy implementation 声明，绝非 conformance |
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

`value_semantics` 可携带额外 property（`additionalProperties: true`）；本文件只解释 required 的 `kind`、`unit` 与 `missing` field。

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

Schema 的 example instance 精确声明 20 个 metric。下表是忠实的 human summary；machine instance 仍是 exact string 的权威。

| metric_id | v | status | kind / unit | evaluation unit | calculation (summary) | min sample / coverage | question refs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| configuration-utility-profile | 0.1.0 | implemented | state / multi-dimensional profile | 同一 comparable cohort 内一个 event-time configuration bundle 中的 terminal task | 将 success、adjusted failure、latency、repair、reopen、reroute、handoff、overhead、escalation、intervention、availability、cost 作为 separate measure 分别发布 | 20 / 0.8 | template-utility |
| configuration-component-comparison | 0.1.0 | implemented | count / changed components | same class/complexity/risk/cost basis/currency 中的 evidence-ready profile 对 | 对 topology、policy、routing、prompt、skill、model binding、execution binding 做 exact identity diff；发布 delta 而不做 causal claim | 20 / 0.8 | template-utility |
| model-role-utility-profile | 0.1.0 | implemented | state / multi-dimensional profile | 每个 role/responsibility 有一个 canonical provider/model/runtime attribution 的 terminal task | 将 outcome、adjusted failure、retry、repair、reopen、escalation、latency、token、cost、intervention、reviewer-finding validity 作为 separate measure 分别发布；仅在 evidence-ready peer 之间做 Pareto | 20 / 0.8 | model-role-cost-effectiveness |
| role-template-qualified-outcome-rate | 0.1.0 | planned | rate / ratio | 同一 comparable cohort 内一个 event-time role template 中的 terminal task | qualified-outcome task / eligible terminal task | 20 / 1.0 | template-utility |
| role-template-rework-rate | 0.1.0 | planned | rate / ratio | 一个 event-time role template 中的 implementation packet | 有 ≥1 个 attributable repair 的 packet / eligible packet | 20 / 1.0 | template-utility |
| role-template-trajectory-partial-cost | 0.1.0 | planned | money / source currency | 一个 event-time role template cohort 中的 delivery trajectory | linked same-currency attributable cost 的总和；coverage 报告 covered trajectory | 20 / 0.8 | template-utility |
| role-model-task-outcome-rate | 0.1.0 | implemented | rate / ratio | 有 authoritative work-model attribution 的 terminal task | 按 terminal outcome 的 task / eligible attributed terminal task | 20 / 1.0 | model-role-cost-effectiveness |
| packet-rework-rate | 0.1.0 | implemented | rate / ratio | governance 0.2 routed implementation packet | repair-started packet / eligible packet | 1 / 1.0 | model-role-cost-effectiveness, task-execution-workflow |
| packet-escalation-rate | 0.1.0 | implemented | rate / ratio | known initial lane 与 escalation state 的 packet | 有 recorded escalation 的 packet / known escalation state 的 packet | 1 / 1.0 | model-role-cost-effectiveness, task-execution-workflow |
| operational-latency-ms | 0.1.0 | implemented | duration / milliseconds | 有 host-reported duration 的 operational model call | eligible host-reported duration 的总和 / contributing call | 1 / 1.0 | model-role-cost-effectiveness, project-model-usage |
| trajectory-partial-cost | 0.1.0 | implemented | money / source currency | 有 linked host/provider-reported cost 的 delivery trajectory | linked same-currency cost 的总和 / covered trajectory | 20 / 0.8 | model-role-cost-effectiveness |
| task-cohort-comparison-eligibility | 0.1.0 | implemented | rate / ratio | defined task | eligible terminal task / defined task，exclusion reason 单独报告 | 20 / 1.0 | template-utility, model-role-cost-effectiveness, evidence-decision-readiness |
| delivery-stage-reach | 0.1.0 | implemented | rate / ratio | delivery trajectory | 有 direct stage fact 的 delivery / linked delivery | 1 / 1.0 | task-execution-workflow |
| delivery-terminal-outcome-rate | 0.1.0 | implemented | rate / ratio | explicitly terminated delivery trajectory | 按 terminal outcome 的 delivery / explicitly terminated delivery | 1 / 1.0 | task-execution-workflow |
| delivery-cycle-time-ms | 0.1.0 | implemented | duration / milliseconds | explicitly terminated delivery trajectory | eligible elapsed ms 的总和 / eligible terminated delivery | 1 / 1.0 | task-execution-workflow |
| operational-token-usage | 0.1.0 | implemented | quantity / tokens | 有 reported token usage 的 operational model call | like-for-like cohort 内 reported input/output/total token 的总和 | 1 / 1.0 | project-model-usage |
| operational-attributable-cost | 0.1.0 | implemented | money / source currency | 有 project-attributable reported cost 的 operational call | same-source same-unit eligible cost value 的总和 | 1 / 1.0 | project-model-usage |
| operational-usage-availability | 0.1.0 | implemented | rate / ratio | eligible operational model call | 有 explicit applicable usage source 的 call / eligible model call | 1 / 1.0 | project-model-usage, evidence-decision-readiness |
| configuration-reference-coverage | 0.1.0 | implemented | rate / ratio | eligible operational event | 有 event-time configuration reference 的 eligible event / eligible event | 1 / 1.0 | evidence-decision-readiness |
| direct-evidence-basis-rate | 0.1.0 | implemented | rate / ratio | eligible operational 或 delivery fact | 有 direct host/provider basis 的 fact / eligible fact | 1 / 1.0 | evidence-decision-readiness |

Catalog 内的 common exclusion：归因于 adjusted model/configuration quality 的 infrastructure-aborted 或 infrastructure-failure、requirement 或 upstream dependency change、declared cohort exclusion、estimated cost、unattributed billing、mixed currency、unavailable 或 not-applicable value、unsupported contract record，以及 open（non-terminal）delivery。Common eligibility：stable identity、event-time configuration/template known、comparable cohort、direct（host/provider）evidence，以及 money 的 same currency 与 cost basis。

<a id="metric-catalog-6"></a>
## 6. 与 Observation Catalog 的 Human Semantic 关联

这些是 metric 的输入与 [Observation Catalog](../observation/observation-catalog.md) 的 fact class / semantic field 之间的 **human semantic correspondence**。它们不是 machine binding：machine mapping 由 [OTel Observation Profile](../observation/otel-observation-profile.md) 拥有，且若干 metric input 是 evaluation-level concept，在首个 wire profile 中没有专用 machine-required field。

Delivery Summary 只提供 Delivery outcome。Terminal task outcome 是对一个或多个 Delivery fact 的 evaluation-level reading，不是与 Delivery outcome 相同的 fact。Delivery stage reach 与 Delivery cycle time 只依赖 quarantined legacy fact 或 evaluation-level input；首个 wire profile 没有 elapsed-time 或 stage-reach fact，因此本文件不得声称这些 measure 可由 first-profile Observation fact 计算。

| Metric input concept | Observation Catalog fact class / semantic field | Binding note |
| --- | --- | --- |
| terminal task outcome | Delivery Summary → Delivery outcome（仅 delivery-level input）；否则为 evaluation-level | terminal task outcome 不是 Delivery outcome；profile 只携带 Delivery outcome category，task terminal classification 没有 dedicated first-profile wire fact |
| delivery trajectory / terminal state | Delivery Summary → Delivery identity、Delivery outcome | explicit termination 是 Delivery outcome fact；open delivery 被排除 |
| task cohort / task identity | Delivery Summary → Task identity | task 是 grouping identity，绝不是 causality authority |
| task cohort / defined-task eligibility | Delivery Summary → Task identity（部分）；否则为 evaluation-level | profile 携带 task identity 与 terminal outcome；defined-task set 与 cohort comparability/eligibility gate 是 evaluation-level concept，没有 first-profile wire fact |
| role / responsibility | Role identity；writer/reviewer/recheck role identity | version-local Role identity；display name 不是 identity |
| model call / provider / runtime | recorded causal activity；Usage → Usage source、Usage source identity | model identity 是 activity-level；首个 profile 记录 call，而非 model-identity summary field |
| token usage | recorded causal activity token measurement | reported token measurement；absent 是 unavailable，绝不是 zero |
| native usage / cost | Usage → Usage kind、Usage unit、Usage value | money 仅在 minor unit 与 ISO currency 下；无 conversion 或 price inference |
| latency / cycle time | recorded causal activity duration；cycle time 否则仅为 evaluation-level 或 quarantined legacy | 首个 current profile 没有 Delivery Summary elapsed-time fact；不得声称 cycle time 可由 first-profile Observation fact 计算 |
| delivery stage reach | （evaluation-level concept；仅 quarantined legacy fact） | 首个 current profile 没有 stage-reach fact；不得声称 stage reach 可由 first-profile Observation fact 计算 |
| rework / repair | Review Finding → Fix-to-Finding edge；Finding status contribution | repair 记录 observed re-entry，绝不是 defect severity 或 causal fault |
| escalation / routing | （evaluation-level concept；无 first-profile wire fact） | 仅 human link——escalation 是 governance routing concept |
| reviewer finding validity | Review Finding → Finding summary、Finding status；Review Summary → Review observed count | validity 是对 accepted Finding fact 的 human judgment |
| structural coverage | Implementation Summary → Coverage dimension / covered / total / scope / tool / format | 每个 fact 一个 dimension；pair 绝不合并为 score |
| Fresh Reader result | System Design Summary → Fresh Reader result、Fresh Reader finding count | closed result category |
| deterministic verification | System Design Summary → Verification result、Verification passed/failed checks | closed result category |
| configuration bundle / reference | Workflow version / family schema（部分）；否则为 evaluation-level | profile 携带 workflow version 与 family，而非完整 configuration bundle；因此 configuration reference coverage 是 human/evaluation-level link |
| evidence basis (direct host/provider) | Usage → Usage source；recorded causal activity provenance | direct observation 证明 occurrence，而非 semantic correctness |

当某个 metric input 没有对应的 Observation Catalog field（configuration bundle content、model identity、routing/escalation、qualified outcome protocol、terminal task classification、cycle time、stage reach）时，该 link 声明为 human-only，且绝不呈现为 machine-required field。

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
