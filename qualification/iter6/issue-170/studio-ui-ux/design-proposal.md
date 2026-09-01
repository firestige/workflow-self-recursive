# #170 WSR Studio BI UI/UX 修正提案

> 状态：Dashboard 整体布局、“第一 row = 标题 + 内部组件导航”、Trace Waterfall 与 Trace Tree 方向已进入 owner 评审候选；正式落地规范和已迁移的设计资产见 [`docs/systems/bi/bi-studio-ui-ux-design.zh-CN.md`](../../../../docs/systems/bi/bi-studio-ui-ux-design.zh-CN.md)。本文只保留评审过程，不单独授权实现或 stable promotion。
> 来源：2026-09-01 人工 E2E 截图验收、`docs/systems/bi/bi-ui-design.md`、当前 `wsr-ui-core@0.1.0-rc.0` 与 `wsr-dsh` adapter。

## 1. 验收结论

当前 WSR Studio 不是原 BI 设计的合格实现。原设计已经规定 dashboard composer、preset、有限 panel 尺寸/重排、响应式 canvas、深浅主题等价和 Evidence → Recorded Trace 下钻。当前产品只把每个 Metric Result 依次交给 `MetricPanel`，导致：

- layout schema/controller、`PRESET_LAYOUTS` 与 commands 没有进入 `wsr-ui-core` public surface，Host 无法用自己的 control panel 提供调整入口；
- DSH 未传显式 Host theme，`BiSurface` 的 system 默认值在 scoped stylesheet 中落为浅色 token；
- adapter 没有渲染 layout canvas，所有 metric 都按 DOM 顺序横占一行；
- Trace route/component 虽存在，但结果页缺少可发现的入口；路由存在不能替代可用 UX。

因此 #175 可接受；#172 的 package/authority 结构方向可接受，但其 public UI surface 尚不完整；#173 产品验收不通过；#174 现有资格结论不足以覆盖 UI/UX；stable promotion 冻结。

## 2. 本轮可支持的 visualizer 与 surface

以下 inventory 以当前可执行 registry 为准，不把设计 grammar 中尚无上游 domain 的图形伪装成可用能力。

| 类型 | 当前可执行 | 适用数据 | 默认尺寸 | 说明 |
|---|---:|---|---|---|
| `numeric-card@1` | 是 | COUNT、QUANTITY、RATIO、MONEY、DURATION_MS 的单 slice | SMALL | KPI/数值卡；必须同时展示 unit、truth、coverage/provenance 入口 |
| `badge@1` | 是 | BOOLEAN 单 slice | SMALL | 状态徽标；文字/图标/形状冗余，不只依赖颜色 |
| `ratio-bar@1` | 是 | unit 为 ratio 的 RATIO 单 slice | MEDIUM | 百分比/比率；显示 exact ratio 和百分比，不占整行 |
| `table@1` | 是 | 任意 result/series | WIDE | 无损语义 fallback；多 slice、异构数据或详细查看默认使用 |
| Recorded Trace detail | 是，非 metric visualizer | Evidence 中已有明确 trace/span identity 的 recorded structure | 独立 detail surface | Desktop 为画布 + inspector；Narrow 默认 outline，可切换 graph |
| Gauge/pointer | 否 | 需要 authoritative domain/方向 | — | 上游未提供足够 domain，不进入 composer |
| Categorical bar | 否 | 需要分类或离散有序维度 | — | 当前 registry 未实现 |
| Line | 否 | 需要权威时间/有序维度 | — | 当前 registry 未实现，不从 timestamp 推断序列 |
| Radar | 否 | 需要共享归一化 domain | — | 当前 registry 未实现，禁止 BI 自行归一化 |

Recorded Trace 是一级可发现的 drill-down surface，但不是 Metric Result visualizer，也不写入 metric layout JSON。这样保持 Evaluation/Metric authority 与 Evidence/Trace authority 分离。

## 3. 建议默认 dashboard

### 3.1 Grid 与尺寸 token

| 容量 | Canvas | SMALL | MEDIUM | WIDE | 建议高度 |
|---|---|---|---|---|---|
| Desktop ≥ 1200px | 12 列，16px gutter | 3 列 | 6 列 | 12 列 | 152–184 / 220–260 / 内容驱动，表格上限 480px |
| Tablet 720–1199px | 6 列，12–16px gutter | 3 列 | 6 列 | 6 列 | 同上；inspector 改 overlay drawer |
| Narrow < 720px | 单列，12px gutter | 1 列 | 1 列 | 1 列 | 卡片内容驱动；表格 bounded scroll；Trace 默认 outline |

`SMALL/MEDIUM/WIDE` 是有限产品尺寸，不暴露自由像素拖拽。Narrow 保留阅读顺序，忽略横向 span；长 coordinate 换行，不能为了卡片高度截断 truth/provenance。

### 3.2 `default-overview@2` 候选

默认布局不试图把 12 个 metric 都铺在首屏。推荐按“摘要 → 比率 → 结构化详情”组织：

1. 第一行：latency、cycle time、usage availability、cohort eligibility，四个 SMALL；不适用状态仍保持紧凑。
2. 第二行：rework rate、task outcome rate，两个 MEDIUM ratio bar。
3. 第三行：terminal outcome rate MEDIUM；partial cost 或 attributable cost MEDIUM（按结果兼容性选择 numeric/table）。
4. 后续：stage reach、token usage 使用 WIDE table，默认折叠到首屏之后。
5. 其余 metric 通过“添加 panel”或“Detailed tables” preset 使用，不强制同时出现。

Unavailable 不应变成 250px 高的白色空卡。它仍是有边界的 panel，但只保留 metric 名、truth/reason、population/coverage 和可用的 recovery/evidence action；MEDIUM/SMALL 均应在约 120–160px 内完成语义表达。

## 4. UX 交互

### 4.1 Read mode

- 顶部 context bar 由 Host 绘制：Selection、Single/Compare、receipt、layout preset、`Edit dashboard`。
- 读取态无拖拽把手和编辑表单；panel 点击不改变 evaluation identity。
- 每个 panel 的主阅读顺序：metric + truth → value/unit → numerator/denominator/coverage → limitation → explanation/evidence。
- 当 result 的 Evidence 引用明确包含 trace/span 时，panel/Evidence row 显示 `Open recorded trace`；没有 trace 时显示明确的 `No recorded trace`/生命周期状态，不留消失的入口。

### 4.2 Edit mode

- Host 的 `Edit dashboard` 进入专用页面编辑态；Host-native controls 调用 core layout commands，完成 preset、添加/移除 panel、兼容 visualizer、SMALL/MEDIUM/WIDE、上移/下移或键盘重排。
- 保存只写浏览器 local state；URL 中的 EvaluationSelection 与 receipt 不变。
- JSON import/export 放在“Advanced” disclosure 内，不作为普通用户主入口；未知 version/field/metric/visualizer/size fail closed。
- 保存后立即回到 read mode；提供 `Reset to default`，且不需要服务器 dashboard API。

### 4.3 Theme 与 Host embedding

- Host 必须显式传递 `light | dark`；`system` 只用于 standalone harness，不能作为嵌入式 Host 的隐式继承协议。
- `wsr-ui-core` 只使用 semantic tokens。DSH 可以把自己的 theme state 映射到 `BiSurface`，不能覆写 panel 内部 raw palette。
- theme 变化不卸载 dashboard、不丢失 selection/layout/inspector focus。

### 4.4 Trace 可发现性

- Trace 保持 `Metric panel → Evidence Console → exact Trace` 的权威下钻路径。
- 如果当前选择解析出了可用 trace 引用，context bar 增加 `Recorded traces (N)` 快捷入口，进入 Evidence Console 的 trace-filtered view；它不构造新的 trace inventory 或因果关系。
- Trace detail 由 `wsr-ui-core` 渲染 recorded structure；DSH 只拥有 route/back/reload、gateway 和容器。Narrow 默认 outline，用户显式切换 graph。

## 5. `wsr-ui-core` 与 Host 分工

| 职责 | `wsr-ui-core` | `wsr-*` Host（DSH/VS Code 等） |
|---|---|---|
| visualizer registry、兼容性过滤 | 拥有 | 只传 authoritative Result |
| concrete dashboard layout、layout JSON、edit/persistence | 可选提供 generic grid primitive，不拥有页面 policy | 拥有；可直接使用 `react-grid-layout` 或消费 core primitive |
| Metric/compare/unavailable/receipt/evidence/trace business components | 拥有完整 contract projection、state、a11y 与 renderer | 只提供 authoritative data、theme、placement 和 action callbacks |
| platform-neutral visual primitives | 提供 `Surface`/`Section`/`Card` 等 public assets | 组合使用，自定义内容/按钮选择与布局 |
| contract support hooks/tools | 拥有 fetch-free/route-free projection 与 validation | 使用 public hook/tool，不重复处理逻辑 |
| chart renderer（SVG/Canvas 静态决策） | 拥有 | 不选择 renderer |
| semantic tokens 与 `BiSurface` | 定义角色、渲染 scoped surface | 显式映射 Host theme/density |
| gateway、network、auth、CSP、error boundary | 不拥有 | 拥有 |
| route/history/deep-link/back/reload | 输出 typed destination/action | 拥有并实现 |
| global chrome、tab/slot、notification | 不拥有 | 拥有 |
| title、context/control panel、Dashboard/Evidence/Trace page composition | 不拥有 | 拥有 |
| whole-page state（active view、selection、route、loading、drawer、edit lifecycle） | 不拥有 | 拥有 |
| component-local state（panel disclosure、Trace camera/lens/playback） | 拥有 | 通过 controlled props/exact events 协调 |
| layout/integration state（instances、positions/sizes、layout draft、theme） | 不拥有具体平台值 | 拥有 |
| evaluation/metric/trace authority | 不计算、不补值 | 同样不计算；转发 Evolution/Evidence authoritative response |

建议 public surface 补充三类可复用资产：platform-neutral visual primitives、cohesive business components、fetch-free/route-free contract hooks/tools，以及明确的 theme contract。具体 layout/layout JSON 默认由 Host 拥有；若以后抽取 generic grid，它也不拥有页面 policy。Core 不导出整页 `DashboardWorkspace`、title 或 assembled control panel。Host 必须复用适用 core assets，但只经 public props/slots/events/theme 装配，禁止 deep import、CSS 穿透、源码或数据投影复制。

## 6. 静态布局印象图

已迁入文档体系的 [`studio-dashboard-layout-candidate.html`](../../../../docs/systems/bi/assets/studio-dashboard-layout-candidate.html) 同时展示 Desktop、Tablet、Narrow 三档。它是语义布局评审工件，不是视觉像素基线；chart 使用占位线条，重点检查信息层级、panel span、主题和 Trace 入口位置。

Dashboard 第一 row 作为产品标题与内部组件导航候选：`Dashboard / Evidence / Recorded Trace`。`trace-impressions.html` 与 `trace-motion-candidate.html` 错把 Trace 主视图做成结构/架构图，已经被 owner 否决，只保留为设计探索记录。

修正后的研究记录见 [`trace-renderer-reference.md`](trace-renderer-reference.md)，规范已归并到 [`bi-studio-ui-ux-design.md`](../../../../docs/systems/bi/bi-studio-ui-ux-design.md)；Waterfall 与 Tree 设计资产分别为 [`studio-trace-waterfall-candidate.html`](../../../../docs/systems/bi/assets/studio-trace-waterfall-candidate.html) 和 [`studio-trace-tree-candidate.html`](../../../../docs/systems/bi/assets/studio-trace-tree-candidate.html)。Trace 默认使用 APM span waterfall：左侧 parent/child Span tree，右侧共享 recorded-time timeline，bar 的位置和宽度来自 Evidence exact start/end；Tree 是同一 IR 的 call-tree inspection renderer。Archify 仅作为 LLM + typed JSON IR + deterministic compiler + mode-specific renderer + exact focus/lens/camera + quality gate + Motion Governor 的工程参考，不借用 architecture domain/visual grammar。

## 7. 待 owner 决策

1. 是否接受四种可执行 visualizer 为 #170 稳定版范围，其他 grammar 继续 deferred？
2. 是否接受 `SMALL=3/12、MEDIUM=6/12、WIDE=12/12` 的 Desktop span 与上述高度区间？
3. 是否接受 Trace 作为一级可发现的权威下钻，而不是可自由绑定的 metric panel？
4. 是否接受 `default-overview@2` 的首屏选择，还是希望把某个具体 metric 替换进前两行？
