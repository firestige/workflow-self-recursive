# Iteration 5 Wave 10 Evidence — downstream independence qualification

## Result

- Status: `PASS`.
- Superproject qualification: `1352f8f9763882ec40663207f744bd82a0b93b27`.
- Execution implementation: `execution-system@cf0381314ae6b21839e55687c2c6420d2a556fdf`.
- Evidence implementation: `evidence-system@7e3ff4a9f87b17b428a07054ff9826aeb863b57f`.
- Evolution input: `evolution-system@a12fc92b68822ed64d07eda0663b96a17b131fb6`.
- BI input: `wsr-ui@7cfc8a840800ff097e31696ef0079050e5e0c057`.
- Issue: [#56](https://github.com/firestige/workflow-self-recursive/issues/56), kept OPEN through Wave12.

Execution's canonical result, settlement and terminal inspection are identical whether its generic
Observation port succeeds, rejects, throws or never settles. Evidence, Evolution and BI do not appear in
Execution's product dependency, route, configuration or control graph.

## Canonical result and Observation lifecycle

- The deterministic Runtime Adapter oracle runs the same Delivery activation and terminal proposal for
  success, rejected Promise, synchronous throw and never-settling Observation dispositions. It compares
  the complete returned result and terminal inspection, not only the outcome label.
- Terminal truth is durably assigned before the fire-and-forget Observation call. Observation cannot
  affect execute/inspect/cancel or introduce a retry/cancellation decision.
- Disabled Observation creates no transport. Rejection, refusal, timeout, tail loss, ambiguous commit,
  malformed response and exporter failure remain bounded diagnostics.
- The previously declared `flushIntervalMs` and `shutdownFlushMs` configuration is now active. A periodic
  exporter flush is scheduled, and close applies one total shutdown deadline. A never-settling send or
  transport shutdown therefore cannot hold Execution open; remaining telemetry is best-effort loss.

## Cross-system boundary proof

- The static checker rejects Evidence Query routes, Evolution compute routes/types, downstream package
  dependencies and database dependencies in Execution source/package metadata.
- It verifies that canonical terminal truth is assigned before the exact fire-and-forget Observation
  anchor. Legal internal Action interaction receipts are not confused with Evolution's response receipt.
- Task NEW/REUSE remains local identity selection and propagation. The absence of an Evidence query route
  or client in Execution proves BI Task discovery is a convenience, not an admission authority.
- The Wave9 Compose topology has no Execution service or reverse control network. Evolution/BI outages
  therefore have no endpoint or configuration through which they could influence Execution.

## External producer and recovery proof

- Evidence's production HTTP app accepts an official OTLP/protobuf request with
  `service.name=third-party-agent`, no Execution package import and no producer allow-list. The response is
  full OTLP success and the exact external event identity lands in Admission storage.
- PostgreSQL-backed integration covers atomic admission, identical retry and storage close/reopen recovery
  with the published Observation profile. Combined with generic downstream reject/never-settle behavior,
  this proves an Evidence outage cannot feed an outcome back to Execution; the oracle does not claim a
  literal Evidence-container kill/restart scenario.

## Mutant sensitivity

The qualification executes three controlled negative calibrations in memory:

1. an Execution source route to Evolution compute is rejected;
2. replacing fire-and-forget Observation with an awaited downstream call is rejected;
3. changing the canonical outcome under a downstream disposition is rejected by the exact comparator.

These mutants are temporary inputs to the oracle and are never written into candidate product source.

## Reproducible validation

```text
python3 qualification/iter5/independence/qualify.py
cd execution-system && pnpm test && pnpm typecheck && pnpm build && pnpm check:generated
cd evidence-system && make check && ./scripts/integration-test.sh
```

Results:

- Qualification: static/mutant PASS; Execution **4 files / 70 tests PASS**; Evidence **15 focused
  tests PASS**; PostgreSQL integration **16 tests PASS**; normalized Compose boundary PASS.
- Execution full gate: **75 files / 612 tests PASS**; strict TypeScript, build and generated-contract
  check PASS.
- Evidence full gate: Ruff format/check, strict mypy and package build PASS; **135 tests PASS**.

## Checklist disposition

| Wave10 exit item | Result | Evidence |
|---|---|---|
| Execution-alone canonical result | `PASS` | exact result/inspection equality across four downstream dispositions |
| Observation outage matrix | `PASS` | disabled/reject/refuse/timeout/throw/tail-loss/ambiguous/malformed/never-settle |
| Bounded shutdown | `PASS` | periodic flush plus total `shutdownFlushMs` deadline RED/GREEN oracle |
| External conforming producer | `PASS` | third-party service identity accepted through production OTLP HTTP app |
| Evidence crash/restart | `PASS` | PostgreSQL admission/retry/restart integration suite |
| No reverse/control/database edge | `PASS` | source/dependency/route scan and Wave9 topology check |
| Task reuse remains local | `PASS` | no Evidence query/client; exact submitted Task ID propagation |
| Deliberately coupled mutants | `PASS` | route, awaited downstream and canonical-result mutants all detected |
| Independent exit review | `PASS` | exact fixed candidate coordinates; P0=0/P1=0/P2=0 |

## Downstream release

Wave10 closes #56's implementation slice while keeping the issue open through Wave12. Wave11 may begin
component squash merge and final repinning; it must preserve these exact qualification oracles.
