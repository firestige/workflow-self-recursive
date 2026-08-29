# DSH Execution 快速开始

本指南在可信本地环境安装已经完成 qualification 的 final Execution Release。未发布 candidate 不使用本指南，应使用[本地发布前 E2E 指南](dsh-execution-local-e2e.zh-CN.md)。DSH plugin 是首个 Intake Adapter distribution；`wsr-execution` 仍是可脱离 DSH 嵌入的 host-neutral package。

## 0. 检查宿主前置项

使用 Node `>=24.12.0 <25` 与 DSH `0.1.1-rc.2`。DSH 的 `plugin` 子命令要求 pnpm，但 DSH 没有声明 pnpm 的准确版本。下载示例还使用 GitHub CLI。

先查看已经安装的版本：

```sh
node --version
pnpm --version
dsh --version
gh --version
```

如果 `pnpm --version` 因为未安装 pnpm 而失败，安装后重新检查：

```sh
npm install --global pnpm
```

如果 `dsh --version` 因为未安装 DSH 而失败，或者输出的版本不是 `0.1.1-rc.2`，安装所需 preview 后重新检查：

```sh
npm install --global @deepseek-ai/dsh@0.1.1-rc.2
```

最后查看 launcher help：

```sh
dsh --help
```

## 1. 下载完成 qualification 的 final Release

```sh
export WSR_VERSION="0.1.1"
export WSR_RELEASE_DIR="$PWD/.wsr-release"
mkdir -p "$WSR_RELEASE_DIR"
gh release download "$WSR_VERSION" --repo firestige/wsr-execution --dir "$WSR_RELEASE_DIR"
```

只有 `0.1.1` 已经成为 non-prerelease GitHub Release 时才能继续。`release-metadata.json` 与 publication records 会把下载的 archive 绑定到 SHA-256、package version、inventory 和 compatibility tuple。

## 2. 初始化唯一配置

选择位于 repository、worktree 和 DSH plugin 安装目录之外的 durable 路径。唯一 installation schema 是 `execution.config@1.0.0`：

```sh
export WSR_CONFIG="$PWD/../wsr-local/execution.yaml"
export WSR_STATE="$PWD/../wsr-local/state"
export WSR_CREDENTIALS="$PWD/../wsr-local/credentials.yml"
mkdir -p "$(dirname "$WSR_CONFIG")" "$WSR_STATE"
npm exec --yes --package="$PWD/.wsr-release/wsr-execution-0.1.1.tgz" -- \
  execution-config init "$WSR_CONFIG" yaml
```

只替换 `__REQUIRED__`：`paths.repositoryRoot`、`paths.workspaceRoot`、对应的 `paths.allowedWorktreeRoots` 项、`paths.stateRoot`、`paths.credentialStorePath`，以及 `runner.provider.route/modelId/baseUrl/credentialRef`。除非 installation 明确选择 alternate Adapter，否则保留唯一默认 Source `firestige/wsr-workflow-package`。

在 Execution config 外 provision 引用的 key：

```yaml
version: 1
refs:
  DEEPSEEK_API_KEY: replace-with-the-provider-key
```

```sh
chmod 600 "$WSR_CREDENTIALS"
npm exec --yes --package="$PWD/.wsr-release/wsr-execution-0.1.1.tgz" -- \
  execution-config validate "$WSR_CONFIG"
npm exec --yes --package="$PWD/.wsr-release/wsr-execution-0.1.1.tgz" -- \
  execution-config dump-effective "$WSR_CONFIG"
```

`dump-effective` 输出 installation identity，并遮盖 path、endpoint 与 credential reference。字段说明见[配置参考](../reference/execution-configuration.zh-CN.md)。

## 3. 安装 DSH Intake Adapter

使用 locked DSH 内置 `web` profile。它包含 DSH 官方 conversation、attachment、command 与 result-rendering surface，是首个受支持的 interactive assembly；新建 custom profile 只有 `dsh-base`，不能交互。Core 通过 `better-sqlite3` 持久化 checkpoint，因此 pnpm 11 必须在添加 artifact 前由 DSH profile 的 `allowBuilds` 批准该 native build。对于 fresh profile，下面第一条命令会创建 profile 和审批 map；对于 existing profile，应在 `$DSH_HOME/profiles/web/pnpm-workspace.yaml` 保留全部已有 `allowBuilds` entry 并合入 `better-sqlite3: true`，不要覆盖原 map。当前 DSH preview 的 workspace 需要 `--workspace-root`；随后先安装 host-neutral package，使 plugin 可导入其 public surface：

```sh
dsh plugin --profile web config set --location=project --json allowBuilds '{"better-sqlite3":true}'
dsh plugin --profile web add --workspace-root "$PWD/.wsr-release/wsr-execution-0.1.1.tgz"
dsh plugin --profile web add --workspace-root "$PWD/.wsr-release/dsh-wsr-execution-0.1.1.tgz"
```

编辑 `$DSH_HOME/profiles/web/cordis.patch.yml`，stable WSR row 只保留 absolute presentation path。`web` 是 DSH profile name；`workflow-execution` 仍是 plugin 的 stable Cordis row ID：

```yaml
- id: workflow-execution
  config:
    configFile: /absolute/path/wsr-local/execution.yaml
    bindingFile: /absolute/path/wsr-local/dsh-intake-bindings.json
```

不要把 Execution config 或 API key 复制进 patch。验证 composed profile 与 launcher：

```sh
dsh --profile web --dump-config
dsh --help
```

预期：dump 包含 `webserver`、`ui-conversation`、`ui-commands`、`workflow-execution` row、absolute `configFile`/`bindingFile`、`skill-filesystem` 与 `tool-skill`，但不含 API key。锁定的 DSH `0.1.1-rc.2` 中，launcher-level `dsh --help` 不启动交互 profile，只验证语法。两个 help surface 都不充当 plugin command catalog。下面列出 closed operation；`/wsr list` 与 `/wsr status` 保留为 compatibility/automation alias，不是默认产品入口：

```text
/wsr list
/wsr create <name|name@latest|name@version>
/wsr recover [delivery-id]
/wsr status [delivery-id]
/wsr action finish
/wsr abandon <delivery-id>
```

## 4. 启动与调用

产品 surface 边界：Delivery list 与 current Delivery status 使用 sidebar tabs；create/recover/abandon/action-finish command、acknowledgement、Action output/input、普通用户答复、error 与 terminal result 使用 chat timeline。Interactive command 只以原生用户气泡出现一次，内部 command lifecycle row 保持隐藏。“新会话”启动隔离的 blank timeline，旧 Workflow conversation 仍可单独重新打开。

从目标 worktree 启动 DSH Web：

```sh
dsh web
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

### #57 人工验收流程

在 `dsh web` 打开的浏览器中，创建或选择以目标 worktree 为根目录的 conversation，然后点击 sidebar 的 Deliveries tab。没有 Delivery 时必须明确显示 empty result，不要求输入 chat command。接着附上任务需要的文件，并用一条 composer message 提交命令首行与后续聊天正文；正文与附件共同构成 TaskPrompt：

```text
/wsr create implementation-workflow@0.3.0
根据本 conversation 的正文与附件完成所要求的实现。
```

验收成功要求同一 chat timeline 渲染 acknowledgement、Action output/input 与 terminal result；只有 process log、sidebar projection 或 helper response 不算通过。通过 sidebar 的 Current status tab 查看已绑定 Delivery。如果 Workflow 进入 grilling 等多轮 Action，就在这个 conversation 中正常答复；交互结束时提交 `/wsr action finish`，再用 Current status 观察后续状态。Credential、Source、package resolution 或 Runner error 都表示本次验收失败，修复后才能关闭 #57。

下面的 compatibility/automation operation 继续保留，但产品 UI 默认使用 sidebar tabs：

```text
/wsr list
/wsr status
```

Action 等待输入时，普通答复仍属于该 Action 内部交互。只有需要请求结束当前多轮阶段时才用 `/wsr action finish`；Action 与 validated `workflow_complete` 仍拥有完成权。

## 5. 恢复、关闭、更新与移除

停止 DSH 会关闭 Intake gate、执行 bounded Observation flush，并经 Execution 级联关闭全部 Runner-owned `DSH-E`。它不会伪造 cancellation，也不会删除 Manifest/current-slot、Runner durable facts 或 private binding file。再次启动相同 profile 会从最后一个 durable boundary 恢复。`/wsr recover [delivery-id]` 认领 exact detached Delivery；省略 ID 时恢复当前 canonical worktree 的 Delivery；不会按 name、alias 或 recency 猜测。

以后升级到 compatible exact version 时，先 update Core，再 update Intake。移除 installation 时先 remove Intake，再 remove Core：

```sh
dsh plugin --profile web update --workspace-root wsr-execution@<new-exact-version>
dsh plugin --profile web update --workspace-root dsh-wsr-execution@<new-exact-version>
dsh plugin --profile web remove --workspace-root dsh-wsr-execution
dsh plugin --profile web remove --workspace-root wsr-execution
dsh plugin --profile web add --workspace-root "$PWD/.wsr-release/wsr-execution-0.1.1.tgz"
dsh plugin --profile web add --workspace-root "$PWD/.wsr-release/dsh-wsr-execution-0.1.1.tgz"
```

这些 package lifecycle operation 归 DSH。WSR 不增加 install/remove hook。Remove 保留外置 durable state；兼容版本 reinstall 后恢复相同 persisted Delivery binding。最后一个 durable boundary 之后的 interaction state 允许丢失。
