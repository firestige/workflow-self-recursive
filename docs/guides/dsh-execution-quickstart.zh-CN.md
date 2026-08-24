# DSH Execution 快速开始

本指南在可信本地环境安装 Iteration 3 developer preview。DSH plugin 是首个 Intake Adapter distribution；`@workflow-self-recursive/execution-system` 仍是可脱离 DSH 嵌入的 host-neutral package。

## 1. 下载两个 Execution artifact

```sh
mkdir -p "$PWD/.wsr-release"
curl -fL -o "$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz" \
  https://github.com/firestige/execution-system/releases/download/0.1.0/workflow-self-recursive-execution-system-0.1.0.tgz
curl -fL -o "$PWD/.wsr-release/workflow-self-recursive-dsh-intake-0.1.0.tgz" \
  https://github.com/firestige/execution-system/releases/download/0.1.0/workflow-self-recursive-dsh-intake-0.1.0.tgz
curl -fL -o "$PWD/.wsr-release/release-metadata.json" \
  https://github.com/firestige/execution-system/releases/download/0.1.0/release-metadata.json
curl -fL -o "$PWD/.wsr-release/core.publication.json" \
  https://github.com/firestige/execution-system/releases/download/0.1.0/workflow-self-recursive-execution-system-0.1.0.tgz.publication.json
curl -fL -o "$PWD/.wsr-release/plugin.publication.json" \
  https://github.com/firestige/execution-system/releases/download/0.1.0/workflow-self-recursive-dsh-intake-0.1.0.tgz.publication.json
```

每个 `execution.artifact-publication@1.0.0` record 都包含对应 archive 的 expected SHA-256 与 inventory。安装前用 `shasum -a 256 "$PWD/.wsr-release/"*.tgz` 与 record 比较。最终 digest table 也会写入 Iteration 3 implementation result。

## 2. 初始化唯一配置

选择位于 repository、worktree 和 DSH plugin 安装目录之外的 durable 路径。唯一 installation schema 是 `execution.config@1.0.0`：

```sh
export WSR_CONFIG="$PWD/../wsr-local/execution.yaml"
export WSR_STATE="$PWD/../wsr-local/state"
export WSR_CREDENTIALS="$PWD/../wsr-local/credentials.yml"
mkdir -p "$(dirname "$WSR_CONFIG")" "$WSR_STATE"
npm exec --yes --package="$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz" -- \
  execution-config init "$WSR_CONFIG" yaml
```

只替换 `__REQUIRED__`：`paths.repositoryRoot`、`paths.workspaceRoot`、对应的 `paths.allowedWorktreeRoots` 项、`paths.stateRoot`、`paths.credentialStorePath`，以及 `runner.provider.route/modelId/baseUrl/credentialRef`。除非 installation 明确选择 alternate Adapter，否则保留唯一默认 Source `firestige/workflow-package`。

在 Execution config 外 provision 引用的 key：

```yaml
version: 1
refs:
  DEEPSEEK_API_KEY: replace-with-the-provider-key
```

```sh
chmod 600 "$WSR_CREDENTIALS"
npm exec --yes --package="$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz" -- \
  execution-config validate "$WSR_CONFIG"
npm exec --yes --package="$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz" -- \
  execution-config dump-effective "$WSR_CONFIG"
```

`dump-effective` 输出 installation identity，并遮盖 path、endpoint 与 credential reference。字段说明见[配置参考](../reference/execution-configuration.zh-CN.md)。

## 3. 安装 DSH Intake Adapter

精确 profile 名为 `workflow-execution`。当前 DSH preview 的 workspace 需要 `--workspace-root`；先安装 host-neutral package，使 plugin 可导入其 public surface：

```sh
dsh plugin --profile workflow-execution add --workspace-root "$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz"
dsh plugin --profile workflow-execution add --workspace-root "$PWD/.wsr-release/workflow-self-recursive-dsh-intake-0.1.0.tgz"
```

编辑 `$DSH_HOME/profiles/workflow-execution/cordis.patch.yml`，stable row 只保留 absolute presentation path：

```yaml
- id: workflow-execution
  config:
    configFile: /absolute/path/wsr-local/execution.yaml
    bindingFile: /absolute/path/wsr-local/dsh-intake-bindings.json
```

不要把 Execution config 或 API key 复制进 patch。验证 composed profile 与 launcher：

```sh
dsh --profile workflow-execution --dump-config
dsh --help
```

预期：dump 包含 `workflow-execution` row、absolute `configFile`/`bindingFile`、`skill-filesystem` 与 `tool-skill`，但不含 API key。锁定的 DSH `0.1.1-rc.2` 中，launcher-level `dsh --help` 不启动交互 profile，只验证语法；profile-level help 属于所配置的 app，可能让该 app 继续运行。两者都不充当 plugin command catalog。精确产品命令为：

```text
/wsr list
/wsr create <name|name@latest|name@version>
/wsr recover [delivery-id]
/wsr status [delivery-id]
/wsr action finish
/wsr abandon <delivery-id>
```

## 4. 启动与调用

从目标 worktree 使用已配置 interactive app 的 profile 启动 DSH：

```sh
dsh --profile workflow-execution
```

Direct command 示例——activation directive 后的正文与聊天附件共同构成 `TaskPrompt`，不存在 `--intent` 参数：

```text
/wsr create implementation-workflow@0.3.0
实现这项改动，并保留用户已有修改。
```

显式 first-party skill 示例：

```text
/workflow-execution
使用 implementation-workflow@0.3.0 处理本次请求及其附件。
```

该 explicit-only skill 恰好一次调用 DSH-I-only `workflow_execution_intake` tool。Command 与 skill 进入同一个 `WorkflowIntakeService`、M01 resolution/validation/READY 路径和 host-neutral Core operation。Workflow Action 在 Runner-owned `DSH-E` 执行，不在 Intake `DSH-I` 执行。

查看 privacy-safe 状态和结果：

```text
/wsr list
/wsr status
```

Action 等待输入时，普通答复仍属于该 Action 内部交互。只有需要请求结束当前多轮阶段时才用 `/wsr action finish`；Action 与 validated `workflow_complete` 仍拥有完成权。

## 5. 恢复、关闭、更新与移除

停止 DSH 会关闭 Intake gate、执行 bounded Observation flush，并经 Execution 级联关闭全部 Runner-owned `DSH-E`。它不会伪造 cancellation，也不会删除 Manifest/current-slot、Runner durable facts 或 private binding file。再次启动相同 profile 会从最后一个 durable boundary 恢复。`/wsr recover [delivery-id]` 认领 exact detached Delivery；省略 ID 时恢复当前 canonical worktree 的 Delivery；不会按 name、alias 或 recency 猜测。

以后升级到 compatible exact version 时，先 update Core，再 update Intake。移除 installation 时先 remove Intake，再 remove Core：

```sh
dsh plugin --profile workflow-execution update --workspace-root @workflow-self-recursive/execution-system@<new-exact-version>
dsh plugin --profile workflow-execution update --workspace-root @workflow-self-recursive/dsh-intake@<new-exact-version>
dsh plugin --profile workflow-execution remove --workspace-root @workflow-self-recursive/dsh-intake
dsh plugin --profile workflow-execution remove --workspace-root @workflow-self-recursive/execution-system
dsh plugin --profile workflow-execution add --workspace-root "$PWD/.wsr-release/workflow-self-recursive-execution-system-0.1.0.tgz"
dsh plugin --profile workflow-execution add --workspace-root "$PWD/.wsr-release/workflow-self-recursive-dsh-intake-0.1.0.tgz"
```

这些 package lifecycle operation 归 DSH。WSR 不增加 install/remove hook。Remove 保留外置 durable state；兼容版本 reinstall 后恢复相同 persisted Delivery binding。最后一个 durable boundary 之后的 interaction state 允许丢失。
