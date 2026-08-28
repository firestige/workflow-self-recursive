# Iteration 5 Wave 7 Evidence — Metric Result and compare product view

## Result

- Status: `PASS`.
- BI implementation: `wsr-ui@f474e35`.
- Evolution contract input: `evolution-system@294409c03a8b910fbc939b24c2df7ee9eec90e74`.
- Evidence query input: `evidence-system@04fd564815cc12c7115473fabfde1680f3e23091`.
- Superproject contract/design pin: `24951ecb`.

The `/evaluate` product path now resolves exact Task selections through Evolution, renders the
authoritative receipt and all Catalog 2.0 candidate Result truth, and supports full or partial
Before/Delta/After comparison without browser-side metric or delta calculation. Task display names
are presentation only; Task IDs remain URL, equality, selection and receipt identity.

## Product and boundary proof

- Single and compare deep links use bounded canonical Task identities and restore metric/side focus.
- Task discovery is paged under one Evidence traversal snapshot, searchable over loaded display names
  or exact IDs, and independently retryable without losing selection.
- Dashboard layouts bind exact metric coordinates to a closed executable registry. The Wave7 registry
  contains numeric card, boolean badge, bounded ratio bar and lossless table. Domain-dependent gauge,
  bar, line and radar grammar remains deferred and cannot enter a saved layout.
- Compare consumes the same active layout as single. The navigator retains all 12 coordinates; a
  focused coordinate outside the layout is temporarily exposed as a lossless table.
- Before and After are Evolution side Results. Delta is the Evolution Delta entry; BI performs only
  two-decimal formatting and D3 scale/layout. Out-of-domain ratios fail to the exact table.
- `coverage: null` means coverage is unavailable and is never displayed as zero. A known empty
  population remains the distinct `0/0`, `NO_POPULATION`, `raw_ratio: null` object.
- Evidence drill-down preserves the receipt read-set identities, hydrates Facts only through Evidence,
  and restores history and focus. Trace traversal remains Wave8 scope.

## State, recovery and accessibility proof

The tested product matrix includes explicit zero, lower bound, unavailable, not applicable, expired,
incompatible, missing coverage, low coverage, API failure, partial compare, failed-side retry,
three responsive tiers, keyboard selection, skip navigation, inspector ownership/focus restoration,
theme selection, forced colors, reduced motion and print identity. A failed compare side owns one
assertive retry surface while the successful side remains rendered.

## Final validation

At the pinned BI head:

```text
npm run format:check && npm run lint && npm run typecheck && npm test &&
npm run build && npm run deps:check && npm run browser
```

Result: Prettier PASS; ESLint PASS; strict TypeScript PASS; **23 files / 186 tests PASS**;
Vite production build PASS; dependency inventory PASS; **10 Playwright tests PASS**.

At the pinned Evolution head:

```text
.venv/bin/ruff format --check src tests && .venv/bin/ruff check src tests &&
.venv/bin/mypy src && .venv/bin/pytest -q
```

Result: Ruff format/check PASS; mypy PASS; **159 tests PASS**.

## Independent exit review

The existing Wave7 compare/visualizer oracle re-reviewed exact `wsr-ui@f474e35` after its initial
findings were closed. Final disposition: `PASS`, P0=0, P1=0, P2=0. It independently confirmed the
1–24 panel bound, compare layout binding, executable-registry closure, UTF-8 slice identity,
coverage-null/sample/tablet browser oracles, live Issue alignment and the complete UI quality gate.

## Checklist disposition

| Wave7 exit item | Result | Evidence |
|---|---|---|
| Vertical-slice RED browser coverage | `PASS` | truth, coverage, error, narrow compare, theme and keyboard journeys |
| Selection, receipt and Result product flow | `PASS` | production Evolution client plus exact request/receipt identity tests |
| Complete published Result display | `PASS` | coordinate, exact value/unit, counts, measures, coverage, limitations, provenance and explanation |
| Presentation-only D3 boundary | `PASS` | bounded ratio visualization, exact table fallback and no BI formula/delta path |
| Issue #53 governance | `PASS` | live issue distinguishes immutable Catalog 1 history from current 12-coordinate candidate |

## Downstream release

Wave7 closes the Metric Result/compare product slice and releases Wave8. Wave8 owns deterministic
recorded parent-structure layout, LINK/orphan handling and finite Still/Live traversal; it must not
reinterpret timestamps or arrival order as causality.
