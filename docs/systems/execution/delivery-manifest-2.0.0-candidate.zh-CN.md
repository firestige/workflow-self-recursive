# Delivery Manifest 2.0.0 — 设计候选

> **状态：** Iteration 6 发布前候选，2026-08-29。它是历史 `execution.delivery-manifest@1.0.0/1.1.0` 的 new-Delivery successor；persisted historical Manifest 继续按 exact version 读取。英文跟踪正文见 [`delivery-manifest-2.0.0-candidate.md`](delivery-manifest-2.0.0-candidate.md)。

## 1. Closed top-level shape

`execution.delivery-manifest@2.0.0` 保留 exact Delivery/Task identity、creation instant、canonical worktree、immutable Task-prompt snapshot 与 WSR-owned Delivery config projection。其 Workflow/execution binding 为：

```text
workflowPackage
  name / exactVersion / packageDigest / localMaterializationPath
workflowSnapshot
  workflowId / workflowVersion / snapshotId / snapshotDigest
repositoryModelBindings
  documentState=ABSENT|PRESENT / optional documentDigest / resolvedMapDigest
resolvedRoles[]
  roleId / rolePromptIdentity / rolePromptDigest
  / agentProviderId / agentProviderVersion
  / agentProviderAdapterKey / agentProviderDescriptorDigest
  / requiredCapabilities[]
  / modelProviderId / modelId / resolutionSource=REPOSITORY
deliveryConfigProjection@2.0.0
deliveryBindingIdentity
```

Local materialization path 是 private recovery data，不进入 evidence-safe projection。`resolvedRoles` 对每个 Agent-action Role 恰有一项，按 `roleId` bytewise sort，最多 128 项。Required capabilities 是 non-empty、unique、canonically sorted identities。

## 2. Identity

`deliveryBindingIdentity` 是对除 `schemaVersion` 与 `deliveryBindingIdentity` 外全部 top-level fields 的 canonical JSON 取 lowercase SHA-256 并加 `sha256:`。它覆盖 Package/Snapshot coordinates、repository document identity、完整 resolved Role descriptor/model map、prompt snapshot、worktree 与 Delivery projection。

`resolvedMapDigest` 覆盖每个 resolved Role field，包括 Provider version、adapter key、descriptor digest、capabilities 与 Provider-owned model coordinate。Observation C07 与 Evidence `manifest_digest` 携带 full Manifest identity 的 lowercase 64-hex 部分；evidence-safe projection 有独立 projection digest。

## 3. Admission 与 recovery invariants

- exact Workflow Package/Snapshot validation、repository Provider-binding parsing、exact registry lookup 与 capability validation 后创建，并先于所有 Runner/Provider effect；仅当 Snapshot 没有 Agent-action Role 时，`ABSENT` 才合法；
- 每个 Snapshot Agent-action Role 有一个 resolved entry，且每项与 Snapshot 中同一 Role-prompt identity/digest 对应；
- repository Provider identity/version 必须 exact-match 一个 registered factory descriptor，且其 capabilities 覆盖 Role required-capability union；
- 不存在 Provider/model default、priority、fallback 或 admission 后 rebinding；
- current-slot persistence 绑定同一 `deliveryBindingIdentity`；
- runtime dispatch 与 native session create/resume 使用 exact persisted Role descriptor/model coordinate；
- recovery 在任何新 Provider/session effect 前验证 exact 2.0 shape/digests、Package/Snapshot materialization、Role closure 与 exact registered descriptor match；
- recovery 不重读 current Workflow source 或 repository binding 作为 authority；current registry composition 不能替换 Provider/version/adapter/capability descriptor/model；
- 只有 `resolvedRoles` 实际包含的 distinct Provider 获得 Delivery-scoped realm；registered unused Provider 不启动。

## 4. Privacy split

Full Manifest 可含 recovery 所需的 Execution-private absolute paths。Evidence-safe projection 只含 Delivery/Task identity、full Manifest digest、Package/Snapshot coordinates、repository-document identities，以及每个 exact resolved Role Provider/model field。

两种形态都禁止 secret、credential path/reference、login state、Provider endpoint/native config、Workflow source URL/config、prompt/attachment bytes、tool content、native session ID 与 Observation/Evidence receipt。Credential 与 session mechanics 保持在 Provider-owned factory/SPI 后。Portable projection 由 [`delivery-manifest-projection.zh-CN.md`](../evidence/delivery-manifest-projection.zh-CN.md) 定义。

## 5. Compatibility

- 1.x load/recovery 保持历史，使用历史 config/activation projector；
- 2.0 creation 要求 Workflow DSL 2.0、Execution config/projection 2.0 与完整 repository Role-to-Provider bindings；
- 禁止 load 时 upgrade、从 current config/repository 补字段，或把 1.x Agent/model data 重建成 2.0 semantics；
- current-slot version dispatch 必须 exact；ambiguity fail closed。

## 6. Conformance

Fixtures 覆盖 deterministic identities；Role order/uniqueness/completeness；mixed Providers；missing binding；unknown/version/capability mismatch；每个 resolved field mutation；runtime/session/recovery descriptor/model exact-match；only-used realm startup；secret/path split；1.x historical recovery；2.0 no-reread/no-fallback recovery；以及 retry 时 identical evidence-safe projection。
