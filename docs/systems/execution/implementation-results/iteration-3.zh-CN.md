# Iteration 3 Execution 实施结果

状态：`REOPENED_#57`
范围：[#45](https://github.com/firestige/workflow-self-recursive/issues/45)、[#46](https://github.com/firestige/workflow-self-recursive/issues/46)、[#57](https://github.com/firestige/workflow-self-recursive/issues/57)、[#86](https://github.com/firestige/workflow-self-recursive/issues/86)，以及 Execution-level Configuration/Factory/Bootstrap support  
版本：Execution Core 与 DSH Intake `0.1.0`；Workflow Package release `0.3.0`

本文记录 implementation evidence，不重新定义 frozen Workflow/Delivery Admission Contract、Iteration 2 Runner 五组件语义或两个 initial Workflow Package。#87 保持独立，不在本轮声明完成。

修正说明（2026-08-24）：原 qualification 把 WSR 安装到 custom base-only DSH profile，只证明 package loading，没有提供 interactive conversation surface，因此不满足 #57 的用户 E2E 门禁。#57 与 Iteration 3 已重新打开。修正后的 assembly 把同一个 Adapter 安装到 locked DSH 内置 `web` profile。Automated clean-profile evidence 已启动真实 browser surface、创建真实 DSH session、经 Web command transport 发现 `/wsr`、执行 `/wsr list`，并读取 durable rendered result。在同一 Intake session 中完成 credentialed `/wsr create ...` 人工 E2E、实际执行 Workflow 并观察结果前，Iteration 3 保持未完成。

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

受支持的 interactive host assembly 是 DSH 内置 `web` profile，而不是原 quickstart 所写的 base-only custom `workflow-execution` profile。`workflow-execution` 仍是 stable Cordis row 与 skill name。`test/tooling/dsh-interactive-intake-qualification.test.ts` 走 browser 使用的同一 `commands/list`/`commands/execute` Web transport，并从 session history 验证 user-visible `command/run`/`command/done` result。

## #86 — production composition evidence

Iteration 2 Runner 继续只依赖 lightweight one-way Observation port。Iteration 3 在外层 production composition 提供 mapping/exporter。受保护的 Interpreter、Lifecycle Coordinator、Workflow Host、Managed Agent Invocation、Custody 与 DSH Provider implementation path 相对 Iteration 2 baseline 保持 source zero-diff。Observation transport、sink、retry queue、outbox 或 Evidence storage 均未进入 Runner。

## Configuration、Bootstrap 与发布验收

`execution.config@1.0.0` 是 closed YAML/JSON input，提供 canonical identity、external credential reference、唯一 Source、explicit model/provider binding、optional loopback OTLP endpoint、bounded global controls、versioned defaults/examples、schema、CLI 与 redacted diagnostic。只有 Bootstrap 执行 load/validate、installation construction、multi-slot recovery、Delivery-scoped composition、ready publication、rollback 与 reverse shutdown。

Repository [本地发布前 E2E 指南](../../../guides/dsh-execution-local-e2e.zh-CN.md)、final-Release [quickstart](../../../guides/dsh-execution-quickstart.zh-CN.md)与[配置参考](../../../reference/execution-configuration.zh-CN.md)是彼此独立的 CI 输入；后两者同时是 GitHub Release documentation asset。Clean-checkout CI 执行 full/coverage/typecheck/build/static/feasibility/conformance/config/bootstrap/install gates，构建两个 archive，校验独立 inventory/digest publication record，在 clean npm consumer 安装 Core，验证无 WSR hook 的 DSH add/update/remove/reinstall，并核对 owner-provided Workflow Package `0.3.0` asset：

| Asset | SHA-256 |
| --- | --- |
| `workflow-package-release-0.3.0.json` | `c585123a882083e31b0e115e7edb31fc75151d9e111914e1e30dd56a1e5aca51` |
| `workflow-package-implementation-workflow-0.3.0.tar.gz` | `f5b25f82771efe5472439eced0038207d66416f139cdd4b207a9645b100ed148` |
| `workflow-package-system-design-workflow-0.3.0.tar.gz` | `abd818546d413f36f69693603b897eac25f138db079ea1af08336e7544d98231` |

## 已发布 identity 与最终 qualification

- system-contracts Iteration 3 commit：`c8e090f80073e3a4a37063d2d0165f190f2ec7f1`；
- Execution System Iteration 3 commit：`b00dc40137259eee4dc488b1781fde7ed731e36e`；
- Execution Release：[0.1.0](https://github.com/firestige/execution-system/releases/tag/0.1.0)，target 为上述 exact Execution commit；
- Workflow Package owner release：[0.3.0](https://github.com/firestige/workflow-package/releases/tag/0.3.0)，revision 为 `ed2a0bddda1eeaba77f19c5e543fe0c82d55fefb`。

| Execution Release asset | SHA-256 |
| --- | --- |
| `workflow-self-recursive-execution-system-0.1.0.tgz` | `6fef452ccf5349f7ecd90a1f1266a920a434504bd39c9d3bfddc7f364e7383c5` |
| `workflow-self-recursive-dsh-intake-0.1.0.tgz` | `9151365d584e23e2098fdd368bac404c0e24ef296c9906f95577c5660e235bb8` |

component-first squash 后，最终 pinned 组合通过 53 个 test file / 479 个 test，coverage（statements `90.08%`、branches `85.79%`、functions `94.08%`、lines `95.77%`）、typecheck、build、generated/static/feasibility、frozen Contract/Package conformance、documentation parity、artifact verification、clean npm package-root import 与真实 `execution-config init`，以及 locked DSH remove/reinstall recovery。全部九个 Execution Release asset 均已重新下载；publication verifier、clean install、CLI 与 DSH lifecycle qualification 已针对下载后的 bytes 通过。
