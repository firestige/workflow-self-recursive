# Issue 170 Wave 4 cross-repository qualification

Status: **GREEN**

## Immutable candidate

- Superproject implementation: `e39ddfa4c45e3c5f711d93cdc816bde4f4957a8f`
- Provider implementation: `45d6ec33148fd81520db203ad047e8af220c3ad2`
- Provider evidence: `4122e299f5a765b3af7e7d8a80550b292980bebe`
- Consumer implementation: `80c365aa780d0ba8f224b87fb8f34dddd0ae9a3a`
- Consumer evidence: `aa505b41d2f941bf302245077131c79e9f36c80d`
- Package: `wsr-ui-core@0.1.0-rc.0`
- Registry integrity: `sha512-jHK1jASNAw0WqNMrzgOK9KWZls/DiA7q8J2shE96/Gatb2mTw+lzG7UY+8rWuh1PWfyTFuvqnS3u/hVfyCrOBw==`
- Benchmark result SHA-256: `cc568d25a5eccf785fac4907b8b80448b03fa62cd141d53e6792d57dd4ac3da9`

`candidate.json` and `provenance.json` bind the superproject, provider,
consumer, package lock/integrity, benchmark manifest/result, release candidate,
and runtime qualification to this exact candidate.

## Qualification matrix

| Matrix | Result | Evidence |
| --- | --- | --- |
| Positive | PASS | Clean provider and consumer install/test/build/pack; React 18 consumer; package-only resolution |
| Negative policy | PASS | 16/16 policy cases, including missing Panel, JSON fallback, benchmark drift, runtime renderer, raw evidence, provenance, and superproject identity |
| Benchmark | PASS | Three independent fixed-runner runs for all fixtures; 15 raw traces; static SVG decision |
| Real Web | PASS | Clean DSH profile and isolated product acceptance; Studio tasks `task-a` / `task-b`; terminal fixture `task-delivery-completed`; zero browser errors |

`tests.json` records 32 commands: 28 successful commands and four retained,
expected RED/precondition failures. The failures are one benchmark budget
failure, one missing-submodule unit precondition, and two product-start failures
that exposed the missing `system-contracts` build context. Every failure has a
successful complete rerun in the same command ledger.

The benchmark RED is retained in `benchmark/index.json`; the qualifying rerun
contains all 15 raw trace names and SHA-256 digests. Raw trace archives remain at
the indexed provider result directories. `screenshots/index.json` binds the four
real-Harness screenshots. `network-diff.json` proves no Delivery control-plane
path changed and records zero additional requests.

## Reproduction

The exact commands, working directories, timestamps, exit codes, and output
digests are in `commands.ndjson`. The final policy and collector commands are:

```sh
node --test qualification/iter6/issue-170/cross-repository-policy.test.mjs
WSR_SUPERPROJECT_CANDIDATE=e39ddfa4c45e3c5f711d93cdc816bde4f4957a8f \
  node qualification/iter6/issue-170/collect-cross-repository.mjs
```

The isolated product acceptance also verifies the exact pinned Execution,
Evidence, Evolution, and `system-contracts` submodules, starts the composed
services, passes health and workspace registration, and removes its isolated
profile, containers, volume, and temporary state during cleanup.
