<a id="metric-catalog-2-candidate"></a>
# Metric Catalog 2.0 Review Candidate

> **HUMAN SPECIFICATION — REVIEW CANDIDATE, NOT PUBLISHED.** This document is the semantic authority for the `agentops.evaluation.metric-catalog@2.0.0` review candidate. The immutable published `1.0.0` contract remains available at [Metric Catalog 1.0](metric-catalog.md). Until the Contract lifecycle publishes 2.0.0, consumers must not advertise this candidate as a published compatibility target.

## 1. Decision and compatibility boundary

The candidate contains exactly 12 metrics. It removes `packet-rework-rate` and `direct-evidence-basis-rate` because their product questions and eligible populations are not defined precisely enough to implement. Their identifiers are not aliases and produce no 2.0 Metric Result.

This is a MAJOR revision because it removes metrics and changes Usage compatibility semantics. All semantics of the remaining metrics inherit from 1.0.0 except where this candidate explicitly replaces them below. The exact Observation dependency remains the published `observation-contract@1.0.0` binding.

## 2. Exact metric set

| metric_id | kind / unit | evaluation unit |
| --- | --- | --- |
| `role-template-rework-rate` | rate / ratio | terminal Delivery exposed to one exact Manifest-bound role template |
| `role-template-trajectory-partial-cost` | money / reported money unit | terminal Delivery trajectory exposed to one exact Manifest-bound role template |
| `role-model-task-outcome-rate` | rate / ratio | eligible terminal task with complete canonical model-role attribution |
| `operational-latency-ms` | duration / milliseconds | attributed operational model call with native Span duration |
| `trajectory-partial-cost` | money / reported money unit | Delivery trajectory with linked reported money Usage |
| `task-cohort-comparison-eligibility` | rate / ratio | task in the declared defined-task snapshot |
| `delivery-stage-reach` | rate / ratio | Delivery trajectory |
| `delivery-terminal-outcome-rate` | rate / ratio | explicitly terminated Delivery trajectory |
| `delivery-cycle-time-ms` | duration / milliseconds | explicitly terminated Delivery with direct C55 elapsed time |
| `operational-token-usage` | quantity / tokens | attributed operational model call with reported token Usage |
| `operational-attributable-cost` | money / reported money unit | attributed operational model call with linked reported money Usage |
| `operational-usage-availability` | rate / ratio | attributed operational model call |

Each metric definition has version `2.0.0`. No composite score or implicit replacement for a removed metric exists.

## 3. Reported Usage semantics

Evolution consumes recorded Usage only. It does not introduce `cost basis`, `estimated`, `unattributed`, or `project-attributable` classifications and does not derive prices or normalize units.

- Usage values may be combined only inside an exact compatibility group: Usage `kind`, `unit`, `source`, and `source_id` must match, together with every metric-specific cohort dimension.
- Money combines only with money in the exact same reported monetary unit. Tokens combine only with tokens of the same reported token measure. Money and tokens never combine or convert into one another.
- Input and output token measures remain separate. Evolution never synthesizes an absent total-token value.
- A displayed decimal or percentage is a BI presentation transform. Evolution preserves exact integer sums and exact rational results.
- The word `partial` means “sum of the compatible Usage actually recorded for covered units”; it never means estimated total spend.

For call-scoped metrics, a Usage record contributes only when native Trace/Span context binds it to the exact model call. For Delivery- or task-scoped metrics, exact Delivery/Task association is still required. Missing association reduces that metric result's coverage and is never repaired by time, arrival order, or text matching.

For both role-template metrics, the evaluation unit is a Delivery/template exposure, not a Task. The exact template coordinate comes from that Delivery's accepted Manifest and is retained only when recorded C30 model-call data shows that role was exercised. Each terminal Delivery is counted independently even when several Deliveries belong to one Task. One Delivery exposed to several exact templates contributes once to each corresponding cohort. This is descriptive exposure grouping, not template causality or attribution.

`role-template-rework-rate` counts a covered Delivery once in the numerator when its recorded Facts contain at least one valid `FINDING_FIX` relationship; repeated fixes in the same Delivery do not increase the numerator. A completed Fact traversal with no such relationship is a covered zero. Unavailable repair input is missing, never zero. Expired input is outside the current candidate population rather than an unknown historical denominator. `role-template-trajectory-partial-cost` sums only active Usage linked to that same Delivery, separately for each exact template and Usage compatibility coordinate. Both metrics use currently readable, covered Delivery/template exposures for their minimum sample of 20.

A `PARTIAL` Trace read computes from the active exact exposures currently recorded and keeps `PARTIAL` visible in the receipt. The result may therefore change as reporting continues and must converge when Observation reaches final stability. Expired Trace nodes and expired Facts/Usage do not contribute candidates, values, or coverage counts; the receipt remains the authority that historical detail expired. Evolution never reconstructs those records or invents an unknown denominator.

## 4. Per-metric coverage

Coverage is not a standalone quality score. Every metric result and every selected slice publishes its own `{numerator, denominator, raw_ratio, state, alert}`:

- denominator: candidate units satisfying that metric's identity, time-window, cohort, and base-scope rules;
- numerator: those candidates for which every direct input required to compute that metric is available and compatible;
- metric value: computed only from the numerator population; missing candidates remain missing and never contribute zero.

For example, if Evidence exposes 20 in-scope Deliveries and 16 have all inputs required by one metric, that metric's coverage is exactly `16/20`, state `PARTIAL`, and its value uses the 16 covered Deliveries. Another metric over the same 20 Deliveries may have different coverage.

The 1.0 coverage state machine, exact rational arithmetic, `LOW_COVERAGE` threshold rule, always-published coverage, and separate `minimum_sample` behavior remain unchanged.

## 5. Lifecycle and implementation rule

The machine candidate lives under `system-contracts/evaluation-2-candidate/` and must reject both removed coordinates and all semantic drift described above. It has status `REVIEW_CANDIDATE`, has no publication record, and makes no conformance claim. Evolution may implement and test against the owner-approved candidate during Wave 5, but Wave 5 cannot claim a published 2.0 binding until the normal Contract gates and publication step finish.
