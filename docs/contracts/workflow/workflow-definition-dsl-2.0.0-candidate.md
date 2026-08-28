# Workflow Definition DSL 2.0.0 — Contract Candidate

> **Status:** Iteration 5 pre-publication candidate, 2026-08-28. This is not a published Contract and does not mutate the historical `agentops.workflow-dsl@1.1.0` release. It becomes authority only after the full machine package, conformance corpus, publication record, and lifecycle gates pass. Chinese tracking companion: [`workflow-definition-dsl-2.0.0-candidate.zh-CN.md`](workflow-definition-dsl-2.0.0-candidate.zh-CN.md).

The versioned upstream composition candidate is [`workflow-composition-model-2.0.0-candidate.md`](../../workflow-composition-model-2.0.0-candidate.md). The unversioned historical composition document remains bound to published 1.x semantics.

## 1. Change classification

Version `2.0.0` removes required Route and resource fields and changes binding authority. It is therefore a MAJOR revision. A `1.1.0` Package remains resolvable under the historical `1.1.0` Contract; it is never silently interpreted as `2.0.0`.

The unchanged graph, dataflow, Action, Artifact, selector, wait, budget, canonicalization, snapshot, validation, and conformance semantics are inherited as normative requirements from `1.1.0` until this candidate is expanded into the standalone publication artifact. The following sections close every changed semantic; an implementation may not infer additional changes.

## 2. Closed authority model

- A **Role** owns stable responsibility, Workflow authority concerns, prohibitions, write custody, independence requirements, and one exact Role-prompt resource.
- A **Route** binds that Role to Action-prompt resources, Skills, tools, Driver, capability requirements, data-access intent, and session policy.
- A Route does not select or declare a model and does not reference a generic Agent definition.
- Repository configuration owns the optional exact Role-to-model-selection map. Execution configuration owns one required global default model selection and one exact installed Agent Provider identity; repository data cannot select another Agent Provider. For DSH, a model selection is the exact `{provider, model}` LLM route/model pair required by DSH's public Agent contract.
- Delivery admission resolves every distinct Agent-action Role in the exact Snapshot as `repository[role] ?? execution.default_model_selection` through the installed Agent Provider's closed selection shape and freezes the result in the Delivery Manifest.
- The Agent Provider owns provider-native endpoint, authentication, credentials, native configuration, and session mechanics. None is a Workflow resource.

An exact Role snapshot is `(workflow_snapshot_digest, role_id, role_prompt_identity, role_prompt_digest)`. Every allowed Route for one Role must reference that same exact Role-prompt identity/digest. An admitted **Agent identity** adds the installed Agent Provider identity and exact LLM provider-route/model identity. An **Agent execution binding** then adds the selected Route's Action prompt, Skills, tools, Driver, access intent, and session policy. Provider-native process/session identity is operational identity, not Agent configuration authority.

## 3. Machine-shape changes from 1.1.0

The `2.0.0` machine schema makes exactly these breaking changes:

1. remove `routes[].agent`;
2. remove `routes[].resources.model`;
3. remove `agent-definition` and `model` from Workflow Package resource kinds;
4. retain the exact Role-prompt binding and require every Role used by an Agent Action to close to one Role prompt;
5. retain Route bindings for Action prompts, Skills, tools, Driver, capabilities, session policy, and data access;
6. set the Contract coordinate to `agentops.workflow-dsl@2.0.0` and reject mixed `1.1.0`/`2.0.0` fields.

A Definition contains at most 128 distinct Roles. This is an admission and portable-Manifest bound, not a metric sample limit. A Package exceeding it is invalid rather than truncated.

The Package index, Definition, Role, Route, and Snapshot digests cover the resulting closed resource graph. No model identifier or repository binding document is part of the Workflow Package digest; those external admitted values are covered by the Delivery Manifest and Delivery-binding digest.

## 4. Instruction and execution projection

Instruction authority remains:

```text
Workflow/Action authority
  > Role prompt
  > Action prompt
  > Skill instructions
  > Artifact/user content
```

Model identity is structured execution data and is never inserted into this instruction chain. A Driver may project a provider-native `agent.md` or equivalent from the admitted Role prompt, but the generated document is not a portable Contract resource and cannot override the structured model binding.

The Runner receives one immutable admitted binding. It may not use a CLI default, current repository configuration, current Workflow source, Route-local model choice, or Provider fallback to replace any Manifest field. Recovery uses the persisted Manifest and exact Workflow Package materialization as binding authority. Current Provider-owned configuration may supply connectivity, credentials, and native mechanics only for the frozen Provider identity; missing or incompatible capability fails recovery and never changes Provider/model identity.

## 5. Admission obligations

Before any Runner, session, tool, model-call, or Workflow workspace mutation effect, admission must complete these steps. Admission-owned reads of the selected Package and canonical-worktree repository policy are allowed; Provider validation is limited to local configured-capability/identity checks and creates no Provider session or network effect:

1. resolve and validate one exact `2.0.0` Workflow Package and Snapshot;
2. read the optional repository Role-to-model-selection document from the canonical worktree;
3. validate its closed revision and content identity;
4. enumerate every distinct Agent-action Role in the Snapshot and prove one exact Role prompt across all of its Routes;
5. resolve every enumerated Role to a non-empty closed model selection in the one installed Agent Provider;
6. validate locally that the supplied capability has the frozen Agent Provider identity and that every LLM route/model coordinate has valid closed syntax, without loading Provider configuration, consulting a model catalog, probing a network, or reading/exposing credentials;
7. persist the Package/Snapshot identities, repository-document state/digest, and complete resolved Role/Provider/model binding map in the Delivery Manifest.

Unknown repository Role keys may exist for other Workflows in the same repository but do not enter this Delivery Manifest. Missing mappings use the one Execution global default. Malformed documents, unknown schema fields, missing/malformed default selections, Agent-Provider capability mismatch, Role/Snapshot conflicts, or digest mismatch fail before Runner effect. DSH permits dynamic models absent from discovery catalogs, so admission must not treat catalog absence as invalid; an unavailable exact route/model returns a typed Provider failure at the first real invocation.

## 6. Observation and historical analysis

Observation records actual execution, not configuration assignment. Model-call Spans carry exact C30 Role, C57 model, provider, Runtime, and Span identity. No model-assignment Event is added.

Historical Role-template analysis follows:

```text
accepted Delivery Manifest
  -> exact Workflow Package/Snapshot content coordinates
  -> observed C30 Role
  -> exact Role prompt/template bytes
```

It never derives the template from a self-reported Event, current checkout, Route name, Agent-definition resource, or timestamp.

## 7. Required publication gates

Publication requires:

- standalone English and Chinese semantic specifications;
- closed JSON schemas and deterministic checker/generator;
- minimal positive Package plus negative fixtures for every removed/mixed field;
- all first-party Packages migrated with reproducible snapshots and digests;
- Execution vendored Contract mirror and exact-version dispatch;
- Delivery Manifest revision and recovery fixtures;
- Observation fixtures proving actual Role/model tuples without a new assignment Event;
- exact-version historical resolution fixtures for every published resolving revision, with focused `1.1.0` no-reinterpretation coverage;
- lifecycle review and publication record.

Until all gates pass, no production configuration may claim `agentops.workflow-dsl@2.0.0` conformance.
