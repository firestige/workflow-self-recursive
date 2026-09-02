# WSR Trace Renderer 参考与编译边界

> 状态：研究结论已归并到 [`docs/systems/bi/bi-studio-ui-ux-design.md`](../../../../docs/systems/bi/bi-studio-ui-ux-design.md)。本文保留 authority/research 推理；此前 `trace-impressions.html` 与 `trace-motion-candidate.html` 只作为被否决探索保留，不是实现候选。

## 1. 结论

WSR Trace 的默认阅读模型应是 APM span waterfall，而不是 architecture/structure graph：左侧是可展开的 parent/child Span 树，右侧是以 trace start 为零点的共享时间轴，每个 bar 的位置和宽度严格来自 `start_time_unix_nano` / `end_time_unix_nano`。选中 Span 后打开 detail inspector，展示 exact identity、kind、status、duration、fields 和独立 Span Links。

Archify 只贡献生成和渲染工程经验：LLM 生成 typed JSON IR、确定性 compiler/validator、mode-specific renderer、稳定 identity/geometry、viewer state 与 canonical artifact 分离、last-good preview、可复验 quality gates、finite motion governor。它的 architecture visual grammar 不进入 Trace renderer。

## 2. 官方产品参考矩阵

| 参考 | 单 Trace 默认/主要视图 | 采用 | 不直接采用 |
|---|---|---|---|
| OpenTelemetry | Trace 是由 parent-child 形成的 Span DAG；Span 有 name、parent、start/end、kind、status、attributes、events、links | OTel 字段和 identity/truth 是 renderer IR 的语义来源；waterfall 表达嵌套和时间 | 不从 layout、相邻、缺失 Span 推断边或事件 |
| Apache SkyWalking Horizon | Default = 跨 segment 拼接的 span waterfall；Tree 与 Statistics 为切换视图；span kind glyph、component icon、duration、error/event marker、detail panel | Default/Tree/Statistics 的视图分工；waterfall 默认；span detail；跨 segment 仍按 parent ref | 当前 WSR 没有 component/service 完整 vocabulary 时不伪造 icon/service color |
| Grafana Trace View / Tempo | Header、search、minimap、tree timeline rows、duration bar、span detail、filters；可突出 critical path | header/minimap/tree row/timeline/detail；focus 只改变 viewport | critical path 需要批准的确定算法/authority，本轮不计算 |
| Jaeger UI | Trace timeline、summary、minimap、可折叠 header，支持 embedded view | compact embed、summary/minimap、collapse hierarchy | 不复制 Jaeger chrome 或 query model |
| Datadog APM | Flame Graph、Span List、Waterfall、Map；支持 span focus、minimap、search、error highlight、span links | 大 Trace focus、search、error/status、links detail、有限 preview 思路 | 没有权威 service identity 时不提供 Map；不做 vendor AI/impact 推断 |
| Elastic APM | Timeline waterfall、span detail、distributed trace markers、missing/dropped span 明示 | 时间轴与 incomplete/partial 明示 | 不承诺当前 Evidence 未发布的 stack/log correlation |

Primary sources:

- https://opentelemetry.io/docs/concepts/signals/traces/
- https://opentelemetry.io/docs/specs/otel/trace/api/
- https://skywalking.apache.org/blog/2026-06-22-horizon-ui-trace-explorer/
- https://grafana.com/docs/grafana/latest/visualizations/explore/trace-integration/
- https://www.jaegertracing.io/docs/2.0/frontend-ui/
- https://docs.datadoghq.com/tracing/trace_explorer/trace_view/
- https://www.elastic.co/docs/solutions/observability/apm/trace-sample-timeline

## 3. 当前 WSR authority 能画什么

`evidence.query@0.1.0` 的 `TraceNode` 已发布：

- `(trace_id, span_id)` exact identity；
- `span_name`、`span_kind`（当前 closed 为 `INTERNAL | CLIENT`）；
- `start_time_unix_nano`、`end_time_unix_nano`；
- `span_status`（`UNSET | OK | ERROR`）、flags、trace_state；
- bounded `fields[]`；
- 独立 `PARENT_EDGE` 与 `LINK` records；
- page/record truth 与 `AVAILABLE | PARTIAL | EXPIRED | ABSENT` lifecycle。

因此本轮可实现：

1. 精确时间定位的 waterfall；
2. parent/child tree、collapse/expand；
3. duration、relative offset、status/kind 与 partial/unresolved；
4. Span detail fields；
5. 独立 LINK 标记和 linked endpoint navigation；
6. trace summary、minimap、search/focus；
7. reader-controlled recorded-time scan motion。

当前不能承诺：service map、resource attributes、span events/logs、stack trace、critical-path 推导、跨信号 logs/profiles correlation。只有未来 contract/query 返回相应 authority 后才能启用。

当前 `projectRecordedStructure()` 把 TraceNode 投影成 label/kind/status/truth，丢弃了 start/end、duration、fields、flags 和 trace_state。修正必须替换这一 lossy projection；不能让 renderer 从 DOM 顺序或 synthetic duration 补回。

## 4. Trace JSON IR 候选

Compiler 输入直接来自验证通过的 Evidence page；输出 closed、versioned、render-only IR：

```json
{
  "ir": "wsr.trace-view@1",
  "trace": {
    "trace_id": "…",
    "start_unix_nano": "…",
    "end_unix_nano": "…",
    "duration_nano": "…",
    "state": "PARTIAL"
  },
  "spans": [{
    "identity": { "trace_id": "…", "span_id": "…" },
    "parent_span_id": "…",
    "name": "…",
    "kind": "CLIENT",
    "start_offset_nano": "…",
    "duration_nano": "…",
    "status": "OK",
    "truth": { "availability": "AVAILABLE", "expiry": "ACTIVE" },
    "fields": []
  }],
  "links": [],
  "unresolved_endpoints": []
}
```

Compiler 负责验证/投影，不负责推断：

- start/end 必须是可解析非负整数，`end >= start`；duration 使用整数相减并保留 exact nano string；
- trace bounds 来自实际 Span min(start)/max(end)，但必须明确标为 view bound，不冒充 owner-published root duration；
- parent edge endpoint 必须 resolve 到同一 trace 的 exact Span；缺失 endpoint 进入 unresolved，不重挂到最近节点；
- parent cycle、重复 identity、冲突 node/edge、越界 response fail closed；
- sibling 顺序使用确定键 `(start, end, span_id bytes)`，仅为显示稳定性，不声明 causal order；
- LINK 与 parent edge 分开存储和渲染；
- compiler 不创建 service、event、critical path、error body 或 span content。

## 5. Renderer 与交互

### Default: Waterfall

- Header：root/name fallback、trace ID、view duration、start、Span/Error/Unresolved counts、lifecycle。
- Minimap：完整 trace 的 condensed bars；拖选或 click-to-focus 只改变 viewport，不改 IR。
- Row：expand/collapse、depth connector、kind glyph、span name、status、exact/rounded duration、time-positioned bar。
- Inspector：exact identity、start/end/duration、kind/status/truth、fields、parent、children、LINK。
- Partial：缺失 parent/endpoint 保持显式 placeholder；不能把空洞压平。

### Tree: call-tree inspection

- 与 Waterfall 消费同一份 `wsr.trace-view@1` IR；不重新解析 Evidence，也不创建第二套 truth。
- 确定布局为 left-to-right parent depth；同层使用 `(start, end, span_id bytes)` 稳定排序。每个节点直接呈现 Span kind、name、status、start offset、duration 和同一 trace domain 的 micro timeline。
- 节点 focus 打开 Span Passport；`Ancestors`、`Descendants` 与 root-to-focus path 只沿 exact `PARENT_EDGE`，返回 count-bearing receipt，不使用 impact/reach/causality 扩张词汇。
- exact relationship 可以 pin：`PARENT_EDGE` 与 `LINK` 使用不同语义和样式；LINK 不改变 depth，不混入 ancestor/descendant lens。
- Semantic Camera/minimap、pan/zoom 和 focus URL 都是 viewer state，不进入 IR/canonical export；相同 IR 必须得到相同 node/edge geometry。
- recorded-time motion 与 Waterfall 共用一个 Motion Governor；节点依据 exact start/end active/settled，edge signal 只沿已记录关系运行。
- 交互候选已迁入文档资产: [`studio-trace-tree-candidate.html`](../../../../docs/systems/bi/assets/studio-trace-tree-candidate.html)。

### Other optional views

- Statistics：只对当前 trace 的同名 Span 做 count/total/average/max；若认定这超出 presentation transform，则 defer。
- Raw：无损表格/JSON 作为 Advanced fallback。
- Service Map：defer，直到 service/resource identity 成为 contract field。

### Motion

Motion 候选是 recorded-time scan，不是“按深度讲结构”：

- 默认 Still，所有 Span 与 bar 完整可读；
- reader 主动 Play 后，playhead 按 trace view bound 从 0 移动到 100%；Span 在 exact start 被激活、在 exact end 后 settled；
- motion 不生成 Span、不延长/缩短 bar、不将 LINK 当 parent、不播放未记录事件；
- Pause/seek/manual focus 立即取得控制权；播放有限结束；hidden/print/export/reduced-motion 同步收敛为 Still；
- reduced-motion 下仍允许 instant seek/manual inspection，不自动移动 playhead。

## 6. 从 Archify 吸收的 renderer discipline

- LLM 只产出/修订 typed fixtures、layout intentions 和测试素材；runtime truth 不经 LLM。
- 每类图有专用 renderer；不把 generic graph auto-layout 当产品。
- compiler 输出稳定 semantic IDs 与 deterministic row geometry；相同 IR 重渲染不漂移。
- validation 在交付前检查 timeline overlap、label/bar clearance、min target、overflow、long trace bounds、theme/a11y、reduced motion。
- viewer-only focus/playhead/minimap selection 不进入 canonical IR/export；static export 保留完整 settled truth。
- failure 产生 machine-readable rule code、exact subject、measured evidence 和有限 supported fixes；last-good preview 不被坏候选替换。

## 7. 资格门禁新增项

- 用相同 IR 重渲染，row identity/order/bar geometry byte-stable 或在固定 rounding contract 内稳定；
- nano 大整数计算无 Number 精度丢失；零 duration、重叠 sibling、跨 trace LINK、missing parent、cycle、partial/expired 均有 fixture；
- 320px/200% zoom 下默认 outline/list 可用，Desktop waterfall 无全页横向溢出；
- 100/1,000/upper-bound Span 在固定 runner 下验证 layout、interaction、memory 与 input latency；
- timestamp 改变必须相应改变 bar geometry；仅输入顺序改变不得改变 identity/order/geometry；
- Still、Play、Pause、seek、complete、hidden、reduced-motion、print/export 全部有确定状态机测试。
