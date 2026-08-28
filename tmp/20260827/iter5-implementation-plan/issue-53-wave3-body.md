## 摘要

交付本地 BI 的 Metric Result single/compare 工作台。展示层使用 TypeScript、Vite、React、D3.js 与 Tailwind CSS，不采用 Grafana。

权威边界：

- Evidence 提供 Facts、recorded Traces，以及已接纳的 Task declaration/membership 查询；不提供 Metric Results。
- Evaluation 是 metric 概念契约，不是运行组件；published Catalog 1.0 的 14 项保持不可变历史，当前实现 authority 是 owner 批准的 Catalog 2.0 review candidate 12 项。
- Evolution 使用 Python 计算全部 12 项 candidate Metric Results、coverage、compatibility 与 compare Delta，并返回 `ResolvedEvaluationContext` receipt。
- BI 提交 `EvaluationSelection`、展示 Evolution 结果，并按需直接查询 Evidence 做 Fact/Trace drill-down；BI 不计算 metric、不创造 Fact、不回写 Result。

当前冻结的 `agentops.evaluation.metric-catalog@1.0.0` 与 `evidence.query@0.1.0` 原件保持不可变；Task 与 Evolution API 按后续获准的 contract lifecycle 发布新 revision。

## 验收标准

- [ ] Evolution 提供无副作用 compute API；每个成功 side 恰好返回 Catalog 2.0 review candidate 的 12 个 Metric Result coordinates 与一个 receipt；Catalog 1.0 的 14 项只作为历史版本保留。
- [ ] `EvaluationSelection` 每侧包含 1–24 个 exact Task IDs；single 一个 side，compare 为 BI 提交的 left/right sides。
- [ ] Delivery 默认 NEW Task，用户可显式 REUSE exact `task_id`；BI 的 Task selector 优先显示 optional `display_name`，缺名回退 ID，identity/URL/receipt 始终使用 ID。
- [ ] Evolution 声明 logical Catalog `as_of`，完整遍历 Evidence 各 route-local snapshot/cursor，并在 receipt 中绑定实际 exact resolved read set；不新增跨 Facts/Traces transaction snapshot、global-snapshot Oracle 或 expected-context digest。
- [ ] Observation 上报期间结果允许随新增 accepted records 变化；没有新增 Observation/Task membership 且 retention 未 expiry 时，settled selection 最终稳定。
- [ ] 每项 metric 只有一个隔离 Python calculator；exact integer、money minor-unit 与 Decimal 规则明确。BI、Evidence 与 Nginx 均不包含公式。
- [ ] compare 支持 full 与 `PARTIAL_COMPARE`；Evolution 按 exact canonical slice 计算 `delta = after - before`。失败 side 不丢弃成功 side，Delta 不表达 winner/good/bad。
- [ ] BI 使用 `/evaluate` workspace；single 为默认，compare 为显式同页模式。URL 可恢复 exact selection、metric、side、scope 与 detail，完整 percent-encoded URL 上限 8 KiB。
- [ ] bounded dashboard 提供默认 layout、closed presets、local custom layout 与 closed visualizer registry；不是 query/formula/plugin platform。
- [ ] Wave7 executable registry 仅含 numeric card、boolean badge、bounded ratio bar、lossless table，并按 value shape/unit/coverage/compare compatibility 选择；需要 authoritative domain/ordered dimension/shared normalized domain 的 gauge、categorical bar、line、radar 仅为 deferred grammar，Evolution 发布所需描述前不得成为 layout binding。Panel-specific missing tolerance 允许诚实的数据空洞，永不补零或生成新事实。
- [ ] available、lower-bound、not-applicable、unavailable、expired、incompatible、error 等状态显式、非颜色编码；浅色/深色、print/forced-colors、compact/comfortable 语义等价。
- [ ] keyboard-only 可完成 Task selection、compare、receipt/metric explanation、Evidence Fact/Trace drill-down与返回；chart 必须有 table/text fallback。
- [ ] Trace 只沿 recorded parent structure：同 depth sibling 同显、LINK 独立、orphan 单独 lane；Still 默认，Live 有限且可终止，timestamp/arrival order 不决定因果、布局或播放。
- [ ] Nginx 同源代理 Evolution compute 与 Evidence Task/Fact/Trace read-only routes；BI/Evolution 无 PostgreSQL 路径或凭据。
- [ ] workflow-builder、AI attribution、Workflow 改进/编辑/校准、revision application 与 meta-recursive loop 不进入 Iter5。

## Wave3 已确认设计

- Evolution system：`docs/systems/evolution/evolution-system.md` 与中文 companion。
- 12-metric candidate matrix：`docs/systems/evolution/metric-computability.md` 与中文 companion；1.0 的 14 项 matrix 保留为历史来源。
- BI system：`docs/systems/bi/bi-system.md` 与中文 companion。
- UI/UX：`docs/systems/bi/bi-ui-design.md` 与中文 companion。
- Style frames：`docs/systems/bi/assets/style-frame-bi-{single,compare,trace,states}-{light,dark}.{svg,png}`。
- `wsr-ui` implementation baseline：component commit `201268e`。
- Superproject Wave3 design baseline：commit `2a1c056e`。

旧 browser-side evaluator、BI-local manifest、固定 `/factual`/`/trace` IA、单一 Evidence upstream 与独立 `Recorded Reach` 均已 superseded，不得作为实现 authority。Published `delivery-stage-reach` metric 保留；Trace recorded-structure navigator 是独立的展示职责。

Archify 只作为参考资料；借鉴项必须落实为 `ADOPT`、`ADAPT`、`DEFER` 或 `REJECT`，不得机械照搬其领域假设。

## 当前状态

- Wave3 design 已获 owner 接受并持久化。
- Wave4 Evolution contract/API、Wave5 12-metric candidate compute 与 Wave6 UI transport/foundation 已完成各自证据门禁。
- Wave7 正在实现并验证 single/compare workspace、bounded layout/visualizer、receipt、Evidence drill-down、responsive、keyboard 与 truth-state vertical slices；Issue 保持 OPEN，Trace、serving 与 independence 继续由 #54–56 独立跟踪。

## 决策

### 2026-08-28 — Evolution / Evidence / BI authority rebaseline

- 结论：Evolution 是 Catalog 2.0 review candidate 全部 12 项 Metric Results 与 Delta 的运行时 authority；published Catalog 1.0 的 14 项保持不可变历史。Evidence 只提供 Facts/recorded Traces；BI 只展示。
- 理由：Fact 与 computation result 必须分离，展示层不能裁定 metric，Evidence 也不应实现 Evaluation。
- 落地：废止 browser evaluator 与 Evidence-derived-metric 方案，采用 Python Evolution compute API 与 receipt-bound resolved read set。

### 2026-08-28 — Task selection 与最终稳定

- 结论：默认 NEW、显式 REUSE exact `task_id`；Evidence 提供 Task discovery，名称只用于展示。Observation/Evidence 只要求最终稳定，不要求跨 Facts/Traces transaction snapshot。
- 理由：Task identity 可沿正常 Delivery/Observation 路径自动传递；上报过程允许结果收敛，不需要第二个 Task authority、global snapshot 或新增 Oracle。
- 落地：后续 contract lifecycle 物化 Task binding/query 与 Evolution API；这不是剩余架构 blocker。

### 2026-08-28 — BI UI/UX 设计接受

- 结论：采用 `/evaluate` single-first workspace、bounded dashboard composer、closed visualizer registry、成对 light/dark semantic tokens、complete truth states、Evidence Console、recorded Trace 与 finite Still/Live motion。
- 理由：产品首要任务是比较 agent 配置、Skill 效果、token/cost 与流程表现；Iter5 只诚实呈现结果和证据，不做因果归因或改进建议。
- 落地：Wave3 candidate docs 与 style frames 作为 Wave4+ implementation authority；实现必须通过 deep-link、responsive、keyboard、forced-colors、reduced-motion、partial compare 与 missing-hole oracles。
