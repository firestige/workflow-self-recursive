# BI 系统——Iteration 5 Consumer 与 UI 设计

> **状态：** G1 评审候选，2026-08-27。英文 [`bi-system.md`](bi-system.md) 为规范权威，本文为中文跟踪译本。本设计只消费 published contract，不修改它们。

## 1. 权威与冻结坐标

BI 是 presentation consumer，不拥有 Observation 事实或 Metric 公式。

| 坐标 | 精确输入 |
|---|---|
| Evaluation | `agentops.evaluation.metric-catalog@1.0.0`；semantic digest `sha256:6dbb4375507a3a2eebbe5e86bb6f0a40ebf811790f55ee841b15c6942e1f159d` |
| Evidence Query | `evidence.query@0.1.0`；read model `1.0.0`；Observation Profile `1.0.0` |
| Query publication | `sha256:feb0186da48661d2663b03d20e536f470b591ea22f21a34a4ca99bfcc33204e9` |
| Evaluation publication | `sha256:1967dd9625b572ff6411edc19533cd32144cdedf3e526cb8460f39f688cf5014` |
| 展示栈 | React SPA、浏览器内 TypeScript evaluator、D3.js 可视化、Tailwind CSS 样式 |

权威顺序：owner 已确认产品意图；Metric Catalog 拥有公式和读法；Observation Catalog/Profile 拥有事实语义；Evidence Query 拥有读取表示、truth、expiry、compatibility 和 pagination；本文只拥有 BI-local 输入、展示和有界 client 行为。有歧义时输出 unavailable，禁止推断。

## 2. 系统边界

```text
evaluation-context.json ──只读──┐
                               v
Browser ──同源 GET──> bi-app Nginx ──Docker DNS GET──> Evidence ──私网──> PostgreSQL
  │                              │
  └─ React view <─ typed result <─ 纯 TypeScript evaluator
```

- `bi-app` runtime 只有 Nginx、committed `dist` 和 Nginx 配置；没有 Node 或其他业务 server。
- 浏览器只经 Nginx 调用同源 `/v1/evidence/facts` 与 `/v1/evidence/traces`。
- Nginx 只代理这两个 GET 路径，不计算 metric、不持久化状态、无数据库 client。
- PostgreSQL 只对 Evidence 可达；Evidence 只在 Compose 私网可达；只有 Nginx 发布默认绑定 `127.0.0.1` 的 host port。
- MVP 不虚构 application auth/RBAC。远程/公网访问是 user-owned override，TLS、认证、防火墙和风险均由用户负责。
- Iter5 不出现 `workflow-builder`/`intake-sidebar` 的 package、route、component、image 或 job。

## 3. Consumer contract

### 3.1 Request

| Route | BI 用途 | Filter 与 bound |
|---|---|---|
| `GET /v1/evidence/facts` | factual 输入、provenance、compatibility、relationship | 精确 filter；初始 `limit=100`；用户最多选 `200` |
| `GET /v1/evidence/traces` | 单一精确 Trace 或 Delivery traversal | `trace_id`/`delivery_id` 恰好一个；初始 `limit=100`；Delivery 最多 32 Traces |

Request 带 `Accept: application/json`，无 body、无 credential。Filter 使用精确 identity，禁止 display alias。Client 不调用 Raw、write、SQL 或内部 Projection route。

### 3.2 Response 接受

统一 decoder 在暴露 item 前验证整份 closed response，必须精确满足：

- `contract={name:"evidence.query",revision:"0.1.0"}`；
- `observation_profile="1.0.0"`、`read_model_revision="1.0.0"`；
- required field、closed enum、scalar bound 与 cross-field truth rule；
- 任意层都没有 unknown field；
- snapshot/cursor 稳定且 item 数不超过 request。

Unknown field、later/unknown revision 或非法 truth tuple 使整份 response 成为 typed `INCOMPATIBLE`。不保留被拒 raw bytes，不向 React/D3 暴露局部 item。

### 3.3 Transport bound

- 单次 request timeout：5 秒。
- Browser client 接受的 response body 上限：4 MiB；超限为 `RESPONSE_BOUND_EXCEEDED`，不 decode 局部 body。
- 不自动遍历 page；用户显式加载每个 next page。
- 单次 traversal 最多 8 页；达到上限后要求缩小 filter 或新开 traversal，禁止把 prefix 标为完整。
- Continuation 必须重复 normalized filter/limit；cursor mismatch/expiry 不自动切到当前最新状态。
- 成功空 Facts 是 `ABSENT`；absent Trace 是 contract 的 `trace_state=ABSENT`。HTTP/query failure 绝不是 absence。

### 3.4 Error disposition

| Upstream | BI 输出 |
|---|---|
| `INVALID_FILTER`/`INVALID_CURSOR`/`CURSOR_MISMATCH` | typed request error 与修正操作 |
| `CURSOR_EXPIRED` | 标记 traversal expired，显式新开 traversal |
| `QUERY_BOUND_EXCEEDED` | bounded result unavailable，要求缩小范围 |
| `QUERY_UNAVAILABLE`/timeout/refusal | `ERROR`；旧 typed result 只能显式标 stale，不能冒充当前值 |
| `QUERY_INTERNAL`/malformed body | `ERROR`，只显示 bounded diagnostic |
| unknown revision/field/tuple | `INCOMPATIBLE`，不展示任何 response item |

## 4. BI-local evaluation context

四项 Catalog 读法需要 Evaluation-owned membership 或 event-time assignment。浏览器接收 media type 为 `application/json`、schema identity 为 `wsr.bi.evaluation-context@1.0.0` 的本地只读 manifest：

```text
schema, context_id, context_version, content_digest,
catalog_coordinate, catalog_semantic_digest, as_of,
tasks[] = { task_id, delivery_ids[], cohort_coordinates[],
            event_time_role_template? = {id, version, digest} }
```

- `content_digest` 是只删除 `content_digest` 后的 RFC 8785 canonical JSON 的 SHA-256。
- Catalog coordinate/digest 必须等于 §1；unknown field、重复 task/Delivery identity fail closed。
- `as_of` 是精确 UTC cutoff；membership/assignment 对一个 manifest version 不可变。
- Cohort coordinate 是 closed key/scalar pair，按 scalar type/value 精确比较。
- Manifest 只声明 membership 与 event-time assignment；不复制 Observation fact，也不声明 terminal outcome。
- Evaluator 按 Metric Catalog §6.2，以 member Delivery 的精确 terminal fact 推导 unique terminal-task outcome；open、mixed、missing 都输出 Catalog exclusion reason。
- 禁止 alias、recency lookup、ambient discovery、later backfill 或“latest template” fallback。
- Manifest 缺失/非法只使依赖它的 metric unavailable，不影响独立 factual/Trace 查看。

这是 BI deployment operator 所有的 BI-local 输入，不是 cross-system contract，也不发送或存入 Evidence。

## 5. 展示语义

### 5.1 状态词汇

| UI state | 含义 | Value 表达 |
|---|---|---|
| `LOADING` | 当前 request 尚无 accepted response | skeleton；旧值不得作为当前值 |
| `AVAILABLE` | compatible active value 存在 | 展示精确值与 truth coordinates |
| `LOWER_BOUND` | owner 记录 lower bound | 展示 `≥` 与“不是 final total” |
| `NOT_APPLICABLE` | owner 显式报告 N/A | 展示 N/A 与 owner reason |
| `UNAVAILABLE` | required value/detail 不可用 | 破折号与 missing reason，绝不补零 |
| `EXPIRED` | identity/provenance 保留，detail 删除 | 展示 expired identity 与 unavailable detail |
| `INCOMPATIBLE` | tuple/revision/field 无法消费 | 拒绝整份 response，展示 expected/received coordinate |
| `ERROR` | request/transport/service failure | typed error 与 retry，不改写为 truth |

显式 numeric zero 用普通 value typography 并带“explicit recorded zero”可访问标签；absence 用破折号。Color 只作冗余提示，每个状态必须有文字和 icon/shape。

Coverage 总是显示 numerator、denominator、raw ratio、state、alert。Minimum-sample failure 只隐藏 metric value，coverage 继续可见。禁止 total score、rank、recommendation、hidden weight、implicit conversion 或 causal copy。

### 5.2 Factual semantic inventory

信息优先级：metric/revision；value state；coordinate/filter window；numerator/denominator 与 coverage；unit/source/cost basis；compatibility；provenance；uncertainty/forbidden reading；item table。

用户操作仅为 exact filter、metric 选择、table/chart 切换、inspect provenance、load next page、retry 和 fresh traversal。Chart/table 消费同一 evaluator result；view 不含 formula。

Chart 只在 declared display window 展示 recorded value。可连接 compatible point 以提高可读性，但必须标记 descriptive only，在 incompatible/unavailable point 断开且不画 causal arrow。Table 是 exact value 与 keyboard fallback。

### 5.3 Trace semantic inventory

Trace page 接受精确 Trace/Delivery identity，展示 response/per-Trace state、recorded `NODE`/`PARENT_EDGE`/`LINK`、item truth/expiry、detail/provenance、pagination 和 refresh/error。

- 只有 API item identity 能创建 graph item。
- `PARENT_EDGE` 用实线 cyan，`LINK` 用虚线 amber；accessible name 包含 recorded kind。
- `from/to` 无 observed NODE 时显示 diamond “endpoint not observed”，不得制造 NODE。
- Duplicate identity 只在 decoder 接受 identical detail 时 collapse；冲突拒绝整份 response。
- Layout 以 kind 与 exact item identity stable hash 作 deterministic seed；time/name/task group/list position 都不能创建或选择 edge。
- Time 只进 detail panel；明确说明 visual proximity 无因果意义。
- `PARTIAL`/`EXPIRED` 展示 contract summary，不重建 expired detail；`EXPIRED` 绝不当作 `ABSENT`。

## 6. 视觉方向与布局

视觉方向是沉静、dark、data-dense 的本地 observability console：charcoal canvas、slate panel、off-white text、cyan 表示 recorded/available、amber 表示 partial/lower-bound、muted red 表示 error/expired。禁止 neon、glass、巨型 KPI、只靠红绿灯和交易盘语言。

Style frame：

- [Factual dashboard](assets/style-frame-factual.svg)
- [Recorded Trace](assets/style-frame-trace.svg)
- [Unavailable/partial states](assets/style-frame-truth-states.svg)

Desktop 使用 12-column grid：shared header/filter、主 chart/graph、右侧 inspection rail、semantic table。低于 768 px 时依次单列：context、state/value、visualization、provenance/detail、table/action。不得隐藏内容；chart 只有在其 table alternative 之后才能横向滚动。

```text
Factual: [header/routes] [exact filters] [value + D3 trend | reading/provenance] [semantic table]
Trace:   [header/routes] [identity + snapshot] [D3 graph | item detail] [summaries + pager]
Empty:   [context retained] [state/reason] [next action] [last provenance（若有则显式 stale）]
```

## 7. Component map

| 层 | Component | 边界 |
|---|---|---|
| page composition | `BiShell`、`FactualPage`、`TracePage`、`InspectionRail` | 只负责 route/layout |
| visual primitive | `Panel`、`Stack`、`Inline`、`DataTable`、`IconButton`、token | 无 domain state |
| semantic component | `TruthBadge`、`CoverageReading`、`CompatibilityBlock`、`ProvenanceBlock`、`UnavailableValue`、`TypedError` | 只接 typed domain value；无 formula |
| domain visualization | `FactualTrend`、`RecordedTraceGraph` | 只做 D3 geometry，接 precomputed node/series |
| domain module | Evidence decoder/client、context decoder、evaluator、Trace graph model | 不 import React |

所有 component 都是 BI-local；无 shared product shell 或未来交付物 API。只有 BI 内已出现真实重复才能提取抽象。

## 8. Accessibility 与 deterministic review

- 全部操作支持 keyboard、visible focus、logical DOM order。
- Chart 通过相邻 semantic table 暴露 metric、state、point、unit。
- Trace item 有与 graph selection 同步的 list/tree；edge kind 与 unresolved endpoint 可被朗读。
- 状态不依赖颜色；最低对比目标 WCAG 2.2 AA。
- Reduced-motion 关闭动画；resize 只改变 geometry，不改变 data order/meaning。
- Browser test 在 1440/1024/390 CSS px 断言语义；screenshot golden 只辅助，不替代 DOM/accessibility assertion。

## 9. 独立性 qualification 设计

Wave7 在 Observation disabled、无 listener、refusal、timeout、ambiguous/tail-loss 之间比较以下冻结 Execution result projection：

```text
result.kind
terminal.outcome
terminal.reason
result.knowledge
result.disposition
result.contentIdentity
publication.disposition
```

Canonical digest 是以上字段 RFC 8785 canonical JSON 的 SHA-256。Ignore list 仅限 Delivery ID、correlation ID、checkpoint ID、Observation diagnostic identity、telemetry timestamp，失败后不得扩大。

Test-only mutant 在 Observation failure 时改写 `terminal.outcome`，oracle 必须 RED。External producer 只用 published OTLP fixture bytes 与 Evidence `0.1.0`，不 import Execution。Static/runtime 检查拒绝 shared DB、receipt、outbox、callback、Evidence-controlled Delivery transition。

## 10. Planned owned surface 与 critical path

Wave2 只能机械冻结 exact path，不改变 owner：

- `wsr-ui/packages/bi/**`：BI source/test/fixture/style token/browser qualification。
- `wsr-ui/packages/bi/Dockerfile` 与 BI-owned Nginx config/source-build check。
- superproject `qualification/iter5/independence/**`、完整 `pg + evidence + bi-app` Compose/E2E、`.gitmodules`、`wsr-ui` pin。

Wave2–9 严格串行估算 6.75 天：分别为 0.75、1.25、1.0、0.75、1.0、0.75、0.6、0.65 天。估算不含 scope/contract change，也没有 parallel lane；dependency failure、contract gap 或 product choice 必须返回 owner。

## 11. G1 请求批准内容

G1 批准：`/factual`、`/trace` SPA route；browser-only evaluator；§4 manifest schema/digest；5 秒/4 MiB/8 页 bound；§5 state vocabulary；recorded-only deterministic Trace model；style frame、responsive wireframe、component boundary；§9 independence projection/ignore list；6.75 天串行估算。

批准不授权新 cross-system contract、backend、registry publication、remote listener、auth 承诺、database path、未来 UI artifact 或推断的 metric/edge；出现任一项都 BLOCK Wave2。
