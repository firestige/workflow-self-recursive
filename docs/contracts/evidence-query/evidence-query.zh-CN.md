<a id="evidence-query"></a>
# Evidence Query 契约

| 字段 | 值 |
| --- | --- |
| Contract revision | `evidence.query@0.1.0` |
| Lifecycle status | `REVIEW_CANDIDATE` |
| Owner | Evidence Query & API（M03） |
| Semantic closure approved | `firestige`，2026-08-26 |
| Wave9 clarification reopen approved | `firestige`，2026-08-26；首次发布前不 bump revision |
| Normative language | English |
| Translation | 本文件是 [`evidence-query.md`](evidence-query.md) 的 non-normative tracking translation；要求整篇 parity |
| Semantic authority | [Evidence System Design](../../systems/evidence/evidence-system.md)，尤其是 Query & API、lifecycle、ownership 与 access 各节 |
| Upstream fact authority | FROZEN [Observation Catalog](../observation/observation-catalog.md) 与 [OTel Observation Profile](../observation/otel-observation-profile.md)，wire Profile `1.0.0` |
| Machine representation | 计划为 `system-contracts/evidence-query/` revision `0.1.0`；Wave9 前不存在 |
| Shared interface candidate | `evidence-system/src/wsr_evidence/storage/read_model.py` at `c71ad4565935025d524ffbd7236badf43ae11ac7` |
| Publication binding | 无；candidate material 不是 conformance target |
| Reopen condition | 需要 write endpoint、remote listener、application authentication、consumer database access、inferred causality、Metric formula、第五种 lifecycle class、改变 truth/expiry 含义，或产生 incompatible field/enum/authority change |

该 revision 已为 owner review 达到语义闭合。它可以支持 fast-path implementation 与 machine-representation candidate，但在 contract.gate.1–6 全部通过、相同 revision 的语义与机器表示一起达到 `FROZEN` 前，任何实现都不得声称 conformance。

<a id="evidence-query-1"></a>
## 1. 目的、权威与排除项

`evidence.query` 是 Evidence 唯一 external read boundary。它向 BI 与 Evolution 返回 committed projected fact 与 recorded Trace structure，不暴露 PostgreSQL、accepted-record storage、Raw debug data、projection table、SQL 或 internal effect name。

Evidence 拥有 query representation、availability、expiry presentation、compatibility coordinate、pagination 与 read/retention seam。Observation family 继续拥有 fact meaning、identity、applicability、completeness、unit、privacy、relationship 与 missingness。Query 绝不评分、转换、估算、重算、选择 Finding 当前状态、重建 missing fact 或推断 edge。

本契约不定义 Metric formula、cohort rule、causal inference、presentation model、write operation、replay、correction、authentication scheme、remote access 或 database credential。成功响应不是 execution outcome，也不证明所有可能 Observation 都存在。

下文的“Fact”只指 committed Projection-owned contribution 或 relationship representation，绝不指 arbitrary accepted payload 或 raw logical record。

<a id="evidence-query-2"></a>
## 2. Transport 与 endpoint surface

Evidence service 在 ingest 使用的同一 configured HTTP listener 上暴露下列 endpoint。Loopback scope 绑定 IP loopback address；已批准 container topology 只允许容器内部 wildcard binding，host publication 仍仅 loopback。PostgreSQL 仍为 internal-only。首个 local release 无 application-level authentication。

| Method 与 path | 目的 | Success media type |
| --- | --- | --- |
| `GET /v1/evidence/facts` | 分页读取 committed factual resource | `application/json` |
| `GET /v1/evidence/traces` | 分页读取恰好一个 Trace 或 Delivery 的 recorded node/edge | `application/json` |

只定义 `GET`。`POST`、`PUT`、`PATCH`、`DELETE` 及任何未列出的 method/route 都没有 query 语义并返回 bounded error。Query 不接受 request body。UTF-8 JSON response 使用下列 exact shape；revision `0.1.0` 禁止 unknown response field。

<a id="evidence-query-3"></a>
## 3. 通用 envelope、scalar 与 identity 规则

每个成功 response 都使用以下 closed envelope：

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `contract.name` | string | 恰好为 `evidence.query` |
| `contract.revision` | string | 恰好为 `0.1.0` |
| `observation_profile` | string | 恰好为 source wire Profile，首版 `1.0.0` |
| `read_model_revision` | string | 本 Contract revision 恰好为 `1.0.0` |
| `snapshot` | string | opaque snapshot-lease token；同一次 traversal 每页相同 |
| `items` | array | 零到 requested `limit` 个 resource |
| `next_cursor` | string 或 null | 绑定 snapshot、route、revision、filter、limit 与最后 sort key 的 opaque continuation |

JSON scalar 仅为 string、integer、finite number、boolean 或 null。禁止超出 interoperable range `[-9007199254740991, 9007199254740991]` 的 integer、non-finite number、binary body、arbitrary map 与 nested free-form extension field。Response timestamp 是带 `Z` 且恰好六位 fractional digit 的 UTC RFC 3339 string。Request timestamp filter 使用 `YYYY-MM-DDTHH:MM:SS[.fraction]Z` lexical form；`fraction` 存在时为 1..6 位 decimal digit，calendar/time value 必须有效。Normalization 将已有 fraction 或缺失 fraction 无舍入补为恰好六位；超过六位或 timezone offset 非法。Digest 是 lower-case 64-character SHA-256 hex string。

Public identity 必须显式且绝非 alias：

| Identity | Shape |
| --- | --- |
| Event source | `{ "kind": "EVENT", "event_id": <nonempty string> }` |
| Span source | `{ "kind": "SPAN", "trace_id": <32 lower-case hex>, "span_id": <16 lower-case hex> }` |
| Fact resource ID | `fact:<source-kind>:<canonical source identity>:<fact-kind>:<canonical owner key>` |
| Trace item ID | exact recorded node、parent edge 或 link 的 canonical tuple；display name 不参与 |

实现可以把 resource ID 编为 opaque string，但 equality 必须恰好对应上述 tuple，并在 revision `0.1.0` 内稳定。不得包含 database row ID、mutable alias、list position 或 arrival-order guess。

Opaque resource-ID bytes 有意保持 implementation-private。Machine validator 只检查 nonempty/byte bound 与 black-box equality/stability vector；不得为 public ID 发明或要求某一种 delimiter、escaping 或 tuple serialization。

每个 non-Trace relationship endpoint 使用 closed shape `{ "kind": <endpoint-kind>, "key": <owner-key> }`。Endpoint kind closed 为 `FINDING`、`FINDING_TARGET`、`FIX`、`RECHECK`、`ROLE`、`ROLE_LINEAGE`、`SPAN`、`DELIVERY`、`MODEL_ROLE`。`key` 遵守 bounded scalar-array `owner_key` 规则；其 kind、tuple arity 与含义由 §4 Projection matrix 固定。Endpoint 绝不是裸 display string 或无类型 array。

<a id="evidence-query-4"></a>
## 4. Fact resource

每个 `/facts` item 有以下 closed field：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `id` | string | stable Fact resource ID |
| `kind` | closed enum | 下列 Fact kind 之一 |
| `source` | Event 或 Span identity | exact accepted source identity |
| `recorded_at` | timestamp | committed Projection record time；只作 display/provenance，不是 causal order |
| `provenance` | object | exact accepted digest、profile version、nullable family schema 与 owner coordinate |
| `compatibility` | object | exact aggregation/consumer-compatibility coordinate；无 inferred default |
| `truth` | object | completeness、availability、expiry state 与 nullable expiry time |
| `fields` | array | 零个或多个按 upstream field ID/name 排序的 closed typed projected field |
| `relationships` | array | 零个或多个按 relationship kind 与 endpoint tuple 排序的 exact recorded non-Trace relationship |

`kind` closed 为：

`EVENT_CONTRIBUTION`、`FINDING_ASSERTION`、`FINDING_TARGET`、`FINDING_STATUS`、`FINDING_FIX`、`FINDING_RECHECK`、`ROLE_LINEAGE`、`DELIVERY_ROOT_BINDING`、`MODEL_ATTRIBUTION`。

当 Projection 拥有不同 identity 时，一个 accepted source 可产生多个 resource，例如 assertion、target、status、Fix 与 Recheck。Query 不把它们折叠为 mutable “current Finding”。Compatible first-write reuse 不产生 duplicate item。

Fact 与 Trace item resource ID nonempty 且最多 8192 UTF-8 bytes。`owner_key` 含 1–16 个 scalar；string scalar nonempty 且最多 256 UTF-8 bytes。`fields` 最多 73 项，`dimensions` 最多 16 项，`relationships` 最多 16 项；适用时 upstream field-specific limit 更严格。

`provenance` 恰好包含：

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `accepted_digest` | SHA-256 string | first accepted logical record 的 canonical digest |
| `profile_version` | string | source Observation wire Profile |
| `family_schema` | string 或 null | exact source family schema；只有 upstream shape 不携带时才为 null |
| `owner_key` | scalar value array | 该 resource 的 exact Projection owner key |

`compatibility` 恰好包含 `family_schema`、`event_name`、`completeness` 与 `dimensions`。Span-derived 或 relationship-only resource 的 `event_name` 为 null。`dimensions` 是 `{ "field": <upstream field ID 或 standard OTel name>, "value": <scalar> }` 的 ordered array，只包含 Evidence Design 要求的 coordinate：semantic/family version、measurement kind、unit-or-currency、source、source identity、completeness，以及适用的 review/test/coverage/model coordinate。Missing coordinate 保持 absent；Query 不从其他 record 补齐。

`fields` 使用 `{ "field": <upstream field ID 或 standard OTel name>, "value": <scalar> }`。允许的 name、type、closed enum、applicability、bound、privacy rule、十个 EventName 与 complete Event shape 恰好来自 Wave6 input manifest 所绑定的 published Observation Profile `1.0.0` registry/schema/validator input；它们是 normative machine input，而不是留给 Wave9 重新解释的 prose。Query 只能返回 Projection 为该 resource kind 拥有的 value。不得返回 Resource/Scope envelope、raw OTLP、arbitrary `agentops.*`、prohibited body 或 unlisted field。每个 `fields` 或 `dimensions` array 的 `field` value 唯一。AgentOps field 按 registry ID 的 numeric family order（`C01..C57`、`I01..I10`、`S01..S06`）排序；随后 admitted standard OTel name 按 exact UTF-8 bytewise ascending order 排序。Factual detail 过期时 `fields` 为空；empty array 绝不 synthesise zero。

`relationships` 恰好使用 `{ "kind", "from", "to" }`。Closed kind 为 `FINDING_TARGET`、`FINDING_FIX`、`FINDING_RECHECK`、`ROLE_LINEAGE`、`DELIVERY_ROOT`、`MODEL_ATTRIBUTION`。Endpoint 是 accepted fact 携带的 exact stable identity。Task grouping、name、time order 或 shared label 绝不产生 relationship。

下列 public Projection matrix 为 normative。Field ID 指向 Observation Profile `1.0.0`；`?` 表示只有 upstream complete shape 携带时才 present。各 resource kind 不拥有表外 field 或 relationship。

| Fact kind | Source | Exact `owner_key` | Projected `fields` | Exact relationship |
| --- | --- | --- | --- | --- |
| `EVENT_CONTRIBUTION` | Event | `[event_name,C09]` | 该 Event contribution 拥有的全部 admitted field，包括 present 时的 explicit C17；排除 Resource/Scope 与 arbitrary attribute | 无 |
| `FINDING_ASSERTION` | Event | `[C18,C51]` | C13,C14,C15,C20,C28,C29,C33,C34,C36,C37,C49,C50 | 无 |
| `FINDING_TARGET` | Event | `[C18,C51,C52,C53,C54-or-null]` | C18,C51,C52,C53,C54? | `FINDING_TARGET`：`FINDING:[C18,C51]` → `FINDING_TARGET:[C18,C51,C52,C53,C54-or-null]` |
| `FINDING_STATUS` | Event | `[C18,C51,C12]` | C18,C51,C12,C19,C33,C34,C36,C37 | 无；每个 status contribution 保持独立 |
| `FINDING_FIX` | Event | `[C18,C51,C52,C53,C54-or-null,C21]` | C18,C51,C12,C21,C22,C33,C34,C36,C37 | `FINDING_FIX`：`FIX:[C21]` → exact `FINDING_TARGET` tuple |
| `FINDING_RECHECK` | Event | `[C18,C51,C52,C53,C54-or-null,C23]` | C18,C51,C12,C23,C24,C25,C26?,C27,C33,C34,C35,C36,C37,C38 | `FINDING_RECHECK`：`RECHECK:[C23]` → exact `FINDING_TARGET` tuple |
| `ROLE_LINEAGE` | Event | `[C49,C30]` | C30,C31,C32?,C49 | `ROLE_LINEAGE`：`ROLE:[C49,C30]` → `ROLE_LINEAGE:[C49,C31]`；C32 present 时仍是 field，不推断第二条 edge |
| `DELIVERY_ROOT_BINDING` | Span | `[trace_id]` | C01,C06,C07,C08 | `DELIVERY_ROOT`：`SPAN:[trace_id,span_id]` → `DELIVERY:[C01]` |
| `MODEL_ATTRIBUTION` | Span | `[provider,C57,C30,C06,trace_id,span_id]` | `gen_ai.provider.name`,`gen_ai.request.model`,C57,C30,C06 | `MODEL_ATTRIBUTION`：`SPAN:[trace_id,span_id]` → `MODEL_ROLE:[provider,C57,C30,C06]` |

`MODEL_ATTRIBUTION` 是 factual relationship，只属于 `FACTUAL_PROJECTION`。每个 accepted Span 创建一个 `NODE`，其 `fields` 恰为 bound upstream registry 所准入的全部 Profile attribute。因此 `chat` 或 `generate_content` Span 的 node field 必有 `gen_ai.operation.name`、`gen_ai.provider.name`、`gen_ai.request.model`，并带所有 accepted optional `gen_ai.response.model`、token-usage、`error.type`、C57、C30 与 C06 field。恰好在 C57 存在时 Projection 创建一个 `MODEL_ATTRIBUTION`；upstream-valid record 此时必有 provider、request model、C30 与 C06，exact owner/field/relationship 使用上表对应行。没有 C57 时不创建 `MODEL_ATTRIBUTION` resource，但 model-call `NODE` 仍存在。NODE copy 是 Trace detail。任一 class expiry 都不删除、重建或改变另一个 class。

`compatibility` 始终包含全部四个 named field。`family_schema`、`event_name`、`completeness` 各自是 string-or-null；`dimensions` 始终是 array。只有 source contribution 携带时，`event_name` 与 completeness 才 non-null。Dimension membership 必须精确：`usage` 使用 C42–C45，`implementation.summary` 使用 I05/I08/I09/I10，`test.summary` 使用 C28/C29，`review.summary` 与 `FINDING_ASSERTION` 使用 C13/C14，`MODEL_ATTRIBUTION` 使用 `gen_ai.provider.name`/C57/C30/C06；其他 kind 无 dimension。Missing applicable coordinate 只省略对应 dimension entry，绝不删除 compatibility object 的四个 field 之一。

<a id="evidence-query-5"></a>
## 5. Trace resource

`GET /v1/evidence/traces` 要求 `trace_id` 与 `delivery_id` 恰好提供一个；两者皆无或皆有均非法。Delivery filter 只返回带 accepted exact Delivery-root binding 的 Trace，绝不搜索 task、Workflow、Runtime、alias 或 recency。

每个 Trace item 有以下 closed field：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `id` | string | stable Trace item ID |
| `trace_id` | 32-hex string | exact Trace identity |
| `kind` | closed enum | `NODE`、`PARENT_EDGE` 或 `LINK` |
| `source` | Span identity | 记录该 item 的 accepted Span |
| `recorded_at` | timestamp | committed Projection record time；不是 causal inference |
| `truth` | object | Trace detail 的 availability/expiry；completeness 为 null |
| `node` | object 或 null | 只在 `NODE` present |
| `edge` | object 或 null | 只在 `PARENT_EDGE` 或 `LINK` present |

`NODE` 的 `node` 恰好包含 `span_id`、`span_name`、`span_kind`、`start_time_unix_nano`、`end_time_unix_nano`、`span_status`、`span_flags`、`trace_state`、`fields`。两个 nanosecond value 是 upstream unsigned decimal string；`span_kind` 为 `INTERNAL` 或 `CLIENT`；`span_status` 为 `UNSET`、`OK` 或 `ERROR`；`span_flags` 范围 `0..4294967295`；`trace_state` 为 null 或最多 512 UTF-8 bytes 的 exact recorded string。`fields` 最多 73 个 admitted Profile field ID 或 standard OTel name，排除 carrier envelope 与 arbitrary attribute。

`PARENT_EDGE` 的 `edge` 恰好包含 `from` 与 `to`。`LINK` 仅在对应 upstream value 已 recorded 时还包含 `trace_state` 和/或 `flags`；value absent 时 property omitted，不得含其他字段。LINK `trace_state` 存在时是 non-null exact recorded string，最多 512 UTF-8 bytes；LINK `flags` 存在时是 `0..4294967295` integer。每个 endpoint 恰好为 `{ "trace_id", "span_id" }`；`from` 是记录 edge 的 accepted Span，`to` 是 recorded parent 或 link target。即使 `to` 从未 observed，parent/link 仍返回，Query 不制造对应 node。Item discriminator 必须精确：`NODE` 要求 non-null `node` 与 null `edge`；两种 edge kind 要求 null `node` 与 non-null `edge`。

Trace expiry 以 resource 为粒度，因此 bounded expiry batch 可能使一个 Trace 或一次 Delivery traversal 部分可用。Response 新增按 `trace_id` 排序的 `trace_summaries`，对每个 matching accepted Trace 恰好包含 `{ "trace_id", "state" }`。Per-Trace `state` 在全部 retained detail active 时为 `AVAILABLE`，active/expired detail 共存时为 `PARTIAL`，accepted identity 仍在但无 active detail 时为 `EXPIRED`。未知 direct `trace_id` 或没有 exact root binding 的 Delivery 没有 summary。

Response-level `trace_state` required：`trace_summaries=[]` 时为 `ABSENT`；所有 summary expired 时为 `EXPIRED`；所有 summary available 时为 `AVAILABLE`；其他 nonempty mixture 均为 `PARTIAL`。`items` 只含 active recorded node/edge；expired detail 不产生 marker item。`EXPIRED`/`ABSENT` 使用 `items=[]`、`next_cursor=null`。`PARTIAL` 是显式 unavailable，不授权重建 missing detail。

因此 `/traces` success envelope 额外恰好包含 `trace_state` 与 `trace_summaries`。完整 summary array 在同一 snapshot 每页 identical；Delivery traversal 已限制最多 32 Trace，所以 summary 不分页。`AVAILABLE` 或 `PARTIAL` 只有在 cursor 到达末尾后的 continuation page 才可为空；其 initial page 至少有一个 active item。

<a id="evidence-query-6"></a>
## 6. Truth、completeness、availability 与 expiry

`truth` 恰好包含：

| 字段 | 类型 | Closed values |
| --- | --- | --- |
| `completeness` | string 或 null | `FINAL`、`LOWER_BOUND`、`NOT_APPLICABLE`、`UNAVAILABLE`，或 upstream fact 无 completeness claim 时为 null |
| `availability` | string | `AVAILABLE` 或 `UNAVAILABLE` |
| `expiry` | string | `ACTIVE` 或 `EXPIRED` |
| `expires_at` | timestamp 或 null | finite 且 known 时的 exact policy-derived expiry instant；否则 null |

以下 truth table 为 normative：

| Recorded state | Value/detail | `completeness` | `availability` | `expiry` | Required reading |
| --- | --- | --- | --- | --- | --- |
| applicable final fact，包括 explicit numeric zero | present | `FINAL` | `AVAILABLE` | `ACTIVE` | exact owner-reported final fact；zero 只有显式记录才有效 |
| observed applicable lower bound | present | `LOWER_BOUND` | `AVAILABLE` | `ACTIVE` | value 是 lower bound，绝不是 final total |
| fact explicit not applicable | absent | `NOT_APPLICABLE` | `AVAILABLE` | `ACTIVE` | applicable owner 报告不存在 value；retained representation 仍有独立 data lifecycle |
| producer 报告 unavailable/sampled/lost | absent | `UNAVAILABLE` | `UNAVAILABLE` | `ACTIVE` | 无 numeric value；绝不是 zero |
| fact 无 completeness coordinate | 按记录 | null | `AVAILABLE` | `ACTIVE` | 只读 owner-recorded categorical/relationship fact |
| retained identity 证明 detail 被删除 | absent | original value 或 null | `UNAVAILABLE` | `EXPIRED` | event/resource 曾存在；detail unavailable，不是 absent |
| snapshot 中无 accepted identity | 无 resource | 无 item | 无 item | 无 item | 无 Evidence fact；不声明未 observed 的现实 activity |

Expiry 绝不把 `FINAL` 改写成 `UNAVAILABLE`、把 `LOWER_BOUND` 提升为 `FINAL` 或改变 `NOT_APPLICABLE`。Availability 表示 retained representation 是否仍含 value/detail；当 provenance 保留时，completeness 仍是 owner 原始 claim。

C17 必须精确：present accepted `agentops.review.observed.count=0` 产生 numeric zero field；absent C17 不产生 observed-count field，也不产生 synthetic unavailable resource。`LOWER_BOUND` 下的 present zero 仍是 lower-bound claim 下的 recorded zero；只有 `FINAL` 使其成为 final zero。

<a id="evidence-query-7"></a>
## 7. Filter、ordering、snapshot 与 pagination

Query parameter 是 closed allow-list。Repeated parameter、comma-separated list、unknown parameter、empty value、arbitrary field selection、ASCII control byte，以及 decode 后的 value byte `,`、`*`、`%`、`\\` 均非法。不存在 regex、substring、wildcard 或 SQL-like operator；其他 punctuation 只按 exact literal 处理，不具有 operator 语义。

同一 request 上所有 filter 都作 conjunction。`/facts` 的 `event_name` 单独出现时隐式限制为 `EVENT_CONTRIBUTION`；同时给出 `kind` 时必须为该值。`delivery_id` 与 `trace_id` 可以同时出现并选择 exact intersection。`family_schema` 是 exact historical coordinate，不限于当前两个 family value。Query string 按 exact UTF-8 byte 比较，不作 Unicode 或 case normalization。

`/facts` 接受：

| Parameter | 规则 |
| --- | --- |
| `kind` | optional exact Fact-kind enum |
| `event_name` | optional exact closed Observation Profile `1.0.0` EventName；只与 `EVENT_CONTRIBUTION` compatible |
| `family_schema` | optional exact nonempty value，最多 128 UTF-8 bytes |
| `delivery_id` | optional exact nonempty value，最多 256 UTF-8 bytes |
| `trace_id` | optional exact 32 lower-case hex |
| `recorded_from` / `recorded_to` | optional inclusive UTC timestamp；使用 §3 request lexical form；`from <= to`；区间最多 366 days |
| `limit` | optional integer `1..200`；default `100` |
| `cursor` | optional opaque continuation；present 时所有其他 parameter 必须精确重复 first-page normalized value |

`/traces` 恰好接受 `trace_id`/`delivery_id` 之一，并以相同规则接受 `limit` 与 `cursor`。一次 Delivery traversal 在一个 snapshot 中最多 32 个 Trace；超过 bound 返回 `QUERY_BOUND_EXCEEDED`，绝不返回被伪装为 complete 的 truncated success。

Fact 按 `(recorded_at, kind, id)` ascending。Trace item 按 `(trace_id, kind-order, id)` ascending，其中 kind-order 为 `NODE`、`PARENT_EDGE`、`LINK`。排序使用 exact bytewise normalized identity，不使用 locale、label、display name、insertion order 或 inferred causal order。

第一页获取一个 PostgreSQL `REPEATABLE READ READ ONLY` snapshot lease。每个 continuation page 读取同一 transaction snapshot。Opaque cursor 绑定 route、Contract/read-model revision、normalized filter、limit、snapshot lease 与最后 emitted sort key。Cursor 内容必须 authenticated 或 server-side opaque，绝不接受为 caller authority。Normalization 按 parameter name 排序、omitted 时插入 `limit=100`，并把 UTC timestamp filter 渲染为恰好六位 fractional digit 加 `Z`；因此 omitted limit 与 explicit `100`、parameter order、语义相等的 UTC timestamp spelling 具有相同 binding。Cursor request 必须重复 first page 的所有 non-cursor normalized filter；等价的 default limit 可 omitted 或显式给出。

Snapshot lease 有界：default 60 seconds，可配置 10–300 seconds；default 同时 4 个 lease，可配置 1–8，使已批准的 10-connection runtime pool 保留 Admission 与 maintenance capacity。Expired、evicted、restart-lost、unknown、tampered、wrong-route、wrong-filter、wrong-limit 或 wrong-revision cursor 全部 fail closed，绝不从 newest state 重启或静默跳到 approximate key。Client 必须显式开始新 traversal。

针对同一 committed database state 的重复 first-page request 无需复用 token，但必须返回 identical resource 与 ordering。对 live snapshot replay 同一 valid cursor 必须返回同一 page 与 next cursor。Snapshot 获取后的 concurrent Admission 对该 traversal 不可见；commit 后取得的新 first page 可以看到更新的 committed state。Uncommitted/rolled-back state 永不 visible。

<a id="evidence-query-8"></a>
## 8. Error model 与 read-only negative

Error 使用 `application/json`，shape 恰好为：

```json
{"error":{"code":"INVALID_FILTER","message":"bounded non-secret diagnostic"}}
```

`message` nonempty、最多 256 UTF-8 bytes，且不含 SQL、credential、filesystem path、raw payload、body、stack trace 或 driver text。`code` closed 为：

| HTTP | Code | Trigger |
| --- | --- | --- |
| 400 | `INVALID_FILTER` | unknown、repeated、empty、incompatible、malformed 或 out-of-range filter |
| 400 | `INVALID_CURSOR` | malformed/tampered cursor |
| 406 | `NOT_ACCEPTABLE` | client 排除 `application/json` |
| 409 | `CURSOR_MISMATCH` | cursor route/filter/limit/Contract/read-model revision 不同 |
| 410 | `CURSOR_EXPIRED` | snapshot lease expired、evicted 或 restart 后消失 |
| 413 | `QUERY_BOUND_EXCEEDED` | Delivery Trace bound 或其他 published result bound 超限 |
| 405 | `METHOD_NOT_ALLOWED` | 不是 exact `GET` 的 method |
| 404 | `ROUTE_NOT_FOUND` | unlisted path；absent fact/Trace 不是该错误 |
| 500 | `QUERY_INTERNAL` | contained unexpected failure |
| 503 | `QUERY_UNAVAILABLE` | database/snapshot pool unavailable 或 lease capacity exhausted |

Cursor syntax/authentication 失败为 `INVALID_CURSOR`；结构合法且 authenticated，但 lease unknown、evicted、expired 或 restart-lost 时为 `CURSOR_EXPIRED`。GET 携带任何 nonempty body 都是 `INVALID_FILTER`。

Request classification 顺序固定：先匹配 path（unlisted path 为 `ROUTE_NOT_FOUND`），再要求 exact GET（否则 `METHOD_NOT_ALLOWED`），随后依次 reject body、协商 `Accept`、检查 service/lease availability，最后 normalize filter 并验证 cursor。Filter/cursor validation 内先验证 non-cursor filter，再验证 cursor syntax、binding 与 lease lookup。只返回该顺序中的首个失败；error 永不暴露 partial page。

Missing `Accept` 等同 `*/*`。Comma-separated media range 中，只要 `application/json`、`application/*` 或 `*/*` 至少一个具有大于零的 valid `q` 即接受。Media type 与 parameter name case-insensitive；其他 parameter 不改变选择。Exact unquoted `q` lexeme 为 `0`、`0.` 后跟 1..3 位 decimal digit、`1`，或 `1.` 后跟 1..3 个零。因此 `.5`、`1.`、quoted value、sign、value 内 whitespace 与大于一的值 invalid。出现多个 case-insensitive `q` parameter 会使该 range invalid。Invalid value 只使该 range unacceptable。没有 supported positive range 时返回 `NOT_ACCEPTABLE`。

Empty fact result 与 absent Trace 返回 `200`，避免 transport error 冒充 truth。Error 绝不返回 partial `items` page。

Conforming negative test 必须证明：query route 不接受 body/write method；任何 route 都不暴露 Raw、accepted logical record、projection-effect name、database metadata、SQL、credential、arbitrary attribute、remote listener 或 consumer database path。

<a id="evidence-query-9"></a>
## 9. 共享 read-model 与 expiry interface

Query 与 Retention 共享 stable internal semantic port，而非 database table。实现语言可使用 idiomatic 表达，但 operation/value 固定为：

```text
acquire_snapshot(query, filters, limit, clock_now) -> SnapshotPage
continue_snapshot(cursor, clock_now) -> SnapshotPage
read_expiry(resource_class, resource_kind, owner_key, snapshot) -> ExpiryRecord | ACTIVE
plan_expiry(resource_class, policy_revision, cutoff, ttl_seconds, limit) -> ExpiryBatch
apply_expiry(batch_identity, clock_now) -> ExpiryResult
```

`SnapshotPage` 包含 exact Contract/read-model revision、snapshot identity、ordered public resource 与 continuation，不含 SQL row 或 mutable dictionary escape hatch。`ExpiryOwner` 是 public `resource_kind` 与 Projection `owner_key` 的 exact pair；不同 resource kind 的 owner key 不要求互斥。`ExpiryRecord` 包含 resource class、exact ExpiryOwner coordinate、policy revision、expired-at 及区分 expired/absent 所需的最小 bounded tombstone coordinate，不含 expired value/body。`ExpiryBatch` 对一个 policy revision/cutoff/TTL deterministic，并按 `batch_identity` idempotent。

`ExpiryRecord.source` 恰好使用 §3 的 Event/Span source identity。其 `compatibility` 是 ordered bounded pair list：factual marker 保留 §4 exact compatibility coordinate；`DELIVERY_ROOT_BINDING` marker 可额外保留 internal pair `delivery_id`，仅用于在 factual-detail expiry 后继续 exact Delivery traversal；Raw/Trace marker 使用 empty list。该 internal pair 永不出现在 public 四字段 compatibility object 中。

Internal value closed 为：

| Value | Exact field 与 bound |
| --- | --- |
| `SnapshotPage` | `contract_revision`、`read_model_revision`、`snapshot_id`、`resources`（0..limit 个 ordered public resource）、`next_cursor` |
| `ExpiryOwner` | `resource_kind` 与 exact `owner_key`；`owner_key` 遵守 §4 的 1..16 个 bounded scalar；同一 resource class 内 expiry identity 必须是该 pair，绝非裸 owner key |
| `ExpiryRecord` | `resource_class`、`owner_key`、`source`、`resource_kind`、`recorded_at`、`compatibility`、`policy_revision`、`expires_at`、`expired_at`；无 value/body |
| `ExpiryBatch` | `batch_identity`、`resource_class`、`policy_revision`、`cutoff`、nonnegative integer `ttl_seconds`，以及 `members`：0..1000 个 unique、canonical ascending ExpiryOwner value |
| `ExpiryResult` | exact `batch_identity`、nonnegative `selected`/`expired`/`already_expired` count，且 `expired + already_expired = selected` |

`selected` 等于 applied batch 的 exact member count。Plan `ACCEPTED_PROVENANCE`、apply unknown/mixed-class member，或 planned resource 在没有 committed marker 时消失，都会使 internal operation fail，且 marker/scrub 均不 commit；不得返回 partial `ExpiryResult` 或 HTTP query error。

Raw-debug owner 的 `resource_kind` 为 `RAW_DEBUG`；Trace detail 使用 public Trace kind（`NODE`、`PARENT_EDGE`、`LINK`）；factual projection 使用 §4 的九个 public Fact kind 之一。Internal projection-effect name 绝不是 port value；`MODEL_ATTRIBUTION` 只在 `FACTUAL_PROJECTION` 合法。

Batch canonical bytes 使用 versioned framing `evidence-expiry-batch-v1`：先写该 literal 的 UTF-8 bytes 加 LF；不加 outer container，随后依次写 `resource_class`、`policy_revision`、恰好六位 fractional digit 与 `Z` 的 UTC `cutoff`、integer `ttl_seconds` 及 member array 的 scalar encoding。每个 scalar encoding 都以 LF 结束：null=`n`+LF；boolean=`b0`/`b1`+LF；integer=`i` 加 canonical base-10+LF；finite number=`f` 加 IEEE-754 binary64 big-endian bits 的 16 位 lower-case hex+LF；string=`s` 加 UTF-8 byte length、colon、exact UTF-8 bytes、LF。Array 编码为 `a` 加 decimal element count+LF，再接各 element encoding。每个 member 是二元素 array `[resource_kind,owner_key]`；member 唯一，并按该完整 array encoding 的 bytewise lexicographic order 排序。不作 Unicode normalization。`batch_identity` 是这些 exact bytes 的 lower-case SHA-256 hex。相同 input 重新 plan 得到相同 identity；任何 cutoff、TTL、kind、scalar type/value 或 member 改变都改变 canonical input。再次 apply 同一 identity 时，每个已 committed member 报为 `already_expired`，无第二次 mutation。同一 class 下两个 resource 可以有相同裸 owner key；因 `resource_kind` 不同仍独立寻址。

Closed `resource_class` enum 为 `RAW_DEBUG`、`ACCEPTED_PROVENANCE`、`TRACE_DETAIL`、`FACTUAL_PROJECTION`。

- `RAW_DEBUG` maintenance scrub/delete bounded diagnostic/logical payload，同时保留 accepted identity/digest/profile/family provenance。
- `ACCEPTED_PROVENANCE` immutable 且无 automatic expiry operation；尝试 expiry 时 fail closed。
- `TRACE_DETAIL` 只删除 Trace node、parent edge、link 及其 node-local field copy，并写 bounded expiry marker；绝不删除 `MODEL_ATTRIBUTION`。
- `FACTUAL_PROJECTION` 只删除 factual contribution/relationship projection，并写 bounded expiry marker。

Port implementation 可使用 retention-owned table/migration 与 existing core row，但不得重写 Wave3 core schema、修改 accepted identity/digest/provenance、向 Query 暴露 storage representation，或在一个 implicit deletion 中耦合两个 resource class。当前与 accepted identity 同表的 Raw payload 分类为 `RAW_DEBUG`；scrub 它不修改 immutable identity/digest/profile/family tuple。

每个 read 使用一个 committed snapshot。每个 expiry batch 是一个 transaction：delete/scrub 与 expiry marker 同时 commit 或同时不发生。Concurrent reader 看到完整 pre-expiry resource 或完整 expired representation，绝不看到没有 tombstone 的 missing gap。Distinct identity 的 concurrent Admission 独立；expiry 后 same-identity retry 继续比较 retained digest，绝不重建 expired detail。

Shared clock 是 injected UTC clock。Caller 每 batch 计算一次 `cutoff = clock_now - ttl_seconds`，并把 cutoff 与 exact `ttl_seconds` 写入 batch identity。Resource 恰好在 lifecycle base `<= cutoff` 时 inclusive eligible，等价于 `base + ttl_seconds <= clock_now`。Planning 先按 public `resource_kind`，再按 exact stored compact UTF-8 JSON owner-key bytes 排列全部 eligible unmarked resource，两者均 bytewise ascending，选前 `limit`；随后 `ExpiryBatch.create` 按上述 canonical member-byte order 排序。Raw 还必须在同一 accepted transaction 已 committed successful Projection 后才 eligible；只有 accepted identity 而无 committed Projection 时绝不选择 Raw scrub。每个 member 的 `expires_at = base + ttl_seconds`；committed marker 保留该 eligibility instant 与 actual `expired_at`。Database wall clock、process uptime、file mtime 与 client time 都不是 policy authority。

<a id="evidence-query-10"></a>
## 10. Lifecycle default 与 configuration

首个 local release 使用以下 closed default：

| Class | Default | Configurable range | Result |
| --- | --- | --- | --- |
| `RAW_DEBUG` | successful import/projection 后 `PT0S` | `PT0S..P1D` | default 立即 scrub；永不可 query |
| `ACCEPTED_PROVENANCE` | `NEVER` | fixed，不可配置 | 保留 immutable identity/digest/profile/family provenance |
| `TRACE_DETAIL` | `P30D` | `P1D..P365D` 或 `NEVER` | 独立过期 Trace detail，并暴露 `EXPIRED` |
| `FACTUAL_PROJECTION` | `P365D` | `P30D..P3650D` 或 `NEVER` | 独立过期 factual value/relationship，并暴露 unavailable/expired resource |
| maintenance batch | `500` resources | `1..1000` | 一个 bounded expiry transaction |
| scheduler interval | `60` seconds | `10..3600` seconds | eligibility scan cadence；不是 expiry truth |

Duration 只接受 exact ISO 8601 whole-day value，`PT0S` 除外；month/year 因长度依 calendar 变化而禁止。`NEVER` 是唯一 infinite literal。上下 bound inclusive。

配置仅来自 startup 时 validated Evidence process environment，并投影为 revision `1.0.0` 的 immutable `RetentionPolicy`。Exact environment variable 为 `WSR_EVIDENCE_RAW_DEBUG_TTL`、`WSR_EVIDENCE_TRACE_DETAIL_TTL`、`WSR_EVIDENCE_FACTUAL_PROJECTION_TTL`、`WSR_EVIDENCE_RETENTION_BATCH_SIZE`、`WSR_EVIDENCE_RETENTION_INTERVAL_SECONDS`；accepted provenance 没有 variable。Missing variable 使用 default。Invalid literal、out-of-range value 或任何 unsupported accepted-provenance retention variable 都在 listener/database effect 前使 startup fail。Runtime reload 不改变 in-progress batch/snapshot；显式 restart 后，后续 batch 绑定新的 exact policy value。改变 meaning 或 closed class set 必须产生新 policy revision。

Expiry 是 eligibility，不是 deadline guarantee。只有 committed expiry batch 真正删除 detail 后，resource 才从 `ACTIVE` 变为 `EXPIRED`。Query 不得仅因 `expires_at` 已过而报告 `EXPIRED`。Active 时可以显示 `expires_at` 作为 policy-derived eligibility instant。

Lifecycle base instant：`RAW_DEBUG` 使用 `accepted_at`，Trace/factual resource 使用 Projection `recorded_at`。Startup policy 以该 immutable base retroactively 作用于所有仍 active 的 resource：显式 restart 后缩短/延长 TTL 会改变其 displayed eligibility 与后续 planning，但绝不让已 committed marker unexpire。Expired public Fact 报告 marker 保留的 `expires_at`，不按后续 process policy 重算；`expired_at` 仍是 internal provenance。`NEVER` 的 public `expires_at` 为 null 且不产生 batch。

<a id="evidence-query-11"></a>
## 11. Compatibility 与 versioning

Compatibility tuple 为 `(contract.name, contract.revision, observation_profile, read_model_revision)`。Consumer 必须绑定四个值，并对 unsupported tuple fail closed。

- Contract PATCH：不改变 JSON meaning 的文字或验证修正。
- Contract MINOR：optional endpoint/resource field 或 optional filter；old consumer 只有显式声明该 policy 后才可忽略；revision `0.x` 仍为 pre-release。
- Contract MAJOR：改变 field meaning、authority、required field、route、pagination/snapshot rule、error mapping、closed enum、truth table 或 lifecycle default/range。
- Observation Profile 或 read-model revision 是独立 coordinate，绝不静默 alias older tuple。

Revision `0.1.0` 禁止 unknown response field，因此未显式支持 later MINOR 的 consumer 必须拒绝，而非假定兼容。Fact 不因 query Contract 改变而 migration/rewrite；adapter 按 requested supported tuple 选择 representation。

<a id="evidence-query-12"></a>
## 12. Conformance oracle 与 reopen condition

Candidate implementation 与后续 machine representation 必须证明：

| Scenario | Required result | Forbidden result |
| --- | --- | --- |
| committed vs uncommitted record | 只见 committed complete resource | half-state 或 dirty read |
| C17=`0`、C17 absent、C17 positive | numeric zero、无 observed-count field、exact positive | absence 转换为 zero/unavailable |
| four completeness states | §6 exact table | N/A/unavailable 出 numeric value 或提升为 final |
| detail expiry | retained identity 加 unavailable/expired representation | event 被当成从未 accepted |
| Trace expiry | `trace_state=EXPIRED`，无 invented node/edge | `ABSENT` 或 reconstructed Trace |
| partial/mixed Trace expiry | exact per-Trace summary 与 response `PARTIAL`；只返回 active item | 隐藏 expired Trace/resource 或 reconstructed detail |
| parent/link 缺 endpoint | exact recorded edge | inferred endpoint 或 dropped edge |
| incompatible unit/source/completeness | separate resource/group | conversion 或 cross-sum |
| stable pagination | 同一 live snapshot/cursor 返回 identical page；排除 later commit | duplicate/skip/newest-state fallback |
| cursor expiry/restart/tamper | bounded typed error | approximate continuation |
| unknown filter/method/body | bounded typed error、zero state effect | permissive ignore 或 write route |
| concurrent expiry/read | whole pre-expiry 或 whole expired view | 无 tombstone 的 transient absence |
| 两个 resource kind 使用相同 owner key | 按 exact ExpiryOwner pair 独立 plan/read/apply | collision、winner selection、coupled expiry 或对合法数据 fail |
| batch digest vector 与 policy restart | exact framed byte/TTL/base instant，且 preserved expired eligibility | language-local JSON digest 或按后续 policy 重算 marker |
| expiry 后 same-identity retry | digest-based duplicate/conflict；不重建 detail | accepted payload rehydration |
| listener/database boundary | loopback API only；无 external PostgreSQL/consumer credential | remote listener 或 direct SQL path |

若任何 field、enum、default、error、endpoint、ordering 或 ownership rule 仍留给 Wave7/8/9 选择；stable snapshot 需要改变 Wave3 core transaction/schema；expiry 需要改写 accepted identity/provenance 或 coupled deletion；或实现需要新 dependency、formula、inference、authentication、remote exposure 或 non-factual data，则 semantic review 必须重开本 candidate。
