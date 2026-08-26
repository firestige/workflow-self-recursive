# Wave12 evidence.query freeze-transition candidate

Status: `PRE-GENERATED — DO NOT APPLY BEFORE CONTRACT.GATE.5/6 AND OWNER APPROVAL` (2026-08-26)

This is the exact transition authority prepared before any RC exists. It does not declare `FROZEN` and does not authorize publication. Unknown external identities remain typed placeholders and must be filled only from the downloaded, independently verified Contract RC.

## Fixed coordinate and candidate

- Contract: `evidence.query@0.1.0`.
- Contract RC: `evidence-query-0.1.0-rc.1`.
- Candidate semantic SHA-256: `49a4db21db4ce56ecf4c165246a3355840c3bb521500e644ae4a4234526fce32`.
- Candidate translation SHA-256: `ecd728bb2f89e16e20490aa2aa14bd64277764f65649b4e16ea8bb27f4bdc4da`.
- Candidate machine content revision: `sha256:6d37245fbac11dde2967a7775efb541e00fb4c8b00c80011b91aef007346cfa1`.
- Publication-candidate SHA-256: `97c3e158c18cd7e92da949d82a17b71c5e4bf08d081fef6e5f4b6dcb9c00c6a7`.

## Pre-generated semantic bytes

The only permitted semantic-document mutation is the single lifecycle cell below in each companion. No prose, anchor, link, revision, API literal, or whitespace may change in the owner transition.

```diff
-| Lifecycle status | `REVIEW_CANDIDATE` |
+| Lifecycle status | `FROZEN` |
```

Applying exactly that substitution to the current tracked documents produces:

| Final document | Required SHA-256 |
| --- | --- |
| `docs/contracts/evidence-query/evidence-query.md` | `bf39447392fe80fe3531ac823a3ae403591c39c47c20c65b9bd62d3ff333f4cc` |
| `docs/contracts/evidence-query/evidence-query.zh-CN.md` | `7ab642b9e9597cdf6eacfa70e062b54d7d1ba27de464a8d84ca8a8c1c3cebe15` |

Before commit, the operator must reproduce both digests from the clean approved base and reject any additional semantic diff.

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
    "sha256": "bf39447392fe80fe3531ac823a3ae403591c39c47c20c65b9bd62d3ff333f4cc"
  },
  "translation": {
    "path": "docs/contracts/evidence-query/evidence-query.zh-CN.md",
    "sha256": "7ab642b9e9597cdf6eacfa70e062b54d7d1ba27de464a8d84ca8a8c1c3cebe15"
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
    "owner_approval": "<OWNER_APPROVAL_URL>"
  }
}
```

The actual record also inventories every final machine artifact and derives its content revision deterministically. The registry changes from `REVIEW_CANDIDATE` to `FROZEN`, replaces its candidate semantic/translation digests with the two final digests above, and points to this publication record. The candidate record remains immutable history and is not overwritten.

## Apply boundary

The transition may be applied only when the RC target and all downloaded assets match, gate.5 and gate.6 are recorded as PASS, and `firestige` has approved A2. Any different semantic digest, RC target, asset digest, record path, or conformance claim stops the transition and leaves the Contract `REVIEW_CANDIDATE`.
