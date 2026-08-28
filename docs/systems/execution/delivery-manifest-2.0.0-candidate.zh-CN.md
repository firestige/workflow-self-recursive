# Delivery Manifest 2.0.0 — 设计候选

> **状态：** Iteration 5 发布前候选，2026-08-28。它是历史 `execution.delivery-manifest@1.0.0/1.1.0` 的 new-Delivery successor；persisted historical manifest 继续按 exact version 读取。英文跟踪正文见 [`delivery-manifest-2.0.0-candidate.md`](delivery-manifest-2.0.0-candidate.md)。

## 1. Closed top-level shape

`execution.delivery-manifest@2.0.0` 保留 exact Delivery/Task identity、optional Task display name、creation instant、canonical worktree、immutable Task-prompt snapshot 与 WSR-owned Delivery config projection。Workflow/execution binding 改为：

```text
workflowPackage
  name / exactVersion / packageDigest / localMaterializationPath
workflowSnapshot
  workflowId / workflowVersion / snapshotId / snapshotDigest
repositoryModelBindings
  documentState=ABSENT|PRESENT / optional documentDigest / resolvedMapDigest
resolvedRoles[]
  roleId / rolePromptIdentity / rolePromptDigest
  / agentProviderId / modelProviderId / modelId / resolutionSource
deliveryConfigProjection@2.0.0
deliveryBindingIdentity
```

Local materialization path 是 private Execution recovery data，不进入 evidence-safe projection。`resolvedRoles` 对 admitted Snapshot 的每个 Agent-action Role 恰有一项，按 `roleId` bytewise sort，最多 128 项。`resolutionSource` 为 `REPOSITORY` 或 `EXECUTION_DEFAULT`。

## 2. Identity

`deliveryBindingIdentity` 沿用既有 Manifest identity rule：对除 `schemaVersion` 与 `deliveryBindingIdentity` 外的全部 top-level fields 做 canonical JSON，再取 lowercase SHA-256 并加 `sha256:`。它覆盖 Package/Snapshot coordinates、repository-document state、resolved Role map、prompt snapshot、worktree 与 Delivery projection；任一变化产生不同 identity。

Observation C07 与 Evidence `manifest_digest` 携带该 identity 的 lowercase 64-hex 部分。Evidence-safe projection 重复该 coordinate，并有自己的 projection digest；二者不能互相替代。

## 3. Admission 与 recovery invariants

- 在 exact Workflow Package/Snapshot validation 与 repository model-policy parsing 后、Runner effect 前创建；
- 每个 Snapshot Agent-action Role 有一个 resolved entry，每个 entry 都指向同一 Role-prompt digest 的 Snapshot Role；
- 每个 Agent Provider/LLM-route/model coordinate 在 persistence 前完成 closed local shape validation；admission 不假设 catalog membership，也不做 Provider network probe；
- current-slot persistence 绑定同一 `deliveryBindingIdentity`；
- recovery 验证 exact 2.0 shape/digest、exact Package/Snapshot materialization 与 Role closure，再只使用 persisted resolved bindings；
- recovery 不读取 current Workflow source、repository binding document 或 Execution default model selection，也不从 Manifest 重建 Provider-native config；
- current Provider-owned config 只可通过与 persisted Agent Provider identity 相同的 installation-scoped realm factory 提供 connectivity、credential 与 native mechanics；recovery 在 Manifest validation 后创建 fresh Delivery-scoped realm，factory/realm missing/incompatible 时在新 model/session effect 前 fail，绝不替换 Agent Provider/LLM route/model。

## 4. Privacy split

Full Manifest 可包含 local recovery 必需的 Execution-private absolute paths。Evidence-safe subprojection 只包含 Delivery/Task identity、full Manifest digest、Package/Snapshot content coordinates、repository-document state/content identities 与 resolved Role/Agent-Provider/LLM-route/model identities。

两种形态都禁止 secret material、credential path/reference、Provider endpoint/native route、Workflow source config/URL、prompt/attachment bytes、tool arguments/results、native session IDs 与 Observation/Evidence receipts。Portable projection 由 [`delivery-manifest-projection.zh-CN.md`](../evidence/delivery-manifest-projection.zh-CN.md) 单独定义。

## 5. Compatibility

- 1.x load/recovery 不变，使用历史 config/activation projector；
- 2.0 creation 要求 Workflow DSL 2.0、Execution config/Delivery projection 2.0；
- load 时禁止 version upgrade、从 current config 补字段或把 1.x Agent/model reconstruction 为 2.0 semantics；
- current slot 记录 exact Manifest version/identity path，或按 loaded Manifest `schemaVersion` dispatch；ambiguous 则 fail closed。

## 6. Conformance

Fixtures 覆盖 deterministic identity、Role order/uniqueness/completeness、absent/present repository document、fallback-source recording、Task-prompt 与 Workflow snapshot 分离、exact Package/Snapshot digest mismatch、current-slot identity mismatch、secret/path split、1.x historical recovery、2.0 no-reread recovery 与 retry 时 identical evidence-safe projection。Focused mutation/round-trip fixtures 必须证明任一 `roleId`、`rolePromptIdentity`、`rolePromptDigest`、`agentProviderId`、`modelProviderId`、`modelId` 或 `resolutionSource` 变化都会改变 `resolvedMapDigest` 与 `deliveryBindingIdentity`，且 full Manifest → evidence-safe projection 不丢失 resolved-role 七字段中的任何一个。把 `roleId` 替换为 Snapshot 中不存在的 identity 还必须使 Role-closure validation fail。
