# Execution Configuration 2.0.0 — Design Candidate

> **Status:** Iteration 5 pre-publication candidate, 2026-08-28. This is a MAJOR successor to historical `execution.config@1.0.0` and `execution.delivery-config@1.0.0`; it does not rewrite those persisted bytes. Chinese tracking companion: [`execution-configuration-2.0.0-candidate.zh-CN.md`](execution-configuration-2.0.0-candidate.zh-CN.md).

## 1. Ownership correction

WSR configures Workflow selection, Role-to-model policy, and WSR execution controls. The Agent Provider owns provider-native endpoint/routing, authentication, credentials, credential stores/references, transport policy, and native session configuration.

Consequently `paths.credentialStorePath`, `runner.provider.key`, `runner.provider.baseUrl`, and `runner.provider.credentialRef` are removed from `execution.config@2.0.0`. They are not renamed or copied into a new WSR section. The historical `runner.provider.route` becomes the LLM-provider coordinate inside an exact model selection: it references an already registered DSH route but does not configure that route. A Provider realm factory is configured and created through its own product boundary, then supplied to Execution as an installation-scoped capability. For DSH, a DSH profile/composition boots the bridge/factory and owns routes/endpoints, credentials, settings/environment lookup, and native service composition. Only after a Manifest is persisted does Runner request one separate Delivery-scoped DSH-E realm from that factory. The DSH factory owns realm construction; the Runner's Delivery lease owns use and bounded disposal. Execution does not call the DSH profile loader, parse DSH settings or credentials, construct an LLM adapter, or share the Intake DSH-I realm. Calling a DSH parser from an Execution-owned loader is not sufficient. WSR never resolves or serializes Provider secrets.

## 2. Closed changed shape

Unchanged WSR paths, observation settings, controls, intake bounds, Runner implementation, and Host fields retain their previous meanings. The changed portion is:

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
    "provider": {
      "identity": "provider.dsh",
      "defaultModel": {
        "provider": "deepseek-official",
        "model": "deepseek-v4-flash"
      },
      "maxParallelToolCalls": 4
    }
  }
}
```

Rules:

- `workflowSource` is required and contains exactly one `github` or one previously qualified explicit adapter configuration; a request cannot select it and there is no source fallback list in Execution;
- `runner.provider.identity` must equal the identity declared by the one supplied installation-scoped Agent Provider realm factory and is written into every admitted Role binding; there is no Execution-owned Provider factory registry, key, priority, or fallback in 2.0;
- `defaultModel` is the required closed model selection `{provider, model}` used for absent repository Role mappings. Here `provider` is the exact DSH LLM route identity and `model` is that route's exact model identity; neither field configures an endpoint, adapter, or credential;
- repository overrides live only at `<canonical-worktree>/.wsr/model-bindings.json`, not in installation config;
- no WSR config field accepts a secret, token, API key, credential path/reference, Provider endpoint, LLM-route configuration, or native session setting;
- unknown fields and mixed 1.0/2.0 shapes fail before Delivery admission.

## 3. Delivery projection 2.0

`execution.delivery-config@2.0.0` contains only WSR-owned recovery inputs:

- canonical repository/workspace scope and relative Runner state resources;
- Runner implementation and Host engine;
- stable Provider identity and WSR-owned parallelism/capability bounds;
- Delivery-affecting WSR control bounds.

It excludes the installation default model selection because the full resolved Role→Agent-Provider/LLM-route/model map is frozen separately in `execution.delivery-manifest@2.0.0`. It also excludes Workflow source configuration, repository binding paths, all Provider-native configuration, and every secret/reference.

The Runner factory receives the persisted Manifest execution binding plus the installation-scoped realm factory supplied by the DSH-owned composition bridge. It requests exactly one isolated DSH-E realm for that Delivery after Manifest persistence. Current Provider-owned configuration supplies operational connectivity/credentials for the frozen Agent Provider and LLM-route identities; it is not binding authority. Recovery requests a fresh Delivery-scoped realm through the same exact factory identity, then supplies only the persisted selections. The Runner closes its realm lease during Delivery teardown. It must not boot a DSH profile, reconstruct Provider configuration from the Manifest, accept a factory/realm with another identity, share DSH-I state, or fall back to a current CLI/model default.

## 4. Compatibility and migration

- Existing `execution.config@1.0.0`, Delivery Manifest 1.x, and their recovery paths remain historical and exact-version dispatched.
- New Workflow DSL 2.0 Deliveries require Execution config 2.0, Delivery config projection 2.0, and Delivery Manifest 2.0.
- A 1.0 configuration is never automatically promoted by copying its credential fields. The operator configures the DSH profile outside WSR, the DSH composition supplies the installation-scoped realm factory, and the operator explicitly writes a 2.0 WSR config.
- A persisted 1.x Delivery recovers through its historical adapter path; it is never rebound through repository Role policy.
- A new 2.0 Delivery cannot use a historical Manifest/config projection.

## 5. Conformance

Required tests cover missing required Workflow source, malformed/empty default model selection, Agent-Provider/LLM-route/model identity grammar, unknown/mixed fields, all removed key/credential/endpoint fields, absent/present repository map behavior, DSH-owned realm-factory injection without Execution profile/settings/credential loading, one isolated realm per Delivery, teardown disposal, recovery factory-identity check, Manifest secret scan, recovery version dispatch, and proof that changing current Provider/repository configuration does not rebind an admitted Delivery.
