# BI design assets

## Iteration 6 Studio embedding candidates

The following executable HTML prototypes are versioned design assets governed by [`../bi-studio-ui-ux-design.md`](../bi-studio-ui-ux-design.md):

- [`studio-dashboard-layout-candidate.html`](studio-dashboard-layout-candidate.html): Desktop, Tablet, and Narrow dashboard composition, finite panel spans, first-row workspace navigation, and theme direction;
- [`studio-page-family-impression.html`](studio-page-family-impression.html): Select, Dashboard, Waterfall, and Tree as one Host-owned page family with shared breadcrumbs, secondary navigation, title/context, and actions;
- [`studio-trace-waterfall-candidate.html`](studio-trace-waterfall-candidate.html): default APM Waterfall, span outline, shared recorded-time domain, minimap, detail, and finite playback;
- [`studio-trace-tree-candidate.html`](studio-trace-tree-candidate.html): deterministic parent-depth call tree, distinct links, semantic lenses, Span Passport, camera map, and finite playback. Statistics is an exact-data sibling in the production registry; a future Flame Graph may be appended after it when separately authorized.

These prototypes freeze information hierarchy, responsive relationships, and interaction grammar. They are not production dependencies or pixel-perfect screenshot baselines. Production components must implement the normative document and pass their own theme, responsive, accessibility, motion, and visual gates.

The prototypes show complete Host compositions; their visual regions are not package boundaries. Header/Footer content, controls, concrete layout, and integrated page state belong to each `wsr-*` Host. Individual business panels and contract-related presentation logic belong to `wsr-ui-core`; Host regions may also compose core semantic visual primitives. See the reusable-asset/assembly map in the normative design.

Rejected Iteration 6 experiments remain in `qualification/iter6/issue-170/studio-ui-ux/`; they are decision history and must not be used as implementation authority.

## Iteration 5 style frames

Current Wave3 candidate style frames are the four `style-frame-bi-*` light/dark pairs:

- `single`: single evaluation with the metric inspector open;
- `compare`: full Before/Delta/After compare;
- `trace`: recorded parent-depth structure, independent LINK, and orphan lane;
- `states`: truth, interaction, recovery, and reduced-motion states.

SVG is the editable design authority. Matching PNG files are generated previews for convenient review and must remain visually equivalent to their SVG source.

The older `style-frame-factual*`, `style-frame-trace*`, and `style-frame-truth-states*` files are retained as historical G1 inputs. Their “WSR Evidence,” fixed `/factual`/`/trace`, browser-evaluator, and old snapshot implications are superseded and must not be used as Iteration 5 authority.
