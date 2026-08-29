# Iteration 5 Wave 12 Evidence — clean closure and final main

## Result

- Status: `PASS`.
- Final superproject main: `4bac3fa25ccf45ef567d1fe70e13fa4c6ac59d4a`.
- System contracts: `49d7b853d8617e29ce0667b1dd7f69daf00f9b17`.
- Execution: `f8bc325b812ce4460da8e2452fd1932c0a2551e3`.
- Evidence: `942801801c233b0089112f39a0ec4caa2e0f060e`.
- Evolution: `394768d5f1e7a1fce7f67a406b6f1caab410a947`.
- BI: `d92c6ce2e62a7a51edff8591942a2aa0ad5017dd`.
- Final independent exit review: `PASS`, P0=0, P1=0, P2=1.

The P2 is a disclosed branch-order deviation during the final CI repair, not a product or
qualification defect. Issues #53–56 meet their product criteria and may be closed after this evidence is
pushed and their criterion-level tracking is updated.

## Clean-checkout closure

The isolated checkout was cloned recursively at feature coordinate
`65be5838a30c1041abb5f2d80460f4dcba422ba7`. Its tree was byte-identical to the first squash candidate
`0d5a1b89a98bfea84624b1b1ad825e7d7262169c`, and it pinned the same contracts, Evidence, Evolution and
BI mains as the final authority. It pinned the pre-repair Execution main `1ea4d696`; the later final-main
change only affects Execution release/changelog tooling and the superproject gitlink.

Clean-checkout results:

- Contracts: all ten package test/check/corpus/build gates passed.
- Execution: 75 files / 614 tests passed on the isolated rerun; statement coverage was 90.04%
  (5654/6279), and typecheck, build and generated-contract checks passed. Two five-second tooling tests
  exceeded their timeout only during the first all-components peak-concurrency invocation; the isolated
  rerun passed all 614 tests and the failure did not reproduce.
- Evidence: 135 unit tests, Ruff, strict mypy and package build passed; PostgreSQL integration passed
  16/16.
- Evolution: Python 3.14 and 3.13 each passed 174 tests; Ruff, strict mypy and package build passed.
- BI: 27 files / 208 tests, formatting, lint, strict TypeScript, Vite build, dependency inventory,
  15 Playwright tests and the source-built Nginx Docker smoke passed.
- Root independence qualification passed static/mutant checks, 70 focused Execution tests, 15 focused
  Evidence tests, 16 PostgreSQL tests and the Compose boundary checker.
- Full `database + migrate + evidence + evolution + bi-app` Compose built the three project images from
  the checkout's Dockerfiles and source contexts. Health, Task query, 12-result compute, deep link,
  network isolation, Evolution-down degradation and Evidence-down degradation passed.

`source-built` does not mean Docker was forced to use `--no-cache`; it means no prebuilt project release
image was consumed and each project image was resolved from the checked-out Dockerfile and build context.

One exploratory command invoked Observation's standalone `build:publication` generator. That command is
not part of normal package `test`, `check` or source build and intentionally rewrites a publication record.
The resulting five-line temporary drift was restored before qualification. The frozen record ended at its
committed `d86c7c57...` content hash; no commit, push or publication occurred. This was an operator-side
observation, not a product defect or a required build step.

## Superproject integration and final-main rerun

The Iter5 feature tree was squash-merged onto the unchanged baseline `82fc7375` as one exempt integration
commit, `0d5a1b89`. The squash tree matched feature tip `65be5838`. The first exact-main CI then supplied a
valid RED:

- Root run `33222331081`: `FAILURE`.
- Execution tests, coverage, typecheck, build and generated checks passed.
- `changelog:check` correctly stopped because the committed changelog omitted the squash history and
  differed from generated output; operational tag `backup/iter5-feature-before-500-line-rewrite-20260829`
  was also incorrectly treated as a release boundary.

The failure was not retried away. The TDD repair was:

1. add a test requiring stable and prerelease SemVer tags to be accepted while the operational backup tag,
   `latest` and an incomplete version are rejected;
2. observe the expected RED (`isChangelogReleaseTag is not a function`);
3. add the minimum centralized SemVer release-tag predicate and filter tags before changelog range sorting;
4. regenerate the history-derived changelog and require `changelog:check` to pass.

Final Execution results are 75 files / 615 tests, statement coverage 90.04% (5654/6279), typecheck,
build, generated checks, changelog check, static/feasibility harnesses, DSH distribution and documentation
checks all passing. The exact-authority Execution CI run
[`33222722931`](https://github.com/firestige/execution-system/actions/runs/33222722931) is `SUCCESS` and
verifies that superproject authority `4bac3fa2` pins exact Execution `f8bc325b`.

The superproject repin produced final main `4bac3fa2`. On that exact main:

```text
python3 qualification/iter5/independence/qualify.py
python3 deployment/check-iter5-compose.py
./deployment/smoke-iter5.sh
(cd wsr-ui && npm run browser)
```

Results:

- independence: static/mutant PASS; Execution 70, Evidence 15 and PostgreSQL 16 tests PASS;
- Compose: source-built normal/degraded smoke PASS with exact network and route boundaries;
- browser: 15/15 Playwright PASS, including keyboard/theme, Trace finite motion, reduced motion,
  Delivery deletion, narrow layout, single/compare, error recovery and Evidence return identity;
- all superproject and component worktrees clean.

The exact final-main root CI run
[`33222686110`](https://github.com/firestige/workflow-self-recursive/actions/runs/33222686110) is `SUCCESS`.

## Security, topology and scope negatives

- PostgreSQL remains reachable only by Evidence on the internal database network.
- BI and Evolution contain no database client, database credential or PostgreSQL network path.
- Nginx exposes only the approved Evolution compute POST and Evidence Task/Fact/Trace read routes;
  unknown paths and write methods fail closed.
- No Iter5 registry publication, image push, npm publication, publisher credential or remote release step
  was added. Pre-existing Iter3/Iter4 release automation is outside this negative delta.
- No workflow-builder, intake-sidebar, AI attribution, Workflow mutation, revision application or
  meta-recursive-loop artifact entered Iter5.
- Evidence remains Fact/recorded-Trace authority, Evolution remains the 12-candidate Metric Result/Delta
  authority, and BI remains presentation-only.

## Issue #53 criterion map

| Original acceptance | Result | Durable/executable proof |
|---|---|---|
| side returns 12 coordinates and receipt | `PASS` | Wave4/5 contracts and 174-test Evolution gate |
| 1–24 exact Task IDs per side | `PASS` | selection contract and client/product tests |
| NEW/REUSE plus display-name fallback | `PASS` | Execution/Evidence contract chain and Task selector tests |
| logical `as_of` and exact route-local read set | `PASS` | resolver/receipt golden tests; no global snapshot |
| reporting converges to final stability | `PASS` | settled-selection and retention tests |
| one Python calculator per metric; exact numbers | `PASS` | 12-module registry, calculator boundary and golden tests |
| full/partial compare and Evolution Delta | `PASS` | compare service/client/product tests |
| `/evaluate` and bounded deep link | `PASS` | router tests and Playwright restoration |
| bounded layout/presets/local composition | `PASS` | closed layout registry and decoder tests |
| closed executable visualizers and honest holes | `PASS` | card/badge/ratio/table registry and missing tests |
| complete non-color truth states and theme parity | `PASS` | component matrix, forced-colors/print/browser tests |
| keyboard-only workflow and text/table fallback | `PASS` | accessibility component and Playwright tests |
| recorded-only Trace with finite Still/Live | `PASS` | Wave8 model/motion and browser tests |
| same-origin dual upstream with no DB path | `PASS` | Nginx/Compose/network tests |
| Iter5 exclusions retained | `PASS` | source/config/artifact negative scan |

## Issue #54 criterion map

| Original acceptance | Result | Durable/executable proof |
|---|---|---|
| parent structure only; timestamp-independent | `PASS` | adversarial graph-model tests |
| same-depth siblings; no arrival/name/task ordering | `PASS` | deterministic layout/traversal tests |
| LINK independent and accessible | `PASS` | model, component and browser tests |
| NODE-only creation and orphan lane | `PASS` | orphan fixtures and graph tests |
| lifecycle, pagination and bounded graph | `PASS` | query state machine, Delivery deletion and browser tests |
| navigator is not Recorded Reach truth | `PASS` | component boundary/forbidden-copy tests |
| Still default and finite user-started Live | `PASS` | motion tests and Playwright completion |
| accessible graph/outline and focus restoration | `PASS` | keyboard/component/browser tests |
| exact deep link and typed recovery | `PASS` | route and product browser tests |
| no authored reach/attribution/mutation claim | `PASS` | source and rendered-copy negative tests |

## Issues #55 and #56 disposition

- #55: source-built Vite/Nginx image, exact read-only allow-list, four-service topology plus migration,
  loopback-only listener, no BI/Evolution DB path, distinct degraded paths, SPA history fallback, and
  clean-checkout full Compose are all `PASS`.
- #56: Execution-alone canonical-result equality, conforming external producer, Observation/Evidence
  outage matrix, no receipt/outbox/callback/control/DB edge, NEW/REUSE without Evidence admission query,
  downstream-only missingness, and mutant sensitivity are all `PASS`.

## History and process disclosure

Owner clarified that squash/merge integration commits are exempt from the 500-text-line daily-development
limit. Recomputed maximum daily text changes remain: superproject 429, contracts 391, Execution 391,
Evidence 470, Evolution 494 and BI 489. The final repair commits change 26, 8 and 2 text lines,
respectively, and do not alter that conclusion.

The final CI repair landed on component/root main first and was then synchronized to both
`iter5/implementation` branches. That chronology differs from the plan's ordinary feature-first wording.
Final root feature/main trees are equal; Execution's behavior and repair are synchronized, while its
history-derived feature changelog necessarily lists the feature history. Independent review classifies
this as non-blocking P2, with no P0/P1 or product risk.

## Exit

Wave12 technical and tracking closure is `PASS`. Criterion-level comments were published for
[#53](https://github.com/firestige/workflow-self-recursive/issues/53#issuecomment-5459131118),
[#54](https://github.com/firestige/workflow-self-recursive/issues/54#issuecomment-5459132608),
[#55](https://github.com/firestige/workflow-self-recursive/issues/55#issuecomment-5459134168) and
[#56](https://github.com/firestige/workflow-self-recursive/issues/56#issuecomment-5459135790). All original
acceptance checkboxes are complete; the four Issues are CLOSED / `completed` and their Project #9 items
are `Done`. No Wave4+ product implementation remains open in Iter5.
