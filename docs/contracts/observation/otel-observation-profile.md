<a id="otel-observation-profile"></a>
# OTel Observation Profile

> **DRAFT — NOT A PUBLISHED CONTRACT.** This document is a meaning-preserving authority split from superseded `EE-CONTRACT-DRAFT-001`, plus the post-split `EE-OBSERVATION-A-CLASS-INPUTS-2026-08-20` amendment; provenance remains in Git history. It owns the exact proposed OTel/OTLP wire mapping: pins, carriers, Resource, Scope, schema URL, standard GenAI mapping, the closed EventName set, the closed `agentops.*` registries, the complete Review/Finding shapes, the C17/C27 oracle, and the shape/identity/conflict rules. It does not publish a machine schema, packaged registry, protobuf definition, fixture corpus, implementation, or conformance claim, and it owns no transport interaction flow and no durable storage model.

<a id="otel-profile-1"></a>
## 1. Metadata and Authority

| Field | Value |
| --- | --- |
| Document identity | `observation.identity.002` |
| Status | `DRAFT_NOT_PUBLISHED` |
| Normative language | English |
| Origin | Meaning-preserving authority split from superseded `EE-CONTRACT-DRAFT-001`, plus the post-split `EE-OBSERVATION-A-CLASS-INPUTS-2026-08-20` amendment for C55–C57 and proposed profile `0.3.0`; provenance remains in Git history |
| Profile version | proposed `0.3.0` (adopted proposal, not a release) |
| Semantic authorities | [Concept](../../agent-architecture.md), [Execution Design](../../systems/execution/project-execution-system.md), [Evidence Design](../../systems/evidence/evidence-system.md), and the tech-neutral [Observation Catalog](observation-catalog.md) |
| Transport/interaction companion | [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md) |
| Confirmed direction | `EE-SKELETON`, SHA-256 `73b3481a099983b57ee9e1dd512c6ed23823f0d045085f9ef585db70be13949a` |
| Profile evidence | concept.fixture.002 `PASS` plus rebinding; rebuilt actual rc.6/protobuf assertions are green under the corrected user evidence threshold |
| Translation parity obligation | English/Chinese anchors, headings, tables, IDs, fields, enums and links are paired, per [Concept `concept.acceptance.017`](../../agent-architecture.md) |

This document owns the one editable proposed wire registry, carrier placement, versions, EventNames, and value vocabularies. It cannot change Design-fixed meaning. Future physical-conformance obligations are owned by the [Execution–Evidence Interaction Contract §8](../execution-evidence/interaction-contract.md#interaction-contract-8). The tech-neutral meaning of every fact and field is owned by the [Observation Catalog](observation-catalog.md); when a representation conflicts with that semantics, the Catalog's semantic owner anchors govern. The English System owner anchors govern when a representation conflicts with a System Design.

<a id="otel-profile-2"></a>
## 2. Maturity Model

| Layer | State in this candidate | What is fixed | What may be claimed |
| --- | --- | --- | --- |
| System semantic meaning and owner | fixed in the English Concept/Execution/Evidence Designs and the Observation Catalog | fact meaning, ownership, truth, privacy and lifecycle | Design meaning after promotion |
| Wire profile proposal | adopted normative-as-draft | exact pins, carriers, standard/custom split, ten EventNames, 57 common + 10 Implementation + 6 System Design fields, complete Review/Finding variant composition, relationships, placement, requiredness and exclusions | this exact proposal may be cited only as `DRAFT_NOT_PUBLISHED` |
| Released physical Contract | absent | nothing physical is released | no schema, package or registry publication claim |
| Implementation conformance | unproven | no implementation is certified | no conformance claim until executable validators pass the released physical Contract |

Draft maturity is not permission to re-decide the selected mapping. Conversely, validated proposal evidence is not released physical Contract or production conformance evidence.

<a id="otel-profile-3"></a>
## 3. Fixed / Proposed / Proof Boundary

| Item | Sole semantic owner | Adopted draft representation | Genuine downstream proof |
| --- | --- | --- | --- |
| `observation.contract.001` Delivery binding | [Execution §8](../../systems/execution/project-execution-system.md#ee-execution-8) | one closed immutable Manifest shape | machine schema, limits, digest vectors and binding fixtures |
| `observation.contract.002` identity separation | [Concept §3](../../agent-architecture.md#ee-concept-3) | distinct Delivery/task/Workflow/implementation/Runtime/Trace/event/Role/local-lineage identities | cross-identity negative fixtures |
| `observation.contract.003` result separation | [Execution §10](../../systems/execution/project-execution-system.md#ee-execution-10) | Runtime outcome, `START_FAILED`, administrative disposition and Span Status remain distinct | lifecycle/result validators and mismatch fixtures |
| `observation.contract.004` admission/custody | [Execution §7](../../systems/execution/project-execution-system.md#ee-execution-7) | closed `CONTENDED`, `NEW`, `RECOVERY` meanings without native types | contention/recovery/stale-authority fixtures |
| `observation.contract.005` unresolved state | [Execution §§7–9](../../systems/execution/project-execution-system.md#ee-execution-7) | explicit occupied unresolved state and authorized administrative closure; closure is outside the first Observation wire profile | crash/reconcile/authorization/no-history fixtures |
| `observation.contract.006` Observation non-control/privacy | [Execution §§5,10](../../systems/execution/project-execution-system.md#ee-execution-5) | the pinned, allow-listed, best-effort profile in §§4–9 | production disable/loss/refusal/privacy fixtures |
| `observation.contract.007` carrier | [Execution §5](../../systems/execution/project-execution-system.md#ee-execution-5) | official OTLP/HTTP binary protobuf Trace and Log exporters with exact §4 pins | packaged registry, interoperability and dual-emitter-absence proof |
| `observation.contract.008` atomic admission | [Evidence §§7–10](../../systems/evidence/evidence-system.md#ee-evidence-7) | first-accepted identity plus canonical digest and per-record results | machine validator, concurrency and half-state fixtures |
| `observation.contract.009` completeness | [Evidence §8](../../systems/evidence/evidence-system.md#ee-evidence-8) | exact four-state vocabulary in §8 | final-zero/lower-bound/loss fixtures |
| `observation.contract.010` compatibility | [Evidence §8](../../systems/evidence/evidence-system.md#ee-evidence-8) | explicit semantic/version/kind/unit-or-ISO-currency/source/source-identity coordinates | incompatible-group fixtures |
| `observation.contract.011` lifecycle | [Evidence §8](../../systems/evidence/evidence-system.md#ee-evidence-8) | independent Raw, accepted provenance, Trace and factual-projection lifecycles | retention/default/capacity proof |
| `observation.contract.012` prohibited semantics | [Concept §6](../../agent-architecture.md#ee-concept-6) | closed carriers/registry and §9 exclusions | schema scan and negative fixtures |

<a id="otel-profile-4"></a>
## 4. Adopted Pins, Transport, Resource, and Scope

| Concern | Adopted draft proposal | Evidence boundary |
| --- | --- | --- |
| OTel Specification | `v1.56.0` | concept.fixture.002 exact source/archive generation |
| OTLP/protobuf | `v1.10.0` | official `.proto` decode and partial-success path |
| Semantic conventions | `v1.41.1` | GenAI conventions remain Development; compatibility is limited to this generation |
| Schema URL | `https://opentelemetry.io/schemas/1.41.0` | exact tested scope schema URL |
| Observation Profile | proposed version `0.3.0` | adopted proposal, not a release |
| InstrumentationScope | name `io.agentops.dsh.observation`, version `0.3.0`, schema URL above | required on Trace and Log scopes |
| Factual transport | OTLP/HTTP through official binary protobuf Trace and Log exporters | stock DSH rc.6 OTLP/JSON is disabled and not routed to Evidence |
| Sampling | Delivery-level head sampling; default probability `1` | sampled-out decision LogRecord may carry unsampled Trace context; no durability/completeness claim |

The OTel Resource carries standard `service.name` and `service.version`. Admission records immutable producer Resource, profile, Scope and Workflow-family provenance. Exact DSH rc.6 and Node SDK package versions remain reference-emitter evidence, not portable wire requirements. Fixture `deployment.environment.name` is not part of this profile.

Transport *flow* semantics — endpoints, per-batch partial success reporting, duplicate/conflict/rejected disposition, retry, timeout, and ambiguous-commit convergence — are owned by the [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md), not by this profile. This profile fixes only the physical transport pins above.

<a id="otel-profile-5"></a>
## 5. Standard-first Trace and Log Mapping

| Information | Required carrier / standard fields | Requiredness and meaning |
| --- | --- | --- |
| Sampled Delivery | one Trace; root Span name begins `invoke_workflow`; root kind `INTERNAL` | one Delivery-to-Trace relation; Delivery ID never substitutes for Trace ID |
| Workflow/Agent call | `gen_ai.operation.name=invoke_agent`; `gen_ai.agent.id`; conditional `gen_ai.agent.name` and `gen_ai.agent.version`; `INTERNAL` Span | invocation/Role Trace node; name does not establish identity or lineage |
| Model call | operation `chat` or `generate_content`; `gen_ai.provider.name`; `gen_ai.request.model`; conditional `gen_ai.response.model`; native Span start/end duration; C57 canonical model identity; C30 when model-to-Role attribution is asserted; `CLIENT` Span | model Trace node and direct host-reported operational latency; exact provider/model/Role/Runtime attribution when asserted; no input/output content and no free-form/list summary |
| Tool call | `gen_ai.operation.name=execute_tool`; `gen_ai.tool.name`, `gen_ai.tool.type`, `gen_ai.tool.call.id`; `INTERNAL` Span | tool Trace node; no arguments or results |
| Causality | parent Span ID and Span links | only recorded causality; grouping creates no inferred edge |
| Technical failure | Span Status plus safe low-cardinality `error.type` when available | technical state only; never Delivery outcome |
| Token usage | `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens` on applicable model Span | reported token measurement; absence is `UNAVAILABLE`, never zero |
| Discrete domain fact | OTel LogRecord EventName with TraceId/SpanId/TraceFlags when available | required `agentops.event.id`; body empty/fixed; no generic envelope |
| Root business binding | common registry C01–C08 in §7.1 | query-critical scalar Manifest projection only; no complete Manifest copy |

A sampled Delivery root requires `agentops.delivery.id`, `agentops.workflow.id`, `agentops.workflow.version`, `agentops.implementation.id`, `agentops.runtime.id`, `agentops.manifest.digest`, and `agentops.workflow.family`; `agentops.task.id` is conditional.

<a id="otel-profile-6"></a>
## 6. Exact Closed EventName Set

The proposed profile has exactly these ten EventNames:

1. `delivery.summary`
2. `review.finding`
3. `review.summary`
4. `test.summary`
5. `intervention`
6. `role.lineage`
7. `usage`
8. `sampling.decision`
9. `implementation.summary`
10. `system_design.summary`

Every emitted Event requires `agentops.event.id` and uses Trace context when available. EventName is the typed fact class. `system_design.summary` is the EventName; the family discriminator is `system-design` and its schema value is `system-design@1`. Underscore family discriminators are rejected aliases.

`delivery.disposition` is deliberately not an EventName. Administrative unresolved/abandonment meaning remains Execution-owned and outside the first Observation wire profile.

The tech-neutral meaning, semantic owner, and relationships of each of these ten fact classes are defined in the [Observation Catalog](observation-catalog.md#observation-catalog-3).

<a id="otel-profile-7"></a>
## 7. Exact Closed `agentops.*` Draft Registries

The adopted proposal uses one closed common registry plus two separately closed family registries. The mechanical identity is **57 common + 10 Implementation + 6 System Design = 73 total unique names**. A field name occurs in exactly one registry; a conforming family profile admits the common registry plus its own family registry and rejects the other family registry. `Source` identifies the semantic owner that supplies the scalar; Delivery Observation only maps it. `Privacy` is the profile classification. All strings are logically bounded here; physical character sets, maximum lengths, and cardinality budgets remain publication work. `HC`, `LC`, and `BC` mean high-, low-, and bounded-cardinality classes.

The tech-neutral meaning, identity, applicability, completeness, unit, privacy, relationship, and missingness semantics of the facts these fields carry are owned by the [Observation Catalog](observation-catalog.md#observation-catalog-4). This profile owns only the exact wire mapping of each field.

### 7.1 Closed common registry — 57 fields

| # | Exact field | Carrier / applicability | OTel type | Requiredness | Cardinality / closed values | Source | Privacy | Evidence landing |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| C01 | `agentops.delivery.id` | sampled Delivery root Span | string | required | HC, nonempty identity | Execution Manifest | metadata identity | accepted binding + Trace root |
| C02 | `agentops.task.id` | sampled Delivery root Span | string | conditional | HC, nonempty when present | Execution Manifest | metadata identity | optional grouping coordinate; no causality |
| C03 | `agentops.workflow.id` | sampled Delivery root Span | string | required | BC, nonempty identity | Workflow Contract / Manifest | metadata identity | accepted binding + profile coordinate |
| C04 | `agentops.workflow.version` | sampled Delivery root Span | string | required | BC, nonempty version | Workflow Contract / Manifest | metadata identity | semantic-version coordinate |
| C05 | `agentops.implementation.id` | sampled Delivery root Span | string | required | BC, nonempty identity | Execution Manifest | metadata identity | implementation coordinate |
| C06 | `agentops.runtime.id` | sampled Delivery root Span | string | required | BC, nonempty identity | Execution Manifest | metadata identity | Runtime coordinate |
| C07 | `agentops.manifest.digest` | sampled Delivery root Span | string | required | HC, nonempty digest; physical algorithm/length downstream | Execution Manifest | integrity metadata | accepted provenance/digest binding |
| C08 | `agentops.workflow.family` | sampled Delivery root Span | string | required | LC enum `implementation`, `system-design` | Workflow Contract | classification metadata | family validation coordinate |
| C09 | `agentops.event.id` | every domain Event | string | required | HC, stable nonempty identity | fact owner | metadata identity | first-accepted Event identity/dedup key |
| C10 | `agentops.delivery.outcome` | `delivery.summary` | string | required | LC enum `COMPLETED`, `INCOMPLETE`, `FAILED`, `CANCELLED`, `START_FAILED` | Runtime/Execution result owner | factual status | Delivery factual contribution |
| C11 | `agentops.summary.state` | summary Event; `usage` when usage completeness is asserted | string | required where summary/completeness truth is asserted | LC enum `FINAL`, `LOWER_BOUND`, `NOT_APPLICABLE`, `UNAVAILABLE` | fact owner | factual status | completeness/population coordinate |
| C12 | `agentops.review.id` | `review.finding` / `review.summary` | string | required | HC, nonempty review invocation/result identity | Workflow review owner | metadata identity | review entity coordinate |
| C13 | `agentops.review.lens` | `review.finding` / `review.summary` | string | required | LC enum `GOAL_BLACKBOX`, `IMPLEMENTATION_WHITEBOX`, `ARCHITECTURE`, `PROBLEM_SOLUTION`, `QUALITY_ACCEPTANCE`, `FRESH_READER` | Workflow review owner | factual classification | review-lens compatibility coordinate |
| C14 | `agentops.review.scope` | `review.finding` / `review.summary` | string | required | BC: `GOAL:<goal-id>`, `WHOLE_SCOPE`, or `SYSTEM_DESIGN`; no free text | Workflow review owner | metadata identity | objective review-scope coordinate |
| C15 | `agentops.review.severity` | `review.finding` | string | required | LC enum `BLOCKING`, `MAJOR`, `MINOR` | Workflow review owner | factual classification | Finding distribution coordinate |
| C16 | `agentops.review.total` | `review.summary` | integer | conditional | BC nonnegative integer | Workflow review owner | factual count | review summary contribution |
| C17 | `agentops.review.observed.count` | `review.summary` only | integer | conditional; presence is the complete on-record signal that the review owner reported an observed count, including zero; absence is the complete signal that no observed-count fact was reported; prohibited on ordinary Finding, Fix-on-Finding and Recheck-on-Finding | BC nonnegative integer | Workflow review owner | factual count | present value lands one Review-summary observed-count contribution; absence lands none and never means zero |
| C18 | `agentops.finding.id` | `review.finding` | string | required | HC, nonempty Finding identity | Workflow review owner | metadata identity | Finding entity coordinate |
| C19 | `agentops.finding.status` | `review.finding` | string | required | LC disposition-complete enum `OPEN`, `CLOSED_FIXED`, `CLOSED_NOT_VALID`, `ACCEPTED_MINOR` | source review lens | factual status | Finding status/disposition contribution |
| C20 | `agentops.source.review.id` | `review.finding` | string | required | HC, nonempty source-review identity | Workflow review owner | metadata identity | explicit Finding-to-source-review edge |
| C21 | `agentops.fix.id` | fixed Finding fact | string | conditional; required when a fix is asserted | HC, owner-defined nonempty fix/change identity | fix owner | metadata identity | Fix entity coordinate |
| C22 | `agentops.fix.finding.id` | fixed Finding fact | string | required with C21 | HC, nonempty Finding identity | fix owner | metadata identity | explicit Fix-to-Finding edge |
| C23 | `agentops.recheck.id` | recheck Finding/summary fact | string | conditional; required when recheck is asserted | HC, nonempty recheck identity | source review lens | metadata identity | Recheck entity coordinate |
| C24 | `agentops.recheck.review.id` | recheck fact | string | required with C23 | HC, nonempty prior Review identity being rechecked; never inferred from the current record | source review lens | metadata identity | explicit Recheck-to-prior-review-result edge |
| C25 | `agentops.recheck.finding.id` | recheck `review.finding`; `review.summary` only when exactly one Finding is addressed | string | required on Recheck-on-Finding; conditional on Recheck summary and present only when exactly one Finding is addressed | HC, nonempty Finding identity | source review lens | metadata identity | explicit Recheck-to-Finding edge |
| C26 | `agentops.recheck.fix.id` | recheck fact | string | conditional; required when a fix is under recheck | HC, nonempty fix identity | source review lens | metadata identity | explicit Recheck-to-Fix edge |
| C27 | `agentops.iteration.id` | Recheck summary and Recheck-on-Finding only | string | required on every Recheck summary and Recheck-on-Finding; prohibited on ordinary Review summary, ordinary Finding and Fix-on-Finding | HC, nonempty iteration identity | Workflow owner | metadata identity | objective iteration-to-Recheck edge |
| C28 | `agentops.artifact.id` | test/report/review/family fact | string | conditional; required when an Artifact is referenced | HC, nonempty Artifact identity/reference | Workflow/artifact owner | metadata identity | Artifact relation coordinate |
| C29 | `agentops.artifact.digest` | same Event as C28 | string | required with C28 | HC, nonempty digest; physical algorithm/length downstream | Workflow/artifact owner | integrity metadata | immutable Artifact reference binding |
| C30 | `agentops.role.id` | invocation/fact; every emitted `role.lineage` | string | required on `role.lineage`, otherwise conditional | HC, version-local nonempty Role identity | Workflow Contract owner | metadata identity | local Role coordinate |
| C31 | `agentops.role.lineage.id` | `role.lineage` | string | required with C30 whenever lineage is known/applicable; otherwise emit no `role.lineage` Event | HC, family-scoped nonempty identity; no parsing/name inference | Workflow Contract owner | metadata identity | immutable local-Role-to-lineage mapping |
| C32 | `agentops.parent.role.id` | applicable lineage/relation Event | string | conditional | HC, version-local nonempty Role identity | Workflow Contract owner | metadata identity | relationship endpoint; join via mapping |
| C33 | `agentops.writer.role.id` | review/artifact relation | string | required with C36 | HC, version-local nonempty Role identity | Workflow Contract owner | metadata identity | writer endpoint; join via mapping |
| C34 | `agentops.reviewer.role.id` | review relation | string | required with C37 | HC, version-local nonempty Role identity | Workflow Contract owner | metadata identity | reviewer endpoint; join via mapping |
| C35 | `agentops.recheck.role.id` | recheck relation | string | required with C38 | HC, version-local nonempty Role identity | Workflow Contract owner | metadata identity | recheck endpoint; join via mapping |
| C36 | `agentops.writer.invocation.id` | review/artifact relation | string | conditional; required when writer relation is asserted | HC, nonempty invocation identity | Workflow invocation owner | metadata identity | explicit writer-invocation edge |
| C37 | `agentops.reviewer.invocation.id` | review relation | string | required on review result | HC, nonempty invocation identity | Workflow invocation owner | metadata identity | explicit reviewer-invocation edge |
| C38 | `agentops.recheck.invocation.id` | recheck relation | string | required with C23 | HC, nonempty invocation identity | Workflow invocation owner | metadata identity | explicit recheck-invocation edge |
| C39 | `agentops.intervention.kind` | `intervention` | string | required | LC enum `USER_REDIRECT` for profile `0.3.0` | Workflow control owner | factual classification | intervention contribution |
| C40 | `agentops.observed.loop.count` | family summary | integer | required when applicable summary reports loops | BC nonnegative integer | Workflow owner | factual count | observed-loop contribution; never quality inference |
| C41 | `agentops.observed.intervention.count` | family summary | integer | required when applicable summary reports interventions | BC nonnegative integer | Workflow owner | factual count | observed-intervention contribution |
| C42 | `agentops.usage.kind` | `usage` | string | required | LC enum `native_credit`, `request`, `premium_request`, `provider_native`, `money` | Runtime/provider usage owner | factual classification | native-usage compatibility key |
| C43 | `agentops.usage.unit` | `usage` | string | required | BC exact source-scoped unit ID; `credit`, `request`, `premium_request`, published native unit ID, or ISO-4217 code for `money` | Runtime/provider usage owner | factual unit | native-usage compatibility key |
| C44 | `agentops.usage.source` | `usage` | string | required | LC enum `runtime`, `provider` | Runtime/provider usage owner | provenance | native-usage compatibility key |
| C45 | `agentops.usage.source.id` | `usage` | string | required | BC exact Runtime ID or provider ID; no display-name inference | Runtime/provider usage owner | metadata identity | source-scope compatibility key |
| C46 | `agentops.usage.value` | `usage` | integer | required | BC nonnegative count or provider-reported money in minor units | Runtime/provider usage owner | factual quantity | native-usage contribution |
| C47 | `agentops.sampling.decision` | `sampling.decision` | string | required | LC enum `RECORD_AND_SAMPLE`, `DROP`; aliases rejected | Delivery Observation sampler | factual status | population/availability evidence |
| C48 | `agentops.sampling.probability` | `sampling.decision` | double | required | inclusive `[0,1]` | Delivery Observation sampler | factual quantity | sampling coordinate |
| C49 | `agentops.family.schema` | every family domain Event | string | required | LC enum `implementation@1`, `system-design@1`; must agree with C08 and sibling-family fields are rejected | Workflow Contract owner | classification metadata | family semantic-version/admission coordinate |
| C50 | `agentops.finding.summary` | every `review.finding` | string | required | BC nonempty bounded human-readable factual summary; publication owner fixes a positive maximum and over-limit values reject, never truncate | source review lens | content-minimized factual summary; prohibited-content rules apply | accepted Finding assertion for factual query/display; Evidence does not rewrite or infer |
| C51 | `agentops.finding.scope.id` | every `review.finding` | string | required | HC owner-defined nonempty affected-scope identity; stable across all target records for one Finding scope | source review lens / Workflow owner | metadata identity | Finding-specific scope node; distinct from coarse C14 Review scope |
| C52 | `agentops.finding.target.kind` | every `review.finding` | string | required | LC enum `ARTIFACT`, `SECTION`, `COMPONENT`, `REQUIREMENT` | source review lens / target owner | classification metadata | typed Finding-to-target edge discriminator |
| C53 | `agentops.finding.target.id` | every `review.finding` | string | required | HC bounded nonempty owner-defined target identity; never free text or parsed path | source review lens / target owner | metadata identity | affected target endpoint |
| C54 | `agentops.finding.target.artifact.id` | `review.finding` affected target | string | required for `SECTION`; absent for `ARTIFACT`; conditional for `COMPONENT`/`REQUIREMENT` only when target is artifact-scoped | HC bounded nonempty containing Artifact identity | Artifact/target owner | metadata identity | containing-Artifact endpoint for scoped target; distinct from reviewed Artifact C28 |
| C55 | `agentops.delivery.elapsed_time_ms` | `delivery.summary` | double | conditional; present only when the Runtime/Execution result owner reports a complete start-to-terminal elapsed measurement | BC nonnegative finite milliseconds | Runtime/Execution result owner | factual duration | direct Delivery cycle-time contribution; absence is unavailable, never zero |
| C56 | `agentops.delivery.stage.reached` | `delivery.summary` | string | conditional; present only when the Workflow owner reports the furthest reached stage at terminal outcome | BC bounded nonempty exact Workflow stage identity; no display-name parsing or inferred ordering | Workflow owner | metadata identity | direct Delivery-to-reached-stage fact; absence is unavailable |
| C57 | `agentops.model.id` | model-call Span | string | required when canonical model-to-Role attribution is asserted; C30 is then required on the same Span | BC bounded nonempty provider-scoped canonical model identity; no request/response alias or display-name inference | Runtime/provider model owner | metadata identity | exact model coordinate in `(provider,C57,C30,C06,trace_id,span_id)` attribution tuple |

### 7.2 Closed `implementation@1` registry — 10 fields

| # | Exact field | Carrier / applicability | OTel type | Requiredness | Cardinality / closed values | Source | Privacy | Evidence landing |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| I01 | `agentops.test.passed` | `test.summary` | integer | required | BC nonnegative integer | Implementation test owner | factual count | compatible test-count contribution |
| I02 | `agentops.test.failed` | `test.summary` | integer | required | BC nonnegative integer | Implementation test owner | factual count | compatible test-count contribution |
| I03 | `agentops.test.skipped` | `test.summary` | integer | required | BC nonnegative integer | Implementation test owner | factual count | compatible test-count contribution |
| I04 | `agentops.test.duration.seconds` | `test.summary` | double | conditional; required when owner reports applicable duration | BC nonnegative finite seconds | Implementation test owner | factual duration | compatible test-duration contribution |
| I05 | `agentops.coverage.dimension` | `implementation.summary` structural-coverage fact | string | required | LC enum `line`, `branch`, `function` | structural coverage owner | factual classification | coverage-dimension compatibility key |
| I06 | `agentops.coverage.covered` | same Event as I05 | integer | required | BC nonnegative integer, not greater than I07 | structural coverage owner | factual count | covered contribution |
| I07 | `agentops.coverage.total` | same Event as I05 | integer | required | BC nonnegative integer | structural coverage owner | factual count | coverage denominator contribution |
| I08 | `agentops.coverage.scope` | same Event as I05 | string | required | HC bounded exact repository/package/source-set scope identity; no source body/path list | structural coverage owner | metadata identity | coverage-scope compatibility key |
| I09 | `agentops.coverage.tool.id` | same Event as I05 | string | required | BC bounded exact tool/version identity | structural coverage owner | provenance | coverage-tool compatibility key |
| I10 | `agentops.coverage.format` | same Event as I05 | string | required | BC bounded exact report-format identity | structural coverage owner | provenance | coverage-format compatibility key |

The test/report Artifact reference uses common C28/C29 on `test.summary`; each structural-coverage Event uses C28/C29 for its report Artifact and C11 for completeness. Exactly one I05 dimension is present per coverage Event, so line, branch, and function covered/total pairs remain separate and cannot be combined into a score.

### 7.3 Closed `system-design@1` registry — 6 fields

| # | Exact field | Carrier / applicability | OTel type | Requiredness | Cardinality / closed values | Source | Privacy | Evidence landing |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | `agentops.fresh_reader.result` | `review.summary` with C13=`FRESH_READER` | string | required | LC enum `PASS`, `FINDINGS_REPORTED` | Fresh Reader owner | factual status | Fresh Reader result contribution |
| S02 | `agentops.fresh_reader.finding.count` | same Event as S01 | integer | required | BC nonnegative integer | Fresh Reader owner | factual count | Fresh Reader Finding-count contribution |
| S03 | `agentops.verification.id` | deterministic `system_design.summary` | string | required | HC, nonempty verification-run identity | deterministic verification owner | metadata identity | verification entity coordinate |
| S04 | `agentops.verification.result` | same Event as S03 | string | required | LC enum `PASS`, `FAIL`, `INCONCLUSIVE`, `KNOWN_RED_NO_DELTA` | deterministic verification owner | factual status | verification result contribution |
| S05 | `agentops.verification.check.passed` | same Event as S03 | integer | required | BC nonnegative integer | deterministic verification owner | factual count | passed-check contribution |
| S06 | `agentops.verification.check.failed` | same Event as S03 | integer | required | BC nonnegative integer | deterministic verification owner | factual count | failed-check contribution |

Fresh Reader Findings use common C12–C20 and C28–C38 on typed `review.finding` Events; S01/S02 are only the summary result. System Design review-lens Findings and rechecks use the same common relationship model. No field asserts design quality, reviewer effectiveness, ranking, recommendation, or causal inference.

### 7.4 Complete Review/Finding composition and relationship model

No table below inherits fields from adjacency or prose ordering. The two named bases are exact sets; each variant is the named complete base plus only its listed additions. Unlisted fields reject.

| Named base | EventName | Complete required field set | Conditional fields | Evidence landing |
| --- | --- | --- | --- | --- |
| `REVIEW_SUMMARY_BASE` | `review.summary` | C09, C11, C12, C13, C14, C28+C29, C33+C36, C34+C37, C49 | C16 when a total is reported; C17 presence selects the counted form and absence selects the no-observed-count-fact form; C27 is not part of this base | immutable Review/scope/lens, reviewed Artifact/digest and writer/reviewer Invocation→Role graph |
| `FINDING_BASE` | `review.finding` | C09, C12–C15, C18–C20, C28+C29, C33+C36, C34+C37, C49, C50–C53 | C54 exactly by C52 target-kind rule | accepted human-readable Finding assertion, source Review, reviewed Artifact, Finding-specific scope node and exactly one typed affected-target edge |

For an original Finding, C20 equals C12. For a later Fix or Recheck fact, C12 identifies the current Review result and C20 continues to identify the original source Review. C14 remains the coarse Review scope; C51–C54 are Finding-owned affected scope and never substitute for C14 or C28/C29.

| Permitted complete shape | EventName | Exact composition | Equality/applicability rules | Missing-field behavior and landing |
| --- | --- | --- | --- | --- |
| ordinary Finding | `review.finding` | `FINDING_BASE` | exactly one C52/C53 target; C54 per target-kind rule; C17 and C27 prohibited | any missing base/target field or any C17/C27 rejects with zero assertion/edge/status projection; complete record lands once |
| Fix on Finding | `review.finding` | `FINDING_BASE` + C21+C22 | C22 must equal C18; one complete Fix variant is emitted per affected target context; C17 and C27 prohibited | incomplete/mismatched Fix endpoints or any C17/C27 reject; compatible assertion/edge reuse is a no-op and status/Fix contributions land atomically |
| Recheck on Finding | `review.finding` | `FINDING_BASE` + C23+C24+C25+C27+C35+C38; C26 only when a Fix is under recheck | C24 must equal C20, the original source Review being rechecked; C25 must equal C18; C26 required iff a Fix is under recheck; C27 always required; C17 prohibited | incomplete/mismatched endpoints, absent C27 or present C17 reject; compatible assertion/edge reuse is a no-op and status/Recheck contributions land atomically |
| ordinary Review summary | `review.summary` | `REVIEW_SUMMARY_BASE`; optional C16; C17 present or absent; family summary fields when applicable | no Finding/target/Recheck fields and no C27 admitted; present nonnegative integer C17 is the counted form, absent C17 is the no-observed-count-fact form | missing Review base, present C27, or invalid C17 type/value rejects; otherwise lands Review and present count atomically, or Review alone when C17 is absent |
| Recheck summary | `review.summary` | `REVIEW_SUMMARY_BASE` + C23+C24+C27+C35+C38; C17 present or absent; C25/C26 only when summary concerns exactly one Finding/Fix | C12 is the current Recheck-summary Review; C24 is the distinct prior Review; C27 always required; present nonnegative integer C17 is counted, absent C17 means no count fact; multi-Finding summary omits C25/C26 | missing base/recheck endpoint/C27 or invalid C17 type/value rejects; otherwise lands Recheck summary and present count atomically, or summary alone when C17 is absent |
| Fresh Reader summary | `review.summary` | `REVIEW_SUMMARY_BASE` + S01+S02 | C13=`FRESH_READER`, C49=`system-design@1`; Recheck-summary additions apply when this is a Fresh Reader recheck | complete summary lands as Fresh Reader result/count; individual Findings use `FINDING_BASE` |

The Finding-specific target relation is one edge per complete `review.finding` Event:

| C52 target kind | C53 endpoint | C54 rule | Privacy/content rule | Evidence edge |
| --- | --- | --- | --- | --- |
| `ARTIFACT` | exact affected Artifact identity | absent; C53 itself is the affected Artifact | identity only; no path/body | Finding→affected Artifact |
| `SECTION` | stable section/anchor identity | required containing Artifact identity | identifiers only; no section/source text | Finding→section within Artifact |
| `COMPONENT` | owner-defined component identity | required only when the component is defined within an Artifact; otherwise absent | identifier only; no source/body | Finding→component |
| `REQUIREMENT` | owner-defined requirement identity | required only when the requirement is defined within an Artifact; otherwise absent | identifier only; no requirement body | Finding→requirement |

When one Finding affects multiple targets, the producer emits one complete permitted `review.finding` shape per target with the same C18 Finding ID, C51 scope ID, C50 summary and applicable relationship identity, and a distinct stable C09 Event ID. The target set is order-independent and append-only. Its edge identity is `(C18, C51, C52, C53, C54-or-absent)`: an identical repeat produces no second node, edge or fact; the same edge identity with conflicting accepted base/target content rejects without overwrite. A Fix or Recheck spanning multiple targets emits the corresponding complete variant once per existing target edge; it never collapses target context into C14, C28, display text, an array, map or body.

#### 7.4.1 Closed C17/C27 applicability oracle

The shape, not a free-form phrase such as “when iteration applies,” decides legality. Execution selects one row before emission and Evidence validates the same row before any projection.

| Exact shape | C17 observed count | C27 iteration ID | Positive oracle | Negative oracle |
| --- | --- | --- | --- | --- |
| ordinary Review summary | present nonnegative integer selects counted form; absence selects no-count-fact form | prohibited | C17=`0` and C17>0 each land that exact count; absence lands no count | any C27, non-integer C17 or negative C17→reject; absent C17 is never rejectable as “reported but missing” |
| Recheck summary | same presence/absence selector | required | with C27, C17=`0`, C17>0 and absent C17 are the three valid count states | C27 absent, non-integer C17 or negative C17→reject; absent C17 is never rejectable as “reported but missing” |
| ordinary Finding | prohibited | prohibited | both absent | either present→reject |
| Fix on Finding | prohibited | prohibited | both absent | either present→reject |
| Recheck on Finding | prohibited | required | C17 absent and C27 present | C17 present or C27 absent→reject |

Thus ordinary Review/Finding/Fix records are the legal non-iterated shapes; Recheck summary and Recheck-on-Finding are the legal iterated shapes. There is no wire representation for an “iterated ordinary” shape or a non-iterated Recheck in this profile. C17 omission is the sole normative absence signal: consumers do not reconstruct unavailable producer intent. A present zero is a recorded zero; absence is no observed-count fact and never zero or synthesized `UNAVAILABLE`. Unexpected prohibited fields, invalid present values and missing required fields reject the whole logical record with zero partial projection.

#### 7.4.2 Separate identity and conflict domains

Each identity below is owner supplied and mechanically compared. Arrival order, text, names, task grouping, table adjacency and storage-generated IDs never participate.

C18 is also a first-write namespace guard: once an accepted assertion binds a Finding ID C18 to scope C51, the same C18 with a different C51 is a conflict rather than a second assertion. The assertion identity remains the explicit tuple `(C18,C51)`; this guard prevents cross-target scope drift from escaping comparison by changing one tuple member.

Within one assertion, `(C18,C51,C53)` is a target-endpoint first-write guard: the first accepted edge binds target ID C53 to its C52 kind and C54 containing-Artifact-or-absent context. Reusing that target ID with a different kind or containing-Artifact context is a conflict, not a new edge. A genuinely new target uses a distinct C53 and the full target-edge identity below.

| Domain | Exact identity | Invariant content under that identity | Authoritative owner | Durable landing |
| --- | --- | --- | --- | --- |
| Event record | C09 | canonical digest of the complete accepted logical record | fact owner supplies C09; Admission owns first-write comparison | accepted Event identity/provenance |
| Finding assertion | `(C18,C51)` | C13, C14, C15, C20, C49 and C50; the original ordinary Finding additionally requires C12=C20 and records its C28/C29 plus C33/C36 and C34/C37 as source-review provenance | Workflow/source review lens, Artifact and invocation owners supply fields; Projection owns assertion state | immutable Finding assertion/scope and original source-Review provenance |
| Finding target edge | `(C18,C51,C52,C53,C54-or-absent)` | C52/C53 and target-kind-dependent C54 exactly as the target table requires | source review lens/target/Artifact owners supply fields; Projection owns edge state | one order-independent typed target edge |
| Finding status contribution | `(C18,C51,C12)` | C19 plus current C33/C36 and C34/C37; C12 is the owner-supplied Review result that asserts that status | source review lens supplies C19; Workflow review/invocation owners supply coordinates; Projection owns contributions | append-only recorded status contribution |
| Fix contribution | `(C18,C51,target-edge,C21)` | C22=C18, the complete selected target edge and current C12/C33/C36/C34/C37; these current coordinates do not replace source assertion fields | fix owner supplies C21/C22; Workflow/invocation owners supply current context; Projection owns relation | append-only Fix→Finding relation for one target |
| Recheck contribution | `(C18,C51,target-edge,C23)` | current C12/C33/C36/C34/C37, C24=C20, C25=C18, required C27, C35/C38, and C26 exactly when a Fix is under recheck; when present C26 must equal an accepted C21 for the selected target | source review lens and Workflow iteration/invocation owners supply fields; Projection owns relation | append-only Recheck→prior Review/Finding/(Fix)/iteration relation for one target |

C19 is never part of the immutable Finding assertion. Every complete ordinary Finding, Fix and Recheck record carries C19 because `FINDING_BASE` is complete, but Projection treats it as the separately keyed status contribution above. Repeating that contribution for another target is a no-op because target identity is not part of the status key. The first profile exposes all accepted status contributions and does **not** define or persist one mutable “current Finding status” view; Query may return contributions with their C12/C34/C37 provenance but may not choose a winner, overwrite the source assertion or infer chronology. A current-view selection rule, correction or recomputation authority would reopen Contract Design.

#### 7.4.3 Cross-record invariant, allowed-change and conflict matrix

| Field group | Ordinary Finding establishes | Later target record | Fix/Recheck/later status record | Mismatch outcome |
| --- | --- | --- | --- | --- |
| assertion key C18+C51 | exact shared assertion identity and first binding of C18 to C51 | equal for same assertion; a different C18 is a new assertion, but same C18/different C51 conflicts | equal to referenced assertion | same C18 with changed C51, or same tuple with any invariant mismatch below, conflicts |
| assertion invariants C13/C14/C15/C20/C49/C50 | immutable | must equal exactly across every target | must equal exactly | reject whole record; this includes changed C50, C20 or C51 across targets |
| original/current Review, Artifact and invocation coordinates | original record has C12=C20 and C28/C29+C33/C36+C34/C37 record source provenance | ordinary additional target repeats all these coordinates exactly | lifecycle current C12/C28/C29/C33/C36/C34/C37 may differ; C20 remains original | additional ordinary target mismatch conflicts; owner-supplied lifecycle current-coordinate change is allowed |
| target C52/C53/C54 | selects one exact edge and establishes `(C18,C51,C53)` endpoint binding | distinct C53 with a valid tuple adds one edge in either order; same tuple is reused | must select an accepted compatible edge | same C53 with changed C52/C54 context conflicts; a new edge is valid only under compatible assertion invariants |
| C19 status | creates one status contribution under `(C18,C51,C12)` | same status key/value is no-op | later C12 may create a new contribution; same status key with changed C19 conflicts | never mutate assertion or overwrite a contribution |
| C21/C22 Fix | absent | absent | C21 selects Fix contribution; C22 must equal C18 | new C21 is valid contribution; same identity/incompatible endpoint conflicts |
| C23–C27 Recheck | absent | absent | C23 selects Recheck contribution; C24=C20, C25=C18, C27 required, C26 iff accepted Fix selected | new C23 is valid contribution; endpoint/iteration/role mismatch under same identity conflicts |
| current invocation/role | source C33/C36 and C34/C37 are original provenance | same on ordinary target records | current C12/C33/C36/C34/C37 and recheck C35/C38 may legitimately differ | owner-supplied lifecycle differences are allowed only in their contribution domain |
| Event C09/digest | unique transport record | every target/lifecycle record has its own C09 | every target/lifecycle record has its own C09 | same C09/same digest is complete no-op; same C09/different digest rejects before domain projection |

#### 7.4.4 Admission and atomic effect oracle

Admission validates the entire selected shape, C17/C27 applicability, assertion invariants, target compatibility and lifecycle endpoints before Projection. The following effects commit atomically for one valid record, or none commit:

| Input class | Admission decision | Assertion effect | Target effect | Status/Fix/Recheck effect |
| --- | --- | --- | --- | --- |
| new ordinary Finding/new target | accept | insert assertion once | insert one edge | append initial status once |
| compatible new target for existing assertion | accept | reuse/no-op | insert one edge | status identity already present→no-op |
| compatible Fix on existing target | accept | reuse/no-op | reuse/no-op | append status and Fix exactly once |
| compatible Recheck on existing target | accept | reuse/no-op | reuse/no-op | append status and Recheck exactly once |
| later owner-authorized status under new C12 | accept | reuse/no-op | reuse selected edge/no-op | append one status contribution; no mutable-current overwrite |
| exact C09/digest retry | duplicate/no-op | none | none | none |
| same assertion key with changed invariant, including C50/C20 | conflict/reject | none | none, even if target is new | none |
| same target edge with incompatible target context | conflict/reject | none | none; first edge unchanged | none |
| lifecycle endpoint/applicability mismatch | reject | none | none | none |
| any failure after validation but before commit | rollback | none visible | none visible | none visible |

| Entity or relationship | Identity / typed edge | Required carrier rule | Prohibited substitute | Evidence landing |
| --- | --- | --- | --- | --- |
| Review → scope/lens | C12+C13+C14 | complete named base required | display title, Role name, event order | immutable Review coordinate |
| Finding → source Review | C18+C20 with C15/C19 and required C50 | complete `FINDING_BASE` required | grouping, opaque ID alone or string parsing | human-readable Finding fact keyed to source Review |
| Review → reviewed Artifact | C28+C29 | pair in both named bases | mutable path/body, name-only reference | immutable reviewed Artifact/digest edge |
| Finding → affected target | C51–C54 | exactly one typed target per `FINDING_BASE` | C14, reviewed Artifact alone, text parsing, array/map body | Finding-specific scope node and target edge |
| Writer / reviewer Invocation → local Role | C36+C33 and C37+C34 | both pairs in both named bases | Role position or Agent display name | objective Invocation/Role edges |
| Fix → Finding | C21+C22 | complete Fix variant; C22=C18 | status change alone | immutable Fix/Finding edge with target context |
| Recheck → Review/Finding/Fix/iteration | C23–C27+C38+C35 | exact variant matrix above | chronology, Event adjacency, task grouping | objective Recheck graph with target context where Finding-specific |
| local Role → family lineage | C30+C31 on `role.lineage` | both required when owner-known/applicable; otherwise no Event | name, version, position, compound ID | immutable local-to-lineage mapping |
| Invocation activity | standard Span `(trace_id, span_id)`, `gen_ai.*`, C30 where Role applies | recorded standard Span path | summary count as causality | Trace node/activity duration |

C31 remains `PROPOSED_VALIDATED_BY_SPIKE`: concept.fixture.002 rebuilt actual rc.6/protobuf evidence proved its string/high-cardinality identity behavior and relationship safety. C50–C54 and the complete composition rules are ordinary typed Contract Design under `RR-OTEL-CONTRACT-003`; they reuse the existing string LogRecord attribute class and current bounded-summary/privacy/capacity assumptions. No repeat Spike is required or authorized. None of these rows is published conformance.

### 7.5 Family semantic coverage matrix

This matrix is the mechanical completeness view; the registries and complete shapes above remain the exact attribute authority. Each row names the required field group, semantic owner and accepted/projection landing, so no family fact or edge may fall into an editable body, arbitrary map/list, local extension, Event ordering rule or name-derived join.

| Family fact / relationship | Event or standard carrier | Required field group / identity | Semantic owner | Evidence landing |
| --- | --- | --- | --- | --- |
| Implementation test passed/failed/skipped and applicable duration | `test.summary` | C09, C11, C28+C29, C49=`implementation@1`, I01–I03; I04 when owner reports applicable duration | Implementation test owner; Artifact owner supplies report identity/digest | immutable test/report fact; compatible count/duration contributions |
| line/branch/function structural coverage | one `implementation.summary` per dimension | C09, C11, C28+C29, C49=`implementation@1`, I05–I10 | structural coverage owner; Artifact owner supplies report identity/digest | exact dimension/scope/tool/format/report compatibility group with covered/total pair |
| Review summary identity, lens, scope, Artifact and invocations | `review.summary` | complete `REVIEW_SUMMARY_BASE`; C16/C17 and family additions only when applicable | Workflow review, Artifact and invocation owners | immutable Review→Artifact plus writer/reviewer Invocation→Role graph |
| human-readable Finding, classification, source Review and affected target | `review.finding` | complete `FINDING_BASE`, including C50 summary and one C51–C54 typed target | source review lens, Workflow/Artifact/target owners | accepted Finding assertion, source-review relation, scope node and one target edge |
| Fix relationship | `review.finding` | complete `FINDING_BASE` + C21+C22, repeated once per affected target when multi-target | fix owner; source review lens retains Finding disposition authority | immutable Fix→Finding edge with exact target context |
| Recheck on Finding and iteration | `review.finding` | complete Recheck-on-Finding shape from §7.4 | source review lens and Workflow iteration owner | Recheck graph plus exact Finding target context |
| Recheck summary | `review.summary` | complete Recheck-summary shape from §7.4 | source review lens and Workflow iteration owner | Review-level Recheck summary; per-Finding edges remain separate |
| version-local Role and owner-known family lineage | relationship Event plus `role.lineage` | C30 on Role activity; C30+C31 on each known/applicable lineage Event; C32 only for asserted parent relation | Workflow Contract owner | local Role coordinate plus separate immutable local→lineage mapping |
| observed Role/Agent/model/tool call and duration | standard Span path | native `(trace_id,span_id)`, parent/link, applicable `gen_ai.*`; C57+C30 when canonical model-to-Role attribution is asserted; Runtime C06 from the sampled Delivery binding | Runtime/provider/Workflow activity owners | Trace nodes/edges/durations and exact provider/model/Role/Runtime attribution; no summary-derived causality |
| observed loops and interventions | family summary plus `intervention` | C09, C11, C39–C41, C49=`implementation@1` as applicable | Workflow control owner | observed factual contributions only; no quality/effectiveness inference |
| Delivery outcome, elapsed time, reached stage and native usage | `delivery.summary` and `usage` | C09–C11/C49; conditional C55/C56 on `delivery.summary`; C42–C46 plus C11 on `usage` when completeness is asserted | Runtime/Execution result, Workflow stage and Runtime/provider usage owners | Delivery terminal fact with direct duration/stage contributions and exact source-scoped usage group |
| System Design Review/Finding/Fix/Recheck/Role graph | same complete bases/variants, `role.lineage`, standard Span path | same common shapes with C49=`system-design@1` | System Design Workflow owners and source review lens | same typed graph/content/target/activity landing; no sibling Implementation fields |
| Fresh Reader result and Findings | `review.summary` plus zero or more complete `review.finding` variants | `REVIEW_SUMMARY_BASE`+S01+S02; each Finding/Fix/Recheck uses its complete §7.4 shape with C49=`system-design@1` | Fresh Reader owner; source Fresh Reader recheck owns disposition | Fresh Reader summary plus exact human-readable Finding/source/target/recheck graph |
| deterministic verification result and checks | `system_design.summary` | C09, C11, C28+C29, C49=`system-design@1`, S03–S06 | deterministic verification owner; Artifact owner supplies report identity/digest | verification-run fact with result, passed/failed checks and immutable report reference |
| System Design Delivery outcome, elapsed time, reached stage, native usage, observed activity and family summary | `delivery.summary`, `usage`, standard Spans and `system_design.summary` | same applicable C09–C11, C30, C40–C49, C55–C57, C49=`system-design@1` groups | Runtime/Workflow/activity/usage owners | exact factual contributions under System Design family coordinates |

### 7.6 Positive and negative composition examples

These examples name field IDs to remain independent of physical serialization order.

| Positive case | Complete logical composition | Deterministic result |
| --- | --- | --- |
| ordinary Finding, one target | one `FINDING_BASE`; C52=`SECTION`, C53=`contract-7-4`, C54=`contract-artifact-1`; C17/C27 absent | accept; atomically insert assertion, section edge and initial status contribution |
| same Finding, two orders | two ordinary records share exact assertion invariants and use distinct C09; targets `ARTIFACT:artifact-A` and `REQUIREMENT:req-9` | accept in either order; one assertion, two edges and one status contribution; no order-derived state |
| Finding → Fix → Recheck | ordinary record, then compatible Fix with new C12/current invocation coordinates+C21/C22, then compatible Recheck with new C12/current invocation coordinates+C23–C25+C27+C35+C38 and optional matching C26 | accept each; assertion/edge reuse no-op; append one Fix, one Recheck and each new status exactly once in each record transaction |
| multi-target Fix/Recheck | emit each compatible Fix/Recheck variant once per selected accepted target edge | accept; each target-specific contribution lands once; assertion and existing edges remain unchanged |
| later status | complete compatible lifecycle record uses a new C12/current Invocation/Role coordinates and owner-authorized C19 | accept; append `(C18,C51,C12)` status contribution; do not mutate assertion or select current status |
| exact retries | repeat every preceding record with identical C09 and digest | duplicate/no-op; no assertion, edge, status, Fix or Recheck effect repeats |
| C17 ordinary summary | three distinct records: C17=`0`, C17=`7`, or C17 absent; C27 absent | accept all; land count `0`, count `7`, or no observed-count contribution respectively |
| C17/C27 Recheck summary | each record carries C27 and uses C17=`0`, C17=`3`, or C17 absent | accept all; land Recheck plus count `0`, count `3`, or no observed-count contribution respectively |
| C17/C27 Finding family | ordinary Finding and Fix omit both; Recheck-on-Finding omits C17 and carries C27 | each exact shape accepts |
| exact summary retries | retry every valid ordinary/Recheck C17 form with identical C09/digest | complete no-op; no duplicate Review, Recheck or observed-count contribution |
| Delivery elapsed/stage facts | one terminal `delivery.summary` carries C55=`812.5` and C56=`review`; both values are owner-reported | accept; land one direct elapsed-time contribution and one exact reached-stage identity for the Delivery |
| canonical model-to-Role attribution | one model-call Span carries standard provider/request model fields plus C57 and C30, under a sampled Delivery root with C06 | accept; land one exact `(provider,C57,C30,C06,trace_id,span_id)` attribution tuple; evaluation may aggregate the tuple but may not invent a summary body |

| Negative case | Violation | Admission result |
| --- | --- | --- |
| missing Review base | C28/C29 or an Invocation/Role endpoint absent from a Review summary | reject whole record; no Review or edge projection |
| missing Finding base | C50, C51, C52 or C53 absent | reject whole record; no Finding/content/scope projection |
| assertion summary conflict | same `(C18,C51)` carries changed C50 on a distinct target | conflict/reject; no new edge/status; first assertion remains unchanged |
| assertion source/scope conflict | same C18 carries changed C51, or same `(C18,C51)` carries changed C20/another invariant | conflict/reject; never create a second scope for that Finding, merge assertions or partially add target |
| target-context conflict | same target-edge identity has incompatible C52/C54 applicability or containing Artifact context | conflict/reject; first edge and assertion unchanged |
| mismatched lifecycle endpoint | Fix/Recheck has mismatched C22/C24/C25/C26, selected target, current/recheck Invocation/Role, or C27 under an existing contribution identity | reject whole record; no status/Fix/Recheck or other partial effect |
| missing relationship endpoint | C21 without C22, C23 without required C24/C25/C27/C35/C38, or C52=`SECTION` without C54 | reject whole record; no partial edge or contribution |
| C17/C27 applicability | C17 on any Finding shape; C27 on ordinary summary/Finding/Fix; absent C27 on Recheck; or C17 present with non-integer/negative value | reject whole record; zero accepted Review/count/lifecycle projection; absent summary C17 is a valid no-count form |
| Event conflict | same C09 with a different canonical accepted-content digest | conflict/reject before domain projection; first accepted effects remain unchanged |
| partial landing attempt | any assertion/edge/status/Fix/Recheck insert fails before commit | roll back Event acceptance and every effect; readers see all or none |
| empty/unbounded Finding content | C50 empty, over physical bounded maximum, or producer marks it unbounded | reject; never truncate or move content into body |
| prohibited content | C50 contains Prompt/message/source/diff/tool/credential/raw-error body material | producer must redact or omit Observation; Admission rejects detected violation; execution remains unaffected |
| unknown relation/scope type | C52 outside its four-member enum or target encoded by parsing C14/text | reject; no fallback/extension map |
| invalid Delivery A-class field | C55 is negative/non-finite, C56 is empty/unbounded, or either value is encoded in an Event body/map | reject the whole `delivery.summary`; no elapsed/stage contribution or partial Delivery landing |
| incomplete model attribution | C57 is present without C30, lacks standard provider identity, or is inferred from a display/request/response alias | reject the custom attribution; no model-role tuple is projected from partial or inferred coordinates |

<a id="otel-profile-8"></a>
## 8. Usage, Completeness, Sampling, and Truth

Standard GenAI token fields and custom native `usage` Events are distinct measurement families. Token absence is `UNAVAILABLE`; it is not a zero token count. Native usage never substitutes for tokens. Native usage always carries C49 family schema, bounded C42 category, exact source-scoped C43 unit, C44 source class, C45 source identity, and C46 nonnegative value; it also carries C11 when asserting `FINAL`, `LOWER_BOUND`, `NOT_APPLICABLE` or `UNAVAILABLE` completeness. `money` is accepted only when Runtime/provider reports it in minor units with an ISO-4217 currency in C43 and source; Evidence never derives catalog cost.

The four completeness values are the closed C11 vocabulary: `FINAL` proves an applicable final total and permits an explicitly reported zero; `LOWER_BOUND` means detail was observed without a complete applicable summary; `NOT_APPLICABLE` means no value exists for the family/metric; `UNAVAILABLE` means sampling, loss or a missing summary prevents a claim. Missing cost, token, count or activity is always unavailable, never zero. The tech-neutral meaning of completeness and missingness is owned by the [Observation Catalog](observation-catalog.md#observation-catalog-6).

C55 and C56 are independent optional direct facts on a terminal Delivery Summary. Absence of C55 means elapsed time is unavailable, not zero; absence of C56 means reached stage is unavailable, not an initial stage. C57 is an activity coordinate, not a Delivery summary: without the complete standard-provider+C57+C30+C06+Span tuple, model-to-Role attribution is unavailable and must not be reconstructed from names, parentage or a free-form/list summary.

The five examples below share Scope profile `0.3.0`, C49=`implementation@1`, C11=`FINAL`, and distinct stable C09 Event IDs; those coordinates are part of each logical record even though the table focuses on the usage-specific fields.

| Example | Exact logical fields | Compatible grouping result |
| --- | --- | --- |
| Runtime credit | kind `native_credit`; unit `credit`; source `runtime`; source ID `dsh-rc6`; value `12` | aggregates only with the same coordinates |
| provider request | kind `request`; unit `request`; source `provider`; source ID `provider-a`; value `4` | separate from credits and every other provider |
| premium request | kind `premium_request`; unit `premium_request`; source `provider`; source ID `provider-a`; value `2` | never relabeled or summed with ordinary requests |
| another provider-native unit | kind `provider_native`; unit `cache_write`; source `provider`; source ID `provider-a`; value `7` | exact published unit remains its own group |
| reported money | kind `money`; unit `USD`; source `provider`; source ID `provider-a`; value `125` minor units | no catalog estimate and no cross-currency sum |

Changing kind, C43 unit/ISO currency, source, source ID, profile/family semantic version, or completeness state makes a different group. No implicit conversion or cross-unit summation is permitted.

Delivery-level head sampling is the only first profile sampling mode. A `DROP` Event may carry unsampled Trace context and does not imply that no execution occurred. Best-effort export, partial success, refusal, timeout or tail loss never changes the Runtime outcome and never produces a durability or complete-delivery claim. The transport behavior of partial success, refusal, timeout and tail loss is owned by the [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md).

<a id="otel-profile-9"></a>
## 9. Privacy, Prohibited Content, and Fixture Exclusions

The producer allow-list/redaction boundary and Admission both prohibit:

- Prompt and system-instruction bodies;
- model messages or input/output content;
- tool, MCP and Skill argument/result bodies;
- source files, source-input bodies, full diffs and complete Artifact bodies;
- credentials, secrets and tokens;
- exception messages, stacks and raw error bodies;
- complete Manifest copies;
- Runtime Session, checkpoint, native state or configuration bodies;
- arbitrary maps, extension envelopes and editable LogRecord bodies;
- scores, grades, rankings, recommendations and inferred causality; and
- replay, recompute or correction authority, plus use of Span Status as Delivery outcome.

C50 is the sole human-readable Finding scalar. It is a bounded nonempty paraphrase authored by the source review lens, not a copied body. It may state the factual issue and impact in privacy-safe terms, but it does not relax any prohibition above. Evidence stores and displays the accepted scalar verbatim as a reported fact; it does not generate, grade, summarize, reinterpret or infer it. C51–C54 and C56–C57 are bounded identifiers only and cannot carry paths, source text, requirement bodies, arbitrary labels or model content; C55 is a bounded duration scalar only.

The following fixture-only or unaccepted material is outside the registry: `agentops.phase.kind`, `agentops.duplicate.copy`, `agentops.invalid.reason`, `agentops.iteration`, `agentops.agent.outcome`, `agentops.workflow.stop_reason`, fixture `deployment.environment.name`, `workflow.log`, fixed fixture body text, `delivery.disposition`, and `agentops.delivery.disposition`. No fixture occurrence is publication authority.

The tech-neutral meaning of privacy for each fact class is owned by the [Observation Catalog](observation-catalog.md#observation-catalog-6).

<a id="otel-profile-10"></a>
## 10. Identity, Versioning, and Compatibility

Delivery, task, Workflow, Workflow stage, implementation, Runtime, canonical model, Manifest, Trace, Span, Event, Review, Finding, Finding scope, affected target/edge, Artifact, Fix, Recheck, Invocation, iteration, version-local Role and family-scoped Role-lineage identities remain distinct. Span identity is exactly `(trace_id, span_id)`; `span_id` alone is not globally sufficient and Trace ID alone does not identify a Span. Event identity remains `agentops.event.id`. Model-to-Role attribution is exactly `(provider,C57,C30,C06,trace_id,span_id)` and is never inferred from names, aliases, ancestry alone or task grouping. Review/Finding composition and relationships follow §7.4 complete shapes and typed edges rather than entity-name reuse. A `role.lineage` Event is emitted only when the owner supplies a known/applicable lineage; C30 and C31 are then both required. Unknown/not-applicable lineage emits no lineage Event and does not synthesize a value. Names, display text, ordering and versions never establish identity, scope, target or lineage.

Manifest, lifecycle/result, Observation Profile, each Workflow-family schema and factual semantics are explicitly versioned. Accepted history is not rewritten. Compatibility is declared against exact profile/family/semantic coordinates, never inferred from matching names or field spelling. Transport-level version compatibility and compatibility failure handling are owned by the [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md#interaction-contract-7).

<a id="otel-profile-11"></a>
## 11. Profile Acceptance and Handoff

This profile is acceptable for affected review only when:

- its exact pins, standard mapping, ten EventNames and 57 common + 10 Implementation + 6 System Design registry names pass mechanical count and total-unique checks (57 + 10 + 6 = 73 total unique names);
- every common/family registry row contains exactly nine Markdown columns: row ID, field, carrier, type, requiredness, cardinality/value rule, source, privacy and Evidence landing;
- fixture-only/prohibited fields are absent from the registry and `delivery.disposition` remains outside the wire profile;
- the local/lineage pair rule is unambiguous; and
- every complete Review/Finding/Fix/Recheck shape passes the closed C17/C27 oracle and the positive/negative sequences in §7.6, including order-independent multi-target behavior, cross-target assertion conflicts, compatible assertion/edge reuse, separately keyed status/Fix/Recheck append, Event conflict and all-or-none landing;
- every confirmed family fact and objective relationship resolves to one Event/standard-or-custom field/source/privacy/landing, usage examples remain incompatible where required, and Span duplicate/conflict examples obey `(trace_id, span_id)`;
- `DRAFT_NOT_PUBLISHED`, absent physical publication and unproven conformance remain unmistakable.

No current prototype, Spike result, legacy artifact or draft byte stream may claim released physical Contract or implementation conformance. Downstream publication and conformance obligations are owned by the [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md#interaction-contract-8).
