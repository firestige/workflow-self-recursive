# Requirements Lifecycle — Protocol (Single Source of Truth)

This directory is the **normative source** for this repository's requirement lifecycle. It is a vendored copy installed by `pctl init` from the `project-ops` package; the authoritative upstream is that package. Normative language is English (Chinese is a tracking translation). If a translation diverges, the English text wins. Issue content language is a separate policy — see [card-format.md](card-format.md): the template is bilingual, mechanism-generated content is Chinese, user content is unrestricted.

## Architecture in one paragraph

**Data lives on issues (labels + milestones). Projects is only a view. `tmp/` is a throwaway execution workspace.** The issue is the single source of truth: every card, state, decision, and schedule is machine-writable and machine-queryable via `gh` and Copilot automations. GitHub Projects v2 shows label/milestone-filtered views and never stores state of its own. `tmp/` holds only the handoff for the task currently being executed and is cleaned when the task closes.

## Documents

- [lifecycle.md](lifecycle.md) — the five stages: capture, refine, record, schedule, retire.
- [vocabulary.md](vocabulary.md) — the single label vocabulary and who consumes each dimension (rendered protocol copy).
- [vocabulary.json](vocabulary.json) — the vocabulary as structured data (machine source: `pctl init` creates labels from it).
- [card-format.md](card-format.md) — what a card body contains (summary + decisions).
- [automations.md](automations.md) — the online Copilot automations to create in the GitHub UI (handoff for the one UI-only step).

## Local pieces

- Skill `requirements-capture` (installed at `~/.agents/skills/requirements-capture`, vendored at `.project/skills/requirements-capture`): small trigger/dispatch rules only. Protocol details live here, not in the skill.
- CLI `pctl`: deterministic card operations. Agents call the CLI; they do not hand-roll `gh` commands for card operations.

## Principles

1. Agent = advisor, human = decision-maker.
2. Event-driven over ritual: anything periodic is automated or eliminated.
3. Every label dimension must be consumed by automation or a query, or it is removed.
4. State transitions are audited, not trusted.
5. One vocabulary, no duplicated dimensions.
6. Small skill, normative ref, deterministic code.
