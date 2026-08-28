# Delivery Observation Lifecycle — Evidence Query 1.0 Candidate

> **Status:** Iteration 5 design candidate, 2026-08-28. This document defines the breaking
> Delivery-level lifecycle semantics intended for `evidence.query@1.0.0`. The frozen
> `evidence.query@0.1.0` bytes and historical semantics remain unchanged. Chinese tracking
> companion: [`delivery-observation-lifecycle.zh-CN.md`](delivery-observation-lifecycle.zh-CN.md).

## 1. Authority and unit boundary

Evidence owns the recorded observation lifecycle. A Delivery is the logical retention boundary for
the observation dataset used by Evolution. Task membership, accepted provenance, and the immutable
Delivery Manifest remain non-expiring identity authority; they do not keep an expired Delivery in the
current metric population.

Delivery lifecycle is an outer gate. It does not replace the Metric Catalog's inner evaluation units:
a metric may still count Delivery/template exposures, Tasks, or exact model calls. Evolution first
removes every `EXPIRED` Delivery and all inputs contained by it, then applies each metric's published
evaluation-unit and coverage rules to the remaining Deliveries.

## 2. Closed observation states

| State | Meaning | Metric-population consequence |
|---|---|---|
| `ACTIVE` | The Delivery remains in the current observation population and has no recorded integrity gap. | Its applicable inputs enter metric eligibility and coverage normally. |
| `PARTIAL` | The Delivery remains current, but Evidence can prove a gap or invalid required record. | The Delivery remains in the applicable base population; each affected metric omits the bad/missing input from its coverage numerator. Unaffected metrics continue. |
| `EXPIRED` | The Delivery has crossed the committed logical retention boundary. | All inputs owned by that Delivery leave current metric numerator, denominator, coverage, and minimum-sample counts together. |

Retention never produces `PARTIAL`. A mix of active and expired Deliveries is evaluated from the
active subset and is not partial merely because an exclusion exists. If all selected Deliveries are
expired, metrics report `NO_POPULATION`; the receipt may retain `EXPIRED` identities and exclusion
reasons without reconstructing detail.

Metric coverage `PARTIAL` (`0 < covered < eligible`) and compare `PARTIAL_COMPARE` are separate
closed concepts. They are not aliases for Delivery lifecycle state.

## 3. Integrity gaps and invalid records

Evidence may mark an active Delivery `PARTIAL` only from recorded, mechanically verifiable input:

- a recorded parent or link endpoint required by the accepted Trace structure is absent;
- a record with independently valid Delivery and record identity is rejected for a closed schema,
  type, range, or identity-conflict reason.

Evidence records a sanitized Delivery integrity marker for the second case. The marker contains only
the validated Delivery identity, stable source/record identity or category, a closed reason code, and
accepted-safe provenance. It never stores the invalid measurement, promotes rejected content to a
Fact, or creates a Metric Result. A request whose Delivery identity cannot itself be validated remains
an admission/transport failure and cannot contaminate any Delivery.

A completely absent leaf Span with no recorded reference, expected-count declaration, or sequence
coordinate is not provably missing and must not be inferred. The current Observation contract has no
Span expected-count or export-group sequence Oracle.

Separately, Evolution may find that an accepted input fails a metric-specific domain rule. That keeps
the active Delivery/evaluation unit in the metric coverage denominator and omits it from the coverage
numerator. Evolution reports the metric-specific gap without rewriting Evidence's recorded Delivery
state or promoting the invalid value.

## 4. Logical expiry and physical scrubbing

Logical expiry is atomic at Delivery scope. One committed non-expiring Delivery expiry tombstone
makes all of that Delivery's queryable Fact/Trace input unavailable to current metric resolution.
Background storage maintenance may scrub bounded physical records incrementally, but per-record GC
markers and batch progress are internal bookkeeping. They never affect the public Delivery state and
can never create `PARTIAL`.

Snapshots observe either the Delivery before logical expiry or after it. They cannot observe a public
half-expired Delivery merely because a scrub batch has not finished.

## 5. Query and Evolution handoff

Evidence Query 1.0 exposes the exact Delivery observation state with Task membership and with
Delivery-filtered Fact/Trace traversal. Membership identity remains queryable after expiry. Evolution
binds the state and exclusion reason in `ResolvedEvaluationContext`, partitions Deliveries before
normalization, and prevents expired Facts, Trace nodes, Usage, template exposures, model calls, or
Task classifications from leaking into calculators.

For an active or partial Delivery, missing/invalid required input remains metric-specific:

- the applicable evaluation unit stays in the metric coverage denominator;
- only valid covered input enters the coverage numerator;
- `0 / N` is `NO_COVERAGE`, `0 < C < N` is coverage `PARTIAL`, and `N / N` is `FULL`;
- unavailable input never becomes zero, and invalid input never enters arithmetic.

## 6. Conformance

Evidence must prove logical Delivery expiry is atomic across query snapshots, physical scrub progress
does not change public state, retention never emits `PARTIAL`, validated Delivery-scoped invalid input
does emit `PARTIAL`, unassignable invalid input does not, and unreferenced missing leaves are not
inferred. Evolution must prove that adding an expired Delivery changes no metric value, numerator,
denominator, coverage, or minimum-sample count; adding an active Delivery with missing/invalid required
input changes only the applicable metric's coverage; all-expired selections produce `NO_POPULATION`;
and mixed active/expired selections do not become partial or expired as a whole.
