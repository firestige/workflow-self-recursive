# Execution Configuration 2.0.0 — 设计候选

> **状态：** Iteration 5 发布前候选，2026-08-28。它是历史 `execution.config@1.0.0` 与 `execution.delivery-config@1.0.0` 的 MAJOR successor，不改写既有 persisted bytes。英文跟踪正文见 [`execution-configuration-2.0.0-candidate.md`](execution-configuration-2.0.0-candidate.md)。

## 1. Ownership correction

WSR 配置 Workflow selection、Role→model policy 与 WSR execution controls。Agent Provider 拥有 provider-native endpoint/routing、authentication、credentials、credential stores/references、transport policy 与 native session configuration。

因此，`execution.config@2.0.0` 删除 `paths.credentialStorePath`、`runner.provider.key`、`runner.provider.baseUrl` 与 `runner.provider.credentialRef`。这些字段不改名，也不复制进新的 WSR section。历史 `runner.provider.route` 成为 exact model selection 内的 LLM-provider coordinate：它引用 DSH 已注册 route，但不配置该 route。Provider realm factory 由自己的产品边界配置/创建，再作为 installation-scoped capability 提供给 Execution。对 DSH 而言，DSH profile/composition 启动 bridge/factory，并拥有 route/endpoint、credential、settings/environment lookup 与 native service composition。只有 Manifest persistence 后，Runner 才向该 factory 请求一个独立 Delivery-scoped DSH-E realm。DSH factory 拥有 realm construction；Runner 的 Delivery lease 拥有使用与 bounded disposal。Execution 不调用 DSH profile loader，不解析 DSH settings/credential，不构造 LLM adapter，也不共享 Intake DSH-I realm。在 Execution-owned loader 内调用 DSH parser 并不满足该边界。WSR 不解析或序列化 Provider secret。

## 2. Closed changed shape

未变化的 WSR paths、observation settings、controls、intake bounds、Runner implementation 与 Host fields 保持原语义。变化部分是：

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
    "provider": {
      "identity": "provider.dsh",
      "defaultModel": {
        "provider": "deepseek-official",
        "model": "deepseek-v4-flash"
      },
      "maxParallelToolCalls": 4
    }
  }
}
```

规则：

- `workflowSource` required，恰含一个 `github` 或一个先前 qualified explicit adapter config；request 不能选择它，Execution 中没有 source fallback list；
- `runner.provider.identity` 必须等于唯一 supplied installation-scoped Agent Provider realm factory 声明的 identity，并写入每个 admitted Role binding；2.0 没有 Execution-owned Provider factory registry、key、priority 或 fallback；
- `defaultModel` 是 absent repository Role mapping 时使用的 required closed model selection `{provider, model}`；其中 `provider` 是 exact DSH LLM route identity，`model` 是该 route 下的 exact model identity；两者均不配置 endpoint、adapter 或 credential；
- repository override 只位于 `<canonical-worktree>/.wsr/model-bindings.json`，不进入 installation config；
- WSR config 不接受 secret、token、API key、credential path/reference、Provider endpoint、LLM-route configuration 或 native session setting；
- unknown field 与 mixed 1.0/2.0 shape 在 Delivery admission 前失败。

## 3. Delivery projection 2.0

`execution.delivery-config@2.0.0` 只包含 WSR-owned recovery inputs：canonical repository/workspace scope 与 relative Runner state resources；Runner implementation/Host engine；stable Provider identity 与 WSR-owned parallelism/capability bounds；Delivery-affecting WSR controls。

它排除 installation default model selection，因为完整 resolved Role→Agent-Provider/LLM-route/model map 单独冻结在 `execution.delivery-manifest@2.0.0`。它也排除 Workflow source config、repository binding path、全部 Provider-native config 与所有 secret/reference。

Runner factory 接收 persisted Manifest execution binding 与 DSH-owned composition bridge 提供的 installation-scoped realm factory。Manifest persistence 后，它为该 Delivery 请求恰好一个 isolated DSH-E realm。Current Provider-owned config 为 frozen Agent Provider 与 LLM-route identities 提供 operational connectivity/credential，不是 binding authority。Recovery 通过相同 exact factory identity 请求新的 Delivery-scoped realm，只提交 persisted selections。Runner 在 Delivery teardown 时关闭自己的 realm lease。它不得启动 DSH profile、从 Manifest 重建 Provider config、接受其他 identity 的 factory/realm、共享 DSH-I state，也不能回退 current CLI/model default。

## 4. Compatibility 与 migration

- 既有 `execution.config@1.0.0`、Delivery Manifest 1.x 及其 recovery paths 保持历史 exact-version dispatch；
- 新 Workflow DSL 2.0 Delivery 要求 Execution config 2.0、Delivery config projection 2.0 与 Delivery Manifest 2.0；
- 1.0 config 不通过复制 credential fields 自动提升。Operator 在 WSR 之外配置 DSH profile，由 DSH composition 提供 installation-scoped realm factory，并显式写 2.0 WSR config；
- persisted 1.x Delivery 走历史 adapter path recovery，绝不经 repository Role policy 重新绑定；
- 新 2.0 Delivery 不能使用历史 Manifest/config projection。

## 5. Conformance

Required tests 覆盖 missing required Workflow source、malformed/empty default model selection、Agent-Provider/LLM-route/model identity grammar、unknown/mixed fields、所有 removed key/credential/endpoint fields、absent/present repository map、DSH-owned realm-factory injection without Execution profile/settings/credential loading、每 Delivery 一个 isolated realm、teardown disposal、recovery factory-identity check、Manifest secret scan、recovery version dispatch，以及当前 Provider/repository config 变化不会重绑 admitted Delivery。
