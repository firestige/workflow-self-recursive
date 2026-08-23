# Workspace and Publication Manager 模块详细设计

## 1. 状态与角色

| 字段 | 值 |
| --- | --- |
| 状态 | `WAVE4_ENTRY_REVIEW_CANDIDATE` |
| 模块 | Workspace and Publication Manager |
| 当前实现 | Git Custody Adapter |
| Companion | [英文规范原文](workspace-publication-manager.md)；本文是 non-normative 中文 companion |

Workspace and Publication Manager 是单个 Delivery 的 physical workspace state、savepoint、bounded workspace capability、result preservation 和 guarded publication 的唯一 owner。其他 Runner module 决定 semantic acceptance 或 lifecycle routing，但不能直接修改/发布 Git state。

## 2. 职责

本模块拥有 canonical admitted worktree validation/durable baseline、savepoint/Git-tree identity、scoped write handle/bounded read view、post-attempt scope arbitration/restore、read mutation/source invalidation、durable bounded result preservation、publication target/guard/disposition、workspace recovery 和 owner-scoped retirement。

它不拥有 Action result schema/Gate semantic、graph transition、Provider invocation、Delivery terminal outcome 或 final settlement。

## 3. Capability separation

Workflow Host 获得用于 baseline/write handle/read view/attempt settlement 的 `HostCustody`。Lifecycle Coordinator 获得用于 preserved result/publication/inspection/recovery/retirement 的 `CoordinatorCustody`。

Managed Invocation 不获得任何 service，只接收 `write: AuthorizedInvocationHandle`、`read: AuthorizedReadView` 或 `none` 的 signed value。value 绑定 exact episode、source savepoint 和 access digest，Provider code 不能扩大或跨 episode 复用。

## 4. Baseline 与 workspace attempt

第一个 write handle 前记录 exact admitted worktree 的 durable baseline。write handle 只针对 declared access rule/current savepoint 发放；read-only Action 只获得 read view。

attempt 后 Custody 独立观察完整 worktree（包括 ignored content），并与 saved full-workspace tree 比较。不论 Host accept/reject 都执行 validation；Host rejection 不能绕过 workspace validation。

结果为 accepted（next savepoint known/explicit absent）、scope violation restored、Host rejection restored，或 restore failed with explicit knowledge state。

Restoration 只针对 exact changed path 并物化 saved full-workspace tree，不使用 broad recursive deletion target。path 处理 NUL-safe，所有目标均是 canonical root 的 lexical descendant。

read view 发生 mutation/source change 即 invalid；read Action 不能静默变成 write。

## 5. 双重 validation 与 commit order

Host semantic validation 与 Custody physical validation 相互独立。Host 在请求 Custody settle 前预览全部 declared State/Artifact change。只有 Host result valid 且 Custody accepted，才能应用 data edge、绑定 next savepoint 并 checkpoint new state。

semantic rejection、scope violation、read mutation 或 restore uncertainty 都阻止 commit。Git savepoint 不替代 Host checkpoint，Host checkpoint 也不证明 workspace bytes。

## 6. Result preservation 与 publication

terminal proposal 时，Coordinator 在 publication 前请求 Custody preserve bounded Workflow result。preserved-result identity 绑定 exact Delivery、result content 和 savepoint knowledge。

publication 根据 expected target/tree guard，返回 `published`、`already-at-target`、携带 preserved result 的 `conflict`，或带 explicit uncertainty 的 `unknown`。前三者 known，可进入 retirement/settlement；`unknown` 需要 reconciliation。conflict 不自动解决，也不从 Git process exit 猜测 unknown。

## 7. Recovery 与 retirement

Recovery 可 continue、restore from known savepoint 或要求 intervention；publication/current-savepoint facts 独立 inspectable。

只有 result 已 preserved 且 publication disposition known 才能 retirement。模块校验 exact authorization，只清理 Custody-owned handles/views/transient state 并持久化 owner fact。same authorization idempotent，different authorization fail closed。settled outcome 所需的 durable savepoint/result/publication evidence 不因 transient custody retirement 被删除。

模块不写中央 audit address，也不依赖 Observation。

## 8. 验证与 reopen 条件

测试必须覆盖 canonical baseline/durable Git refs、三类 capability、tracked/ignored mutation、Host reject + independent scope violation、exact restore/pre-existing ignored content、read invalidation、四类 publication、跨进程实例 recovery、retirement precondition/idempotency，以及 Managed Invocation 无法导入 Custody service 的 caller boundary。

如果多个 writer 必须共享 canonical worktree、publication 需要自动解决 conflict、workspace 变为 untrusted/remote，或所选 source-control substrate 无法证明 exact restoration，则重新打开本设计。
