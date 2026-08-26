# Wave5 Session/Delivery/Worktree design evidence

Status: `PASS` (2026-08-26)

No Execution product code, FROZEN contract, Runner module, public application semantic, release coordinate, tag, package, or GitHub issue state was changed by this wave.

## Candidate documents

- `docs/systems/execution/session-delivery-worktree-binding.md`
- `docs/systems/execution/session-delivery-worktree-binding.zh-CN.md`
- proposed #94 final body: `tmp/20260825/iter4-implementation-plan/issue-94-patch.md`

Owner `firestige` approved the design, implementation-level oracles, design-only Iter4 boundary, separate post-Iter4 implementation card, and #94 update/closure on 2026-08-26.

Pushed design checkpoint: `70b8110a4b9bb54c085f36861f2b7a82e08d35ce` on `iter4/implementation`.

## Authority decision

| Truth | Owner/writer | Persistence | Fail-closed rule |
|---|---|---|---|
| Session availability | DSH host; Intake observes exact key | DSH registry only | absence is unavailable, never guessed |
| Session–Delivery presentation binding | DSH Intake Adapter | adapter-private binding file | exclusive both directions; corruption stops startup |
| Delivery and selected worktree | Execution M01 | Manifest/current-slot | immutable worktree after persistence |
| Worktree occupancy | Execution M01 | current-slot projection | no queue, stealing, timeout, or Session-loss release |
| Conversation-workspace authorization | Intake supplies; private Bootstrap control validates | invocation-only, no identity | exact live Agent/registry/membership/realpath/Git-root match |

No third durable truth, Prepared Binding store, persistent capability identity, or cross-store transaction is introduced. `allowedWorktreeRoots` remains the public authority and `process.cwd()` remains forbidden as business workspace.

## Lifecycle and recovery decision

- Host Session availability is observed independently and never creates, moves, or terminates a Delivery.
- Intake persists only `BOUND`/`DETACHED`; `RESTORING` is an in-memory startup phase.
- Delivery retains the existing current-slot lifecycle; pre-Manifest work is not a Delivery state.
- Worktree lifecycle is a current-slot projection. Session loss, crash, or elapsed time never makes an occupied/uncertain worktree free.
- Create persists Manifest/current-slot before Intake binding. A crash in between produces a valid detached Delivery.
- Bootstrap establishes complete Execution truth before Intake joins bindings. Ambiguous truth or identity corruption fails closed.
- Explicit recover requires an unbound Session whose exact authorized workspace equals the Manifest worktree, and can claim only a detached Delivery.

## Implementation-level oracle coverage

The design has explicit expected results and forbidden effects for:

- same-worktree concurrent Sessions;
- one Session attempting a second Delivery;
- another Session claiming a bound Delivery;
- different Sessions/worktrees in parallel;
- UI Session switching;
- workspace/session mismatch;
- crash before Manifest, after Manifest/before binding, and after binding;
- restart with unavailable Session;
- recover from a different workspace;
- stale binding after conclusive terminal cleanup;
- duplicate, corrupt, or identity-mismatched binding/Manifest state.

## Boundary and transition decision

#93 remains the validation source but raw workspace-as-worktree is replaced in the future implementation by a private typed invocation-only authorization input. The binding schema will require an explicit `deliveryBindingIdentity` migration with exact recovered-Delivery joins.

Wave5 is design-only. Implementation is tracked by #102 (`https://github.com/firestige/workflow-self-recursive/issues/102`) and remains outside Iter4 unless the plan/DAG/release baseline and `0.1.3+` decision are explicitly revised. The candidate identifies later owned paths and forbids changes to Runner, FROZEN contracts, Evidence, public application methods, and Provider-native Session types.

## Owner decisions

1. Approved the authority, invariants, lifecycle/recovery ordering, oracle set, and #93 transition design.
2. Approved that Wave5 remains design-only and product implementation is tracked by #102 outside Iter4 unless Iter4 scope is explicitly revised.
3. Approved applying the proposed #94 body and closing #94 after the design checkpoint is pushed.

## Closure

- Design issue: #94 — `https://github.com/firestige/workflow-self-recursive/issues/94`
- Future implementation: #102 — `https://github.com/firestige/workflow-self-recursive/issues/102`
- Closure correction containing the exact checkpoint: `https://github.com/firestige/workflow-self-recursive/issues/94#issuecomment-5418074170` (the preceding shell-authored close comment omitted the backtick-delimited SHA; the issue body and correction contain the exact value).
- #94 final state and label are verified after external update as `CLOSED` / `completed`.
