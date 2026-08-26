# Iteration 4 Wave 0 Baseline Manifest

| Field | Value |
| --- | --- |
| Result | `PASS — INCREMENTAL RELEASE-IDENTITY REFREEZE COMPLETE` |
| Captured at | initial `2026-08-25T09:08:49Z`; refreeze completed `2026-08-25T14:33:57Z` (`2026-08-25T22:33:57+0800`, Asia/Shanghai) |
| Executor | primary coordinator (`/root`) |
| Oracle reviewer | repository-owned deterministic contract tests |
| Report owner | primary coordinator (`/root`) |
| Merge owner | primary coordinator (`/root`) |
| Input plan | `tmp/20260825/iter4-implementation-plan/plan.md` at superproject `7ad3d7bb9e5c2a60bb4e3e3b0c969e29f148d446` |
| Output | immutable Observation Contract `1.0.0`/`1.0.1`, non-semantic Contract `1.0.2` exact-binding PATCH, npm/release identity refreeze, CI regression coverage, and this report; no product release, tag, secret, variable, or App installation |

## Conclusion

Wave 0 is PASS. The original Observation `1.0.0` publication and validator-correction `1.0.1` publication remain byte-identical. Contract `1.0.2` publishes a fresh exact semantic/machine binding without changing wire Profile `1.0.0`, validator behavior, fields, EventNames, carriers, or conformance claim. Observation 27/27, producer 32/32, acceptor 32/32, Evaluation 25/25 plus exact example, Workflow DSL 27/27, Delivery Admission 3/3, and full root CI all pass.

User `firestige` authorized GitHub App ownership, the six-repository allowlist, minimum permissions, and Actions credential names. npm identities and GitHub Release state were re-queried after the final merge and match the classified baselines. `wsr-evidence@0.0.1` and `wsr-evolution@0.0.1` remain name reservations only. No product release, npm publish, tag, App installation, secret, or variable was created during refreeze. Wave 1/4/5 are unlocked according to the plan DAG.

## Repository baseline

| Repository | Local path | HEAD | Remote | GitHub permission | Worktree |
| --- | --- | --- | --- | --- | --- |
| superproject | `.` | original `7ad3d7bb9e5c2a60bb4e3e3b0c969e29f148d446`; final refreeze `d45ba72309e826a54ca577500ab5eb6c64f06ae7` | `firestige/workflow-self-recursive` | `ADMIN` | clean `main` |
| execution-system | `execution-system/` | original `4179d7b4c6f20ddf69e5a1f3b50c86b2143b2287`; refreeze candidate `f095503bd5222af5f966fb7bfdcdb7928fdbb476` | `firestige/execution-system` | `ADMIN` | clean `main` at refreeze capture |
| evidence-system | `evidence-system/` | `981ba59814553ed27deb28fd8a0ac769c73464c7` | `firestige/evidence-system` | `ADMIN` | clean `main` |
| system-contracts | `system-contracts/` | baseline `c8e090f80073e3a4a37063d2d0165f190f2ec7f1`; 1.0.1 remediation `0468996bdf5f5a2d0a0e95d6dde00911e051522c`; final 1.0.2 `9e6ba782b742f49f3d2392c9af37ebd4ff328bc8` | `firestige/system-contracts` | `ADMIN` | clean `main` |
| workflow-package | `workflow-package/` | `760c8fc6b9d547e21fd020cedaafa38b68880b9d` | `firestige/workflow-package` | `ADMIN` | clean detached HEAD, matching the superproject gitlink |
| evolution-system | `evolution-system/` | `e17eb83ce66caec54275855c7970725be59b8598` | `firestige/evolution-system` | `ADMIN` | clean `main`; Iter4 does not publish it |

All required repositories exist locally, are filesystem-writable, match the superproject gitlinks, and report GitHub `ADMIN` permission. `gh auth status` reports the active `firestige` account with `repo`, `workflow`, and `project` scopes.

## Reserved release surfaces

Wave 2 must exclude the following Evidence paths. Wave 4 owns only these component-local release surfaces plus the plan-owned guide paths; any expansion requires coordinator review.

| Repository | Existing paths reserved for Wave 4 | Reserved empty paths for the common release surface |
| --- | --- | --- |
| execution-system | `.github/workflows/release-candidate.yml`; `.github/workflows/release-promote.yml`; `scripts/build-release-artifacts.ts`; `scripts/build-workflow-release-assets.ts`; `scripts/release-promotion-policy.ts`; `scripts/verify-release-artifacts.ts`; `test/tooling/release-artifact-verifier.test.ts`; `test/tooling/release-promotion-policy.test.ts`; `test/tooling/release-workflow-bootstrap.test.ts`; `test/tooling/workflow-package-release.test.ts` | `release/cli/**`; `release/templates/**`; `release/config/**`; `release/README.md` |
| evidence-system | none | `.github/workflows/release-candidate.yml`; `.github/workflows/release-promote.yml`; `release/cli/**`; `release/templates/**`; `release/config/**`; `release/README.md`; `test/tooling/release/**` |
| system-contracts | `.github/workflows/ci.yml` is read-only/shared and is not reserved | `.github/workflows/release-candidate.yml`; `.github/workflows/release-promote.yml`; `release/cli/**`; `release/templates/**`; `release/config/**`; `release/README.md`; `test/tooling/release/**` |
| workflow-package | `.github/workflows/ci.yml` is read-only/shared and is not reserved | `.github/workflows/release-candidate.yml`; `.github/workflows/release-promote.yml`; `release/cli/**`; `release/templates/**`; `release/config/**`; `release/README.md`; `test/tooling/release/**` |
| superproject documentation | `docs/guides/execution-release-process.md`; `docs/guides/execution-release-process.zh-CN.md` | `docs/guides/release-automation.md`; `docs/guides/release-automation.zh-CN.md` |

The empty paths are reservations, not implementation or stack decisions. They add no runtime/package dependency and contain no files at this baseline.

## Issue and Project #9 gate

Project: <https://github.com/users/firestige/projects/9>

| Issue | State | Label gate | Project status | Iteration | Result |
| --- | --- | --- | --- | --- | --- |
| [#48](https://github.com/firestige/workflow-self-recursive/issues/48) | OPEN | `ready` | Todo | Iter 4 evidence 数据仓库 | PASS |
| [#49](https://github.com/firestige/workflow-self-recursive/issues/49) | OPEN | `ready` | Todo | Iter 4 evidence 数据仓库 | PASS |
| [#50](https://github.com/firestige/workflow-self-recursive/issues/50) | OPEN | `ready` | Todo | Iter 4 evidence 数据仓库 | PASS |
| [#51](https://github.com/firestige/workflow-self-recursive/issues/51) | OPEN | `ready` | Todo | Iter 4 evidence 数据仓库 | PASS |
| [#52](https://github.com/firestige/workflow-self-recursive/issues/52) | OPEN | `ready` | Todo | Iter 4 evidence 数据仓库 | PASS |
| [#92](https://github.com/firestige/workflow-self-recursive/issues/92) | OPEN | `ready` | Todo | Iter 4 evidence 数据仓库 | PASS |
| [#94](https://github.com/firestige/workflow-self-recursive/issues/94) | OPEN | `ready` | Todo | Iter 4 evidence 数据仓库 | PASS |
| [#97](https://github.com/firestige/workflow-self-recursive/issues/97) | OPEN | `ready` | Todo | Iter 4 evidence 数据仓库 | PASS |
| [#93](https://github.com/firestige/workflow-self-recursive/issues/93) | CLOSED | `completed` | Done | Iter 3 execution 补全 | PASS; excluded from Iter 4 |

## FROZEN Contract gate

| Contract | Revision / representation | Command | Exit | Result |
| --- | --- | --- | --- | --- |
| Observation Catalog + OTel Profile + Interaction | Contract `1.0.2`; wire Profile and interaction schema `1.0.0`; `system-contracts/observation/` | `npm test`; producer and acceptor corpus checks | 0 | PASS: 27 tests, 32 producer fixtures, 32 acceptor fixtures; parent 1.0.2 binding resolves exactly; historical 1.0.0/1.0.1 bytes locked |
| Evaluation Metric Catalog | `agentops.evaluation.metric-catalog@1.0.0`; `system-contracts/evaluation/` | `npm test && npm run check:example` | 0 | PASS: 25 tests; normative example resolves the immutable Observation 1.0.0 binding |
| Workflow Definition DSL | `agentops.workflow-dsl@1.1.0`; `system-contracts/workflow-dsl/` | `npm test`; `npm run check:minimal`; `npm run test:corpus` | 0 | PASS: 27 tests; minimal check; corpus positive=2, negative=1, recovery=2 |
| Delivery Admission | `delivery-admission-contract@1.0.0`; `system-contracts/delivery-admission/` | `npm test` | 0 | PASS: 3 tests |

### Binding mismatch evidence

- `docs/contracts/observation/release-binding-1.0.0.json` binds machine commit `3d60d16c954b325e7d3eb3148d5ace33880641e8` and publication-record SHA-256 `04a4658118ebbb31507eae56f0300ab1035fb7b369ee9b7301dbae3b5a519755`.
- Re-reading that file at `system-contracts` commit `3d60d16` reproduces the exact expected SHA-256 `04a4658118ebbb31507eae56f0300ab1035fb7b369ee9b7301dbae3b5a519755`.
- Evaluation 1.0.0 declares that same semantic revision `sha256:1a3fea6d202bf08a36aaf76abc3c6601fa71dc6c581715f9c74d11456f2ae735`, machine revision `sha256:cf5b6c54af452085f66cf3c28b7ffb14e58451b926a97fa317b9a92a18c8d774`, publication digest `04a465...`, and gitlink `3d60d16...`.
- The current pinned `system-contracts` commit `c8e090f...` contains Observation publication-record SHA-256 `3089030b315525a20024ab56c82135457c98bcdd9ea73886736f23cc1412adc3` and declares different release-binding revisions (`sha256:f4c03c...` / `sha256:9b8ec3...`).
- Therefore `system-contracts/evaluation/tools/check-catalog.cjs` resolves Evaluation's dependency against a different current Observation publication record and fails closed. This is a reproducible baseline inconsistency, not a test-environment or dependency-install failure.

### Remediation and impact

- The overwrite entered at `system-contracts` commit `6801bdef` on 2026-08-24 while Execution's OTLP reader was being qualified: decoded Span and Link `fixed32` flags exposed that the validator incorrectly capped the values at 255. The correction itself is wire-compatible, but its publication builder rewrote the already-published `publication-record-1.0.0.json` in place.
- The superproject first pinned that rewritten machine state in `3b4934f`, and later pinned merged `system-contracts` PR #9 at `b2428a2`. Iteration 3 CI tested Observation but omitted Evaluation, so the stale Evaluation dependency digest was not exercised.
- Impact was limited to exact publication resolution: Evaluation 1.0.0 and the root Observation 1.0.0 binding retained digest `04a465...`, while the current file had become `308903...`. The wire payload, EventNames, carriers, interaction schema, and runtime producer profile did not change.
- Remediation restores `publication-record-1.0.0.json` to digest `04a4658118ebbb31507eae56f0300ab1035fb7b369ee9b7301dbae3b5a519755`, publishes `observation-contract@1.0.1`, retains `profile_version: 1.0.0`, and adds an explicit 1.0.1 compatibility matrix.
- Contract-owner approval: <https://github.com/firestige/workflow-self-recursive/issues/78#issuecomment-5408448182>.
- New exact binding: `docs/contracts/observation/release-binding-1.0.1.json`; merged component commit `0468996bdf5f5a2d0a0e95d6dde00911e051522c`; merged superproject commit `1a1917d1e0652dee163ec5720a3ef053b58b7b77`; publication digest `971b60b7a5c436342a17474b0c70a610afcfe0d80077f0e5ce84b026dd4d207a`; component PR/CI: <https://github.com/firestige/system-contracts/pull/10> / <https://github.com/firestige/system-contracts/actions/runs/32833262810/job/97756440464>; superproject PR/CI: <https://github.com/firestige/workflow-self-recursive/pull/98> / <https://github.com/firestige/workflow-self-recursive/actions/runs/32833452524/job/97757036509>.
- Both component CI and superproject qualification now run Evaluation tests and `check:example`, preventing future cross-contract digest drift from escaping.

### Incremental binding drift

The npm coordinate update changed `docs/systems/execution/project-execution-system.md` after Observation Contract 1.0.1 was frozen. Contract 1.0.2 closes this drift with a new exact semantic inventory and keeps the published 1.0.1 record immutable. Owner approval: <https://github.com/firestige/workflow-self-recursive/issues/78#issuecomment-5411763726>. Component PRs [#11](https://github.com/firestige/system-contracts/pull/11) and [#12](https://github.com/firestige/system-contracts/pull/12) produced final commit `9e6ba782b742f49f3d2392c9af37ebd4ff328bc8`; superproject PR [#99](https://github.com/firestige/workflow-self-recursive/pull/99) produced final commit `d45ba72309e826a54ca577500ab5eb6c64f06ae7`. Publication digests are immutable `1.0.0=04a4658118ebbb31507eae56f0300ab1035fb7b369ee9b7301dbae3b5a519755`, immutable `1.0.1=971b60b7a5c436342a17474b0c70a610afcfe0d80077f0e5ce84b026dd4d207a`, and current `1.0.2=d86c7c57fe0187fd4524b2e2dcc65daeb1c87259df1fd9de31e07a367d927544`.

## Release identity and ecosystem delta

| Product/distribution | Repository | Registry state at refreeze audit | Iter4 meaning |
| --- | --- | --- | --- |
| `wsr-execution` | `firestige/execution-system` | npm `latest=0.1.2`; SHA-1 `c3a6082c97ba360bb42b64e4b3f1d4f4a2748a23` | manually published npm naming/metadata migration baseline; occupied and immutable; no Iter4 republish |
| `wsr-dsh-intake` | `firestige/execution-system` | npm `latest=0.1.2`; SHA-1 `8ad234630ccac1edc75ca3d33a58d08238fc9848`; exact dependency `wsr-execution@0.1.2` | Execution's npm/DSH publisher-adapter baseline and DSH compliance target |
| `wsr-evidence` | `firestige/evidence-system` | npm `0.0.1` placeholder | `NAME_RESERVATION_ONLY`; does not select npm, Node, or a functional version; Evidence language direction is Python and wave2 owns the release shape |
| `wsr-evolution` | `firestige/evolution-system` | npm `0.0.1` placeholder | `NAME_RESERVATION_ONLY`; Iter4 performs no Evolution release and does not select an ecosystem |

GitHub repositories, remotes, and submodule paths did not change. Execution's GitHub latest Release remains 0.1.1 by explicit migration decision; npm-only 0.1.2 is a grandfathered manual baseline, not proof of the Wave4 automated RC→qualification→stable path. The stale npm `next=0.0.1` tags are recorded external state and must be handled by the Execution npm adapter before its next real release.

The DSH listing checklist is scoped only to `wsr-dsh-intake` compliance and its `wsr-execution` Node/npm companion. Its strict top-level status is 24/45 actions executed: seven actions pending in Wave4, D-02 reopened because its screenshot subcheck is incomplete, and thirteen other actions deferred. The release operations handbook is an Execution npm/DSH adapter input, not a universal rule for Python Evidence, Contract publication, Workflow assets, Evolution, or future BI.

## GitHub App and Actions prerequisite

| Check | Result |
| --- | --- |
| Actions enabled | PASS for all four component repositories; current policy is `allowed_actions=all` |
| Existing repository Actions variables | empty in all four repositories |
| Existing repository Actions secrets | empty in all four repositories |
| App installation inventory | No existing installation is claimed; creation/installation is Wave 4 work |
| External-management authorization | PASS — approved by user `firestige` on 2026-08-25 |

Approved exact authorization scope:

- Responsible owner: GitHub user `firestige`; App name/slug target `wsr-release` (subject only to GitHub name availability at creation time).
- Installation allowlist: `firestige/workflow-self-recursive`, `firestige/execution-system`, `firestige/evidence-system`, `firestige/evolution-system`, `firestige/system-contracts`, and `firestige/workflow-package`; no all-repository installation. Actual installation is progressive and only occurs when a wave needs the repository; Evolution is not published in Iter4.
- Repository Actions variable on each independent publishing component: `WSR_RELEASE_APP_ID`.
- Repository Actions secret on each independent publishing component: `WSR_RELEASE_APP_PRIVATE_KEY`.
- No installation-ID variable is required: the workflow resolves the installation for the current repository when minting the short-lived token.
- Versioned non-secret release configuration (repository coordinate, release branch, artifact/build/check commands) belongs under the Wave 4 `release/config/**` surface rather than Actions variables.
- App repository permissions: `Contents: write`, `Workflows: write`, implicit `Metadata: read`.
- Explicitly not granted: `Actions`, `Pull requests`, `Issues`, `Administration`, `Secrets`, or other repository permissions. Any later need requires a separate least-privilege review.
- Token scope: only the final-publish step may mint/use a short-lived installation token. Download, digest, qualification policy, and remote-install E2E continue using the repository's built-in `GITHUB_TOKEN`.
- No secret values, private keys, installation tokens, or personal PATs may enter a repository, log, artifact, or report.

## Pre-existing worktree changes

Owner is recorded as the user because all entries predate this Wave 0 execution. They do not overlap Wave 0's report path or the currently reserved Wave 1/4/5 product surfaces.

- `.project/requirements/automations.md`
- `.project/requirements/lifecycle.md`
- `.project/requirements/vocabulary.json`
- `.project/requirements/vocabulary.md`
- `.project/skills/requirements-capture/SKILL.md`
- The initial snapshot also showed untracked `docs/assets/` and `research/`; they were no longer reported at final status capture, indicating concurrent user-owned workspace activity. No Wave 0 command modified or removed them.

## Commands and exit codes

| Command family | Exit | Notes |
| --- | --- | --- |
| `git status --short --branch`; `git rev-parse HEAD`; `git submodule status --recursive`; component `git status` / `git remote -v`; `git worktree list --porcelain` | 0 | repository and dirty-tree baseline |
| `gh auth status`; `gh repo view ... --json viewerPermission`; Actions permissions/variables/secrets API queries | 0 | authentication, repository permission and non-secret Actions metadata |
| `gh issue view ...`; `gh project item-list 9 ...` | 0 | issue and Iteration fields |
| Observation test/check command family | 0 | 27 deterministic tests plus 32 producer/32 acceptor fixtures PASS; parent 1.0.2 exact binding resolved |
| Evaluation `npm test && npm run check:example` | 0 | 25 tests and exact Observation dependency resolution PASS after remediation |
| Workflow DSL test/check command family | 0 | deterministic conformance oracle PASS |
| App installation inventory queries | 401/403 | endpoint requires GitHub App-authenticated access; no installation claim made |
| SHA-256 comparison of pinned/current publication records | 0 | exact mismatch reproduced |
| Refreeze `git status` / SHA / npm registry / GitHub Release audit | 0 | all six repositories clean; four npm identities unchanged; GitHub Releases unchanged; DSH checklist strict top-level status 24/45 |
| Observation 1.0.1 semantic-byte comparison and 1.0.2 exact binding | 0 | original single-document drift reproduced, then closed by immutable 1.0.2 publication and root binding |
| Root CI PR/main | 0 | PR run `32859184496`: first attempt hit one unrelated 5.005s Execution test timeout after 553/554 passes; same-SHA failed-job rerun passed all gates. Final main run [`32859941938`](https://github.com/firestige/workflow-self-recursive/actions/runs/32859941938) PASS without retry. |
| Plan/document lint | 0 | wave structure/DAG/impact-table check PASS; checklist status reconciled to strict 24/45 |

## Required human decisions

None for Wave 0. The ecosystem split and non-semantic Contract PATCH 1.0.2 are approved, implemented, merged, and requalified. Wave 4 must still stop if GitHub rejects the App name, the approved repositories cannot be selected, npm publishing identity cannot be configured without exposing secret material, or an ecosystem adapter requires unapproved authority.
