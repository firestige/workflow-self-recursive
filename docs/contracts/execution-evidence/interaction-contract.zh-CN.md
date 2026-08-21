<a id="interaction-contract"></a>
# Execution–Evidence Interaction Contract（中文翻译）

> **REVIEW CANDIDATE——不是已发布 CONTRACT。** 本文件是已被取代的 `EE-CONTRACT-DRAFT-001` 的 meaning-preserving authority split，外加一个 post-split meaning amendment，记录为 `EE-CRITICAL-OTLP-AGGREGATE-ADMISSION-PARITY-2026-08-17`：外部 ingest response 是标准 OTLP aggregate success/partial-success，带 bounded rejected count/reason，且 `accepted`/`duplicate`/`conflict`/`rejected` 仅保留为 Admission-internal per-record disposition；出处保留在 Git 历史中。它拥有 Execution（producer）与 Evidence（acceptor）之间的 transport 与 interaction obligation：endpoint、internal per-record disposition、partial success、batch sibling isolation、retry/timeout/ambiguous commit、version compatibility、generic profile-invalid atomic rejection，以及 downstream publication/conformance obligation。它不拥有任何 wire registry、complete-shape 或 identity-tuple 细节，也不拥有任何 durable storage model。

<a id="interaction-contract-1"></a>
## 1. 元数据与权威性

| 字段 | 值 |
| --- | --- |
| 文档身份 | `interaction.identity.001` |
| 状态 | `REVIEW_CANDIDATE` |
| 规范语言 | 英文 |
| 来源 | 已被取代的 `EE-CONTRACT-DRAFT-001` 的 meaning-preserving authority split，外加一个 post-split meaning amendment，记录为 `EE-CRITICAL-OTLP-AGGREGATE-ADMISSION-PARITY-2026-08-17`（标准 OTLP aggregate ingest response；per-record disposition 仍为 Admission-internal）；出处保留在 Git 历史中 |
| 语义权威 | [Concept](../../agent-architecture.md)、[Execution Design](../../systems/execution/project-execution-system.md)、[Evidence Design](../../systems/evidence/evidence-system.md) |
| Representation companion | [OTel Observation Profile](../observation/otel-observation-profile.md)，proposed version `1.0.0` |
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

Evidence 恰好暴露一个 configured、loopback-only HTTP base URL。同一 base 后追加 standard OTLP path：`/v1/traces` 接受 `ExportTraceServiceRequest`，`/v1/logs` 接受 `ExportLogsServiceRequest`，两者均使用 `Content-Type: application/x-protobuf`。Alternate ingest path、OTLP/JSON path、第二个 signal-specific base URL 或 remote-bound listener 均不 conform。首个 local-only release 不要求该 loopback interface 上的 application-level authentication。不存在外部可访问的 database listener，也不存在从 Evidence 到 Execution 的反向 interface。

`ingest` interface：

| Interface | Input | Result / error | Invariant |
| --- | --- | --- | --- |
| `POST {base}/v1/traces` | bounded official protobuf `ExportTraceServiceRequest` | standard Trace Export response 或 protobuf `Status` | logical Span count 是 OTLP Span count；Resource/Scope envelope 不是 count unit |
| `POST {base}/v1/logs` | bounded official protobuf `ExportLogsServiceRequest` | standard Logs Export response 或 protobuf `Status` | logical Event count 是 OTLP LogRecord count；Resource/Scope envelope 不是 count unit |

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

Request-level validation 成功后，每个 logical Span 或 Event 独立校验。一个 logical Span 与一个 OTLP Span 一一对应，一个 logical Event 与一个 OTLP LogRecord 一一对应。同一 request 中 valid sibling 可以被接受，而 invalid sibling 被拒绝。Resource、Scope、ResourceSpans/ResourceLogs 与 ScopeSpans/ScopeLogs 都是 envelope，绝不是 rejected-count unit。

Response mapping 是 exact 且 signal-specific：

| Admission/request result | HTTP result | OTLP body |
| --- | --- | --- |
| empty request、all accepted、accepted+duplicate 或 duplicate-only | `200` | signal Export response，`partial_success` unset |
| accepted/duplicate 与 conflict/rejected 混合 | `200` | signal Export response 带 partial success；Trace 使用 `rejected_spans`，Logs 使用 `rejected_log_records`；只计 conflict+rejected logical record |
| 所有 logical record 因 permanent data invalidity 成为 conflict/rejected | `400` | protobuf `google.rpc.Status`；绝不使用 signal partial-success body |
| protobuf decode failure、错误 content type、不支持的 exact profile/family coordinate 或 global batch-shape failure | `400` | protobuf `google.rpc.Status`；request failure 的 per-record effect 为零 |
| encoded request 超过 published byte limit | `413` | protobuf `google.rpc.Status`；per-record effect 为零 |
| overload / unavailable | `429` / `503` | protobuf `google.rpc.Status`；可用 identical bytes 与 identity retry |
| gateway failure / timeout | `502` / `504` | protobuf `google.rpc.Status`；可用 identical bytes 与 identity retry |

任何 response 都不含 `accepted`、`duplicate`、`conflict`、`rejected` 或 per-record vector。Request-level failure 发生在 record admission 之前，因此不能 partial accept sibling。

Transaction boundary 是 per valid record，而非 per batch。First accepted write wins。Ordinary retry 安全，因为 identity 与 content digest 决定 duplicate 还是 conflict。

<a id="interaction-contract-6"></a>
## 6. Retry、Timeout 与 Ambiguous Commit

- **Identical retry**：retry 重新提交 identical request bytes 与 record identity。每个已 commit 的 same-identity/same-digest logical record 在内部收敛为 duplicate/already accepted；不重复 effect。External response 保持 standard OTLP aggregate result，不是 per-record duplicate label。
- **Conflicting retry**：以不同 content 重新提交相同 identity 是 internal conflict/rejection；首个已接受 record 绝不 overwrite。外部 response 只暴露 OTLP partial success 允许的 aggregate rejected count/reason，而不是 per-record conflict label。
- **Ambiguous commit**：若 acceptance 可能已 commit 但未观察到 response，唯一 conforming retry 是 identical request。已 commit record 通过 identity+canonical digest 收敛为 duplicate；未 commit record 保持 new。不需要 queue、replay worker 或 compensation，sender 不收到 per-record duplicate label。
- **Acceptance 前失败**：record 被接受前失败不留下 accepted record 或 partial effect；reader 看到 no state 或 complete accepted slice，绝不 half-state；后续 same-identity request 是新请求。
- **Timeout / refusal**：没有 HTTP response 是 transport attempt/result state，不是 pseudo OTLP response。Sender 可 retry identical request；绝不改变 identity 或 payload 来猜测 commit state。
- **Tail loss**：best-effort exporter 可能在 shutdown 前或期间丢失未观察到的 request。这是 transport loss state，不是 OTLP response，也不是 durability claim；sender 不从 Runtime 或之后的 Evidence state 重建 fact。

<a id="interaction-contract-7"></a>
## 7. Version 兼容性

Manifest、lifecycle/result、Observation Profile、每个 Workflow-family schema、producer 与 acceptor 均 explicit versioned。Super Project release 绑定通过 joint gate 的 exact revision 与 SHA-256 digest。它的 release tag 只证明该 exact combination，不对其他 revision 作 compatibility promise。

当 record 携带 unsupported Resource/Scope/profile/family coordinate、unlisted 或 wrong-family field、invalid closed value 或 type、prohibited content，或任何未通过 [OTel Observation Profile](../observation/otel-observation-profile.md) complete validation 的 shape 时，该 record 是 **profile-invalid**。Profile-invalid rejection 是 atomic：整个 logical record 以零 partial projection 拒绝。Evidence 绝不静默忽略 invalid field 或部分接纳 malformed record，也绝不接受它未 explicit support 的 coordinate。

MVP producer 只 emit 其 released combination 中的 exact profile revision；acceptor 只 admit 该 combination 或 published closed compatibility matrix 中的 exact profile/family tuple。`implementation@1` 与 `system-design@1` 是 exact tuple，不是 range。PATCH/MINOR 只描述允许的 source evolution：SemVer 绝不自动扩大 emission、admission 或 conformance。每个新增 cross-release entry 必须列出 exact producer revision、acceptor revision、profile/family tuple、applicability boundary、historical fixture 与 joint-gate evidence。任何未列组合 fail closed。即使 acceptor 有多个 explicit matrix entry，conformance claim 仍始终绑定 exact revision 与 digest。

<a id="interaction-contract-8"></a>
## 8. Publication 与 Conformance 义务

本 split 为 `REVIEW_CANDIDATE`。Profile `0.3.0` 为 `NON_RESOLVING_LEGACY_HISTORY_ONLY`。Candidate `1.0.0` machine schema、registry、fixture、validator 与 publication inventory 已位于 `system-contracts/observation/`，但尚未 release。在所有 lifecycle gate 与 owner approval 通过之前，任何 implementation 或 physical artifact 不得声称 Contract conformance。

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
