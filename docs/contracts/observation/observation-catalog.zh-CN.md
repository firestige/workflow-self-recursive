<a id="observation-catalog"></a>
# Observation Catalog（中文翻译）

> **FROZEN——已发布 CONTRACT。** 本文件是已被取代的 `EE-CONTRACT-DRAFT-001` 的 meaning-preserving authority split，加 post-split `EE-OBSERVATION-A-CLASS-INPUTS-2026-08-20` amendment；出处保留在 Git 历史中。它拥有 Observation fact 的 technology-neutral meaning：fact class、semantic owner，以及 identity / applicability / completeness / unit / privacy / relationship / missingness semantics。它不包含任何 wire-level representation（无 machine field name、无 carrier 或 type mapping、无 concrete serialization）。Exact machine mapping 由已发布的 [OTel Observation Profile](otel-observation-profile.md) version `1.0.0` 拥有。

<a id="observation-catalog-1"></a>
## 1. 元数据与权威性

| 字段 | 值 |
| --- | --- |
| 文档身份 | `observation.identity.001` |
| 状态 | `FROZEN` |
| Contract release | 当前 `observation-contract@1.0.1`；immutable `1.0.0` 上的 PATCH validator correction；wire Profile 仍为 `1.0.0` |
| Publication binding | [`release-binding-1.0.1.json`](release-binding-1.0.1.json)；历史 `1.0.0` 保持 resolving 且 byte-identical |
| 规范语言 | 英文 |
| 来源 | 已被取代的 `EE-CONTRACT-DRAFT-001` 的 meaning-preserving authority split；C55–C57 meaning 与 ownership 解析到 [Concept §3](../../agent-architecture.md#ee-concept-3)、[Execution §14](../../systems/execution/project-execution-system.md#ee-execution-14) 和 [Evidence §8](../../systems/evidence/evidence-system.md#ee-evidence-8)；历史 amendment 仅保留 provenance |
| 语义权威 | [Concept](../../agent-architecture.md)、[Execution Design](../../systems/execution/project-execution-system.md)、[Evidence Design](../../systems/evidence/evidence-system.md) |
| Representation companion | [OTel Observation Profile](otel-observation-profile.md)，published version `1.0.0` |
| Transport/interaction companion | [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md) |
| 已确认方向 | `EE-SKELETON`，SHA-256 `73b3481a099983b57ee9e1dd512c6ed23823f0d045085f9ef585db70be13949a` |
| 翻译一致性义务 | English/Chinese anchors、headings、tables、IDs、fields、enums 与 links 保持成对，依据 [Concept `concept.acceptance.017`](../../agent-architecture.md) |

本文件 catalog Observation fact *意味着什么* 以及谁拥有每个 fact。它不拥有 fact 如何编码、transport、admit、storage 或 query。C55–C57 明确引用 English [Concept §3](../../agent-architecture.md#ee-concept-3)、[Execution §14](../../systems/execution/project-execution-system.md#ee-execution-14) 与 [Evidence §8](../../systems/evidence/evidence-system.md#ee-evidence-8) owner anchor；Observation 只编码，不成为其 semantic producer。Representation 与这些 anchor 冲突时，以 owner anchor 为准。

Profile `0.3.0` 为 `NON_RESOLVING_LEGACY_HISTORY_ONLY`；它仅作为 Git 历史中的 provenance 保留，不是可选择的 compatibility target。

<a id="observation-catalog-2"></a>
## 2. 目的、所有权划分与阅读方式

Observation 是 Execution 发出、Evidence 接受的 versioned、allow-listed、content-minimized factual record。这些 fact 的 meaning 是 stable 且 technology-neutral 的；它们的 encoding 是独立的 representation decision。

| Concern | 唯一 owner |
| --- | --- |
| Fact meaning、semantic owner、truth、privacy、fact lifecycle semantics | 本文件，委托给 English Concept/Execution/Evidence Design |
| Exact machine mapping（name、carrier、closed value set、complete shape） | [OTel Observation Profile](otel-observation-profile.md)，version `1.0.0` |
| Transport flow、endpoint、partial success、retry、ambiguous commit | [Execution–Evidence Interaction Contract](../execution-evidence/interaction-contract.md) |
| Admission、projection、durable storage、query | [Evidence System Design](../../systems/evidence/evidence-system.md) |
| Producer mapping、privacy/redaction、export isolation | [Execution System Design](../../systems/execution/project-execution-system.md) |

Exact field registry 只出现在一个文档中（OTel Observation Profile）。本 Catalog 仅用 technology-neutral name 命名相同概念；它绝不复制 machine field registry。

此处 lifecycle 指 Observation fact 的 semantic lifecycle：fact 何时适用、其 absence 意味着什么，以及其 truth/completeness state 如何被阅读。它不同于 Evidence retention/expiry data lifecycle；后者由 [Evidence System Design](../../systems/evidence/evidence-system.md) 拥有。

<a id="observation-catalog-3"></a>
## 3. Fact Class 与 Semantic Owner

**Fact class** 是带单一 stable meaning 的类型化 observation record 家族。首个 profile 定义恰好十个 fact class。每个 fact class 有一个 semantic owner，它提供 scalar 并拥有其 meaning；Delivery Observation 仅映射它。

| # | Fact class | 含义 | Semantic owner |
| ---: | --- | --- | --- |
| 1 | Delivery Summary | 一个 Delivery 的 terminal outcome 及其 business binding（delivery、task、workflow、implementation、runtime、manifest digest、family），加 owner-reported 的 optional elapsed time 与 furthest reached Workflow stage | outcome 与 elapsed time 由 Runtime/Execution result owner 提供；stage identity 由 Workflow owner 提供；binding identity 由 Execution/Workflow owner 提供 |
| 2 | Review Finding | 一个 bounded、non-empty、privacy-safe human-readable Finding assertion，加其 source Review、Finding-specific scope 与恰好一个 typed affected target | source review lens；Workflow/Artifact/target owner 提供 coordinate |
| 3 | Review Summary | 一个 Review result：identity、lens、scope、reviewed Artifact、writer/reviewer invocation，以及可选 observed review count | Workflow review owner |
| 4 | Test Summary | 一个 test report 的 implementation test pass/fail/skip count 与 applicable duration | Implementation test owner；Artifact owner 提供 report reference |
| 5 | Intervention | 一个 observed intervention fact | Workflow control owner |
| 6 | Role Lineage | 从 version-local Role identity 到 family-scoped lineage identity 的一个 immutable mapping | Workflow Contract owner |
| 7 | Usage | 一个 native usage quantity，带 kind、unit、source class、source identity 与 nonnegative value | Runtime/provider usage owner |
| 8 | Sampling Decision | 一个 sampling decision 及其 probability | Delivery Observation sampler |
| 9 | Implementation Summary | 单个 dimension（line、branch 或 function）的一个 structural-coverage fact 及其 report | structural coverage owner；Artifact owner 提供 report reference |
| 10 | System Design Summary | Fresh Reader result 与 deterministic verification result | Fresh Reader owner 与 deterministic verification owner |

没有 fact class 断言 design quality、reviewer effectiveness、ranking、recommendation 或 causal inference。Observed activity（Role/Agent/model/tool call 与 duration）作为 causal activity 记录，而非 summary fact class；它不携带 summary-derived causality。Model-role evaluation 汇总这些 activity fact；wire 绝不嵌入 free-form 或 list-valued model summary。

<a id="observation-catalog-4"></a>
## 4. Semantic Field

**Semantic field** 是 fact class 的一个具名 attribute，此处以 technology-neutral 术语描述。`Kind class` 命名 field 的 semantic role；它不是 serialization type。每个 semantic field 的 exact machine field 由 [OTel Observation Profile](otel-observation-profile.md#otel-profile-7) 拥有。

| Semantic field | Fact classes | Kind class | 含义 |
| --- | --- | --- | --- |
| Delivery identity | Delivery Summary | identity | 一个 Delivery；绝不替代 activity identity |
| Task identity | Delivery Summary | identity | 跨相关 Delivery 的 grouping identity；仅 optional grouping coordinate，无 causality |
| Workflow identity | Delivery Summary | identity | logical workflow identity |
| Workflow version | Delivery Summary | identity | workflow semantic-version coordinate |
| Implementation identity | Delivery Summary | identity | implementation coordinate |
| Runtime identity | Delivery Summary | identity | runtime coordinate |
| Manifest digest | Delivery Summary | integrity | immutable manifest binding |
| Workflow family | Delivery Summary、所有 family fact | classification | `implementation` 或 `system-design`；一个 fact 属于一个 family |
| Record identity | 每个 fact record | identity | stable first-accepted record identity 与 dedup key |
| Delivery outcome | Delivery Summary | status | closed terminal outcome category |
| Delivery elapsed time | Delivery Summary | duration | 从 Delivery start 到 terminal outcome 的 owner-reported elapsed millisecond；必须 nonnegative，absent 时为 unavailable |
| Delivery stage reached | Delivery Summary | classification | terminal outcome 时 owner-reported 的 furthest reached Workflow stage identity；只使用 exact identity，不解析 name 或推断 order |
| Canonical model identity | recorded model-call activity | identity | Runtime/provider owner 提供的 provider-scoped canonical model identity；不同于 display name 与 request/response alias |
| Model-to-role attribution | recorded model-call activity | relationship | canonical model identity、provider、version-local Role identity、Runtime identity 与 Span identity 组成的 exact on-call tuple；evaluation 只能汇总 recorded tuple |
| Completeness state | summary 与 usage fact | completeness | closed completeness/applicability state |
| Review identity | Review Finding、Review Summary | identity | review result identity |
| Review lens | Review Finding、Review Summary | classification | closed review-lens category |
| Review scope | Review Finding、Review Summary | identity | coarse review scope；无 free text |
| Review severity | Review Finding | classification | closed severity category |
| Review total | Review Summary | count | reported review total |
| Review observed count | Review Summary | count | owner-reported observed count，包括 zero；absence 是 “no count fact”，绝不是 zero |
| Finding identity | Review Finding | identity | Finding identity |
| Finding status | Review Finding | status | closed disposition category；绝不属于 immutable assertion |
| Finding summary | Review Finding | content | 唯一的 bounded human-readable Finding scalar |
| Finding scope | Review Finding | identity | Finding-specific affected-scope node；与 coarse Review scope 不同 |
| Source review identity | Review Finding | identity | 产生此 Finding 的 review |
| Fix identity | Review Finding（fixed fact） | identity | fix/change identity |
| Fix-to-Finding edge | Review Finding（fixed fact） | relationship | explicit fix→Finding edge |
| Recheck identity | Review Finding、Review Summary（recheck fact） | identity | recheck identity |
| Recheck-to-prior-review edge | recheck fact | relationship | explicit recheck→prior Review edge |
| Recheck-to-Finding edge | recheck fact | relationship | explicit recheck→Finding edge |
| Recheck-to-Fix edge | recheck fact | relationship | explicit recheck→Fix edge，仅在 Fix 处于 recheck 时 present |
| Iteration identity | Recheck summary 与 Recheck-on-Finding | identity | objective iteration identity，恰好出现在 iterated shape 上 |
| Artifact identity | review/test/report/family fact | identity | referenced Artifact identity |
| Artifact digest | 与 Artifact identity 相同的 fact | integrity | immutable Artifact reference binding |
| Role identity | invocation 与 lineage fact | identity | version-local Role identity |
| Role lineage identity | Role Lineage | identity | family-scoped lineage identity；无 parsing 或 name inference |
| Parent role identity | lineage/relation fact | identity | parent relationship endpoint；仅经 lineage mapping join |
| Writer/reviewer/recheck role identity | review/artifact/recheck relation | identity | writer/reviewer/recheck endpoint，经 mapping join |
| Writer/reviewer/recheck invocation identity | review/artifact/recheck relation | identity | 执行 write/review/recheck 的 invocation |
| Intervention kind | Intervention | classification | closed intervention category |
| Observed loop count | family summary | count | 仅 observed-loop fact；绝非 quality inference |
| Observed intervention count | family summary | count | 仅 observed-intervention fact |
| Usage kind | Usage | classification | closed native-usage category |
| Usage unit | Usage | unit | exact source-scoped unit（money 为 ISO currency） |
| Usage source | Usage | provenance | `runtime` 或 `provider` |
| Usage source identity | Usage | identity | exact runtime 或 provider identity |
| Usage value | Usage | quantity | nonnegative count 或 minor unit 的 money |
| Sampling decision | Sampling Decision | status | closed sampling decision |
| Sampling probability | Sampling Decision | quantity | inclusive [0,1] sampling probability |
| Family schema | 每个 family fact | classification | family semantic-version coordinate |
| Finding target kind | Review Finding | classification | closed `artifact`/`section`/`component`/`requirement` category |
| Finding target identity | Review Finding | identity | affected target endpoint |
| Containing artifact identity | Review Finding | identity | scoped target 的 containing Artifact；与 reviewed Artifact 不同 |
| Test passed/failed/skipped count | Test Summary | count | compatible test-count fact |
| Test duration | Test Summary | duration | applicable test duration |
| Coverage dimension | Implementation Summary | classification | `line`、`branch` 或 `function`；每个 fact 一个 |
| Coverage covered / total | Implementation Summary | count | covered 与 denominator pair；绝不合并为 score |
| Coverage scope | Implementation Summary | identity | exact coverage scope；无 source body 或 path list |
| Coverage tool | Implementation Summary | provenance | exact tool/version identity |
| Coverage format | Implementation Summary | provenance | exact report-format identity |
| Fresh Reader result | System Design Summary | status | closed Fresh Reader result |
| Fresh Reader finding count | System Design Summary | count | Fresh Reader Finding count |
| Verification identity | System Design Summary | identity | verification-run identity |
| Verification result | System Design Summary | status | closed verification result |
| Verification passed/failed checks | System Design Summary | count | passed/failed check count |

没有任何 field 携带 prompt、message、tool argument/result、source/diff、credential 或 raw error body。没有任何 field 断言 quality、effectiveness、ranking、recommendation 或 inferred causality。

<a id="observation-catalog-5"></a>
## 5. Fact Class Profile

每一行是一个 fact class 的 technology-neutral profile：它意味着什么、如何被识别、何时适用、completeness 与 unit 如何表达、其 privacy class、其 relationship，以及其 absence 意味着什么。

| Fact class | Identity | Applicability | Completeness | Unit | Privacy | Relationships | Missing meaning |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Delivery Summary | distinct Delivery identity 加 record identity | 每个 Delivery 一个 record；business binding coordinate required；elapsed time 与 reached stage 是 optional direct owner report | 断言 completeness truth 时 summary state 适用 | outcome 与 stage 是 category/identity；elapsed time 为 nonnegative millisecond | 仅 classification、identity 与 bounded duration metadata | Delivery→business binding 与 Delivery→reached-stage；task grouping 不产生 causality | 缺失 outcome 或 binding 意味着 no fact；absent elapsed time 或 stage 为 unavailable，绝不是 zero 或 inferred stage |
| Review Finding | Finding assertion `(Finding identity, Finding scope)`；每个 record 一个 typed target edge | 每个 record 恰好一个 affected target；multi-target 每个 target 重复一次 complete assertion | 不适用于 assertion 本身 | 无 numeric unit；Finding summary 是 bounded text | Finding summary 是唯一 content scalar，privacy-safe；target 仅为 identifier | Finding→source Review；Finding→affected target；Finding-specific scope node | 缺失 field 拒绝 record；绝不产生 partial Finding |
| Review Summary | Review identity 加 record identity | ordinary 或 Recheck summary；summary 必须携带 lens、scope、Artifact 与 writer/reviewer invocation | `FINAL`、`LOWER_BOUND`、`NOT_APPLICABLE` 或 `UNAVAILABLE` | observed count 是 nonnegative integer；review total 是 nonnegative integer | 仅 classification 与 identity metadata | Review→reviewed Artifact；writer/reviewer invocation→Role | absent observed count 意味着 “no count fact”，绝不是 zero |
| Test Summary | record identity 加 report Artifact reference | 每个 applicable test report 一个 record | completeness state 适用 | count 是 nonnegative integer；duration 是 seconds | 仅 count 与 duration | Test Summary→report Artifact | 缺失 duration 意味着 no duration fact |
| Intervention | record identity | 每个 observed intervention 一个 record | family summary 上 summary state 适用 | kind 是 category | 仅 factual classification | 除计数它的 family summary 外无其他 | 缺失 intervention fact 意味着未报告 intervention |
| Role Lineage | version-local Role identity 与 family-scoped lineage identity | 仅在 lineage known/applicable 时发出 | 不适用 | 无 unit | 仅 identity metadata | version-local Role→family lineage mapping | unknown/not-applicable lineage 不发 lineage fact；不 synthesize value |
| Usage | record identity 加 exact kind/unit/source/source-identity group | 每个 native usage quantity 一个 record；money 仅在 minor unit 与 ISO currency 下 | 断言时 `FINAL`、`LOWER_BOUND`、`NOT_APPLICABLE` 或 `UNAVAILABLE` | exact source-scoped unit；money 为 ISO-4217 currency | 仅 factual quantity 与 provenance | 无；compatible group 仅在 identical coordinate 下聚合 | 缺失 usage 意味着 unavailable，绝不是 zero；无 conversion 或 price inference |
| Sampling Decision | record identity | 每个 sampling decision 一个 record | 不适用 | probability 是 inclusive [0,1] | 仅 factual status | 无 | `drop` decision 不表示没有执行发生 |
| Implementation Summary | record identity 加 exact dimension/scope/tool/format/report group | 每个 record 恰好一个 coverage dimension | completeness state 适用 | covered 与 total 是 nonnegative integer；covered 绝不超 total | 仅 count、scope identity、tool/format provenance | Implementation Summary→report Artifact | 缺失 covered/total 意味着 no coverage fact，绝不是 zero coverage |
| System Design Summary | verification-run identity 或 Fresh Reader record identity | Fresh Reader result 适用于 `fresh-reader` lens summary；verification result 适用于 deterministic verification run | completeness state 适用 | result 是 category；count 是 nonnegative integer | 仅 factual status 与 count | System Design Summary→report Artifact | 缺失 result 意味着 no result fact |

<a id="observation-catalog-6"></a>
## 6. 横切语义

### Identity

每个 identity 都由 owner 提供并进行 mechanical comparison。Arrival order、text、name、task grouping、display adjacency 与 storage-generated identifier 绝不参与 identity。不同 identity axis 保持不同：Delivery 不是 task；logical Workflow 不是 implementation；task 不是 retry token；opaque runtime correlation 不是 public Workflow state；display name 不是 Role identity。Finding assertion 以 `(Finding identity, Finding scope)` 为 key；Finding target edge 以 assertion 加 typed target 及其 containing-Artifact context 为 key；status contribution、Fix 与 Recheck 各自拥有独立的 identity domain。Record identity 是一个 observation record 的 stable dedup key；recorded causal activity 由自己的 activity tuple 识别，绝不单独由任一 component 识别。

### Applicability

Field 是 **required**、**conditional** 还是 **prohibited**，完全按 representation profile 中的 complete shape 决定。Conditional presence 本身就是一个 signal：observed review count 出现在 ordinary 与 Recheck summary 上、在 Finding shape 上 prohibited；iteration identity 恰好出现在 iterated shape 上。Conditional absence 绝不重建为 value。

### Completeness

四个 state 表达 completeness 与 applicability：

| State | 含义 | Numeric interpretation |
| --- | --- | --- |
| `FINAL` | 观察到 applicable final summary | zero 仅在 explicitly reported 时 valid |
| `LOWER_BOUND` | 观察到 detail，但没有 complete applicable summary | value 仅是 lower bound |
| `NOT_APPLICABLE` | family/metric 不存在 value | 无 numeric value |
| `UNAVAILABLE` | sampling、loss 或 missing summary 阻止 claim | 无 numeric value |

只有 applicable final summary 能证明 final zero 或 total。四个 state 绝不折叠，missing 绝不是 zero。

### Unit

Quantity 携带 exact、source-scoped unit。Delivery elapsed time 是 owner-reported nonnegative millisecond duration，绝不替代 individual activity Span duration。Usage quantity 携带 exact unit（money 为 ISO-4217 currency）；token usage 与 native usage 是不同 measurement family，绝不互相替代。Structural coverage 携带 dimension 与 covered/total pair。Compatible fact 仅在 identical semantic version、kind、unit-or-currency、source、source identity 与 completeness coordinate 下聚合；不允许 implicit conversion 或 cross-unit summation。

### Privacy

Producer allow-list/redaction boundary 与 Admission 都禁止 prompt 与 system-instruction body、model message 与 input/output content、tool/Skill argument 与 result body、source file 与 full diff 与 complete Artifact body、credential 与 secret 与 token、exception message 与 stack 与 raw error body、complete manifest copy、runtime session/checkpoint/native-state/configuration body、arbitrary map 与 extension envelope，以及 score/ranking/recommendation/inferred causality。唯一的 human-readable Finding scalar 是由 source review lens 撰写的 bounded nonempty paraphrase，绝不是 copied body；所有 target 与 scope field 仅为 bounded identifier。

### Missing meaning

Missing 绝不是 zero，absence 绝不重建。Absent observed review count 是 “no count fact”；present zero 是 recorded zero。Absent usage 或 token quantity 是 unavailable，绝不是 zero。Absent Delivery elapsed time 或 reached stage 是 unavailable，绝不是 zero 或 inferred initial/terminal stage。Incomplete provider/model/Role/Runtime/Span attribution tuple 是 unavailable，绝不从 alias、ancestry 或 task grouping 补齐。Absent lineage fact 意味着 lineage unknown 或 not applicable，绝不是 synthesized identity。Absent completeness claim 意味着 no claim，绝不假定 final state。Consumer 绝不重建 unavailable producer intent。

<a id="observation-catalog-7"></a>
## 7. 关系模型

Objective review graph 仅通过 typed endpoint 连接 distinct Review、Finding、Artifact、Fix、Recheck、Invocation、iteration 与 Role identity；它绝不从 name、order、count 或 grouping 推断 edge。Recorded causal activity 是 causal edge 的唯一来源；summary count 绝不创建 causal edge。

- **Review → scope/lens**：Review 携带其 coarse scope 与 lens。
- **Review → reviewed Artifact**：Review 恰好引用 reviewed Artifact 及其 digest。
- **Finding → source Review**：Finding 引用产生它的 Review。
- **Finding → affected target**：Finding 每个 record 恰好断言一个 typed `artifact`/`section`/`component`/`requirement` target，target 为 artifact-scoped 时带 containing Artifact；multi-target Finding 每个 target edge 重复一次 complete assertion，order-independent。
- **Fix → Finding**：Fix 恰好引用它修复的 Finding。
- **Recheck → Review/Finding/Fix/iteration**：Recheck 引用被 recheck 的 prior Review、被处理的 Finding、处于 recheck 的 Fix（仅当存在时）与 iteration，外加其自身的 invocation 与 Role。
- **Writer/reviewer/recheck invocation → Role**：每个 invocation 引用执行它的 version-local Role；join 经 lineage mapping，绝不经 display name 或 position。
- **version-local Role → family lineage**：每个 known lineage 将一个 version-local Role 映射到一个 family-scoped lineage identity。
- **Delivery → reached stage**：terminal Delivery Summary 可携带 Workflow owner 的 exact furthest-reached stage identity；consumer 绝不从 name 排序或推断 stage。
- **model call → Role/Runtime**：model-call activity 可断言 exact provider/canonical-model/version-local-Role/Runtime/Span tuple；evaluation 可分组 recorded tuple，但绝不从 parentage 或 display name 创建 attribution。

<a id="observation-catalog-8"></a>
## 8. Compatibility 与聚合

Compatible fact 仅在 identical coordinate 下聚合：semantic/family version、measurement kind、unit-or-currency、source、source identity 与 completeness。Delivery elapsed time 保持每个 Delivery 一个 direct contribution，且仅按 evaluation-declared cohort 分组；reached-stage fact 保持 exact Workflow stage identity。Model-role measure 只分组 complete identical provider/canonical-model/version-local-Role/Runtime coordinate，同时保留每个 Span identity 作为 contributing activity。Incompatible group 保持分离；premium request 与其他 provider-native unit 保持与 ordinary request 和 credit 不同；money 绝不 conversion 或 cross-sum；reported 与 estimated usage source 保持分离。Structural coverage 仅在 identical dimension、scope、tool、format 与 report 下聚合；line、branch 与 function pair 绝不合并为 score。Accepted history 绝不重写，aggregation 绝不 fabricate 任何 accepted fact 未报告的值。
