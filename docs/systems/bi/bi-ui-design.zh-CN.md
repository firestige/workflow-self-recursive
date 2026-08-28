# BI UI — Iteration 5 详细设计候选（中文追踪）

> **状态：** owner 已接受的 Wave3 设计候选，2026-08-28。英文 [`bi-ui-design.md`](bi-ui-design.md) 是候选规范文本；本文是中文追踪 companion。本候选 supersede 现有 G1 的 browser evaluator、BI-local manifest 与固定 `/factual`/`/trace` 设计，但本身不发布 Contract、不创建 durable implementation baseline commit，也不授权 Wave4。

## 1. 产品目的与非目标

Iter5 的首要用户是配置和运行 agent、希望理解其配置实际表现的 owner。最常见的三个任务是：选择 Task population 查看 12 项 candidate Metric Result；在同一工作区比较两个明确 selection；经评估回执、指标说明、Facts 与 recorded Trace 核验结果来源。Single 是默认主路径，compare 是同页派生模式，不是事故调查台。

Iter5 只陈述已记录结果、覆盖、来源与限制。它不做 AI/Skill 因果归因，不提出改进建议，不编辑或校准 Workflow，不应用 revision，也不实现 meta-recursive loop。

## 2. 权威与运行时边界

- Evidence 是 accepted Facts 与 recorded Traces 的权威。
- Evaluation 是 metric 概念与 published reading rules 的权威。
- Evolution 是 owner 已批准的 Catalog 2.0 评审候选 12 项 Metric Results、per-metric coverage、compatibility 与 compare Delta 的权威；2.0 发布前，Catalog 1.0 保持历史状态。
- BI 提交 `EvaluationSelection`、展示 Evolution response，并直接查询 Evidence 做 Fact/Trace 下钻。
- BI 只允许 presentation transform：layout、chart domain、display rounding、权威 ratio 的百分比显示和明确标注的视觉分桶。BI 不计算 metric、不填补缺失、不换算 unit/currency、不推断因果、不写回 Result。

系统边界图见英文 companion 第 2 节。

## 3. 用户任务、routes 与 deep-link identity

Task selection 必须区分机器身份与人类辨识。`task_id` 是 selection request、URL parameter、deep-link restoration、equality 与 receipt 唯一使用的稳定值；Task query 另返回可选 immutable `display_name`。Selector 与 context surface 在名称非空白时显示名称，缺失或仅含空白时回退显示 `task_id`。`display_name` 不要求唯一：同名 Task 必须用次级 ID 文本消歧，Task 搜索同时接受名称与 exact ID，且不得合并 identity。空间允许时可以把 ID 作为次级、可复制元数据展示。Iteration 5 不提供 Task rename mutation；未来若发布 rename capability，必须保持 `task_id` 与 deep-link identity。

稳定 route family 以 `/evaluate` 为根。表中 `{selection-query}` 恰为 single 的 `v=1&task=<task_id>...`，或 compare 的 `v=1&mode=compare&left_task=<task_id>...&right_task=<task_id>...`：

| Route/state | 职责 |
|---|---|
| `/evaluate?v=1&task=<task_id>...` | 默认 single-result dashboard；重复 `task` 形成 canonical sorted Task set |
| `/evaluate?v=1&mode=compare&left_task=<task_id>...&right_task=<task_id>...` | 同一工作区 compare；左右分别 canonical sort |
| `/evaluate?{selection-query}&metric=<metric_id@version>&side=<single|left|right>` | 聚焦 exact Metric Result/side，保留 dashboard state |
| `/evaluate/evidence?{selection-query}&metric=<metric_id@version>&side=<single|left|right>&scope=<result|related|read-set>&fact=<fact_id>` | Evidence Console；`fact` 是 optional exact focus |
| `/evaluate/trace/<trace_id>?{selection-query}&span=<span_id>&side=<single|left|right>` | recorded Trace detail 与 optional exact node focus |

URL 使用 closed、versioned fields 完整表达可重建 selection。Task parameter 使用重复 key，不做 comma parsing，并在提交前按 exact ID canonicalize。每侧最多 24 个 Task IDs，完整 percent-encoded URL 不得超过 8 KiB；超预算时 selector 在 navigation 前拒绝并解释 bound。`v`、`mode`、Task sets、`metric`、`side`、`scope`、`fact`、`span` 是 selection/drill-down identity；panel layout 与 display name 不是 identity。Unknown field/revision 必须显式失败，不解释 alias 或 ambient latest。打开 deep link 会重新提交 selection 并取得当前 receipt，不承诺重现已 expired 数据或旧 receipt 字节。显式 URL 高于 LocalStorage 的最近选择/布局。下钻返回时恢复原 selection、compare side、metric、scroll/focus 语义位置与 detail surface。失效 identity 必须保留 URL 上下文并提供重选，不得静默选择 latest。

IA 状态图见英文 companion 第 3 节。

## 4. 响应式 application shell 与 dashboard composition

Shell 始终包含 global navigation、selection/context bar、dashboard canvas 与唯一 detail owner；这里只冻结区域关系，像素由实现 token 决定。

| Capacity | 区域关系与折叠顺序 |
|---|---|
| Desktop | persistent header 与完整 context bar；多列 canvas；指标说明/回执/证据进入右侧 inspector；compare 仍在同一 canvas |
| Tablet | context bar 换行；panel minimum width 允许时 1–2 列；inspector 变 overlay drawer；双侧不可读时 compare 改上下排列 |
| Narrow | 单列 canvas；sticky compact context 展开完整 selection；Before、After 依次出现，Delta 从属；detail 为 full-height sheet/page；Trace 默认 outline，可切 graph |

长 metric name 允许换行且 coordinate 不截断；大 numerator/denominator 使用 tabular numeral 并可整体换行。不得为保住图形而隐藏 provenance 或 truth state。200-row table 使用 sticky header 配合有界滚动/分页；大而有界 Trace 在 desktop pan/zoom，在窄屏使用 virtualized outline。触摸操作不依赖 hover。

区域 Mermaid wireframe 见英文 companion 第 4 节。

## 5. Layout 与 preset contract

BI 提供有界 dashboard composer，借鉴 Grafana 的 visualizer/layout 分离，而不是复制其 query/plugin platform。

- 产品提供一个 default layout 与若干 curated preset；preset 把 published metric coordinate 绑定到 compatible visualizer named channels，并声明 panel 位置/尺寸。
- 用户在显式 edit mode 中增删 panel、选择 compatible visualizer、绑定 channel、在有限 span 内 resize/reorder。
- custom layout 只存在于本地浏览器。允许 closed、versioned JSON import/export；unknown version/field/metric/visualizer/transform/size fail closed。
- layout identity 不属于 evaluation identity；改 layout 不得改变 selection、receipt 或 Metric Result。
- Iter5 不包含 arbitrary Evidence query、expression/formula、plugin/script、remote persistence、collaboration、alert rule 或 metric creation。

View mode 必须 flat-at-rest。保存的单 panel binding 失效时，该 panel 原位显示 `INCOMPATIBLE` 与修复入口，其他 panel 继续工作。

## 6. Visualization registry 与 presentation-only transforms

每个 visualizer 声明 stable ID、arity、named channels、支持的 value kind/unit、所需 authoritative domain、missing tolerance、compare support、table fallback 与允许的 presentation transforms。Registry 在 binding 前过滤兼容项，不在 render 时临时猜语义。

| Visualizer | Eligible input | 必须行为 |
|---|---|---|
| Numeric card | 单 scalar/category result | value、unit、truth、sample/coverage 与 provenance 入口均可见 |
| Badge | closed category/state | text/icon/shape 冗余，不只靠颜色 |
| Progress/gauge/pointer | 带 authoritative domain 的 bounded scalar | 显示 domain/direction；不创造 target，不 clamp 真值 |
| Bar | categorical/discrete ordered compatible series | magnitude bar 使用 zero baseline；missing category 显式留洞 |
| Line | authoritative ordered/time dimension | 不推断 timestamp、不插值/平滑；missing value 断线 |
| Table | 任意 result/series | mandatory semantic fallback；heterogeneous/mixed coordinate 默认形式 |
| Radar | homogeneous channels 与 shared authoritative normalized domain | Iter5 无默认 preset；上游未提供 common domain 时 incompatible，BI 不归一化异质 metric |

Allowlist 只有：display rounding、ratio-to-percent、scale/layout、按权威 dimension 稳定排序、明确显示边界和计数的 visual binning。禁止 moving average、imputation、score/rank、currency/unit conversion、hidden normalization、合成 total tokens 或新 denominator。

Missing tolerance 按 panel 类型定义：card/badge/gauge 无 value 时显示 typed truth state；line/bar 在声明允许时保留可用点并显式留洞；compare 可保留单侧可用 Result 并 withheld Delta。任何单 panel unavailable 都不应使 dashboard 整体失败。

## 7. 信息层级、排版、数字显示与密度

稳定 type roles 为 `display`、`heading`、`body`、`label`、`code`、`numeric`，Tailwind 绑定语义 role 而非页面 raw value。Numeric 使用 tabular figures；ID、coordinate、digest 与 exact unit 在需要精确扫描时用 `code`。

Result panel 阅读顺序：metric name + truth state；authoritative value + unit；numerator/denominator 或 contributing count；coverage/sample 限制；解释边界；provenance/detail action。`UNAVAILABLE`、`LOWER_BOUND`、`EXPIRED`、`INCOMPATIBLE` 和 partial coverage 不得缩成低对比脚注。

Evolution 提供 authoritative decimal string 与 rounding metadata；BI 在 accessible text/detail 保留 exact value，panel 仅使用声明的 display precision。单位不得推断；百分比只是 authoritative ratio 的显示。Compare 中 Before/After 等权，Delta 更小且附方向文字。数学 positive/negative 不等于 good/bad。

Comfortable density 默认；Compact 只缩小 whitespace/row height，不删除信息、不改变 DOM order、可访问名、触摸 target、状态或 provenance 入口。Density 是本地展示偏好，不进入 URL selection identity。

## 8. Semantic tokens、主题、打印与 forced colors

Tailwind utility 只消费 semantic CSS-variable binding。页面/组件不得散落 raw palette、spacing、radius、shadow、z-index、focus 或 motion value；它们只存在于 central token/theme mapping。

Required roles 覆盖 surface、text/border、accent/selection/focus/disabled、truth/status、before/after/delta/series，以及 type/space/density/shape/elevation/motion。每个 role 都有语义等价的 light/dark mapping，并逐 role 验证 contrast。

Status/compare 总是以颜色加 label/icon/shape/stroke/position 冗余表达。数学增减使用中性 `↑ increase` / `↓ decrease`；只有 Catalog 明确 metric directionality 时才能使用改善/退化语义，禁止固定红绿。Print 使用 light surface、移除 interaction-only chrome 并保留 receipt context；forced-colors 使用 system colors/outline，chart 仍有 table/text alternative。Focus ring 不得被 selection color 替代。

成对 semantic style frames（SVG 是 design authority；未来 screenshot 只是 regression evidence）：single dashboard [light](assets/style-frame-bi-single-light.svg) / [dark](assets/style-frame-bi-single-dark.svg)；compare [light](assets/style-frame-bi-compare-light.svg) / [dark](assets/style-frame-bi-compare-dark.svg)；recorded Trace [light](assets/style-frame-bi-trace-light.svg) / [dark](assets/style-frame-bi-trace-dark.svg)；truth/recovery states [light](assets/style-frame-bi-states-light.svg) / [dark](assets/style-frame-bi-states-dark.svg)。

## 9. 组件职责与状态矩阵

以下是可组合职责，不强制保留 Archify 英文组件名；UI 使用“指标说明”“评估回执”等领域名称。

| 职责 | Trigger/owned state | Close/identity |
|---|---|---|
| Metric Result panel | dashboard binding；经 visualizer 展示一个 authoritative result | 以 metric coordinate 选中；打开指标说明/证据 |
| Before/Delta/After | compare binding；展示两侧 Result 与 Evolution Delta | 不计算 Delta；URL 明确 side focus |
| 指标说明（Semantic Passport 能力） | “指标说明” action | drawer/sheet 返回 trigger；exact metric coordinate/revision |
| 评估回执（ReceiptPanel 能力） | context bar action | 唯一 inspector owner；keyed by 当前 side 的 resolved context |
| 指标导航（DeltaNavigator 能力） | metric list/filter；compare variant 展示 Delta availability | 不做 heterogeneous ranking；keyed by metric coordinate |
| Evidence Console | Result/side 的“查看证据” | 区分 exact result evidence、relevant non-lineage Facts 与 full resolved read set |
| Trace view | Evidence 中 exact Trace/Span link | 返回 Console origin；URL 携带 trace/span identity |
| 记录结构导航 | Trace 内 depth/outline navigation | 不成为独立 Recorded Reach truth/metric |
| Motion control（MotionGovernor 能力） | Trace Live/Still | Still 默认；有限 traversal 自有 stop/reset |

任一时刻只有一个 modal/drawer/sheet 拥有 focus；receipt/passport 可在同一 inspector 切换，禁止 nested dialog。

状态要求与英文 companion 第 9 节矩阵相同：loading 不等于 0；available 显示 value/unit/truth；lower-bound 明示非 final total；N/A 给出适用性理由；unavailable 给 missing reason；expired 保留 identity 不冒充 current；incompatible 给 coordinate 差异与修复；error scoped retry 并保留 selection；selected 与 focused 使用不同非颜色 treatment；disabled 提供理由；reduced-motion 呈现相同最终信息且无 traversal animation。

## 10. Compare：Before、Delta 与 After

Compare 由用户为当前 workspace 添加 explicit right selection 启用；左右分别保留 `EvaluationSelection` 与 `ResolvedEvaluationContext`。URL 编码两侧 selection 和 side-specific evidence focus。

Before/After 是事实本体，使用对称 panel、label、precision、coverage 与 provenance；Delta 是 Evolution 返回的 comparison result，以较弱层级、中性 increase/decrease/no-change 文本展示。BI 不做减法。kind/unit/Usage source/source_id/catalog/cohort 等不兼容时，左右仍可读，Delta 显示 typed incompatibility。Compare navigator 只定位 exact metric coordinate，不排名或生成 winner。窄屏先 Before、再 After、最后 Delta，确保视觉与 screen-reader 顺序都不倒置事实层级。

`PARTIAL_COMPARE` 不是 metric-unavailable：成功侧完整保留 receipt 与 12 results；失败侧是 scoped transport/resolution error surface，没有 receipt，但保留 URL selection、拥有 retry/focus，并只 announce 一次。全部 Delta coordinates 为 `SIDE_UNRESOLVED`，retry 只针对失败侧；只有 FULL compare 才有两份 receipt。

Compare sequence 见英文 companion 第 10 节。

## 11. Evidence 下钻与 provenance 用语

Evidence Console 是只读下钻，不是第二个 evaluator，明确分三层：

1. **Result evidence**：Metric Result 明确引用的 exact provenance/input identities；
2. **Related Facts**：匹配 selection/metric context、但未被声明为 calculation lineage 的 Facts；
3. **Resolved read set**：receipt 绑定的 complete bounded Evidence population。

后两层不得标成“这个值的依据”。每行展示 Fact identity、class、相关 coordinate、accepted provenance、lifecycle state 与存在时的 exact Trace/Span link。empty、partial、expired、query error 不得混同；Facts 必须由 Evidence 提供，Console 不从 Metric Result 重建。

Receipt 解释 canonical selection、Task/Delivery population、cutoff、Catalog/contract coordinates、query/read-set/provenance identities、completeness、expiry 与 compatibility。“Resolved read set”必须展示 receipt 中记录的 exact identities；用 current filters 重跑可能看到后续 ingestion，不得冒充旧 receipt read set。Receipt 是 response receipt，不是预制 manifest，也不是 causation proof。Single sequence 见英文 companion 第 11 节。

## 12. Recorded Trace layout 与有限动效

Trace layout 只来自 recorded OTel parent structure；timestamp 与 arrival order 不参与 layout、sibling order 或 traversal order。

- root/depth 由 recorded parent links 决定；同一 parent depth 的 sibling 同时 reveal。
- sibling 使用 documented stable identity order，settled Evidence 刷新后保持布局。
- LINK 使用独立 stroke/legend，不改变 depth/traversal。
- orphan/missing endpoint 在 separate orphan lane 中按 stable identity 排序并保留为 typed placeholder；它们没有 inferred parent depth，也不插入 parent-depth traversal，BI 不修补 parentage。
- partial/expired 在具体 node/edge 与 text alternative 中标注。
- desktop graph 有界并支持 pan/zoom/focus；narrow 默认 virtualized outline，可显式切 graph。
- `Still` 默认；`Live` 只由用户启动，按 deterministic depth 有限展示并最终停止，只是阅读 recorded structure，不重放 wall-clock execution。
- `prefers-reduced-motion` 强制 Still，信息与 selection 不变。

删除所有 timestamp 后，layout/traversal 仍必须确定；刷新同一 settled Evidence 后 node identity/order 稳定。Motion state diagram 见英文 companion 第 12 节。

## 13. Accessibility、键盘、focus 与恢复

Keyboard 顺序为 skip link → global navigation → selection/context → dashboard toolbar → layout order panels → active inspector trigger；edit handle 只在 edit mode 进入顺序。所有 chart 有 accessible name、简洁 summary 与可达 table/text alternative。

仅键盘必须能完成 selection、开启/退出 compare、选择 metric、打开指标说明/评估回执、进入 Fact/Trace 并返回、切主题/密度、启动/停止允许的 motion。Drawer/sheet 使用 labeled dialog pattern，只在 modal 时 trap focus，安全时 Esc 关闭，关闭后还原到 invoker，禁止叠层。

Async status 克制 announce；compare incompatible、expired deep link 与需用户处理的 scoped error 才 assertive。Retry 保留 valid selection/layout，只重试失败 scope。Invalid/expired link 显示 exact failing coordinate、保留可恢复参数并提供重选，绝不 silent fallback latest。Theme 默认跟 system，可选 light/dark；reduced motion 跟随平台且用户只能选择更严格。

## 14. Archify 参考裁决

Archify v2.15.0 与本地材料只是设计证据，不是项目 authority。下表 evidence key 指向本地 source audit：[O-2 route/reach/trace 与 O-3 compare](../../../tmp/20260827/archify-inspiration/obs-archify-capabilities.md)、[O-5 visual/interaction discipline](../../../tmp/20260827/archify-inspiration/obs-archify-capabilities.md)、[O-16 boundary rejection](../../../tmp/20260827/archify-inspiration/obs-evolution-bi-mapping.md)。裁决与 WSR 边界由本项目自行负责。

| 能力 | Evidence | 裁决 | Iter5 边界 |
|---|---|---|---|
| Progressive disclosure | O-5 | `ADOPT` | dashboard flat-at-rest，详情按需打开 |
| Flat-at-rest hierarchy | O-5 | `ADOPT` | 一个 inspector owner，无永久嵌套 chrome |
| Evidence Console | O-5 | `ADAPT` | Evidence 直查，分 result/related/read-set scopes |
| Semantic Passport | O-5 | `ADAPT` | 领域名“指标说明”，承载 Catalog semantics |
| Stable deep links | O-2 | `ADAPT` | closed selection + exact evidence focus，重新解析 current receipt |
| Semantic color/theme parity | O-5 | `ADAPT` | Tailwind semantic bindings，light/dark/print/forced-colors parity |
| Finite/reduced motion | O-2/O-5 | `ADAPT` | recorded parent-depth 阅读，不做时间回放 |
| Before/Delta/After receipt discipline | O-3 | `ADAPT` | FULL compare 提供两份 receipt 与 Delta；partial compare 保留成功侧与 typed side error |
| Authored reach | O-2/O-16 | `REJECT` | authored structure 不能表示 runtime causality；无独立 Recorded Reach component |
| AI attribution/Workflow mutation | O-16 | `REJECT` | 越过 Iter5 authority/non-goals |
| Share/presentation cards | O-16 | `DEFER` | Iter5 无 collaboration/publishing requirement |
| Radar default comparison summary | O-16 | `DEFER` | 异质 metric 没有 authoritative common normalized domain |

不为了 feature parity 保留借来的 proper noun；只吸收 interaction principle，并按 WSR authority/truth vocabulary 重写。

## 15. Verification checklist 与 baseline migration

Wave4+ implementation 必须复用现有 test layers 证明以下设计；Wave3 不写产品代码：URL 优先并恢复完整 single/compare/detail/focus；BI 无 formula/conversion/fill/Delta；visualizer incompatible fail before render 且均有 table/text fallback；全部 truth/interaction/motion states 在双主题下非颜色表达；长名称、大数、双侧 compare、200 rows 与 bounded large Trace 在三档容量可操作；完整 keyboard/focus/forced-colors/reduced-motion；Trace 去 timestamp 后仍确定且 Live 最终停止；Task name missing/duplicate/fallback 且不暴露 rename control；versioned layout import fail closed；multi-slice duplicate/noncanonical key fail 且 mixed truth 不折叠；24 Task/side 与完整 encoded URL 8 KiB 双重 bound；PARTIAL_COMPARE 保留成功侧、只重试/announce 失败侧并将全部 Delta coordinates 标为 `SIDE_UNRESOLVED`；paired light/dark style frame 语义等价。

可继承：React、D3.js、Tailwind CSS、TypeScript、Vite、layout-independent primitives、preview/test harness、Docker/Nginx scaffold 与 semantic-token machinery。已 supersede：browser metric computation、BI-local manifest、固定 `/factual`/`/trace` IA、dark-only authority、旧 component boundary，以及把 BI 标成 Evidence authority 的旧 style frame。

独立 `Recorded Reach` 名称/组件已被拒绝；published `delivery-stage-reach` Metric Result 继续支持，recorded-structure navigation 归入 Trace view。
