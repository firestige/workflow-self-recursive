# Runner Custody Submodule 详细设计

## 1. 状态与角色

| 字段 | 值 |
| --- | --- |
| 状态 | `ITERATION_2_IMPLEMENTED`；conformance 仅覆盖已交付测试与锁定 composition |
| Submodule | Runner Custody |
| 实现 | `execution-system/src/custody/git-custody.ts` |
| 结构权威 | GitHub issue [#47](https://github.com/firestige/workflow-self-recursive/issues/47) 与 [#66](https://github.com/firestige/workflow-self-recursive/issues/66) |
| Companion | [英文规范原文](custody.md)；本文是 non-normative 中文 companion |

Custody 为 `execution.delivery` 已准入的唯一 canonical worktree 拥有 savepoint、Git-tree identity、scoped workspace authority、post-attempt scope arbitration/restore、bounded read fan-out、result preservation 与 guarded publication。

Custody 不创建、复制、选择、锁定或管理 worktree，也不提供 file-editing API；实际读写由 Provider process 在 authorized capability 下完成。它不拥有 graph routing、Provider session、Delivery admission/current-slot state、terminal outcome 或 final settlement。

## 2. Capability

Workflow Host 获得 bounded `HostCustody` capability。Lifecycle Coordinator 获得 lifecycle-facing Custody operation。Managed Invocation 不获得 Custody service；Host dispatch 只携带绑定该 episode/savepoint 的 exact signed write handle、bounded read view 或 no-workspace authority。

## 3. Savepoint 与 scope arbitration

Custody 为已准入 canonical worktree 建立 baseline，记录 savepoint 与 `gitTree` identity，并在每次 attempt 后校验 tracked、ignored 与 symlink-sensitive change。若 Provider 不能提供 path-level prevention，则 write-scope enforcement 使用事后检出加 exact restore；violation 在 next checkpoint 前 fail closed。

Parallel read branch 共用一个 savepoint，并使用隔离 Provider session；Custody 不为 branch isolation 创建临时 worktree 或目录。Mutation/source drift 使 read view 失效。

## 4. Result 与 publication

terminal proposal 后，Custody 在 publication 前保存 bounded result。guarded publication 返回 `published`、`already-at-target`、`conflict` 或 `unknown`。conflict 不伪装成成功；unknown 需要 reconciliation。不存在 default publish、merge 或 automatic conflict resolution。

## 5. Recovery 与 retirement

Recovery 只能 restore 已知 savepoint。owner-scoped retirement 在 result preservation 与 known publication disposition 后清理 Custody-owned transient capability state；不会删除 settlement 需要的 durable result/savepoint/publication evidence。

## 6. 验证与 reopen 条件

所需证据覆盖 savepoint identity、authorized/unauthorized tracked/ignored mutation、symlink/path escape negative、exact restore、read-view invalidation、single-savepoint read fan-out、result preservation、四种 publication disposition、later-process recovery 与 idempotent owner retirement。

当产品引入 multiple worktree 或 concurrent-write branch 语义、publication 需要 automatic conflict resolution，或所选 Git substrate 无法证明 exact restoration 时，重新打开本设计。
