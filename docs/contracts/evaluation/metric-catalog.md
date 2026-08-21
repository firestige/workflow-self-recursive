<a id="metric-catalog"></a>
# Metric Catalog

> **HUMAN SPECIFICATION — NOT A MACHINE SCHEMA.** This frozen document defines the human semantics of the published 14-metric MVP Evaluation Catalog. Its published machine companion is maintained under [`system-contracts/evaluation/`](../../../system-contracts/evaluation/). Its semantic links to the Observation Catalog are human correspondences, while its dependency on the published Observation Contract `1.0.0` is an exact machine revision binding.

<a id="metric-catalog-1"></a>
## 1. Metadata and Authority

| Field | Value |
| --- | --- |
| Document identity | `evaluation.identity.001` |
| Contract revision | `agentops.evaluation.metric-catalog@1.0.0` |
| Status | `FROZEN` |
| Normative language | English |
| Machine companion | published [`system-contracts/evaluation/`](../../../system-contracts/evaluation/) 1.0.0 schema, example, fixtures, validator, version policy and publication record; `VALIDATOR_ONLY` conformance claim |
| Semantic companion | [Observation Catalog](../observation/observation-catalog.md) |
| Representation companion | published [OTel Observation Profile](../observation/otel-observation-profile.md) `1.0.0`; exact semantic revision `sha256:1a3fea6d202bf08a36aaf76abc3c6601fa71dc6c581715f9c74d11456f2ae735`, machine revision `sha256:cf5b6c54af452085f66cf3c28b7ffb14e58451b926a97fa317b9a92a18c8d774` |
| Owner | `evidence-governance-owner` |
| Translation parity obligation | English/Chinese anchors, headings, tables, IDs, fields, enums and links are paired, per [Concept `concept.acceptance.017`](../../agent-architecture.md) |

This document is the semantic authority for what each field and metric means and how it may be read. The published machine companion must encode these semantics; a mismatch is a representation defect and cannot silently redefine this document.

Metric Catalog `0.1.0` is `NON_RESOLVING_LEGACY_HISTORY_ONLY`; it remains provenance in Git history and is not a selectable compatibility target.

<a id="metric-catalog-2"></a>
## 2. Purpose and Authority Boundary

The metric catalog declares the measurements an evidence-governance owner computes and publishes. Metrics are computed from accepted Observation facts plus evaluation-level inputs; they are presentation and governance artifacts, not Observation facts themselves.

This document:

- defines each target schema field and each of the 14 declared metrics;
- states, per metric, which Observation Catalog fact classes and fields it draws on, as human semantic links;
- owns metric formulas, reading rules, minimum-sample semantics, always-published coverage and evaluation-level cohort/task readings; and
- records the hard boundaries the catalog itself imposes (no scores, no backfill, no causal claims, no cross-context comparison).

This document does not:

- implement or certify Projection, BI rendering, production Runtime or physical conformance beyond the published `VALIDATOR_ONLY` claim;
- redefine Observation facts, wire fields, Admission or Projection compatibility keys;
- implement Projection-owned fact eligibility or BI rendering; or
- publish a Question Catalog, BI/Evolution preset, composite score, rank, Pareto set or hidden weighting policy.

The published machine companion encodes this 14-metric catalog, including the exact Observation dependency, per-metric input references and semantic digest, catalog-wide `metric_id` uniqueness, coverage policy and the `value_semantics.missing` never-zero rule. Passing its validator proves schema and bounded semantic consistency only; publication makes a `VALIDATOR_ONLY` claim and does not establish Projection, BI, Runtime or production implementation conformance.

<a id="metric-catalog-3"></a>
## 3. Schema Field Semantics

Catalog envelope fields:

| Field | Target machine shape | Human meaning |
| --- | --- | --- |
| `catalog_id` | fixed identifier | identifies this artifact as `agentops.evaluation.metric-catalog` |
| `version` | `x.y.z` string | version of the catalog envelope and validation surface |
| `status` | `PUBLISHED` | machine Contract lifecycle state; never a production implementation or physical-conformance claim |
| `semantic_authority` | fixed non-empty reference | binds the representation to this document identity |
| `dependencies` | one exact closed Observation binding | binds `observation-contract@1.0.0` to its published semantic revision, machine revision, publication digest and gitlink commit; no SemVer inference |
| `minimum_sample_policy` | one fixed rule | below `minimum_sample` the metric value is not published, while the complete coverage result remains published |
| `coverage_policy` | one closed policy object | fixes result fields, states, threshold domain, exact comparison and the rule that coverage never gates publication |
| `input_definitions` | closed array of `{input_id, source_layer, semantic_ref, binding}` | declares resolvable semantic inputs and their owning layer; `binding` is always `human-semantic-reference`, never a wire binding or authority grant |
| `metrics` | exactly 14 metric records | the MVP metric set declared in §5 |

Metric record fields:

| Field | Target machine shape | Human meaning |
| --- | --- | --- |
| `metric_id` | identifier | stable metric identifier, unique within the catalog |
| `version` | `x.y.z` string | the metric definition's own version |
| `name` | non-empty string | human-readable metric name |
| `status` | `implemented` or `planned` | descriptive legacy readiness only; neither value proves current implementation or conformance |
| `evaluation_unit` | non-empty string | the unit of analysis the metric is computed over (task, packet, trajectory, call, fact, event) |
| `value_semantics.kind` | `rate`, `count`, `duration`, `quantity`, or `money` | the kind of value the metric publishes; the deleted profile does not leave a `state` escape hatch |
| `value_semantics.unit` | non-empty string | the value's unit |
| `value_semantics.missing` | non-empty string | how the metric expresses unavailability; always "N/A when …", never a zero |
| `dimensions` | unique string array | the grouping axes a consumer may slice by |
| `filters` | unique string array | the conditions that constrain which records enter the metric |
| `time_window` | non-empty string | the time frame and event-time/as-of semantics over which the metric is computed |
| `calculation` | non-empty string | the exact computation, including what is published as separate measures |
| `input_refs` | one or more unique input identifiers | per-metric references into the catalog's closed `input_definitions` registry; every reference must resolve |
| `eligibility` | one or more strings | the positive conditions a record must meet to enter the numerator or denominator |
| `exclusions` | string array | the conditions that remove a record from the metric |
| `minimum_sample` | integer ≥ 1 | the minimum eligible-unit count below which the metric value is not published; the coverage result is still published |
| `coverage.denominator` | non-empty string | exact candidate population for coverage: identity, time window, cohort and base scope |
| `coverage.numerator` | non-empty string | the denominator subset with all required direct inputs available |
| `uncertainty` | one or more strings | the stated limitations and intervals |
| `forbidden_inference` | one or more strings | the conclusions the metric must not be used to draw |
| `owner` | non-empty string | the party responsible for the metric |

A later schema revision may add bounded representation metadata, but it may not weaken the required meaning of `kind`, `unit` or `missing` or admit arbitrary semantic extensions.

<a id="metric-catalog-4"></a>
## 4. Metric Value Kinds

| Kind | Meaning | Typical unit | Missing rule |
| --- | --- | --- | --- |
| `rate` | a ratio of eligible units meeting a condition | `ratio` | N/A when no eligible units exist |
| `count` | an exact integer count of changed or observed items | e.g. `changed components` | N/A when identity is unavailable |
| `duration` | an elapsed time measurement | `milliseconds` | N/A when start or end is unavailable; unavailable is never zero |
| `quantity` | a sum of reported quantities | `tokens` | N/A when unavailable; unavailable is never zero |
| `money` | a same-currency sum of reported cost | source currency | N/A when no attributable same-currency cost |

Rates report numerator and denominator. `money` and `quantity` metrics never convert currencies or units implicitly. The Contract publishes no composite/profile kind and never collapses independent metrics into one score.

<a id="metric-catalog-5"></a>
## 5. Declared Metrics

The MVP catalog declares exactly 14 metrics. `Definition class` records why each metric survives the issue #43 scope decision as amended by issue #79: `DIRECT` uses already-declared facts, `B_TASK_READING` uses the task reading in §6.2, and `A_PROFILE_1.0` uses the published Observation Profile `1.0.0`. It is a documentation audit column, not implementation status or a target machine-schema field.

| metric_id | v | definition class | kind / unit | evaluation unit | calculation | minimum sample |
| --- | --- | --- | --- | --- | --- | --- |
| role-template-rework-rate | 1.0.0 | B_TASK_READING | rate / ratio | eligible terminal task in one event-time role-template cohort | terminal tasks with at least one linked attributable repair / eligible terminal tasks; no-repair tasks contribute 0 | 20 |
| role-template-trajectory-partial-cost | 1.0.0 | B_TASK_READING | money / source currency | eligible terminal task trajectory in one event-time role-template cohort | sum linked provider/host-reported cost for covered task trajectories, separately by exact currency/source/cost basis | 20 |
| role-model-task-outcome-rate | 1.0.0 | DIRECT | rate / ratio | eligible terminal task with complete canonical model-role attribution | tasks in each unique task-outcome category / eligible attributed terminal tasks; one numerator per category | 20 |
| packet-rework-rate | 1.0.0 | DIRECT | rate / ratio | governance `0.2` implementation packet | packets with at least one valid attributable repair edge / all eligible packets; eligible no-repair packets contribute 0 | 1 |
| operational-latency-ms | 1.0.0 | A_PROFILE_1.0 | duration / milliseconds | attributed operational model call with native host-reported Span duration | sum eligible call durations / contributing calls; also publish contributing-call count | 1 |
| trajectory-partial-cost | 1.0.0 | DIRECT | money / source currency | Delivery trajectory with linked host/provider-reported cost | sum linked costs separately by exact source, unit/currency and cost basis over covered trajectories | 20 |
| task-cohort-comparison-eligibility | 1.0.0 | B_TASK_READING | rate / ratio | task in the declared defined-task snapshot | comparable eligible terminal tasks / defined tasks; publish every exclusion reason separately | 20 |
| delivery-stage-reach | 1.0.0 | A_PROFILE_1.0 | rate / ratio | Delivery trajectory | Deliveries with direct C56 reached-stage fact / linked terminal Deliveries; publish exact stage identities separately | 1 |
| delivery-terminal-outcome-rate | 1.0.0 | DIRECT | rate / ratio | explicitly terminated Delivery trajectory | Deliveries in each recorded terminal outcome / explicitly terminated Deliveries; one numerator per outcome | 1 |
| delivery-cycle-time-ms | 1.0.0 | A_PROFILE_1.0 | duration / milliseconds | explicitly terminated Delivery with direct C55 elapsed time | sum eligible C55 milliseconds / contributing terminal Deliveries; also publish contributing-Delivery count | 1 |
| operational-token-usage | 1.0.0 | DIRECT | quantity / tokens | attributed operational model call with reported standard token usage | sum reported input/output token measures separately within identical model-role cohorts; never synthesize total tokens | 1 |
| operational-attributable-cost | 1.0.0 | DIRECT | money / source currency | attributed operational call with linked provider/host-reported project-attributable cost | sum only exact same-model-role, source, unit/currency and cost-basis values | 1 |
| operational-usage-availability | 1.0.0 | DIRECT | rate / ratio | attributed operational model call | calls with explicit applicable usage source / eligible model calls | 1 |
| direct-evidence-basis-rate | 1.0.0 | DIRECT | rate / ratio | accepted operational or Delivery fact with readable provenance | direct host/provider basis / all accepted facts with readable provenance; accepted nondirect facts contribute 0 | 1 |

The six removed metrics are `model-role-utility-profile`, `configuration-utility-profile`, `configuration-component-comparison`, `configuration-reference-coverage`, `packet-escalation-rate`, and `role-template-qualified-outcome-rate`. The first is a consumer-side bundle without one independent measurement meaning; the other five depend on undefined C/D-class configuration, routing/escalation or qualified-outcome semantics. Consumers must not preserve any of them as hidden measures or aliases.

Common exclusions across the catalog: infrastructure abort/failure attributed to adjusted model or template quality; requirement or upstream dependency change; declared cohort exclusion; estimated or unattributed cost; mixed currency/unit/cost basis; unavailable or not-applicable values; unsupported contract records; incomplete attribution tuples; mixed task outcomes; and open/non-terminal Deliveries. Common eligibility: stable identity, exact event-time assignment where required, complete Projection-owned compatibility/eligibility attributes, comparable cohort, direct accepted host/provider evidence, and exact currency/source/cost basis for money.

<a id="metric-catalog-6"></a>
## 6. Human Semantic Links to the Observation Catalog

These are **human semantic correspondences** between metric inputs and the fact classes / semantic fields of the [Observation Catalog](../observation/observation-catalog.md). Exact representation is owned by the published [OTel Observation Profile `1.0.0`](../observation/otel-observation-profile.md); the machine catalog separately binds its exact published Observation revision, while evaluation-level task/cohort readings remain owned here.

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
| structural coverage | Implementation Summary → Coverage dimension / covered / total / scope / tool / format | one dimension per fact; pairs never combine into a score |
| Fresh Reader result | System Design Summary → Fresh Reader result, Fresh Reader finding count | closed result category |
| deterministic verification | System Design Summary → Verification result, Verification passed/failed checks | closed result category |
| evidence basis (direct host/provider) | Usage → Usage source; recorded causal activity provenance | direct observation proves occurrence, not semantic correctness |

### 6.1 A-class Profile `1.0.0` inputs

The three A-class metrics are definition-ready only under these exact inputs:

| Metric | Required direct input | Fail-closed missing rule |
| --- | --- | --- |
| `operational-latency-ms` | native model-call Span duration | absent/invalid duration excludes the call; never substitute C55 or zero |
| `delivery-cycle-time-ms` | Delivery Summary C55 elapsed milliseconds | absent C55 excludes the Delivery from the duration numerator and contributing count; never derive from arrival time |
| `delivery-stage-reach` | Delivery Summary C56 exact reached-stage identity | absent C56 excludes the Delivery from the reached-stage numerator; never infer a stage from workflow order or text |

The five independent model-role metrics—`role-model-task-outcome-rate`, `operational-latency-ms`, `operational-token-usage`, `operational-attributable-cost`, and `operational-usage-availability`—all slice only by the exact provider+C57 canonical model+C30 Role+C06 Runtime tuple. Any missing coordinate makes the contributing unit unavailable for that slice; display names, aliases, ancestry or summary text cannot complete it.

### 6.2 B-class terminal-task and cohort reading

Task terminal state is an evaluation reading, not an Observation fact. It is computed at one declared as-of cutoff as follows:

1. The evaluation owner supplies an immutable **defined-task snapshot** containing exact Task identities, explicit Delivery membership, event-time cohort coordinates and the cutoff. The snapshot is an evaluation-level input; it is never backfilled from later facts.
2. Each declared Delivery member is joined only by exact Delivery and Task identities. A member without an accepted terminal Delivery Summary at the cutoff is open/non-terminal; the whole task is ineligible for terminal-task metrics and receives exclusion reason `OPEN_DELIVERY`.
3. For a task whose declared members all have terminal summaries, collect the exact recorded outcomes. If every outcome is identical, that value is the unique terminal task outcome. If values differ, no chronology or winner is inferred; the task receives `MIXED_DELIVERY_OUTCOMES` and is excluded from outcome numerators and eligible-terminal denominators.
4. A task missing its exact membership, Task identity or required cohort coordinate receives `UNDEFINED_TASK_MEMBERSHIP`, `MISSING_TASK_IDENTITY` or `INCOMPLETE_COHORT_COORDINATES`; absence is never reconstructed.
5. Comparable cohorts require exact equality on every dimension/filter declared by the metric, including event-time role-template assignment and provider/Runtime/currency/cost-basis coordinates where applicable. Cross-context values remain separate.

`task-cohort-comparison-eligibility` uses all tasks in the immutable defined-task snapshot as its denominator and tasks passing rules 2–5 as its numerator; it publishes each exclusion reason separately. Other terminal-task metrics use only the passing set as their eligible denominator. This distinction prevents excluded/open tasks from disappearing from eligibility coverage while keeping them out of outcome, cost and rework formulas.

### 6.3 Formula and Projection eligibility ownership

This Catalog owns metric formulas: evaluation unit, numerator/denominator, required projected attributes, exclusions, existing minimum-sample rule, coverage population/input basis and forbidden inferences. `evidence.projection` owns fact-level compatibility keys and eligibility attributes derived from accepted facts. Evaluation consumes those attributes but cannot repair or override them; Projection cannot define a Metric formula; BI cannot change either layer.

### 6.4 Coverage result and alert policy

Every metric result always publishes `numerator`, `denominator`, `raw_ratio`, `state` and `alert`. Coverage uses candidate units satisfying identity, time window, cohort and base scope as its denominator; its numerator is the subset with all direct inputs required by that metric. Ordinary negative examples remain covered; only unavailable required inputs are missing.

- denominator = 0 → `NO_POPULATION`, with ratio and metric value `N/A`;
- denominator > 0 and numerator = 0 → `NO_COVERAGE`, ratio 0 and metric value `N/A`;
- 0 < numerator < denominator → `PARTIAL`;
- numerator = denominator → `FULL`.

Coverage never gates publication and never hides, zeroes or rewrites an otherwise computable metric value. `minimum_sample` keeps its separate established behavior: below the declared eligible-unit count, the metric value is not published, while coverage numerator, denominator, raw ratio, state and alert are still published. The default `LOW_COVERAGE` alert threshold is `0.10`; legal thresholds are `{0.00,0.01,...,0.99}`. Threshold 0 disables the alert. Otherwise, for denominator > 0, alert exactly when raw coverage is below threshold. No rounded value participates: for threshold hundredths `T ∈ [0,99]`, compare `100 × numerator < T × denominator`; equality does not alert. Threshold changes recalculate only the alert, never historical facts, value or coverage.

### 6.5 Per-metric input and eligibility map

| Metric | Required projected/evaluation input | Metric-level eligibility and exclusions |
| --- | --- | --- |
| `role-template-rework-rate` | defined-task snapshot; exact event-time role template; unique terminal task outcome; linked repair | exclude open/mixed/undefined tasks and backfilled/missing template assignment |
| `role-template-trajectory-partial-cost` | same task/template inputs plus linked direct cost | exclude mixed currency/source/cost basis and estimated/unattributed cost; partial coverage remains visible and does not exclude an otherwise computable value |
| `role-model-task-outcome-rate` | unique terminal task outcome plus complete model-role tuple | exclude open/mixed tasks and incomplete attribution; publish one numerator per outcome over one eligible denominator |
| `packet-rework-rate` | exact packet identity, supported governance revision and repair-attribution input | denominator is all in-scope eligible packets; a known no-repair packet remains covered and contributes 0; unavailable repair attribution affects coverage, not ordinary-negative classification |
| `operational-latency-ms` | native model-call Span duration plus complete provider/model/role/runtime tuple | exclude absent/invalid duration or incomplete attribution; keep model-role cohorts exact |
| `trajectory-partial-cost` | exact Delivery linkage and direct reported cost | exclude estimated/unattributed or incompatible currency/source/cost basis; publish coverage |
| `task-cohort-comparison-eligibility` | immutable defined-task snapshot and §6.2 classification | denominator includes every defined task; numerator includes only comparable eligible terminal tasks; publish exclusions |
| `delivery-stage-reach` | terminal Delivery identity and C56 | denominator is linked terminal Deliveries; absent/invalid C56 is not a reached stage |
| `delivery-terminal-outcome-rate` | terminal Delivery identity and exact outcome | one numerator per outcome over terminal Deliveries; no task-level inference |
| `delivery-cycle-time-ms` | terminal Delivery identity and C55 | exclude absent/invalid C55; publish contributing count |
| `operational-token-usage` | standard reported input/output token measurements plus complete provider/model/role/runtime tuple | keep input/output separate; exclude absent/incompatible measurements or incomplete attribution; never synthesize missing total |
| `operational-attributable-cost` | direct linked project-attributable cost plus complete provider/model/role/runtime tuple | exact model-role/source/unit/currency/cost basis only; no estimate or conversion |
| `operational-usage-availability` | exact model-call identity, usage-source classification and complete provider/model/role/runtime tuple | numerator requires explicit applicable source; unavailable source classification affects coverage, not a false zero-usage claim |
| `direct-evidence-basis-rate` | accepted fact identity and readable provenance classification | denominator retains accepted nondirect facts, which contribute 0; missing/unreadable provenance affects coverage and is never treated as nondirect |

<a id="metric-catalog-7"></a>
## 7. Reading Rules and Forbidden Claims

- **Never collapse independent metrics into a score.** BI/Evolution may explicitly select coordinates, but the Metric Catalog publishes no profile, composite, rank, Pareto set or hidden weight.
- **Never backfill.** Event-time configuration/template assignments are never applied to historical facts.
- **No causal claims.** Outcome, cost, and latency deltas are descriptive; single-component changes permit association language only; multi-component changes are bundle-level only.
- **No cross-context comparison.** Metrics are not comparable across roles, task cohorts, event-time configurations, provider/runtime boundaries, cost bases, or currencies.
- **Partial is not total.** `money` and `quantity` metrics are partial attributable values; they are never labeled total cost or total usage.
- **Missing is never zero.** Every metric's `value_semantics.missing` states an N/A condition; unavailability is not a zero and not a claim of completeness.
- **Coverage is visible, not a gate.** Coverage result and alert always publish; low coverage alone never hides a computable value or changes `minimum_sample` semantics.
- **Consumer questions are not Metric fields.** The Catalog has no Question Catalog, `question_refs`, BI preset or Evolution input bundle; consumers reference exact metric coordinates and revisions.
