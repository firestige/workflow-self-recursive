# Repository Role-to-Provider Binding — Design Candidate

> **Status:** Iteration 6 contract-change candidate, 2026-08-29. This document supersedes the Iteration 5 single-installation-Provider/default-model proposal for new 2.0 Deliveries. Published 1.x behavior remains historical and exact-version dispatched. Chinese tracking companion: [`repository-role-model-binding.zh-CN.md`](repository-role-model-binding.zh-CN.md).

## 1. Decision

The repository is the minimum Provider/model-policy scope. Every Workflow Agent-action Role must have one explicit closed binding:

```text
repository.bindings[role]
  = exact Agent Provider identity + version
  + exact Provider-owned model coordinate {provider, model}
```

There is no installation default Provider or model, priority order, fallback chain, ambient discovery, request override, or post-admission rebinding. A missing Role binding is an admission error. Different Roles in one Workflow may bind different Providers.

Route and Action selection may add prompts, Skills, tools, Driver, access, and session policy, but cannot alter the Role's Provider/model selection. Admission derives and freezes the Role's complete required-capability union before any runtime Route is selected.

## 2. Agent and Provider model

- **Role** owns stable responsibility, authority, prohibitions, write custody, and the exact Role prompt.
- **Agent identity** is the admitted exact Role snapshot plus the exact Provider descriptor and Provider-owned model coordinate.
- **Agent execution binding** adds the selected Route's Action prompt, Skills, tools, Driver, access intent, session policy, and the union of capabilities required by every Agent Action that may use the Role.
- **Agent Provider factory descriptor** is the closed tuple `identity`, semantic `version`, `adapterKey`, and canonical sorted `capabilities`, with a canonical descriptor digest.
- **Agent Provider** owns provider-native configuration, endpoints, authentication, credentials/login state, transport, and native sessions. None of those values is repository, Manifest, Observation, or WSR configuration data.

An independently authored generic `agent-definition` resource is not part of the 2.0 model. Workflow DSL `1.1.0` remains historical; its required resource and activation projection are not retroactively changed.

## 3. Repository document

The required path for a 2.0 Delivery is `<canonical-worktree>/.wsr/role-provider-bindings.json`:

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

Rules:

- the UTF-8 file is at most 64 KiB and `bindings` has at most 1,024 members;
- Role, Provider, and model identities match `^[A-Za-z][A-Za-z0-9._-]{0,127}$`; Provider version is exact SemVer;
- each binding contains exactly `agentProvider` and `model`; no alias, priority, fallback, adapter selector, capability override, endpoint, credential, login state, or native session setting is accepted;
- unknown fields, duplicate JSON members, malformed identities/versions, unreadable files, escaping symlinks, or unsupported revisions fail admission;
- bindings for Roles outside the selected Workflow may remain in the repository document but do not enter that Delivery's resolved map;
- document absence is valid only when the admitted Snapshot has no Agent-action Role; otherwise absence, an empty map, or a missing used Role binding fails before Manifest persistence and Runner effect.

Canonical JSON and `canonical_digest` use Workflow DSL 2.0 canonicalization. The document digest covers the complete document including `schemaVersion`. The resolved array is bytewise sorted by `roleId` and `resolvedMapDigest = canonical_digest(resolvedRoles)`.

## 4. Admission, registry, and recovery

Installation composition supplies one closed `AgentProviderFactoryRegistry` containing owner factories. Registration rejects duplicate/conflicting descriptors. The registry is composition capability, not selection policy: repository bytes select an exact Provider identity/version, and the registered descriptor supplies the immutable `adapterKey`, capability set, and descriptor digest.

For every distinct Agent-action Role in the exact Workflow Snapshot, admission:

1. requires its repository binding;
2. resolves the exact registered Provider identity/version;
3. derives the Role's required-capability union from the exact Snapshot Routes/Actions;
4. rejects an unknown Provider, version mismatch, or capability incompatibility;
5. freezes `roleId`, Role-prompt identity/digest, Provider identity/version/adapter key/descriptor digest, sorted required capabilities, Provider-owned model coordinate, and `resolutionSource=REPOSITORY`.

The Manifest and its Observation-safe projection freeze those exact values. Runtime, session creation/resume, and recovery must exact-match the persisted descriptor and model coordinate. Current repository content or registry composition cannot rebind a persisted Delivery, and no mismatch may select another Provider/model.

After Manifest persistence, Runner starts realms only for the distinct Providers actually used by that Manifest. Each owner factory constructs its own realm; Runner owns the bounded Delivery lease/disposal. An unused registered Provider is not started. Partial startup is rolled back, and a reused or mismatched realm lease fails closed.

## 5. Failure semantics

| Condition | Result |
| --- | --- |
| document absent with no Agent-action Role | valid empty resolved map; no Provider realm starts |
| document or used Role binding absent while an Agent-action Role exists | Delivery admission fails before Manifest/Runner effect |
| Provider unknown, duplicate, or exact version differs | startup/admission fails closed; no alternative is tried |
| Provider capabilities do not cover the Role requirement union | admission fails before Runner effect |
| Provider-owned model coordinate malformed | admission fails before Runner effect |
| exact model cannot execute | selected Provider returns a typed runtime failure; no catalog probe or fallback is invented |
| repository/registry changes after Manifest | no effect on the admitted Delivery |
| persisted descriptor/model differs at session or recovery time | fail before new Provider/session effect |
| Provider credentials/login unavailable | Provider-owned typed failure; credentials never enter WSR binding data |

## 6. Historical boundary

The Iteration 5 proposal used optional `.wsr/model-bindings.json`, one installation Agent Provider, `repository[role] ?? execution.default_model_selection`, and `REPOSITORY|EXECUTION_DEFAULT`. Those statements describe an unshipped 2.0 proposal and are superseded here. Published 1.x configuration, activation, Manifest, and recovery paths remain historical, exact-version behavior and are not rewritten into this registry/binding model.
