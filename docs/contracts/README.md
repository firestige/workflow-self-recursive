# Contracts

English | [中文](README.zh-CN.md)

`docs/contracts/` holds the semantic specification documents of every workflow-self-recursive Contract. Each Contract is managed under one standard lifecycle defined in [Contract Lifecycle Management](contract-lifecycle.md); its normative machine representation (schemas, registries, fixtures, validators) lives in the `system-contracts/` submodule under the matching name.

## How Contracts are managed

- **Two paired halves.** A Contract is a semantic document here plus a machine representation in `system-contracts/`; publication is pairwise and no conformance claim is possible before both are released (see [Contract Lifecycle Management](contract-lifecycle.md) §2).
- **One state machine.** Every Contract header carries a `Lifecycle status`: `DRAFTING → REVIEW_CANDIDATE → FROZEN → DEPRECATED → SUPERSEDED`. Only `FROZEN` admits physical-conformance claims (§3–§5).
- **Evidence-gated transition.** Draft-to-published requires semantic review, fresh reader, deterministic verification, translation parity, machine-representation release, and a publication binding (§4).
- **English authoritative.** Semantic documents are English-authoritative; each has a `zh-CN` non-normative tracking companion replaced wholesale on English change.
- **Explicit obligations.** Releasing a machine representation is a tracked obligation (`concept.obligation.001` pattern); downstream consumers track gaps against exact revisions (`runner.open-work.003.x` pattern) (§8).

## Current register

| Contract | Semantic document | Lifecycle status | Revision |
| --- | --- | --- | --- |
| Observation Catalog | [observation/observation-catalog.md](observation/observation-catalog.md) | `FROZEN` | published `observation-contract@1.0.2`; immutable `1.0.0`/`1.0.1` resolving; wire Profile `1.0.0`; `VALIDATOR_ONLY` |
| OTel Observation Profile | [observation/otel-observation-profile.md](observation/otel-observation-profile.md) | `FROZEN` | Contract `1.0.1`, wire profile `1.0.0`; `VALIDATOR_ONLY` |
| Execution–Evidence Interaction Contract | [execution-evidence/interaction-contract.md](execution-evidence/interaction-contract.md) | `FROZEN` | Contract `1.0.1`, interaction schema `1.0.0`; `VALIDATOR_ONLY` |
| Evidence Query | [evidence-query/evidence-query.md](evidence-query/evidence-query.md) | `FROZEN` | published `evidence.query@0.1.0`; `VALIDATOR_ONLY`; [publication record](../../system-contracts/evidence-query/publication/publication-record-0.1.0.json) |
| Metric Catalog | [evaluation/metric-catalog.md](evaluation/metric-catalog.md) | `FROZEN` | published `agentops.evaluation.metric-catalog@1.0.0`; `VALIDATOR_ONLY` |
| Workflow Definition DSL | [workflow/workflow-definition-dsl.md](workflow/workflow-definition-dsl.md) | `FROZEN` | published `agentops.workflow-dsl@1.0.0`; `VALIDATOR_ONLY` |

Status values are the normalized mapping per [Contract Lifecycle Management](contract-lifecycle.md) §9; the documents' own headers remain the primary source.

## Authoring

New Contract authors follow [Contract Lifecycle Management](contract-lifecycle.md) §10: draft under `docs/contracts/<contract>/` with the header template, declare semantic closure, run gates contract.gate.1–contract.gate.6, and release the paired machine representation under `system-contracts/<contract>/`.
