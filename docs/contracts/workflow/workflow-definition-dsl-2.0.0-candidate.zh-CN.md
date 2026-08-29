# Workflow Definition DSL 2.0.0 — Contract 候选

> **状态：** Iteration 5 发布前候选，2026-08-28。本文不是 published Contract，也不修改历史 `agentops.workflow-dsl@1.1.0` release。只有完整 machine package、conformance corpus、publication record 与 lifecycle gates 通过后才成为 authority。英文跟踪正文见 [`workflow-definition-dsl-2.0.0-candidate.md`](workflow-definition-dsl-2.0.0-candidate.md)。

Versioned upstream composition candidate 是 [`workflow-composition-model-2.0.0-candidate.zh-CN.md`](../../workflow-composition-model-2.0.0-candidate.zh-CN.md)。无版本历史 composition 文档继续绑定 published 1.x semantics。

## 1. 变更分类

`2.0.0` 删除 required Route/resource 字段并改变 binding authority，因此是 MAJOR revision。`1.1.0` Package 继续按历史 `1.1.0` Contract 解析，绝不静默套用 `2.0.0`。

在本候选扩写为可发布的 standalone artifact 前，未变化的 graph、dataflow、Action、Artifact、selector、wait、budget、canonicalization、snapshot、validation 与 conformance 语义继续继承 `1.1.0` 的规范要求。下文闭合全部已改变语义；实现不得自行推导额外变化。

## 2. 闭合 authority 模型

- **Role** 拥有稳定职责、Workflow authority concerns、禁止事项、write custody、independence requirement 与一个 exact Role-prompt resource。
- **Route** 把 Role 与 Action-prompt resources、Skills、tools、Driver、capability requirements、data-access intent 和 session policy 绑定。
- Route 不选择或声明 model，也不引用 generic Agent definition。
- Repository configuration 拥有可选 exact Role→model-selection map；Execution configuration 拥有一个 required global default model selection 与一个 exact installed Agent Provider identity；repository data 不能选择另一 Agent Provider。对于 DSH，model selection 是 DSH public Agent contract 要求的 exact `{provider, model}` LLM route/model pair。
- Delivery admission 对 exact Snapshot 中每个 distinct Agent-action Role 按 `repository[role] ?? execution.default_model_selection` 通过 installed Agent Provider 的 closed selection shape 解析，并把结果冻结进 Delivery Manifest。
- Agent Provider 拥有 provider-native endpoint、authentication、credentials、native configuration 与 session mechanics；这些都不是 Workflow resource。

Exact Role snapshot 是 `(workflow_snapshot_digest, role_id, role_prompt_identity, role_prompt_digest)`。同一 Role 的全部 allowed Route 必须引用同一 exact Role-prompt identity/digest。Admitted **Agent identity** 再加入 installed Agent Provider identity 与 exact LLM provider-route/model identity；**Agent execution binding** 再加入所选 Route 的 Action prompt、Skills、tools、Driver、access intent 与 session policy。Provider-native process/session identity 是 operational identity，不是 Agent configuration authority。

## 3. 相对 1.1.0 的 machine shape 变更

`2.0.0` machine schema 只做以下 breaking changes：

1. 删除 `routes[].agent`；
2. 删除 `routes[].resources.model`；
3. 从 Workflow Package resource kinds 删除 `agent-definition` 和 `model`；
4. 保留 exact Role-prompt binding，并要求每个被 Agent Action 使用的 Role 闭合到一个 Role prompt；
5. 保留 Route 的 Action prompts、Skills、tools、Driver、capabilities、session policy 与 data access bindings；
6. Contract coordinate 改为 `agentops.workflow-dsl@2.0.0`，拒绝混用 `1.1.0`/`2.0.0` 字段。

一个 Definition 最多包含 128 个 distinct Roles。这是 admission/portable-Manifest bound，不是 metric sample limit；超限 Package invalid，绝不 truncate。

Package index、Definition、Role、Route 与 Snapshot digest 覆盖变更后的 closed resource graph。Model identity 与 repository binding document 不属于 Workflow Package digest；这些外部 admitted values 由 Delivery Manifest 和 Delivery-binding digest 覆盖。

## 4. 指令与执行投影

Instruction authority 保持：

```text
Workflow/Action authority
  > Role prompt
  > Action prompt
  > Skill instructions
  > Artifact/user content
```

Model identity 是 structured execution data，绝不插入上述 instruction chain。Driver 可从 admitted Role prompt 投影 provider-native `agent.md` 或等价物，但生成文档不是 portable Contract resource，也不能覆盖 structured model binding。

Runner 只接收一个 immutable admitted binding。它不能用 CLI default、current repository configuration、current Workflow source、Route-local model choice 或 Provider fallback 替换任何 Manifest 字段。Recovery 以 persisted Manifest 与 exact Workflow Package materialization 作为 binding authority；current Provider-owned config 只可为 frozen Provider identity 提供 connectivity、credential 与 native mechanics。Capability missing/incompatible 时 recovery fail，绝不改变 Provider/model identity。

## 5. Admission obligations

在任何 Runner、session、tool、model-call 或 Workflow workspace mutation effect 之前，admission 必须完成下列步骤。Admission-owned selected Package/canonical-worktree repository policy read 是允许的；Provider validation 只做 local configured-capability/identity check，不创建 Provider session 或 network effect：

1. 解析并验证一个 exact `2.0.0` Workflow Package 与 Snapshot；
2. 从 canonical worktree 读取 optional repository Role→model-selection document；
3. 验证 closed revision 与 content identity；
4. 枚举 Snapshot 中每个 distinct Agent-action Role，并证明其全部 Route 使用一个 exact Role prompt；
5. 在唯一 installed Agent Provider 中把每个 enumerated Role 解析为 non-empty closed model selection；
6. 本地验证 supplied capability 使用 frozen Agent Provider identity，且每个 LLM route/model coordinate 具有 valid closed syntax；不加载 Provider config、不咨询 model catalog、不 probe network，也不读取或暴露 credential；
7. 将 Package/Snapshot identities、repository-document state/digest 与完整 resolved Role/Provider/model binding map 持久化进 Delivery Manifest。

Repository map 可包含同仓库其他 Workflow 的未知 Role key，但它们不进入本 Delivery Manifest。Missing mapping 使用唯一 Execution global default。Malformed document、unknown schema field、missing/malformed default selection、Agent-Provider capability mismatch、Role/Snapshot conflict 或 digest mismatch 均在 Runner effect 前失败。DSH 允许 discovery catalog 中不存在的 dynamic model，因此 admission 不得把 catalog absence 当成 invalid；unavailable exact route/model 在首次真实 invocation 返回 typed Provider failure。

## 6. Observation 与历史分析

Observation 记录 actual execution，而不是 configuration assignment。Model-call Spans 携带 exact C30 Role、C57 model、provider、Runtime 与 Span identity。不新增 model-assignment Event。

历史 Role-template 分析沿以下 authority chain：

```text
accepted Delivery Manifest
  -> exact Workflow Package/Snapshot content coordinates
  -> observed C30 Role
  -> exact Role prompt/template bytes
```

它不从 self-reported Event、current checkout、Route name、Agent-definition resource 或 timestamp 推导 template。

## 7. 发布 gates

发布前必须具有：

- standalone 英文与中文 semantic specifications；
- closed JSON schemas 和 deterministic checker/generator；
- minimal positive Package 与覆盖每个 removed/mixed field 的 negative fixtures；
- 所有 first-party Packages 的可复现 snapshot/digest migration；
- Execution vendored Contract mirror 与 exact-version dispatch；
- Delivery Manifest revision 与 recovery fixtures；
- 证明 actual Role/model tuple 且不新增 assignment Event 的 Observation fixtures；
- 覆盖全部 published resolving revision 的 exact-version historical fixtures，并重点证明 `1.1.0` 不被重新解释；
- lifecycle review 与 publication record。

全部 gates 通过前，production configuration 不得声称符合 `agentops.workflow-dsl@2.0.0`。
