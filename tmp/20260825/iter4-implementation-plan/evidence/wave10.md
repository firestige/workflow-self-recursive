# Wave10 Evidence integration, deployment, and immutable candidate evidence

Status: `PASS — IMMUTABLE_RELEASE_CANDIDATE` (2026-08-26)

This wave completes local deployment and produces an immutable candidate manifest. It creates no tag, GitHub Release, package publication, GHCR publication, Contract `FROZEN` transition, or implementation conformance claim. Issues #50/#51/#52 remain open for Wave11's publication and final closure gates.

## Pinned execution set and checkpoints

- Wave10 input Evidence commit: `f9bfd3776057645e6cbebb7ac685a82d48ddbdb4`.
- Wave10 input system-contracts commit: `6f77510234961149922165666ed0be2d2f82b84b`.
- Wave10 input superproject commit: `65f6e4deaea37e43a5d6242bd0df1c1e57cb9abf`.
- Contract input: `evidence.query@0.1.0`, Wave6 manifest SHA-256 `e605720c5b225fa9228e2a4b1a8001f3235482ed83dc214e4c766e5caa6e1706`.
- Evidence deployment payload commit: `cdc540ac53991a2ba243598e2dc2ec9596c695e4`.
- Evidence immutable-manifest commit: `d37f454e2379fed17294c863482f6fcb0c75a97e`.
- Final superproject pin checkpoint: `7d93175dc150a1a4a876c27a30e2625296ff56c8`.
- Branch: `iter4/implementation`; component and superproject checkpoints are pushed to `origin/iter4/implementation`.

The executor did not merge, repin, or change the fixed inputs while running integration. The coordinator alone committed the Evidence payload, added the binding manifest in a second non-payload commit, and repinned the superproject.

## Delivered deployment and operations

- The default Compose surface contains only `database`, `migrate`, and `evidence`. The API publishes exactly `127.0.0.1:4318`; PostgreSQL has no host port. `backup` and `restore` exist only in the explicit `operations` profile. No Grafana, UI, or presentation proxy exists.
- File-backed secrets replace `POSTGRES_HOST_AUTH_METHOD=trust` for network clients. `wsr_evidence_admin` owns migrations/restores, `wsr_evidence_runtime` has only runtime table/sequence privileges, and `wsr_evidence_backup` has `SELECT` only plus `default_transaction_read_only=on`. All roles are non-superuser, non-createdb, and non-createrole except that restore uses the dedicated admin owner.
- Local startup creates ignored mode-0600 random secrets. Managed deployments can supply installation-owned secret paths. Passwords are read from mounted files and URL-encoded without appearing in Compose environment values.
- Retention is now assembled into the application lifecycle over the existing shared PostgreSQL pool. It runs immediately, waits the validated policy interval, contains one failed iteration, and is cancelled before pool shutdown. Invalid retention configuration is still projected before Uvicorn startup.
- Read-only `pg_dump --format=custom` verifies the archive catalog and emits SHA-256. Restore refuses existing/arbitrary targets, restores only to a new `wsr_evidence_restore_*` database, reapplies the closed least-privilege grants in that database, and never overwrites the live database.
- `docs/operations.md`, Make targets, local lifecycle helper, exact negative network commands, and an executable deployment/backup/restore smoke oracle form the operator handoff.

## TDD and failures closed

Initial deployment contract tests failed on the prior single `wsr_evidence` superuser plus host `trust`, absent secret separation, and missing backup/restore surface. They passed after the three-role design and operations profile were implemented.

The retention scheduler test first failed because no scheduler module existed. It now proves immediate execution and cancellation. The real restore oracle then found that PostgreSQL default privileges are database-scoped: a new restore database did not grant the backup role access to `alembic_version`. Restore now explicitly reapplies the same closed grants in the new target, after which original/restored state and API truth matched. The final smoke also proved the operations-profile backup volume is removed.

## Final pinned-environment gates

```text
Python 3.14 Ruff format/check: PASS (57 files)
Python 3.14 Ruff lint: PASS
Python 3.14 strict mypy: PASS (30 source files)
Python 3.14 unit: 116 PASS
Python 3.14 wheel/sdist build: PASS
Python 3.13 unit: 116 PASS
PostgreSQL 18.4 migrations 0001 -> 0002 -> 0003: PASS
PostgreSQL 18.4 integration: 12 PASS
Compose actual API binding: 127.0.0.1:4318
Compose actual PostgreSQL HostConfig.PortBindings: absent
runtime admission: 1 accepted record
backup role: non-superuser/non-createdb/non-createrole, read-only=on, CREATE TABLE rejected
scheduled Raw retention: 1 committed marker
custom pg_dump/pg_restore: PASS
original/restored accepted/projection/retention/migration state: identical SHA-256 within run
restored evidence.query Fact response after removing opaque snapshot token: identical
cleanup: containers, network, data volume, and operations backup volume removed
Wave9 machine candidate: 18 tests PASS; 17 fixtures (5 positive, 7 negative, 5 recovery) + 4 examples PASS
git diff --check: PASS
```

The final Compose run emitted state SHA-256 `8a01452557b5c5b1aff85aa12b12a495919f42d71f7a89113de75ff684b7f1eb` for both the original and restored databases. The value includes run timestamps and is not claimed as cross-run constant; equality inside one committed backup/restore run is the oracle.

## Immutable candidate manifest

Tracked manifest: `evidence-system/release/candidates/iter4-wave10.json`.

- Manifest SHA-256: `28e35e81df4ca7b48f49e166e022eb04bafe0eae9b7347bde091f1c317de1904`.
- Evidence version: `0.1.0`; migration head: `20260826_0003`.
- Payload commit: `cdc540ac53991a2ba243598e2dc2ec9596c695e4`; manifest-only binding commit: `d37f454e2379fed17294c863482f6fcb0c75a97e`.
- Compose SHA-256: `877a2a0ffdb2fa5c6eed2367d31faf6ecd14d84a7177f76208a462138ba34cc4`.
- Wheel: 50071 bytes, `sha256:e4e409561a1eb778bbdf7cefc406cf3242fc5972ef00aeffd3e558d6aeeb08ef`.
- Source distribution: 38032 bytes, `sha256:6660c0a2a05dbc92060764e3b03167adb9eef472cd98588e22af04ce0bc5ccea`.
- Local candidate OCI image ID: `sha256:51f890d1bc6cf75425d3696c88dbabbe5ab2413468eeaa8bb14a10cd23cf8d79`.
- Two independent wheel/sdist builds produced identical sizes and digests; repository release verification passed both times.

The local image ID is explicitly a Wave10 candidate coordinate, not a published GHCR digest. Wave11 must use the automated release path, bind the published registry digest, qualify downloaded assets, and reuse exact RC assets for stable promotion.

## Acceptance and handoff

The #50 API, #51 retention, #52 deployment, and Wave9 machine candidate fixtures all pass together at the pinned set. Raw, accepted identity/provenance, Trace detail, and factual Projection remain independently owned; the scheduled Raw scrub does not change Fact query truth. Observation/Evaluation remain concepts across systems; this deployment implements only Evidence's data-service boundary and no BI or Evaluation behavior.

Wave11 receives the exact Evidence manifest commit `d37f454e2379fed17294c863482f6fcb0c75a97e`, system-contracts commit `6f77510234961149922165666ed0be2d2f82b84b`, superproject pin `7d93175dc150a1a4a876c27a30e2625296ff56c8`, and immutable candidate manifest digest above. It must complete the partial-failure matrix and Contract gates before producing any external tag/release state.
