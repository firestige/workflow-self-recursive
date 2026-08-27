# Iteration 4 Wave13 closure report

Status: `PASS — ITER4 COMPLETE` (2026-08-27)

Wave13 independently revalidated the Wave12 publication set, closed the authorized Iter4 issues, and confirmed that the remaining work belongs to later iterations or the separate DSH marketplace checklist. It introduced no product behavior, contract semantics, release assets, tags, npm versions, OCI images, or marketplace submissions.

## Final repository set

| Repository | Branch | Final component commit | Qualification |
|---|---|---|---|
| workflow-self-recursive | `main` | audit authority `534baa7cd06002601f43adc814cd35a59c16aaa1` | root run `33026195904` PASS |
| workflow-package | `main` | `00cc5832e0d7507e7bdd7ce20869a1360a142861` | run `33022393696` PASS |
| system-contracts | `main` | `b50525f5b1db2c017d71ed307ed25bb1c3a7c783` | run `33024524430` PASS |
| execution-system | `main` | `c19c811c32cdadb61e0f54cc01bbe770b984c91d` | root run `33026195904` PASS |
| evidence-system | `main` | `624aad2f57c72964ac1b9f82509d9310cc56a781` | run `33022820046` PASS |

All five worktrees were clean and aligned with `origin/main` before closure. The superproject gitlinks match the component commits above. `release/publications/iter4-wave12-integration.json` is the final integration/promotion/closure state record; the Wave11/Wave12 candidate manifests and append-only RC publication record remain unchanged.

## Release audit

| Publication | Stable | Accepted target | Exact external identity |
|---|---|---|---|
| Evidence Query contract | [evidence-query-0.1.0](https://github.com/firestige/system-contracts/releases/tag/evidence-query-0.1.0) | `dc8a50e92eebfc35bd706579ff2bf5e9beb57782` | stable assets equal RC assets by name, size, and digest |
| Execution | [0.1.3](https://github.com/firestige/execution-system/releases/tag/0.1.3) | `3c6259ca07276b1de8520fa6fc0d26c86fd93a41` | `wsr-execution@0.1.3` = `sha256:7c5ab0c061d2cc9f6e3d486e885ee2072870eb09aa0284f0285547fb828d3ca0` |
| DSH Intake | same lockstep release | `3c6259ca07276b1de8520fa6fc0d26c86fd93a41` | `wsr-dsh-intake@0.1.3` = `sha256:d518a687c32077aa8ced55a446da4c744461d3bb58d85aa705638073979618b8` |
| Evidence | [0.1.0](https://github.com/firestige/evidence-system/releases/tag/0.1.0) | `3770f283474728740fb1323dc186861cfcf08e16` | wheel `e4e409…08ef`, sdist `6660c0…5ccea`, OCI `sha256:3b0b6d…7d403` |

The three stable tags equal their accepted RC targets. Stable GitHub asset inventories equal RC inventories. npm `latest` resolves to `0.1.3` for both Execution packages and registry tarball SHA-256 values equal the GitHub RC/stable tgz values. `ghcr.io/firestige/wsr-evidence:0.1.0` resolves to `sha256:3b0b6d290d9a7abf21a544f0110ef04f7398d0870a5f63e1a5a81e5274a7d403`.

## Final regression

- Root run `33026195904`: full Execution tests and coverage, type/build/generated/changelog, static/feasibility, contract consumers, public artifacts, clean npm consumer, DSH lifecycle, real Web Intake installation, independent Workflow Package assets, and frozen-scope boundaries all PASS.
- Evidence Query contract: 19/19 PASS, including immutable publication candidate and FROZEN publication binding.
- Contract release automation: 4/4 PASS, including App-token provenance, explicit repository scoping, and fail-closed lifecycle cases.
- Evidence local independent audit: Ruff format/lint, strict mypy, 117 unit tests, wheel and sdist build PASS. Published RC qualification additionally passed PostgreSQL integration, deployment, dual-instance isolation, and backup/restore.
- Existing Observation, Evaluation, Workflow DSL, and Delivery Admission trees remain byte-identical to their protected baselines. The new Evidence Query contract is additive and FROZEN; no Iter1 FROZEN semantic was modified.
- #102 stayed inside the #94 approved design and protected boundaries. No #53–56, #58–60, #84, #85, or #87 implementation was entered.

## Issue and project closure

| Issue | Closure evidence |
|---|---|
| #48 | https://github.com/firestige/workflow-self-recursive/issues/48#issuecomment-5432638489 |
| #49 | https://github.com/firestige/workflow-self-recursive/issues/49#issuecomment-5432638987 |
| #50 | https://github.com/firestige/workflow-self-recursive/issues/50#issuecomment-5432639460 |
| #51 | https://github.com/firestige/workflow-self-recursive/issues/51#issuecomment-5432640154 |
| #52 | https://github.com/firestige/workflow-self-recursive/issues/52#issuecomment-5432640696 |
| #92 | https://github.com/firestige/workflow-self-recursive/issues/92#issuecomment-5432641187 |
| #102 | https://github.com/firestige/workflow-self-recursive/issues/102#issuecomment-5432641807 |

#94 and #97 remain CLOSED. Project #9 reports #48–52 as `Done`; #92/#94/#97/#102 are not Project #9 items, so there is no stale project status to reconcile.

## Deferred work and handoff

- The DSH marketplace/listing checklist remains independently scoped. Screenshot, listing badge, directory PRs, marketplace/community submissions, and ongoing showcase work remain unchecked and were not performed or claimed by Iter4.
- BI work #53–55 and product independence #56 remain Iter5 inputs. Evidence now exposes the read-only contract and stable service they consume; BI still owns all rendering and metric presentation.
- Evolution #58–60 remains later, parameter-only in the release matrix, with implementation language and publisher adapter still intentionally undecided.
- The `next=0.0.1` npm tags are historical placeholder state; `latest=0.1.3` is the supported Execution/Intake coordinate. Changing or removing placeholder tags was not required for Iter4 correctness.

Iteration 4 is complete. Any new product change, contract revision, release, or marketplace submission requires a new authorized scope.
