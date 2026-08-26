# Wave9 evidence.query machine candidate evidence

Status: `PASS — REVIEW_CANDIDATE` (2026-08-26)

This wave creates the independently derived machine representation for `evidence.query@0.1.0`. It does not publish or freeze the Contract, claim implementation conformance, or approve a production release. Those remain Wave10/11 gates.

## Independent derivation and immutable inputs

- Executor: fresh-reader subagent `/root/wave6_reopen_fresh_reader_3`; it did not author the Wave6 semantic contract or Evidence product implementation.
- Executor scope: only `system-contracts/evidence-query/**`; no semantic document or Evidence product-code edit.
- Authoritative semantic input: `docs/contracts/evidence-query/evidence-query.md` plus its full zh-CN translation.
- Wave6 input manifest SHA-256: `e605720c5b225fa9228e2a4b1a8001f3235482ed83dc214e4c766e5caa6e1706`.
- Semantic SHA-256: `49a4db21db4ce56ecf4c165246a3355840c3bb521500e644ae4a4234526fce32`.
- Translation SHA-256: `ecd728bb2f89e16e20490aa2aa14bd64277764f65649b4e16ea8bb27f4bdc4da`.
- Contract/read-model/Profile coordinates: `evidence.query@0.1.0`, read model `1.0.0`, Observation Profile `1.0.0`.
- Pinned Observation machine component input: `74c5eb38b91fa774662dbfbfc02536bf97c7f188` with exact registry/schema/validator digests from the Wave6 manifest.
- System-contracts checkpoint: `6f77510234961149922165666ed0be2d2f82b84b`.
- Superproject pin checkpoint: `65f6e4deaea37e43a5d6242bd0df1c1e57cb9abf`.

## Candidate surface

The new `system-contracts/evidence-query/` package contains:

- one closed registry for routes, enums, Projection ownership, relationships, compatibility dimensions, expiry owners, limits, and retention defaults;
- public response and internal read-model/expiry JSON schemas, plus fixture and publication-candidate schemas;
- four closed examples: Fact response, Trace response, ExpiryRecord, and ExpiryBatch;
- 17 executable fixtures: 5 positive, 7 negative, and 5 recovery;
- a semantic validator, deterministic corpus checker, tests, and deterministic publication-inventory builder;
- English/Chinese operator README and `VERSION_POLICY.md`.

The candidate remains `REVIEW_CANDIDATE`, `published=false`, `conformance_claim=VALIDATOR_ONLY`, and `schema_only_conformance=false`.

## TDD and coordinator review

The fresh reader first proved a missing validator as RED, then used further RED cases to close compatibility ordering, Trace owner hex shapes, unavailable/not-applicable measurement removal, MODEL/LINK closure, empty Accept handling, and Event source/C09 identity.

Coordinator review found one additional machine-only omission: factual expiry owners were checked only by tuple arity even though Wave6 fixes exact tuple types and source-bound trace coordinates. A new negative fixture first failed because `DELIVERY_ROOT_BINDING:["not-a-trace-id"]` was accepted. The validator was then tightened for all nine factual owner tuples, Raw/Trace source binding, expiry markers, and expired public Facts. This required no Wave6 semantic change and introduced no new dependency.

## Final deterministic gates

```text
npm ci: PASS; 5 packages installed; 0 vulnerabilities
npm test: PASS; 18 tests, 0 failures
npm run check: PASS; 17 fixtures (5 positive, 7 negative, 5 recovery), 4 examples, exact manifest binding
git diff --check: PASS
publication build #1: 35 artifacts; content revision sha256:6d37245fbac11dde2967a7775efb541e00fb4c8b00c80011b91aef007346cfa1
publication build #2: byte-identical
publication candidate file SHA-256: 97c3e158c18cd7e92da949d82a17b71c5e4bf08d081fef6e5f4b6dcb9c00c6a7
```

The closed executable surface covers filters, cursor failure/recovery, error precedence and Accept grammar, completeness/availability/expiry truth, compatibility membership/order, Projection/relationship tuples, NODE/PARENT_EDGE/LINK identity, duplicate/conflicting LINK metadata, same-snapshot summaries, exact expiry owners, batch selection/idempotency framing, manifest binding, and publication inventory integrity.

## Fresh-reader disposition and handoff

The independent executor reported that the approved Wave6 semantic documents and pinned upstream machine inputs were sufficient to derive the representation without guessing. No semantic ambiguity, revision mismatch, lifecycle incompatibility, or need to change the shared publication structure was found. The coordinator's factual-owner finding was a Wave9 encoding omission caught before checkpoint, not a reopened Wave6 Contract gap.

Wave10 must consume the exact pinned set: Evidence `f9bfd3776057645e6cbebb7ac685a82d48ddbdb4`, system-contracts `6f77510234961149922165666ed0be2d2f82b84b`, and superproject `65f6e4deaea37e43a5d6242bd0df1c1e57cb9abf`. Wave11 alone owns real publication, owner publication approval, lifecycle transition to `FROZEN`, and the final publication binding.
