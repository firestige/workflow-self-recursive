# Delivery Manifest 2.0.0 — Design Candidate

> **Status:** Iteration 6 pre-publication candidate, 2026-08-29. This is the new-Delivery successor to historical `execution.delivery-manifest@1.0.0/1.1.0`; persisted historical manifests remain exact-version readable. Chinese tracking companion: [`delivery-manifest-2.0.0-candidate.zh-CN.md`](delivery-manifest-2.0.0-candidate.zh-CN.md).

## 1. Closed top-level shape

`execution.delivery-manifest@2.0.0` retains exact Delivery/Task identity, creation instant, canonical worktree, immutable Task-prompt snapshot, and WSR-owned Delivery configuration projection. Its Workflow/execution binding is:

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

The local materialization path is private recovery data and is excluded from the evidence-safe projection. `resolvedRoles` contains each Agent-action Role exactly once, bytewise sorted by `roleId`, with at most 128 entries. Required capabilities are non-empty, unique, canonically sorted identities.

## 2. Identity

`deliveryBindingIdentity` is `sha256:` plus lowercase SHA-256 over canonical JSON of every top-level field except `schemaVersion` and `deliveryBindingIdentity`. It covers Package/Snapshot coordinates, repository document identity, the complete resolved Role descriptor/model map, prompt snapshot, worktree, and Delivery projection.

`resolvedMapDigest` covers every resolved Role field, including Provider version, adapter key, descriptor digest, capabilities, and Provider-owned model coordinate. Observation C07 and Evidence `manifest_digest` carry the lowercase 64-hex portion of the full Manifest identity; the evidence-safe projection has a separate projection digest.

## 3. Admission and recovery invariants

- creation follows exact Workflow Package/Snapshot validation, repository Provider-binding parsing, exact registry lookup, and capability validation, and precedes every Runner/Provider effect; `ABSENT` is valid only for a Snapshot with no Agent-action Role;
- every Snapshot Agent-action Role has one resolved entry and every entry names the same Role-prompt identity/digest as the Snapshot;
- repository Provider identity/version must exact-match one registered factory descriptor, and its capabilities must cover the Role's required-capability union;
- no Provider/model default, priority, fallback, or post-admission rebinding exists;
- current-slot persistence binds the same `deliveryBindingIdentity`;
- runtime dispatch and native session create/resume use the exact persisted Role descriptor/model coordinate;
- recovery validates the exact 2.0 shape/digests, Package/Snapshot materialization, Role closure, and exact registered descriptor match before any new Provider/session effect;
- recovery does not reread current Workflow source or repository binding for authority, and current registry composition cannot substitute a different Provider/version/adapter/capability descriptor/model;
- only distinct Providers actually present in `resolvedRoles` receive Delivery-scoped realms; registered unused Providers are not started.

## 4. Privacy split

The full Manifest may contain Execution-private absolute paths needed for recovery. Its evidence-safe projection contains only Delivery/Task identity, full Manifest digest, Package/Snapshot coordinates, repository-document identities, and every exact resolved Role Provider/model field.

Both forms prohibit secrets, credential paths/references, login state, Provider endpoints/native configuration, Workflow source URL/config, prompt/attachment bytes, tool content, native session IDs, and Observation/Evidence receipts. Credentials and session mechanics remain behind the Provider-owned factory/SPI. The portable projection is defined by [`delivery-manifest-projection.md`](../evidence/delivery-manifest-projection.md).

## 5. Compatibility

- 1.x load/recovery remains historical and uses its historical configuration/activation projector.
- 2.0 creation requires Workflow DSL 2.0, Execution config/projection 2.0, and complete repository Role-to-Provider bindings.
- no upgrade-on-load, completion from current config/repository, or reconstruction of 1.x Agent/model data into 2.0 semantics is allowed.
- current-slot version dispatch is exact; ambiguity fails closed.

## 6. Conformance

Fixtures cover deterministic identities; Role order/uniqueness/completeness; mixed Providers; missing binding; unknown/version/capability mismatch; mutation of every resolved field; descriptor and model exact-match on runtime/session/recovery; only-used realm startup; secret/path split; 1.x historical recovery; 2.0 no-reread/no-fallback recovery; and identical evidence-safe projection on retry.
