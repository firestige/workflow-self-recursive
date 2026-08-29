# Execution Configuration 2.0.0 — Design Candidate

> **Status:** Iteration 6 pre-publication candidate, 2026-08-29. This is a MAJOR successor to historical `execution.config@1.0.0` and `execution.delivery-config@1.0.0`; it does not rewrite those persisted bytes. Chinese tracking companion: [`execution-configuration-2.0.0-candidate.zh-CN.md`](execution-configuration-2.0.0-candidate.zh-CN.md).

## 1. Ownership correction

WSR configures Workflow selection and WSR execution controls. A repository selects the exact Agent Provider identity/version and Provider-owned model coordinate for every Agent-action Role. The Agent Provider owns endpoints/routing, authentication, credentials/login state, transport, native sessions, and model connectivity.

`execution.config@2.0.0` therefore has no Provider identity/key, default model, priority/fallback list, endpoint, credential/reference/store, native adapter selector, or session settings. Historical 1.0 fields such as `paths.credentialStorePath`, `runner.provider.key`, `runner.provider.route`, `runner.provider.modelId`, `runner.provider.baseUrl`, and `runner.provider.credentialRef` are removed, not renamed.

Installation composition, outside the serialized WSR config, supplies one closed `AgentProviderFactoryRegistry` populated with owner factories. Each factory declares an exact immutable descriptor: `identity`, semantic `version`, `adapterKey`, canonical sorted `capabilities`, and the corresponding descriptor digest. The registry provides exact lookup only; it contains no default, priority, fallback, or ambient discovery.

## 2. Closed changed shape

Unchanged WSR paths, Workflow source, Observation settings, controls, Intake bounds, Runner implementation, and Host fields retain their semantics. The changed Runner portion is:

```json
{
  "schemaVersion": "execution.config@2.0.0",
  "paths": {
    "repositoryRoot": "/repo",
    "workspaceRoot": "/workspaces",
    "allowedWorktreeRoots": ["/repo"]
  },
  "workflowSource": {
    "kind": "github",
    "repository": "firestige/workflow-package",
    "releasesBaseUrl": "https://api.github.com/repos/firestige/workflow-package/releases",
    "assetPattern": "workflow-package-{name}-{version}.tar.gz"
  },
  "runner": {
    "implementationKey": "runner.v2",
    "host": {"engine": "langgraph"},
    "maxParallelToolCalls": 4
  }
}
```

Rules:

- `workflowSource` selects exactly one qualified source; request data cannot select it and no source fallback list exists;
- `runner` carries only WSR-owned Runner/Host controls and accepts no `provider` section;
- Role selection lives only in required `<canonical-worktree>/.wsr/role-provider-bindings.json`;
- credentials, tokens, login state, Provider endpoints/routes/configuration, adapter choice, and native session settings are prohibited;
- unknown fields and mixed 1.0/2.0 shapes fail before Delivery admission.

## 3. Delivery projection, composition, and recovery

`execution.delivery-config@2.0.0` contains only WSR-owned recovery inputs: canonical repository/workspace scope and relative Runner state resources; Runner implementation and Host engine; WSR-owned parallelism/capability bounds; and Delivery-affecting WSR controls. It contains no Provider selection or Provider-native data.

Admission resolves each repository Role binding through the supplied registry, validates exact version and capability compatibility, and freezes the resulting Provider descriptor plus model coordinate in `execution.delivery-manifest@2.0.0`. Manifest persistence precedes Provider effect.

Runner then asks the registry only for factories named by the persisted Manifest and starts one Delivery-scoped realm per distinct actually used Provider. Registered but unused Providers do not start. The owner factory constructs its native realm; Runner owns the bounded lease/disposal and rolls back already acquired realms if a later acquisition fails.

Runtime dispatch, native session create/resume, and recovery select by the exact persisted Role binding. Recovery exact-matches Provider identity, version, adapter key, descriptor digest, and capabilities against the registered descriptor before any new Provider/session effect, then preserves the persisted model coordinate unchanged; the registry is not a model catalog. It never rereads repository policy for authority, applies current defaults, changes a Role binding, or falls back. Provider credentials/login state remain behind the owner factory and never cross the WSR SPI.

## 4. Compatibility and migration

- Existing `execution.config@1.0.0`, Delivery Manifest 1.x, and their activation/recovery paths remain historical and exact-version dispatched.
- New Workflow DSL 2.0 Deliveries require Execution config/projection 2.0, repository Role-to-Provider bindings, and Delivery Manifest 2.0.
- A 1.0 configuration is never promoted by copying Provider or credential fields. Operators compose the desired owner factories externally and write a provider-free 2.0 WSR config.
- A persisted 1.x Delivery recovers through its historical adapter path; it is not reconstructed or rebound under 2.0 semantics.

## 5. Conformance

Required checks cover rejected Provider/default/credential/endpoint keys; missing/unknown/version-mismatched/capability-incompatible Role bindings; duplicate/conflicting registry entries; mixed-Provider admission; exact Manifest/Observation freezing; only-used realm startup; partial-start rollback and lease disposal; runtime/session/recovery exact matching; no current-config/repository rebinding; no fallback; and secret-free WSR configuration, Manifest, Observation, and Provider SPI values.
