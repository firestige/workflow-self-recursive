# Wave12 partial-failure state matrix

Status: `APPROVED — W12.3 CONTRACT_BINDING_VERIFIED; A2 PENDING` (2026-08-27)

This matrix is the required stop/recovery authority for Iter4 publication. It does not itself authorize a tag, Release, registry write, branch merge, or Contract transition. Every immutable object that has been created remains preserved; recovery always resumes from the recorded candidate and never overwrites, retargets, or rebuilds it.

## Contract coordinate decision

The Contract owner clarified on 2026-08-26 that Iter4 remains in MVP/pre-1.0 maturity and retains `evidence.query@0.1.0`. `FROZEN` means that this exact Contract revision is immutable and conformance-addressable after all gates; it does not claim project-wide 1.0 stability. The lifecycle authority now states this distinction explicitly. No Contract, Evidence, or Execution candidate byte is invalidated by the clarification.

## Fixed identities and scope

| Object | Fixed identity |
| --- | --- |
| Unified input | `release/candidates/iter4-wave11.json`, SHA-256 `c5b78ce1d2c8a5b813032254759c93c9d94bbc1f6a6c250f4511e9dc7c534ef4` |
| Contract | `evidence.query@0.1.0`; RC `evidence-query-0.1.0-rc.1`; stable `evidence-query-0.1.0` |
| Execution pair | RC `0.1.3-rc.1`; stable/npm `0.1.3`; core SHA-256 `7c5ab0c061d2cc9f6e3d486e885ee2072870eb09aa0284f0285547fb828d3ca0`; Intake SHA-256 `d518a687c32077aa8ced55a446da4c744461d3bb58d85aa705638073979618b8` |
| Evidence | RC `0.1.0-rc.1`; stable `0.1.0`; Python 3.13/3.14 support; wheel/sdist/OCI adapter |
| Trigger | push an immutable `release/request.json` commit to the component `release/next` branch; workflow code from that branch runs without requiring prior default-branch installation |
| Final integration | one component-first squash sequence, followed by one exact superproject repin and squash to `main` |

The DSH obligation in this matrix is exact npm-installed plugin qualification and post-publication product smoke. Marketplace badges, screenshots, GIFs, awesome-list PRs, and other unchecked items in `tmp/20260825/dsh-plugin-listing/checklist.md` remain deferred and are not silently added to Wave12.

## Global invariants

1. A changed byte requires a new candidate and a new owner decision before any external state. An existing tag, npm coordinate, Release asset, or GHCR digest is never overwritten.
2. Stable promotion consumes the qualified RC manifest and candidate commit. Squash-main is an integration target, not a rebuild or retag target.
3. Candidate/build/qualification uses repository `GITHUB_TOKEN`; only the final GitHub stable Release step receives a short-lived, repository-scoped `wsr-release` App token.
4. `evidence.query` remains `REVIEW_CANDIDATE` and Evidence makes no conformance claim until contract.gate.1–6 and Contract-owner approval all pass.
5. A failed stage stops all later stages. Only the recovery action in its row is permitted; absence of a stable object is evidence, not permission to rebuild.
6. Host `gh` may inspect state and push coordinator-owned branch commits. It is not a publication fallback: candidate/stable Releases, npm, and GHCR writes are performed by the repository workflows.

## State and recovery matrix

| State | Durable objects that may exist | Required oracle before advancing | Failure disposition and only allowed recovery |
| --- | --- | --- | --- |
| `W12.0 PREFLIGHT` | Wave10 Evidence manifest; Wave11 unified manifest and exact Execution tgz; feature checkpoints only | matrix approved; gate.1–4 PASS; App variable/secret names present; npm trusted-publisher attestation; target tags/releases/coordinates absent | Fix release-only tooling or evidence, rerun local gates, and checkpoint. No external publication. Any product/semantic byte change reopens the owning wave and invalidates this matrix. |
| `W12.1 CONTRACT_RC_REQUESTED` | system-contracts `release/next` request commit and Actions run URL; tag may still be absent | request schema/coordinate and branch head exact; run uses repository token | If acceptance/build fails before RC: fix on feature line, choose a new request commit, keep the same RC name only while no tag/release exists. If permission fails before object creation: repair configuration and rerun exact request. |
| `W12.2 CONTRACT_RC_CREATED` | immutable prerelease/tag `evidence-query-0.1.0-rc.1`, downloaded bundle, metadata and qualification digests | tag target equals request commit; remote bundle byte-equals locally qualified bundle; gate.5 machine release PASS | Collision with different target/bytes or digest mismatch: preserve URL/digests, stop for owner investigation; never delete/replace tag or assets. Missing qualification asset may be uploaded only by the same successful workflow run before gate.5 is claimed. |
| `W12.3 CONTRACT_BINDING_VERIFIED` | W12.2 plus clean-checkout verification record and proposed FROZEN/register/publication-binding patch | gate.6 binds exact semantic SHA, machine content revision, RC URL/tag/target and asset digests; gate.1–6 report complete | Verification/evidence gap keeps Contract `REVIEW_CANDIDATE`; correct evidence without semantic change. Semantic change returns to `DRAFTING`, invalidates downstream candidates, and requires explicit replanning. |
| `W12.4 CONTRACT_FROZEN_APPROVED` | owner approval URL; atomic semantic/translation/register and machine publication-binding commits on Iter4 feature lines | all six gates PASS; owner explicitly approves transition; EN/ZH/machine revisions match | No owner approval means stop. Patch drift or mismatched revision returns to W12.3; do not partially mark FROZEN. |
| `W12.5 EXECUTION_RC_CREATED` | immutable prerelease/tag `0.1.3-rc.1` and qualification record | workflow materializes Wave11 tracked assets; candidate-directory diff from archive commit empty; downloaded core/Intake digests equal fixed values; clean DSH install/restart/product E2E PASS | Pre-RC failure: fix release-only tooling and rerun before object creation. Post-RC mismatch/collision: preserve state and stop. Never rebuild `0.1.3` assets or advance to `0.1.4`. |
| `W12.6 EVIDENCE_RC_CREATED` | Evidence prerelease/tag `0.1.0-rc.1`, wheel, sdist, real GHCR RC digest, qualification record | Contract already FROZEN; acceptance/integration/deployment/backup-restore PASS; downloaded Python assets and pulled OCI digest match metadata | If OCI push succeeds but GitHub RC fails, preserve the immutable OCI digest and rerun the same request so metadata binds that exact digest; do not reuse a mutable tag as identity. Any asset/digest mismatch stops promotion. |
| `W12.7 COMPONENTS_MERGED` | system-contracts, execution-system, evidence-system squash commits on `main`; qualified RCs unchanged | each squash tree contains the qualified product/contract bytes and release workflows; candidate/main workflow-tree differences are enumerated; no candidate asset changed | Merge conflict or uncovered tree drift stops before superproject merge. Correct feature/main integration without touching an existing RC; if qualified bytes would change, return to owner decision. |
| `W12.8 SUPERPROJECT_REPINNED` | superproject `main` squash with exact component-main gitlinks and FROZEN Contract register | clean recursive checkout; all component-main SHA and workflow trees match the recorded set; unified candidate still verifies | Repin/CI failure stops all stable promotion. Correct only the superproject integration; do not move RC tags. |
| `W12.9 CONTRACT_STABLE` | stable Contract tag/Release reusing W12.2 exact bundle | promotion verifies RC qualification and creates stable as last operation with scoped App token | Stable failure: retry promotion from the same RC. Existing exact stable object is success/idempotent evidence; different target/assets is a collision requiring owner investigation. |
| `W12.10 NPM_CORE_PUBLISHED` | `wsr-execution@0.1.3` may exist while Intake and stable GitHub Release are absent | registry tarball digest equals fixed core SHA; description/version list/latest exact | Intake publish must resume from the same Execution RC. Publisher skips core only after downloading and matching registry bytes. Different bytes are a permanent coordinate collision; do not overwrite or rebuild. |
| `W12.11 NPM_PAIR_PUBLISHED` | both npm `0.1.3` coordinates; GitHub stable may still be absent | both registry tarball digests, descriptions, version lists and `latest` exact; clean `dsh plugin add wsr-dsh-intake` product smoke PASS | If post-publish smoke or App token/final Release fails, preserve npm state and rerun the same promotion. Exact published coordinates are skipped; no `0.1.4` is created. |
| `W12.12 EXECUTION_STABLE` | npm pair plus stable `0.1.3` tag/Release reusing W12.5 assets | stable tag target is qualified candidate; every Release asset byte matches RC; DSH reinstall/restart/product smoke PASS | Record any ecosystem listing delay as deferred external discovery, not a package failure. A product smoke failure stops Evidence stable and issue closure; repair requires explicit owner disposition because published bytes are immutable. |
| `W12.13 EVIDENCE_STABLE` | stable GHCR `0.1.0` tag attached to the qualified RC digest and stable GitHub Release reusing W12.6 Python assets | pull by digest and stable tag resolve same image; remote install/deploy/backup-restore PASS; release/tag/asset/main/super pins reconcile | OCI tag success followed by Release failure is recoverable by rerunning the same promotion and digest. Different digest/target is a collision. No rebuild or second functional version. |
| `W12.14 PRE_CLOSE` | append-only publication-state record and `evidence/wave12.md`; issues still open | all URLs/SHA/digests/gates recorded; no pending external write except Wave13 issue closure | Missing evidence keeps issues open. Wave13 may verify and close only; it may not change product, Contract, release assets, tags, or pins. |

## Approval points

| Approval | Required before | Evidence presented |
| --- | --- | --- |
| `A1 publication start` | first push to any component `release/next` that can create an RC | this matrix, gate.1–4 report, exact request objects, collision/configuration preflight |
| `A2 Contract FROZEN` | applying/committing the FROZEN/register/publication-binding transition | Contract RC URL, gate.5/6 exact binding, complete gate.1–6 dispositions |
| `A3 stable promotion` | component squash/repin and first stable promotion | all RC qualification URLs/digests, candidate/main tree comparison, planned final SHA set |

## Reader checks

A release operator must be able to answer from this document alone: which immutable bytes are authoritative; whether any stage may rebuild; what to do after core-only npm success; what to do after OCI-only success; which token can create a stable Release; when Evidence may claim conformance; and which marketplace tasks are outside Wave12. If any answer is not unique, publication remains blocked at `W12.0`.
