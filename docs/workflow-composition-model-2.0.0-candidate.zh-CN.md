# Workflow 组合模型 2.0.0 — 候选

> **状态：** Iteration 5 发布前候选，2026-08-28。无版本 [`workflow-composition-model.md`](workflow-composition-model.md) 继续作为 published Workflow DSL 1.0/1.1 的历史 upstream human authority；本候选未被这些 immutable publication record 引用，只随 Workflow DSL 2.0 publication 成为 active composition model。英文正文见 [`workflow-composition-model-2.0.0-candidate.md`](workflow-composition-model-2.0.0-candidate.md)。

## 1. Delta scope

除本文明确变化外，所有 Workflow graph、Action、Artifact、transition、selector、wait、budget、authority order、Snapshot 与 validation 语义继承 published DSL 1.1。特别是 semantic branch 继续使用 DSL 1.1 定义的 Runtime-internal Planner/classifier；本候选不新增 Planner Action、Planner Role、Planner prompt 或 transition authority。

唯一 composition rebaseline 是 Agent/model boundary：

- Role 拥有 stable responsibility、authority、prohibition、write custody、independence 与一个 exact Role prompt；
- Route 把 Role 与 Action prompts、Skills、tools、Driver、capabilities、access intent 和 session policy 绑定；
- Workflow Package 不含 generic Agent-definition resource 或 model resource；
- Repository policy 可选地把 exact Role ID 映射到 exact model selection；对 DSH，每个 selection 是 `{provider, model}`，其中 `provider` 是 registered DSH LLM route，`model` 在该 route 内 exact。Missing mapping 使用 Execution installation default selection；
- Execution 把 resolved Role/Provider/model bindings 与 exact Workflow Snapshot 一起冻结进 Delivery Manifest；
- Agent Provider 拥有 endpoint/routing、authentication、credentials、native config 与 native session mechanics。

## 2. Composition closure

```text
Workflow Package / Snapshot
  ├── graph, Actions, transitions, terminal rules
  ├── Agent-action Roles
  │    └── one exact Role prompt per Role
  └── Routes
       └── Action prompts, Skills, tools, Driver, capabilities, access, session

Admission-owned external binding
  ├── exactly one installed Agent Provider identity
  ├── repository Role→model-selection document or Execution default selection
  └── exact resolved Role/Agent-Provider/LLM-route/model bindings
```

Deterministic admitted Role set 是 exact Snapshot 中被 Agent Action 引用的每个 distinct Role，不取决于之后是否选中 dynamic Route。Runtime-only deterministic Action 没有 Role entry。对每个 admitted Role，全部 allowed Route 必须引用同一 exact Role-prompt identity/content digest；不一致则 Package invalid。

Exact Role snapshot 为：

```text
(workflow_snapshot_digest, role_id, role_prompt_identity, role_prompt_digest)
```

Admitted Agent identity 是该 Role snapshot 加唯一 installed Agent Provider identity 与 resolved exact LLM provider-route/model identity。选中 Route 后，再加入 Action prompt、Skills、tools、Driver、access、capabilities 与 session policy，形成 Agent execution binding。Provider-native session/process ID 是 operational identity，不是 Agent configuration authority。

## 3. Provider boundary 与 recovery

Execution 对每个 installation/Delivery 选择并冻结恰好一个 Agent Provider identity。Repository config 不能选择另一 Agent Provider。Model selection 可以命名该 Agent Provider 内的 LLM provider route，因为 DSH call contract 要求这一 pair；命名 route 不等于配置 route。

Provider 由自己的产品边界配置和创建。对于 DSH，DSH profile/composition 启动 installation-scoped DSH-owned bridge/realm factory，并拥有 LLM route/endpoint、credential、settings/environment lookup 与 native service composition。Manifest persistence 后，Runner 向该 factory 请求一个 isolated Delivery-scoped DSH-E realm，只提交 admitted exact `{provider, model}` selection。DSH factory 拥有 realm construction；Runner 拥有 Delivery lifecycle lease/disposal。Execution 不启动该 profile、不读取 DSH files、不构造 LLM adapter、不 lease credential material，也不共享 Intake DSH-I realm。仅在 Execution-owned credential loader 内调用 DSH parser 不满足该边界。

Recovery 分开 authority 与 connectivity：

- persisted Manifest 是 Workflow Snapshot、Role、Provider identity 与 model identity 的唯一 authority；
- current Provider-owned config 可为该 frozen Provider identity 提供 connectivity、credential 与 native mechanics；
- current repository policy、Execution default model selection、Workflow source alias、CLI default 或 Provider fallback 都不能重新绑定 Delivery；
- missing/incompatible Provider capability 在新的 model/session effect 前显式令 recovery fail。

## 4. Package organization

目标 resource catalog 含 Role prompts、Action prompts、Skills、tools、Drivers、templates、schemas、validators 与 conformance assets，不含 generic Agent-definition 或 model resource。Driver 可从 admitted Role prompt 投影 provider-native `agent.md`，但生成文档不是 portable authority，也不承载 structured model binding。

Repository Role→model-selection document 不是 Workflow Package asset，不进入 Package/Snapshot digest；其 exact admitted state 与 resolved binding set 由 Delivery binding identity 覆盖。

## 5. Version boundary

Published Workflow DSL 1.0/1.1 Package 保持原 Agent-definition/model semantics 与 exact-version dispatch。新 DSL 2.0 Package 只在 publication 后使用本候选模型。Loader 不得用 repository binding 补全 1.x Package，也不得让 2.0 Package接受已删除的 1.x fields。
