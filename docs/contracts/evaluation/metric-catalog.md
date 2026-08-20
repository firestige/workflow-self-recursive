<a id="metric-catalog"></a>
# Metric Catalog

> **HUMAN SPECIFICATION — NOT A MACHINE SCHEMA.** This document explains, in human terms, the existing machine metric catalog schema `metric-catalog-0.1.0` at [`contracts/evaluation/metric-catalog-0.1.0.schema.json`](../../../contracts/evaluation/metric-catalog-0.1.0.schema.json). It does not modify that schema, does not invent new metrics, and does not add or remove machine-required fields. It states human-readable semantic links to the [Observation Catalog](../observation/observation-catalog.md); those links are semantic correspondences only, never a machine binding, and never a claim that a human input reference is currently a machine-required field.

<a id="metric-catalog-1"></a>
## 1. Metadata and Authority

| Field | Value |
| --- | --- |
| Document identity | `evaluation.identity.001` |
| Status | `DRAFT_NOT_PUBLISHED` (human explanatory companion to the `draft` machine schema) |
| Normative language | English |
| Machine authority | [`contracts/evaluation/metric-catalog-0.1.0.schema.json`](../../../contracts/evaluation/metric-catalog-0.1.0.schema.json) and the example instance [`contracts/examples/metric-catalog-0.1.0.json`](../../../contracts/examples/metric-catalog-0.1.0.json) |
| Semantic companion | [Observation Catalog](../observation/observation-catalog.md) |
| Representation companion | [OTel Observation Profile](../observation/otel-observation-profile.md), proposed version `0.2.0` |
| Owner | `evidence-governance-owner` (the example instance's `owner` value; the schema requires only a non-empty string) |
| Translation parity obligation | English/Chinese anchors, headings, tables, IDs, fields, enums and links are paired, per [Concept `concept.acceptance.017`](../../agent-architecture.md) |

The machine schema is the sole authority for what a metric record *is*. This document is the sole human explanation of what each field *means* and how each metric is intended to be read. When this document and the schema disagree, the schema wins.

<a id="metric-catalog-2"></a>
## 2. Purpose and Authority Boundary

The metric catalog declares the measurements an evidence-governance owner computes and publishes, each tied to one or more human evaluation questions. Metrics are computed from accepted Observation facts plus evaluation-level inputs; they are presentation and governance artifacts, not Observation facts themselves.

This document:

- explains each schema field and each declared metric faithfully;
- states, per metric, which Observation Catalog fact classes and fields it draws on, as human semantic links;
- records the hard boundaries the catalog itself imposes (no scores, no backfill, no causal claims, no cross-context comparison).

This document does not:

- alter the schema or the example instance;
- add metrics or change a metric's status, calculation, gates, or refs;
- claim that a metric's `question_refs` or dimensions are currently machine-required fields in the OTel Observation Profile.

The machine schema has not yet encoded several intended constraints — including the per-metric input references of §6, `metric_id` uniqueness within the catalog, and the `value_semantics.missing` never-zero rule — as machine rules. Encoding them is a deferred downstream obligation; until then the schema wins wherever it and this document disagree, and this revision does not change the schema or the example instance.

<a id="metric-catalog-3"></a>
## 3. Schema Field Semantics

| Field | Machine shape | Human meaning |
| --- | --- | --- |
| `metric_id` | identifier | stable metric identifier, unique within the catalog |
| `version` | `x.y.z` string | the metric definition's own version |
| `name` | non-empty string | human-readable metric name |
| `status` | `implemented` or `planned` | whether the metric is currently computed (`implemented`) or declared for later computation (`planned`); `implemented` is a quarantined legacy implementation declaration, never conformance |
| `question_refs` | one or more `{question_id, version}` | the human evaluation question(s) this metric serves; these reference the Question Catalog, not Observation facts |
| `evaluation_unit` | non-empty string | the unit of analysis the metric is computed over (task, packet, trajectory, call, fact, event) |
| `value_semantics.kind` | `rate`, `count`, `duration`, `quantity`, `money`, or `state` | the kind of value the metric publishes |
| `value_semantics.unit` | non-empty string | the value's unit |
| `value_semantics.missing` | non-empty string | how the metric expresses unavailability; always "N/A when …", never a zero |
| `dimensions` | unique string array | the grouping axes a consumer may slice by |
| `filters` | unique string array | the conditions that constrain which records enter the metric |
| `time_window` | non-empty string | the time frame and event-time/as-of semantics over which the metric is computed |
| `calculation` | non-empty string | the exact computation, including what is published as separate measures |
| `eligibility` | one or more strings | the positive conditions a record must meet to enter the numerator or denominator |
| `exclusions` | string array | the conditions that remove a record from the metric |
| `minimum_sample` | integer ≥ 1 | the minimum number of eligible units below which the metric is not published |
| `minimum_coverage` | number in [0,1] | the minimum field/evidence coverage below which the metric is not published |
| `uncertainty` | one or more strings | the stated limitations and intervals |
| `forbidden_inference` | one or more strings | the conclusions the metric must not be used to draw |
| `owner` | non-empty string | the party responsible for the metric |

`value_semantics` may carry additional properties (`additionalProperties: true`); this document explains only the required `kind`, `unit`, and `missing` fields.

<a id="metric-catalog-4"></a>
## 4. Metric Value Kinds

| Kind | Meaning | Typical unit | Missing rule |
| --- | --- | --- | --- |
| `rate` | a ratio of eligible units meeting a condition | `ratio` | N/A when no eligible units exist |
| `count` | an exact integer count of changed or observed items | e.g. `changed components` | N/A when identity is unavailable |
| `duration` | an elapsed time measurement | `milliseconds` | N/A when start or end is unavailable; unavailable is never zero |
| `quantity` | a sum of reported quantities | `tokens` | N/A when unavailable; unavailable is never zero |
| `money` | a same-currency sum of reported cost | source currency | N/A when no attributable same-currency cost |
| `state` | a multi-dimensional profile published as separate measures | e.g. `multi-dimensional profile` | N/A per measure; each measure keeps its own sample/coverage/unit |

Rates report numerator and denominator. `money` and `quantity` metrics never convert currencies or units implicitly. `state` metrics publish many measures separately and never collapse them into one score.

<a id="metric-catalog-5"></a>
## 5. Declared Metrics

The schema's example instance declares exactly 20 metrics. The table is a faithful human summary; the machine instance remains authoritative for exact strings.

| metric_id | v | status | kind / unit | evaluation unit | calculation (summary) | min sample / coverage | question refs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| configuration-utility-profile | 0.1.0 | implemented | state / multi-dimensional profile | terminal task in one event-time configuration bundle within a comparable cohort | publish success, adjusted failure, latency, repair, reopen, reroute, handoff, overhead, escalation, intervention, availability, cost as separate measures | 20 / 0.8 | template-utility |
| configuration-component-comparison | 0.1.0 | implemented | count / changed components | pair of evidence-ready profiles in same class/complexity/risk/cost basis/currency | exact identity diff across topology, policy, routing, prompts, skills, model binding, execution binding; publish deltas without causal claim | 20 / 0.8 | template-utility |
| model-role-utility-profile | 0.1.0 | implemented | state / multi-dimensional profile | terminal task with one canonical provider/model/runtime attribution per role/responsibility | publish outcome, adjusted failure, retry, repair, reopen, escalation, latency, token, cost, intervention, reviewer-finding validity as separate measures; Pareto only among evidence-ready peers | 20 / 0.8 | model-role-cost-effectiveness |
| role-template-qualified-outcome-rate | 0.1.0 | planned | rate / ratio | terminal task in one event-time role template within a comparable cohort | qualified-outcome tasks / eligible terminal tasks | 20 / 1.0 | template-utility |
| role-template-rework-rate | 0.1.0 | planned | rate / ratio | implementation packet in one event-time role template | packets with ≥1 attributable repair / eligible packets | 20 / 1.0 | template-utility |
| role-template-trajectory-partial-cost | 0.1.0 | planned | money / source currency | delivery trajectory in one event-time role template cohort | sum of linked same-currency attributable cost; coverage reports covered trajectories | 20 / 0.8 | template-utility |
| role-model-task-outcome-rate | 0.1.0 | implemented | rate / ratio | terminal task with authoritative work-model attribution | tasks per terminal outcome / eligible attributed terminal tasks | 20 / 1.0 | model-role-cost-effectiveness |
| packet-rework-rate | 0.1.0 | implemented | rate / ratio | governance 0.2 routed implementation packet | packets with repair-started / eligible packets | 1 / 1.0 | model-role-cost-effectiveness, task-execution-workflow |
| packet-escalation-rate | 0.1.0 | implemented | rate / ratio | packet with known initial lane and escalation state | packets with recorded escalation / packets with known escalation state | 1 / 1.0 | model-role-cost-effectiveness, task-execution-workflow |
| operational-latency-ms | 0.1.0 | implemented | duration / milliseconds | operational model call with host-reported duration | sum of eligible host-reported duration / contributing calls | 1 / 1.0 | model-role-cost-effectiveness, project-model-usage |
| trajectory-partial-cost | 0.1.0 | implemented | money / source currency | delivery trajectory with linked host/provider-reported cost | sum of linked same-currency cost / covered trajectories | 20 / 0.8 | model-role-cost-effectiveness |
| task-cohort-comparison-eligibility | 0.1.0 | implemented | rate / ratio | defined task | eligible terminal tasks / defined tasks, with exclusion reasons reported separately | 20 / 1.0 | template-utility, model-role-cost-effectiveness, evidence-decision-readiness |
| delivery-stage-reach | 0.1.0 | implemented | rate / ratio | delivery trajectory | deliveries with direct stage fact / linked deliveries | 1 / 1.0 | task-execution-workflow |
| delivery-terminal-outcome-rate | 0.1.0 | implemented | rate / ratio | explicitly terminated delivery trajectory | deliveries per terminal outcome / explicitly terminated deliveries | 1 / 1.0 | task-execution-workflow |
| delivery-cycle-time-ms | 0.1.0 | implemented | duration / milliseconds | explicitly terminated delivery trajectory | sum of eligible elapsed ms / eligible terminated deliveries | 1 / 1.0 | task-execution-workflow |
| operational-token-usage | 0.1.0 | implemented | quantity / tokens | operational model call with reported token usage | sum of reported input/output/total tokens within like-for-like cohorts | 1 / 1.0 | project-model-usage |
| operational-attributable-cost | 0.1.0 | implemented | money / source currency | operational call with project-attributable reported cost | sum of same-source same-unit eligible cost values | 1 / 1.0 | project-model-usage |
| operational-usage-availability | 0.1.0 | implemented | rate / ratio | eligible operational model call | calls with explicit applicable usage source / eligible model calls | 1 / 1.0 | project-model-usage, evidence-decision-readiness |
| configuration-reference-coverage | 0.1.0 | implemented | rate / ratio | eligible operational event | eligible events with event-time configuration references / eligible events | 1 / 1.0 | evidence-decision-readiness |
| direct-evidence-basis-rate | 0.1.0 | implemented | rate / ratio | eligible operational or delivery fact | facts with direct host/provider basis / eligible facts | 1 / 1.0 | evidence-decision-readiness |

Common exclusions across the catalog: infrastructure-aborted or infrastructure-failure attributed to the adjusted model/configuration quality, requirement or upstream dependency change, declared cohort exclusion, estimated cost, unattributed billing, mixed currency, unavailable or not-applicable values, unsupported contract records, and open (non-terminal) deliveries. Common eligibility: stable identity, event-time configuration/template known, comparable cohort, direct (host/provider) evidence, and same currency and cost basis for money.

<a id="metric-catalog-6"></a>
## 6. Human Semantic Links to the Observation Catalog

These are **human semantic correspondences** between a metric's inputs and the fact classes / semantic fields of the [Observation Catalog](../observation/observation-catalog.md). They are not machine bindings: the machine mapping is owned by the [OTel Observation Profile](../observation/otel-observation-profile.md), and several metric inputs are evaluation-level concepts with no dedicated machine-required field in the first wire profile.

Delivery Summary provides Delivery outcome only. A terminal task outcome is an evaluation-level reading over one or more Delivery facts and is not the same fact as Delivery outcome. Delivery stage reach and Delivery cycle time depend only on quarantined legacy facts or evaluation-level inputs; the first wire profile has no elapsed-time or stage-reach fact, so this document must not claim those measures are computable from first-profile Observation facts.

| Metric input concept | Observation Catalog fact class / semantic field | Binding note |
| --- | --- | --- |
| terminal task outcome | Delivery Summary → Delivery outcome (delivery-level input only); otherwise evaluation-level | terminal task outcome is not Delivery outcome; the profile carries only a Delivery outcome category, and task terminal classification has no dedicated first-profile wire fact |
| delivery trajectory / terminal state | Delivery Summary → Delivery identity, Delivery outcome | explicit termination is a Delivery outcome fact; open deliveries are excluded |
| task cohort / task identity | Delivery Summary → Task identity | task is a grouping identity, never a causality authority |
| task cohort / defined-task eligibility | Delivery Summary → Task identity (partial); otherwise evaluation-level | the profile carries task identity and terminal outcome; the defined-task set and cohort comparability/eligibility gate are evaluation-level concepts with no first-profile wire fact |
| role / responsibility | Role identity; writer/reviewer/recheck role identities | a version-local Role identity; display name is not identity |
| model call / provider / runtime | recorded causal activity; Usage → Usage source, Usage source identity | model identity is activity-level; the first profile records the call, not a model-identity summary field |
| token usage | recorded causal activity token measurement | reported token measurement; absent is unavailable, never zero |
| native usage / cost | Usage → Usage kind, Usage unit, Usage value | money only in minor units with an ISO currency; no conversion or price inference |
| latency / cycle time | recorded causal activity duration; cycle time otherwise evaluation-level or quarantined legacy only | the first profile has no Delivery Summary elapsed-time fact; cycle time must not be claimed computable from first-profile Observation facts |
| delivery stage reach | (evaluation-level concept; quarantined legacy facts only) | the first profile has no stage-reach fact; stage reach must not be claimed computable from first-profile Observation facts |
| rework / repair | Review Finding → Fix-to-Finding edge; Finding status contributions | a repair records observed re-entry, never defect severity or causal fault |
| escalation / routing | (evaluation-level concept; no first-profile wire fact) | human link only — escalation is a governance routing concept |
| reviewer finding validity | Review Finding → Finding summary, Finding status; Review Summary → Review observed count | validity is a human judgment over accepted Finding facts |
| structural coverage | Implementation Summary → Coverage dimension / covered / total / scope / tool / format | one dimension per fact; pairs never combine into a score |
| Fresh Reader result | System Design Summary → Fresh Reader result, Fresh Reader finding count | closed result category |
| deterministic verification | System Design Summary → Verification result, Verification passed/failed checks | closed result category |
| configuration bundle / reference | Workflow version / family schema (partial); otherwise evaluation-level | the profile carries workflow version and family, not a full configuration bundle; configuration reference coverage is therefore a human/evaluation-level link |
| evidence basis (direct host/provider) | Usage → Usage source; recorded causal activity provenance | direct observation proves occurrence, not semantic correctness |

Where a metric input has no corresponding Observation Catalog field (configuration bundle content, model identity, routing/escalation, qualified outcome protocol, terminal task classification, cycle time, stage reach), the link is declared as human-only and must never be presented as a machine-required field.

<a id="metric-catalog-7"></a>
## 7. Reading Rules and Forbidden Claims

- **Never collapse separate measures into a score.** `state` metrics publish many measures; rates publish numerator and denominator.
- **Never backfill.** Event-time configuration/template assignments are never applied to historical facts.
- **No causal claims.** Outcome, cost, and latency deltas are descriptive; single-component changes permit association language only; multi-component changes are bundle-level only.
- **No cross-context comparison.** Metrics are not comparable across roles, task cohorts, event-time configurations, provider/runtime boundaries, cost bases, or currencies.
- **Partial is not total.** `money` and `quantity` metrics are partial attributable values; they are never labeled total cost or total usage.
- **Missing is never zero.** Every metric's `value_semantics.missing` states an N/A condition; unavailability is not a zero and not a claim of completeness.
- **Sample and coverage gates are hard.** A metric is not published below its `minimum_sample` or `minimum_coverage`.
- **Human refs are not machine fields.** `question_refs` and several dimensions are human/evaluation references; the machine-required Observation fields are owned solely by the [OTel Observation Profile](../observation/otel-observation-profile.md).
