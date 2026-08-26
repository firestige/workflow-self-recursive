# Wave12 Evidence RC qualification

Status: `PASS — W12.6 EVIDENCE_RC_CREATED` (2026-08-27)

## Immutable identity

- Release: <https://github.com/firestige/evidence-system/releases/tag/0.1.0-rc.1>.
- Successful workflow: <https://github.com/firestige/evidence-system/actions/runs/32992944389>.
- Product/tag target: `3770f283474728740fb1323dc186861cfcf08e16`.
- Publisher revision: `183c055c5c29742ded4102d9b3e9466eb197cfcd`.
- Authority: superproject `03dfd979083023781247cf089ea3c9e3e8a31ab7`, `release/candidates/iter4-wave12.json`, SHA-256 `56b982b205c05cd591019ac3165f8d9da5801323ae5a2dd181ec4f603aa0d0ca`.
- Base candidate remains `release/candidates/iter4-wave11.json`, SHA-256 `c5b78ce1d2c8a5b813032254759c93c9d94bbc1f6a6c250f4511e9dc7c534ef4`; neither Wave10 nor Wave11 was edited.
- Independent download directory: `/tmp/wsr-evidence-rc-verify.IIJZAQ`.

## Published identities

| Object | SHA-256 / identity |
| --- | --- |
| `release-metadata.json` | `7d8992d2c3be9c56aee4731201c9b9aa527abb582bd15107722138b2d13b5442` |
| `release-qualification.json` | `db3ac136f03c705a9f8f38573798bf72fe0baec7b5092415e87d01101b58a56c` |
| `wsr_evidence-0.1.0-py3-none-any.whl` | `e4e409561a1eb778bbdf7cefc406cf3242fc5972ef00aeffd3e558d6aeeb08ef` |
| `wsr_evidence-0.1.0.tar.gz` | `6660c0a2a05dbc92060764e3b03167adb9eef472cd98588e22af04ce0bc5ccea` |
| GHCR candidate | `ghcr.io/firestige/wsr-evidence@sha256:3b0b6d290d9a7abf21a544f0110ef04f7398d0870a5f63e1a5a81e5274a7d403` |

The Release is a prerelease and its tag resolves exactly to the requalified product commit. The independently downloaded directory passes the repository release verifier. The wheel and sdist byte-equal the Wave10/Wave11 frozen artifact digests. The pulled OCI index has source `https://github.com/firestige/evidence-system` and revision `3770f283474728740fb1323dc186861cfcf08e16`.

## Qualification and bounded recovery

The successful run passed 117 unit tests, Ruff, strict mypy, build, 10 release-tooling tests, 12 PostgreSQL migration/integration tests, local deployment/retention/least-privilege/backup-restore, exact artifact rebuild, GHCR pull-by-digest, remote Release redownload, and a second deployment/backup-restore qualification. Its qualification record binds `evidence.query@0.1.0` in `FROZEN` state with `VALIDATOR_ONLY`, the product commit, publisher revision, metadata digest, and OCI digest.

Runs `32991769257` and `32992314462` stopped before GHCR or RC creation at the same Linux deployment gate. They proved that Compose file-backed secrets preserve host ownership: mode `0600` made the random password files unreadable after the PostgreSQL image dropped privileges. The narrow repair keeps the temporary host directory at `0700` and exposes only the explicitly mounted random files as `0644`. A regression test covers this Linux ownership boundary. Rebuilding after the repair produced the exact same wheel and sdist bytes, so `release/candidates/iter4-wave12.json` records a test/deployment qualification revision, not changed release artifacts.

The App token was minted only after all local gates and artifact checks, scoped to `firestige/evidence-system`, and requested Contents/Workflows write only for RC creation. No main merge, superproject main repin, stable tag/Release, npm publication, or DSH listing was created. A3 remains pending.
