# BI 系统——Iteration 5 候选（中文追踪）

> **状态：** Wave3 rebaseline 候选，2026-08-28。英文 [`bi-system.md`](bi-system.md) 是候选规范文本。原 G1 browser evaluator、BI-local manifest 与固定 `/factual`/`/trace` 设计已 supersede，不再是 authority。本文不授权 Wave4 实现。

## 1. 目的与权威

BI 是 Evolution Metric Results 的展示层，也是 Evidence Facts/recorded Traces 的只读下钻界面。

| Concern | Authority |
|---|---|
| Facts / recorded Traces | Evidence |
| Metric concept/formula/reading | Evaluation Catalog |
| 12 项 candidate Metric Results、coverage、compatibility、compare Delta | Evolution |
| Selection、layout、visualization、interaction、accessibility | BI |

BI 提交 population-oriented `EvaluationSelection`，不选择 metric implementation。每个成功解析的 side 由 Evolution 返回 `ResolvedEvaluationContext` receipt 与恰好 12 个 review-candidate `MetricResult`。BI 可直接查询 Evidence 做 result/receipt-linked Fact/Trace detail，但不计算 metric、不创造 Fact、不写 Result、不访问 PostgreSQL、不重建 expired detail。

详细 API/authority 见 [`../evolution/evolution-system.zh-CN.md`](../evolution/evolution-system.zh-CN.md)，12-calculator candidate matrix 见 [`../evolution/metric-computability.zh-CN.md`](../evolution/metric-computability.zh-CN.md)，UI contract 见 [`bi-ui-design.zh-CN.md`](bi-ui-design.zh-CN.md)。

## 2. Runtime boundary

系统 Mermaid 图见英文 companion 第 2 节。

- UI 保持 Vite-built TypeScript/React SPA，使用 D3.js 与 Tailwind semantic bindings。
- Nginx 只 serve committed `dist` 并 same-origin proxy 获批准的 Evolution compute/Evidence read routes；无 formula/store/DB client。
- Evolution 是唯一 Python metric runtime；browser 不含 TypeScript evaluator 或 BI-local evaluation-context manifest。
- Evidence/Evolution 是 private upstream。默认 host exposure 为 `127.0.0.1`；public access control 是 user-owned deployment decision。
- Iter5 无 `workflow-builder`、AI attribution、Workflow mutation/calibration、revision application 或 meta-recursive loop。

## 3. Selection 与 Task discovery

`EvaluationSelection` 选择有界 exact `task_ids` set；它不是 metric set、Delivery guess、display-name lookup 或 Workflow selection。用户在 Delivery 创建时明确 NEW/REUSE，默认 NEW。Evidence 提供 accepted Task declaration/membership 与 bounded Task-list query。

Task query 返回 stable `task_id` 与 optional `display_name`。名称非空白时显示名称，缺失或仅含空白时回退 ID。名称可重复/修改，因此 request、URL、equality、receipt 与 membership 只用 ID；同名时显示次级 ID 消歧。

## 4. Query 与稳定性

Observation/Evidence 提供最终稳定。上报期间重跑 unresolved selection 可看到新增 accepted records；当没有新增 accepted Observation/Task membership 且 required data 尚未进入 retention expiry 时，settled selection 保持稳定。每个 Evidence traversal 各自遵守 published cursor/snapshot consistency，Evolution 完整遍历并在 receipt 中绑定 exact resolved read set。不存在 cross-Fact/Trace transaction snapshot、prebuilt manifest、expected-context digest 或新增 stability Oracle。

Retention/expiry 是明确 lifecycle change。Settled active result 在所需 evidence 未过期前保持最终可重复；过期后返回 typed Result state，不重建旧数据。

## 5. Presentation boundary

BI 只允许 presentation-only layout、scale、显式 binning、ratio-to-percent、rounding、geometry。任何可能被读成 metric fact/Delta 的数字必须来自 Evolution。Missing 保持 gap；incompatible unit/currency 不合并；positive/negative 不等于 good/bad。

应用使用 `/evaluate` route family，默认 single，explicit left/right 进入同工作区 compare。Fact/Trace 是 drill-down，保留 origin selection、side、metric、focus 与 return path。URL selection 是恢复 authority；LocalStorage 只保存便利偏好/layout。

## 6. 工程基线与 superseded boundary

可继承 Wave2：React、D3.js、Tailwind CSS、TypeScript、Vite、semantic tokens、preview/unit/browser tests、Docker/Nginx source-build infrastructure。

已 supersede 且禁止作为当前 authority：browser metric formula/TypeScript evaluator；BI-local manifest；固定 `/factual`/`/trace` top-level IA；单 Evidence upstream；未按新职责拆分的旧 component names；把产品或 Metric Results 标成 “WSR Evidence” 的旧 style frames。

本候选不修改产品代码、published Contract、Issue、Project 或 implementation plan。
