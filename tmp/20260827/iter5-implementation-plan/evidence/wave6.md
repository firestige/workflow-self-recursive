# Iteration 5 Wave 6 Evidence — BI clients and presentation foundations

## Result

- Status: `PASS`.
- Wave5 Evolution input: `evolution-system@b6aef072ba313acbd29a0dd747493d8a30f93250`.
- Evidence query input: `evidence-system@80e2f12d291ec95f1c298e85dde6747996fa344f`.
- Machine-contract input: `system-contracts@d3f8876d3d02226814e1db3fcac5785a5ce64647`.
- BI implementation: `wsr-ui@205c2d50d052995ee76ac7b12de1b1c7a1c3f98f` on `iter5/implementation`.
- UI design authority: `docs/systems/bi/bi-ui-design.md` and its Chinese companion at the current superproject feature branch.
- Implementation baseline: `wsr-ui/docs/implementation-baseline.md@201268e` plus the Wave3 rebaseline addendum.
- Issue input: [#53](https://github.com/firestige/workflow-self-recursive/issues/53), OPEN, updated `2026-08-28T03:08:43Z`.

The BI now has closed TypeScript clients for authoritative Evolution Metric Results/receipts and
Evidence Fact/Trace pages, semantic Tailwind bindings, and composable presentation foundations. The
browser contains no Catalog formula or metric calculator. Exact integers and rational values remain
canonical strings; coverage always carries exact string counts and explicitly carries `null` when a
ratio or alert is absent.

## Ownership and implementation slices

Wave6 changed only `wsr-ui` BI-owned source, tests and preview surfaces:

- `packages/bi/src/domain/evolution/**`: closed response decoder, bounded transport, exact-value and
  compare validation, and request-to-receipt selection binding.
- `packages/bi/src/domain/evidence/**`: route-narrowed read-only clients, closed filters, bounded
  streaming decoder, exact identities, ordering, lifecycle and Trace aggregation validation.
- `packages/bi/src/components/**`: Metric Result, result/coverage/Evidence status, explanation,
  complete receipt, owned inspector, compare navigator, Evidence Console, recorded-structure outline,
  and controlled Still/Live foundations.
- `packages/bi/src/styles.css`: paired light/dark semantic roles and bindings for type, space, density,
  shape, surface, border, status, compare, data, focus, layer, print and motion.
- `packages/bi/src/preview-fixtures.ts` and `/preview`: client-valid Metric Result/receipt fixture,
  complete truth-state matrix, D3 presentation-only ratio bar, table fallback and accessibility states.

It did not modify calculator formulas, Evidence storage/admission, Workflow mutation, AI attribution,
product `/evaluate` orchestration, Before/Delta/After composition, or Wave8 Trace layout/traversal.
Superseded browser evaluator and Catalog-binding code was deleted; those deletions remain recoverable
from Git history.

## Boundary proof

1. Evolution values, measures, numerator, denominator, contributing counts and coverage counts decode
   as canonical strings; JavaScript `number` is not an authoritative integer carrier.
2. `coverage.raw_ratio` and `coverage.alert` are required fields and use explicit `null` for absence.
3. BI derives only a two-decimal display percentage and D3 bar width from an authoritative numerator
   and denominator. It does not publish, cache or write that display transform as a Metric Result.
4. Evidence clients expose only same-origin GET pages; Evolution exposes only the same-origin compute
   POST. Both enforce JSON, timeout and streaming byte bounds and reject unknown shapes/revisions.
5. A successful receipt must match the exact canonical Task selection submitted on the corresponding
   single or compare side; display names never participate in identity.
6. Fact, Trace and Metric truth remain distinct. `PARTIAL` is coverage/Evidence lifecycle vocabulary,
   not a seventh Metric Result truth state.

## TDD and validation evidence

Observed RED cases covered exact-integer wire preservation, malformed/nested response rejection,
status-tone separation, whitespace Task-name fallback, non-tab Evidence navigation, receipt proof
fields, withheld-result recovery, nonmodal inspector interaction, all six Metric Result states, finite
preview motion, table fallback, semantic token boundaries, closed Evidence filters and item ordering,
incompatible coordinates, and client-valid preview fixtures. Targeted GREEN tests were run after each
implementation slice and committed in reviewable changes below the 500-line text-change limit.

Final GREEN command at `wsr-ui@205c2d5`:

```text
npm run format && npm run format:check && npm run lint && npm run typecheck && npm test && npm run build && npm run browser && npm run deps:check && git diff --check
```

Result: Prettier PASS; ESLint PASS; strict TypeScript PASS; **10 test files / 102 tests PASS**;
Vite production build PASS; **4 Playwright tests PASS**; dependency inventory and diff checks PASS.
Browser oracles cover keyboard focus restoration, light/dark computed-role parity and 4.5:1 primary
contrast, forced-colors focus indication, reduced-motion Still behavior, and printed Trace identity.

## Independent review

- Executor/report/merge owner: primary Iter5 coordinator.
- Oracle reviewer: independent `wave6_exit_audit` reader, read-only.
- First review found the superseded browser calculator plus presentation/client gaps.
- Second review at `737e0a9` reported P0=0, P1=6, P2=1; none was waived.
- Third review at `205c2d5` returned `PASS`, P0=0, P1=0, P2=0. Before/Delta/After was correctly
  excluded because it is the explicit Wave7 output.

## Checklist disposition

| Wave6 exit item | Result | Evidence |
|---|---|---|
| Closed typed Evolution and Evidence clients | `PASS` | route/request narrowing, closed decoders, bounded transport and request/receipt identity tests |
| Semantic Tailwind tokens and paired themes | `PASS` | token boundary tests plus computed light/dark, contrast, forced-colors and print browser oracles |
| Metric Result and full truth states | `PASS` | exact values, counts, coverage, withholding reasons, mismatch coordinates and recovery actions |
| Explanation and resolved receipt | `PASS` | complete selection, Catalog, membership, Evidence binding, provenance and Workflow-resolution views |
| Evidence and recorded-structure foundations | `PASS` | three Evidence scopes, bounded table, lifecycle states, parent-depth groups, separate LINK/orphan lanes |
| Still/Live and accessibility foundations | `PASS` | controlled finite states, reduced-motion Still, focus ownership/restoration and nonmodal interaction |
| No BI calculator or downstream-wave leakage | `PASS` | superseded evaluator removal and architecture tests; no `/evaluate`, compare composition or Trace algorithm |
| Independent exit review and durable pin | `PASS` | final P0/P1/P2=0; this report and `wsr-ui@205c2d5` are pinned together |

## Downstream release

Wave6 is closed and Wave7 is released. Wave7 owns the real #53 single/compare product route,
selection restoration, visualizer/layout binding and Before/Delta/After composition; Wave8 remains
blocked until Wave7 PASS.
