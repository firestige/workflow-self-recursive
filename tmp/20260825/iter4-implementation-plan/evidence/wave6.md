# Wave6 evidence.query semantic and shared-boundary evidence

Status: `PASS — REVIEW_CANDIDATE` (2026-08-26)

No query HTTP endpoint, Retention scheduler, database migration, expiry mutation, machine Contract representation, publication, or conformance claim was created by Wave6.

## Approved semantic candidate

- Contract: `evidence.query@0.1.0`, lifecycle `REVIEW_CANDIDATE`.
- Owner approval: `firestige`, 2026-08-26.
- English authority: `docs/contracts/evidence-query/evidence-query.md`.
- Whole-document Chinese translation: `docs/contracts/evidence-query/evidence-query.zh-CN.md`.
- Approved superproject commit: `1894a5cd62b2f12c2501b2952c01ea2928c53f95`.
- Final Wave6 handoff commit: `8161fd3d4bf14678259266c5442521d2c0815ec4`.

The candidate closes endpoint/resource shapes, fields and closed enums, truth/availability/expiry, exact C17 zero/absence handling, bounded filters, stable ordering, snapshot pagination, typed errors/read-only negatives, compatibility coordinates, shared query/expiry operations, four lifecycle classes, policy defaults/ranges/configuration source, transaction visibility, and clock authority.

## Shared interface candidate

- Evidence component commit: `bf631ac542b6efda26dd94ba477d76fe366f183c`.
- Interface: `evidence-system/src/wsr_evidence/storage/read_model.py`.
- Contract tests: `evidence-system/tests/unit/test_query_expiry_contract.py`.
- RED: focused test collection failed because Wave6 symbols did not exist.
- GREEN: 21 focused tests PASS.
- Python 3.14 full non-container gate: Ruff format/lint, strict mypy, 59 unit tests, wheel and sdist PASS.
- Python 3.13 full non-container gate: Ruff format/lint, strict mypy, 59 unit tests, wheel and sdist PASS.

The seam adds immutable values and Protocols only. It does not connect a database, expose an endpoint, change the Wave3 core schema, or perform expiry. Accepted provenance cannot be planned for expiry; truth combinations cannot silently rewrite completeness; expiry batches have deterministic canonical identities and exact result partitions.

## Immutable downstream manifest

- Path: `docs/contracts/evidence-query/wave6-input-manifest.json`.
- Manifest SHA-256: `2be7eac71854b0c37abec240e63a8ec4f97be44ee7dd9990a2714eb106b72a9d`.
- Semantic document SHA-256: `2959c44a9175e60303866e64116fc09086974fc26cf7cac1cb2e0a49a1ee8ba5`.
- Translation SHA-256: `2b1bb1263c826104cc8e108f183f2f9a8f3b0c5191caaff1974319570e08e07d`.
- Shared interface SHA-256: `7afdaaa620b9c258c246ce3772001c95271eb0d444cb1121c37dff6b3918a923`.
- Interface tests SHA-256: `08f1dbb2005a0ae12866d992eebdffb02413a88b59c0bc8cf27ed8d3d2c24b67`.
- Truth-table SHA-256: `fdfcead8d8e7f7362153bba98c205cb70148ec371eefe384a6cde3b4bb852d67`.
- Lifecycle-defaults SHA-256: `22060a33f8975d0e6184d932587f65c7f80235f2f4beb2aa1aaf4bdac7a96a1f`.

All six content digests were independently recomputed from the exact Git objects named by the manifest and matched. Wave7, Wave8, and Wave9 must bind the exact manifest digest and coordinates; a mismatch returns to Wave6 owner review.

## Review status and handoff

Author-side reader testing and deterministic EN/ZH structure/token parity passed: 12 paired numbered sections, 14 paired table groups, identical anchors, and matching critical enums/defaults/errors. This is not an independent contract.gate.1 or contract.gate.2 claim. Wave9 owns independent machine derivation/fresh-reader evidence and the remaining machine/review gates; Wave11 owns publication/FROZEN closure.

Issue #50 remains OPEN at `https://github.com/firestige/workflow-self-recursive/issues/50`, as required. Wave7 may implement only a fast-path candidate against the exact manifest; it cannot claim FROZEN conformance or change the semantic candidate.

## Approved expiry-owner identity reopen — 2026-08-26

Wave8 produced a valid collision counterexample: within `FACTUAL_PROJECTION`, `EVENT_CONTRIBUTION`, `FINDING_ASSERTION`, and `ROLE_LINEAGE` all admit two-scalar Projection owner keys whose scalar domains are not disjoint. The original `read_expiry(resource_class, owner_key, snapshot)` and bare-owner-key `ExpiryBatch` could not independently address two different resource kinds with an equal owner key.

Owner `firestige` approved the minimum reopen. The internal expiry identity is now exact `(resource_class, resource_kind, owner_key)` through a closed `ExpiryOwner` value. Raw uses `RAW_DEBUG`; Trace uses public `NODE`/`PARENT_EDGE`/`LINK`; factual resources use the nine public Fact kinds. Internal projection-effect names are prohibited port values. Public Query JSON, Contract revision `0.1.0`, read-model/policy revisions, truth table, lifecycle classes, TTL defaults/ranges, filters, pagination, and error semantics are unchanged.

- Approved semantic commit: `e228144703800b27e7c66aa738bd7e20de46d031`.
- Shared-interface component commit: `291aed453b49f34b66970581e0bdc7d303229e5c`.
- Wave6 handoff/repin commit: `7578919`.
- Replacement manifest SHA-256: `4d048b0a0a7b66fd7645a96f8bc3013ce1a695b22ad5c8b48eb6cecbe6b2e55f`.
- Semantic SHA-256: `9fc366c6e70ff250dcc8bd1267fecb999e4ad4c0389097487159a129395cdd3b`.
- Translation SHA-256: `2966dd2028d71c131a21e06b67f9d75bd86b2e159e6ecb8ea1d78822f239ae2a`.
- Shared-interface SHA-256: `341f2b9fb9b111180b78452ef8d63b5284e2597a905c9625324c0662515f8814`.
- Shared-interface test SHA-256: `d88d7c07d3495fb818f15d3ae70c6995b057f1cd8a13e608ee281694e287212c`.
- Truth/default section digests remain `fdfcead...` and `22060a...` respectively.
- Focused shared-interface tests: 22 PASS, including equal-owner-key/different-kind independence.
- Author-side reader questions for exact identity, equal-key handling, allowed kind vocabulary, batch ordering/digest, Raw kind, and public-API impact all resolve without inference; 12 EN/ZH anchors and numbered sections remain paired. Wave9 still owns independent fresh-reader gates.

The prior manifest digest is superseded and is no longer a valid downstream binding. Wave7 was requalified and Wave8 continued only after binding the replacement manifest.

## Approved Wave9 machine-semantics reopen — final closure 2026-08-26

Owner `firestige` approved reopening Wave6 after the first Wave9 fresh-reader proved that the Iter1 conceptual contract remained sound but Wave6 had left machine-level design choices to Wave9. The reopen preserves `evidence.query@0.1.0`, Observation Profile `1.0.0`, read-model/policy revisions `1.0.0`, all four lifecycle classes, and the Observation/Evaluation concept versus Evidence/BI implementation boundary.

The closed design now includes the nine-kind Fact projection matrix; typed relationship endpoints; exact Trace node/edge/summary shapes and mixed expiry; factual-only `MODEL_ATTRIBUTION` versus node-local Trace copies; exact filters, timestamps, Accept grammar, cursor/error precedence; lifecycle base and restart-policy behavior; versioned expiry-batch bytes including TTL; exact Trace/Raw/Fact expiry owners; duplicate/conflicting LINK identity; expired relationship tombstones; exact compatibility pairs; and a same-snapshot Trace-summary port. The manifest additionally binds the published Observation Profile registry/schema/validator as normative machine inputs and publishes the exact section-digest byte-range rule.

Final immutable coordinates:

- Contract revision/status: `evidence.query@0.1.0`, `REVIEW_CANDIDATE`.
- Approved semantic superproject commit: `df3670739b074038f145a569ca30ea1c9e950e98`.
- Shared-boundary component commit: `0a1eef8bc77d65aae4a923df6b2fd17e81aba28d`.
- Evidence manifest-binding commit: `f9bfd3776057645e6cbebb7ac685a82d48ddbdb4`.
- Final superproject repin: `2823ec462debb754c8470018429c5fc5c3da9259`.
- Replacement manifest SHA-256: `e605720c5b225fa9228e2a4b1a8001f3235482ed83dc214e4c766e5caa6e1706`.
- Semantic / translation SHA-256: `49a4db21db4ce56ecf4c165246a3355840c3bb521500e644ae4a4234526fce32` / `ecd728bb2f89e16e20490aa2aa14bd64277764f65649b4e16ea8bb27f4bdc4da`.
- Shared interface / test SHA-256: `0cf4ccc67ce65b9c60c8ff7974c6a776b24aacb42d84eae6f097b4cd039ffedd` / `56f32315db729e127aac6a6af1842353438ed2dd2a05c9b4d8e0317477901d29`.
- Truth/default section SHA-256: `59026c78e74d534755b04ca093602f283df4064fe7f12231b7f4f6dfd1df3304` / `fbdcd4f98a53cec84c3d686a0b85f66e357521495123cb878969ca25335f1fd8`.
- Upstream machine component: `system-contracts@74c5eb38b91fa774662dbfbfc02536bf97c7f188`; all three file digests match the manifest.

Requalification gates: Python 3.14 Ruff/strict mypy/build plus 112 unit PASS; Python 3.13 112 unit PASS; PostgreSQL 18.4 migrations `0001→0002→0003` plus 12 integration PASS. No Wave3 core migration, dependency, Metric formula, Evaluation computation, remote database boundary, or published conformance status changed.

Three fresh-reader rounds were used. The first two returned concrete design blockers and drove the minimum reopen. The third reader received only the English/Chinese Contract, manifest, and its three exact upstream machine files and returned `PASS`: schemas, registries, examples, positive/negative/recovery fixtures, and validator can now be derived without invention. All earlier Wave6 manifest digests are superseded; only `e605720c...` is a valid Wave7/8/9 input.
