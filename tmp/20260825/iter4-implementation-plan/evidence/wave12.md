# Wave12 unified publication pre-close report

Status: `PASS — FINALIZED BY WAVE13` (2026-08-27)

Wave12 froze and published the Evidence Query contract, qualified immutable RCs, completed the one component-first squash/repin, and promoted the exact qualified Contract, Execution, Intake, and Evidence bytes. No release asset was rebuilt during promotion. Wave13 independently audited the result and closed #48–52, #92, and #102 with the evidence links below.

## Immutable authority

- Wave11 unified candidate: `release/candidates/iter4-wave11.json`, SHA-256 `c5b78ce1d2c8a5b813032254759c93c9d94bbc1f6a6c250f4511e9dc7c534ef4`.
- Wave12 Evidence qualification authority: `release/candidates/iter4-wave12.json`, SHA-256 `56b982b205c05cd591019ac3165f8d9da5801323ae5a2dd181ec4f603aa0d0ca`.
- Append-only RC publication record: `release/publications/iter4-wave12-rc.json`, SHA-256 `b08a0de822a01f721b2b4ad9d41933bb1d3ef820ae12afa6054c107f27af44f6`.
- Post-integration state: `release/publications/iter4-wave12-integration.json`. It records A3 approval, component trees, recovery attempts, main pins, CI, promotion URLs, stable targets, and registry digests without rewriting either immutable candidate.

## Contract publication and FROZEN binding

- RC: `evidence-query-0.1.0-rc.1`, candidate run `32986502152`, target `dc8a50e92eebfc35bd706579ff2bf5e9beb57782`.
- Stable: [evidence-query-0.1.0](https://github.com/firestige/system-contracts/releases/tag/evidence-query-0.1.0), promotion run `33024960580`, target `dc8a50e92eebfc35bd706579ff2bf5e9beb57782`.
- RC and stable asset `{name, size, digest}` inventories are identical. The published machine candidate digest is `sha256:97c3e158c18cd7e92da949d82a17b71c5e4bf08d081fef6e5f4b6dcb9c00c6a7`.
- The FROZEN publication record is `system-contracts/evidence-query/publication/publication-record-0.1.0.json`, SHA-256 `feb0186da48661d2663b03d20e536f470b591ea22f21a34a4ca99bfcc33204e9`, status `FROZEN`.
- An initial promotion run `33024460779` failed before checkout because one `gh release view` lacked an explicit repository. It produced no stable state. The workflow was fixed with a red/green repository-scope test, component CI `33024524430` passed, and the exact same RC was resumed.

## Component-first integration

| Repository | Approved feature input | Main pin after integration | Main qualification |
|---|---|---|---|
| workflow-package | `d9e7b9f7f1013aef9d4a23fefe65563ec77e5af0` | `00cc5832e0d7507e7bdd7ce20869a1360a142861` | `33022393696` PASS |
| system-contracts | `a3f6d7ca8a3e08e89af4bc3ecea34524f5094bd5` | `b50525f5b1db2c017d71ed307ed25bb1c3a7c783` | `33024524430` PASS |
| execution-system | `8bf7e3f85f6829cbe686f6ff454eb2fe0ef02456` | `c19c811c32cdadb61e0f54cc01bbe770b984c91d` | root authority run `33025969313` PASS after stable-tag changelog sync |
| evidence-system | `183c055c5c29742ded4102d9b3e9466eb197cfcd` | `624aad2f57c72964ac1b9f82509d9310cc56a781` | `33022820046` PASS |

The squash commits reproduced the approved component input trees. Later main-only changes were limited to generated changelog synchronization and release-gate/workflow corrections covered by red/green tests; they did not alter candidate product trees or RC assets. The pre-stable superproject repin main is `de5499b8c1eda14a6bb1d731b48c6dffefdede6c`. After the stable tag converted the generated section name from `0.1.3-rc.1` to `0.1.3`, Execution commit `c19c811c32cdadb61e0f54cc01bbe770b984c91d` synchronized that release metadata without changing product or release bytes; post-stable superproject repin `1a5f33a0eba8678d5d5615a5a68840e93af83e37` and root run `33025969313` then passed full tests, coverage, contract consumers, public artifacts, npm consumer import, DSH lifecycle, real Web Intake installation, independent Workflow Package assets, and protected-scope checks.

The former whole-repository `system-contracts` freeze was narrowed to byte-exact tree freezes for Observation, Evaluation, Workflow DSL, and Delivery Admission. This admits the new `evidence-query/` contract while keeping every pre-existing protected contract unchanged.

## Execution and DSH Intake stable publication

- RC: [0.1.3-rc.1](https://github.com/firestige/execution-system/releases/tag/0.1.3-rc.1), qualification run `32990232622`, target `3c6259ca07276b1de8520fa6fc0d26c86fd93a41`.
- Stable: [0.1.3](https://github.com/firestige/execution-system/releases/tag/0.1.3), promotion run `33025332249`, target `3c6259ca07276b1de8520fa6fc0d26c86fd93a41`.
- `wsr-execution-0.1.3.tgz`: `sha256:7c5ab0c061d2cc9f6e3d486e885ee2072870eb09aa0284f0285547fb828d3ca0`.
- `wsr-dsh-intake-0.1.3.tgz`: `sha256:d518a687c32077aa8ced55a446da4c744461d3bb58d85aa705638073979618b8`.
- Registry coordinates: [wsr-execution@0.1.3](https://www.npmjs.com/package/wsr-execution/v/0.1.3) and [wsr-dsh-intake@0.1.3](https://www.npmjs.com/package/wsr-dsh-intake/v/0.1.3); both `latest` tags resolve to `0.1.3`.
- The npm tarballs downloaded from the registry have the exact SHA-256 values above. Core published before Intake, registry verification passed, the remote artifact-install Web Intake E2E passed before publish, and the root lifecycle/local-install gates passed. Registry-byte equality therefore carries the qualified DSH product smoke to the published coordinates without rebuilding.

This wave does **not** claim DSH marketplace listing. The separate plugin-listing checklist explicitly defers its unchecked screenshot, badge, directory PR, marketplace, and community actions; no listing submission was made or inferred.

## Evidence stable publication

- RC: [0.1.0-rc.1](https://github.com/firestige/evidence-system/releases/tag/0.1.0-rc.1), qualification run `32992944389`, target `3770f283474728740fb1323dc186861cfcf08e16`.
- Stable: [0.1.0](https://github.com/firestige/evidence-system/releases/tag/0.1.0), promotion run `33025426200`, target `3770f283474728740fb1323dc186861cfcf08e16`.
- Wheel: `sha256:e4e409561a1eb778bbdf7cefc406cf3242fc5972ef00aeffd3e558d6aeeb08ef`.
- Sdist: `sha256:6660c0a2a05dbc92060764e3b03167adb9eef472cd98588e22af04ce0bc5ccea`.
- OCI: `ghcr.io/firestige/wsr-evidence:0.1.0` resolves to the qualified RC digest `sha256:3b0b6d290d9a7abf21a544f0110ef04f7398d0870a5f63e1a5a81e5274a7d403`.

RC and stable GitHub asset inventories are identical. The promotion re-pulled the exact OCI digest before attaching the stable tag. The RC qualification had already passed Linux deployment, policy, dual-instance isolation, backup/restore, and downloaded-asset verification; the earlier file-secret ownership failures stopped before GHCR/RC creation and the repair preserved wheel/sdist bytes.

## Pre-close result

Wave12 is `PASS` at the pre-close boundary. Contract, Execution/Intake, and Evidence stable targets equal their accepted RC targets; all stable GitHub assets equal RC assets by name, size, and SHA-256; npm and OCI external coordinates resolve to those exact bytes/digest; component mains and the superproject pin are qualified. The only deferred DSH work is the separately scoped marketplace/listing checklist, not product publication or install qualification.

Wave13 independently re-read this evidence, verified clean worktrees and current external state, and closed the target issues only after root run `33026195904` passed. Closure evidence:

- [#48](https://github.com/firestige/workflow-self-recursive/issues/48#issuecomment-5432638489)
- [#49](https://github.com/firestige/workflow-self-recursive/issues/49#issuecomment-5432638987)
- [#50](https://github.com/firestige/workflow-self-recursive/issues/50#issuecomment-5432639460)
- [#51](https://github.com/firestige/workflow-self-recursive/issues/51#issuecomment-5432640154)
- [#52](https://github.com/firestige/workflow-self-recursive/issues/52#issuecomment-5432640696)
- [#92](https://github.com/firestige/workflow-self-recursive/issues/92#issuecomment-5432641187)
- [#102](https://github.com/firestige/workflow-self-recursive/issues/102#issuecomment-5432641807)

No product change or new release is authorized by this finalized report.
