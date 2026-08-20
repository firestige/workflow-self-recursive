<a id="interaction-contract"></a>
# Execution–Evidence Interaction Contract（中文翻译）

> **DRAFT——不是已发布 CONTRACT。** 本文件是已被取代的 `EE-CONTRACT-DRAFT-001` 的 meaning-preserving authority split，外加一个 post-split meaning amendment，记录为 `EE-CRITICAL-OTLP-AGGREGATE-ADMISSION-PARITY-2026-08-17`：外部 ingest response 是标准 OTLP aggregate success/partial-success，带 bounded rejected count/reason，且 `accepted`/`duplicate`/`conflict`/`rejected` 仅保留为 Admission-internal per-record disposition；出处保留在 Git 历史中。它拥有 Execution（producer）与 Evidence（acceptor）之间的 transport 与 interaction obligation：endpoint、internal per-record disposition、partial success、batch sibling isolation、retry/timeout/ambiguous commit、version compatibility、generic profile-invalid atomic rejection，以及 downstream publication/conformance obligation。它不拥有任何 wire registry、complete-shape 或 identity-tuple 细节，也不拥有任何 durable storage model。

<a id="interaction-contract-1"></a>
## 1. 元数据与权威性

| 字段 | 值 |
| --- | --- |
| 文档身份 | `interaction.identity.001` |
| 状态 | `DRAFT_NOT_PUBLISHED` |
| 规范语言 | 英文 |
| 来源 | 已被取代的 `EE-CONTRACT-DRAFT-001` 的 meaning-preserving authority split，外加一个 post-split meaning amendment，记录为 `EE-CRITICAL-OTLP-AGGREGATE-ADMISSION-PARITY-2026-08-17`（标准 OTLP aggregate ingest response；per-record disposition 仍为 Admission-internal）；出处保留在 Git 历史中 |
| 语义权威 | [Concept](../../agent-architecture.md)、[Execution Design](../../systems/execution/project-execution-system.md)、[Evidence Design](../../systems/evidence/evidence-system.md) |
| Representation companion | [OTel Observation Profile](../observation/otel-observation-profile.md)，proposed version `0.3.0` |
| Semantic companion | [Observation Catalog](../observation/observation-catalog.md) |
| 已确认方向 | `EE-SKELETON`，SHA-256 `73b3481a099983b57ee9e1dd512c6ed23823f0d045085f9ef585db70be13949a` |
| 翻译一致性义务 | English/Chinese anchors、headings、tables、IDs、fields、enums 与 links 保持成对，依据 [Concept `concept.acceptance.017`](../../agent-architecture.md) |

本文件拥有 Execution 如何提交 Observation 以及 Evidence 如何确认它们。它不拥有 fact 意味着什么（Observation Catalog）、fact 如何编码（OTel Observation Profile），或 accepted fact 如何 durable storage 与 query（Evidence System Design）。

<a id="interaction-contract-2"></a>
## 2. 目的、范围与非目标

Execution 发出 optional、one-way、best-effort Observation；Evidence 接受并确认它。Observation 是非控制的：disablement、refusal、sampling、timeout 或 tail loss 不能改变 Runtime result 或 slot handling，Evidence 也绝不返回 Execution 必须等待的 execution outcome 或 receipt。

范围内：

- ingest endpoint 及其 standard OTLP aggregate acknowledgement；
- internal accepted / duplicate / conflict / rejected Admission disposition；
- partial success 与 batch sibling isolation；
- retry、timeout 与 ambiguous-commit convergence；
- version compatibility 与 generic profile-invalid atomic rejection；
- downstream publication 与 conformance obligation。

非目标：execution control、receipt/outbox/queue/cursor semantics、replay 或 compensation worker、durable storage 与 retention、query presentation，以及从 Evidence 进入 Execution 的任何 callback。Exact wire registry、complete shape、identity tuple 与 conflict matrix 由 [OTel Observation Profile](../observation/otel-observation-profile.md) 拥有，此处不重述。

<a id="interaction-contract-3"></a>
## 3. Transport 与 Endpoint

Factual transport 是 OTLP/HTTP，通过 official binary protobuf Trace 与 Log exporter，与 [OTel Observation Profile §4](../observation/otel-observation-profile.md#otel-profile-4) 中 pin 的完全一致。Stock DSH rc.6 OTLP/JSON 被禁用且不路由到 Evidence。

Evidence 暴露一个 single local、loopback-only ingest endpoint，每个 request 接受一个 bounded、supported OTLP batch。首个 local-only release 不要求 loopback ingest endpoint 上的 application-level authentication。不存在外部可访问的 database listener，也不存在从 Evidence 到 Execution 的反向 interface。

`ingest` interface：

| Interface | Input | Result / error | Invariant |
| --- | --- | --- | --- |
| `ingest` | bounded supported OTLP batch | standard OTLP success 或 partial-success aggregate，带 bounded rejected count/reason | 无 execution outcome；无 per-record response vector；sibling 彼此独立 |

Response 仅是 Evidence ingest 的 aggregate acknowledgement。它绝不是 execution outcome，绝不是 per-record disposition payload，也绝不是 Execution progress 的前提。

<a id="interaction-contract-4"></a>
## 4. Per-Record Disposition

Observation Admission 接纳处理的每个 record 恰好获得一个 internal disposition：

| Disposition | Trigger | 含义 |
| --- | --- | --- |
| accepted | record 通过 [OTel Observation Profile](../observation/otel-observation-profile.md) 的 complete validation 且其 record identity 为新 | record 与每个 required initial effect 一起被接受 |
| duplicate | record identity 与 canonical content digest 匹配已接受 record | 已接受；无 mutation；不再贡献任何内容 |
| conflict | record identity 匹配已接受 record 但 canonical content 不同，或 record 违反 profile 的 invariant/conflict rule | 无 overwrite 地拒绝；首个已接受 record 不变 |
| rejected | record 未通过 profile validation（unsupported coordinate、malformed content、prohibited content）或适用的 lifecycle endpoint rule | 对该 record 以零 partial projection 拒绝 |

Disposition 在 Admission 内部逐 record 决定。Identity 与 digest comparison，以及每条 invariant/conflict rule，定义于 [OTel Observation Profile](../observation/otel-observation-profile.md#otel-profile-7)；本 contract 只拥有 disposition name 及其 Admission 含义。这些 label 不序列化到外部 ingest response，response 也绝不携带 per-record disposition vector。

被拒绝的 record 对该 record 不产生 accepted effect。Conflict 的 record 绝不 overwrite 先前已接受 record。

<a id="interaction-contract-5"></a>
## 5. Partial Success 与 Batch Sibling Isolation

每个 record 独立验证。同一 batch 中 valid sibling 可被接受，而 invalid sibling 被拒绝。外部 OTLP response 只报告 standard aggregate success 或 partial-success result，带 bounded rejected count 与 reason；它不创建 all-or-nothing batch transaction，不暴露 internal per-record disposition label，也绝不报告 execution outcome。

Transaction boundary 是 per valid record，而非 per batch。First accepted write wins。Ordinary retry 安全，因为 identity 与 content digest 决定 duplicate 还是 conflict。

<a id="interaction-contract-6"></a>
## 6. Retry、Timeout 与 Ambiguous Commit

- **Identical retry**：重新提交 identical record（相同 identity 与 digest）在内部收敛到 duplicate/already accepted；无 effect 重复。外部 response 仍是 standard OTLP aggregate result，不是 per-record duplicate label。
- **Conflicting retry**：以不同 content 重新提交相同 identity 是 internal conflict/rejection；首个已接受 record 绝不 overwrite。外部 response 只暴露 OTLP partial success 允许的 aggregate rejected count/reason，而不是 per-record conflict label。
- **Ambiguous commit**：若 record 已被接受但 acknowledgement path 失败，后续 same-identity request 在内部收敛到 duplicate/already accepted。不需要 queue、replay worker 或 compensation，sender 也不会收到 per-record duplicate label。
- **Acceptance 前失败**：record 被接受前失败不留下 accepted record 或 partial effect；reader 看到 no state 或 complete accepted slice，绝不 half-state；后续 same-identity request 是新请求。
- **Timeout / tail loss / refusal**：best-effort export、refusal、timeout 或 tail loss 绝不改变 Runtime outcome，也不产生 durability 或 complete-delivery claim。Sender 不从任何后续 state 重建 lost fact。

<a id="interaction-contract-7"></a>
## 7. Version 兼容性

Manifest、lifecycle/result、Observation Profile、每个 Workflow-family schema 与 factual semantics 都 explicit versioned。Compatibility 依据 exact profile/family/semantic coordinate 声明，绝不从 matching name 或 field spelling 推断。

当 record 携带 unsupported Resource/Scope/profile/family coordinate、unlisted 或 wrong-family field、invalid closed value 或 type、prohibited content，或任何未通过 [OTel Observation Profile](../observation/otel-observation-profile.md) complete validation 的 shape 时，该 record 是 **profile-invalid**。Profile-invalid rejection 是 atomic：整个 logical record 以零 partial projection 拒绝。Evidence 绝不静默忽略 invalid field 或部分接纳 malformed record，也绝不接受它未 explicit support 的 coordinate。

Version compatibility 逐 record 评估；一个 batch 可包含不同 family schema value 的 record，每个都针对相同 profile version 验证。

<a id="interaction-contract-8"></a>
## 8. Publication 与 Conformance 义务

本 split 仍为 `DRAFT_NOT_PUBLISHED`。在 released physical Contract 发布且其 executable validator 通过之前，任何 implementation 或 physical artifact 不得声称 Contract conformance。

Downstream owner 仍必须发布并证明：

1. machine-schema language、filename、package 与 registry layout；
2. exact string character set 与 maximum length、尚未固定的 digest/canonicalization algorithm、cardinality budget、batch/page limit 与 operational default；
3. machine-valid Manifest、lifecycle/result、Observation Profile 与 family schema，编码 [OTel Observation Profile](../observation/otel-observation-profile.md) 所固定的 exact registry、complete shape、target relation、activity identity 与 usage coordinate；
4. packaged positive、negative、base/endpoint、multi-target、duplicate/conflict、partial-success、sampling、privacy、lineage、crash/recovery、completeness、usage 与 retention fixture；
5. physical storage table、column、index、constraint、migration 与 retention default（由 Evidence System Design 拥有，而非本 contract）；
6. production Adapter、Admission、Projection 与 App code、redaction 与 bounded diagnostic；
7. executable validator、cross-implementation validation 与 release/publication record；以及
8. capacity、latency、queue/backpressure、security-expansion 与 retention tuning。

Downstream work 可以细化 physical encoding 并证明提案。它不得在未 reopen System Design 的情况下私下选择另一个 carrier、fact-class taxonomy、field meaning、lineage rule、standard/custom split、usage/missingness model 或 privacy boundary。Retained legacy implementation line 继续是 quarantined legacy evidence，不是 conformance proof；downstream physical cutover 必须 inventory 并原子 replace/remove 或 authorizedly repair 完整 legacy graph，更新所有 consumer 与 entrypoint，建立新 digest，并验证新 baseline。
