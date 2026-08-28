# Evidence Retention and Evolution Expiry Disposition — Iteration 5 MVP

> **Status:** Iteration 5 clarification, 2026-08-28. This document records the retention mechanism
> already implemented by Evidence and the narrower way Evolution consumes its expiry states. It does
> not change frozen `evidence.query@0.1.0`, add a new retention subsystem, or require Evidence Query
> 1.0 to expose a Delivery lifecycle API. Chinese tracking companion:
> [`delivery-observation-lifecycle.zh-CN.md`](delivery-observation-lifecycle.zh-CN.md).

## 1. Existing Evidence mechanism

Evidence already runs automatic, resource-granular retention. Production assembly starts one bounded
retention loop with the API process. The loop runs once immediately after startup, then waits the
configured interval before each later iteration. One iteration plans and applies at most one bounded
batch for each enabled lifecycle class in this order: Raw debug, Trace detail, and factual projection.

This mechanism is time/policy driven. It is not triggered by an ingest failure, free-space threshold,
database size, or write-path capacity check. An iteration failure is logged, does not terminate the API,
and is retried only by a later scheduled iteration.

| Class | Default | Configurable range | Effect |
|---|---:|---:|---|
| Raw debug | `PT0S` | `PT0S`–`P1D` | accepted raw payload is scrubbed; accepted identity/provenance remains |
| Trace detail | `P30D` | `P1D`–`P365D` or `NEVER` | expired detail payload is scrubbed and query exposes the published Trace availability/expiry state |
| Factual projection | `P365D` | `P30D`–`P3650D` or `NEVER` | projection payload is scrubbed; query retains an explicit unavailable/expired tombstone |
| Accepted provenance | `NEVER` | not configurable | identity and accepted provenance are retained |

The default batch size is 500 resources per enabled class per iteration (range 1–1000). The default
interval is 60 seconds (range 10–3600 seconds). Configuration is read at service startup; changing an
environment variable requires a restart. Query snapshots continue to provide their published
route-local consistency while retention commits independently.

## 2. Physical expiry is not metric partiality

Frozen Evidence Query 0.1 accurately exposes its existing resource-granular behavior: a Trace with a
mix of active and expired detail may be returned as `PARTIAL`. That state means partial retained Trace
detail. It does not prove that the still-current observation was incompletely reported, and Evolution
must not translate it into metric coverage `PARTIAL`.

For Iteration 5 metric calculation, Delivery is the outer population boundary:

- if a Delivery-scoped read shows retention expiry, Evolution excludes that Delivery and all of its
  inputs from the current population before applying the Catalog's Task, model-call, template-exposure,
  or Delivery evaluation units;
- the excluded Delivery affects neither metric numerator, denominator, coverage, nor minimum-sample
  count;
- a mix of active and retention-expired Deliveries is calculated from the active subset and is not
  metric-partial merely because old data was removed;
- if no active Delivery remains, the metric has `NO_POPULATION`; the receipt may still explain the
  retained identity and expiry state.

An active Delivery with missing or invalid required input is different: the applicable evaluation unit
remains in that metric's coverage denominator, while only valid covered input enters its coverage
numerator. Therefore `0 / N` is `NO_COVERAGE`, `0 < C < N` is coverage `PARTIAL`, and `N / N` is
`FULL`. Invalid values never enter arithmetic.

Metric coverage `PARTIAL`, Evidence Trace detail `PARTIAL`, and `PARTIAL_COMPARE` are three separate
states and must not be aliased.

## 3. Current invalid-input limit

Evidence admission stores no rejected record and OTLP `partial_success` is an aggregate response, not a
durable Delivery-scoped disposition. Consequently, a rejected invalid record cannot later be
distinguished from a record that was never reported. Evolution may report missing input or reject an
invalid accepted value it can actually read, but it must not claim that Evidence recorded an invalid
Delivery input when no such durable marker exists.

Iteration 5 does not add an invalid-record store, expected-Span count, export-group sequence, or inferred
missing leaf. A recorded missing parent/link endpoint may remain visible as an orphan; a completely
unreferenced absent Span is unknowable.

## 4. MVP boundary

The MVP keeps the existing scheduler, TTL classes, environment configuration, resource-granular
markers, bounded batches, and query states. It does not add:

- disk-pressure or write-failure-triggered cleanup;
- a manual Delivery deletion API or administrative UI;
- a Delivery-atomic physical GC/tombstone protocol;
- a durable Delivery-scoped invalid-record marker;
- automatic capacity tuning, compaction, vacuum policy, or retention recommendations.

Operational details and exact environment variables are documented in
[`evidence-system/docs/operations.md`](../../../evidence-system/docs/operations.md) and its Chinese
companion.
