# Delivery Manifest 2.0.0 — Design Candidate

> **Status:** Iteration 5 pre-publication candidate, 2026-08-28. This is the new-Delivery successor to historical `execution.delivery-manifest@1.0.0/1.1.0`; persisted historical manifests remain exact-version readable. Chinese tracking companion: [`delivery-manifest-2.0.0-candidate.zh-CN.md`](delivery-manifest-2.0.0-candidate.zh-CN.md).

## 1. Closed top-level shape

`execution.delivery-manifest@2.0.0` retains the exact Delivery/Task identity, optional Task display name, creation instant, canonical worktree, immutable Task-prompt snapshot, and WSR-owned Delivery configuration projection. It changes the Workflow/execution binding to:

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

The local materialization path is private Execution recovery data and is excluded from the evidence-safe projection. `resolvedRoles` contains every Agent-action Role in the admitted Snapshot exactly once, bytewise sorted by `roleId`, with at most 128 entries. `resolutionSource` is `REPOSITORY` or `EXECUTION_DEFAULT`.

## 2. Identity

`deliveryBindingIdentity` is `sha256:` plus lowercase SHA-256 over canonical JSON of every top-level field except `schemaVersion` and `deliveryBindingIdentity`, following the existing Manifest identity rule. It covers Package/Snapshot coordinates, repository-document state, resolved Role map, prompt snapshot, worktree, and Delivery projection. Any change produces a different identity.

Observation C07 and Evidence `manifest_digest` carry the lowercase 64-hex portion of this identity. The evidence-safe projection repeats that coordinate and has its own projection digest; neither digest substitutes for the other.

## 3. Admission and recovery invariants

- creation occurs after exact Workflow Package/Snapshot validation and repository model-policy parsing, before Runner effect;
- every Snapshot Agent-action Role has one resolved entry and every entry names a Snapshot Role with the same Role-prompt digest;
- every Agent Provider/LLM-route/model coordinate passes closed local shape validation before persistence; admission performs no catalog-membership assumption or Provider network probe;
- current-slot persistence binds the same `deliveryBindingIdentity`;
- recovery validates the exact 2.0 shape/digest, exact Package/Snapshot materialization, and Role closure, then uses only persisted resolved bindings;
- recovery does not read current Workflow source, repository binding document, or Execution default model selection, and does not reconstruct Provider-native configuration from this Manifest;
- current Provider-owned configuration may supply connectivity, credentials, and native mechanics only through the installation-scoped realm factory with the persisted Agent Provider identity; recovery creates a fresh Delivery-scoped realm after Manifest validation, and missing/incompatible factory or realm fails before new model/session effect without substituting another Agent Provider/LLM route/model.

## 4. Privacy split

The full Manifest may contain Execution-private absolute paths required for local recovery. Its evidence-safe subprojection contains only Delivery/Task identity, full Manifest digest, Package/Snapshot content coordinates, repository-document state/content identities, and resolved Role/Agent-Provider/LLM-route/model identities.

Both forms prohibit secret material, credential paths/references, Provider endpoints/native routes, Workflow source config/URL, prompt/attachment bytes, tool arguments/results, native session IDs, and Observation/Evidence receipts. The portable projection is defined separately by [`delivery-manifest-projection.md`](../evidence/delivery-manifest-projection.md).

## 5. Compatibility

- 1.x load/recovery is unchanged and uses its historical configuration/activation projector.
- 2.0 creation requires Workflow DSL 2.0 and Execution config/Delivery projection 2.0.
- no version upgrades on load, no field completion from current config, and no 1.x Agent/model reconstruction into 2.0 semantics are allowed.
- a current slot records the exact Manifest version/identity path or dispatches by the loaded Manifest `schemaVersion`; ambiguity fails closed.

## 6. Conformance

Fixtures cover deterministic identity, role order/uniqueness/completeness, absent/present repository document, fallback-source recording, prompt-vs-Workflow snapshot separation, exact Package/Snapshot digest mismatch, current-slot identity mismatch, secret/path split, 1.x historical recovery, 2.0 no-reread recovery, and identical evidence-safe projection on retry. Focused mutation/round-trip fixtures must prove that changing any `roleId`, `rolePromptIdentity`, `rolePromptDigest`, `agentProviderId`, `modelProviderId`, `modelId`, or `resolutionSource` changes `resolvedMapDigest` and `deliveryBindingIdentity`, and that full Manifest → evidence-safe projection loses none of the seven resolved-role fields. Replacing `roleId` with an identity absent from the Snapshot must additionally fail Role-closure validation.
