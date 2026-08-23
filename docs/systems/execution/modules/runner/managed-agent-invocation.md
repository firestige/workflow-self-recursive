# Managed Agent Invocation Submodule Detailed Design

## 1. Status and role

| Field | Value |
| --- | --- |
| Status | `ITERATION_2_IMPLEMENTED_DOCUMENT_CALIBRATION_CANDIDATE` |
| Submodule | Managed Agent Invocation |
| Current production Provider | DSH Adapter |
| Structure authority | GitHub issue `execution-system#65` |
| Implementation evidence | `execution-system/src/invocation` |
| Companion | [Chinese non-normative companion](managed-agent-invocation.zh-CN.md) |

Managed Agent Invocation owns one admitted Agent Action's Provider effects, native session lifecycle, credential lease, structured completion and durable Invocation Journal. It is the only Runner submodule that understands Provider-private state.

## 2. Creation boundary

The module owns a closed `ProviderAdapterFactory` contract and concrete Provider factories. Runner composition creates one exact-key registry instance and registers configured factories. A factory receives its typed, immutable configuration and returns a managed Provider Adapter; it does not receive a caller-preconstructed Provider-native runtime.

The DSH Adapter Factory owns DSH bootstrap end to end. It creates the real DSH `AgentRegistry`, `SessionStore`, Agent composition and native session factory from exact configuration and required local storage. Unsupported provider/model/configuration, duplicate registration or native startup failure fails before Adapter publication. There is no ambient Provider discovery or fallback.

Copilot and Codex are typed fail-closed shells. They return `PROVIDER_NOT_IMPLEMENTED` before effect and cannot be selected as a fallback.

## 3. Caller-specific capabilities

Workflow Host receives only the Action capability:

```text
start(dispatch, output)
continueWithInput(same episode, response, output)
```

Lifecycle Coordinator receives only control operations:

```text
cancel(delivery)
inspect(delivery)
retire(authorization)
```

Managed Invocation never receives Workspace/Custody service. The Host supplies one signed `AuthorizedWorkspaceCapability` value in the dispatch. Production imports and type fixtures enforce this caller split.

## 4. Dispatch validation before effect

Before Provider lookup, open or restore, Managed Invocation recomputes and verifies:

- exact Action/executor and provider/model route;
- session compatibility identity;
- executor binding identity;
- invocation-plan binding identity;
- session affinity identity and scope value;
- signed Workspace access digest;
- required capabilities, tools and interaction capability;
- structured result schema binding.

Any mismatch fails before credential acquisition or Provider effect. A prior compatible data-bound affinity restores the exact opaque native session. Missing or uncertain native persistence cannot fall back to a fresh session. Incompatible scope or isolated episode creates a new affinity.

## 5. Native turn and structured completion

An Action may contain multiple Provider turns. Assistant output, a turn/end event, process exit or session disposal is not completion. The only completed disposition is an admitted structured completion carrying the exact result and correlation.

When the Agent invokes the admitted input-request tool, Invocation persists one pending request and returns `awaiting-input`. The Provider turn is quiescent and worker/credential resources are released. `continueWithInput` validates request/episode/content identity, restores the exact native session and continues the same episode. A stale response, multiple pending requests, completion while input is pending or duplicate completion fails closed.

The input tool is installed only when the exact Action binding provides the interaction capability.

## 6. Validation support

Provider-protocol result validation is necessary at this boundary, independently of Host validation. Managed Invocation consumes a private typed `InvocationResultValidator` constructor capability. It validates the structured completion against the admitted result schema before returning `completed`.

This validator is not a user policy, shared Contract field or `RunnerFactoryConfig` callback. Low-level module tests may inject a controlled fake. Runner composition creates the one fixed fail-closed production implementation. A bare `validateResult` function or production `() => true` option is not supported.

## 7. Credentials, tools and DSH authority

Every Provider turn acquires an action-scoped credential lease, installs the exact credential into the agent-scoped DSH LLM path, redacts it from Journal/output and releases it after the turn. Resume reauthorizes; it does not inherit an ambient credential.

The DSH Adapter uses the supported public package closure. The agent-scoped LLM interceptor uses the exact configured provider/model and acquired secret. Scoped filesystem tools enforce signed read/write rules, relative-path validation and realpath containment. Ambient/global tools are denied. Visibility restriction alone is not treated as an authority boundary.

DSH is the Action execution side, not Intake. It cannot obtain user input except through the admitted structured interaction tool and Runner bridge.

## 8. Journal, cancellation and retirement

The Journal durably records starting, running, awaiting-input, completed, failed, invalid, cancelled and unknown facts. Transitions are serialized per identity and persisted atomically. Cancellation becomes durable before native cancel and a late completion cannot overwrite it. Awaiting-input is inspected as quiescent/stopped, not as an open turn.

Retirement validates the exact Delivery and authorization, deletes only Invocation-owned journals/affinity state and persists a minimal owner-local tombstone containing the returned owner fact. The full transition is serialized per Delivery. Same authorization replays the fact; different authorization fails closed; destructive cleanup occurs once. No external authorization-policy callback is used.

## 9. Verification and reopen conditions

Required tests use the real DSH public closure and cover:

- configured DSH factory creation without prebuilt agents/sessions;
- exact create and native resume, including no-fresh fallback;
- compatible-affinity reuse and incompatible/isolated separation;
- binding/access/capability mismatch before effect;
- local DeepSeek-compatible SSE with the exact synthetic credential;
- scoped tools and path/symlink escape rejection;
- structured completion and all non-completion events;
- multi-turn same-episode interaction and correlation negatives;
- cancel races, persistence uncertainty and concurrent retirement;
- typed fail-closed Copilot/Codex shells.

Reopen if the Provider public closure cannot create or restore the required native session, if credential/tool authority cannot be installed without ambient state, or if a Provider needs public Runner lifecycle operations.
