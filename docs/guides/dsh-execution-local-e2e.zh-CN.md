# DSH Execution 本地发布前 E2E

本指南从当前 checkout 构建 Iteration 3 candidate，并在可信本地环境进行发布前 E2E 安装。它明确不下载 Execution GitHub Release。DSH plugin 是首个 Intake Adapter distribution；`@workflow-self-recursive/execution-system` 仍是可脱离 DSH 嵌入的 host-neutral package。

## 0. 检查宿主前置项

使用 Node `>=24.12.0 <25` 与 DSH `0.1.1-rc.2`。DSH 的 `plugin` 子命令要求 pnpm，但 DSH 没有声明 pnpm 的准确版本。Release qualification 当前为可重放而使用 pnpm `11.23.0`；这不是终端用户的版本限制。

先查看已经安装的版本：

```sh
node --version
pnpm --version
dsh --version
```

如果 `pnpm --version` 因为未安装 pnpm 而失败，安装后重新检查：

```sh
npm install --global pnpm
```

已有 pnpm 9 仍然可以工作，但 DSH 调用这个旧 CLI 时，Node 24 可能报告 `DEP0169`。如果要消除该工具链 warning，可以选择让 Corepack 对齐仓库完成 qualification 的版本，然后重新执行 `pnpm --version`：

```sh
corepack install --global pnpm@11.23.0
```

这是工具链升级，不是 Execution runtime compatibility 要求。

如果 `dsh --version` 因为未安装 DSH 而失败，或者输出的版本不是 `0.1.1-rc.2`，安装所需 preview 后重新检查：

```sh
npm install --global @deepseek-ai/dsh@0.1.1-rc.2
```

最后查看 launcher help：

```sh
dsh --help
```

## 1. 准备本地 candidate

```sh
pnpm --dir execution-system quickstart:prepare
export WSR_RELEASE_DIR="$PWD/tmp/local-e2e/release"
export WSR_CONFIG="$PWD/../wsr-local/execution.json"
export WSR_CREDENTIALS="$PWD/../wsr-local/credentials.yml"
```

请从 super project 根目录执行 preparation 命令。它会一次完成 repository dependency 安装、当前 `execution-system` worktree 编译、两个 `0.1.1` archive 的构建与验证，并初始化本地部署路径。重复执行会重建临时 artifact，但保留已经存在的配置和 credential 文件。

## 2. 填写 credential

生成的 `execution.config@1.0.0` 已经指向当前 worktree、外置 durable state、public `firestige/workflow-package` Source 和默认 DeepSeek route。打开 `$WSR_CREDENTIALS`，只替换 `replace-with-the-provider-key`：

```yaml
version: 1
refs:
  DEEPSEEK_API_KEY: replace-with-the-provider-key
```

preparation 命令会用 owner-only 权限创建该文件，并且永不覆盖。如果本次 E2E 使用其他 compatible provider deployment，只编辑 `$WSR_CONFIG` 中的 `runner.provider`。字段说明见[配置参考](../reference/execution-configuration.zh-CN.md)。

## 3. 安装 DSH Intake Adapter

使用 locked DSH 内置 `web` profile。它包含 DSH 官方 conversation、attachment、command 与 result-rendering surface，是首个受支持的 interactive assembly；新建 custom profile 只有 `dsh-base`，不能交互。当前 DSH preview 的 workspace 需要 `--workspace-root`；先安装 host-neutral package，使 plugin 可导入其 public surface：

```sh
dsh plugin --profile web add --workspace-root "$WSR_RELEASE_DIR/workflow-self-recursive-execution-system-0.1.1.tgz"
dsh plugin --profile web add --workspace-root "$WSR_RELEASE_DIR/workflow-self-recursive-dsh-intake-0.1.1.tgz"
```

两条命令以 `Done` 结束，并在 `dependencies` 下列出对应 package，即表示安装成功。下面三种 warning 不会使本次安装失败：

- `DEP0169` 表示 DSH 在 `PATH` 中找到了旧 pnpm CLI；可用上面的可选 Corepack 升级消除。
- `prebuild-install@7.1.3` 是 `better-sqlite3` 下的 deprecated installer，由 `@langchain/langgraph-checkpoint-sqlite` 间接引入；它不是安装得到的 Execution runtime version。
- Core `declares no dsh.bundle` 是预期输出。`@workflow-self-recursive/execution-system` 按设计作为 host-neutral plain dependency 安装，`@workflow-self-recursive/dsh-intake` 才提供 DSH profile layer。

编辑 `$DSH_HOME/profiles/web/cordis.patch.yml`，stable WSR row 只保留 absolute presentation path。`web` 是 DSH profile name；`workflow-execution` 仍是 plugin 的 stable Cordis row ID：

```yaml
- id: workflow-execution
  config:
    configFile: /absolute/path/wsr-local/execution.json
    bindingFile: /absolute/path/wsr-local/dsh-intake-bindings.json
```

不要把 Execution config 或 API key 复制进 patch。验证 composed profile 与 launcher：

```sh
dsh --profile web --dump-config
dsh --help
```

预期：dump 包含 `webserver`、`ui-conversation`、`ui-commands`、`workflow-execution` row、absolute `configFile`/`bindingFile`、`skill-filesystem` 与 `tool-skill`，但不含 API key。锁定的 DSH `0.1.1-rc.2` 中，launcher-level `dsh --help` 不启动交互 profile，只验证语法。两个 help surface 都不充当 plugin command catalog。精确产品命令为：

```text
/wsr list
/wsr create <name|name@latest|name@version>
/wsr recover [delivery-id]
/wsr status [delivery-id]
/wsr action finish
/wsr abandon <delivery-id>
```

## 4. 启动与调用

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

在 `dsh web` 打开的浏览器中，创建或选择以目标 worktree 为根目录的 conversation，然后执行：

```text
/wsr list
```

该 conversation 必须渲染 WSR result。接着附上任务需要的文件，并用一条 composer message 提交命令首行与后续聊天正文；正文与附件共同构成 TaskPrompt：

```text
/wsr create implementation-workflow@0.3.0
根据本 conversation 的正文与附件完成所要求的实现。
```

验收成功要求同一个 conversation 渲染新 Delivery/result；仅有 process log 或 helper response 不算通过。记录返回的 Delivery ID，再用 `/wsr status` 核对。如果 Workflow 进入 grilling 等多轮 Action，就在这个 conversation 中正常答复；交互结束时提交 `/wsr action finish`，再用 `/wsr status` 观察后续状态。Credential、Source、package resolution 或 Runner error 都表示本次验收失败，修复后才能关闭 #57。

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
dsh plugin --profile web update --workspace-root @workflow-self-recursive/execution-system@<new-exact-version>
dsh plugin --profile web update --workspace-root @workflow-self-recursive/dsh-intake@<new-exact-version>
dsh plugin --profile web remove --workspace-root @workflow-self-recursive/dsh-intake
dsh plugin --profile web remove --workspace-root @workflow-self-recursive/execution-system
dsh plugin --profile web add --workspace-root "$WSR_RELEASE_DIR/workflow-self-recursive-execution-system-0.1.1.tgz"
dsh plugin --profile web add --workspace-root "$WSR_RELEASE_DIR/workflow-self-recursive-dsh-intake-0.1.1.tgz"
```

这些 package lifecycle operation 归 DSH。WSR 不增加 install/remove hook。Remove 保留外置 durable state；兼容版本 reinstall 后恢复相同 persisted Delivery binding。最后一个 durable boundary 之后的 interaction state 允许丢失。
