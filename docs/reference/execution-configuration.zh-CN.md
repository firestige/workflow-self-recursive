# Execution 配置参考

`ExecutionInstallationConfig` 是所有 embedding 共用的唯一 versioned installation document。Canonical schema 是 `execution.config@1.0.0`；Release 同时发布 JSON Schema、TypeScript types、YAML/JSON defaults 与 `execution-config` CLI。YAML 和 JSON 只是两种 parser 输入，不是配置层：不存在 merge、environment override、content sniffing 或 fallback。

先用 `execution-config init|copy <absolute-path> [yaml|json]`，填写 required placeholder，再执行 `execution-config validate <absolute-path>` 与 `execution-config dump-effective <absolute-path>`。`validate` 返回 canonical installation identity；`dump-effective` 遮盖 path/endpoint，绝不打印 credential material。

## 字段

| Path | 分类 | 含义与约束 |
| --- | --- | --- |
| `schemaVersion` | 固定 | 必须为 `execution.config@1.0.0` |
| `paths.repositoryRoot` | required | absolute readable repository root |
| `paths.workspaceRoot` | required | 包含 allowed worktree 的 absolute readable workspace |
| `paths.allowedWorktreeRoots` | required | 位于 `workspaceRoot` 内的一个或多个 absolute root |
| `paths.stateRoot` | required | 位于 repository/workspace 外、可读写的 absolute durable root |
| `paths.credentialStorePath` | required | absolute readable external credential file |
| `workflowSource` | 默认 | 恰好一个 `github` 或 `adapter` variant；request 不得覆盖 |
| `runner.implementationKey` | 固定 | `runner.v1` |
| `runner.host.engine` | 固定 | `langgraph` |
| `runner.provider.key` | 固定 | `dsh` |
| `runner.provider.route` | required | 投影进 admission 的 exact provider route |
| `runner.provider.modelId` | required | exact external `modelId`，无 ambient model fallback |
| `runner.provider.baseUrl` | required | 不含 userinfo 的 HTTP(S) URL |
| `runner.provider.credentialRef` | required | 外置 credential store 中的 key，不是 key material |
| `runner.provider.maxParallelToolCalls` | 默认 | integer `1..32` |
| `observation.enabled` | 默认 | `false` 时不创建 exporter/network resource |
| `observation.endpoint` | 条件 required | enabled 时必须提供；trusted preview 只接受 loopback HTTP(S) OTLP base URL |
| `observation.timeoutMs` | 默认 | `100..10000` ms |
| `observation.maxBatchRecords` | 默认 | `1..512`；本 release 按 OTLP official 最大值使用 `512` |
| `observation.maxBatchBytes` | 默认 | `1024..4194304` bytes，最大 `4 MiB` |
| `observation.flushIntervalMs` | 默认 | `100..10000` ms |
| `observation.shutdownFlushMs` | 默认 | `100..10000` ms bounded best-effort flush |
| `observation.serviceName` | 默认 | 非空 OTLP Resource service name |
| `controls.startupTimeoutMs` | 默认 | `1000..120000` ms |
| `controls.executionTimeoutMs` | 默认 | `1000..86400000` ms |
| `controls.shutdownTimeoutMs` | 默认 | `1000..120000` ms |
| `controls.maxConcurrentDeliveries` | 默认 | installation bound `1..32`；同 worktree contention 仍立即返回 |
| `controls.allowExplicitRefresh` | 默认 | request 是否可 refresh `latest`，永不选择 Source |
| `controls.diagnosticMaxBytes` | 默认 | bounded redacted diagnostic `256..16384` bytes |
| `intake.maxCorrelationBytes` | 默认 | bounded presentation correlation `16..1024` bytes |
| `intake.maxOutputBytes` | 默认 | bounded renderer output `256..65536` bytes |

Loader 从 `stateRoot` 派生 `packages`、`manifests`、`current-slots`、`staging` 与 `runner/{journal,checkpoints,sessions,custody}`。Manifest/current-slot 与 Runner roots 属于 durable truth；staging 是临时目录。DSH plugin 的独立 `bindingFile` 保存 adapter-private session↔Delivery binding，也必须位于 plugin installation directory 外。

DSH Web 的配置不会改变 UI 职责边界：sidebar tabs 调用已有 list/status control-plane operation，chat timeline 承载 interactive command、Action conversation、普通答复与 terminal result。`/wsr list` 和 `/wsr status` alias 继续保留给 compatibility 与 automation。

Credential document 独立保存：

```yaml
version: 1
refs:
  DEEPSEEK_API_KEY: replace-with-the-provider-key
```

`ExecutionInstallationConfig` 只出现 `credentialRef: DEEPSEEK_API_KEY`。API key material 不进入 canonical config、Delivery Manifest/binding、result、diagnostic 或 Observation。

## 示例

- [minimal YAML](../../execution-system/config/examples/execution.minimal.yaml) 与 [minimal JSON](../../execution-system/config/examples/execution.minimal.json) 语义等价，Observation disabled。
- [full YAML](../../execution-system/config/examples/execution.full.yaml) 与 [full JSON](../../execution-system/config/examples/execution.full.json) 语义等价，启用 loopback OTLP endpoint。

示例使用 redacted deployment path/identity。Validate 前必须创建这些 path 与 credential file；loader 会在任何 component effect 前校验 canonical accessibility。

## Bootstrap 与恢复

Application 状态为 `CREATED → STARTING → RECOVERING → READY → CLOSING → CLOSED`。只在 `READY` 接受新 execution。Bootstrap 校验 config、创建 installation resources、枚举每个已占用 canonical-worktree slot、恢复 exact persisted binding、join DSH private binding，并在 establishment 完成后发布 `READY`。Startup failure 按 reverse dependency order rollback，并输出 bounded redacted diagnostic。

关闭先拒绝新 Intake，再 quiesce、执行 bounded Observation flush，并 reverse-dispose Runner-owned `DSH-E` resource。Restart 只使用 persisted Manifest/binding 与 Runner facts；不会用 changed config、selector 或 Package alias 重绑旧 Delivery。最后一个 durable boundary 之后的 state 允许丢失。

`0.1.0` 是 MVP developer preview。Configuration schema `1.0.0` 是 closed schema；unknown key 与 incompatible schema version fail closed。未来不兼容的 schema 或 public TypeScript surface 可能需要新 package version 与显式 migration。
