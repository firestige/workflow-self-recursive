# Execution Configuration 2.0.0 — 设计候选

> **状态：** Iteration 6 发布前候选，2026-08-29。它是历史 `execution.config@1.0.0` 与 `execution.delivery-config@1.0.0` 的 MAJOR successor，不改写既有 persisted bytes。英文跟踪正文见 [`execution-configuration-2.0.0-candidate.md`](execution-configuration-2.0.0-candidate.md)。

## 1. Ownership correction

WSR 配置 Workflow selection 与 WSR execution controls。Repository 为每个 Agent-action Role 选择 exact Agent Provider identity/version 与 Provider-owned model coordinate。Agent Provider 拥有 endpoint/routing、authentication、credential/login state、transport、native session 与 model connectivity。

因此，`execution.config@2.0.0` 没有 Provider identity/key、default model、priority/fallback list、endpoint、credential/reference/store、native adapter selector 或 session setting。历史 1.0 字段 `paths.credentialStorePath`、`runner.provider.key`、`runner.provider.route`、`runner.provider.modelId`、`runner.provider.baseUrl` 与 `runner.provider.credentialRef` 被删除，而非改名。

Serialized WSR config 之外的 installation composition 提供一个 closed `AgentProviderFactoryRegistry`，其中装入各 owner factory。每个 factory 声明 exact immutable descriptor：`identity`、semantic `version`、`adapterKey`、canonical sorted `capabilities` 及其 descriptor digest。Registry 只提供 exact lookup；不存在 default、priority、fallback 或 ambient discovery。

## 2. Closed changed shape

未变化的 WSR paths、Workflow source、Observation settings、controls、Intake bounds、Runner implementation 与 Host fields 保持原语义。变化后的 Runner 部分为：

```json
{
  "schemaVersion": "execution.config@2.0.0",
  "paths": {
    "repositoryRoot": "/repo",
    "workspaceRoot": "/workspaces",
    "allowedWorktreeRoots": ["/repo"]
  },
  "workflowSource": {
    "kind": "github",
    "repository": "firestige/workflow-package",
    "releasesBaseUrl": "https://api.github.com/repos/firestige/workflow-package/releases",
    "assetPattern": "workflow-package-{name}-{version}.tar.gz"
  },
  "runner": {
    "implementationKey": "runner.v2",
    "host": {"engine": "langgraph"},
    "maxParallelToolCalls": 4
  }
}
```

规则：

- `workflowSource` 恰好选择一个 qualified source；request data 不能选择它，也没有 source fallback list；
- `runner` 只携带 WSR-owned Runner/Host controls，不接受 `provider` section；
- Role selection 只位于 required `<canonical-worktree>/.wsr/role-provider-bindings.json`；
- 禁止 credential、token、login state、Provider endpoint/route/config、adapter choice 与 native session setting；
- unknown field 与 mixed 1.0/2.0 shape 在 Delivery admission 前失败。

## 3. Delivery projection、composition 与 recovery

`execution.delivery-config@2.0.0` 只包含 WSR-owned recovery inputs：canonical repository/workspace scope 与 relative Runner state resources；Runner implementation/Host engine；WSR-owned parallelism/capability bounds；Delivery-affecting WSR controls。它不含 Provider selection 或 Provider-native data。

Admission 通过 supplied registry 解析每个 repository Role binding，验证 exact version/capability compatibility，并把 Provider descriptor 与 model coordinate 冻结到 `execution.delivery-manifest@2.0.0`。Manifest persistence 先于 Provider effect。

Runner 随后只请求 persisted Manifest 命名的 factories，并为每个实际使用的 distinct Provider 启动一个 Delivery-scoped realm。Registered but unused Provider 不启动。Owner factory 构造 native realm；Runner 拥有 bounded lease/disposal，后续 acquire 失败时 rollback 已取得 realms。

Runtime dispatch、native session create/resume 与 recovery 按 exact persisted Role binding 选择。Recovery 在任何新 Provider/session effect 前把 Provider identity、version、adapter key、descriptor digest 与 capabilities 同 registered descriptor exact-match，随后原样保留 persisted model coordinate；registry 不是 model catalog。它绝不重读 repository policy 作为 authority、应用 current default、改变 Role binding 或 fallback。Provider credential/login state 保持在 owner factory 后，不跨越 WSR SPI。

## 4. Compatibility 与 migration

- 既有 `execution.config@1.0.0`、Delivery Manifest 1.x 及 activation/recovery path 保持历史 exact-version dispatch；
- 新 Workflow DSL 2.0 Delivery 要求 Execution config/projection 2.0、repository Role-to-Provider bindings 与 Delivery Manifest 2.0；
- 1.0 config 不通过复制 Provider/credential fields 自动提升。Operator 在外部 compose 所需 owner factories，并写 provider-free 2.0 WSR config；
- persisted 1.x Delivery 走历史 adapter path recovery，不按 2.0 semantics 重建或重绑。

## 5. Conformance

Required checks 覆盖 rejected Provider/default/credential/endpoint keys；missing/unknown/version-mismatched/capability-incompatible Role bindings；duplicate/conflicting registry entries；mixed-Provider admission；exact Manifest/Observation freezing；only-used realm startup；partial-start rollback 与 lease disposal；runtime/session/recovery exact matching；no current-config/repository rebinding；no fallback；以及 WSR config、Manifest、Observation 与 Provider SPI value 均不含 secret。
