# Iteration 6 WSR migration report

Status: **PENDING ONE npm 2FA GATE**  
Owners: [#120](https://github.com/firestige/workflow-self-recursive/issues/120), [#125](https://github.com/firestige/workflow-self-recursive/issues/125)  
Executed: 2026-08-30

## Authority outcome

- The product superproject remains `firestige/workflow-self-recursive`.
- GitHub redirects from the five old system slugs resolve to `wsr-execution`,
  `wsr-evidence`, `wsr-evolution`, `wsr-contracts`, and
  `wsr-workflow-package`. All target repositories remain active.
- `firestige/wsr-dsh` is the sole DSH Marketplace publisher. Stable
  `dsh-wsr-execution@0.1.0`, `dsh-wsr-studio@0.1.0`, and `dsh-wsr@0.1.0`
  are published with the registry integrities recorded by its `0.1.0` Release.
- `firestige/wsr-execution` PR #19 (merge
  `a49c214af9608e6bd51928378042f8317a230c7b`) makes the active Execution
  publisher core-only. The retained `packages/dsh-intake` tree is private,
  compatibility-only source and is absent from active package scripts and
  release workflows.
- `firestige/wsr-ui` was archived at `2026-08-30T00:45:47Z`. Its code and
  history remain readable; unarchive is the recovery operation.
- Deprecating all published `wsr-dsh-intake` versions is the only incomplete
  remote effect. npm authentication is valid, but the account's
  `auth-and-writes` 2FA policy requires a fresh OTP for this write.

## Old-coordinate scan

`authority_migration.py scan --enforce-target` reports zero active findings in
the superproject and every owner repository.

| Scan root | Active | Historical | Rollback | Fixture |
|---|---:|---:|---:|---:|
| superproject tracked files | 0 | 127 | 86 | 18 |
| `wsr-execution` | 0 | 8 | 22 | 9 |
| `wsr-dsh` | 0 | 3 | 0 | 0 |
| `wsr-contracts` | 0 | 16 | 0 | 0 |
| `wsr-evidence` | 0 | 0 | 0 | 0 |
| `wsr-evolution` | 0 | 0 | 0 | 0 |
| `wsr-workflow-package` | 0 | 0 | 0 | 0 |

The remaining allowlist is deliberately narrow:

- `migration-rollback-inputs`: frozen mapping, staged inverse inputs, and the
  exact old coordinates needed to reason about rollback.
- `retired-execution-dsh-source`: the private legacy package source and its
  former local qualification utilities; none is exposed by active package
  scripts or release workflows.
- `retired-execution-dsh-tests`: fixtures proving compatibility behavior and
  preventing the retired publisher from returning.
- `migrated-dsh-source-attribution`: NOTICE/UPSTREAM records that identify the
  source migrated into `wsr-dsh`.
- Immutable contract/release publications, changelogs, prior implementation
  results, and closed Iteration 4/5 evidence remain historical and are not
  rewritten.

## Qualification evidence

- Execution from the new pin: 83 test files, 701 tests PASS; coverage gates
  PASS (90% statements, 85.95% branches, 93.81% functions, 95.19% lines);
  typecheck, build, generated-contract check, static harness, and feasibility
  harness PASS.
- Core-only publisher: a real `0.1.4` release directory contains exactly one
  tgz and publication record; verification reports `artifactCount: 1`; the dry
  npm plan contains only `wsr-execution`.
- DSH new names: Execution-only, Studio-only, and suite clean profiles PASS.
  Lifecycle reports add/upgrade/rollback/remove PASS for the independent
  bundles and single-to-suite/reconcile/suite-to-single PASS with no duplicate
  UI.
- Published-image Compose: exact-digest Evidence and Evolution images pull and
  become healthy; migration, restart, upgrade, rollback, partial Evolution
  failure, secret/data retention, and unconfirmed-purge refusal PASS in an
  isolated project and volume. Cleanup removed the fixture containers,
  networks, and test volume.
- Workflow source: a clean directory downloads
  `implementation-workflow@0.3.0` from
  `firestige/wsr-workflow-package`, validates digest
  `sha256:3c345ebbbf537d73f009da3894444a0bdb0a5e55106d5fd3ba56e52ba71f8abf`,
  then replays the exact READY cache with the network disabled.
- Repository redirect checks resolve all five old GitHub slugs to their target
  repository objects. No runtime configuration relies on those redirects.
- A fresh recursive clone of the Wave 13 branch initialized all six submodules
  exclusively from `firestige/wsr-*` URLs at their exact pins; its own
  enforce-target scan reports zero active findings.

## Compatibility and rollback

No historical artifact, Delivery, Manifest, checkpoint, binding, Evidence
record, or user configuration was deleted. Old repository redirects and exact
Release assets remain readable. `wsr-dsh-intake@0.1.3` remains installable for
the Iteration 6 emergency window, while the tested rollback path selects exact
artifacts and never moves a tag or overwrites a version. Reactivating the old
publisher is not automatic: it requires a new explicit decision and a new npm
version. `wsr-ui` can be unarchived without changing repository identity.

Wave 13 can be declared complete and #125/#120 closed only after npm confirms
the exact deprecation message on versions `0.0.1`, `0.1.1`, `0.1.2`, and
`0.1.3`.
