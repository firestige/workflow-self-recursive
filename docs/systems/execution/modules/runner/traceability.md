# Runner Traceability and Implementation Record

## 1. Status and ownership

| Field | Value |
| --- | --- |
| Status | `NON_NORMATIVE_SUPPORTING_RECORD` |
| Semantic authority | [Runner Module Detailed Design](runner.md), effective only with its parent [Execution System candidate](../../project-execution-system.md) |
| System placement | Runner is Execution module M02; it is not a System, subsystem, or implementation behind another M02 module |
| Companion | [Chinese non-normative companion](traceability.zh-CN.md) |
| Provenance | Repository history; this record makes no claim against an unresolvable external commit |

Execution owns the Core boundary and the meaning of M01–M03. Runner owns M02 behavior and its private submodules. This record owns no behavior: it only indexes design IDs, implementation selections, evidence state, and open work.

The current architecture has one Runner. There is no Runner-selection abstraction. The historical TypeScript name `ExecutionRuntimeAdapter` denotes the current Core-to-Runner seam only. If multiple Runner implementations become necessary, M02 may be promoted into a Runner abstraction and each concrete implementation must receive a distinct name.

## 2. Current implementation selection

These are replaceable implementation selections, not stable architecture identities or conformance claims.

| Concern | Current selection |
| --- | --- |
| Workflow Host | LangGraph `1.4.12`, `@langchain/core` `1.2.9` |
| Checkpoint storage | `@langchain/langgraph-checkpoint-sqlite` `1.0.4`, `better-sqlite3` `12.11.1` |
| Managed Agent Provider | DeepSeek Harness `0.1.1-rc.2` |
| Validation | Zod `4.2.0` |
| Workspace/publication | Git `2.52.0` |

## 3. ID namespace and ownership

| ID family | Meaning |
| --- | --- |
| `runner.driver.001..010` | design drivers |
| `runner.scenario.01..12` | scenarios |
| `runner.flow.001..010` | end-to-end flows and their step IDs |
| `runner.view.001..011` | bounded data views |
| `runner.interface.001..005` | private capability interfaces |
| `runner.acceptance.001..014` | acceptance register |
| `runner.decision.001..015` | decision register |
| `runner.open-work.003.1..4`, `.006..013` | remaining evidence and implementation work |
| `runner.submodule.001..005` | Runner-internal submodules |
| `runner.settlement.001` | immutable terminal settlement record |

The parent families `execution.scenario.*`, `execution.fixture.*`, `execution.decision.*`, `execution.open-work.*`, and `execution.module.*` belong to the Execution System Design. The former Runner-level module-ID family is retired because it obscured the M02-to-submodule hierarchy.

### Runner submodules

| ID | Submodule | Detailed design |
| --- | --- | --- |
| `runner.submodule.001` | Lifecycle Coordinator | [lifecycle-coordinator.md](lifecycle-coordinator.md) |
| `runner.submodule.002` | Workflow Host | [workflow-host.md](workflow-host.md) |
| `runner.submodule.003` | Managed Agent Invocation | [managed-agent-invocation.md](managed-agent-invocation.md) |
| `runner.submodule.004` | Custody | [custody.md](custody.md) |
| `runner.submodule.005` | Interpreter | [interpreter.md](interpreter.md) |

### Design-driver definitions

| ID | Driver |
| --- | --- |
| `runner.driver.001` | independent qualification of the current Runner implementation |
| `runner.driver.002` | immutable admitted Delivery binding at the Runner boundary |
| `runner.driver.003` | typed, statically wired Provider integration |
| `runner.driver.004` | serialized workspace mutation safety |
| `runner.driver.005` | durable control truth rather than inferred progress |
| `runner.driver.006` | semantic recovery without blind replay |
| `runner.driver.007` | owner-scoped retirement with preserved settlement evidence |
| `runner.driver.008` | factual, minimized, non-controlling Observation |
| `runner.driver.009` | local operational fit for the current preview |
| `runner.driver.010` | the smallest justified deep structure: five private submodules |

### Scenario, flow, and view landing map

| Concern | Scenario | Flow | View | Interfaces |
| --- | --- | --- | --- | --- |
| authority and qualification | `runner.scenario.01` | `runner.flow.001` | `runner.view.001` | `runner.interface.001` |
| activation and version binding | `runner.scenario.02`, `runner.scenario.12` | `runner.flow.002` (`runner.flow.002.1..3`) | `runner.view.003` | `runner.interface.001`, `runner.interface.004`, `runner.interface.002` |
| managed invocation and mutation | `runner.scenario.03`, `runner.scenario.04` | `runner.flow.003` | `runner.view.011`, `runner.view.004` | `runner.interface.004`, `runner.interface.003`, `runner.interface.002` |
| bounded read fanout | `runner.scenario.05` | `runner.flow.004` | `runner.view.005` | `runner.interface.004`, `runner.interface.003` |
| wait and intervention | `runner.scenario.06` | `runner.flow.005` (`runner.flow.005.1..3`) | `runner.view.006` | `runner.interface.001`, `runner.interface.002` |
| crash and recovery | `runner.scenario.07` | `runner.flow.006` (`runner.flow.006.1..2`) | `runner.view.007` | `runner.interface.002`, `runner.interface.003`, `runner.interface.004` |
| cancellation | `runner.scenario.08` | `runner.flow.007` (`runner.flow.007.1..3`) | `runner.view.008` | `runner.interface.001`, `runner.interface.003`, `runner.interface.002`, `runner.interface.004` |
| publication and settlement | `runner.scenario.09` | `runner.flow.008` (`runner.flow.008.1..3`) | `runner.view.009` | `runner.interface.002`, `runner.interface.004` |
| Observation outage | `runner.scenario.10` | `runner.flow.009` | — | `runner.interface.005` |
| retirement | `runner.scenario.11` | `runner.flow.010` (`runner.flow.010.1..4`) | `runner.view.010` | `runner.interface.001`, `runner.interface.002`, `runner.interface.003`, `runner.interface.004` |

`runner.view.002` records the static dependency direction shared by `runner.interface.001..005`. The Interpreter compiles the admitted activation before Host execution; it is deliberately internal and does not create another Core-facing interface ID.

### Interface definitions

| ID | Meaning |
| --- | --- |
| `runner.interface.001` | current Core-to-Runner `execute` / `inspect` / `cancel` seam for an already admitted activation |
| `runner.interface.002` | Workflow Host capability owned inside Runner |
| `runner.interface.003` | Managed Agent Invocation capability |
| `runner.interface.004` | Custody capability for savepoint, git-tree, scope, result, publication, and settlement state |
| `runner.interface.005` | one-way non-controlling Observation port |

## 4. Acceptance register

| ID | Required outcome | Evidence state |
| --- | --- | --- |
| `runner.acceptance.001` | Execution remains sole Delivery assessor and failures stay fail-closed | design evidence available |
| `runner.acceptance.002` | exact admitted Package/thread; no fabricated progress | Iteration 2 implementation and test evidence |
| `runner.acceptance.003` | typed managed result; bypass rejected | Iteration 2 implementation and test evidence |
| `runner.acceptance.004` | DSH concrete path; unsupported Providers fail without fallback | Iteration 2 implementation and test evidence |
| `runner.acceptance.005` | bounded stable reads; mutation invalidates the view | Iteration 2 implementation and test evidence |
| `runner.acceptance.006` | correlated resume; stale input rejected | Iteration 2 implementation and test evidence |
| `runner.acceptance.007` | continue, restart, or intervene without blind replay | Iteration 2 implementation and test evidence |
| `runner.acceptance.008` | cancellation converges without inventing a terminal outcome | Iteration 2 implementation and test evidence |
| `runner.acceptance.009` | result is preserved and publication is guarded | Iteration 2 implementation and test evidence |
| `runner.acceptance.010` | Observation remains non-controlling and provenance-bound | validator evidence only |
| `runner.acceptance.011` | authorized retirement preserves settlement evidence | Iteration 2 implementation and test evidence |
| `runner.acceptance.012` | later Deliveries may adopt new configuration; in-flight Deliveries cannot | Iteration 2 implementation and test evidence |
| `runner.acceptance.013` | English/Chinese structure and ID sets remain aligned | deterministic documentation check |
| `runner.acceptance.014` | every claim routes to applicable evidence and no unsupported proof is implied | open evidence review |

## 5. Decision register

| ID | Decision |
| --- | --- |
| `runner.decision.001` | Runner is Execution module M02, not a peer System or subsystem. |
| `runner.decision.002` | Runner accepts only a fully admitted activation. |
| `runner.decision.003` | Runner contains five private submodules with single-writer ownership. |
| `runner.decision.004` | Workflow and invocation suspension remain distinct. |
| `runner.decision.005` | Provider execution crosses a typed managed seam with no fallback. |
| `runner.decision.006` | Workspace views are bounded and publication is guarded. |
| `runner.decision.007` | Recovery is three-way and never fabricates an outcome. |
| `runner.decision.008` | Retirement follows one authorization and produces immutable settlement. |
| `runner.decision.009` | Observation is factual, minimized, and non-controlling. |
| `runner.decision.010` | Credentials are action-scoped and excluded from durable content. |
| `runner.decision.011` | LangGraph and DSH are replaceable implementation selections. |
| `runner.decision.012` | In-flight implementation identity cannot be substituted. |
| `runner.decision.013` | The historical `ExecutionRuntimeAdapter` name does not create a current Runner abstraction. |
| `runner.decision.014` | English and Chinese companions keep structural and ID parity. |
| `runner.decision.015` | Published contract semantics are distinguished from incomplete implementation proof. |

## 6. Contract and open-work register

Workflow DSL `1.1.0` and Delivery Admission `1.0.0` are current inputs. Observation Catalog, OTel Observation Profile, and Execution–Evidence Interaction Contract `1.0.0` are frozen and published. Their machine package is validator-only: production mapping and cross-implementation conformance remain unproven.

| ID | Current disposition |
| --- | --- |
| `runner.open-work.003.1` | Runner-side evidence for parent `execution.open-work.001`: prove Workflow DSL compatibility at the admitted-activation boundary |
| `runner.open-work.003.2` | Runner-side evidence for parent `execution.open-work.002`: prove Delivery Admission and Manifest binding in implementation |
| `runner.open-work.003.3` | Runner-side evidence for parent `execution.open-work.003`: prove the current Core-to-Runner seam; legacy runtime-profile SPI names are historical only |
| `runner.open-work.003.4` | Runner-side evidence for parent `execution.open-work.004`: prove production Observation mapping and cross-implementation conformance |
| `runner.open-work.006` | canonical-identity representation-binding spike; retain the original ID and evidence meaning |
| `runner.open-work.007` | OTel semantic-carrier spike; retain the original ID and evidence meaning |
| `runner.open-work.008` | post-MVP Provider work beyond the DSH-only MVP |
| `runner.open-work.009` | complete fault and recovery fixture corpus |
| `runner.open-work.010` | complete supported-substrate qualification evidence |
| `runner.open-work.011` | replace operational defaults with measured values where required |
| `runner.open-work.012` | prove exact submodule interfaces and static dependency direction |
| `runner.open-work.013` | prove Observation mapping and outage isolation in production integration |

Legacy uppercase profile identifiers and `agent-ops.runtime-profile-spi@1.0.0` are historical Git evidence only. They are not current authority, readiness state, or active dependency names.

## 7. Iteration 2 evidence routing

The implementation evidence is the pinned `execution-system` submodule, especially `src/interpreter`, `src/coordinator`, `src/host`, `src/invocation`, `src/custody`, and `src/composition`. Tests under `execution-system/test/{interpreter,coordinator,host,invocation,custody,integration,providers,contracts}` cover the implemented Runner boundary and private collaboration. This evidence proves the checked Iteration 2 implementation only; it does not prove M01 Delivery, production Observation integration, or cross-implementation conformance.
