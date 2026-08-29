# Plan Rules — plan.md 内容规则

Normative language is English; Chinese is a tracking translation. The [template](plan-template.md) is the format floor (模板管格式); these rules govern content quality (规则管思路). `pctl plan lint` enforces the structural floor only — the semantic rules below are enforced by human review and by the executing agent reading this document.

## 1. Dual-consumer principle (双消费者原则)

A plan is **reviewed by a human and executed by an agent**; every format element must serve at least one consumer:

- **Human**: mermaid DAG (dependency structure at a glance), checkboxes (progress at a glance), conclusion tables (impact/risk without reading analysis).
- **Agent**: text edge list (lintable), header state pointer (resume point), context index (self-contained prompt).
- **Both**: `pctl plan lint` output (machine gate for the human reviewer).

No element may exist that only one consumer can tolerate and the other must parse by hand.

## 2. Conclusions on the plan, analysis in the source (结论上 plan，过程在源头)

The plan carries **conclusions only**: dependency edges, risk numbers, impact surfaces, acceptance checkboxes. The reasoning that produced them lives in the failure analysis / spec / design doc the plan cites (故障分析是 plan 的来源).

Standard methods exist so conclusions are **measurable** (可衡量): the same shapes across plans make them comparable, checkable by lint, and reviewable in seconds. If a conclusion cannot be expressed in the fixed shape, it does not belong in the plan — it belongs in the source document.

## 3. Header meta block (头部元信息块)

- **来源 (source)** — required: the issue card and the failure analysis (the plan's origin).
- **当前 wave (current wave)** — required: the state pointer naming the wave being executed. A fresh agent session reads the header and resumes here.
- **上次执行 / 下一步** — optional checkpoint: last execution state and the next action.

## 4. Section 1 — 目标与完成判定 (Goal & Completion)

A one-sentence goal; completion criteria are externally verifiable and correspond to the wave checkboxes.

## 5. Section 2 — 动因与证据 (Motivation & Evidence)

Bounded (2–5 lines). Conclusions and evidence pointers only; never repeat the analysis process. Evidence pointers are paths to durable artifacts.

## 6. Section 3 — 范围与拆分方案 (Scope & Decomposition)

- **Sub-goals**: each has a 方案 (approach) line — required. The 取舍 (trade-off) rationale is written **only when ≥2 viable options existed or the choice is non-trivial**, one sentence ("chose X because A/B; rejected Y because C"). *Finalized (round 1).*
- **非目标 (non-goals)**: **required** subsection; write `无` when nothing is excluded. Prevents scope drift — the core value of a one-time plan. *Finalized (round 1).*
- **授权 (authority)**: what the executing agent may decide autonomously vs what requires a human (e.g. adding a dependency / changing a contract → stop, list options, wait for confirmation). "Agent = advisor, human = decision-maker" inside the plan.

## 7. Section 4 — 影响与依赖 (Impact & Dependencies)

### 7.1 Dependencies as a DAG

- Nodes are **waves**; an edge `waveA -> waveB` means "waveA must complete before waveB starts".
- Representation: the text edge list (one `- waveA -> waveB` per line) is the machine source of truth; a mermaid `flowchart` block is **required** for human review. `pctl plan lint` verifies: mermaid present and edge-consistent with the text list, all nodes are defined waves, the graph is acyclic, and the execution order in section 5 is a topological order.
- **Parallelism is implicit**: waves with no path between them may run in parallel (lint derives it from the DAG complement; it is not maintained separately).
- **Failure fallback is not expanded per edge**: assumption-like dependencies are covered by the wave's 退出条件 (falsification evidence → stop, escalate to human); tooling-internal failures are runtime decisions. *Finalized (round 1).*

### 7.2 Impact as a conclusion table (CIA-lite + risk matrix)

Method anchors: change impact analysis (dependency tracing + ripple), ISO 31010 risk matrix — adapted to personal-project scale. The table carries conclusions; the analysis stays in the source documents.

| Column | Fixed shape |
|---|---|
| 受影响对象 (affected surface) | `component:*` vocabulary, or `无` when nothing is affected. One vocabulary, no new words. |
| 契约影响 (contract impact) | the impact dimension: `none` / `check` / `contract-change`. |
| 传播路径 (propagation) | downstream reach along the dependency DAG (ripple). |
| 风险 (risk) | probability × severity, each 1–3. Rows above the chosen threshold need explicit fallback/verification (see 验证方式). |
| 验证方式 (verification) | how the impact is checked (regression, contract review, …). |

## 8. Section 5 — 执行计划 (Execution Plan, wave0..N)

- Waves are implementation steps of **this one task**; a wave does not map 1:1 to an issue, and its state is **not** tied to the issue state vocabulary.
- `### wave0` is a fixed slot: tasks with assumptions/uncertainty use it to verify assumptions / reproduce the failure (the plan's origin); without assumptions write `无`. *Finalized (round 1).*
- Each wave has:
  - **checkbox acceptance list** (外部可验证): checked boxes **are** the progress — the human scans checkboxes, not a status enum.
  - **退出条件 (exit condition)**: pairs with the wave's assumptions; when falsification evidence appears, stop and escalate to the human. `无` when the wave has no assumption.
- **Status model** (*finalized, round 3*): no state enum. Progress = checkboxes; position = the header 当前 wave pointer; interruption reason = an optional note line (`> 注记: <原因>`) when a wave stops uncompleted — it prevents a resuming agent from mistaking an aborted wave for unfinished-by-default.
- **Resumption**: a fresh session reads the header pointer, the wave checkboxes, the 注记 lines, and the context index — that is the entire handoff.

## 9. Back matter — 权威来源与上下文索引 (Sources & Context Index)

Required. Turns the plan into a self-contained, context-indexed prompt: source card, failure analysis, spec/design, evidence & artifacts (tmp paths), protocol locations (`.project/requirements/`, `.project/plans/`). A resuming agent fetches everything from here.

## 10. Machine gate (`pctl plan lint <file>`)

Structural floor only (semantics stay in this document):

- five sections present, in order, non-empty
- back matter present
- header has 来源 + 当前 wave pointer
- DAG: mermaid required when edges exist, edge-consistent with the text list, all nodes defined, acyclic, execution order is a topological order
- impact table: ≥1 data row, component vocabulary / `无`, impact value, risk 1–3 × 1–3
- waves wave0..N contiguous; checkbox acceptance + 退出条件 per wave; wave0 allows `无`
- pointer/checkbox consistency: the pointed wave must not be fully checked while unchecked boxes remain

## 11. Language

plan.md content is generated in Chinese (language policy, see requirements/card-format.md); section headings follow the template exactly (lint matches them). This document is English-normative.
