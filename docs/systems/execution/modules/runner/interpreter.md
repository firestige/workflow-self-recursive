# Runner Interpreter Submodule Detailed Design

## 1. Status and role

| Field | Value |
| --- | --- |
| Status | `ITERATION_2_IMPLEMENTED`; conformance is limited to the shipped tests and locked composition |
| Submodule | Runner Interpreter |
| Implementation | `execution-system/src/interpreter/compile-runner-activation.ts` |
| Structure authority | GitHub issues [#47](https://github.com/firestige/workflow-self-recursive/issues/47) and [#62](https://github.com/firestige/workflow-self-recursive/issues/62) |
| Companion | [Chinese non-normative companion](interpreter.zh-CN.md) |

Interpreter is Runner's one-time activation stage. It validates a fully admitted `RunnerActivationContext` and compiles it into the minimal stable graph consumed by Workflow Host. It provides validation/compilation facts or a typed rejection; it does not issue Delivery admission, mutate the Package Snapshot, grant Provider permission, or advance Workflow state.

## 2. Input and output

Input is one deeply frozen activation whose package, definition, resource, authority, route, Agent/Provider, workspace, and correlation bindings were resolved by Execution Delivery before the Runner call.

Output is either a frozen `CompiledGraphActivation` or a typed `CompileError`. Raw Package documents, schema documents, selectors, Package Store handles, Delivery-admission services, native thread/checkpoint/session/process IDs, and secret-bearing values are rejected at the boundary.

## 3. Validation and compilation

Interpreter validates exact activation shape, deep freezing, binding digest, control/execution/dataflow closure, session and capability binding, and compile identity. It compiles declared sites, routes, joins, data edges, waits, budgets, validators, and terminal mappings without changing their Contract meaning.

The current implementation is `compileRunnerActivation`; `validateRunnerActivation` enforces the admitted contract identity and rejects forbidden/native/secret fields. This implementation evidence does not transfer Delivery admission ownership from `execution.delivery` to Runner.

## 4. Dependency direction

Lifecycle Coordinator calls Interpreter once before Host start. Interpreter has no dependency on Host, Invocation, Custody, Observation, Package Source, Package Store, or Delivery current-slot state. It owns no durable state.

## 5. Failure behavior

Any invalid, stale, unresolved, unsupported, or mismatched activation fails before Workflow progress or child effect. Interpreter never repairs an incomplete activation from ambient files, Runner defaults, Provider defaults, or fallback routes.

## 6. Verification and reopen conditions

Required evidence covers deep-freeze and digest checks, forbidden/native/secret field rejection, unresolved action/control/dataflow negatives, unsupported capability, deterministic compile identity, and raw Package rejection by construction.

Reopen if the published Workflow Contract changes the admitted activation meaning, compilation requires a new cross-owner input, or Interpreter would need to mutate Delivery/Package truth.
