# Wave12 A3 component-first integration preflight

Status: `READY_FOR_OWNER_APPROVAL — NO_A3_ACTION_TAKEN` (2026-08-27)

## Qualified immutable objects

- Contract RC: <https://github.com/firestige/system-contracts/releases/tag/evidence-query-0.1.0-rc.1>; target `dc8a50e92eebfc35bd706579ff2bf5e9beb57782`; final FROZEN feature head `a3f6d7ca8a3e08e89af4bc3ecea34524f5094bd5`.
- Execution RC: <https://github.com/firestige/execution-system/releases/tag/0.1.3-rc.1>; target `3c6259ca07276b1de8520fa6fc0d26c86fd93a41`; qualified publisher feature head `8bf7e3f85f6829cbe686f6ff454eb2fe0ef02456`.
- Evidence RC: <https://github.com/firestige/evidence-system/releases/tag/0.1.0-rc.1>; target `3770f283474728740fb1323dc186861cfcf08e16`; qualified publisher/request feature head `183c055c5c29742ded4102d9b3e9466eb197cfcd`; OCI `sha256:3b0b6d290d9a7abf21a544f0110ef04f7398d0870a5f63e1a5a81e5274a7d403`.
- Workflow-package has no Iter4 product publication. Its release adapter feature head is `d9e7b9f7f1013aef9d4a23fefe65563ec77e5af0` and remains configuration/oracle-only.
- Superproject publication-state head before this append-only preflight report is `d4ddae64fdf5f047eaff72f20c68ac28ba4b7459`; the report's own evidence-only checkpoint is included when the final squash input is resolved after component repins.

## Main bases and approved squash inputs

| Repository | `origin/main` base | Iter4 squash input | Input tree |
| --- | --- | --- | --- |
| `workflow-package` | `760c8fc6b9d547e21fd020cedaafa38b68880b9d` | `d9e7b9f7f1013aef9d4a23fefe65563ec77e5af0` | `1870b5bc60cee69c2fb5b7b733e353a2f596af78` |
| `system-contracts` | `9e6ba782b742f49f3d2392c9af37ebd4ff328bc8` | `a3f6d7ca8a3e08e89af4bc3ecea34524f5094bd5` | `4b97cb6a707fa03e24b705e66483cb59fb020d1d` |
| `execution-system` | `f095503bd5222af5f966fb7bfdcdb7928fdbb476` | `8bf7e3f85f6829cbe686f6ff454eb2fe0ef02456` | `53cc293dd4247160b1c6bd330c48aec68f496e76` |
| `evidence-system` | `52c0dc73b8508b67f3c8978b8716cd291b66a7c8` | `183c055c5c29742ded4102d9b3e9466eb197cfcd` | `0e2f696bced5823e9b523bc6082f02cf2b9fdfd4` |
| superproject | `e229313dccb4fdb54444f3eb0408bf5dc5558a00` | publication-state `d4ddae64fdf5f047eaff72f20c68ac28ba4b7459`, this append-only preflight evidence, then only exact component-main repins | publication-state tree `73c2984d493a31fffa12b4807dda288b331ffc3d` before report/repin |

All five worktrees are clean. Every component remote `iter4/implementation` ref equals its recorded local feature head; the superproject remote equals the current append-only evidence checkpoint.

## Candidate-to-feature delta disposition

- Contract `dc8a50e9..a3f6d7ca` contains only the approved atomic FROZEN lifecycle/register/publication-record transition and its validator/schema support; semantic Contract bytes are unchanged.
- Execution `3c6259ca..8bf7e3f8` contains release workflow/materializer/recovery tests, immutable request metadata, release documentation and changelog records. It contains no post-candidate product `src/**` or package implementation change.
- Evidence `3770f283..183c055c` contains only CI authority selection, release documentation, the append-only Wave12 candidate manifest and immutable request. Product, wheel/sdist inputs, migrations and deployment code do not change after the qualified target.
- Workflow-package contains only the Wave4 release adapter, configuration and oracle tests. It is merged for automation availability but is not published in Iter4.
- Superproject `03dfd979..d4ddae64` contains only the Evidence request gitlink pin, append-only RC publication state, plan status and qualification evidence.

The required post-squash oracle is tree-content based: each component squash result must equal the recorded Iter4 input tree. The superproject feature line is then repinned to those exact new component-main SHAs, and the final superproject squash tree must equal that repinned feature tree. Generated squash commit SHAs are recorded before any stable promotion; stable tags remain bound to the already qualified candidate targets and assets, not rebuilt from squash-main.

## Authorized order after A3

1. Squash `workflow-package`, `system-contracts`, `execution-system`, and `evidence-system` Iter4 inputs onto their unchanged main bases; push each main only after tree equality and repository CI pass.
2. Repin the superproject feature line to the four exact component-main squash SHAs, run recursive checks, squash onto the unchanged superproject main base, and push main.
3. Reconcile candidate/main workflow trees and record every generated main SHA. Stop on any unaccounted difference.
4. Promote the Contract stable release from its qualified RC, then publish/smoke the Execution npm pair and stable Release, then promote Evidence stable from the exact qualified wheel/sdist/OCI digest.

None of these actions is authorized by this document. A3 owner approval is required before step 1.
