# Iteration 5 Wave 8 Evidence — Recorded Trace structure and finite reading

## Result

- Status: `PASS`.
- BI implementation: `wsr-ui@d67ba3c`.
- Evidence input: `evidence-system@030e6ee14f689b828f62e2c66333a9f0da7d7e00`.
- Evolution input: `evolution-system@294409c03a8b910fbc939b24c2df7ee9eec90e74`.
- Superproject design/retention input: `a84e377e403c69e137c90e9bc7a00c40023c269b`.
- Issue: [#54](https://github.com/firestige/workflow-self-recursive/issues/54), kept OPEN through Wave12.

The `/evaluate/trace/:trace_id` drill-down now reads bounded Evidence Trace pages and presents only
recorded `NODE`, `PARENT_EDGE` and `LINK` structure. Parent depth, sibling grouping and finite Live
reading do not consume timestamps, arrival order, names or Task grouping. Delivery-atomic deletion
appears as not-found and never reconstructs expired items.

## Authority and query proof

- The closed decoder requires every rendered Trace item to be active and verifies item, recording
  source, node and edge identities. A direct Trace response must match the exact requested Trace.
- Pagination completes before projection and holds one route-local snapshot, Trace state and complete
  summary set. It rejects repeated cursors, duplicate item/canonical identities, initial active empty
  pages, snapshot/summary drift and configured page/item bounds.
- `CURSOR_EXPIRED` remains a typed recovery reason. `ABSENT` and historical empty `EXPIRED` envelopes
  converge on current Delivery-deleted not-found behavior; neither can carry rendered items.
- Request generations are invalidated at route cleanup, so a stale response cannot replace a newer
  Trace. Trace/span route changes also reset focus and motion rather than carrying ambient state.

## Recorded-structure and interaction proof

- Depth is derived only from recorded `PARENT_EDGE`. Same-depth siblings are sorted by exact endpoint
  identity and revealed together; removing or changing timestamps, arrival position or span names does
  not change layout or traversal.
- `LINK` is independent of the parent map. It uses a dashed SVG line plus explicit `LINK` text and a
  keyboard-focusable fallback retaining both complete `trace_id:span_id` endpoints.
- The D3/SVG graph and structured outline share the same projected records. Every recorded parent edge
  has a keyboard fallback. A missing endpoint suppresses only an unplaceable SVG line; the exact edge
  remains readable and the endpoint stays in the separate unresolved lane without inferred depth.
- Cycle and multiple-parent topology fail to `INVALID`, expose an alert, disable Live and preserve the
  recorded relation fallback. No repair from time or name is attempted.
- `PARTIAL` is a Trace-level known-hole status. Present items remain `AVAILABLE`; unresolved endpoints
  use `UNRESOLVED`. Per-item Trace `PARTIAL` was removed from the view-model vocabulary.
- Still is default. User-started Live reveals one recorded depth at a time, reveals siblings together,
  terminates at `COMPLETE`, and can be stopped. Initial or dynamically enabled reduced motion restores
  the complete structure in Still mode.

## Navigation, responsive and accessibility proof

The exact deep link preserves selection, metric, scope, side, optional Fact and optional Span identity;
Back reconstructs the corresponding Evidence route. NODE, parent edge, LINK and orphan fallback entries
are native buttons. The graph has an accessible name, state uses redundant text, and the narrow viewport
keeps page-level horizontal overflow at zero while the bounded graph owns local overflow.

Browser oracles cover siblings, parent edges, independent LINK, orphan identity, finite Live, initial and
dynamic reduced motion, Delivery-deleted not-found, narrow layout, exact Evidence return identity,
keyboard navigation, theme parity, forced colors and print identity.

## Final validation

At the production-equivalent `wsr-ui@27152af`:

```text
npm test && npm run typecheck && npm run lint && npm run format:check &&
npm run deps:check && npm run build && npm run browser
```

Result: **26 files / 201 tests PASS**; strict TypeScript, ESLint, Prettier and dependency inventory
PASS; Vite production build PASS; **15 Playwright tests PASS**. Final `d67ba3c` changes only one oracle
fixture line; the full **201-test** suite and format check passed again, and focused decoder tests,
typecheck and lint passed before the commit.

## Independent exit review

The existing read-only Wave8 Trace oracle reviewed exact `wsr-ui@d67ba3c` with `git show`. Final
disposition: `PASS`, P0=0, P1=0, P2=0. Its reviews found and verified closure of exact Trace identity,
pagination authority, parent-edge fallback, Trace-level PARTIAL, dynamic reduced motion, stale response,
initial active empty page and mutant-sensitivity gaps; none was waived.

## Checklist disposition

| Wave8 exit item | Result | Evidence |
|---|---|---|
| RED coverage for shape, paging and states | `PASS` | NODE/PARENT_EDGE/LINK, orphan, active PARTIAL/ABSENT, deletion, bounds and cursor tests |
| Recorded parent structure only | `PASS` | timestamp/arrival/name negative tests; endpoint-identity depth and sibling ordering |
| Finite MotionGovernor behavior | `PASS` | Still default, user-started finite Live, stop/reset and dynamic reduced-motion browser oracle |
| Accessible graph and fallback | `PASS` | D3/SVG graph plus keyboard NODE/PARENT_EDGE/LINK/orphan outline |
| Exact navigation and recovery | `PASS` | bounded Trace deep link, stale-request guard, typed expiry/not-found and exact Back route |
| Delivery-atomic retention boundary | `PASS` | ACTIVE-only item decoder and deleted Delivery not-found without reconstructed detail |
| No downstream or excluded semantics | `PASS` | no authored reach, causal inference, AI attribution or Workflow mutation |
| Independent exit review | `PASS` | exact `d67ba3c`, P0=0/P1=0/P2=0 |

## Downstream release

Wave8 closes #54's implementation slice while keeping the issue open through Wave12. Wave9 is released
for same-origin Nginx serving, container networking, health and degraded-path integration. Wave9 must not
move metric calculation into BI/Nginx or expose PostgreSQL to any component other than Evidence.
