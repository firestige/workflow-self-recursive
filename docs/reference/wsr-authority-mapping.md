# WSR Authority Mapping

Status: **FROZEN for Iteration 6 migration preparation**  
Owner issue: [#123](https://github.com/firestige/workflow-self-recursive/issues/123)  
Remote-effect owner: [#124](https://github.com/firestige/workflow-self-recursive/issues/124)  
Legacy cleanup owner: [#125](https://github.com/firestige/workflow-self-recursive/issues/125)

Wave 13 execution note (2026-08-30): the five repository cutovers and target
DSH `0.1.0` promotion are complete; `wsr-ui` is archived; the legacy Execution
DSH publisher is retired. The frozen old coordinates below remain as rollback
inputs and historical provenance, not active configuration.

This document is the single coordinate authority for the Iteration 6 WSR naming migration. It freezes targets and execution order; it does not itself authorize a repository rename, publisher switch, deprecation, archive, or deletion. Those remote effects require the explicit gates recorded below.

## Naming rules

- The product is **Workflow Self-Recursive (WSR)** on first user-facing reference and **WSR** thereafter.
- GitHub system repositories use the `wsr-*` family prefix.
- DSH Marketplace npm packages use the unscoped `dsh-wsr-*` prefix. No npm scope is introduced.
- Repository slugs and delivery coordinates are transport identities. A slug migration does not change a Workflow, Delivery, Manifest, Contract, Observation, or persisted session identity.
- Existing submodule directory names remain stable during Iteration 6. Only their remote URLs change, except that `wsr-dsh` is added and `wsr-ui` is retired after migration.

## GitHub repository and submodule authority

| Domain | Current repository | Target repository | Superproject path | Target state and owner |
|---|---|---|---|---|
| Product superproject | `firestige/workflow-self-recursive` | unchanged: `firestige/workflow-self-recursive` | repository root | Active product/integration authority; Iteration 6 does not rename it |
| Execution | `firestige/execution-system` | `firestige/wsr-execution` | `execution-system` | Active Execution domain and host-neutral npm authority |
| Evidence | `firestige/evidence-system` | `firestige/wsr-evidence` | `evidence-system` | Active Evidence domain, image, and Release authority |
| Evolution | `firestige/evolution-system` | `firestige/wsr-evolution` | `evolution-system` | Active Evolution domain, image, and Release authority |
| Contracts | `firestige/system-contracts` | `firestige/wsr-contracts` | `system-contracts` | Active portable Contract/schema authority |
| Workflow Package | `firestige/workflow-package` | `firestige/wsr-workflow-package` | `workflow-package` | Active first-party Workflow Package Release authority |
| DSH integration | none | `firestige/wsr-dsh` | `wsr-dsh` | Active and sole WSR DSH integration/Marketplace authority |
| Historical standalone UI | `firestige/wsr-ui` | no replacement repository | `wsr-ui` until removal | Migration source only; Evidence/Evolution semantic clients and contracts remain with their existing formal APIs, while Studio-specific BI presentation/domain UI moves to `wsr-dsh/packages/studio`; archive requires the Wave 13 human gate |

GitHub-native redirects are a rollback aid, not a supported runtime configuration. By the end of Wave 13, active configuration, Actions, submodule URLs, App allowlists, and documentation must use target repositories. Historical provenance may retain old URLs when marked historical.

## npm authority

| Capability | Current coordinate | Target coordinate | Target release owner | Compatibility rule |
|---|---|---|---|---|
| Host-neutral Execution runtime | `wsr-execution` | unchanged: `wsr-execution` | `firestige/wsr-execution` | Package identity and persisted bindings remain unchanged; only repository metadata/publisher authority moves with the repository rename |
| DSH Execution integration | `wsr-dsh-intake` | `dsh-wsr-execution` | `firestige/wsr-dsh/packages/execution` | `Intake` remains an internal capability name; after target stable qualification, the old package is deprecated with an exact replacement message and receives no new functional release |
| DSH Studio integration | private `@wsr/bi@0.0.0` development workspace; no public package | `dsh-wsr-studio` | `firestige/wsr-dsh/packages/studio` | The private workspace is not a public compatibility coordinate and no new `wsr-bi` package is introduced. Studio-specific BI presentation/domain UI is owned here; Evidence/Evolution semantics are consumed only through their formal APIs |
| DSH suite | none | `dsh-wsr` | `firestige/wsr-dsh/packages/suite` | Exact-version composition of the qualified Execution and Studio bundles; it owns no copied implementation and creates no duplicate UI entry |
| Evidence npm reservation | inert `wsr-evidence@0.0.1` | unchanged reservation only | `firestige/wsr-evidence` metadata after repository rename | Not a supported Evidence transport or functional package; no consumer or active functional publisher may be introduced by this migration |
| Evolution npm reservation | inert `wsr-evolution@0.0.1` | unchanged reservation only | `firestige/wsr-evolution` metadata after repository rename | Not a supported Evolution transport or functional package; no consumer or active functional publisher may be introduced by this migration |

The three target DSH names were reserved as inert `0.0.1` packages on 2026-08-29. Qualified `0.1.0` packages were promoted from the exact `0.1.0-rc.1` candidate on 2026-08-30 through the single `firestige/wsr-dsh` authority; `latest` now resolves to that functional release.

## Container image authority

| Service | Target image | Release owner | Coordinate rule |
|---|---|---|---|
| Evidence | `ghcr.io/firestige/wsr-evidence` | `firestige/wsr-evidence` | Current qualified input is `ghcr.io/firestige/wsr-evidence:0.1.0-rc.3@sha256:5ce1574260677b5fdfcecacae872a53f0e080092b0c375ddee1216479f18c542`; consumers bind an immutable digest and tags are discovery/promotion metadata only |
| Evolution | `ghcr.io/firestige/wsr-evolution` | `firestige/wsr-evolution` | Current qualified input is `ghcr.io/firestige/wsr-evolution:0.1.0-rc.1@sha256:41e244d68f588d8b0a4789488a694c55e2034e36f4a152638e026c03dde1a14f`; consumers bind an immutable digest and tags are discovery/promotion metadata only |

There is no DSH Studio, Workflow Builder, or improvement-loop container. PostgreSQL is an upstream deployment dependency, not a WSR-published image. Wave 11 may switch active image/Release authority only after the explicit cutover approval.

## GitHub Release and asset authority

| Artifact family | Current authority | Target authority | Stable asset identity and publisher workflow |
|---|---|---|---|
| Contract/query release | `firestige/system-contracts` | `firestige/wsr-contracts` | Preserve the `evidence-query-0.1.0` asset family: publication records, `release-metadata.json`, and `release-qualification.json`; reuse `.github/workflows/release-candidate.yml` and `.github/workflows/release-promote.yml` after repository rename |
| Execution core release | `firestige/execution-system` | `firestige/wsr-execution` | Preserve `wsr-execution-<version>.tgz`, its publication JSON, `release-metadata.json`, release notes, and `release-qualification.json`; reuse `.github/workflows/release-candidate.yml` and the existing OIDC `.github/workflows/release-promote.yml` after repository rename |
| DSH bundles | `wsr-dsh-intake-<version>.tgz` and publication JSON in `firestige/wsr-execution` | `firestige/wsr-dsh` | Shared candidate and stable tags contain `dsh-wsr-execution-<version>.tgz`, `dsh-wsr-studio-<version>.tgz`, `dsh-wsr-<version>.tgz`, `release-metadata.json`, `release-qualification.json`, `SHA256SUMS`, SPDX SBOM, provenance, and `compatibility-matrix.json`; `.github/workflows/release-promote.yml` is the sole target promoter |
| Evidence image/Python assets | `firestige/evidence-system` | `firestige/wsr-evidence` | Preserve wheel/sdist names, metadata, qualification, and exact OCI digest semantics; reuse `.github/workflows/release-candidate.yml` and `.github/workflows/release-promote.yml` after repository rename |
| Evolution image/assets | no public image/Release authority | `firestige/wsr-evolution` | #116 freezes the first exact version/digest and asset set and adds candidate/promote workflows; those workflows become the only publisher before cutover |
| First-party Workflow Packages | `firestige/workflow-package` | `firestige/wsr-workflow-package` | Preserve `workflow-package-<name>-<version>.tar.gz`, descriptor, checksum, and provenance; reuse `.github/workflows/release-candidate.yml` and `.github/workflows/release-promote.yml` after repository rename. Logical Package identity is independent of repository slug |

No Release asset is deleted or rewritten by this migration. Old Release URLs remain historical evidence. Only after Wave 11 succeeds may active consumers use the target authority exclusively.

## Configuration and display identity

| Surface | Current value | Target value | Migration behavior |
|---|---|---|---|
| Workflow source repository default | `firestige/workflow-package` | `firestige/wsr-workflow-package` | Changes only for new/effective installation configuration after cutover; an admitted Delivery retains its exact resolved Package binding |
| Workflow source API base | `https://api.github.com/repos/firestige/workflow-package/releases` | `https://api.github.com/repos/firestige/wsr-workflow-package/releases` | Updated atomically with the repository default; no branch/latest/local fallback |
| Workflow source asset pattern | `workflow-package-{name}-{version}.tar.gz` | unchanged | Repository rename never changes logical Package identity or asset naming |
| Execution config/schema identity | existing versioned `execution.config@*` | unchanged by naming migration | Provider/contract work may version it only under its own owner issue; slug migration is not a schema-version reason |
| Cordis service identifier | `workflow-execution` | unchanged | Repository and package migration do not rename the registered service |
| Telemetry service name | `workflow-self-recursive-execution` | unchanged | Dashboards and historical observations retain a stable service identity |
| DSH command, skill, and tool identities | `/wsr`, `/workflow-execution`, `workflow_execution_intake` | unchanged | Existing user and model-facing invocation semantics remain stable |
| DSH Execution package/display | `wsr-dsh-intake` / prior Intake-oriented display | `dsh-wsr-execution` / `WSR` | Package migration only; Intake remains an internal request channel |
| DSH Studio package/display | private standalone BI development surface | `dsh-wsr-studio` / `WSR Studio` | Formal product surface is the DSH plugin; local development harness is non-publishing |
| DSH suite package/display | none | `dsh-wsr` / no additional top-level UI entry | Suite only composes exact Execution and Studio versions |

## Ordered migration and remote-effect gates

1. **Bootstrap (#123):** create `firestige/wsr-dsh`, reserve the three npm names, configure a fail-closed release skeleton and trusted publishers, and leave every current consumer active.
2. **Prepare (#121/#124):** build the DSH monorepo and generate a versioned migration manifest containing every old/target coordinate, exact preflight, mechanical replacement, postflight, and inverse command. Stage the target `.gitmodules`, Actions, App allowlists, documentation, Workflow source defaults, image digests, publisher/workflow coordinates, and compatibility matrix in branches/fixtures. The stage has no repository rename, publisher switch, npm deprecation, archive, or active consumer effect.
3. **Qualify owners (#105–#107/#111/#116/#118/#84/#85):** only accepted owner code and immutable artifacts may enter the migration window.
4. **Approve cutover (#124):** record human approval as a durable comment on issue #124 that names the exact migration-manifest commit and digest, all target repositories/artifacts, preflight evidence, and rollback commands. Approval applies only to those bytes; any manifest change invalidates it.
5. **Cut over (#124):** execute repository renames in this dependency order: `system-contracts` → `wsr-contracts`; `workflow-package` → `wsr-workflow-package`; `evidence-system` → `wsr-evidence`; `evolution-system` → `wsr-evolution`; `execution-system` → `wsr-execution`. The product superproject remains `firestige/workflow-self-recursive`. After each rename, update and verify publishers, workflows, App access, staged consumers, and redirects before proceeding.
6. **Publish and qualify (#122/#117):** promote final DSH bundles and loopback assembly from target authorities; run clean-profile and exact-coordinate qualification.
7. **Approve cleanup (#125):** record a second human approval as a durable comment on issue #125 that names the exact migration report and target-qualification artifact. Archiving `wsr-ui` is authorized only when that repository is explicitly listed in this approval; otherwise it remains available. Deletion is never authorized by this mapping.
8. **Clean up (#125):** deprecate the old npm integration package with its exact replacement message, disable superseded active publishers, perform only the explicitly approved optional archive, and remove non-allowlisted active references. Preserve historical evidence and all durable data.

At every compatibility epoch there is one publisher for an exact coordinate: no two repositories may publish the same npm package/version, OCI name/tag or digest, or Release tag/asset identity. Old and target authorities may coexist only for different exact coordinates while rollback remains open.

## Compatibility windows and rollback points

| Boundary | Compatibility window | Rollback point |
|---|---|---|
| Repository rename | GitHub redirects remain available throughout Iteration 6, but are removed from active configuration by Wave 13 | Rename back before another repository claims the old slug; then restore the previous `.gitmodules`/consumer commit, publisher workflow, and App allowlist |
| DSH npm migration | `wsr-dsh-intake@0.1.3` remains installable during the Iteration 6 rollback window but receives no new releases; deprecation points to `dsh-wsr-execution` | Reinstall the exact old artifact only for emergency compatibility; reactivating a publisher requires a new explicit decision and a new version because published bytes are immutable |
| DSH target packages | `0.0.1` is inert; the first qualified stable version becomes the supported baseline | Before stable promotion, remove no old authority; after promotion, roll consumers back to the last exact qualified bundle set |
| Images | Previous exact digests remain pullable through the rollback window; no tag movement is treated as identity | Restore the prior Compose compatibility manifest/digests and prior repository publisher while investigating |
| Workflow Package source | Existing Delivery/Manifest bindings retain exact version/digest and remain resolvable; new defaults use the target repository after cutover | First rename `wsr-workflow-package` back to `workflow-package`, verify the old Release API, and only then restore the previous source default for new admissions; never rewrite an existing Delivery binding or rely on a redirect as the rollback target |
| `wsr-ui` | Archived on 2026-08-30 after Studio and reusable owner packages passed acceptance and Wave 13 archival was approved; repository contents remain readable | Unarchive and restore the previous submodule pin if source recovery is required; `wsr-dsh` remains the sole active Studio publisher |

Rollback never deletes Delivery, checkpoint, binding, Evidence, configuration, Release artifact, or provenance. A failed step stops before the next remote effect and returns to the last row whose unique active authority was verified.

## Operator involvement classification

The cutover distinguishes approval gates from technical requirements for browser interaction:

- **Automatable after approval:** the five system repository renames; local consumer rewrites; `.gitmodules`, Actions, documentation and Workflow source updates; repository secrets and variables; read-only repository/App/publisher smoke tests; rollback renames and inverse consumer rewrites. These use `gh`, Git and the checked-in migration tooling.
- **Human approval required, but executable by the operator agent:** repository renames, active publisher/Release authority switches, stable promotion, npm deprecation and optional archival. The approval is a product/safety gate; it does not imply that a browser is technically required.
- **Browser action required with the current credentials when configuration is missing:** npm CLI 11.6.2 exposes no trusted-publisher configuration command, but the package owner confirms the target records were configured during bootstrap, so Wave 11 only verifies them through qualified OIDC publication. Changing the selected repositories of the `wsr-release` GitHub App would also require browser action with the current `gh` OAuth token, because the installation repository API rejects that token. A repository rename retains the same repository object, so the cutover first verifies existing App access rather than editing the selection. Only the already-created `wsr-dsh` repository may need a selection change if the smoke test shows it is absent.
- **Potential browser fallback:** GHCR “Manage Actions access” or repository linking is only needed if post-rename publish qualification proves the existing package association did not follow the repository object. It is verified first and is not assumed to be a mandatory manual step.

Secrets already configured through repository settings remain attached to the renamed repository and are verified rather than recreated. No credential material is copied into the migration manifest.

## Historical-reference allowlist

After successful Wave 13 cleanup, old coordinates may remain only when the containing record is immutable or explicitly marked historical, including release manifests, checksums, provenance, migration reports, changelogs, prior implementation results, and issue/PR history. During the qualified compatibility window, the versioned migration manifest may additionally retain exact old coordinates solely as rollback inputs. Runtime defaults, current README installation commands, active Actions checkout targets, `.gitmodules`, App allowlists, compatibility manifests, and current operator commands are never historical allowlist locations after Wave 13.
