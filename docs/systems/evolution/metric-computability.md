# Evolution Metric Computability — Iteration 5 Candidate

> **Status:** Wave3 design candidate, 2026-08-28. The Evaluation Catalog remains the semantic authority. This document assigns its 14 published coordinates to Evolution calculator/input slots; it neither changes a formula nor publishes a Contract. Chinese tracking companion: [`metric-computability.zh-CN.md`](metric-computability.zh-CN.md).

## 1. Common calculator contract

Every exact `metric_id@version` maps to one Python module and one pure calculator entry point. Resolution and normalization happen outside calculators. A calculator receives only its immutable typed input slice and returns one typed `MetricResult`; it cannot query Evidence, inspect another metric, select an engine, or fall back to a second algorithm.

All 14 entries are returned for every successfully resolved side. Each missing/expired input follows the Catalog's exact disposition: it may reduce coverage, exclude only its evaluation unit, or withhold a value when the required reading/sample cannot be established. It never automatically fails the other metrics. Coverage and exclusion reasons remain published as required by `agentops.evaluation.metric-catalog@1.0.0`.

Common forbidden inferences are: Task membership from names; terminality from Trace closure; model-call association from Delivery ID, time, or arrival order; absent value as zero; currency/unit conversion; cost estimation; token-total synthesis; Workflow order as recorded reach; and any causal or improvement claim.

## 2. Physical input map

| Input reading | Initial physical source | Exact binding and lifecycle |
|---|---|---|
| Task declaration/membership | accepted Evidence Task projection | exact `task_id`, explicit Delivery membership and Manifest digest, Evolution-declared logical `as_of`; no name inference |
| admitted Workflow/Role configuration | exact Evidence Delivery Manifest projection; optional digest-matched Workflow source content validates/enriches it | Manifest freezes Snapshot + Role-prompt identity/digest as event-time cohort; observed C30 selects that coordinate. External bytes are not required for formula truth; no self-reported template Event, current-checkout, source-name, or time inference |
| Delivery terminal/outcome/C55/C56 | typed Evidence Facts from Delivery Summary/Event projection | exact `delivery_id`; open remains open; C55/C56 are direct fields only |
| repair relationship | typed Fact/relationship projection | exact recorded finding/fix identities; no adjacency inference |
| packet identity | typed implementation-summary Fact | exact packet identity and supported governance revision |
| model-call identity/tuple | recorded Trace NODE and matching model-attribution projection | exact `(trace_id, span_id)` plus provider+C57 model+C30 Role+C06 Runtime; independent expiry is visible |
| native call duration | recorded Trace NODE | exact Span identity; never Delivery elapsed time or timestamp subtraction in BI |
| standard input/output tokens | recorded Trace NODE | exact Span identity; input/output remain separate |
| direct Usage/cost | typed Usage Fact | exact source, kind, unit/currency, cost basis, value, and direct provenance |
| accepted Fact basis | Fact identity plus accepted provenance | exact Fact ID and readable accepted provenance classification |

The initial mapping deliberately uses existing Trace NODE measurements for latency and token usage. A Usage Fact that lacks an exact Event-to-model-call binding cannot be attributed to one of multiple calls in the same Delivery. That candidate unit cannot supply call-attributed cost/source input; the metric applies its Catalog coverage/exclusion rules and may still publish from other eligible units. Evolution must not guess. A future exact binding projection is contract-alignment work, not a reason for a cross-route transaction snapshot.

## 3. Fourteen-calculator matrix

| Metric / Python slot | Kind, unit; min sample | Required normalized input and join | Compatibility / withholding / forbidden reading |
|---|---|---|---|
| `role-template-rework-rate@1.0.0` / `role_template_rework_rate.py` | rate, ratio; 20 | selected defined Tasks; exact Manifest-bound Snapshot/Role-prompt coordinate selected by observed C30; unique terminal Task reading; recorded repair links | open/mixed/undefined Task, missing/incompatible Manifest coordinate, or unavailable repair input is excluded/withheld per Catalog; external prompt-byte availability is not formula input; known no-repair contributes zero numerator; no causal attribution |
| `role-template-trajectory-partial-cost@1.0.0` / `role_template_trajectory_partial_cost.py` | money, source currency; 20 | same Manifest/Snapshot/observed-Role template reading; Delivery-linked direct Usage Facts | exact currency/source/cost-basis slices only; estimated/unattributed/mixed values excluded; always “partial attributable cost,” never total cost |
| `role-model-task-outcome-rate@1.0.0` / `role_model_task_outcome_rate.py` | rate, ratio; 20 | terminal Task reading plus the Catalog-required complete provider/model/Role/Runtime attribution | incomplete projection eligibility and open/mixed Tasks are handled exactly as the Catalog specifies; one numerator per outcome and exact cohort slice; correlation is not model causality |
| `packet-rework-rate@1.0.0` / `packet_rework_rate.py` | rate, ratio; 1 | exact packet identity/revision plus recorded repair relationship | unsupported/missing identity unavailable; known no-repair is covered zero numerator; no severity inference |
| `operational-latency-ms@1.0.0` / `operational_latency_ms.py` | duration, milliseconds; 1 | Trace NODE native duration plus complete model/Role tuple on exact `(trace_id, span_id)` | absent/invalid duration or tuple excludes call; publish contributing-call count; never substitute C55, timestamps, or zero |
| `trajectory-partial-cost@1.0.0` / `trajectory_partial_cost.py` | money, source currency; 20 | exact Delivery-linked direct Usage cost | exact source/unit/currency/basis slices only; estimated/unattributed/mixed excluded; never label total cost |
| `task-cohort-comparison-eligibility@1.0.0` / `task_cohort_comparison_eligibility.py` | rate, ratio; 20 | every Task in selected defined population; §6.2 terminal/comparability classification | denominator retains all defined Tasks; publish each exclusion reason; missing membership/cohort cannot be reconstructed |
| `delivery-stage-reach@1.0.0` / `delivery_stage_reach.py` | rate, ratio; 1 | terminal Delivery IDs plus direct C56 stage identities | one numerator per exact recorded stage; missing/invalid C56 does not enter a reached-stage numerator and is reflected by the Catalog's coverage reading; it does not prove the stage was not executed; no authored-order inference |
| `delivery-terminal-outcome-rate@1.0.0` / `delivery_terminal_outcome_rate.py` | rate, ratio; 1 | exact explicitly terminal Delivery outcome Facts | one numerator per recorded outcome; open Delivery excluded; no Task-outcome inference |
| `delivery-cycle-time-ms@1.0.0` / `delivery_cycle_time_ms.py` | duration, milliseconds; 1 | exact terminal Delivery plus direct C55 elapsed milliseconds | absent/invalid C55 excludes Delivery; publish contributing count; never derive from timestamps or model-call latency |
| `operational-token-usage@1.0.0` / `operational_token_usage.py` | quantity, tokens; 1 | Trace NODE standard input/output token fields plus complete tuple on exact Span identity | keep input/output separate within exact model/Role coordinates; missing measure/tuple excludes call; never synthesize total |
| `operational-attributable-cost@1.0.0` / `operational_attributable_cost.py` | money, source currency; 1 | direct project-attributable Usage cost plus complete tuple and exact Event-to-call binding | exact model/Role/source/unit/currency/basis only; a candidate without exact linked direct cost does not contribute cost and is reflected by Catalog coverage/exclusion; no Delivery/time join, estimate, or conversion |
| `operational-usage-availability@1.0.0` / `operational_usage_availability.py` | rate, ratio; 1 | every exact eligible attributed model call; explicit applicable usage-source classification; complete tuple | every eligible call remains in the denominator; only explicit applicable source enters the numerator; missing classification is also visible in coverage and is never interpreted as zero token usage or automatic whole-metric unavailability |
| `direct-evidence-basis-rate@1.0.0` / `direct_evidence_basis_rate.py` | rate, ratio; 1 | accepted Fact identity and readable accepted provenance classification | direct host/provider basis is numerator; readable nondirect basis is covered zero; unreadable provenance reduces coverage; occurrence does not prove correctness |

The Catalog owns each exact formula, eligibility unit, numerator/denominator, minimum-sample rule, and coverage policy. The matrix above owns only the Evolution module/input assignment and fail-closed physical reading.

## 4. Normalization and compare boundary

The resolver canonicalizes stable IDs bytewise, validates closed enums/revisions, separates compatibility coordinates, and converts only representation—not units—into typed Python values. Integers and money minor units remain integers. Decimal strings become `Decimal` using declared precision/rounding. Ratio numerators and denominators remain exact integers and ratio values use reduced canonical rational strings; BI alone rounds a percentage or decimal presentation to two digits after the decimal point.

Calculators do not compare sides. After two independent 14-item result sets exist, the comparison layer aligns identical metric coordinates and then exact published measure/slice keys, verifying every Catalog-required kind/unit/cohort/provider/runtime/Role/currency/source/cost-basis coordinate. Only a compatible aligned slice may publish `delta = after - before` in the authoritative unit. Otherwise it retains all available Before/After slices and returns a typed withheld reason for the affected slice.

## 5. Conformance matrix

Required fixtures extend existing published identity, duplicate/conflict, pagination, completeness, retention, and expiry coverage. They must prove: all 14 slots exist exactly once; no removed/alias metric is callable; explicit zero differs from absence; minimum sample withholds value but not coverage; open/mixed Task readings fail closed; every per-call join uses exact Span identity; mixed coordinates never combine; Trace expiry affects only dependent inputs; single metric unavailability does not fail the result set; Delta never appears for incompatible sides; and no calculator imports HTTP, database, frontend, another calculator, or runtime engine-selection code.
