# DSH Bundle 本地发布前 E2E

本指南从唯一 DSH 发布权威
[`firestige/wsr-dsh`](https://github.com/firestige/wsr-dsh) 验证未发布的
bundle candidate。普通用户从发布物安装时使用
[DSH Execution 快速开始](dsh-execution-quickstart.zh-CN.md)。

## 前置项

使用 Node `24.12.0`、npm `11.6.2`、DSH `0.1.1-rc.2` 与 Chrome：

```sh
node --version
npm --version
dsh --version
```

## 构建与静态 qualification

在已经初始化全部 submodule 的 superproject 根目录执行：

```sh
npm --prefix wsr-dsh ci --ignore-scripts --no-audit --no-fund
npm --prefix wsr-dsh run test
npm --prefix wsr-dsh run build
npm --prefix wsr-dsh run pack:verify
npm --prefix wsr-dsh run provenance:verify
```

DSH 仓库只消费其 manifest 记录的 immutable `wsr-execution@0.1.4` owner
asset；不得换成 npm `latest`、branch、本地 Execution checkout 或重建 archive。

## Clean-profile 与 lifecycle qualification

```sh
npm --prefix wsr-dsh run qualify:clean-profile
npm --prefix wsr-dsh run qualify:lifecycle
npm --prefix wsr-dsh run qualify:provider-routing
npm --prefix wsr-dsh run qualify:real-harness
```

这些门禁使用临时 DSH home 与 package archive，验证 Execution-only、
Studio-only、suite 安装，suite/component 对账，升级、回滚、移除、重装，
single-slot UI 组合，Provider routing，真实 Host 与浏览器 surface。它们不
发布产物，也不得删除外置 Delivery、checkpoint、binding、Evidence 或用户配置。

## Candidate 与 stable 发布

只有 `wsr-dsh` 的 candidate/promotion workflows 可以发布
`dsh-wsr-execution`、`dsh-wsr-studio` 与 `dsh-wsr`。candidate 字节在 npm
OIDC promotion 前必须重新下载并复验。详见
[`wsr-dsh` release lifecycle](https://github.com/firestige/wsr-dsh/blob/main/docs/release-lifecycle.md)。
