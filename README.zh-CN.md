# workflow-self-recursive

[English](README.md) | 中文

workflow-self-recursive 是一个开源的 Agent 工作流架构：它通过小型、与宿主无关的执行边界运行工作流，并使每次运行都可检查。

它将每次交付（Delivery）绑定到 Workflow Package 的一个确定版本与摘要，保持运行时结果的权威性，并可通过 OpenTelemetry 记录最小必要范围的事实。初始设计以 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 作为首个运行时宿主；后续计划提供第一方 LangGraph 适配器。

## Developer preview

workflow-self-recursive 目前是以架构为先的开发者预览版，适用于个人或小团队的可信本地环境。本仓库当前发布设计、契约与组件边界，尚未提供可供最终用户运行的发行版。**后续会有破坏兼容性的变更。**

## 架构

目标产品架构包含两个设计上可独立采用的系统：

- **Execution**：解析并校验一个确定的 Workflow Package，将绑定信息写入不可变的 Delivery Manifest，协调当前交付并发出有界观测事实。
- **Evidence**：接收受支持的 OTLP 事实，建立事实投影并供人检查，但不控制 Execution；Evidence 或遥测不可用时，Execution 仍会继续。

工作流定义与资源位于版本化的 Workflow Package 中。共享契约定义两个系统之间的边界，运行时则作为可替换适配器位于 Execution 边界之后。

## 获取源码

克隆本仓库及其组件仓库：

```sh
git clone --recurse-submodules https://github.com/firestige/workflow-self-recursive.git
cd workflow-self-recursive
```

如果已经在未包含 submodule 的情况下克隆了本仓库，请执行：

```sh
git submodule update --init --recursive
```

## 文档

建议从[概念架构](docs/agent-architecture.zh-CN.md)开始，然后继续阅读：

- [Workflow 组合模型](docs/workflow-composition-model.md)
- [Execution System 设计](docs/systems/execution/project-execution-system.zh-CN.md)
- [Evidence System 设计](docs/systems/evidence/evidence-system.zh-CN.md)
- [Execution–Evidence Contract](docs/contracts/execution-evidence/interaction-contract.zh-CN.md)
- [规划中的第一方 LangGraph Runtime Profile](docs/systems/runtime/first-party-langgraph-runtime-profile.zh-CN.md)

源码拆分为五个 Git submodule：[Workflow Package](https://github.com/firestige/workflow-package)、[Execution System](https://github.com/firestige/execution-system)、[Evidence System](https://github.com/firestige/evidence-system)、[Evolution System](https://github.com/firestige/evolution-system) 与 [System Contracts](https://github.com/firestige/system-contracts)。这是源码组件的划分，并不代表产品包含五个系统。

## License

[Apache-2.0](LICENSE)
