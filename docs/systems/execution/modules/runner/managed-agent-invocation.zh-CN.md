# Managed Agent Invocation Submodule 详细设计

## 1. 状态与角色

| 字段 | 值 |
| --- | --- |
| 状态 | `ITERATION_2_IMPLEMENTED_DOCUMENT_CALIBRATION_CANDIDATE` |
| Submodule | Managed Agent Invocation |
| 当前 production Provider | DSH Adapter |
| 结构权威 | GitHub issue `execution-system#65` |
| 实现证据 | `execution-system/src/invocation` |
| Companion | [英文规范原文](managed-agent-invocation.md)；本文是 non-normative 中文 companion |

> **历史边界：** 下方 credential-lease、configured-factory 与单 DSH Adapter behavior 描述已发布 1.x/Iteration 2 path。新的 2.0 Delivery 遵循 [Role-to-Provider binding candidate](../../repository-role-model-binding.zh-CN.md)：repository Role 绑定 exact Provider descriptor/model，installation composition 提供 owner-factory registry，只启动 used realms，且 Provider-owned session SPI 不携带 credential 或 runtime rebinding。

Managed Agent Invocation 拥有 admitted Agent Action 的 Provider effect、native session lifecycle、credential lease、structured completion 和 durable Invocation Journal。它是唯一理解 Provider-private state 的 Runner submodule。

## 2. 创建边界

本模块拥有 closed `ProviderAdapterFactory` contract 与 concrete Provider factory。Runner composition 创建 exact-key registry instance 并注册 configured factories。factory 接收 typed immutable configuration 并返回 managed Provider Adapter；不接收 caller 预构造的 Provider-native runtime。

DSH Adapter Factory 端到端拥有 DSH bootstrap。它根据 exact configuration/required local storage 创建真实 DSH `AgentRegistry`、`SessionStore`、Agent composition 和 native session factory。unsupported provider/model/configuration、duplicate registration 或 native startup failure 在 Adapter 发布前失败。没有 ambient Provider discovery/fallback。

Copilot/Codex 是 typed fail-closed shell，在 effect 前返回 `PROVIDER_NOT_IMPLEMENTED`，且不能作为 fallback。

## 3. Caller-specific capability

Workflow Host 只获得 `start(dispatch, output)` 与 `continueWithInput(same episode, response, output)`。Lifecycle Coordinator 只获得 `cancel(delivery)`、`inspect(delivery)`、`retire(authorization)`。

Managed Invocation 永远不获得 Workspace/Custody service；Host 只在 dispatch 中传入 signed `AuthorizedWorkspaceCapability` value。production import/type fixture 强制 caller split。

## 4. Effect 前的 dispatch validation

Provider lookup/open/restore 前，Managed Invocation 重算并校验 exact Action/executor/provider/model route、session compatibility、executor binding、invocation-plan binding、session affinity/scope value、signed Workspace access digest、required capability/tool/interaction capability 和 structured result schema binding。

任一 mismatch 在 credential acquisition/Provider effect 前失败。此前 compatible data-bound affinity 必须恢复 exact opaque native session；native persistence missing/uncertain 时不能 fresh fallback。incompatible scope 或 isolated episode 创建新 affinity。

## 5. Native turn 与 structured completion

Action 可以包含多个 Provider turn。assistant output、turn/end event、process exit 或 session disposal 都不是 completion。只有 exact correlated admitted structured completion 才能返回 completed disposition。

Agent 调用 admitted input-request tool 时，Invocation 持久化单一 pending request 并返回 `awaiting-input`。Provider turn quiescent，worker/credential resource 释放。`continueWithInput` 校验 request/episode/content identity，恢复 exact native session 并继续同一 episode。stale response、multiple pending request、pending 时 completion 或 duplicate completion 均 fail closed。

只有 exact Action binding 提供 interaction capability 时才安装 input tool。

## 6. Validation support

Provider-protocol result validation 在此边界必要，并独立于 Host validation。Managed Invocation 消费 private typed `InvocationResultValidator` constructor capability，根据 admitted result schema 校验 structured completion 后才返回 `completed`。

该 validator 不是 user policy、shared Contract field 或 `RunnerFactoryConfig` callback。low-level module test 可注入 controlled fake；Runner composition 创建唯一 fixed fail-closed production implementation。不支持 bare `validateResult` function 或 production `() => true` option。

## 7. Credential、tool 与 DSH authority

每个 Provider turn 获取 action-scoped credential lease，将 exact credential 安装到 agent-scoped DSH LLM path，从 Journal/output 中 redact，并在 turn 后 release。resume 会重新授权，不继承 ambient credential。

DSH Adapter 使用 supported public package closure。agent-scoped LLM interceptor 使用 exact configured provider/model 与 acquired secret。scoped filesystem tool 强制 signed read/write rule、relative-path validation、realpath containment；ambient/global tool 被拒绝。visibility restriction 本身不作为 authority boundary。

DSH 是 Action execution side，不是 Intake；只能通过 admitted structured interaction tool/Runner bridge 获得用户输入。

## 8. Journal、cancellation 与 retirement

Journal 持久记录 starting、running、awaiting-input、completed、failed、invalid、cancelled 和 unknown。transition 按 identity 串行并原子持久化。cancellation 在 native cancel 前 durable；late completion 不能覆盖。awaiting-input inspection 是 quiescent/stopped，不是 open turn。

Retirement 校验 exact Delivery/authorization，只删除 Invocation-owned journal/affinity state，并保存包含 returned owner fact 的 minimal owner-local tombstone。完整 transition 按 Delivery 串行；same authorization 重放 fact，different authorization fail closed，destructive cleanup 一次。不存在 external authorization-policy callback。

## 9. 验证与 reopen 条件

测试必须使用真实 DSH public closure，并覆盖 configured factory 创建、exact create/resume/no-fresh fallback、affinity reuse/separation、effect-before validation、本地 DeepSeek-compatible SSE/exact synthetic credential、scoped tool/path escape、structured completion/non-completion、多轮 interaction、cancel/persistence/concurrent retirement，以及 typed fail-closed Copilot/Codex。

如果 Provider public closure 不能创建/恢复 native session、credential/tool authority 无法脱离 ambient state 安装，或 Provider 需要 public Runner lifecycle operation，则重新打开本设计。
