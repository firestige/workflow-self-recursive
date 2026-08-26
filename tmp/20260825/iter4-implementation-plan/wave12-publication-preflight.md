# Wave12 publication preflight

Status: `PASS — A1 OWNER APPROVAL PENDING` (2026-08-26)

No `release/next` branch, RC tag, GitHub Release, npm coordinate, or GHCR candidate was created by this preflight.

## First external request

The first external mutation will be an exact push of system-contracts commit `750f0d41e3ba5654000a2543065724247486ca6b` to `refs/heads/release/next`. That commit is already preserved on `iter4/implementation`; its tracked `release/request.json` is:

```json
{
  "candidate_tag": "evidence-query-0.1.0-rc.1"
}
```

The candidate workflow must run at that exact SHA. A different branch target or request byte stops publication.

## Configuration and collision checks

| Check | Result |
| --- | --- |
| system-contracts Actions variable | `WSR_RELEASE_APP_ID=4716644` present |
| system-contracts Actions secret | `WSR_RELEASE_APP_PRIVATE_KEY` present by name |
| execution-system Actions variable/secret | same approved ID and secret name present |
| evidence-system Actions variable/secret | same approved ID and secret name present |
| Contract `release/next` | absent before A1 |
| Contract tag/Release `evidence-query-0.1.0-rc.1` | absent before A1 |
| Execution Release `0.1.3-rc.1` | absent before A1 |
| Evidence Release `0.1.0-rc.1` | absent before A1 |
| npm `wsr-execution@0.1.3` | absent before A1 |
| npm `wsr-dsh-intake@0.1.3` | absent before A1 |
| GHCR `firestige/wsr-evidence` container package | absent before A1 |

The App secret is not read or exposed. Candidate workflows use only repository `GITHUB_TOKEN`; the App token remains restricted to later final stable GitHub Release operations.

## Local gates

- Contract gate.1–4: PASS in `evidence/evidence-query-gates-1-4.md`.
- Partial-failure matrix: prepared in `wave12-partial-failure-matrix.md`; approval A1 pending.
- Freeze transition: pre-generated in `wave12-contract-freeze-transition.md`; gate.5/6 and approval A2 pending.
- system-contracts release adapter: 4/4 tests and configuration PASS at the exact request commit.
- Execution: 568/568 tests PASS; coverage PASS at statements 90.01%, branches 85.64%, functions 94.26%, lines 95.32%; build/generated/changelog/configuration/matrix/coordinate checks PASS.
- Evidence: Ruff, strict mypy, 116 tests, wheel and sdist build PASS; release recovery tests 10/10 PASS.
- Wave11 Execution tgz digests remain `7c5ab0c061d2cc9f6e3d486e885ee2072870eb09aa0284f0285547fb828d3ca0` and `d518a687c32077aa8ced55a446da4c744461d3bb58d85aa705638073979618b8`.

## Approval boundary

A1 authorizes only starting the immutable RC sequence under the state matrix. It does not pre-approve the Contract `FROZEN` transition, component squash/repin, npm publication, GHCR stable tag, or stable GitHub Releases; those remain A2 and A3 boundaries.
