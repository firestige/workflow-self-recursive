# Recursive Semantic Compilation

[中文](recursive-semantic-compilation.zh-CN.md)

> **Status:** The owner has accepted recursive semantic compilation as a foundational documentation principle in [#159](https://github.com/firestige/workflow-self-recursive/issues/159). The detailed mappings in this document remain a working architecture alignment: they organize existing product principles but do not by themselves change a published Contract, prove conformance, or claim a new runtime capability. English is the semantic source. The Chinese document is a tracking companion.

## 1. Purpose

workflow-self-recursive already follows a common structure across Workflow composition, Execution, Runner, Evidence, and Evolution, but that structure has mostly been expressed as separate invariants: exact binding, immutable Snapshots, bounded Planners, typed results, Runner authority, fail-closed compilation, non-controlling Evidence, replaceable substrates, and versioned Evolution.

This note gives those principles one foundational model:

> **LLMs lift unstructured intent, context, and evidence into typed semantic representations. Deterministic systems validate, bind, lower, execute, and admit those semantics into authoritative runtime state. Committed execution emits bounded facts that are retained as independent Evidence and may guide synthesis and qualification of the next Workflow version.**

In short:

> **Lift semantics, push determinism downward, and let evidence drive recursion across versions.**

This model is called **recursive semantic compilation**.

It is a design-review lens. Existing Contracts and owner invariants remain the conformance surfaces. A compiler-shaped type, rename, or refactor requires a separate accepted proposal tied to a concrete representation or authority mismatch.

## 2. Semantic compilation

An LLM is most valuable where the system must interpret meaning that cannot be exhaustively encoded as fixed rules. Its architectural output is therefore not necessarily the final interface, video, diagram, code change, or Workflow state. It is a semantic proposal that makes the intended meaning explicit enough for ordinary software to validate and realize.

```text
unstructured intent / context / evidence
        ↓ probabilistic semantic processing
typed semantic proposal
        ↓ deterministic validation / binding / commit
executable representation or committed runtime record
```

The typed representation is not merely a serialization format. It carries declared meaning, identity, authority, compatibility, and validation rules across a boundary. JSON, YAML, or an in-memory type may represent it physically; none of those encodings owns the meaning by itself.

Deterministic code then owns the work for which probabilistic reinterpretation would be harmful:

- exact identity and resource binding;
- schema, closure, capability, policy, and Gate validation;
- allowed control transitions and budget enforcement;
- scheduling, persistence, recovery, and commit ordering;
- Artifact and Workflow State updates;
- factual Observation mapping;
- candidate qualification and publication.

The lower layer may resolve only through a declared default, a deterministic derivation defined by the owner, or selection within an explicitly allowed set. It may also bind an exact identity, reject an incomplete proposal, or reduce an allowed choice set. It may not invent, repair, or reinterpret semantic meaning that the owning upper layer never declared.

## 3. A deterministic runtime with probabilistic semantic effects

An agent Workflow is not wholly deterministic: declared Actions may invoke an LLM. WSR treats those invocations as explicit, bounded probabilistic semantic effects inside a deterministic control system.

```text
authoritative Workflow State
        ↓ declared Action / decision site
managed Agent invocation
        ↓
typed result proposal
        ↓ schema / Gate / allowed-set validation
deterministic commit or typed rejection
        ↓
next authoritative Workflow State
```

The model may propose a selection, Finding, implementation result, Artifact, or terminal outcome. The proposal is not authoritative Runtime State. Its semantic claims do not become externally true merely because they are committed; commit only establishes the accepted system record. The proposal enters authoritative Runtime State only after the owner validates and commits it.

This yields a central distinction:

> **Probabilistic processors propose semantic content; deterministic owners decide what enters authoritative Runtime State.**

Runner authority, Planner boundedness, typed Action results, and the prohibition on free-text Gate bypass are all consequences of this distinction.

## 4. The same kernel recurs at three scales

Recursive semantic compilation is not only the path from a Workflow Package to an executable graph. The same semantic-proposal-to-deterministic-realization kernel appears at three scales.

### 4.1 Workflow authoring

```text
human intent
    ↓ semantic interpretation
Workflow semantic representation
    ↓ resolution / admission / compilation
executable Workflow
```

A human may author the representation directly, or an Agent may help synthesize it. In both cases, the executed authority is the versioned, validated representation, not transient model memory or prose.

### 4.2 Action execution

```text
Action context
    ↓ Agent semantic processing
typed ActionResult / Artifact proposal
    ↓ Runtime validation / commit
Workflow State and Artifact facts
```

This scale prevents Agent-to-Agent prose from silently becoming control authority. Human-readable prose may remain an output, but machine-consumed meaning must cross the boundary through a typed result when later control, validation, Evidence, or Evolution depends on it.

### 4.3 Workflow evolution

```text
Evidence about version N
    ↓ semantic analysis / synthesis
typed Workflow change proposal
    ↓ validation / qualification / publication
Workflow version N+1
```

Self-recursion therefore does not mean that an active Workflow rewrites itself. It means the same architecture reappears when facts from one immutable version become input to the semantic synthesis and deterministic qualification of a later immutable version.

## 5. Interpretive mapping of current and planned concepts

The model clarifies existing objects without requiring them to be renamed to compiler terminology.

| Architectural role | WSR concept | Status in this note | Meaning |
| --- | --- | --- | --- |
| Semantic program | Workflow Definition plus closed Package relationships | Established architecture; exact shape is Contract-versioned | Declares business, control, resource, Artifact, validation, and authority meaning |
| Exact versioned material | Workflow Package / Snapshot | Current implementation and Contract | Freezes the declared closure and content identities |
| Admitted and bound representation | Delivery Manifest and `RunnerActivationContext` | Current implementation; exact fields are Contract-versioned | Binds the exact Package to Delivery, resource, capability, workspace, Provider, and model identities |
| Backend lowering | `CompiledGraphActivation` | Current implementation | Minimal executable activation produced by Interpreter; currently contains `LangGraphExecutionPlan` and is therefore not backend-neutral |
| Operational realization | Runner, Workflow Host, Managed Agent Invocation, and Custody | Current architecture and implementation, subject to each module's conformance status | Executes declared control and probabilistic effect sites while preserving unique-writer authority |
| Semantic effect result | ActionResult, Artifact, Finding, selection, or terminal proposal | Existing design/Contract family; enforcement varies by Workflow and result type | Carries model-produced meaning to a deterministic validation/commit boundary |
| Epistemic record | Observation and Evidence factual projection | Current architecture and implementation, subject to published profile coverage | Records bounded facts about committed execution without controlling that Delivery |
| Cross-version semantic proposal | Workflow revision proposal | Planned future capability | Expresses a candidate change against an exact base version; it is not active Workflow authority |

The word *IR* is useful when it emphasizes explicit semantics and deterministic transformations. It does not require a new public `WorkflowIR` object. The existing Workflow Package may remain the semantic representation until a concrete mismatch demonstrates that another representation is necessary.

## 6. Evidence is an epistemic boundary

Execution owns its committed operational records for a Delivery. Evidence owns the supported historical claims the product can substantiate from accepted observations, always within explicit provenance, completeness, availability, compatibility, and producer-correctness limits.

```text
Agent proposal
    ↓ validation and commit
runtime fact
    ↓ bounded, one-way Observation
Evidence fact / projection
```

Evidence therefore does not parse hidden reasoning, infer missing Runtime state from prose, treat absence as zero, or return a result that controls the same Delivery. Its independence is not only fault isolation; it is the separation between operational truth and knowledge about historical operation.

That separation lets later evaluation and evolution consume facts without becoming another writer of Execution truth.

## 7. Compilation and evolution are different transformations

**Compilation** operates on one fixed semantic version. Its design obligation is to preserve the declared Contract and its control, dataflow, binding, authority, and validation invariants, or reject the input. This document does not claim a formal observational-equivalence proof.

**Evolution** may deliberately change Role allocation, control structure, Route resources, Prompt or Skill content, model-binding policy, budgets, or result contracts. It is therefore not automatically a semantics-preserving compiler optimization. It is **evidence-guided semantic re-synthesis**.

```text
Workflow N
    ↓ Execution
Evidence N
    ↓ evaluation and semantic re-synthesis
typed delta against exact N
    ↓ qualification and publication
Workflow N+1
```

An Evolution output is a proposal for a new version, not permission to mutate an active Snapshot, historical Delivery, or accepted Evidence. Static validation, replay, benchmarks, review, or controlled experiments may qualify a proposal according to its change class. Publication remains an explicit authority boundary.

Some future transformations may be proven semantics-preserving. Others intentionally alter behavior to improve an evaluated outcome. The design must distinguish those classes instead of calling every change an optimization pass.

## 8. Entropy localization and cost

The objective is not to eliminate LLMs. It is to spend probabilistic computation only on irreducible semantic uncertainty and move repeatable, formally expressible work into deterministic structure.

Examples include:

- persisting global phase and allowed successors in Workflow State instead of Leader memory;
- replacing prose handoff with typed Artifact slices;
- loading only Action-declared Prompt, Skill, and input dependencies;
- using deterministic selectors where explicit conditions are sufficient;
- reserving stronger models for high-entropy decisions and bounded escalation;
- turning repeatedly stable semantic choices into proposed deterministic rules in a later Workflow version.

The long-term optimization objective is therefore:

> **Minimize the probabilistic surface subject to preserved quality, authority, and completion semantics.**

Lower token usage or cost is not independently sufficient. Removing a required Review, hiding a Finding, or truncating necessary context may make a metric cheaper while making the Workflow worse. Evidence and qualification must retain independent quality and authority constraints.

## 9. Foundational principles

1. **Semantic lifting** — Models interpret unstructured input into explicit, typed, and reviewable meaning.
2. **Proposal before authority** — A model output is a proposal until its owning deterministic boundary validates and commits it.
3. **No semantic invention below the owner** — Lower layers may bind, validate, lower, and execute; they may not repair missing meaning from ambient state or prose.
4. **Deterministic realization** — State transitions, Gates, budgets, persistence, recovery, and publication are deterministic owner responsibilities.
5. **Typed semantic boundaries** — Machine-consumed cross-boundary meaning is represented explicitly wherever later behavior depends on it.
6. **Epistemic separation** — Evidence retains supported claims derived from accepted observations, with explicit epistemic limits, and never becomes a control dependency of that execution.
7. **Version recursion** — Evolution creates a new candidate version; it never rewrites active authority or accepted historical records.
8. **Semantic/backend separation** — Product meaning remains above replaceable Host and Provider substrates.
9. **Entropy localization** — Probabilistic computation is reserved for declared high-entropy semantic work; formalizable repetition may move downward into deterministic structure.

## 10. Vocabulary boundaries

The theory does not merge three meanings that are sometimes all called routing:

| Term | Responsibility | Current authority |
| --- | --- | --- |
| Control-flow selector | Select an allowed next Action or branch | Workflow declares the set; Runtime performs or validates selection |
| Workflow Route | Bind a Role to Action prompts, Skills, tools, Driver, capability, access, and session policy | Workflow Package |
| Model-binding policy | Bind a Role to an exact Agent Provider / LLM route / model | Repository and Execution policy in the DSL 2.0 candidate; Admission freezes the result |

Similarly, semantic representation, physical encoding, backend plan, runtime state, and Evidence projection are related but distinct. A convenient common word must not collapse their authorities.

## 11. Consequences for design review

Every future WSR design should be able to answer:

1. What unstructured meaning enters this boundary, if any? If none enters, state that explicitly.
2. Which semantic representation leaves it?
3. Is the result a proposal, an admitted binding, an executable plan, or a committed authoritative record?
4. Which owner validates and commits it?
5. Can a lower layer invent, repair, or reinterpret missing meaning?
6. Which operations are probabilistic, and why can they not yet be deterministic?
7. What exact version, inputs, binding, provider/model attribution, and lineage make the result traceable and replay-assessable? Exact identity does not imply bit-reproducible model output.
8. What facts may be observed without becoming a control dependency?
9. If the component evolves a Workflow, how does it create and qualify a new version instead of mutating current authority?

These questions are architectural review criteria, not a mandate to introduce a generic compiler framework.

## 12. Non-goals

This principle does not by itself propose:

- renaming Workflow Package, `RunnerActivationContext`, Interpreter, or `CompiledGraphActivation`;
- introducing public `SourceIR`, `BoundIR`, or `ExecutableIR` types;
- replacing LangGraph or adding a speculative second Host backend;
- claiming that current `CompiledGraphActivation` is backend-neutral;
- making every human-facing output a complex schema;
- allowing Evidence to control Execution;
- allowing Evolution to mutate an active Snapshot or accepted history;
- exposing private chain-of-thought;
- treating model output as authoritative without deterministic validation;
- implementing a code refactor merely to resemble compiler terminology.

The purpose is to make the existing architecture coherent enough that later changes can be judged against one shared model.
