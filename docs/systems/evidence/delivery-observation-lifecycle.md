# Evidence Delivery Retention and Evolution Disposition — Iteration 5 MVP

> **Status:** Evidence Query 1.0 candidate, 2026-08-28. This document supersedes the earlier
> Iteration 5 resource-granular retention clarification for the unpublished Query 1.0 candidate. It
> does not rewrite frozen `evidence.query@0.1.0`. Chinese tracking companion:
> [`delivery-observation-lifecycle.zh-CN.md`](delivery-observation-lifecycle.zh-CN.md).

## 1. Delivery is the retention atom

Facts, recorded Trace detail, Task membership and the evidence-safe Manifest are one queryable
Delivery dataset. They do not expire independently in Query 1.0. A Delivery becomes eligible only
after an accepted terminal `delivery.summary`; its committed Projection `recorded_at` is the retention
base. A Delivery with no accepted terminal summary is not automatically expired.

The candidate default Delivery TTL is `P30D`, configurable from `P1D` through `P3650D` or `NEVER`.
The scheduler remains bounded and configurable. A batch selects Delivery identities, not individual
projection resources, and each selected Delivery commits one atomic deletion of all its queryable
Facts, Trace detail, membership, guard and Manifest projection. A reader sees either the complete
pre-delete Delivery dataset or no queryable Delivery dataset, never a retention-created subset.

Raw debug remains a separate privacy lifecycle with its existing immediate default. Accepted-content
digest/provenance and a minimal internal deleted-Delivery guard may remain solely to preserve
duplicate/conflict authority and prevent late records from recreating a deleted Delivery. They are not
queryable Delivery data, a tombstone API, or recoverable payload.

## 2. Query and metric consequences

Ordinary Evidence routes expose active Delivery data only:

- `/facts` and `/traces` never return a resource belonging to a deleted Delivery;
- `/tasks` lists only Tasks with at least one active Delivery and membership traversal returns only
  active Delivery memberships;
- exact Manifest lookup for a deleted Delivery returns no queryable Manifest;
- direct Trace lookup after Delivery deletion is indistinguishable from absent detail to ordinary
  consumers; it cannot reveal or reconstruct deleted identity;
- retention never creates Trace `PARTIAL` or an expired node/edge. `PARTIAL` is reserved for an active
  Delivery whose recorded observation itself has a known data hole.

Evolution therefore needs no retention-specific per-resource normalization. It resolves only active
Delivery membership and computes from those inputs. A deleted Delivery enters neither numerator,
denominator, coverage nor minimum-sample count. If no active Delivery remains, the result population
is empty. Metric Results are computed responses, not retained datasets, so there is no separate Metric
Result deletion lifecycle.

## 3. Physical deletion and no recovery

MVP expiry is automatic physical deletion, not logical deletion. BI cannot discover deleted Delivery
data. Iteration 5 provides no trash, undelete, restore, retention hold, administrative recovery view or
separate Trace/metric data-management treatment. A later data-management design may introduce those
capabilities only through a new explicit lifecycle and contract.

The internal deleted-Delivery guard contains no Fact value, Trace node/edge, Manifest payload or other
recoverable dataset. It exists only to keep deletion final when delayed Observation export retries the
same Delivery identity.

## 4. Active-data partiality

An active Delivery can still have missing or invalid required input. That is not retention. The
applicable evaluation unit remains in the affected metric's coverage denominator, while only valid
covered input enters its numerator. Invalid values never enter arithmetic.

Evidence does not infer an unreported Span, expected-Span count or missing leaf. A recorded edge whose
target NODE was never observed remains an unresolved endpoint. Such a hole may be presented as
recorded incompleteness, but neither Evidence nor BI attributes it to expiry.

## 5. MVP exclusions

Iteration 5 does not add disk-pressure cleanup, write-failure-triggered cleanup, logical deletion,
restore, administrative data-management UI, automatic capacity tuning, compaction recommendations or
a durable invalid-record store. Delivery TTL, scheduler interval and Delivery batch bounds remain
startup configuration and require explicit restart to change.
