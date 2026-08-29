# 快速开始

[English](quickstart.md) | 中文

本指南描述在一台可信个人电脑上的正式首次使用旅程。当前打包产品尚未完成资格验证；不得用源码
checkout 或 fixture operations adapter 冒充已经发布的产品。

## 1. 检查发行版

最终旅程将从顶层 `preflight` 和 `setup` 开始，在产生任何安装 effect 前，校验 DSH bundle、
Evidence/Evolution 服务镜像、Workflow source 与本机 Agent Provider 的 exact compatibility manifest。

Iter6 命令契约已经位于 `product-operations`，但目前只接受 fixture adapter，仅用于自动资格验证，
不能用于正式安装。

## 2. 安装与配置

稳定产品操作为 `setup`、`install` 和 `config`。setup 将收集 repository/workspace、durable state
位置、loopback port、exact Workflow source 与 Role→Provider/model binding。WSR 只复用本机 DSH、
Copilot 与 Codex 登录状态；配置和诊断不得包含 credential。

## 3. 启动与检查

稳定日常操作为 `start`、`status`、`health`、`logs`、`stop` 和 `restart`。结果分别映射到
DSH/Execution、Evidence/Evolution、Workflow source 与 Provider 层，使部分故障仍可定位。

## 4. 升级或移除

`upgrade` 与 `rollback` 只使用明确的 compatible version 和 digest，不读取 ambient `latest`。
`uninstall` 默认保留 Delivery、checkpoint、binding、Evidence、配置与其他 durable data。未来若提供
数据清理，必须是独立、显式的破坏性操作。

## Contributor 源码预览

需要运行现有源码构建数据服务预览的贡献者，请使用单独的[源码构建指南](../contributing/source-build.zh-CN.md)。
它不是最终 clean-machine 产品路径。
