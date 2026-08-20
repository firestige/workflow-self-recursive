<a id="otel-observation-profile"></a>
# OTel Observation Profile（中文翻译）

> **DRAFT——不是已发布 CONTRACT。** 本文件是已被取代的 `EE-CONTRACT-DRAFT-001` 的 meaning-preserving authority split，加 post-split `EE-OBSERVATION-A-CLASS-INPUTS-2026-08-20` amendment；出处保留在 Git 历史中。它拥有 exact proposed OTel/OTLP wire mapping：pin、carrier、Resource、Scope、schema URL、standard GenAI mapping、closed EventName set、closed `agentops.*` registry、complete Review/Finding shape、C17/C27 oracle，以及 shape/identity/conflict rule。它不发布 machine schema、packaged registry、protobuf definition、fixture corpus、implementation 或 conformance claim，也不拥有任何 transport interaction flow 与 durable storage model。

<a id="otel-profile-1"></a>
## 1. 元数据与权威性

| 字段 | 值 |
| --- | --- |
| 文档身份 | `observation.identity.002` |
| 状态 | `DRAFT_NOT_PUBLISHED` |
| 规范语言 | 英文 |
| 来源 | 已被取代的 `EE-CONTRACT-DRAFT-001` 的 meaning-preserving authority split，加 C55–C57 与 proposed profile `0.3.0` 的 post-split `EE-OBSERVATION-A-CLASS-INPUTS-2026-08-20` amendment；出处保留在 Git 历史中 |
| Profile version | proposed `0.3.0`（已采纳提案，不是 release） |
| 语义权威 | [Concept](../../agent-architecture.md)、[Execution Design](../../systems/execution/project-execution-system.md)、[Evidence Design](../../systems/evidence/evidence-system.md)，以及 tech-neutral [Observation Catalog](observation-catalog.md) |
| Transport/interaction companion | [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md) |
| 已确认方向 | `EE-SKELETON`，SHA-256 `73b3481a099983b57ee9e1dd512c6ed23823f0d045085f9ef585db70be13949a` |
| Profile evidence | concept.fixture.002 `PASS` 加 rebinding；在用户修正后的 evidence threshold 下，重建的 actual rc.6/protobuf assertion 全部 green |
| 翻译一致性义务 | English/Chinese anchors、headings、tables、IDs、fields、enums 与 links 保持成对，依据 [Concept `concept.acceptance.017`](../../agent-architecture.md) |

本文件拥有唯一可编辑的 proposed wire registry、carrier placement、version、EventName 与 value vocabulary。它不能改变 Design-fixed meaning。Future physical-conformance obligation 由 [Execution–Evidence Interaction Contract §8](../execution-evidence/interaction-contract.md#interaction-contract-8) 拥有。每个 fact 与 field 的 tech-neutral meaning 由 [Observation Catalog](observation-catalog.md) 拥有；当 representation 与这些 semantics 冲突时，以 Catalog 的 semantic owner anchor 为准。当 representation 与某个 System Design 冲突时，以 English System owner anchor 为准。

<a id="otel-profile-2"></a>
## 2. 成熟度模型

| 层次 | 本候选中的状态 | 已固定内容 | 当前可声称内容 |
| --- | --- | --- | --- |
| System semantic meaning 与 owner | 固定于 English Concept/Execution/Evidence Design 与 Observation Catalog | fact meaning、ownership、truth、privacy 与 lifecycle | promotion 后的 Design meaning |
| Wire profile proposal | 已采纳的 normative-as-draft | exact pin、carrier、standard/custom split、十个 EventName、57 common + 10 Implementation + 6 System Design field、complete Review/Finding variant composition、relationship、placement、requiredness 与 exclusion | 只能把这些 exact proposal 引用为 `DRAFT_NOT_PUBLISHED` |
| Released physical Contract | 不存在 | 没有发布任何 physical content | 不得声称 schema、package 或 registry 已发布 |
| Implementation conformance | 未证明 | 没有 implementation 获得认证 | executable validator 针对 released physical Contract 通过前不得声称 conformance |

Draft maturity 不是重新决定 selected mapping 的许可。反过来，validated proposal evidence 也不是 released physical Contract 或 production conformance evidence。

<a id="otel-profile-3"></a>
## 3. Fixed / Proposed / Proof 边界

| Item | 唯一 semantic owner | 已采纳 draft representation | 真正的 downstream proof |
| --- | --- | --- | --- |
| `observation.contract.001` Delivery binding | [Execution §8](../../systems/execution/project-execution-system.md#ee-execution-8) | 一个 closed immutable Manifest shape | machine schema、limit、digest vector 与 binding fixture |
| `observation.contract.002` identity separation | [Concept §3](../../agent-architecture.md#ee-concept-3) | Delivery/task/Workflow/implementation/Runtime/Trace/event/Role/local-lineage identity 彼此不同 | cross-identity negative fixture |
| `observation.contract.003` result separation | [Execution §10](../../systems/execution/project-execution-system.md#ee-execution-10) | Runtime outcome、`START_FAILED`、administrative disposition 与 Span Status 保持不同 | lifecycle/result validator 与 mismatch fixture |
| `observation.contract.004` admission/custody | [Execution §7](../../systems/execution/project-execution-system.md#ee-execution-7) | 不含 native type 的 closed `CONTENDED`、`NEW`、`RECOVERY` meaning | contention/recovery/stale-authority fixture |
| `observation.contract.005` unresolved state | [Execution §§7–9](../../systems/execution/project-execution-system.md#ee-execution-7) | 显式 occupied unresolved state 与 authorized administrative closure；closure 不进入首个 Observation wire profile | crash/reconcile/authorization/no-history fixture |
| `observation.contract.006` Observation non-control/privacy | [Execution §§5,10](../../systems/execution/project-execution-system.md#ee-execution-5) | §§4–9 中 pinned、allow-listed、best-effort profile | production disable/loss/refusal/privacy fixture |
| `observation.contract.007` carrier | [Execution §5](../../systems/execution/project-execution-system.md#ee-execution-5) | 使用 §4 exact pin 的 official OTLP/HTTP binary protobuf Trace/Log exporter | packaged registry、interoperability 与 dual-emitter-absence proof |
| `observation.contract.008` atomic admission | [Evidence §§7–10](../../systems/evidence/evidence-system.md#ee-evidence-7) | first-accepted identity 加 canonical digest 与 per-record result | machine validator、concurrency 与 half-state fixture |
| `observation.contract.009` completeness | [Evidence §8](../../systems/evidence/evidence-system.md#ee-evidence-8) | §8 exact four-state vocabulary | final-zero/lower-bound/loss fixture |
| `observation.contract.010` compatibility | [Evidence §8](../../systems/evidence/evidence-system.md#ee-evidence-8) | explicit semantic/version/kind/unit-or-ISO-currency/source/source-identity coordinate | incompatible-group fixture |
| `observation.contract.011` lifecycle | [Evidence §8](../../systems/evidence/evidence-system.md#ee-evidence-8) | 独立 Raw、accepted provenance、Trace 与 factual-projection lifecycle | retention/default/capacity proof |
| `observation.contract.012` prohibited semantics | [Concept §6](../../agent-architecture.md#ee-concept-6) | closed carrier/registry 与 §9 exclusion | schema scan 与 negative fixture |

<a id="otel-profile-4"></a>
## 4. 已采纳 Pin、Transport、Resource 与 Scope

| Concern | 已采纳 draft proposal | Evidence boundary |
| --- | --- | --- |
| OTel Specification | `v1.56.0` | concept.fixture.002 exact source/archive generation |
| OTLP/protobuf | `v1.10.0` | official `.proto` decode 与 partial-success path |
| Semantic conventions | `v1.41.1` | GenAI convention 仍为 Development；compatibility 限于这一 generation |
| Schema URL | `https://opentelemetry.io/schemas/1.41.0` | exact tested scope schema URL |
| Observation Profile | proposed version `0.3.0` | 已采纳 proposal，不是 release |
| InstrumentationScope | name `io.agentops.dsh.observation`、version `0.3.0`、上述 schema URL | Trace 与 Log scope 都必须使用 |
| Factual transport | 通过 official binary protobuf Trace/Log exporter 使用 OTLP/HTTP | stock DSH rc.6 OTLP/JSON 被禁用且不路由到 Evidence |
| Sampling | Delivery-level head sampling；default probability `1` | sampled-out decision LogRecord 可携带 unsampled Trace context；不声称 durability/completeness |

OTel Resource 携带标准 `service.name` 与 `service.version`。Admission 持久化 immutable producer Resource、profile、Scope 与 Workflow-family provenance。Exact DSH rc.6 和 Node SDK package version 仍是 reference-emitter evidence，而不是 portable wire requirement。Fixture `deployment.environment.name` 不属于本 profile。

Transport *flow* semantics——endpoint、per-batch partial success reporting、duplicate/conflict/rejected disposition、retry、timeout 与 ambiguous-commit convergence——由 [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md) 拥有，而非本 profile。本 profile 只固定上方的 physical transport pin。

<a id="otel-profile-5"></a>
## 5. Standard-first Trace 与 Log Mapping

| Information | Required carrier / standard field | Requiredness 与 meaning |
| --- | --- | --- |
| Sampled Delivery | 一个 Trace；root Span name 以 `invoke_workflow` 开始；root kind `INTERNAL` | 一个 Delivery-to-Trace relationship；Delivery ID 绝不替代 Trace ID |
| Workflow/Agent call | `gen_ai.operation.name=invoke_agent`；`gen_ai.agent.id`；conditional `gen_ai.agent.name` 与 `gen_ai.agent.version`；`INTERNAL` Span | invocation/Role Trace node；name 不建立 identity 或 lineage |
| Model call | operation `chat` 或 `generate_content`；`gen_ai.provider.name`；`gen_ai.request.model`；conditional `gen_ai.response.model`；native Span start/end duration；C57 canonical model identity；断言 model-to-Role attribution 时带 C30；`CLIENT` Span | model Trace node 与 direct host-reported operational latency；断言时使用 exact provider/model/Role/Runtime attribution；无 input/output content，也无 free-form/list summary |
| Tool call | `gen_ai.operation.name=execute_tool`；`gen_ai.tool.name`、`gen_ai.tool.type`、`gen_ai.tool.call.id`；`INTERNAL` Span | tool Trace node；无 argument 或 result |
| Causality | parent Span ID 与 Span link | 仅 recorded causality；grouping 不创建 inferred edge |
| Technical failure | Span Status 加可用时的 safe low-cardinality `error.type` | 仅 technical state；绝不是 Delivery outcome |
| Token usage | applicable model Span 上的 `gen_ai.usage.input_tokens`、`gen_ai.usage.output_tokens` | reported token measurement；absence 为 `UNAVAILABLE`，绝不是 zero |
| Discrete domain fact | 可用时带 TraceId/SpanId/TraceFlags 的 OTel LogRecord EventName | required `agentops.event.id`；body empty/fixed；无 generic envelope |
| Root business binding | §7.1 中的 common registry C01–C08 | 仅 query-critical scalar Manifest projection；无 complete Manifest copy |

Sampled Delivery root 要求 `agentops.delivery.id`、`agentops.workflow.id`、`agentops.workflow.version`、`agentops.implementation.id`、`agentops.runtime.id`、`agentops.manifest.digest` 与 `agentops.workflow.family`；`agentops.task.id` 为 conditional。

<a id="otel-profile-6"></a>
## 6. Exact Closed EventName 集合

Proposed profile 恰好有这十个 EventName：

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

每个发出的 Event 都要求 `agentops.event.id`，并在可用时使用 Trace context。EventName 是 typed fact class。`system_design.summary` 是 EventName；family discriminator 是 `system-design`，其 schema value 是 `system-design@1`。Underscore family discriminator 是被拒绝的 alias。

`delivery.disposition` 有意不作为 EventName。Administrative unresolved/abandonment meaning 仍由 Execution 拥有，且不进入首个 Observation wire profile。

这十个 fact class 各自的 tech-neutral meaning、semantic owner 与 relationship 定义于 [Observation Catalog](observation-catalog.md#observation-catalog-3)。

<a id="otel-profile-7"></a>
## 7. Exact Closed `agentops.*` Draft Registries

已采纳提案使用一个 closed common registry 加两个分别 closed 的 family registry。机械 identity 是 **57 common + 10 Implementation + 6 System Design = 73 total unique name**。一个 field name 恰好出现在一个 registry 中；conforming family profile 接纳 common registry 加其自身 family registry，并拒绝另一 family registry。`Source` 标识提供 scalar 的 semantic owner；Delivery Observation 仅映射它。`Privacy` 是 profile classification。此处所有 string 都在逻辑上 bounded；physical character set、maximum length 与 cardinality budget 仍是 publication work。`HC`、`LC` 与 `BC` 分别表示 high-、low- 与 bounded-cardinality class。

这些 field 所携带 fact 的 tech-neutral meaning、identity、applicability、completeness、unit、privacy、relationship 与 missingness semantics 由 [Observation Catalog](observation-catalog.md#observation-catalog-4) 拥有。本 profile 只拥有每个 field 的 exact wire mapping。

§7.1–§7.4 是一份 shared producer/acceptor contract：Execution 只能发射 complete permitted registry/shape composition，Evidence Admission 必须在 projection 前校验同一 composition。任一侧都不得私自 add、omit、reinterpret 或 repair field、identity、relationship 或 conflict rule。

### 7.1 Closed common registry — 57 个字段

| # | Exact field | Carrier / applicability | OTel type | Requiredness | Cardinality / closed values | Source | Privacy | Evidence landing |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| C01 | `agentops.delivery.id` | sampled Delivery root Span | string | required | HC，nonempty identity | Execution Manifest | metadata identity | accepted binding + Trace root |
| C02 | `agentops.task.id` | sampled Delivery root Span | string | conditional | HC，present 时 nonempty | Execution Manifest | metadata identity | optional grouping coordinate；无 causality |
| C03 | `agentops.workflow.id` | sampled Delivery root Span | string | required | BC，nonempty identity | Workflow Contract / Manifest | metadata identity | accepted binding + profile coordinate |
| C04 | `agentops.workflow.version` | sampled Delivery root Span | string | required | BC，nonempty version | Workflow Contract / Manifest | metadata identity | semantic-version coordinate |
| C05 | `agentops.implementation.id` | sampled Delivery root Span | string | required | BC，nonempty identity | Execution Manifest | metadata identity | implementation coordinate |
| C06 | `agentops.runtime.id` | sampled Delivery root Span | string | required | BC，nonempty identity | Execution Manifest | metadata identity | Runtime coordinate |
| C07 | `agentops.manifest.digest` | sampled Delivery root Span | string | required | HC，nonempty digest；physical algorithm/length 下游决定 | Execution Manifest | integrity metadata | accepted provenance/digest binding |
| C08 | `agentops.workflow.family` | sampled Delivery root Span | string | required | LC enum `implementation`、`system-design` | Workflow Contract | classification metadata | family validation coordinate |
| C09 | `agentops.event.id` | 每个 domain Event | string | required | HC，stable nonempty identity | fact owner | metadata identity | first-accepted Event identity/dedup key |
| C10 | `agentops.delivery.outcome` | `delivery.summary` | string | required | LC enum `COMPLETED`、`INCOMPLETE`、`FAILED`、`CANCELLED`、`START_FAILED` | Runtime/Execution result owner | factual status | Delivery factual contribution |
| C11 | `agentops.summary.state` | summary Event；断言 usage completeness 时的 `usage` | string | 断言 summary/completeness truth 时 required | LC enum `FINAL`、`LOWER_BOUND`、`NOT_APPLICABLE`、`UNAVAILABLE` | fact owner | factual status | completeness/population coordinate |
| C12 | `agentops.review.id` | `review.finding` / `review.summary` | string | required | HC，nonempty review invocation/result identity | Workflow review owner | metadata identity | review entity coordinate |
| C13 | `agentops.review.lens` | `review.finding` / `review.summary` | string | required | LC enum `GOAL_BLACKBOX`、`IMPLEMENTATION_WHITEBOX`、`ARCHITECTURE`、`PROBLEM_SOLUTION`、`QUALITY_ACCEPTANCE`、`FRESH_READER` | Workflow review owner | factual classification | review-lens compatibility coordinate |
| C14 | `agentops.review.scope` | `review.finding` / `review.summary` | string | required | BC：`GOAL:<goal-id>`、`WHOLE_SCOPE` 或 `SYSTEM_DESIGN`；无 free text | Workflow review owner | metadata identity | objective review-scope coordinate |
| C15 | `agentops.review.severity` | `review.finding` | string | required | LC enum `BLOCKING`、`MAJOR`、`MINOR` | Workflow review owner | factual classification | Finding distribution coordinate |
| C16 | `agentops.review.total` | `review.summary` | integer | conditional | BC nonnegative integer | Workflow review owner | factual count | review summary contribution |
| C17 | `agentops.review.observed.count` | 仅 `review.summary` | integer | conditional；presence 是 review owner 报告 observed count（包括 zero）的 complete on-record signal；absence 是未报告 observed-count fact 的 complete signal；ordinary Finding、Fix-on-Finding 与 Recheck-on-Finding 上 prohibited | BC nonnegative integer | Workflow review owner | factual count | present value landing 一个 Review-summary observed-count contribution；absence 不 landing 且绝不表示 zero |
| C18 | `agentops.finding.id` | `review.finding` | string | required | HC，nonempty Finding identity | Workflow review owner | metadata identity | Finding entity coordinate |
| C19 | `agentops.finding.status` | `review.finding` | string | required | LC disposition-complete enum `OPEN`、`CLOSED_FIXED`、`CLOSED_NOT_VALID`、`ACCEPTED_MINOR` | source review lens | factual status | Finding status/disposition contribution |
| C20 | `agentops.source.review.id` | `review.finding` | string | required | HC，nonempty source-review identity | Workflow review owner | metadata identity | explicit Finding-to-source-review edge |
| C21 | `agentops.fix.id` | fixed Finding fact | string | conditional；assert fix 时 required | HC，owner-defined nonempty fix/change identity | fix owner | metadata identity | Fix entity coordinate |
| C22 | `agentops.fix.finding.id` | fixed Finding fact | string | 与 C21 一起 required | HC，nonempty Finding identity | fix owner | metadata identity | explicit Fix-to-Finding edge |
| C23 | `agentops.recheck.id` | recheck Finding/summary fact | string | conditional；assert recheck 时 required | HC，nonempty recheck identity | source review lens | metadata identity | Recheck entity coordinate |
| C24 | `agentops.recheck.review.id` | recheck fact | string | 与 C23 一起 required | HC，被 recheck 的 nonempty prior Review identity；绝不从 current record 推断 | source review lens | metadata identity | explicit Recheck-to-prior-review-result edge |
| C25 | `agentops.recheck.finding.id` | recheck `review.finding`；仅在精确涉及一个 Finding 的 `review.summary` 上使用 | string | Recheck-on-Finding 上 required；Recheck summary 上 conditional 且只在精确涉及一个 Finding 时 present | HC，nonempty Finding identity | source review lens | metadata identity | explicit Recheck-to-Finding edge |
| C26 | `agentops.recheck.fix.id` | recheck fact | string | conditional；fix 处于 recheck 时 required | HC，nonempty fix identity | source review lens | metadata identity | explicit Recheck-to-Fix edge |
| C27 | `agentops.iteration.id` | 仅 Recheck summary 与 Recheck-on-Finding | string | 每个 Recheck summary 与 Recheck-on-Finding 上 required；ordinary Review summary、ordinary Finding 与 Fix-on-Finding 上 prohibited | HC，nonempty iteration identity | Workflow owner | metadata identity | objective iteration-to-Recheck edge |
| C28 | `agentops.artifact.id` | test/report/review/family fact | string | conditional；引用 Artifact 时 required | HC，nonempty Artifact identity/reference | Workflow/artifact owner | metadata identity | Artifact relation coordinate |
| C29 | `agentops.artifact.digest` | 与 C28 同一个 Event | string | 与 C28 一起 required | HC，nonempty digest；physical algorithm/length 下游决定 | Workflow/artifact owner | integrity metadata | immutable Artifact reference binding |
| C30 | `agentops.role.id` | invocation/fact；每个 emitted `role.lineage` | string | `role.lineage` 上 required，其他场景 conditional | HC，version-local nonempty Role identity | Workflow Contract owner | metadata identity | local Role coordinate |
| C31 | `agentops.role.lineage.id` | `role.lineage` | string | lineage known/applicable 时与 C30 一起 required；否则不 emit `role.lineage` Event | HC，family-scoped nonempty identity；不得 parsing/name inference | Workflow Contract owner | metadata identity | immutable local-Role-to-lineage mapping |
| C32 | `agentops.parent.role.id` | applicable lineage/relation Event | string | conditional | HC，version-local nonempty Role identity | Workflow Contract owner | metadata identity | relationship endpoint；经 mapping join |
| C33 | `agentops.writer.role.id` | review/artifact relation | string | 与 C36 一起 required | HC，version-local nonempty Role identity | Workflow Contract owner | metadata identity | writer endpoint；经 mapping join |
| C34 | `agentops.reviewer.role.id` | review relation | string | 与 C37 一起 required | HC，version-local nonempty Role identity | Workflow Contract owner | metadata identity | reviewer endpoint；经 mapping join |
| C35 | `agentops.recheck.role.id` | recheck relation | string | 与 C38 一起 required | HC，version-local nonempty Role identity | Workflow Contract owner | metadata identity | recheck endpoint；经 mapping join |
| C36 | `agentops.writer.invocation.id` | review/artifact relation | string | conditional；assert writer relation 时 required | HC，nonempty invocation identity | Workflow invocation owner | metadata identity | explicit writer-invocation edge |
| C37 | `agentops.reviewer.invocation.id` | review relation | string | review result 上 required | HC，nonempty invocation identity | Workflow invocation owner | metadata identity | explicit reviewer-invocation edge |
| C38 | `agentops.recheck.invocation.id` | recheck relation | string | 与 C23 一起 required | HC，nonempty invocation identity | Workflow invocation owner | metadata identity | explicit recheck-invocation edge |
| C39 | `agentops.intervention.kind` | `intervention` | string | required | LC enum `USER_REDIRECT`（profile `0.3.0`） | Workflow control owner | factual classification | intervention contribution |
| C40 | `agentops.observed.loop.count` | family summary | integer | applicable summary 报告 loop 时 required | BC nonnegative integer | Workflow owner | factual count | observed-loop contribution；绝非 quality inference |
| C41 | `agentops.observed.intervention.count` | family summary | integer | applicable summary 报告 intervention 时 required | BC nonnegative integer | Workflow owner | factual count | observed-intervention contribution |
| C42 | `agentops.usage.kind` | `usage` | string | required | LC enum `native_credit`、`request`、`premium_request`、`provider_native`、`money` | Runtime/provider usage owner | factual classification | native-usage compatibility key |
| C43 | `agentops.usage.unit` | `usage` | string | required | BC exact source-scoped unit ID；`credit`、`request`、`premium_request`、published native unit ID，或 `money` 的 ISO-4217 code | Runtime/provider usage owner | factual unit | native-usage compatibility key |
| C44 | `agentops.usage.source` | `usage` | string | required | LC enum `runtime`、`provider` | Runtime/provider usage owner | provenance | native-usage compatibility key |
| C45 | `agentops.usage.source.id` | `usage` | string | required | BC exact Runtime ID 或 provider ID；不得 display-name inference | Runtime/provider usage owner | metadata identity | source-scope compatibility key |
| C46 | `agentops.usage.value` | `usage` | integer | required | BC nonnegative count 或 provider-reported money（minor unit） | Runtime/provider usage owner | factual quantity | native-usage contribution |
| C47 | `agentops.sampling.decision` | `sampling.decision` | string | required | LC enum `RECORD_AND_SAMPLE`、`DROP`；alias 被拒绝 | Delivery Observation sampler | factual status | population/availability evidence |
| C48 | `agentops.sampling.probability` | `sampling.decision` | double | required | inclusive `[0,1]` | Delivery Observation sampler | factual quantity | sampling coordinate |
| C49 | `agentops.family.schema` | 每个 family domain Event | string | required | LC enum `implementation@1`、`system-design@1`；必须与 C08 一致，sibling-family field 被拒绝 | Workflow Contract owner | classification metadata | family semantic-version/admission coordinate |
| C50 | `agentops.finding.summary` | 每个 `review.finding` | string | required | BC nonempty bounded human-readable factual summary；publication owner 固定正 maximum，over-limit value 拒绝且绝不 truncate | source review lens | content-minimized factual summary；适用 prohibited-content rule | accepted Finding assertion，用于 factual query/display；Evidence 不 rewrite 或 infer |
| C51 | `agentops.finding.scope.id` | 每个 `review.finding` | string | required | HC owner-defined nonempty affected-scope identity；在一个 Finding scope 的所有 target record 中 stable | source review lens / Workflow owner | metadata identity | Finding-specific scope node；与 coarse C14 Review scope 不同 |
| C52 | `agentops.finding.target.kind` | 每个 `review.finding` | string | required | LC enum `ARTIFACT`、`SECTION`、`COMPONENT`、`REQUIREMENT` | source review lens / target owner | classification metadata | typed Finding-to-target edge discriminator |
| C53 | `agentops.finding.target.id` | 每个 `review.finding` | string | required | HC bounded nonempty owner-defined target identity；绝非 free text 或 parsed path | source review lens / target owner | metadata identity | affected target endpoint |
| C54 | `agentops.finding.target.artifact.id` | `review.finding` affected target | string | `SECTION` 时 required；`ARTIFACT` 时 absent；`COMPONENT`/`REQUIREMENT` 只在 target 属于 Artifact 时 conditional | HC bounded nonempty containing Artifact identity | Artifact/target owner | metadata identity | scoped target 的 containing-Artifact endpoint；与 reviewed Artifact C28 不同 |
| C55 | `agentops.delivery.elapsed_time_ms` | `delivery.summary` | double | conditional；仅当 Runtime/Execution result owner 报告 complete start-to-terminal elapsed measurement 时 present | BC nonnegative finite millisecond | Runtime/Execution result owner | factual duration | direct Delivery cycle-time contribution；absence 是 unavailable，绝不是 zero |
| C56 | `agentops.delivery.stage.reached` | `delivery.summary` | string | conditional；仅当 Workflow owner 报告 terminal outcome 时 furthest reached stage 时 present | BC bounded nonempty exact Workflow stage identity；不解析 display name 或推断 order | Workflow owner | metadata identity | direct Delivery-to-reached-stage fact；absence 是 unavailable |
| C57 | `agentops.model.id` | model-call Span | string | 断言 canonical model-to-Role attribution 时 required；同一 Span 上此时也要求 C30 | BC bounded nonempty provider-scoped canonical model identity；不得从 request/response alias 或 display name 推断 | Runtime/provider model owner | metadata identity | `(provider,C57,C30,C06,trace_id,span_id)` attribution tuple 中的 exact model coordinate |

### 7.2 Closed `implementation@1` registry — 10 个字段

| # | Exact field | Carrier / applicability | OTel type | Requiredness | Cardinality / closed values | Source | Privacy | Evidence landing |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| I01 | `agentops.test.passed` | `test.summary` | integer | required | BC nonnegative integer | Implementation test owner | factual count | compatible test-count contribution |
| I02 | `agentops.test.failed` | `test.summary` | integer | required | BC nonnegative integer | Implementation test owner | factual count | compatible test-count contribution |
| I03 | `agentops.test.skipped` | `test.summary` | integer | required | BC nonnegative integer | Implementation test owner | factual count | compatible test-count contribution |
| I04 | `agentops.test.duration.seconds` | `test.summary` | double | conditional；owner 报告 applicable duration 时 required | BC nonnegative finite seconds | Implementation test owner | factual duration | compatible test-duration contribution |
| I05 | `agentops.coverage.dimension` | `implementation.summary` structural-coverage fact | string | required | LC enum `line`、`branch`、`function` | structural coverage owner | factual classification | coverage-dimension compatibility key |
| I06 | `agentops.coverage.covered` | 与 I05 同一个 Event | integer | required | BC nonnegative integer，不大于 I07 | structural coverage owner | factual count | covered contribution |
| I07 | `agentops.coverage.total` | 与 I05 同一个 Event | integer | required | BC nonnegative integer | structural coverage owner | factual count | coverage denominator contribution |
| I08 | `agentops.coverage.scope` | 与 I05 同一个 Event | string | required | HC bounded exact repository/package/source-set scope identity；无 source body/path list | structural coverage owner | metadata identity | coverage-scope compatibility key |
| I09 | `agentops.coverage.tool.id` | 与 I05 同一个 Event | string | required | BC bounded exact tool/version identity | structural coverage owner | provenance | coverage-tool compatibility key |
| I10 | `agentops.coverage.format` | 与 I05 同一个 Event | string | required | BC bounded exact report-format identity | structural coverage owner | provenance | coverage-format compatibility key |

Test/report Artifact reference 在 `test.summary` 上使用 common C28/C29；每个 structural-coverage Event 用 C28/C29 表示其 report Artifact，用 C11 表示 completeness。每个 coverage Event 恰好有一个 I05 dimension，因此 line、branch 与 function 的 covered/total pair 保持分离，不能合并为 score。

### 7.3 Closed `system-design@1` registry — 6 个字段

| # | Exact field | Carrier / applicability | OTel type | Requiredness | Cardinality / closed values | Source | Privacy | Evidence landing |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | `agentops.fresh_reader.result` | C13=`FRESH_READER` 的 `review.summary` | string | required | LC enum `PASS`、`FINDINGS_REPORTED` | Fresh Reader owner | factual status | Fresh Reader result contribution |
| S02 | `agentops.fresh_reader.finding.count` | 与 S01 同一个 Event | integer | required | BC nonnegative integer | Fresh Reader owner | factual count | Fresh Reader Finding-count contribution |
| S03 | `agentops.verification.id` | deterministic `system_design.summary` | string | required | HC，nonempty verification-run identity | deterministic verification owner | metadata identity | verification entity coordinate |
| S04 | `agentops.verification.result` | 与 S03 同一个 Event | string | required | LC enum `PASS`、`FAIL`、`INCONCLUSIVE`、`KNOWN_RED_NO_DELTA` | deterministic verification owner | factual status | verification result contribution |
| S05 | `agentops.verification.check.passed` | 与 S03 同一个 Event | integer | required | BC nonnegative integer | deterministic verification owner | factual count | passed-check contribution |
| S06 | `agentops.verification.check.failed` | 与 S03 同一个 Event | integer | required | BC nonnegative integer | deterministic verification owner | factual count | failed-check contribution |

Fresh Reader Finding 在 typed `review.finding` Event 上使用 common C12–C20 与 C28–C38；S01/S02 仅是 summary result。System Design review-lens Finding 与 recheck 使用相同的 common relationship model。没有任何 field 断言 design quality、reviewer effectiveness、ranking、recommendation 或 causal inference。

### 7.4 Complete Review/Finding 组合与关系模型

下方任何表都不从 adjacency 或 prose ordering 继承 field。两个 named base 是 exact set；每个 variant 是 named complete base 加仅其列出的 addition。未列出的 field 被拒绝。

| Named base | EventName | Complete required field set | Conditional fields | Evidence landing |
| --- | --- | --- | --- | --- |
| `REVIEW_SUMMARY_BASE` | `review.summary` | C09、C11、C12、C13、C14、C28+C29、C33+C36、C34+C37、C49 | 报告 total 时 C16；C17 presence 选择 counted form、absence 选择 no-observed-count-fact form；C27 不属于此 base | immutable Review/scope/lens、reviewed Artifact/digest 与 writer/reviewer Invocation→Role graph |
| `FINDING_BASE` | `review.finding` | C09、C12–C15、C18–C20、C28+C29、C33+C36、C34+C37、C49、C50–C53 | C54 严格按 C52 target-kind rule | accepted human-readable Finding assertion、source Review、reviewed Artifact、Finding-specific scope node 与恰好一个 typed affected-target edge |

对于 original Finding，C20 等于 C12。对于后续 Fix 或 Recheck fact，C12 标识 current Review result，C20 继续标识 original source Review。C14 仍是 coarse Review scope；C51–C54 是 Finding-owned affected scope，绝不替代 C14 或 C28/C29。

| Permitted complete shape | EventName | Exact composition | Equality/applicability rule | Missing-field behavior 与 landing |
| --- | --- | --- | --- | --- |
| ordinary Finding | `review.finding` | `FINDING_BASE` | 恰好一个 C52/C53 target；C54 按 target-kind rule；C17 与 C27 prohibited | 缺失任何 base/target field 或出现任何 C17/C27 即拒绝，零 assertion/edge/status projection；complete record landing 一次 |
| Fix on Finding | `review.finding` | `FINDING_BASE` + C21+C22 | C22 必须等于 C18；每个 affected target context 发出一个 complete Fix variant；C17 与 C27 prohibited | incomplete/mismatched Fix endpoint 或任何 C17/C27 拒绝；compatible assertion/edge reuse 是 no-op，status/Fix contribution 原子 landing |
| Recheck on Finding | `review.finding` | `FINDING_BASE` + C23+C24+C25+C27+C35+C38；仅当 Fix 处于 recheck 时 C26 | C24 必须等于 C20，即被 recheck 的 original source Review；C25 必须等于 C18；当且仅当 Fix 处于 recheck 时 C26 required；C27 始终 required；C17 prohibited | incomplete/mismatched endpoint、缺失 C27 或出现 C17 拒绝；compatible assertion/edge reuse 是 no-op，status/Recheck contribution 原子 landing |
| ordinary Review summary | `review.summary` | `REVIEW_SUMMARY_BASE`；optional C16；C17 present 或 absent；applicable 时 family summary field | 不接纳 Finding/target/Recheck field 与 C27；present nonnegative integer C17 是 counted form，absent C17 是 no-observed-count-fact form | 缺失 Review base、出现 C27 或 invalid C17 type/value 拒绝；否则原子 landing Review 与 present count，或 C17 absent 时仅 Review |
| Recheck summary | `review.summary` | `REVIEW_SUMMARY_BASE` + C23+C24+C27+C35+C38；C17 present 或 absent；仅当 summary 恰好涉及一个 Finding/Fix 时 C25/C26 | C12 是 current Recheck-summary Review；C24 是 distinct prior Review；C27 始终 required；present nonnegative integer C17 是 counted，absent C17 表示 no count fact；multi-Finding summary 省略 C25/C26 | 缺失 base/recheck endpoint/C27 或 invalid C17 type/value 拒绝；否则原子 landing Recheck summary 与 present count，或 C17 absent 时仅 summary |
| Fresh Reader summary | `review.summary` | `REVIEW_SUMMARY_BASE` + S01+S02 | C13=`FRESH_READER`、C49=`system-design@1`；Fresh Reader recheck 时适用 Recheck-summary addition | complete summary 作为 Fresh Reader result/count landing；individual Finding 使用 `FINDING_BASE` |

Finding-specific target relation 是每个 complete `review.finding` Event 一条 edge：

| C52 target kind | C53 endpoint | C54 rule | Privacy/content rule | Evidence edge |
| --- | --- | --- | --- | --- |
| `ARTIFACT` | exact affected Artifact identity | absent；C53 本身就是 affected Artifact | 仅 identity；无 path/body | Finding→affected Artifact |
| `SECTION` | stable section/anchor identity | required containing Artifact identity | 仅 identifier；无 section/source text | Finding→Artifact 内的 section |
| `COMPONENT` | owner-defined component identity | 仅当 component 定义在 Artifact 内时 required；否则 absent | 仅 identifier；无 source/body | Finding→component |
| `REQUIREMENT` | owner-defined requirement identity | 仅当 requirement 定义在 Artifact 内时 required；否则 absent | 仅 identifier；无 requirement body | Finding→requirement |

当一个 Finding 影响多个 target 时，producer 为每个 target 发出一个 complete permitted `review.finding` shape：它们共享 C18 Finding ID、C51 scope ID、C50 summary 与适用 relationship identity，并各自使用 distinct stable C09 Event ID。Target set 是 order-independent 且 append-only 的。其 edge identity 是 `(C18, C51, C52, C53, C54-or-absent)`：identical repeat 不产生第二个 node、edge 或 fact；同一 edge identity 携带 conflicting accepted base/target content 时无 overwrite 地拒绝。跨多个 target 的 Fix 或 Recheck 为每个 existing target edge 发出一次对应 complete variant；它绝不把 target context 折叠到 C14、C28、display text、array、map 或 body。

#### 7.4.1 Closed C17/C27 applicability oracle

Shape 决定合法性，绝不使用 “when iteration applies” 这样的 free-form phrase。Execution 在 emission 前选择一行，Evidence 在任何 projection 前校验同一行。

| Exact shape | C17 observed count | C27 iteration ID | Positive oracle | Negative oracle |
| --- | --- | --- | --- | --- |
| ordinary Review summary | present nonnegative integer 选择 counted form；absence 选择 no-count-fact form | prohibited | C17=`0` 与 C17>0 分别 landing exact count；absence 不 landing count | 任何 C27、non-integer C17 或 negative C17→reject；absent C17 绝不能因 “reported but missing” 而 reject |
| Recheck summary | 相同 presence/absence selector | required | 携带 C27 时，C17=`0`、C17>0 与 absent C17 是三个 valid count state | C27 absent、non-integer C17 或 negative C17→reject；absent C17 绝不能因 “reported but missing” 而 reject |
| ordinary Finding | prohibited | prohibited | 两者都 absent | 任一 present→reject |
| Fix on Finding | prohibited | prohibited | 两者都 absent | 任一 present→reject |
| Recheck on Finding | prohibited | required | C17 absent 且 C27 present | C17 present 或 C27 absent→reject |

因此 ordinary Review/Finding/Fix record 是合法 non-iterated shape；Recheck summary 与 Recheck-on-Finding 是合法 iterated shape。本 profile 没有 “iterated ordinary” shape 或 non-iterated Recheck 的 wire representation。C17 omission 是 sole normative absence signal：consumer 不重建 unavailable producer intent。Present zero 是 recorded zero；absence 是 no observed-count fact，绝不是 zero 或 synthesized `UNAVAILABLE`。Unexpected prohibited field、invalid present value 与 missing required field 都拒绝整个 logical record，并产生零 partial projection。

#### 7.4.2 独立的 identity 与 conflict 域

每个 identity 都由 owner 提供并进行 mechanical comparison。Arrival order、text、name、task grouping、table adjacency 与 storage-generated ID 绝不参与。

C18 同时是 first-write namespace guard：一旦 accepted assertion 将 Finding ID C18 绑定到 scope C51，相同 C18 搭配不同 C51 就是 conflict 而非第二个 assertion。Assertion identity 仍是显式 tuple `(C18,C51)`；此 guard 防止 cross-target scope drift 通过改变一个 tuple member 逃过 comparison。

在一个 assertion 内，`(C18,C51,C53)` 是 target-endpoint first-write guard：首个 accepted edge 将 target ID C53 绑定到其 C52 kind 与 C54 containing-Artifact-or-absent context。以不同 kind 或 containing-Artifact context 复用该 target ID 是 conflict，而非新 edge。真正的新 target 使用 distinct C53 与下方完整 target-edge identity。

| Domain | Exact identity | 该 identity 下的 invariant content | Authoritative owner | Durable landing |
| --- | --- | --- | --- | --- |
| Event record | C09 | complete accepted logical record 的 canonical digest | fact owner 提供 C09；Admission 拥有 first-write comparison | accepted Event identity/provenance |
| Finding assertion | `(C18,C51)` | C13、C14、C15、C20、C49 与 C50；original ordinary Finding 还要求 C12=C20，并记录其 C28/C29 加 C33/C36 与 C34/C37 作为 source-review provenance | Workflow/source review lens、Artifact 与 invocation owner 提供 field；Projection 拥有 assertion state | immutable Finding assertion/scope 与 original source-Review provenance |
| Finding target edge | `(C18,C51,C52,C53,C54-or-absent)` | C52/C53 与按 target table 要求的 target-kind-dependent C54 | source review lens/target/Artifact owner 提供 field；Projection 拥有 edge state | 一条 order-independent typed target edge |
| Finding status contribution | `(C18,C51,C12)` | C19 加 current C33/C36 与 C34/C37；C12 是断言该 status 的 owner-supplied Review result | source review lens 提供 C19；Workflow review/invocation owner 提供 coordinate；Projection 拥有 contribution | append-only recorded status contribution |
| Fix contribution | `(C18,C51,target-edge,C21)` | C22=C18、complete selected target edge 与 current C12/C33/C36/C34/C37；这些 current coordinate 不替换 source assertion field | fix owner 提供 C21/C22；Workflow/invocation owner 提供 current context；Projection 拥有 relation | 一个 target 的 append-only Fix→Finding relation |
| Recheck contribution | `(C18,C51,target-edge,C23)` | current C12/C33/C36/C34/C37、C24=C20、C25=C18、required C27、C35/C38，以及仅当 Fix 处于 recheck 时的 C26；present 时 C26 必须等于 selected target 的 accepted C21 | source review lens 与 Workflow iteration/invocation owner 提供 field；Projection 拥有 relation | 一个 target 的 append-only Recheck→prior Review/Finding/(Fix)/iteration relation |

C19 绝不属于 immutable Finding assertion。每个 complete ordinary Finding、Fix 与 Recheck record 因 `FINDING_BASE` complete 而携带 C19，但 Projection 把它视为上方 separately keyed status contribution。为另一个 target 重复该 contribution 是 no-op，因为 target identity 不属于 status key。First profile 暴露全部 accepted status contribution，并且**不**定义或持久化一个 mutable “current Finding status” view；Query 可以返回带 C12/C34/C37 provenance 的 contribution，但不得选择 winner、overwrite source assertion 或 infer chronology。任何 current-view selection、correction 或 recomputation authority 都会 reopen Contract Design。

#### 7.4.3 Cross-record invariant、allowed-change 与 conflict 矩阵

| Field group | Ordinary Finding 建立 | 后续 target record | Fix/Recheck/later status record | Mismatch outcome |
| --- | --- | --- | --- | --- |
| assertion key C18+C51 | exact shared assertion identity 与 C18 到 C51 的 first binding | 同一 assertion 相等；不同 C18 是新 assertion，但相同 C18/不同 C51 是 conflict | 等于所引用的 assertion | 相同 C18 搭配 changed C51，或相同 tuple 携带任何 invariant mismatch，都 conflict |
| assertion invariants C13/C14/C15/C20/C49/C50 | immutable | 跨所有 target 必须 exact equal | 必须 exact equal | 拒绝整个 record；包括跨 target 的 changed C50、C20 或 C51 |
| original/current Review、Artifact 与 invocation coordinate | original record 有 C12=C20，C28/C29+C33/C36+C34/C37 记录 source provenance | ordinary additional target 完全重复所有这些 coordinate | lifecycle current C12/C28/C29/C33/C36/C34/C37 可以不同；C20 保持 original | additional ordinary target mismatch 是 conflict；owner-supplied lifecycle current-coordinate change 被允许 |
| target C52/C53/C54 | 选择一条 exact edge 并建立 `(C18,C51,C53)` endpoint binding | distinct C53 配 valid tuple 以任意顺序添加一条 edge；相同 tuple 被复用 | 必须选择 accepted compatible edge | 相同 C53 搭配 changed C52/C54 context 是 conflict；新 edge 仅在 compatible assertion invariant 下 valid |
| C19 status | 在 `(C18,C51,C12)` 下建立一个 status contribution | 相同 status key/value 是 no-op | later C12 可建立新 contribution；相同 status key 搭配 changed C19 是 conflict | 绝不 mutate assertion 或 overwrite contribution |
| C21/C22 Fix | absent | absent | C21 选择 Fix contribution；C22 必须等于 C18 | 新 C21 是 valid contribution；相同 identity/incompatible endpoint 是 conflict |
| C23–C27 Recheck | absent | absent | C23 选择 Recheck contribution；C24=C20、C25=C18、C27 required、C26 当且仅当 accepted Fix 被选择 | 新 C23 是 valid contribution；相同 identity 下的 endpoint/iteration/role mismatch 是 conflict |
| current invocation/role | source C33/C36 与 C34/C37 是 original provenance | ordinary target record 上相同 | current C12/C33/C36/C34/C37 与 recheck C35/C38 可合法不同 | owner-supplied lifecycle difference 仅在其 contribution domain 内被允许 |
| Event C09/digest | unique transport record | 每个 target/lifecycle record 有自己的 C09 | 每个 target/lifecycle record 有自己的 C09 | 相同 C09/相同 digest 是 complete no-op；相同 C09/不同 digest 在 domain projection 前拒绝 |

#### 7.4.4 Admission 与 atomic effect oracle

Admission 在 Projection 前校验整个 selected shape、C17/C27 applicability、assertion invariant、target compatibility 与 lifecycle endpoint。一个 valid record 的下列 effect 原子提交，或全部不提交：

| Input class | Admission decision | Assertion effect | Target effect | Status/Fix/Recheck effect |
| --- | --- | --- | --- | --- |
| new ordinary Finding/new target | accept | insert assertion 一次 | insert 一条 edge | append initial status 一次 |
| existing assertion 的 compatible new target | accept | reuse/no-op | insert 一条 edge | status identity 已存在→no-op |
| existing target 上的 compatible Fix | accept | reuse/no-op | reuse/no-op | append status 与 Fix 恰好一次 |
| existing target 上的 compatible Recheck | accept | reuse/no-op | reuse/no-op | append status 与 Recheck 恰好一次 |
| 新 C12 下的 later owner-authorized status | accept | reuse/no-op | reuse selected edge/no-op | append 一个 status contribution；无 mutable-current overwrite |
| exact C09/digest retry | duplicate/no-op | none | none | none |
| 相同 assertion key 携带 changed invariant（包括 C50/C20） | conflict/reject | none | none，即使 target 是新 | none |
| 相同 target edge 携带 incompatible target context | conflict/reject | none | none；first edge 不变 | none |
| lifecycle endpoint/applicability mismatch | reject | none | none | none |
| validation 后、commit 前任何失败 | rollback | none visible | none visible | none visible |

| Entity or relationship | Identity / typed edge | Required carrier rule | Prohibited substitute | Evidence landing |
| --- | --- | --- | --- | --- |
| Review → scope/lens | C12+C13+C14 | complete named base required | display title、Role name、event order | immutable Review coordinate |
| Finding → source Review | C18+C20 带 C15/C19 与 required C50 | complete `FINDING_BASE` required | grouping、opaque ID alone 或 string parsing | 以 source Review 为 key 的 human-readable Finding fact |
| Review → reviewed Artifact | C28+C29 | 两个 named base 中都成对出现 | mutable path/body、name-only reference | immutable reviewed Artifact/digest edge |
| Finding → affected target | C51–C54 | 每个 `FINDING_BASE` 恰好一个 typed target | C14、reviewed Artifact alone、text parsing、array/map body | Finding-specific scope node 与 target edge |
| Writer / reviewer Invocation → local Role | C36+C33 与 C37+C34 | 两个 named base 中都成对出现 | Role position 或 Agent display name | objective Invocation/Role edge |
| Fix → Finding | C21+C22 | complete Fix variant；C22=C18 | status change alone | 带 target context 的 immutable Fix/Finding edge |
| Recheck → Review/Finding/Fix/iteration | C23–C27+C38+C35 | 上方 exact variant matrix | chronology、Event adjacency、task grouping | Finding-specific 处带 target context 的 objective Recheck graph |
| local Role → family lineage | `role.lineage` 上的 C30+C31 | owner-known/applicable 时两者都 required；否则无 Event | name、version、position、compound ID | immutable local-to-lineage mapping |
| Invocation activity | standard Span `(trace_id, span_id)`、`gen_ai.*`、Role 适用时 C30 | recorded standard Span path | 把 summary count 当 causality | Trace node/activity duration |

C31 仍为 `PROPOSED_VALIDATED_BY_SPIKE`：concept.fixture.002 重建 actual rc.6/protobuf evidence 证明了其 string/high-cardinality identity behavior 与 relationship safety。C50–C54 与 complete composition rule 是 `RR-OTEL-CONTRACT-003` 下的 ordinary typed Contract Design；它们复用 existing string LogRecord attribute class 与 current bounded-summary/privacy/capacity assumption。不需要也不授权重复 Spike。这些行都不是 published conformance。

### 7.5 Family semantic 覆盖矩阵

本矩阵是 mechanical completeness view；上方的 registry 与 complete shape 仍是 exact attribute authority。每一行命名 required field group、semantic owner 与 accepted/projection landing，因此没有任何 family fact 或 edge 落入 editable body、arbitrary map/list、local extension、Event ordering rule 或 name-derived join。

| Family fact / relationship | Event or standard carrier | Required field group / identity | Semantic owner | Evidence landing |
| --- | --- | --- | --- | --- |
| Implementation test passed/failed/skipped 与 applicable duration | `test.summary` | C09、C11、C28+C29、C49=`implementation@1`、I01–I03；owner 报告 applicable duration 时 I04 | Implementation test owner；Artifact owner 提供 report identity/digest | immutable test/report fact；compatible count/duration contribution |
| line/branch/function structural coverage | 每个 dimension 一个 `implementation.summary` | C09、C11、C28+C29、C49=`implementation@1`、I05–I10 | structural coverage owner；Artifact owner 提供 report identity/digest | 带 covered/total pair 的 exact dimension/scope/tool/format/report compatibility group |
| Review summary identity、lens、scope、Artifact 与 invocation | `review.summary` | complete `REVIEW_SUMMARY_BASE`；applicable 时 C16/C17 与 family addition | Workflow review、Artifact 与 invocation owner | immutable Review→Artifact 加 writer/reviewer Invocation→Role graph |
| human-readable Finding、classification、source Review 与 affected target | `review.finding` | complete `FINDING_BASE`，包括 C50 summary 与一个 C51–C54 typed target | source review lens、Workflow/Artifact/target owner | accepted Finding assertion、source-review relation、scope node 与一条 target edge |
| Fix relationship | `review.finding` | complete `FINDING_BASE` + C21+C22，multi-target 时每个 affected target 重复一次 | fix owner；source review lens 保留 Finding disposition authority | 带 exact target context 的 immutable Fix→Finding edge |
| Recheck on Finding 与 iteration | `review.finding` | §7.4 的 complete Recheck-on-Finding shape | source review lens 与 Workflow iteration owner | Recheck graph 加 exact Finding target context |
| Recheck summary | `review.summary` | §7.4 的 complete Recheck-summary shape | source review lens 与 Workflow iteration owner | Review-level Recheck summary；per-Finding edge 保持分离 |
| version-local Role 与 owner-known family lineage | relationship Event 加 `role.lineage` | Role activity 上 C30；每个 known/applicable lineage Event 上 C30+C31；asserted parent relation 时 C32 | Workflow Contract owner | local Role coordinate 加独立 immutable local→lineage mapping |
| observed Role/Agent/model/tool call 与 duration | standard Span path | native `(trace_id,span_id)`、parent/link、applicable `gen_ai.*`；断言 canonical model-to-Role attribution 时使用 C57+C30；Runtime C06 来自 sampled Delivery binding | Runtime/provider/Workflow activity owner | Trace node/edge/duration 与 exact provider/model/Role/Runtime attribution；无 summary-derived causality |
| observed loops 与 interventions | family summary 加 `intervention` | C09、C11、C39–C41、C49=`implementation@1`（applicable 时） | Workflow control owner | 仅 observed factual contribution；无 quality/effectiveness inference |
| Delivery outcome、elapsed time、reached stage 与 native usage | `delivery.summary` 与 `usage` | C09–C11/C49；`delivery.summary` 上 conditional C55/C56；C42–C46，加断言 completeness 时 `usage` 上的 C11 | Runtime/Execution result、Workflow stage 与 Runtime/provider usage owner | 带 direct duration/stage contribution 的 Delivery terminal fact 与 exact source-scoped usage group |
| System Design Review/Finding/Fix/Recheck/Role graph | 相同 complete base/variant、`role.lineage`、standard Span path | 相同 common shape 配 C49=`system-design@1` | System Design Workflow owner 与 source review lens | 相同 typed graph/content/target/activity landing；无 sibling Implementation field |
| Fresh Reader result 与 Findings | `review.summary` 加零或多个 complete `review.finding` variant | `REVIEW_SUMMARY_BASE`+S01+S02；每个 Finding/Fix/Recheck 使用其 complete §7.4 shape 配 C49=`system-design@1` | Fresh Reader owner；source Fresh Reader recheck 拥有 disposition | Fresh Reader summary 加 exact human-readable Finding/source/target/recheck graph |
| deterministic verification result 与 checks | `system_design.summary` | C09、C11、C28+C29、C49=`system-design@1`、S03–S06 | deterministic verification owner；Artifact owner 提供 report identity/digest | 带 result、passed/failed check 与 immutable report reference 的 verification-run fact |
| System Design Delivery outcome、elapsed time、reached stage、native usage、observed activity 与 family summary | `delivery.summary`、`usage`、standard Span 与 `system_design.summary` | 相同 applicable C09–C11、C30、C40–C49、C55–C57、C49=`system-design@1` group | Runtime/Workflow/activity/usage owner | System Design family coordinate 下的 exact factual contribution |

### 7.6 正向与负向组合示例

这些示例命名 field ID，以保持独立于 physical serialization order。

| Positive case | Complete logical composition | Deterministic result |
| --- | --- | --- |
| ordinary Finding、一个 target | 一个 `FINDING_BASE`；C52=`SECTION`、C53=`contract-7-4`、C54=`contract-artifact-1`；C17/C27 absent | accept；原子 insert assertion、section edge 与 initial status contribution |
| 相同 Finding、两种顺序 | 两个 ordinary record 共享 exact assertion invariant 并使用 distinct C09；target 为 `ARTIFACT:artifact-A` 与 `REQUIREMENT:req-9` | 任意顺序 accept；一个 assertion、两条 edge 与一个 status contribution；无 order-derived state |
| Finding → Fix → Recheck | ordinary record，然后带新 C12/current invocation coordinate+C21/C22 的 compatible Fix，再带新 C12/current invocation coordinate+C23–C25+C27+C35+C38 与 optional matching C26 的 compatible Recheck | 各自 accept；assertion/edge reuse no-op；每个 record transaction 中各 append 一次 Fix、一次 Recheck 与每个新 status |
| multi-target Fix/Recheck | 每个 selected accepted target edge 发出一次每个 compatible Fix/Recheck variant | accept；每个 target-specific contribution landing 一次；assertion 与 existing edge 不变 |
| later status | complete compatible lifecycle record 使用新 C12/current Invocation/Role coordinate 与 owner-authorized C19 | accept；append `(C18,C51,C12)` status contribution；不 mutate assertion 或选择 current status |
| exact retries | 以 identical C09 与 digest 重复每个前述 record | duplicate/no-op；无 assertion、edge、status、Fix 或 Recheck effect 重复 |
| C17 ordinary summary | 三个 distinct record：C17=`0`、C17=`7` 或 C17 absent；C27 absent | 全部 accept；分别 landing count `0`、count `7` 或无 observed-count contribution |
| C17/C27 Recheck summary | 每个 record 携带 C27，并使用 C17=`0`、C17=`3` 或 C17 absent | 全部 accept；分别 landing Recheck 加 count `0`、count `3` 或无 observed-count contribution |
| C17/C27 Finding family | ordinary Finding 与 Fix 省略两者；Recheck-on-Finding 省略 C17 并携带 C27 | 每个 exact shape 都 accept |
| exact summary retries | 以 identical C09/digest 重复每个 valid ordinary/Recheck C17 form | complete no-op；无 duplicate Review、Recheck 或 observed-count contribution |
| Delivery elapsed/stage fact | 一个 terminal `delivery.summary` 携带 C55=`812.5` 与 C56=`review`；两个值均为 owner-reported | accept；为该 Delivery landing 一个 direct elapsed-time contribution 与一个 exact reached-stage identity |
| canonical model-to-Role attribution | 一个 model-call Span 携带 standard provider/request model field 加 C57 与 C30，且位于带 C06 的 sampled Delivery root 下 | accept；landing 一个 exact `(provider,C57,C30,C06,trace_id,span_id)` attribution tuple；evaluation 可聚合该 tuple，但不得编造 summary body |

| Negative case | Violation | Admission result |
| --- | --- | --- |
| missing Review base | Review summary 缺失 C28/C29 或某个 Invocation/Role endpoint | 拒绝整个 record；无 Review 或 edge projection |
| missing Finding base | 缺失 C50、C51、C52 或 C53 | 拒绝整个 record；无 Finding/content/scope projection |
| assertion summary conflict | 相同 `(C18,C51)` 在 distinct target 上携带 changed C50 | conflict/reject；无新 edge/status；first assertion 不变 |
| assertion source/scope conflict | 相同 C18 携带 changed C51，或相同 `(C18,C51)` 携带 changed C20/其他 invariant | conflict/reject；绝不为该 Finding 创建第二个 scope、合并 assertion 或部分添加 target |
| target-context conflict | 相同 target-edge identity 有 incompatible C52/C54 applicability 或 containing Artifact context | conflict/reject；first edge 与 assertion 不变 |
| mismatched lifecycle endpoint | Fix/Recheck 有 mismatched C22/C24/C25/C26、selected target、current/recheck Invocation/Role，或 existing contribution identity 下的 C27 | 拒绝整个 record；无 status/Fix/Recheck 或其他 partial effect |
| missing relationship endpoint | C21 无 C22，C23 无 required C24/C25/C27/C35/C38，或 C52=`SECTION` 无 C54 | 拒绝整个 record；无 partial edge 或 contribution |
| C17/C27 applicability | 任何 Finding shape 上的 C17；ordinary summary/Finding/Fix 上的 C27；Recheck 上缺失 C27；或 C17 present 但值为 non-integer/negative | 拒绝整个 record；零 accepted Review/count/lifecycle projection；absent summary C17 是 valid no-count form |
| Event conflict | 相同 C09 携带不同 canonical accepted-content digest | 在 domain projection 前 conflict/reject；first accepted effect 不变 |
| partial landing attempt | 任何 assertion/edge/status/Fix/Recheck insert 在 commit 前失败 | 回滚 Event acceptance 与每个 effect；reader 看到 all 或 none |
| empty/unbounded Finding content | C50 empty、超过 physical bounded maximum，或 producer 标为 unbounded | 拒绝；绝不 truncate 或把 content 移到 body |
| prohibited content | C50 包含 Prompt/message/source/diff/tool/credential/raw-error body material | producer 必须 redact 或省略 Observation；Admission 拒绝检测到的 violation；execution 不受影响 |
| unknown relation/scope type | C52 不在其四成员 enum 内，或 target 由 parsing C14/text 编码 | 拒绝；无 fallback/extension map |
| invalid Delivery A-class field | C55 为 negative/non-finite、C56 为 empty/unbounded，或任一 value 编码在 Event body/map 中 | 拒绝整个 `delivery.summary`；无 elapsed/stage contribution 或 partial Delivery landing |
| incomplete model attribution | C57 present 但无 C30、缺少 standard provider identity，或从 display/request/response alias 推断 | 拒绝 custom attribution；不从 partial 或 inferred coordinate 投影 model-role tuple |

<a id="otel-profile-8"></a>
## 8. Usage、Completeness、Sampling 与 Truth

Standard GenAI token field 与 custom native `usage` Event 是不同 measurement family。Token absence 为 `UNAVAILABLE`；它不是 zero token count。Native usage 绝不替代 token。Native usage 始终携带 C49 family schema、bounded C42 category、exact source-scoped C43 unit、C44 source class、C45 source identity 与 C46 nonnegative value；当它断言 `FINAL`、`LOWER_BOUND`、`NOT_APPLICABLE` 或 `UNAVAILABLE` completeness 时还要携带 C11。只有 Runtime/provider 实际以 C43 中的 ISO-4217 currency 报告 minor unit 且提供 source 时才接纳 `money`；Evidence 绝不推导 catalog cost。

四个 completeness value 是 closed C11 vocabulary：`FINAL` 证明 applicable final total，并允许 explicitly reported zero；`LOWER_BOUND` 表示观察到 detail，但没有 complete applicable summary；`NOT_APPLICABLE` 表示 family/metric 不存在 value；`UNAVAILABLE` 表示 sampling、loss 或 missing summary 阻止 claim。Missing cost、token、count 或 activity 始终 unavailable，绝不是 zero。Completeness 与 missingness 的 tech-neutral meaning 由 [Observation Catalog](observation-catalog.md#observation-catalog-6) 拥有。

C55 与 C56 是 terminal Delivery Summary 上相互独立的 optional direct fact。C55 absent 表示 elapsed time unavailable，而不是 zero；C56 absent 表示 reached stage unavailable，而不是 initial stage。C57 是 activity coordinate，不是 Delivery summary：缺少 complete standard-provider+C57+C30+C06+Span tuple 时，model-to-Role attribution 为 unavailable，且不得从 name、parentage 或 free-form/list summary 重建。

下方五个示例共享 Scope profile `0.3.0`、C49=`implementation@1`、C11=`FINAL` 与 distinct stable C09 Event ID；这些 coordinate 是每个 logical record 的一部分，尽管表格聚焦 usage-specific field。

| Example | Exact logical fields | Compatible grouping result |
| --- | --- | --- |
| Runtime credit | kind `native_credit`；unit `credit`；source `runtime`；source ID `dsh-rc6`；value `12` | 仅在相同 coordinate 下聚合 |
| provider request | kind `request`；unit `request`；source `provider`；source ID `provider-a`；value `4` | 与 credit 及每个其他 provider 分离 |
| premium request | kind `premium_request`；unit `premium_request`；source `provider`；source ID `provider-a`；value `2` | 绝不 relabel 或与 ordinary request 相加 |
| another provider-native unit | kind `provider_native`；unit `cache_write`；source `provider`；source ID `provider-a`；value `7` | exact published unit 保持自己的 group |
| reported money | kind `money`；unit `USD`；source `provider`；source ID `provider-a`；value `125` minor unit | 无 catalog estimate 且无 cross-currency sum |

改变 kind、C43 unit/ISO currency、source、source ID、profile/family semantic version 或 completeness state 就形成不同 group。不允许 implicit conversion 或 cross-unit summation。

Delivery-level head sampling 是首个 profile 唯一 sampling mode。`DROP` Event 可携带 unsampled Trace context，但不表示没有执行发生。Best-effort export、partial success、refusal、timeout 或 tail loss 绝不改变 Runtime outcome，也不产生 durability 或 complete-delivery claim。Partial success、refusal、timeout 与 tail loss 的 transport behavior 由 [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md) 拥有。

<a id="otel-profile-9"></a>
## 9. Privacy、Prohibited Content 与 Fixture Exclusions

Producer allow-list/redaction boundary 与 Admission 都禁止：

- Prompt 与 system-instruction body；
- model message 或 input/output content；
- tool、MCP 与 Skill argument/result body；
- source file、source-input body、full diff 与 complete Artifact body；
- credential、secret 与 token；
- exception message、stack 与 raw error body；
- complete Manifest copy；
- Runtime Session、checkpoint、native state 或 configuration body；
- arbitrary map、extension envelope 与 editable LogRecord body；
- score、grade、ranking、recommendation 与 inferred causality；以及
- replay、recompute 或 correction authority，以及把 Span Status 用作 Delivery outcome。

C50 是唯一 human-readable Finding scalar。它是由 source review lens 撰写的 bounded nonempty paraphrase，不是 copied body。它可以用 privacy-safe 术语陈述 factual issue 与 impact，但不放宽上方任何禁止。Evidence 把 accepted scalar 作为 reported fact 原样存储并展示；不 generate、grade、summarize、reinterpret 或 infer。C51–C54 与 C56–C57 仅为 bounded identifier，不得携带 path、source text、requirement body、arbitrary label 或 model content；C55 仅为 bounded duration scalar。

以下 fixture-only 或 unaccepted material 不在 registry 内：`agentops.phase.kind`、`agentops.duplicate.copy`、`agentops.invalid.reason`、`agentops.iteration`、`agentops.agent.outcome`、`agentops.workflow.stop_reason`、fixture `deployment.environment.name`、`workflow.log`、fixed fixture body text、`delivery.disposition` 与 `agentops.delivery.disposition`。任何 fixture occurrence 都不是 publication authority。

每个 fact class 的 privacy tech-neutral meaning 由 [Observation Catalog](observation-catalog.md#observation-catalog-6) 拥有。

<a id="otel-profile-10"></a>
## 10. Identity、Versioning 与 Compatibility

Delivery、task、Workflow、Workflow stage、implementation、Runtime、canonical model、Manifest、Trace、Span、Event、Review、Finding、Finding scope、affected target/edge、Artifact、Fix、Recheck、Invocation、iteration、version-local Role 与 family-scoped Role-lineage identity 保持不同。Span identity 恰好是 `(trace_id, span_id)`；`span_id` 单独不全局充分，Trace ID 单独不标识 Span。Event identity 仍是 `agentops.event.id`。Model-to-Role attribution 恰好是 `(provider,C57,C30,C06,trace_id,span_id)`，绝不从 name、alias、仅 ancestry 或 task grouping 推断。Review/Finding composition 与 relationship 遵循 §7.4 complete shape 与 typed edge，而非 entity-name reuse。`role.lineage` Event 仅在 owner 提供 known/applicable lineage 时发出；此时 C30 与 C31 都 required。Unknown/not-applicable lineage 不 emit lineage Event，也不 synthesize value。Name、display text、ordering 与 version 绝不建立 identity、scope、target 或 lineage。

Manifest、lifecycle/result、Observation Profile、每个 Workflow-family schema 与 factual semantics 都 explicit versioned。不 rewrite accepted history。Compatibility 依据 exact profile/family/semantic coordinate 声明，绝不从 matching name 或 field spelling 推断。Transport-level version compatibility 与 compatibility failure handling 由 [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md#interaction-contract-7) 拥有。

<a id="otel-profile-11"></a>
## 11. Profile 验收与移交

本 profile 仅在以下条件满足时才可接受 affected review：

- 其 exact pin、standard mapping、十个 EventName 与 57 common + 10 Implementation + 6 System Design registry name 通过 mechanical count 与 total-unique check（57 + 10 + 6 = 73 total unique name）；
- 每个 common/family registry row 恰好包含九个 Markdown column：row ID、field、carrier、type、requiredness、cardinality/value rule、source、privacy 与 Evidence landing；
- fixture-only/prohibited field 不在 registry 中，且 `delivery.disposition` 仍在 wire profile 之外；
- local/lineage pair rule 无歧义；并且
- 每个 complete Review/Finding/Fix/Recheck shape 都通过 closed C17/C27 oracle 与 §7.6 的 positive/negative sequence，包括 order-independent multi-target behavior、cross-target assertion conflict、compatible assertion/edge reuse、separately keyed status/Fix/Recheck append、Event conflict 与 all-or-none landing；
- 每个 confirmed family fact 与 objective relationship 都 resolve 到一个 Event/standard-or-custom field/source/privacy/landing，usage example 在 required 处保持 incompatible，Span duplicate/conflict example 遵循 `(trace_id, span_id)`；
- `DRAFT_NOT_PUBLISHED`、absent physical publication 与 unproven conformance 保持 unmistakable。

任何 current prototype、Spike result、legacy artifact 或 draft byte stream 都不得声称 released physical Contract 或 implementation conformance。Downstream publication 与 conformance obligation 由 [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md#interaction-contract-8) 拥有。
