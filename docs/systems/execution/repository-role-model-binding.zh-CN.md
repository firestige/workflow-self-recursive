# Repository Role-to-Provider Binding — 设计候选

> **状态：** Iteration 6 contract-change 候选，2026-08-29。对新的 2.0 Delivery，本文 supersede Iteration 5 的单 installation Provider/default-model 提案。已发布 1.x 行为保持历史 exact-version dispatch。英文 [`repository-role-model-binding.md`](repository-role-model-binding.md) 是规范候选，本文是中文 tracking companion。

## 1. 决策

Repository 是 Provider/model policy 的最小 scope。每个 Workflow Agent-action Role 都必须有一条显式 closed binding：

```text
repository.bindings[role]
  = exact Agent Provider identity + version
  + exact Provider-owned model coordinate {provider, model}
```

不存在 installation default Provider/model、priority order、fallback chain、ambient discovery、request override 或 admission 后重绑。缺少 Role binding 就是 admission error。同一 Workflow 的不同 Role 可以绑定不同 Provider。

Route/Action selection 可增加 prompt、Skills、tools、Driver、access 与 session policy，但不能改变 Role 的 Provider/model selection。Admission 在任何 runtime Route 选择前派生并冻结 Role 的完整 required-capability union。

## 2. Agent 与 Provider 模型

- **Role** 拥有稳定职责、authority、prohibition、write custody 与 exact Role prompt。
- **Agent identity** 是 admitted exact Role snapshot、exact Provider descriptor 与 Provider-owned model coordinate 的组合。
- **Agent execution binding** 再加 selected Route 的 Action prompt、Skills、tools、Driver、access intent、session policy，以及所有可能使用该 Role 的 Agent Action 所需 capabilities 的 union。
- **Agent Provider factory descriptor** 是 closed tuple：`identity`、semantic `version`、`adapterKey` 与 canonical sorted `capabilities`，并带 canonical descriptor digest。
- **Agent Provider** 拥有 provider-native config、endpoint、authentication、credential/login state、transport 与 native session；这些都不属于 repository、Manifest、Observation 或 WSR config。

独立 authored generic `agent-definition` resource 不进入 2.0 模型。Workflow DSL `1.1.0` 保持历史；其 required resource 与 activation projection 不被追溯改写。

## 3. Repository document

2.0 Delivery 的 required path 是 `<canonical-worktree>/.wsr/role-provider-bindings.json`：

```json
{
  "schemaVersion": "execution.repository-role-provider-bindings@1.0.0",
  "bindings": {
    "role.architecture-reviewer": {
      "agentProvider": {"identity": "provider.dsh", "version": "2.0.0"},
      "model": {"provider": "deepseek-official", "model": "deepseek-reasoner"}
    },
    "role.evidence-scout": {
      "agentProvider": {"identity": "provider.copilot", "version": "1.3.0"},
      "model": {"provider": "github-copilot", "model": "gpt-5"}
    }
  }
}
```

规则：

- UTF-8 file 最大 64 KiB，`bindings` 最多 1,024 个 member；
- Role、Provider、model identity 匹配 `^[A-Za-z][A-Za-z0-9._-]{0,127}$`；Provider version 是 exact SemVer；
- 每个 binding 恰含 `agentProvider` 与 `model`；不接受 alias、priority、fallback、adapter selector、capability override、endpoint、credential、login state 或 native session setting；
- unknown field、duplicate JSON member、malformed identity/version、不可读文件、逃逸 symlink 或 unsupported revision 使 admission fail；
- selected Workflow 之外的 Role binding 可保留在 repository document 中，但不进入该 Delivery resolved map；
- 仅当 admitted Snapshot 没有 Agent-action Role 时，document absence 才合法；否则 document absence、empty map 或任一 used Role binding 缺失，都在 Manifest persistence 与 Runner effect 前失败。

Canonical JSON 与 `canonical_digest` 使用 Workflow DSL 2.0 canonicalization。Document digest 覆盖包括 `schemaVersion` 在内的完整 document。Resolved array 按 `roleId` bytewise sort，且 `resolvedMapDigest = canonical_digest(resolvedRoles)`。

## 4. Admission、registry 与 recovery

Installation composition 提供一个 closed `AgentProviderFactoryRegistry`，其中装入各 owner factory。Registration 拒绝 duplicate/conflicting descriptor。Registry 是 composition capability，不是 selection policy：repository bytes 选择 exact Provider identity/version，registered descriptor 提供 immutable `adapterKey`、capability set 与 descriptor digest。

对 exact Workflow Snapshot 中每个 distinct Agent-action Role，admission：

1. 要求其 repository binding；
2. 解析 exact registered Provider identity/version；
3. 从 exact Snapshot Routes/Actions 派生该 Role 的 required-capability union；
4. 拒绝 unknown Provider、version mismatch 或 capability incompatibility；
5. 冻结 `roleId`、Role-prompt identity/digest、Provider identity/version/adapter key/descriptor digest、sorted required capabilities、Provider-owned model coordinate，以及 `resolutionSource=REPOSITORY`。

Manifest 与 Observation-safe projection 冻结这些 exact values。Runtime、session create/resume 与 recovery 必须 exact-match persisted descriptor/model coordinate。Current repository content 或 registry composition 不能重绑 persisted Delivery；mismatch 也不能选择另一 Provider/model。

Manifest persistence 后，Runner 只启动该 Manifest 实际使用的 distinct Provider realms。每个 owner factory 构造自己的 realm；Runner 拥有 bounded Delivery lease/disposal。未使用的 registered Provider 不启动。Partial startup rollback；reused/mismatched realm lease fail closed。

## 5. Failure semantics

| 条件 | 结果 |
| --- | --- |
| document 缺失且没有 Agent-action Role | valid empty resolved map；不启动 Provider realm |
| 存在 Agent-action Role 时 document 或 used Role binding 缺失 | Manifest/Runner effect 前 Delivery admission fail |
| Provider unknown、duplicate 或 exact version 不同 | startup/admission fail closed；不尝试 alternative |
| Provider capability 不覆盖 Role requirement union | Runner effect 前 admission fail |
| Provider-owned model coordinate malformed | Runner effect 前 admission fail |
| exact model 无法执行 | selected Provider 返回 typed runtime failure；不发明 catalog probe/fallback |
| Manifest 后 repository/registry 变化 | 不影响 admitted Delivery |
| persisted descriptor/model 在 session/recovery 时不符 | 新 Provider/session effect 前 fail |
| Provider credential/login unavailable | Provider-owned typed failure；credential 不进入 WSR binding data |

## 6. 历史边界

Iteration 5 提案使用 optional `.wsr/model-bindings.json`、单 installation Agent Provider、`repository[role] ?? execution.default_model_selection` 与 `REPOSITORY|EXECUTION_DEFAULT`。这些陈述描述未发布的 2.0 提案，现由本文 supersede。已发布 1.x config、activation、Manifest 与 recovery path 保持历史 exact-version behavior，不被改写为本 registry/binding 模型。
