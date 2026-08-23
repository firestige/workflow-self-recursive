# Runner Custody Submodule Detailed Design

## 1. Status and role

| Field | Value |
| --- | --- |
| Status | `ITERATION_2_IMPLEMENTED`; conformance is limited to the shipped tests and locked composition |
| Submodule | Runner Custody |
| Implementation | `execution-system/src/custody/git-custody.ts` |
| Structure authority | GitHub issues [#47](https://github.com/firestige/workflow-self-recursive/issues/47) and [#66](https://github.com/firestige/workflow-self-recursive/issues/66) |
| Companion | [Chinese non-normative companion](custody.zh-CN.md) |

Custody owns savepoints, Git-tree identity, scoped workspace authority, post-attempt scope arbitration and restore, bounded read fan-out, result preservation, and guarded publication for the one canonical worktree admitted by `execution.delivery`.

Custody does not create, copy, select, lock, or manage worktrees. It provides no file-editing API: Provider processes perform actual reads and writes under an authorized capability. It does not own graph routing, Provider sessions, Delivery admission/current-slot state, terminal outcome, or final settlement.

## 2. Capabilities

Workflow Host receives the bounded `HostCustody` capability. Lifecycle Coordinator receives lifecycle-facing Custody operations. Managed Invocation receives no Custody service; a Host dispatch carries only an exact signed write handle, bounded read view, or no-workspace authority for that episode and savepoint.

## 3. Savepoints and scope arbitration

Custody establishes a baseline for the already-admitted canonical worktree, records savepoints and `gitTree` identity, and validates tracked, ignored, and symlink-sensitive changes after each attempt. Write-scope enforcement is post-attempt detection plus exact restore where the Provider cannot provide path-level prevention. A violation fails closed before the next checkpoint.

Parallel read branches share one savepoint and use isolated Provider sessions; Custody does not create temporary worktrees or directories for branch isolation. Mutation or source drift invalidates a read view.

## 4. Result and publication

At a terminal proposal, Custody preserves the bounded result before publication. Guarded publication returns `published`, `already-at-target`, `conflict`, or `unknown`. Conflict never becomes fabricated success; unknown requires reconciliation. There is no default publish, merge, or automatic conflict resolution.

## 5. Recovery and retirement

Recovery may restore only a known savepoint. Owner-scoped retirement clears Custody-owned transient capability state after result preservation and a known publication disposition; it does not erase durable result/savepoint/publication evidence required by settlement.

## 6. Verification and reopen conditions

Required evidence covers savepoint identity, authorized/unauthorized tracked and ignored mutations, symlink/path escape negatives, exact restore, read-view invalidation, single-savepoint read fan-out, result preservation, all four publication dispositions, later-process recovery, and idempotent owner retirement.

Reopen if multiple worktrees or concurrent-write branch semantics enter the product, publication requires automatic conflict resolution, or exact restoration cannot be proven with the selected Git substrate.
