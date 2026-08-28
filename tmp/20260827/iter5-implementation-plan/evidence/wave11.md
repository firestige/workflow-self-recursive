# Iteration 5 Wave 11 Evidence — component squash integration

## Result

- Status: `PASS`.
- Superproject integration candidate: `8bdd1434fc4ea508b3dc2664e652cb1b74854dba`.
- System contracts feature: `1a20bca4051fa2373031f249ebfc786cfcec4959`.
- System contracts main: `49d7b853d8617e29ce0667b1dd7f69daf00f9b17`.
- Execution feature: `b0d2aa4345751aacb772e91840effc65cf218210`.
- Execution main: `1ea4d69647e6fc7a4754abdc17347e829eba3805`.
- Evidence feature: `7e3ff4a9f87b17b428a07054ff9826aeb863b57f`.
- Evidence main: `942801801c233b0089112f39a0ec4caa2e0f060e`.
- Evolution feature: `be7710d183eab24d003509370e47bbf51c1242e0`.
- Evolution main: `394768d5f1e7a1fce7f67a406b6f1caab410a947`.
- BI feature: `wsr-ui@7a0432c7010e93b39bb67d880ec21e9a84086e6b`.
- BI main: `wsr-ui@d92c6ce2e62a7a51edff8591942a2aa0ad5017dd`.

Each component's Iteration 5 feature tree was squash-merged onto its unchanged `origin/main` baseline.
Evolution's first main CI then exposed Python 3.13-incompatible exception syntax that local Python 3.14
accepted. The two-line compatibility correction was proved under Python 3.13 and 3.14 and synchronized
to both the feature branch and main. Every resulting main tree object is therefore byte-identical to its
final feature tip tree, and every component main SHA above is pushed to and equals `origin/main`. The
superproject remains on `iter5/implementation` and now pins those five component mains.

## Merge and history proof

| Component | Main tree | Feature tree | Disposition |
|---|---|---|---|
| system-contracts | `18b544f51f831a4098d837e766885eb67e481d9b` | same | squash main pushed |
| execution-system | `535b8c97a9bf1fe99b9f48b3b64abd102e06de1d` | same | squash plus authority-CI/coverage qualification fixes pushed |
| evidence-system | `3cd857e92dc99174103fea821e7dd57b03f88be7` | same | squash main pushed |
| evolution-system | `4b13cbe320e4732ce4381c5dd406171593de8e95` | same | squash plus synchronized 2-line compatibility fix pushed |
| wsr-ui | `462cc1199ab2f3c51697fb26034554ed90743a27` | same | squash main pushed |

Owner clarification on 2026-08-29 makes squash/merge commits exempt from the 500-text-line daily
development limit. The integration commits therefore preserve complete qualified component trees without
artificially splitting generated or inseparable merge content. Evolution's post-merge compatibility fix
is an ordinary daily-development commit and changes only two text lines in and two text lines out.

The independent audit then identified eight component and one superproject historical daily-development
commits above 500 text lines. Before rewriting them, the five affected repositories pushed immutable tag
`backup/iter5-feature-before-500-line-rewrite-20260829`. Their feature histories were rebuilt without
changing final tree content and force-updated with an exact old-SHA lease. The final maximum daily text
changes are: superproject 429, contracts 391, Execution 391, Evidence 470, Evolution 494 and BI 489. No
non-merge Iteration 5 commit exceeds 500 text lines; every local feature SHA equals its remote feature SHA.

## Main-coordinate gates

- System contracts: all ten package test suites PASS, including the immutable Workflow DSL 1.1,
  Observation 1.0.2 and Evaluation 1.0 histories plus Task, Profile 2, Evidence Task Query, Workflow DSL 2
  and 12-metric Evaluation 2 candidates. Corpus/example checks PASS.
- Execution: **75 files / 614 tests PASS**; statement coverage **90.04% (5654/6279)**, strict TypeScript,
  build and generated-contract check PASS. Manual qualification consumes the existing `authority_ref`,
  verifies the root gitlink equals the exact component SHA, and leaves PR qualification on root `main`.
  Final exact-authority CI run `33221905520` is `SUCCESS` against root `8bdd1434` and Execution
  `1ea4d696`.
- Evidence: Ruff format/check, strict mypy and package build PASS; **135 unit tests PASS** and
  PostgreSQL integration **16 tests PASS**.
- Evolution: Python 3.13 **174 tests PASS**; Python 3.14 Ruff format/check, strict mypy, package build and
  **174 tests PASS**. The initial main CI failure on Python 3.13 was corrected; final main CI run
  `33191941307` is `SUCCESS` at exact SHA `394768d`.
- BI: Prettier, ESLint, strict TypeScript and dependency inventory PASS; **27 files / 208 tests PASS**,
  Vite build PASS, **15 Playwright tests PASS**, source-built Nginx Docker smoke PASS.

Exact main CI runs are bound to the listed component SHAs: contracts `33191567605`, Execution
`33221905520`, Evidence `33191568304`, Evolution `33191941307`, and BI `33192259302` — all `SUCCESS`.

The first Evidence integration invocation shared peak resources with every component gate and lost its
new PostgreSQL process immediately after health. Its required isolated rerun passed 16/16; the later full
independence qualification also created, migrated, exercised and removed the PostgreSQL integration
environment successfully. No product failure reproduced.

## Final integrated qualification

```text
python3 qualification/iter5/independence/qualify.py
python3 deployment/check-iter5-compose.py
./deployment/smoke-iter5.sh
```

Results:

- Independence static/mutant checks PASS; Execution **70 focused tests**, Evidence **15 focused tests**,
  PostgreSQL **16 integration tests**, and Compose boundary PASS.
- Full source builds of Evidence, Evolution and BI PASS from the repinned component mains.
- Migration, health, Task query, 12-result compute, SPA deep link, exact network membership, route
  fail-closed behavior, Evolution-down isolation and Evidence-down typed degradation PASS.
- All component and superproject worktrees were clean after cleanup.

## Exclusion and authority review

- No superseded browser metric evaluator or BI-local manifest survives in the BI main tree. Metric
  computation remains the stateless Evolution Python service.
- No Workflow builder, intake sidebar, AI attribution, Workflow mutation, registry publication or image
  push artifact entered the merged components.
- Evidence remains the sole PostgreSQL client. Execution Observation remains optional and non-controlling;
  BI and Evolution have no database credential or route.
- Catalog 1.0's 14 metrics remain immutable history; the runtime implements the exact 12-metric Catalog
  2.0 review candidate.

## Checklist disposition

| Wave11 exit item | Result | Evidence |
|---|---|---|
| Component squash merges | `PASS` | five main commits, exact feature/main tree equality |
| Remote main binding | `PASS` | every local main equals fetched `origin/main` |
| Final component gates | `PASS` | contract, format, type, unit, build, browser, Docker and integration suites |
| Superproject final repin | `PASS` | `8bdd1434` pins all five component mains |
| Integrated deployment | `PASS` | source-built full Compose normal and degraded smoke |
| Independence retained | `PASS` | static/mutant and runtime qualification on main pins |
| Excluded/superseded artifacts absent | `PASS` | source/config/image scans and product route tests |
| Independent exit review | `PASS` | root `8bdd1434`; exact fixed coordinates; P0=0/P1=0/P2=0 |

## Downstream release

Wave11 releases the exact repinned superproject candidate to Wave12. Wave12 must perform a clean checkout,
initialize these submodule mains, repeat the closure suite, squash-merge the superproject feature branch,
rerun on final superproject main, then close Issues #53–56 and update Project state.
