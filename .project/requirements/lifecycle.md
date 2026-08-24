# Lifecycle

The requirement lifecycle has five stages. Each stage names its mechanism and its automation. Defaults (stale/close thresholds, tmp orphan window) are deliberately loose: activity is pulse-like, and false kills are worse than slow ones.

## 1. Capture (收集)

- The user's natural phrase 「记一笔 / 记一下」 keeps its meaning. The local agent classifies intent:
  - **A new idea** (a tangent from the current discussion) → **capture fork**: a `subagent_fork` inheriting the discussion context opens an idea card via `pctl req new`. The main thread is never polluted; the fork is re-entrant (the user can keep pushing the card from either thread at any time).
  - **Handoff for the current task** → `tmp/<date>/<topic>/prompt.md` (existing practice).
- The fork judges maturity:
  - Clear idea → card with a summary + a **structured draft comment** (acceptance criteria, priority, effort suggestions). Drafts are comments, never committed fields; the card stays `idea` until confirmed.
  - Fuzzy idea → a bare one-line card (title + link). No forced structuring.

## 2. Refine (提炼)

- The user confirms a draft at any time with a lightweight gesture (对 / 改 / 先这样).
- Gate to `ready` (enforced by `pctl req ready` and the weekly scan): the card must have non-empty acceptance criteria, a priority label (`p0`–`p3`) and an effort label (`xs`–`l`). Missing pieces are reported, not silently tolerated.

## 3. Record (记录)

- A card carries only **summary + decisions**. Discussion logs are never archived; when a session ends it is gone, and that is correct.
- A decision is recorded in the card only when a discussion actually concludes one, following the `decision.md` habit: conclusion, reason, landing.
- Links on a card point to durable artifacts (a spec, a design doc), not to "that one session where we talked".

## 4. Schedule (排期)

- A milestone is a version bucket. Default granularity is per workstream (`ws:execution`, …). The **MVP is the special case**: one milestone spanning all components — the answer to "what does the MVP contain" is that milestone.
- The `ready` pool is the "eligible but not yet committed" set. An agent drafts a milestone composition (priority / dependencies / effort / cross-workstream alignment) from the pool; the user confirms or adjusts once. Agents draft, humans decide.

## 5. Retire (清退)

- Two-step review. First the agent self-screens: duplicates, conflicts with the current main line, or clearly unviable cards get a **removal suggestion**. Only the genuinely doubtful remainder is presented to the user for a 续命 / 关闭 decision.
- Retirement is `close` + a one-line reason + label `retired`. `reopen` revives at any time; there is no separate archive mechanism.
- Parameters (loose defaults): **90 days** without interaction → `stale` + a "still relevant?" comment; **30 more days** without interaction → auto-close. Interaction = any comment or refinement action on the card. Exempt: cards in the current milestone, `in-progress`, `blocked`, and cards younger than 30 days.

## Pending decisions (needs-decision)

- Anything awaiting the human's ruling carries `needs-decision` (a removal suggestion, a doubtful stale card, a gate failure that needs judgment). The queue is `gh issue list --label needs-decision --state open` (`pctl req flag` sets/clears the label); the GitHub app notification is only the (ephemeral) reminder.

## tmp hygiene

- The agent executing a tmp task deletes its own `tmp/<date>/<topic>` directory when the task closes (delivered or abandoned).
- On session open, optionally run `pctl tmp-scan`; orphan directories older than **30 days** are listed for a one-line confirm (keep / delete).
