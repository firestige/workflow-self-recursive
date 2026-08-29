# Naming convention

**Status: DRAFT for review (2026-08-25).** This document records, for the first time in writing, the naming governance decisions that have been applied de facto since 2026-08-19. It is the deliverable for the remaining acceptance item of issue [#36](https://github.com/firestige/workflow-self-recursive/issues/36) ("特性 ID 格式（单词[.单词]，无数字，含文档权威 ID 映射表）"). It does not claim publication authority until reviewed and confirmed.

## 1. Scope

Naming governance covers three decisions, tracked together in #36:

1. **Repository name** — the formal product/repository name and its writing form.
2. **Engine name** — the executor's name and the surrounding role vocabulary.
3. **Asset ID format** — the dotted ID scheme used across docs, contracts, and issue cards, including the authoritative ID mapping table.

Not covered here: DSL naming inside Workflow Contracts (owned by their contract documents), and file paths (owned by repository layout conventions).

## 2. Repository name

- **Formal name: `workflow-self-recursive`** (lowercase, hyphenated, ASCII). Always written in this form in new artifacts.
- **The codename `Agent Ops Ledger` is retired.** It survives only in historical records (CHANGELOG, git history, prior issue cards). No new artifact may use it.
- **Rename executed**: commit `ed5d243` (2026-08-20) — FPLG → runner (268 occurrences), Agent Ops Ledger → workflow-self-recursive (53), repository slug change (12), EN↔ZH parity kept, 5 submodule pointers bumped. Grep verification: old names are gone from the current tree.
- **Slugs**: GitHub repo `workflow-self-recursive`; npm packages use the `wsr-<system>` namespace (see §6).

## 3. Engine and role vocabulary

The executor is named **`runner`** (执行器). The role vocabulary (the naming system decided 2026-08-19) is:

| Role | Meaning |
| --- | --- |
| `intake` | host entry point (currently the DSH intake); the 宿主入口 |
| `runner` | the executor — an execution module that runs the workflow configuration graph |
| `agent provider` | the agent capability provider (DSH headless / Copilot SDK / Codex CLI adapter surface) |

Component naming under `runner` uses dotted classifications that bind to the owner domain, e.g. `execution.runner.host`, `execution.runner.interpreter`, `execution.runner.coordinator`, `execution.runner.invocation`, `execution.runner.custody`. Component renames follow the feature-structure change-log discipline (B 组变更记录), not ad hoc edits.

## 4. Asset ID rule — 名词[.名词]

An asset ID is up to three dotted nouns:

```
owner.classification.asset
```

- **Segment 1 — owner**: the domain prefix that owns the asset. Full word, lowercase. Registry in §5.
- **Segment 2 — classification**: the kind of asset within the owner domain (`acceptance`, `decision`, `contract`, `milestone`, `scenario`, `module`, `fixture`, `obligation`, `path`, `view`, `flow`, `driver`, `interface`, `submodule`, `open-work`, …). One classification per family; a family is a set of assets of the same kind under one owner.
- **Segment 3 — asset**: the name of the specific asset — a full word (e.g. `invocation`, `custody`, `admission`) or a zero-padded ordinal (e.g. `001`, `017`) where assets are enumerated. The ordinal, when present, is **always the final segment of the ID**: no letter suffixes or sub-ordinals may follow it in new IDs (legacy `runner.open-work.003.x` and `evidence.path.04a` are grandfathered).

Syntax constraints:

- lowercase ASCII only; the only separator is `.` (no hyphens, underscores, or spaces inside an ID)
- **word segments contain no digits** — the ordinal is the only numeric segment (this is the written form of #36's "无数字")
- no abbreviations in new IDs (§7)
- ordinals are **three digits, zero-padded, always the final segment** (`001`, `017`, `003`). Legacy families with other padding (`execution.milestone.01`, `contract.gate.1`) or suffixes after the ordinal are grandfathered; every new numbered ID ends with the 3-digit ordinal

Feature cards use the same rule in the title, one level shallower: `[type] owner.classification` (e.g. `[feature] evidence.admission`) or `[type] owner.classification.asset` for runner internals (e.g. `[feature] execution.runner.invocation`).

## 5. Owner registry and authoritative ID mapping table

This table is the de facto authoritative inventory (extracted from the current tree on 2026-08-25). New IDs must belong to an existing row or extend it by decision.

| Owner | Meaning | Classification families | Example IDs | Owning surface |
| --- | --- | --- | --- | --- |
| `concept` | conceptual authority docs and their decisions | `identity`, `acceptance`, `obligation`, `decision`, `fixture` | `concept.identity.001`, `concept.acceptance.017`, `concept.obligation.011`, `concept.decision.018`, `concept.fixture.003` | `docs/agent-architecture.md` |
| `execution` | execution system | `scenario`, `milestone`, `module`, `decision`, `open-work` | `execution.scenario.01`, `execution.milestone.02`, `execution.module.001`, `execution.open-work.003` | `docs/systems/execution/`, Execution issue cards |
| `runner` | runner engine internals | `acceptance`, `decision`, `scenario`, `view`, `flow`, `driver`, `interface`, `submodule`, `open-work` | `runner.scenario.01`, `runner.interface.004`, `runner.open-work.003.x`, `runner.driver.001`, `runner.flow.010` | `docs/systems/execution/modules/runner/` |
| `observation` | observation contracts | `contract` | `observation.contract.001` | `docs/contracts/observation/` |
| `contract` | contract lifecycle gates | `gate` | `contract.gate.1` | `docs/contracts/contract-lifecycle.md` |
| `evidence` | evidence system | `scenario`, `milestone`, `path` | `evidence.scenario.01`, `evidence.milestone.02`, `evidence.path.04a` | `docs/systems/evidence/` |
| `evaluation` | evaluation / metric catalog | `contract`, `definition` | `evaluation.contract.001`, `[doc] evaluation.definition` | `docs/contracts/evaluation/` |
| `workflow` | workflow package surface | `definition`, `schema`, `authority`, `package`, `contract.publish` | `[doc] workflow.definition`, `[doc] workflow.contract.publish` | Issue cards |
| `bi` | visualization / reporting surface | `factual`, `trace`, `serving` | `[feature] bi.factual` | Issue cards |
| `product` | product-level concerns | `entry`, `independent` | `[feature] product.entry` | Issue cards |
| `evolution` | evolution loop | `loop`, `evaluate`, `revise` | `[feature] evolution.loop` | Issue cards |

Additional `execution` feature-card classifications in use: `delivery`, `observation`, `runner`, `release` (`[feature] execution.delivery`, `[feature] execution.observation`, `[chore] execution.release`).

## 6. Package naming (npm / DSH plugin)

- Namespace: `wsr-<system>`, **no npm scope**. Decided 2026-08-25.
- Current: `wsr-execution` (execution system), `dsh-wsr-execution` (product-level entry; currently carries Execution capability).
- Reserved: `wsr-evidence`, `wsr-evolution` (for the closed loop).
- Rationale: DSH ecosystem convention (short unscoped names: `dsh-plugin`, `dsh-auto-update`, …); short install command; no npm org needed; consistent with "systems are first-class, DSH is the entry" organization decision.

## 7. Abbreviation policy — no abbreviations, ever

**Problem**: agents naturally use abbreviations instead of the full words the convention specifies. The answer is not an approved-abbreviation list — it is a strict prohibition plus word-selection discipline that keeps full words short.

- **Rule**: abbreviations are **never** allowed in asset IDs — not in the `owner` segment, not in the `classification` segment, not in word-form `asset` segments. There is no approved-abbreviation list; any token that is not a full word from the registries in §5 is rejected.
- **Word-selection criteria** (the reason full words stay short enough that nobody needs to abbreviate):
  1. **简单 (simple)** — prefer short, common words over compound descriptions.
  2. **明确 (unambiguous)** — the word must have exactly one meaning within its owner domain; no overloaded prefixes.
  3. **符合行业惯例 (industry convention)** — use the term the industry already uses (`runner`, `intake`, `contract`, `milestone`, `scenario`, `trace`), not invented vocabulary.
  - A well-chosen full word is as short as its abbreviation would be; if a proposed word is long, the fix is a better word, not an abbreviation.
- **Legacy / resolution table** — historical abbreviations and overloaded prefixes that must not be reused, and how to resolve them:

  | Legacy token | Resolution |
  | --- | --- |
  | `FPLG` | → `runner` (renamed in commit `ed5d243`) |
  | `SC` (overloaded) | → `runner.scenario` / `evidence.scenario` (split in commit `ec31cfe`) |
  | `exec`, `ev`, `obs`, `con` | → always the full words `execution`, `evidence`, `observation`, `contract` |
- **Enforcement**: a CI/grep check rejects any ID token that is not in the §5 owner/classification registries and rejects digits in word segments; `pctl` may host the check. Until the check lands, review catches violations.

## 8. Review record

Decisions confirmed on 2026-08-25:

1. **Ordinal padding — resolved**: three digits, zero-padded, always the final segment. Existing legacy forms (`execution.milestone.01`, `contract.gate.1`, `evidence.path.04a`) are grandfathered; a cleanup migration is optional and, if pursued, is a separate chore card.
2. **"无数字" interpretation — resolved**: word segments contain no digits; digits appear only as the final 3-digit ordinal.
3. **Abbreviations — resolved**: never allowed; word selection must follow the simple / unambiguous / industry-convention criteria in §7.
4. **Document authority — pending**: this document is a `docs/reference/` reference doc (EN authoritative + ZH tracking translation), not a contract. Confirm placement before the next commit.
