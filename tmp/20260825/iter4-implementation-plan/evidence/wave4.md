# Wave4 release automation evidence

Status: `PASS — #92 IMPLEMENTATION_READY` (2026-08-26)

No RC, tag, GitHub Release, npm publication, Python publication, or stable OCI tag was created by Wave4.

## Pushed checkpoints

- execution-system: `3179eb13514aaaef733c20cf55b03effd98fbf4e` — Execution npm/DSH adapter (`ea73d8514629f9fbe0988e9429134a75fe73e164`) plus final package-manager/guard policy oracles.
- evidence-system: `4870c764c0ff1a2ed6ae66cbebb3f122709a8073` — Python wheel/sdist + digest-bound GHCR adapter; no npm policy.
- system-contracts: `74c5eb38b91fa774662dbfbfc02536bf97c7f188` — contract publication-record adapter; no npm policy.
- workflow-package: `d9e7b9f7f1013aef9d4a23fefe65563ec77e5af0` — deterministic workflow-asset adapter with exact Contract SHA input; no npm policy.
- superproject: `8afbd4e7884379cd02811d68f75dcf3f339d68cf` — Wave4 docs/workflows and final four-component checkpoint pins (`aae4274e30a5cd59baeadb41c1d5f8226a33eba5` plus final Execution oracle repin).

All commits are on `iter4/implementation` and pushed to origin. They are checkpoints, not per-wave merges.

## Capability matrix

| Repository | Asset mode | Publisher | Mode |
|---|---|---|---|
| execution-system | npm-pair | npm-pair+dsh+github-release | active |
| evidence-system | python-wheel-sdist+oci | python-github-release+ghcr | active |
| system-contracts | contract-publication-records | contract-publication+github-release | active |
| workflow-package | workflow-assets | workflow-assets+github-release | active |
| evolution-system | parameterized | parameter-only | no publish |
| bi | none | none | excluded |

## No-side-effect oracle results

- Execution: 68 test files, 561 tests PASS; coverage PASS (90% statements, 85.73% branches, 94.19% functions, 95.39% lines); typecheck/build/generated/static/feasibility/distribution/changelog gates PASS.
- Evidence: Ruff, strict mypy, 38 unit tests, wheel/sdist build and 10 release adapter tests PASS.
- system-contracts: Workflow/Observation/Evaluation/Delivery acceptance and 4 release adapter tests PASS.
- workflow-package: both package definitions pass schema/conformance; deterministic builder and 4 release adapter tests PASS.
- Eight release workflow YAML files parse; all repository `diff --check` checks PASS.
- Execution real local artifact build and verification PASS. Dry publication planning for current `0.1.2` stopped with `NPM_VERSION_DIGEST_COLLISION`, as required, because current source bytes differ from the already-published manual 0.1.2 baseline. No publish was attempted.
- Secret scan found no private key, npm token, PAT, or `NODE_AUTH_TOKEN` in implementation paths; documentation mentions `NODE_AUTH_TOKEN` only to assert its absence.

## Identity attestation and blocker

Approved App declaration:

- owner/slug: `firestige` / `wsr-release`
- installation allowlist: `workflow-self-recursive`, `execution-system`, `evidence-system`, `evolution-system`, `system-contracts`, `workflow-package`
- registration permissions: Contents read/write, Workflows read/write, Metadata read
- per-run token reduction: own repository only, `contents: write`
- Actions names: variable `WSR_RELEASE_APP_ID`, secret `WSR_RELEASE_APP_PRIVATE_KEY`

GitHub App installation attestation PASS: installation `156531932`, owner/slug `firestige/wsr-release`, `repository_selection=selected`, unsuspended, and the exact six-repository allowlist. Granted permissions are Contents write, Workflows write, and Metadata read. A short-lived installation token successfully resolved all six repositories and was immediately revoked. Actions name-only audit confirms `WSR_RELEASE_APP_ID` and `WSR_RELEASE_APP_PRIVATE_KEY` exist in execution-system, evidence-system, system-contracts, and workflow-package; no secret value was read or printed.

npm trusted publisher is selected for both `wsr-execution` and `wsr-dsh-intake`, bound to `firestige/execution-system` and `release-promote.yml`, with no environment and allowed action `npm publish`. Owner `firestige` confirmed both settings saved on 2026-08-26. npm does not validate fields when saved or expose this package setting through the public registry/ordinary CLI, so this is explicitly an owner attestation rather than a claimed machine readback.

Wave4 is complete at the implementation-ready boundary. Issue #92 remains OPEN at `https://github.com/firestige/workflow-self-recursive/issues/92`; real Actions run URLs, RC/stable assets, registry provenance and issue closure remain Wave11 work.
