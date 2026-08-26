# evidence.query contract.gate.1–4 report

Status: `PASS — PRE-PUBLICATION` (2026-08-26)

Contract: `evidence.query@0.1.0`, lifecycle remains `REVIEW_CANDIDATE`.

The Contract owner confirmed that `0.1.0` is the intentional MVP/pre-1.0 revision. Under the clarified lifecycle rule, an exact `0.x` revision may become immutable `FROZEN` after all gates without claiming project-wide 1.0 stability.

This report closes only contract.gate.1–4. It does not claim machine publication, publication binding, `FROZEN`, or implementation conformance. Gate.5/6 and Contract-owner transition approval remain pending the real system-contracts RC.

## Immutable inputs

- Semantic SHA-256: `49a4db21db4ce56ecf4c165246a3355840c3bb521500e644ae4a4234526fce32`.
- Translation SHA-256: `ecd728bb2f89e16e20490aa2aa14bd64277764f65649b4e16ea8bb27f4bdc4da`.
- Wave6 input manifest SHA-256: `e605720c5b225fa9228e2a4b1a8001f3235482ed83dc214e4c766e5caa6e1706`.
- Machine candidate commit/content revision: `6f77510234961149922165666ed0be2d2f82b84b` / `sha256:6d37245fbac11dde2967a7775efb541e00fb4c8b00c80011b91aef007346cfa1`.
- Publication-candidate SHA-256: `97c3e158c18cd7e92da949d82a17b71c5e4bf08d081fef6e5f4b6dcb9c00c6a7`.
- Qualified RC target: `dc8a50e92eebfc35bd706579ff2bf5e9beb57782`; `evidence-query/**` is byte-identical to the machine candidate commit.

## contract.gate.1 — semantic review: PASS

The Contract is large, so the review evidence is disposed through three lenses rather than a single author assertion.

| Lens | Independent challenge and finding | Disposition |
| --- | --- | --- |
| Problem–solution | Wave8 supplied the equal-owner-key/different-resource-kind collision counterexample. The original expiry key could not address independent resources. | Owner-approved minimum reopen introduced exact `(resource_class, resource_kind, owner_key)` without changing public query shape or revision. Requalification passed. |
| Architecture | The first two independent fresh-reader derivations found machine choices still left open: Projection/Trace/relationship shapes, mixed expiry, lifecycle restart, canonical batch framing, HTTP lexical/precedence, exact owner/tombstone rules, summaries, and pinned upstream machine inputs. | Wave6 semantics were reopened twice; every choice moved into the English authority and whole-document Chinese translation. Earlier manifests were superseded. |
| Quality/fail-closed | Independent machine derivation and coordinator adversarial fixture review found missing exact factual-owner tuple validation after the semantic closure. | A negative fixture first demonstrated acceptance of an invalid Delivery-root owner; the validator was tightened for all nine factual tuples and source-bound identities. No semantic change was required. |

The final semantic reopen commit is `df3670739b074038f145a569ca30ea1c9e950e98`. All findings have an explicit disposition in the tracked Wave6/Wave9 reports; none remains deferred to implementation.

## contract.gate.2 — fresh reader: PASS

The final machine representation was derived by independent executor `/root/wave6_reopen_fresh_reader_3`, which did not author the semantic Contract or Evidence implementation. It received the English/Chinese Contract, the exact Wave6 manifest, and the three pinned Observation machine inputs. It derived the schemas, registry, four examples, five positive fixtures, seven negative fixtures, five recovery fixtures, semantic validator, and publication inventory without inventing an unowned semantic choice.

The earlier reader failures are retained as useful evidence rather than erased: they caused the two semantic reopens. Only the third run against manifest `e605720c...` is the passing gate input.

## contract.gate.3 — deterministic verification: PASS

Final clean-tree commands and outcomes:

```text
npm --prefix evidence-query ci: PASS (5 packages, 0 vulnerabilities)
npm --prefix evidence-query test: PASS (18 tests)
npm --prefix evidence-query run check: PASS
  17 fixtures: 5 positive, 7 negative, 5 recovery
  4 examples; exact Wave6 manifest binding
npm --prefix evidence-query run build:publication: PASS
  35 artifacts; content revision sha256:6d37245f...46cfa1
second publication build: byte-identical
publication candidate sha256:97c3e158...00c6a7
workflow-dsl: 27 tests PASS
observation: 27 tests + corpus check PASS
evaluation: 25 tests + example check PASS
delivery-admission: 3 tests PASS
contract release adapter: 4 tests + configuration check PASS
git diff --check: PASS
```

Every JSON schema compiles under its pinned validator, closed vocabularies are executable, the publication candidate inventories every artifact with exact digest, and the unchanged package bytes reproduce the same content revision.

## contract.gate.4 — translation parity: PASS

The Chinese companion is the current whole-document translation of the English authority. A deterministic structure/token check proved:

```text
13 paired stable anchors
12 paired numbered H2 sections
15 paired table groups
3 identical non-companion link targets
69 English closed/critical code tokens all present in zh-CN
semantic and translation bytes match both Wave6 manifest and machine registry bindings
```

The only intentionally different link target is reciprocal: English points to `evidence-query.zh-CN.md`, while Chinese points back to `evidence-query.md`.

## Gate decision and next boundary

contract.gate.1–4 are PASS without changing semantic or machine candidate bytes. The Contract remains `REVIEW_CANDIDATE`. The next permitted external action, only after approval of the Wave12 partial-failure matrix and collision/configuration preflight, is creation of the exact system-contracts RC. Gate.5 and gate.6 remain explicitly pending until that RC is downloaded and independently rebound.
