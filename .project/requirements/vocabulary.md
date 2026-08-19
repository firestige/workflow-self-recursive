# Vocabulary

One vocabulary, no duplication. Every dimension below is consumed by automation or
a query (see "Consumed by"). Dimensions without a consumer are removed.

GitHub default labels (`bug` reused as type; `documentation`, `enhancement`,
`duplicate`, `question`, `invalid`, `wontfix`, `good first issue`, `help wanted`)
are not part of this vocabulary. Prefer the vocabulary names in queries and automation.

## State — one per card (except `needs-decision`, which can coexist)

| Label | Meaning | Consumed by |
|---|---|---|
| `idea` | raw idea card, not yet refined/confirmed | capture fork sets; `pctl req ready` removes |
| `ready` | refined, gate passed, eligible for scheduling | `pctl req ready` sets; milestone drafting reads |
| `planned` | assigned to a milestone | milestone drafting sets |
| `in-progress` | being worked on | human/agent sets when starting; audit checks |
| `blocked` | waiting on something | human/agent sets |
| `stale` | machine flag: no interaction for 90 days | weekly scan sets; retirement consumes |
| `retired` | retired with reason, card closed | retirement sets alongside close |
| `needs-decision` | awaiting human ruling | weekly scan / removal suggestions set; cleared on ruling |

## Type — one per card

| Label | Meaning |
|---|---|
| `feature` | capability / functional work |
| `bug` | defect |
| `doc` | document / design / contract deliverable |
| `benchmark` | evaluation / baseline / validation work |
| `chore` | maintenance / tooling / meta work |
| `memo` | the deliverable itself is a note / record |

## Component — one per card (workstream mapping)

`component:execution` · `component:evidence` · `component:evolution` ·
`component:contracts` · `component:workflow-package` · `component:meta`
(mechanism improvements about this process itself).

## Priority — one per card

`p0` · `p1` · `p2` · `p3`

## Architecture impact — one per card

`impact:none` · `impact:check` · `impact:contract-change`

`impact:contract-change` is the load-bearing query for a preview-stage,
contracts-driven project: `gh issue list --label impact:contract-change` answers
"what would reopen system design boundaries".

## Effort — one per card

`xs` · `s` · `m` · `l`

## Scheduling

GitHub **Milestones**, not project fields. Per-workstream by default
(`ws:execution`, …), one `mvp` milestone spanning all components as the special case.
