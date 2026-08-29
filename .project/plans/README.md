# Execution Plan (plan.md) — Protocol (Single Source of Truth)

This directory is the **normative source** for the execution-plan (plan.md) protocol. It is a vendored copy installed by `pctl init` from the `project-ops` package; the authoritative upstream is that package. Normative language is English (Chinese is a tracking translation). plan.md content itself is generated in Chinese (language policy — see requirements/card-format.md).

## What a plan is

A plan.md is the **one-time execution document for a single task** — the bridge between "failure analysis / spec" (the source) and "executed work". It is **reviewed by a human and executed by an agent**, so the format must serve both consumers:

- **human review**: mermaid DAG, checkbox progress, compact conclusion tables
- **agent execution & resumption**: machine-checkable text edge list, header state pointer, context index

"One-time" refers to task scope (not a perpetual backlog of fix tasks); resumability refers to the same task's execution continuity across agent sessions.

## Documents

- [plan-template.md](plan-template.md) — the canonical format (a filled example: copy + fill). Copying the template keeps the machine-checkable shapes intact.
- [plan-rules.md](plan-rules.md) — content rules per section and why they exist: the dual-consumer principle, conclusions-on-the-plan, the DAG and impact (CIA-lite + risk matrix) methods, the wave status model, and the finalized decisions.

## Machine gate

- `pctl plan lint <file>` enforces the structural floor (five sections, header pointer, DAG integrity, impact table format, wave checkboxes / exit conditions, pointer consistency). Semantic rules live in plan-rules.md, not in the linter.

## Principles

1. **Dual-consumer format**: every element serves the human reviewer or the agent (or both, via lint).
2. **Conclusions on the plan, analysis in the source**: the plan carries dependency edges, risk numbers, impact surfaces — never the reasoning that produced them.
3. **Standard methods make conclusions measurable**: same shapes across plans → comparable, checkable, lintable.
4. **One-time scope, resumable execution**: the plan is scoped to one task; the header pointer + wave checkboxes let a fresh agent session resume.
5. **One vocabulary**: impact surfaces use `component:*` labels; contract impact uses the impact dimension (`none` / `check` / `contract-change`).
