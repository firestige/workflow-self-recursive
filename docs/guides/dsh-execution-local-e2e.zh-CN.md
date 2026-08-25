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

如果这个 profile 已经在运行，请先停止 `dsh web`，然后执行：

```sh
pnpm --dir execution-system quickstart:prepare
export WSR_RELEASE_DIR="$PWD/tmp/local-e2e/release"
export WSR_CONFIG="$PWD/../wsr-local/execution.json"
export WSR_CREDENTIALS="$PWD/../wsr-local/credentials.yml"
```

请从 super project 根目录执行 preparation 命令。它会一次完成 repository dependency 安装、当前 `execution-system` worktree 编译、两个 `0.1.1` archive 的构建与验证、本地部署路径初始化，以及 DSH `web` profile 对账。

任何 package operation 之前，对账会把 `better-sqlite3: true` 合入 profile 的 pnpm 11 `allowBuilds` map，并保留全部已有审批。对于 fresh profile，对账随后先安装 Core，再安装 Intake。对于 existing profile，它会先 remove Intake、再 remove Core，随后安装刚刚构建的准确 Core 与 Intake archive。即使 package version 没有变化，这个 remove/re-add 顺序也能替换内容已变化的本地 archive。修改 profile 之前，preparation 会用 production configuration loader 加载生成的配置。旧版自动生成配置曾让 workspace 包含相邻的 `wsr-local/state`；命令会把这种准确的旧结构收窄到目标 worktree，同时保留 state 路径和全部非路径用户修改，其他无效的已有配置则 fail closed。随后，命令只会在 `$DSH_HOME/profiles/web/cordis.patch.yml` 中插入或替换 WSR 自己的 `workflow-execution` row，保留无关的用户 patch entry，并通过 `dsh --profile web --dump-config` 验证 composed profile。如果 composed profile 仍有 `__REQUIRED__` placeholder，或者没有解析到生成的配置与 binding 路径，命令会失败。

重复执行会重建临时 artifact 并对账 plugin package，但保留已有的 Execution 配置、credential material、durable state、binding state 与无关 DSH user override。命令完成后再重新启动 `dsh web`。

如果 pnpm 因已有 profile 报出 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF` 或其他 modules layout 不一致，请停止 `dsh web`，然后显式要求重装 profile dependency：

```sh
pnpm --dir execution-system quickstart:prepare -- --reinstall-dsh-profile
```

这个 opt-in 开关只会在正常对账前删除 `$DSH_HOME/profiles/web/node_modules`。它不会删除 profile manifest、lockfile、pnpm workspace policy、Cordis 配置与 patch、Execution 配置、credential、binding 或 durable state；正常 package reconciliation 仍可能更新其中由 package manager 管理的 manifest 与 lockfile entry。没有这个开关时，preparation 不会删除 profile modules。

对账期间可能出现下面的 package-manager warning；它们不会使对账失败：

- `DEP0169` 表示 DSH 在 `PATH` 中找到了旧 pnpm CLI；可用上面的可选 Corepack 升级消除。
- `prebuild-install@7.1.3` 是 `better-sqlite3` 下的 deprecated installer，由 `@langchain/langgraph-checkpoint-sqlite` 间接引入；它不是安装得到的 Execution runtime version。
- Core `declares no dsh.bundle` 是预期输出。`@workflow-self-recursive/execution-system` 按设计作为 host-neutral plain dependency 安装，`@workflow-self-recursive/dsh-intake` 才提供 DSH profile layer。

## 2. 填写 credential

生成的 `execution.config@1.0.0` 已经指向当前 worktree、外置 durable state、public `firestige/workflow-package` Source 和默认 DeepSeek route。打开 `$WSR_CREDENTIALS`，只替换 `replace-with-the-provider-key`：

```yaml
version: 1
refs:
  DEEPSEEK_API_KEY: replace-with-the-provider-key
```

preparation 命令会用 owner-only 权限创建该文件，并且永不覆盖。如果本次 E2E 使用其他 compatible provider deployment，只编辑 `$WSR_CONFIG` 中的 `runner.provider`。字段说明见[配置参考](../reference/execution-configuration.zh-CN.md)。

## 3. 验证 DSH Intake Adapter

使用 locked DSH 内置 `web` profile。它包含 DSH 官方 conversation、attachment、command 与 result-rendering surface，是首个受支持的 interactive assembly；新建 custom profile 只有 `dsh-base`，不能交互。Preparation 已经安装 host-neutral Core package 与 Intake profile layer，并且只把它们的 absolute presentation path 写入 WSR-owned override；不会把 Execution config 或 API key 复制进 patch。验证 composed profile 与 launcher：

```sh
dsh --profile web --dump-config
dsh --help
```

预期：dump 包含 `webserver`、`ui-conversation`、`ui-commands`、`workflow-execution` row、absolute `configFile`/`bindingFile`、`skill-filesystem` 与 `tool-skill`，但不含 API key。锁定的 DSH `0.1.1-rc.2` 中，launcher-level `dsh --help` 不启动交互 profile，只验证语法。本节只验证 assembly，不执行任何 `/wsr` 产品命令。

## 4. 启动与调用

从目标 worktree 启动 DSH Web：

```sh
dsh web
```

下面列出 closed operation 作为参考。`/wsr list` 与 `/wsr status` 保留为 compatibility/automation alias；人工验收使用 sidebar tabs 作为它们面向用户的默认入口：

```text
/wsr list
/wsr create <name|name@latest|name@version>
/wsr recover [delivery-id]
/wsr status [delivery-id]
/wsr action finish
/wsr abandon <delivery-id>
```

Direct command 示例——activation directive 后的正文与聊天附件共同构成 `TaskPrompt`，不存在 `--intent` 参数：

```text
/wsr create hello-world-workflow@0.1.0
向我问好，并提及本 conversation 描述的任务。
```

显式 first-party skill 示例：

```text
/workflow-execution
使用 system-design-workflow@0.3.0，根据本次任务描述及其附件设计所要求的改动。
```

该 explicit-only skill 恰好一次调用 DSH-I-only `workflow_execution_intake` tool。Command 与 skill 进入同一个 `WorkflowIntakeService`、M01 resolution/validation/READY 路径和 host-neutral Core operation。Workflow Action 在 Runner-owned `DSH-E` 执行，不在 Intake `DSH-I` 执行。

`implementation-workflow@0.3.0` 要求已有设计输入。不要把它用于从零开始的 smoke 或交互验收；只有 conversation 正文或附件已经提供所需设计 artifact 时才能使用。

### #57 人工验收流程

产品 surface 边界：Delivery list 与 current Delivery status 使用 sidebar tabs；create/recover/abandon/action-finish command、acknowledgement、Action output/input、普通用户答复、error 与 terminal result 使用 chat timeline。

必须分别完成下面两个案例。它们证明不同的验收边界，不能互相替代。

#### 1. 已发布 hello-world smoke

在 `dsh web` 打开的浏览器中，创建一个以目标 worktree 为根目录的 conversation，然后点击 sidebar 的 Deliveries tab。没有 Delivery 时必须明确显示 empty result，不要求输入 chat command。可以附上一个小型测试文件，然后提交：

```text
/wsr create hello-world-workflow@0.1.0
向我问好、概括本请求；如果存在附件，请确认已经看到它。
```

本案例必须通过 configured Source 解析独立发布的准确 Package `hello-world-workflow@0.1.0`，并在同一 chat timeline 渲染 command acknowledgement、model-backed Action output 和 terminal result。只有 process log、sidebar projection 或 helper response 不算通过。通过 sidebar 的 Current status tab 查看已绑定 Delivery。Credential、Source、package resolution 或 Runner error 都表示本案例失败。

#### 2. 从零开始的多轮交互

创建另一个以同一目标 worktree 为根目录的新 conversation。不要复用 `implementation-workflow@0.3.0`：它要求预先存在的设计 artifact，不能证明 from-zero flow。改为提交普通设计任务：

```text
/wsr create system-design-workflow@0.3.0
根据本 conversation 的任务描述与附件，为这个 repository 设计一项边界明确的改动。
```

本案例必须从这段普通任务描述开始，在用户不介入的情况下先产生初始 Action output，然后在同一 chat timeline 中完成至少两轮提问/普通回答 ping-pong。Agent 必须询问是否已经达成一致；用普通聊天答复该确认。交互准备结束时提交 `/wsr action finish`。同一 chat timeline 必须渲染每个 Action output/input request、acknowledgement 和 terminal result。各步骤之间使用 Current status 查看同一个 bound Delivery，不在 chat 输入 `/wsr status`。答复脱离当前 Action、缺少第二轮、缺少 agreement confirmation 或没有 terminal result，都表示本案例失败。

下面的 compatibility/automation operation 继续保留，但产品 UI 默认使用 sidebar tabs：

```text
/wsr list
/wsr status
```

Action 等待输入时，普通答复仍属于该 Action 内部交互。只有需要请求结束当前多轮阶段时才用 `/wsr action finish`；Action 与 validated `workflow_complete` 仍拥有完成权。

可重放的 source-candidate browser oracle 使用 `pnpm --dir execution-system qualify:dsh-product -- <absolute-core-archive> <absolute-intake-archive> <absolute-source-config>`。它会创建 fresh DSH Web profile 与 Chrome profile、点击两个 sidebar tab、驱动同样的已发布 hello-world smoke 和需要两次答复的 system-design 交互、以同一版本重启，并返回 URL、environment tuple、artifact SHA-256 与按 surface 分开的 DOM evidence。Source config 指向外置 credential file；结果不会打印 key material。

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
