# 快速开始

[English](quickstart.md) | 中文

本指南描述在一台可信个人电脑上重建 Iter6 reference assembly 的正式旅程。产品路径只消费
`release/product/0.2.0.json` 中的稳定坐标，不需要各 owner 的源码 checkout 或 build。

## 1. 准备配置

前置条件为 DSH `0.1.1-rc.2`、Node `24.12.0`、npm `11.6.2`、Docker Compose、已在本机登录的
Codex CLI `0.144.5`，以及可用的本机 GitHub Copilot 登录。复制
`product-operations/fixtures/config.json`，把 `workspace` 改为 canonical Git worktree 根目录，并设置
绝对的 `durableState` 路径。示例把 `role.greeter` 绑定到 Copilot、`role.reviewer` 绑定到 Codex。

```sh
node product-operations/bin/wsr.mjs setup --config-input /absolute/config.json
node product-operations/bin/wsr.mjs install
node product-operations/bin/wsr.mjs preflight
```

若 workspace 不是精确 Git 根目录或有未提交变化，`preflight` 会在 Delivery admission 前阻止执行；
提交或 stash 后重试即可。WSR 不复制 token 或 credential 到产品配置。

## 2. 启动并创建 Delivery

```sh
node product-operations/bin/wsr.mjs start
```

打开 DSH web profile，注册配置中的精确 workspace，在其中创建 Session，然后把 selector 放在第一行、
Task 指令放在后续行：

```text
/wsr create hello-world-workflow@0.2.0
Return a concise greeting and review it.
```

Delivery 卡片和 Session Delivery 视图展示持久状态与最终结果。Studio 通过配置的 loopback 服务读取
Evidence/Evolution，不按 repository 选择或过滤。

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
