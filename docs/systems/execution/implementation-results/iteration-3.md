# Iteration 3 Execution implementation result

Status: `RELEASED`
Scope: [#45](https://github.com/firestige/workflow-self-recursive/issues/45), [#46](https://github.com/firestige/workflow-self-recursive/issues/46), [#57](https://github.com/firestige/workflow-self-recursive/issues/57), [#86](https://github.com/firestige/workflow-self-recursive/issues/86), and Execution-level Configuration/Factory/Bootstrap support  
Version: Execution Core and DSH Intake `0.1.0`; Workflow Package release `0.3.0`

This result records implementation evidence; it does not redefine the frozen Workflow or Delivery Admission Contracts, the Iteration 2 Runner five-component meaning, or either initial Workflow Package. #87 remains separate and is not claimed here.

## #45 — M01 Delivery

Production code under `execution-system/src/delivery`, `src/core`, and the production bootstrap implements immediate canonical-worktree admission, `CONTENDED/RECOVERY/NEW`, exact/sticky-latest selector resolution, one configured Source, private `MISSING/STAGING/READY` Store, frozen-package validation, immutable prompt/attachment snapshots, Manifest/DeliveryBinding persistence before Runner effect, start uncertainty, recovery, terminal handling, and authorized abandonment.

Evidence:

- delivery tests: admission/recovery, current-slot, package Source/resolution, Manifest identity, projection, and lifecycle;
- production walking skeleton downloads `implementation-workflow@0.3.0` through the GitHub Source path and reaches the separately owned DSH execution context;
- configuration/bootstrap corpus proves persisted M01 binding precedes every Delivery-scoped M02/M03 instance and effect;
- fault corpus proves `CONTENDED` and `RECOVERY` perform no selector/Source/Store or new prompt work.

## #46 — M03 Delivery Observation

Production code under `execution-system/src/observation` maps M01/M02 owner facts to the frozen `agentops.observation@1.0.0` allow-list and emits standard OTLP/protobuf through official OpenTelemetry packages. Disabled mode creates no exporter/network resource. Rejection, timeout, exporter failure, tail loss, and ambiguous flush cannot change Delivery result, settlement, current-slot, or lifecycle truth.

Producer-role verification is `test/observation/producer-role-corpus.test.ts`, `test/observation/runner-owner-fact-port.test.ts`, and `test/bootstrap/composition-contracts.test.ts`: M01/M02 remain fact owners, the one-way ingress is wired before related Runner effects, M03 derives no owner truth, and no callback/control edge exists. Privacy/outage evidence is in `test/observation/{production-mapper,otlp-exporter,producer-role-corpus}.test.ts` plus the total fault corpus; prohibited prompt/message/tool/credential/native/error bodies do not reach records, protobuf bytes, buffers, or diagnostics.

The frozen `agentops.observation@1.0.0` publication record remains `VALIDATOR_ONLY`. This result claims production emitter implementation and producer-role/outage/privacy evidence only; it does not claim formal cross-implementation conformance.

## #57 — host-neutral entry and replaceable Intake

The package root exports the host-neutral `ExecutionApplication`, `ExecutionApplicationFactory`/`DefaultExecutionApplicationFactory`, `ExecutionRequest`, `TaskPrompt`, lifecycle/control types, configuration schema/types, and one production bootstrap path. Replacement-Intake contract tests consume the same request/result corpus without installing the DSH plugin.

`@workflow-self-recursive/dsh-intake@0.1.0` is the first Adapter distribution. It owns `/wsr`, explicit `/workflow-execution`, DSH-I-only `workflow_execution_intake`, bounded rendering, and external adapter-private session↔Delivery bindings. DSH-I and Runner-owned DSH-E use distinct Context/service/session/persistence identities; Intake lifecycle cascades shutdown to Execution/DSH-E and preserves durable truth for restart. Command and skill-mediated create preserve the current turn and attachments and converge on one `WorkflowIntakeService` and M01 path.

## #86 — production composition evidence

The Iteration 2 Runner continues to depend only on its lightweight one-way Observation port. Iteration 3 adds the mapping/exporter and supplies it from the outer production composition. The protected Interpreter, Lifecycle Coordinator, Workflow Host, Managed Agent Invocation, Custody, and DSH Provider implementation paths have zero source diff against the Iteration 2 baseline. No Observation transport, sink, retry queue, outbox, or Evidence storage concern moved into Runner.

## Configuration, Bootstrap, and release qualification

`execution.config@1.0.0` is a closed YAML/JSON input with canonical identity, external credential reference, one Source, explicit model/provider binding, optional loopback OTLP endpoint, bounded global controls, versioned defaults/examples, schema, CLI, and redacted diagnostics. Bootstrap alone performs load/validate, installation construction, multi-slot recovery, Delivery-scoped composition, ready publication, rollback, and reverse shutdown.

The repository [quickstart](../../../guides/dsh-execution-quickstart.md) and [configuration reference](../../../reference/execution-configuration.md) are CI inputs and GitHub Release documentation assets. Clean checkout CI runs full/coverage/typecheck/build/static/feasibility/conformance/config/bootstrap/install gates; builds both archives; verifies separate inventory/digest publication records; installs the Core in a clean npm consumer; exercises DSH add/update/remove/reinstall without WSR hooks; and verifies the owner-provided Workflow Package `0.3.0` descriptor/assets:

| Asset | SHA-256 |
| --- | --- |
| `workflow-package-release-0.3.0.json` | `c585123a882083e31b0e115e7edb31fc75151d9e111914e1e30dd56a1e5aca51` |
| `workflow-package-implementation-workflow-0.3.0.tar.gz` | `f5b25f82771efe5472439eced0038207d66416f139cdd4b207a9645b100ed148` |
| `workflow-package-system-design-workflow-0.3.0.tar.gz` | `abd818546d413f36f69693603b897eac25f138db079ea1af08336e7544d98231` |

## Published identities and final qualification

- system-contracts Iteration 3 commit: `c8e090f80073e3a4a37063d2d0165f190f2ec7f1`;
- Execution System Iteration 3 commit: `b00dc40137259eee4dc488b1781fde7ed731e36e`;
- Execution Release: [0.1.0](https://github.com/firestige/execution-system/releases/tag/0.1.0), targeted at the exact Execution commit above;
- Workflow Package owner release: [0.3.0](https://github.com/firestige/workflow-package/releases/tag/0.3.0), revision `ed2a0bddda1eeaba77f19c5e543fe0c82d55fefb`.

| Execution Release asset | SHA-256 |
| --- | --- |
| `workflow-self-recursive-execution-system-0.1.0.tgz` | `6fef452ccf5349f7ecd90a1f1266a920a434504bd39c9d3bfddc7f364e7383c5` |
| `workflow-self-recursive-dsh-intake-0.1.0.tgz` | `9151365d584e23e2098fdd368bac404c0e24ef296c9906f95577c5660e235bb8` |

After component-first squash, the final pinned combination passed 53 test files / 479 tests, coverage (`90.08%` statements, `85.79%` branches, `94.08%` functions, `95.77%` lines), typecheck, build, generated/static/feasibility, frozen Contract/Package conformance, documentation parity, artifact verification, clean npm package-root import and real `execution-config init`, and locked-DSH remove/reinstall recovery. All nine Execution Release assets were re-downloaded; the publication verifier, clean installation, CLI, and DSH lifecycle qualification passed against those downloaded bytes.
