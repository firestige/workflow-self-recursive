# 快速开始

[English](quickstart.md) | 中文

本指南描述在一台可信个人电脑上重建 Iter6 reference assembly 的正式旅程。顶层 operations 从
`product-0.3.0` GitHub Release 安装，并只消费包内的稳定 compatibility manifest；产品路径不需要
任何 WSR 源码 checkout 或 owner build。

## 1. 准备配置

前置条件为 DSH `0.1.1-rc.2`、Node `24.12.0`、npm `11.6.2`、Docker Compose、已在本机登录的
Codex CLI `0.144.5`，以及可用的本机 GitHub Copilot 登录。安装精确的 operations 资产并下载可编辑
配置示例：

```sh
npm install --global https://github.com/firestige/workflow-self-recursive/releases/download/product-0.3.0/wsr-product-operations-0.3.0.tgz
curl --proto '=https' --tlsv1.2 --fail --location --remote-name \
  https://github.com/firestige/workflow-self-recursive/releases/download/product-0.3.0/wsr-product-0.3.0.config.example.json
```

示例只选择发布 Workflow Package 的 GitHub repository。服务端口可省略，示例值就是默认值；其中没有
workspace、Workflow selector、Task、repository filter、Role binding 或 credential。若要覆盖操作系统级
state 目录，可增加绝对路径 `state.root`。

```sh
wsr setup --config-input /absolute/config.json
wsr install
wsr preflight
```

CLI 把全局配置和 state 放在 package README 记录的稳定操作系统用户目录中，因此可以从任意当前目录
执行所有命令。WSR 不复制 token 或 credential 到产品配置。

## 2. 启动并创建 Delivery

```sh
wsr start
```

打开 DSH web profile，注册 workspace，在其中创建 Session，然后把 selector 放在第一行、
Task 指令放在后续行：

```text
/wsr create hello-world-workflow@0.2.0
Return a concise greeting and review it.
```

Delivery 卡片和 Session Delivery 视图展示持久状态与最终结果。Studio 通过配置的 loopback 服务读取
Evidence/Evolution，不按 repository 选择或过滤。当前 Session 提供运行时 workspace；若 Workflow 声明
Role，则在该 repository 的 `.wsr/role-provider-bindings.json` 中配置 binding。

## 3. 检查与恢复

使用 `status`、`health` 和 `logs` 查看分层诊断。`restart` 会重启 Compose 与 DSH；Execution 从
durable state 重建 Delivery、checkpoint 和 Session binding。

## 4. 升级或移除

`upgrade` 与 `rollback` 只使用明确的 compatible version 和 digest，不读取 ambient `latest`。
`uninstall` 默认保留 Delivery、checkpoint、binding、Evidence、配置与其他 durable data。未来若提供
数据清理，必须是独立、显式的破坏性操作。

## Contributor 源码预览

需要运行源码构建数据服务预览的贡献者，请使用单独的
[源码构建指南](../contributing/source-build.zh-CN.md)。它不是 clean-machine 产品路径。
