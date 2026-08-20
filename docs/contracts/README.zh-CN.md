# Contracts（中文翻译）

[English](README.md) | 中文

> **规范语言：英文。** 本文件是 [`README.md`](README.md) 的非规范跟踪翻译；英文变更时整篇重译替换。

`docs/contracts/` 存放 workflow-self-recursive 每个 Contract 的语义规范文档。每个 Contract 按 [Contract Lifecycle Management](contract-lifecycle.md)（中文翻译：[`contract-lifecycle.zh-CN.md`](contract-lifecycle.zh-CN.md)）定义的标准生命周期管理；其规范机器表示（schemas、registries、fixtures、validators）位于 `system-contracts/` 子模块下同名目录。

## Contract 如何管理

- **成对的两个半区。** Contract = 本目录的语义文档 + `system-contracts/` 的机器表示；发布是成对的，两者都发布前任何 conformance 声明都不可能成立（见 [Contract Lifecycle Management](contract-lifecycle.md) §2）。
- **一个状态机。** 每个 Contract 头部携带 `Lifecycle status`：`DRAFTING → REVIEW_CANDIDATE → FROZEN → DEPRECATED → SUPERSEDED`。只有 `FROZEN` 允许 physical-conformance 声明（§3–§5）。
- **证据把关的转换。** 草案到发布需要语义 review、fresh reader、确定性验证、翻译 parity、机器表示发布与 publication binding（§4）。
- **英文权威。** 语义文档以英文为权威；每个都有 `zh-CN` 非规范跟踪 companion，英文变更时整篇替换。
- **显式义务。** 发布机器表示是受跟踪的义务（`EE-OBL-001` 模式）；下游消费方按精确 revision 跟踪 gap（`runner-EXT-003.x` 模式）（§8）。

## 当前清单

| Contract | 语义文档 | Lifecycle status | Revision |
| --- | --- | --- | --- |
| Observation Catalog | [observation/observation-catalog.md](observation/observation-catalog.md) | `REVIEW_CANDIDATE` | split draft；profile 引用 `0.2.0` |
| OTel Observation Profile | [observation/otel-observation-profile.md](observation/otel-observation-profile.md) | `REVIEW_CANDIDATE` | proposed `0.2.0` |
| Execution–Evidence Interaction Contract | [execution-evidence/interaction-contract.md](execution-evidence/interaction-contract.md) | `REVIEW_CANDIDATE` | split draft |
| Metric Catalog | [evaluation/metric-catalog.md](evaluation/metric-catalog.md) | `REVIEW_CANDIDATE` | split draft |
| Workflow Definition DSL | [workflow/workflow-definition-dsl.md](workflow/workflow-definition-dsl.md) | `REVIEW_CANDIDATE` | `agentops.workflow-dsl@0.1.0` |

状态值是 [Contract Lifecycle Management](contract-lifecycle.md) §9 的规范化映射；各文档自身头部仍是主要来源。

## 编写

新 Contract 作者遵循 [Contract Lifecycle Management](contract-lifecycle.md) §10：在 `docs/contracts/<contract>/` 下按头部模板起草、声明语义闭合、运行 gate G1–G6，并在 `system-contracts/<contract>/` 下发布成对的机器表示。
