# Card format

A card is self-sufficient: when the tmp note is gone and the session has ended,
the card still answers "why, what, and why this way".

## Body

```
## Summary
问题、要点、为什么值得做 (one sentence to one paragraph).

## Acceptance criteria
- [ ] ...   (must be non-empty for the `ready` gate)

## Decisions
### YYYY-MM-DD — <topic>
- 结论: ...
- 理由: ...
- 落地: ...
```

- **Summary** and **Acceptance criteria** are written by the capture fork; the user
  confirms.
- **Decisions** are appended only when a discussion actually concludes one
  (conclusion, reason, landing — the `decision.md` habit moved into the card).
- **Links** point to durable artifacts only (spec, design doc). Session links are
  not recorded; discussion logs are never archived.

## Draft comments

A clear idea gets a structured **draft comment** (suggested acceptance criteria,
priority, effort). Drafts are comments — never the committed body or labels — so a
half-formed idea can't accidentally commit to structure. The card stays `idea`
until the user confirms (对 / 改 / 先这样).

## Bare cards

A fuzzy idea is a one-line card: title + optional link, no forced structure. The
refine stage later fills it, or the retirement stage clears it.
