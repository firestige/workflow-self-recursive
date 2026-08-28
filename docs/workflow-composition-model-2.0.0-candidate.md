# Workflow Composition Model 2.0.0 — Candidate

> **Status:** Iteration 5 pre-publication candidate, 2026-08-28. The unversioned [`workflow-composition-model.md`](workflow-composition-model.md) remains the historical upstream human authority for published Workflow DSL 1.0/1.1. This candidate is not linked from those immutable publication records and becomes the active composition model only with Workflow DSL 2.0 publication. Chinese companion: [`workflow-composition-model-2.0.0-candidate.zh-CN.md`](workflow-composition-model-2.0.0-candidate.zh-CN.md).

## 1. Delta scope

All Workflow graph, Action, Artifact, transition, selector, wait, budget, authority-order, Snapshot, and validation semantics remain those of published DSL 1.1 unless this document explicitly changes them. In particular, semantic branching continues to use the Runtime-internal Planner/classifier defined by DSL 1.1; this candidate does not introduce a Planner Action, Planner Role, Planner prompt, or a new transition authority.

The only composition rebaseline is the Agent/model boundary:

- Role owns stable responsibility, authority, prohibitions, write custody, independence, and one exact Role prompt.
- Route binds a Role to Action prompts, Skills, tools, Driver, capabilities, access intent, and session policy.
- Workflow Package does not contain a generic Agent-definition resource or a model resource.
- Repository policy optionally maps exact Role IDs to exact model selections; for DSH each selection is `{provider, model}`, where `provider` is a registered DSH LLM route and `model` is exact within that route. Missing mappings use the Execution installation default selection.
- Execution freezes the resolved Role/Provider/model bindings together with the exact Workflow Snapshot in the Delivery Manifest.
- Agent Provider owns endpoint/routing, authentication, credentials, native configuration, and native session mechanics.

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

The deterministic admitted Role set is every distinct Role referenced by an Agent Action in the exact Snapshot, whether or not a dynamic Route is later selected. Runtime-only deterministic Actions have no Role entry. For each admitted Role, every allowed Route must reference the same exact Role-prompt identity and content digest. A mismatch is an invalid Package.

An exact Role snapshot is:

```text
(workflow_snapshot_digest, role_id, role_prompt_identity, role_prompt_digest)
```

An admitted Agent identity is that Role snapshot plus the one installed Agent Provider identity and the resolved exact LLM provider-route/model identity. Selecting a Route creates an Agent execution binding by adding its Action prompt, Skills, tools, Driver, access, capabilities, and session policy. Provider-native session/process IDs remain operational identities, not Agent configuration authority.

## 3. Provider boundary and recovery

Execution selects and freezes exactly one Agent Provider identity per installation and Delivery. Repository configuration cannot select another Agent Provider. The model selection may name an LLM provider route within that Agent Provider because the DSH call contract requires the pair; naming a route does not configure it.

The Provider is configured and created by its own product boundary. For DSH, a DSH profile/composition boots an installation-scoped DSH-owned bridge/realm factory and owns LLM routes/endpoints, credentials, settings/environment lookup, and native service composition. After Manifest persistence, Runner requests one isolated Delivery-scoped DSH-E realm from that factory and supplies only the admitted exact `{provider, model}` selection. The DSH factory owns realm construction; Runner owns the Delivery lifecycle lease and disposal. Execution does not boot that profile, read DSH files, construct an LLM adapter, lease credential material, or share the Intake DSH-I realm. Merely using a DSH parser inside an Execution-owned credential loader does not satisfy this boundary.

Recovery separates authority from connectivity:

- the persisted Manifest remains sole authority for Workflow Snapshot, Role, Provider identity, and model identity;
- current Provider-owned configuration may supply connectivity, credentials, and native mechanics for that frozen Provider identity;
- current repository policy, Execution default model selection, Workflow source aliases, CLI defaults, or Provider fallbacks cannot rebind the Delivery;
- missing/incompatible Provider capability fails recovery explicitly before a new model/session effect.

## 4. Package organization

The target resource catalog contains Role prompts, Action prompts, Skills, tools, Drivers, templates, schemas, validators, and conformance assets. It contains neither generic Agent-definition nor model resources. A Driver may project a provider-native `agent.md` from the admitted Role prompt, but that generated document is not portable authority and does not carry the structured model binding.

The repository Role→model-selection document is not a Workflow Package asset and is not included in the Package/Snapshot digest. Its exact admitted state and the resolved binding set are covered by the Delivery binding identity.

## 5. Version boundary

Published Workflow DSL 1.0/1.1 Packages keep their original Agent-definition/model semantics and exact-version dispatch. New DSL 2.0 Packages use only this candidate model after publication. No loader may complete a 1.x Package with repository bindings or accept removed 1.x fields in a 2.0 Package.
