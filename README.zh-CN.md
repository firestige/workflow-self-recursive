# workflow-self-recursive

[English](README.md) | 中文

workflow-self-recursive 是一个开源的 Agent 工作流架构：它通过小型、与宿主无关的执行边界运行工作流，并使每次运行都可检查。

它将每次交付（Delivery）绑定到 Workflow Package 的一个确定版本与摘要，保持运行时结果的权威性，并可通过 OpenTelemetry 记录最小必要范围的事实。Runner 是 Execution module M02；LangGraph 是当前可替换 Workflow Host substrate，[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 是当前 concrete Agent Provider。

## Developer preview

workflow-self-recursive 目前是以架构为先的开发者预览版，适用于个人或小团队的可信本地环境。本仓库尚未提供打包的最终用户发行版，但可以从源码启动本地数据服务预览。**后续会有破坏兼容性的变更。**

## 架构

目标产品架构包含两个设计上可独立采用的系统：

- **Execution**：解析并校验一个确定的 Workflow Package，将绑定信息写入不可变的 Delivery Manifest，协调当前交付并发出有界观测事实。
- **Evidence**：接收受支持的 OTLP 事实，建立事实投影并供人检查，但不控制 Execution；Evidence 或遥测不可用时，Execution 仍会继续。

工作流定义与资源位于版本化的 Workflow Package 中。共享契约定义两个系统之间的边界。Runner 是当前的 M02 module；其 Host 与 Provider substrate 是私有、可替换的实现选择。当前不存在 Runner-selection abstraction。

## 开始使用

打包的最终用户发行版尚未完成资格验证。稳定顶层操作契约正在围绕 `setup`、`install`、
`preflight`、`config`、`status`、`health`、`logs`、`start`、`stop`、`restart`、`upgrade`、
`rollback` 与 `uninstall` 建立；当前 adapter 只支持 fixture，不能作为产品安装器。

用户旅程和当前发行状态见[快速开始](docs/guides/quickstart.zh-CN.md)。需要运行现有源码构建数据服务
预览的贡献者，请使用单独的[源码构建指南](docs/contributing/source-build.zh-CN.md)。

正式安装与运维将解析 exact compatible artifacts，不要求构建内部源码仓库，也不选择 ambient
`latest`。uninstall 默认保留用户 durable data。

## 文档

建议从[概念架构](docs/agent-architecture.zh-CN.md)开始，然后继续阅读：

- [Workflow 组合模型](docs/workflow-composition-model.md)
- [Execution System 设计](docs/systems/execution/project-execution-system.zh-CN.md)
  - [Runner 模块设计](docs/systems/execution/modules/runner/runner.zh-CN.md)
    - [Interpreter](docs/systems/execution/modules/runner/interpreter.zh-CN.md)
    - [Lifecycle Coordinator](docs/systems/execution/modules/runner/lifecycle-coordinator.zh-CN.md)
    - [Workflow Host](docs/systems/execution/modules/runner/workflow-host.zh-CN.md)
    - [Managed Agent Invocation](docs/systems/execution/modules/runner/managed-agent-invocation.zh-CN.md)
    - [Custody](docs/systems/execution/modules/runner/custody.zh-CN.md)
  - [Runner 追踪与实现记录](docs/systems/execution/modules/runner/traceability.zh-CN.md)
- [Evidence System 设计](docs/systems/evidence/evidence-system.zh-CN.md)
- [Execution–Evidence Contract](docs/contracts/execution-evidence/interaction-contract.zh-CN.md)

内部仓库拓扑记录在 contributor 源码构建指南中，不属于最终用户安装模型。

## License

[Apache-2.0](LICENSE)
