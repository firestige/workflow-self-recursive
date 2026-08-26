# Wave12 evidence.query freeze-transition candidate

Status: `APPLIED — CONTRACT.GATE.1–6 AND A2 OWNER APPROVAL PASS` (2026-08-27)

This transition authority was prepared before the RC and completed only after the downloaded RC passed exact verification and the owner approved A2. Application inspection found that changing only the lifecycle cell would leave three stale status statements (`planned` machine representation, `none` publication binding, and the pre-FROZEN conformance paragraph). Those publication-status fields were closed together; no numbered normative section, API shape, vocabulary, default, identity, or behavior changed.

## Fixed coordinate and candidate

- Contract: `evidence.query@0.1.0`.
- Contract RC: `evidence-query-0.1.0-rc.1`.
- Candidate semantic SHA-256: `49a4db21db4ce56ecf4c165246a3355840c3bb521500e644ae4a4234526fce32`.
- Candidate translation SHA-256: `ecd728bb2f89e16e20490aa2aa14bd64277764f65649b4e16ea8bb27f4bdc4da`.
- Candidate machine content revision: `sha256:6d37245fbac11dde2967a7775efb541e00fb4c8b00c80011b91aef007346cfa1`.
- Publication-candidate SHA-256: `97c3e158c18cd7e92da949d82a17b71c5e4bf08d081fef6e5f4b6dcb9c00c6a7`.

## Pre-generated semantic bytes

The final semantic-document mutation set is limited to the lifecycle cell plus the machine-representation row, publication-binding row, and adjacent lifecycle/conformance status paragraph in each companion. No numbered normative section, anchor, revision, API literal, vocabulary, default, or behavior changed.

```diff
-| Lifecycle status | `REVIEW_CANDIDATE` |
+| Lifecycle status | `FROZEN` |
```

Applying the complete status-metadata mutation set described above produces:

| Final document | Required SHA-256 |
| --- | --- |
| `docs/contracts/evidence-query/evidence-query.md` | `ce13b76cb3c2737e8243c97de880574060a61c05a6a7a67182a2804c04a2a8ef` |
| `docs/contracts/evidence-query/evidence-query.zh-CN.md` | `d68b9f250bd608f0c6d46ace53bfa9f99241fe957f0184d320ecbceadd44ed3b` |

Before commit, the operator reproduced both digests from the clean approved base and rejected any additional normative semantic diff.

## Pre-generated Contract register rows

The English and Chinese `docs/contracts/README*` registers each receive one Evidence Query row. The final row must state `FROZEN`, `evidence.query@0.1.0`, `VALIDATOR_ONLY`, and link the exact publication record. It must not claim production or cross-implementation conformance.

```text
Evidence Query | evidence-query/evidence-query.md | FROZEN | published evidence.query@0.1.0; VALIDATOR_ONLY; publication record <FINAL_PUBLICATION_RECORD_PATH>
```

The language-specific prose may differ, but the coordinate, lifecycle, claim and record target must be identical.

## Publication-binding candidate

The final machine record is `system-contracts/evidence-query/publication/publication-record-0.1.0.json`, validated by `schemas/publication-record-0.1.0.schema.json`. It must be generated atomically with the registry/README/version-policy transition and contain these fail-closed fields:

```json
{
  "record_version": "0.1.0",
  "contract_revision": "evidence.query@0.1.0",
  "status": "FROZEN",
  "published": true,
  "conformance_claim": "VALIDATOR_ONLY",
  "semantic": {
    "path": "docs/contracts/evidence-query/evidence-query.md",
    "sha256": "ce13b76cb3c2737e8243c97de880574060a61c05a6a7a67182a2804c04a2a8ef"
  },
  "translation": {
    "path": "docs/contracts/evidence-query/evidence-query.zh-CN.md",
    "sha256": "d68b9f250bd608f0c6d46ace53bfa9f99241fe957f0184d320ecbceadd44ed3b"
  },
  "candidate_publication": {
    "repository": "firestige/system-contracts",
    "tag": "evidence-query-0.1.0-rc.1",
    "url": "https://github.com/firestige/system-contracts/releases/tag/evidence-query-0.1.0-rc.1",
    "target_commit": "dc8a50e92eebfc35bd706579ff2bf5e9beb57782",
    "release_metadata_sha256": "f869e51c3974f038c1f51c4c98e2110cfa90c97ed74e89fc837f052bc7ac41eb",
    "publication_candidate_sha256": "97c3e158c18cd7e92da949d82a17b71c5e4bf08d081fef6e5f4b6dcb9c00c6a7",
    "qualification_sha256": "bda43993fdc5197a3911e159a4ea47ac5020c1cb1ede095838519559a266cadc"
  },
  "gates": {
    "contract.gate.1": "PASS",
    "contract.gate.2": "PASS",
    "contract.gate.3": "PASS",
    "contract.gate.4": "PASS",
    "contract.gate.5": "PASS_RC_TAG_AND_8_ASSET_MANIFEST",
    "contract.gate.6": "PASS_2_FINAL_SEMANTIC_35_MACHINE_ARTIFACT_BINDING",
    "owner_approval": "https://github.com/firestige/workflow-self-recursive/issues/50#issuecomment-5427870271"
  }
}
```

The actual record inventories 38 final machine artifacts and derives content revision `sha256:4e904c982504c8c23302c30b1d4f8fcdb9f42693b9bcbafb3c865865eba159d0`; its own SHA-256 is `feb0186da48661d2663b03d20e536f470b591ea22f21a34a4ca99bfcc33204e9`. The registry changes from `REVIEW_CANDIDATE` to `FROZEN`, retains the immutable Wave6 candidate manifest binding, adds the final semantic/translation publication binding, and points to this publication record. The candidate record remains immutable history and is not overwritten.

## Apply boundary

The transition was applied after the RC target and all downloaded assets matched, gate.5 and gate.6 were recorded as PASS, and `firestige` approved A2 at the URL above. The machine transition commit is `a3f6d7ca8a3e08e89af4bc3ecea34524f5094bd5`; the paired superproject checkpoint records the final semantic bytes and exact gitlink.
