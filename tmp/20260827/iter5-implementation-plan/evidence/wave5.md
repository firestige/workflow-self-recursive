# Iteration 5 Wave 5 Evidence — Evolution Evaluation implementation

## Result

- Status: `PASS`.
- Evaluation machine candidate: `system-contracts@a985acb`.
- Execution Manifest/OTel producer: `execution-system@2ecd636`.
- Evidence Task/Manifest/Fact/Trace authority: `evidence-system@934f839`.
- Evolution implementation: `evolution-system@3ea42e1` on `iter5/implementation`.
- Catalog semantic digest: `851692f9d4a549d21f3c741470737eabb0d40b5f03cf10ffae76e1892023741e`.

The two previously reported blockers were false positives and are closed. Observation requires final
stability, not a transaction-wide cross-route snapshot, and Task authority already follows the
accepted Task declaration/membership path in Evidence. The two genuine Wave5 follow-ups have now
been owner-decided and implemented: configurable traversal safety bounds, and Delivery-level
role-template exposure semantics. Owner clarified that expired records leave the current candidate
population and PARTIAL reads compute from currently recorded active units until final stability. This
removes the apparent unknown historical denominator; Catalog 2.0 remains a review candidate and is not
claimed published.

## Durable authority and computation chain

1. BI supplies an exact `EvaluationSelection` containing Task IDs, not metric IDs or Deliveries.
2. Evolution declares one side-local logical `as_of` and fully traverses Evidence Task membership.
3. Every membership binds an exact Delivery Manifest digest and evidence-safe Manifest projection.
4. Evolution resolves optional Workflow content from bounded ordered public sources by exact Package
   and Snapshot digests; source order is provenance, not equality authority.
5. Evolution independently traverses each Delivery's route-local Facts and Traces. Final settled data
   is repeatable; no cross-route transaction oracle is introduced.
6. Typed normalization produces Delivery, Task, model-call, Role/model, exact Role-template exposure,
   and reported-Usage units.
7. Twelve isolated pure calculators return the twelve candidate Metric Results in Catalog order.
8. Evolution binds selection, Task population, Evidence coordinates, input refs, Workflow diagnostics,
   and Catalog digest into `ResolvedEvaluationContext`.
9. Compare resolves each side independently and computes exact `after - before` only for aligned,
   compatible, available slices.

No step reads PostgreSQL, Execution filesystem/current config, a BI formula, a cross-route global
snapshot, timestamps/arrival order for association, or an ambient Workflow `latest`.

## Delivery-level role-template decision

The evaluation unit for both role-template metrics is a terminal Delivery/template exposure, not a
Task. The exact template comes from that Delivery's accepted Manifest and is retained only when
recorded C30 model-call data shows the Role was exercised.

- `role-template-rework-rate`: one covered Delivery enters the numerator once when its active Facts
  contain at least one valid `FINDING_FIX` relationship (`FIX → FINDING_TARGET`). Repeated fixes in the
  same Delivery still count once. A complete Fact traversal with no fix is covered zero; unavailable
  repair input is missing, while expired input leaves the current population. This is descriptive
  rework, not template/reviewer/writer causality.
- `role-template-trajectory-partial-cost`: reported money Usage must link to the same Delivery and is
  grouped separately by exact template plus `kind/unit/source/source_id`. Usage never crosses between
  Deliveries merely because they share a Task.
- Several Deliveries in one Task count separately. One Delivery that exercised several exact templates
  appears once in each exposure cohort. Minimum sample 20 counts covered Delivery/template exposures.

The machine candidate replaces inherited `evaluation.unique-terminal-task-outcome` and ambiguous
`evaluation.event-time-role-template` references for these two metrics with exact Delivery identity,
Delivery outcome, and `evaluation.delivery-role-template-exposure` inputs.

## Resolution safety bounds

Safety limits are injectable runtime configuration rather than new Contract maxima. Current defaults:

- 500 unique Deliveries per side;
- 20 pages per Task/Facts/Traces traversal (4,000 items at 200 per page);
- 100,000 combined Fact and Trace records per side;
- 120 seconds per side.

Repeated cursors and exceeded bounds fail closed as non-retryable
`RESOLUTION_BOUND_EXCEEDED`; no result is silently truncated. SINGLE returns bounded HTTP 413. COMPARE
preserves a successful side and returns a typed failed side with `SIDE_UNRESOLVED` deltas for slices
known from the successful side. Load testing may tune the configured values without changing metric
semantics.

## Calculator, receipt, and compare proof

- Exact 12/12 candidate registry; removed metrics are rejected.
- Direct Delivery metrics use terminal outcome, C55 cycle time, and C56 stage reach.
- Operational metrics use recorded Trace NODE duration and separate input/output token Usage.
- Task metrics retain defined-task eligibility and descriptive Role/model outcome grouping.
- Cost metrics use recorded Usage only; no pricing, conversion, cost basis, or missing-as-zero fill.
- Role-template metrics use exact Delivery/Manifest/C30 exposure and same-Delivery Facts/Usage.
- Call-scoped Usage remains unavailable when Evidence lacks exact native Span linkage; no fallback join.
- SINGLE returns twelve results. FULL_COMPARE creates one Delta per exact metric/slice identity union;
  twelve is not a fixed Delta count. PARTIAL_COMPARE retains the successful side.
- Ratio and duration arithmetic stays exact; BI alone renders percentages/decimals to two places.
- Trace `PARTIAL`/`EXPIRED` remains visible in the receipt; missing, zero, lower-bound, N/A,
  incompatible, and error remain distinct in results.

## TDD and validation evidence

New RED cases covered Delivery rather than Task identity, same-Delivery Usage binding, typed
`FINDING_FIX` relationship preservation (including nullable endpoint keys), repeated-fix collapse,
cursor repetition, page/Delivery/input-record bounds, deadline, HTTP error mapping, and partial compare
preservation.

Final GREEN commands:

- `make check` at `evolution-system@3ea42e1`: Ruff format/check, strict mypy over `src tests`, **153
  unit tests**, wheel and sdist build — PASS.
- `node tools/build-candidate.cjs && node tools/test-candidate.cjs` at
  `system-contracts@a985acb`: **7 tests**, exact 12-coordinate candidate, Delivery exposure semantics,
  immutable 1.0 inputs, and semantic lock — PASS.

## Checklist disposition

| Wave5 exit item | Result | Evidence |
|---|---|---|
| Durable cross-system design before implementation | `PASS` | bilingual Catalog/Evolution/BI design |
| Cross-system authority and bounds | `PASS` | exact Task→Manifest→Delivery Evidence chain; configurable safety limits |
| Evidence/Workflow clients and bounded resolvers | `PASS` | typed clients, full pagination, repeated-cursor/drift/deadline/bound tests |
| 12 isolated formulas and removed-coordinate rejection | `PASS` | exact registry, calculators, candidate tests |
| Exact arithmetic and per-slice coverage | `PASS` | integer/rational results; zero/missing/sample/compatibility fixtures |
| SINGLE/FULL/PARTIAL compare | `PASS` | compute and typed side-bound failure tests |
| No invented association/global snapshot/DB/frontend formula | `PASS` | exact relationship/Manifest/C30 joins and architecture tests |
| Independent exit review | `PASS` | final fresh-reader audit: P0=0, P1=0, P2=0 at Evolution `3ea42e1` |
| Durable report and superproject pin | `PASS` | this report and exact component pins are committed together |

## Downstream release

Wave5 is closed and Wave6 is released. Candidate publication remains a later Contract lifecycle
action.
