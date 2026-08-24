# Iteration 3 Execution 实施结果

状态：`RELEASE_CANDIDATE`  
范围：[#45](https://github.com/firestige/workflow-self-recursive/issues/45)、[#46](https://github.com/firestige/workflow-self-recursive/issues/46)、[#57](https://github.com/firestige/workflow-self-recursive/issues/57)、[#86](https://github.com/firestige/workflow-self-recursive/issues/86)，以及 Execution-level Configuration/Factory/Bootstrap support  
版本：Execution Core 与 DSH Intake `0.1.0`；Workflow Package release `0.3.0`

本文记录 implementation evidence，不重新定义 frozen Workflow/Delivery Admission Contract、Iteration 2 Runner 五组件语义或两个 initial Workflow Package。#87 保持独立，不在本轮声明完成。

## #45 — M01 Delivery

`execution-system/src/delivery`、`src/core` 与 production bootstrap 实现 canonical-worktree immediate admission、`CONTENDED/RECOVERY/NEW`、exact/sticky-latest selector、唯一 configured Source、private `MISSING/STAGING/READY` Store、frozen Package validation、immutable prompt/attachment snapshot、Runner effect 前的 Manifest/DeliveryBinding persistence、start uncertainty、recovery、terminal handling 与 authorized abandonment。

Evidence 包括 admission/recovery、current-slot、Package Source/resolution、Manifest identity、projection、lifecycle tests；production walking skeleton 通过 GitHub Source 下载 `implementation-workflow@0.3.0` 并抵达独立 DSH-E；composition corpus 证明 persisted M01 binding 先于 Delivery-scoped M02/M03 instance/effect；fault corpus 证明 `CONTENDED`/`RECOVERY` 不执行 selector/Source/Store 或新 prompt work。

## #46 — M03 Delivery Observation

`execution-system/src/observation` 将 M01/M02 owner fact 映射到 frozen `agentops.observation@1.0.0` allow-list，并通过 official OpenTelemetry package 发射 standard OTLP/protobuf。Disabled 不创建 exporter/network resource；reject、timeout、exporter failure、tail loss 与 ambiguous flush 不改变 Delivery result、settlement、current-slot 或 lifecycle truth。

Producer-role evidence 位于 `test/observation/producer-role-corpus.test.ts`、`test/observation/runner-owner-fact-port.test.ts` 与 `test/bootstrap/composition-contracts.test.ts`：M01/M02 仍是 fact owner，one-way ingress 在相关 Runner effect 前接线，M03 不派生 owner truth，也没有 callback/control edge。Privacy/outage evidence 位于 `test/observation/{production-mapper,otlp-exporter,producer-role-corpus}.test.ts` 与 total fault corpus；禁止的 prompt/message/tool/credential/native/error body 不进入 record、protobuf bytes、buffer 或 diagnostic。

Frozen `agentops.observation@1.0.0` publication record 保持 `VALIDATOR_ONLY`。本文只声明 production emitter 与 producer-role/outage/privacy evidence，不声明 formal cross-implementation conformance。

## #57 — host-neutral entry 与 replaceable Intake

Package root 导出 host-neutral `ExecutionApplication`、`ExecutionApplicationFactory`/`DefaultExecutionApplicationFactory`、`ExecutionRequest`、`TaskPrompt`、lifecycle/control type、configuration schema/type 与唯一 production bootstrap path。Replacement-Intake contract test 不安装 DSH plugin，也能消费同一 request/result corpus。

`@workflow-self-recursive/dsh-intake@0.1.0` 是首个 Adapter distribution。它拥有 `/wsr`、显式 `/workflow-execution`、DSH-I-only `workflow_execution_intake`、bounded rendering 与外置 adapter-private session↔Delivery binding。DSH-I 与 Runner-owned DSH-E 的 Context/service/session/persistence identity 均不同；Intake lifecycle 级联关闭 Execution/DSH-E，并保留 restart 所需 durable truth。Command 与 skill-mediated create 原样保留 current turn/attachments，并收敛到一个 `WorkflowIntakeService` 与 M01 path。

## #86 — production composition evidence

Iteration 2 Runner 继续只依赖 lightweight one-way Observation port。Iteration 3 在外层 production composition 提供 mapping/exporter。受保护的 Interpreter、Lifecycle Coordinator、Workflow Host、Managed Agent Invocation、Custody 与 DSH Provider implementation path 相对 Iteration 2 baseline 保持 source zero-diff。Observation transport、sink、retry queue、outbox 或 Evidence storage 均未进入 Runner。

## Configuration、Bootstrap 与发布验收

`execution.config@1.0.0` 是 closed YAML/JSON input，提供 canonical identity、external credential reference、唯一 Source、explicit model/provider binding、optional loopback OTLP endpoint、bounded global controls、versioned defaults/examples、schema、CLI 与 redacted diagnostic。只有 Bootstrap 执行 load/validate、installation construction、multi-slot recovery、Delivery-scoped composition、ready publication、rollback 与 reverse shutdown。

Repository [quickstart](../../../guides/dsh-execution-quickstart.zh-CN.md)与[配置参考](../../../reference/execution-configuration.zh-CN.md)既是 CI 输入，也是 GitHub Release documentation asset。Clean-checkout CI 执行 full/coverage/typecheck/build/static/feasibility/conformance/config/bootstrap/install gates，构建两个 archive，校验独立 inventory/digest publication record，在 clean npm consumer 安装 Core，验证无 WSR hook 的 DSH add/update/remove/reinstall，并核对 owner-provided Workflow Package `0.3.0` asset：

| Asset | SHA-256 |
| --- | --- |
| `workflow-package-release-0.3.0.json` | `c585123a882083e31b0e115e7edb31fc75151d9e111914e1e30dd56a1e5aca51` |
| `workflow-package-implementation-workflow-0.3.0.tar.gz` | `f5b25f82771efe5472439eced0038207d66416f139cdd4b207a9645b100ed148` |
| `workflow-package-system-design-workflow-0.3.0.tar.gz` | `abd818546d413f36f69693603b897eac25f138db079ea1af08336e7544d98231` |

Component/superproject final commit identity、Execution artifact digest、Release URL、clean re-download evidence 与 issue closure 在 component-first squash 和最终 qualification 后补录。
