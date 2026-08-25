---
name: requirements-capture
description: Dispatch "记一笔" style capture requests into the requirement lifecycle — idea cards via a capture fork, or tmp task handoff. Use when the user says 记一笔/记一下/记下来/开卡/开个卡/记个想法 or expresses capture intent about a new idea, or asks to scan tmp.
---

# requirements-capture

Small skill: triggers and dispatch only. Protocol details live in the repo's `.project/requirements/` — read them, do not restate them here.

## Trigger phrases
「记一笔」「记一下」「记下来」「开卡」「开个卡」「记个想法」or any capture intent about a new idea.

## Dispatch (classify intent, then act)

1. **拐弯的新想法 / 新需求 / 新问题** (a tangent from the current discussion) → **CAPTURE FORK**: spawn `subagent_fork` (inherits this discussion's context) with: judge maturity — clear → `pctl req new "<title>" [--link URL]` plus a structured draft comment via `--draft`; fuzzy → bare one-line card, no forced structure. The fork works in its own context; this thread stays clean. The fork is re-entrant: the user may keep pushing the card from either thread later.
2. **当前任务的执行交接** (handoff for the task being executed) → **TMP**: write `tmp/<date>/<topic>/prompt.md` (existing practice, high-fidelity handoff). Do not open an issue.
3. **Ambiguous** → ask one question.

## Card operations
Always use `pctl` (`pctl req new|queue|ready`, `pctl tmp-scan`). Never hand-roll gh commands for card operations. Repo is inferred from the cwd's git remote.

## tmp hygiene
- The agent executing a tmp task deletes its own `tmp/<date>/<topic>` when the task closes (delivered or abandoned).
- On session open, optionally run `pctl tmp-scan` and list orphan directories (> 30 days) for a one-line confirm.

## Protocol
- Lifecycle, gates, retirement params: `.project/requirements/lifecycle.md`
- Vocabulary: `.project/requirements/vocabulary.md`
- Card format: `.project/requirements/card-format.md`
- Online automations handoff: `.project/requirements/automations.md`
