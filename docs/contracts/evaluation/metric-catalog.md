<a id="metric-catalog"></a>
# Metric Catalog

> **HUMAN SPECIFICATION — NOT A MACHINE SCHEMA.** This document defines the human semantics of the 15-metric MVP Evaluation Catalog. No metric-catalog machine schema or example instance exists yet; creating and validating that representation belongs to issue #44. The semantic links to the [Observation Catalog](../observation/observation-catalog.md) are human correspondences, never machine bindings.

<a id="metric-catalog-1"></a>
## 1. Metadata and Authority

| Field | Value |
| --- | --- |
| Document identity | `evaluation.identity.001` |
| Status | `DRAFT_NOT_PUBLISHED` |
| Normative language | English |
| Machine companion | absent; issue #44 owns the future `system-contracts/evaluation/` schema, example and validator |
| Semantic companion | [Observation Catalog](../observation/observation-catalog.md) |
| Representation companion | [OTel Observation Profile](../observation/otel-observation-profile.md), proposed version `0.3.0` |
| Owner | `evidence-governance-owner` |
| Translation parity obligation | English/Chinese anchors, headings, tables, IDs, fields, enums and links are paired, per [Concept `concept.acceptance.017`](../../agent-architecture.md) |

This document is the semantic authority for what each field and metric means and how it may be read. The future machine companion must encode these semantics; a mismatch is a representation defect and cannot silently redefine this document.

<a id="metric-catalog-2"></a>
## 2. Purpose and Authority Boundary

The metric catalog declares the measurements an evidence-governance owner computes and publishes, each tied to one or more human evaluation questions. Metrics are computed from accepted Observation facts plus evaluation-level inputs; they are presentation and governance artifacts, not Observation facts themselves.

This document:

- defines each target schema field and each of the 15 declared metrics;
- states, per metric, which Observation Catalog fact classes and fields it draws on, as human semantic links;
- owns metric formulas, reading rules, sample/coverage gates and evaluation-level cohort/task readings; and
- records the hard boundaries the catalog itself imposes (no scores, no backfill, no causal claims, no cross-context comparison).

This document does not:

- publish a machine schema, example, validator, implementation or conformance claim;
- redefine Observation facts, wire fields, Admission or Projection compatibility keys;
- implement Projection-owned fact eligibility or BI rendering; or
- turn `question_refs`, evaluation cohorts or formulas into Observation fields.

Issue #44 must machine-encode this 15-metric catalog, including per-metric input references, catalog-wide `metric_id` uniqueness and the `value_semantics.missing` never-zero rule. Until that work exists, no file or legacy implementation may claim machine authority or conformance.

<a id="metric-catalog-3"></a>
## 3. Schema Field Semantics

| Field | Target machine shape | Human meaning |
| --- | --- | --- |
| `metric_id` | identifier | stable metric identifier, unique within the catalog |
| `version` | `x.y.z` string | the metric definition's own version |
| `name` | non-empty string | human-readable metric name |
| `status` | `implemented` or `planned` | descriptive legacy readiness only; neither value proves current implementation or conformance |
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

The future schema may add bounded representation metadata, but it may not weaken the required meaning of `kind`, `unit` or `missing` or admit arbitrary semantic extensions.

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

The MVP catalog declares exactly 15 metrics. `Definition class` records why each metric survives the issue #43 scope decision: `DIRECT` uses already-declared facts, `B_TASK_READING` uses the task reading in §6.2, and `A_PROFILE_0.3` uses the Observation Profile `0.3.0` inputs closed by issue #61. It is a documentation audit column, not implementation status or a target machine-schema field.

| metric_id | v | definition class | kind / unit | evaluation unit | calculation | min sample / coverage | question refs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| model-role-utility-profile | 0.1.0 | A_PROFILE_0.3 | state / multi-dimensional profile | terminal task with one complete canonical provider/model/Role/Runtime attribution tuple per contributing call | publish outcome, adjusted failure, retry, repair, reopen, latency, token, cost, intervention and reviewer-finding validity as separate measures; each measure keeps its own eligibility, sample, coverage and unit; Pareto only among evidence-ready peers | 20 / 0.8 | model-role-cost-effectiveness |
| role-template-rework-rate | 0.1.0 | B_TASK_READING | rate / ratio | eligible terminal task in one event-time role-template cohort | terminal tasks with at least one linked attributable repair / eligible terminal tasks; publish numerator and denominator | 20 / 1.0 | template-utility |
| role-template-trajectory-partial-cost | 0.1.0 | B_TASK_READING | money / source currency | eligible terminal task trajectory in one event-time role-template cohort | sum linked provider/host-reported cost for covered task trajectories, separately by exact currency/source/cost basis; publish coverage | 20 / 0.8 | template-utility |
| role-model-task-outcome-rate | 0.1.0 | DIRECT | rate / ratio | eligible terminal task with complete canonical model-role attribution | tasks in each unique task-outcome category / eligible attributed terminal tasks; publish numerator and denominator per category | 20 / 1.0 | model-role-cost-effectiveness |
| packet-rework-rate | 0.1.0 | DIRECT | rate / ratio | governance `0.2` implementation packet | packets with at least one linked attributable repair / eligible packets; publish numerator and denominator | 1 / 1.0 | task-execution-workflow |
| operational-latency-ms | 0.1.0 | A_PROFILE_0.3 | duration / milliseconds | operational model call with native host-reported Span duration | sum eligible call durations / contributing calls; also publish contributing-call count | 1 / 1.0 | model-role-cost-effectiveness, project-model-usage |
| trajectory-partial-cost | 0.1.0 | DIRECT | money / source currency | Delivery trajectory with linked host/provider-reported cost | sum linked costs separately by exact source, unit/currency and cost basis / covered trajectories; publish coverage | 20 / 0.8 | model-role-cost-effectiveness |
| task-cohort-comparison-eligibility | 0.1.0 | B_TASK_READING | rate / ratio | task in the declared defined-task snapshot | comparable eligible terminal tasks / defined tasks; publish every exclusion reason separately | 20 / 1.0 | evidence-decision-readiness |
| delivery-stage-reach | 0.1.0 | A_PROFILE_0.3 | rate / ratio | Delivery trajectory | Deliveries with direct C56 reached-stage fact / linked terminal Deliveries; publish exact stage identities as separate dimensions | 1 / 1.0 | task-execution-workflow |
| delivery-terminal-outcome-rate | 0.1.0 | DIRECT | rate / ratio | explicitly terminated Delivery trajectory | Deliveries in each recorded terminal outcome / explicitly terminated Deliveries; publish numerator and denominator per outcome | 1 / 1.0 | task-execution-workflow |
| delivery-cycle-time-ms | 0.1.0 | A_PROFILE_0.3 | duration / milliseconds | explicitly terminated Delivery with direct C55 elapsed time | sum eligible C55 milliseconds / contributing terminal Deliveries; also publish contributing-Delivery count | 1 / 1.0 | task-execution-workflow |
| operational-token-usage | 0.1.0 | DIRECT | quantity / tokens | operational model call with reported standard token usage | sum reported input/output token measures separately within identical cohorts; publish coverage; do not synthesize total tokens when absent | 1 / 1.0 | project-model-usage |
| operational-attributable-cost | 0.1.0 | DIRECT | money / source currency | operational call with linked provider/host-reported project-attributable cost | sum only exact same-source, same-unit/currency and same-cost-basis values; publish coverage | 1 / 1.0 | project-model-usage |
| operational-usage-availability | 0.1.0 | DIRECT | rate / ratio | eligible operational model call | calls with explicit applicable usage source / eligible model calls; publish numerator and denominator | 1 / 1.0 | project-model-usage, evidence-decision-readiness |
| direct-evidence-basis-rate | 0.1.0 | DIRECT | rate / ratio | eligible operational or Delivery fact | facts with direct accepted host/provider basis / eligible facts; publish numerator and denominator | 1 / 1.0 | evidence-decision-readiness |

The five removed metrics are `configuration-utility-profile`, `configuration-component-comparison`, `configuration-reference-coverage`, `packet-escalation-rate`, and `role-template-qualified-outcome-rate`. They depend on C/D-class configuration, routing/escalation or qualified-outcome semantics that the MVP does not define; consumers must not preserve them as hidden measures or aliases.

Common exclusions across the catalog: infrastructure abort/failure attributed to adjusted model or template quality; requirement or upstream dependency change; declared cohort exclusion; estimated or unattributed cost; mixed currency/unit/cost basis; unavailable or not-applicable values; unsupported contract records; incomplete attribution tuples; mixed task outcomes; and open/non-terminal Deliveries. Common eligibility: stable identity, exact event-time assignment where required, complete Projection-owned compatibility/eligibility attributes, comparable cohort, direct accepted host/provider evidence, and exact currency/source/cost basis for money.

<a id="metric-catalog-6"></a>
## 6. Human Semantic Links to the Observation Catalog

These are **human semantic correspondences** between metric inputs and the fact classes / semantic fields of the [Observation Catalog](../observation/observation-catalog.md). They are not machine bindings: exact representation is owned by the proposed [OTel Observation Profile `0.3.0`](../observation/otel-observation-profile.md), while evaluation-level task/cohort readings remain owned here.

| Metric input concept | Observation Catalog fact class / semantic field | Binding note |
| --- | --- | --- |
| terminal task outcome | Delivery Summary → Task identity, Delivery identity, Delivery outcome | task outcome is the fail-closed evaluation reading in §6.2, never a new Observation fact |
| delivery trajectory / terminal state | Delivery Summary → Delivery identity, Delivery outcome | explicit termination is a Delivery outcome fact; open deliveries are excluded |
| task cohort / task identity | Delivery Summary → Task identity | task is an exact grouping identity, never causality or ordering authority |
| task cohort / defined-task eligibility | Task identity plus an immutable evaluation-level defined-task/membership/cohort snapshot | the snapshot is not an Observation field; without it, a defined-task denominator or open-Delivery exclusion cannot be claimed |
| role / responsibility | Role identity; writer/reviewer/recheck role identities | a version-local Role identity; display name is not identity |
| model call / provider / runtime | recorded model-call activity plus canonical model identity and model-to-Role attribution | use the complete provider+C57+C30+C06+Span tuple; no free-form/list summary or alias inference |
| token usage | recorded causal activity token measurement | reported token measurement; absent is unavailable, never zero |
| native usage / cost | Usage → Usage kind, Usage unit, Usage value | money only in minor units with an ISO currency; no conversion or price inference |
| operational latency | recorded model-call activity native Span duration | direct host-reported call duration; distinct from Delivery elapsed time |
| Delivery cycle time | Delivery Summary → Delivery elapsed time | direct C55 milliseconds; absence is unavailable, never zero |
| Delivery stage reach | Delivery Summary → Delivery stage reached | direct C56 exact Workflow stage identity; no name parsing or inferred ordering |
| rework / repair | Review Finding → Fix-to-Finding edge; Finding status contributions | a repair records observed re-entry, never defect severity or causal fault |
| reviewer finding validity | Review Finding → Finding summary, Finding status; Review Summary → Review observed count | validity is a human judgment over accepted Finding facts |
| structural coverage | Implementation Summary → Coverage dimension / covered / total / scope / tool / format | one dimension per fact; pairs never combine into a score |
| Fresh Reader result | System Design Summary → Fresh Reader result, Fresh Reader finding count | closed result category |
| deterministic verification | System Design Summary → Verification result, Verification passed/failed checks | closed result category |
| evidence basis (direct host/provider) | Usage → Usage source; recorded causal activity provenance | direct observation proves occurrence, not semantic correctness |

### 6.1 A-class Profile `0.3.0` inputs

The four A-class metrics are definition-ready only under these exact inputs:

| Metric | Required direct input | Fail-closed missing rule |
| --- | --- | --- |
| `operational-latency-ms` | native model-call Span duration | absent/invalid duration excludes the call; never substitute C55 or zero |
| `delivery-cycle-time-ms` | Delivery Summary C55 elapsed milliseconds | absent C55 excludes the Delivery from the duration numerator and contributing count; never derive from arrival time |
| `delivery-stage-reach` | Delivery Summary C56 exact reached-stage identity | absent C56 excludes the Delivery from the reached-stage numerator; never infer a stage from workflow order or text |
| `model-role-utility-profile` | complete provider+C57 canonical model+C30 Role+C06 Runtime+Span identity tuple | any missing coordinate makes attribution unavailable; never complete it from display names, aliases, ancestry alone or a summary body |

### 6.2 B-class terminal-task and cohort reading

Task terminal state is an evaluation reading, not an Observation fact. It is computed at one declared as-of cutoff as follows:

1. The evaluation owner supplies an immutable **defined-task snapshot** containing exact Task identities, explicit Delivery membership, event-time cohort coordinates and the cutoff. The snapshot is an evaluation-level input; it is never backfilled from later facts.
2. Each declared Delivery member is joined only by exact Delivery and Task identities. A member without an accepted terminal Delivery Summary at the cutoff is open/non-terminal; the whole task is ineligible for terminal-task metrics and receives exclusion reason `OPEN_DELIVERY`.
3. For a task whose declared members all have terminal summaries, collect the exact recorded outcomes. If every outcome is identical, that value is the unique terminal task outcome. If values differ, no chronology or winner is inferred; the task receives `MIXED_DELIVERY_OUTCOMES` and is excluded from outcome numerators and eligible-terminal denominators.
4. A task missing its exact membership, Task identity or required cohort coordinate receives `UNDEFINED_TASK_MEMBERSHIP`, `MISSING_TASK_IDENTITY` or `INCOMPLETE_COHORT_COORDINATES`; absence is never reconstructed.
5. Comparable cohorts require exact equality on every dimension/filter declared by the metric, including event-time role-template assignment and provider/Runtime/currency/cost-basis coordinates where applicable. Cross-context values remain separate.

`task-cohort-comparison-eligibility` uses all tasks in the immutable defined-task snapshot as its denominator and tasks passing rules 2–5 as its numerator; it publishes each exclusion reason separately. Other terminal-task metrics use only the passing set as their eligible denominator. This distinction prevents excluded/open tasks from disappearing from eligibility coverage while keeping them out of outcome, cost and rework formulas.

### 6.3 Formula and Projection eligibility ownership

This Catalog owns metric formulas: evaluation unit, numerator/denominator or separate measures, required projected attributes, exclusions, sample/coverage gates and forbidden inferences. `evidence.projection` owns fact-level compatibility keys and eligibility attributes derived from accepted facts. Evaluation consumes those attributes but cannot repair or override them; Projection cannot define a Metric formula; BI cannot change either layer.

### 6.4 Per-metric input and eligibility map

| Metric | Required projected/evaluation input | Metric-level eligibility and exclusions |
| --- | --- | --- |
| `model-role-utility-profile` | complete model-role tuple; unique terminal task outcome; linked duration/usage/repair/intervention/review facts | publish each available measure separately; exclude incomplete tuples, mixed/open tasks and incompatible cohorts; one unavailable measure never becomes zero or blocks unrelated measures |
| `role-template-rework-rate` | defined-task snapshot; exact event-time role template; unique terminal task outcome; linked repair | exclude open/mixed/undefined tasks and backfilled/missing template assignment |
| `role-template-trajectory-partial-cost` | same task/template inputs plus linked direct cost | exclude mixed currency/source/cost basis, estimated/unattributed cost and insufficient coverage |
| `role-model-task-outcome-rate` | unique terminal task outcome plus complete model-role tuple | exclude open/mixed tasks and incomplete attribution; publish one numerator per outcome over one eligible denominator |
| `packet-rework-rate` | exact packet identity and linked repair | exclude missing packet/repair identity and unsupported governance version |
| `operational-latency-ms` | native model-call Span duration | exclude absent/invalid duration and incompatible provider/Runtime cohorts |
| `trajectory-partial-cost` | exact Delivery linkage and direct reported cost | exclude estimated/unattributed or incompatible currency/source/cost basis; publish coverage |
| `task-cohort-comparison-eligibility` | immutable defined-task snapshot and §6.2 classification | denominator includes every defined task; numerator includes only comparable eligible terminal tasks; publish exclusions |
| `delivery-stage-reach` | terminal Delivery identity and C56 | denominator is linked terminal Deliveries; absent/invalid C56 is not a reached stage |
| `delivery-terminal-outcome-rate` | terminal Delivery identity and exact outcome | one numerator per outcome over terminal Deliveries; no task-level inference |
| `delivery-cycle-time-ms` | terminal Delivery identity and C55 | exclude absent/invalid C55; publish contributing count |
| `operational-token-usage` | standard reported input/output token measurements | keep input/output separate; exclude absent/incompatible measurements; never synthesize missing total |
| `operational-attributable-cost` | direct linked project-attributable cost | exact source/unit/currency/cost basis only; no estimate or conversion |
| `operational-usage-availability` | eligible model-call identity and explicit applicable usage source | denominator retains eligible calls with missing usage; numerator requires explicit source; missing is not zero usage |
| `direct-evidence-basis-rate` | eligible fact identity and accepted host/provider provenance | direct basis proves occurrence only; unsupported or inferred provenance is excluded |

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
