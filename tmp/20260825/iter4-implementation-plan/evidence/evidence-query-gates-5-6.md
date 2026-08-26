# evidence.query contract.gate.5–6 report

Status: `PASS — A2 OWNER TRANSITION APPLIED` (2026-08-27)

Contract: `evidence.query@0.1.0`; authoritative lifecycle is now `FROZEN`.

## RC identity

- Actions run: `https://github.com/firestige/system-contracts/actions/runs/32986502152` — PASS.
- Prerelease: `https://github.com/firestige/system-contracts/releases/tag/evidence-query-0.1.0-rc.1`.
- Tag target: `dc8a50e92eebfc35bd706579ff2bf5e9beb57782` (lightweight commit ref).
- Release metadata SHA-256: `f869e51c3974f038c1f51c4c98e2110cfa90c97ed74e89fc837f052bc7ac41eb`.
- Qualification SHA-256: `bda43993fdc5197a3911e159a4ea47ac5020c1cb1ede095838519559a266cadc`.
- Evidence Query publication candidate SHA-256: `97c3e158c18cd7e92da949d82a17b71c5e4bf08d081fef6e5f4b6dcb9c00c6a7`.

The qualification record binds the same candidate tag and target commit and binds release metadata as `sha256:f869e51c...41eb`.

## contract.gate.5 — machine representation release: PASS

The RC tag resolves the complete system-contracts tree at the exact commit above. Its Release metadata inventories eight immutable publication assets; all eight downloaded bytes match their manifest digests. The Evidence Query asset byte-equals the clean-tag checkout's deterministic `publication-candidate-0.1.0.json`.

In a clean superproject checkout at semantic authority `4d9930ac62f67ff8f7db1d957b554d45f3bca51d`, with system-contracts checked out at the RC target and workflow-package at `d9e7b9f7f1013aef9d4a23fefe65563ec77e5af0`:

```text
npm ci: PASS, 0 vulnerabilities
npm test: PASS, 18 tests
npm run check: PASS, 17 fixtures and 4 examples
npm run build:publication: PASS and byte-identical to downloaded RC asset
machine content revision: sha256:6d37245fbac11dde2967a7775efb541e00fb4c8b00c80011b91aef007346cfa1
```

## contract.gate.6 — exact publication binding: PASS

The clean checkout reproduced the current candidate bindings:

- semantic SHA-256 `49a4db21db4ce56ecf4c165246a3355840c3bb521500e644ae4a4234526fce32`;
- translation SHA-256 `ecd728bb2f89e16e20490aa2aa14bd64277764f65649b4e16ea8bb27f4bdc4da`;
- machine content revision `sha256:6d37245fbac11dde2967a7775efb541e00fb4c8b00c80011b91aef007346cfa1`;
- publication candidate SHA-256 `97c3e158c18cd7e92da949d82a17b71c5e4bf08d081fef6e5f4b6dcb9c00c6a7`.

Applying only the pre-generated lifecycle-cell transition produces final authoritative bytes:

- FROZEN English SHA-256 `ce13b76cb3c2737e8243c97de880574060a61c05a6a7a67182a2804c04a2a8ef`;
- FROZEN Chinese SHA-256 `d68b9f250bd608f0c6d46ace53bfa9f99241fe957f0184d320ecbceadd44ed3b`.

The final publication record records those two final semantic digests together with the exact RC URL, tag target, release metadata, qualification, candidate machine content revision, 35-artifact candidate identity, 38-artifact final inventory and gate results. Its final content revision is `sha256:4e904c982504c8c23302c30b1d4f8fcdb9f42693b9bcbafb3c865865eba159d0`; record SHA-256 is `feb0186da48661d2663b03d20e536f470b591ea22f21a34a4ca99bfcc33204e9`. No prior resolving revision exists, so the lifecycle's legacy-isolation marker is not applicable.

## Failed attempts retained

Three pre-object attempts are retained rather than hidden:

| Run | Failure boundary | Durable publication object |
| --- | --- | --- |
| `32986212915` | acceptance lacked semantic-authority workspace | none |
| `32986303741` | acceptance lacked pinned workflow-package consumer | none |
| `32986391381` | Release command resolved the superproject origin and was denied 403 | none; tag lookup remained 404 |

Each correction was release-only, test-first, fast-forwarded the same immutable request branch, and occurred before any tag/Release existed. The passing workflow scopes every Release command to `$GITHUB_REPOSITORY` and keeps the App credential out of candidate publication.

## Decision boundary

Contract gates 1–6 and A2 owner approval now pass. The semantic companions, bilingual register, machine registry and final publication record transitioned together on the Iter4 feature lines. Evidence may now make a claim only against this exact revision and no stronger than `VALIDATOR_ONLY`; product RC, merge/repin and stable publication remain later Wave12 gates.
