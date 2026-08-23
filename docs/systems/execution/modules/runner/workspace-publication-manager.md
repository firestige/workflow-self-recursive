# Workspace and Publication Manager Module Detailed Design

## 1. Status and role

| Field | Value |
| --- | --- |
| Status | `WAVE4_ENTRY_REVIEW_CANDIDATE` |
| Module | Workspace and Publication Manager |
| Current implementation | Git Custody Adapter |
| Companion | [Chinese non-normative companion](workspace-publication-manager.zh-CN.md) |

The Workspace and Publication Manager is the sole owner of physical workspace state, savepoints, bounded workspace capabilities, result preservation and guarded publication for one Delivery. Other Runner modules decide semantic acceptance or lifecycle routing; they do not mutate or publish Git state directly.

## 2. Responsibilities

The module owns:

- canonical admitted worktree validation and durable baseline;
- savepoints and exact Git-tree identities;
- scoped write handles and bounded read views;
- post-attempt scope arbitration and restore;
- mutation/source invalidation for reads;
- durable bounded result preservation;
- publication target/guard comparison and known/unknown disposition;
- workspace recovery and owner-scoped retirement.

It does not own Action result schema/Gate semantics, graph transitions, Provider invocation, Delivery terminal outcome or final settlement.

## 3. Capability separation

Workflow Host receives `HostCustody` operations for baseline, write handle, read view and attempt settlement. Lifecycle Coordinator receives `CoordinatorCustody` operations for preserved result, publication, inspection, recovery and retirement.

Managed Invocation receives neither service. It receives only one signed value:

```text
write: AuthorizedInvocationHandle
read: AuthorizedReadView
none
```

The value binds the exact episode, source savepoint and access digest. It cannot be widened by Provider code or reused for another episode.

## 4. Baseline and workspace attempts

Before the first write handle, the module records a durable baseline for the exact admitted worktree. A write handle is issued only for declared access rules and current savepoint. A read-only Action receives a read view and never a write service.

After an attempt, Custody independently observes the complete worktree—including ignored content—and compares it with the saved full-workspace tree. It performs this validation whether Host says accept or reject. Host rejection cannot bypass workspace validation.

The result classes are:

- accepted, with a known or explicitly absent next savepoint;
- scope violation restored;
- Host rejection restored;
- restore failed with explicit knowledge state.

Restoration is bounded to exact changed paths and materializes the saved full-workspace tree. It does not use a broad recursive deletion target. Path handling is NUL-safe and all targets remain lexical descendants of the canonical root.

For read views, mutation or source change invalidates the view. A read action cannot silently convert into a write.

## 5. Double validation and commit order

Host semantic validation and Custody physical validation are independent. Host previews all declared outgoing State/Artifact changes before asking Custody to settle. Only when the Host result is valid and Custody returns accepted may Host apply data edges, bind the next savepoint and checkpoint the new state.

Any semantic rejection, scope violation, read mutation or restore uncertainty prevents that commit. A Git savepoint does not replace the Host checkpoint, and a Host checkpoint does not prove workspace bytes.

## 6. Result preservation and publication

At a terminal proposal, the Coordinator asks Custody to preserve the bounded Workflow result before publication. The preserved-result identity binds the exact Delivery, result content and savepoint knowledge.

Publication is guarded against the expected target/tree and returns exactly one disposition:

- `published`;
- `already-at-target`;
- `conflict` with the preserved result;
- `unknown` with explicit uncertainty.

The first three are known and may proceed to retirement/settlement. `unknown` requires reconciliation. Publication conflict is never auto-resolved, and unknown is never guessed from Git process exit.

## 7. Recovery and retirement

Recovery may continue, restore from a known savepoint or require intervention. Publication and current-savepoint facts remain independently inspectable.

Retirement is allowed only after result preservation and a known publication disposition. It validates the exact retirement authorization, clears only Custody-owned handles/views/transient state and persists the owner fact. Same authorization is idempotent; another authorization fails closed. Durable savepoint/result/publication evidence needed for the settled outcome is not erased merely because transient custody is retired.

The module does not write a central audit address and has no Observation dependency.

## 8. Verification and reopen conditions

Required tests cover:

- canonical baseline and durable Git refs;
- writable, read-only and no-workspace capabilities;
- authorized and unauthorized tracked/ignored mutations;
- Host reject plus independent scope violation;
- exact restore including pre-existing ignored content;
- read mutation and source invalidation;
- result preservation and publication published/already/conflict/unknown;
- recovery from later process instances;
- same/different authorization retirement and publication precondition;
- caller-capability imports proving Managed Invocation cannot access Custody service.

Reopen if multiple writers must share a canonical worktree, publication needs automatic conflict resolution, the workspace becomes untrusted/remote, or exact restoration cannot be proven with the selected source-control substrate.
