# Iteration 5 Wave 4 Evidence — Metric Result contract and Evolution scaffold

## Result

- Status: `PASS`
- Superproject component-pin commit: `b9601802a` on `iter5/implementation`.
- Contract candidates: `system-contracts@fa42134e`.
- Task producer: `execution-system@06fe7102`.
- Task authority/query implementation: `evidence-system@6631f501`.
- Evolution API/scaffold: `evolution-system@67e8bf6`.
- Owner authorization: Wave3 was accepted and the owner explicitly released Wave4, retained serial
  cross-wave execution, and allowed independent read/audit concurrency within a wave.

Wave4 is PASS. It materializes the accepted Task chain and the closed Evolution API/result boundary,
but does not implement any of the 14 metric formulas or live Evidence traversal. Published/FROZEN
contract packages were not edited in place; new coordinates are review candidates.

## Outputs

### Task vertical chain

- `execution.task-binding@0.1.0` defines versioned `NEW_TASK`/`REUSE_TASK`; omitted user selection
  canonicalizes to NEW. Exact Task ID is identity; optional display name is metadata only.
- Observation Profile 2 candidate carries the durable admission-time `task.binding`. Execution persists
  the Task choice in the Delivery Manifest, emits a stable binding after manifest/slot durability, and
  re-emits the same identity during recovery without making Evidence controlling.
- Evidence atomically admits the Profile 2 owner record into Task declaration, Delivery membership,
  Delivery uniqueness guard and optional display provenance. Conflicts roll back all Task effects.
- `/v1/evidence/tasks` provides bounded list and exact `task_id + as_of` membership traversal. Task
  identity/membership are permanent authority and do not inherit Fact/Trace retention.
- Exact Task ID grammar, profile/family homogeneity, provenance and normalized cutoff are enforced at
  contract, producer, admission, query and receipt boundaries.

### Evolution contract and scaffold

- Stateless FastAPI compute boundary with closed SINGLE/COMPARE requests and responses.
- `EvaluationSelection`, route-local `ResolvedEvaluationContext`, 14-coordinate `MetricResultSet`,
  truth/coverage/value and typed Delta models use strict Pydantic validation.
- Every selected Task has exactly one cutoff-bound `/tasks` traversal receipt. Task membership provenance
  is explicit; `recorded_at` is offset-aware and cannot exceed `as_of`; incomplete traversal or undefined
  membership cannot claim a COMPLETE population.
- Compare preserves a successful side when the other side fails. Exact Delta requires paired AVAILABLE
  slices with matching kind, unit and compatibility; LOWER_BOUND and boolean values cannot publish an
  arithmetic Delta. Delta direction is descriptive and is not good/bad semantics.
- Fourteen isolated calculator module/interface slots exist, one per Catalog coordinate. Boundary tests
  prevent API/resolver/other calculators from importing a concrete calculator. NumPy/Pandas are absent.
- No calculator formula, database access, cross-route snapshot Oracle, browser metric calculation,
  runtime algorithm selector or fallback engine was introduced.

## TDD and validation evidence

RED tests were observed before implementation for selection/result closure, Task propagation and
admission/query, exact receipt semantics, Task cutoff/completion consistency, LOWER_BOUND Delta behavior,
and Delta kind/unit identity. The final GREEN commands were:

- `evolution-system`: `make check` — Ruff format/check, strict mypy, **56 unit tests**, sdist and wheel PASS.
- `execution-system`: `npm test && npm run typecheck && npm run build && npm run check:generated` —
  **68 files / 577 tests** plus all compile/generated checks PASS.
- `evidence-system`: `make check` — Ruff, mypy, **125 unit tests**, sdist and wheel PASS.
- `evidence-system`: `make integration` — disposable PostgreSQL, migrations and **14 integration tests** PASS.
- `system-contracts/task-binding`: `npm test` — **3 tests** PASS.
- `system-contracts/observation-task-binding`: `npm test` — **4 tests** PASS.
- `system-contracts/evidence-task-query`: `npm test` — **4 tests** PASS.

An independent exit reviewer repeatedly tested adversarial receipt constructions. It identified and drove
closure of three P1 classes: incomplete Task identity/cutoff binding, late/naive membership provenance,
and invalid exact Delta publication. Final review at `evolution-system@67e8bf6` found no Wave4-blocking
P0/P1 and independently replayed the complete Evolution gate.

## Checklist disposition

| Wave4 exit item | Result | Evidence |
|---|---|---|
| RED schema/API tests | `PASS` | Evolution closed-model, route and failure tests |
| Task contract alignment | `PASS` | three candidate packages plus Execution/Evidence vertical chain |
| Python service/models/routes and 14 slots | `PASS` | `evolution-system@67e8bf6` |
| calculator isolation | `PASS` | import-boundary and slot completeness tests |
| one implementation/no NumPy/Pandas | `PASS` | dependency and module-boundary checks |
| durable Wave4 report | `PASS` | this report; component pins in `b9601802a` |

## Downstream release

Wave5 ENTRY is satisfied. Wave5 may implement the bounded Evidence client/read-set resolver, then each
Catalog formula using focused RED golden/edge tests, exact integer/Decimal arithmetic and Evolution-owned
compare Delta. Wave5 must not move formulas into BI/Evidence, add a global snapshot Oracle, or infer Task
membership from Workflow, Fact or Trace data.
