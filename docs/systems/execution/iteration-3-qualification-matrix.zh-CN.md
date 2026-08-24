# Iteration 3 qualification matrix（中文跟踪译本）

状态：**Wave 0 design oracle**  
权威来源：[Project Execution System Design](./project-execution-system.zh-CN.md)  
英文规范：[Iteration 3 qualification matrix](./iteration-3-qualification-matrix.md)

本文件是长期 evidence index，不是执行 checklist；完成状态只由 Iteration 3 implementation plan 维护。英文规范冻结 #45、#46、#57、#86 与 Configuration/Factory/Bootstrap 的逐项 owner、RED fixture、executable oracle、target artifact，并进一步冻结：

- installation-scoped resource 与 Delivery-scoped instance 的 composition/effect boundary；
- persisted `DeliveryBinding` 先于 binding-dependent M02/M03 composition，且 owner-fact port 在 M02 effect 前完成 one-way wiring；
- `load → parse → validate/canonicalize → construct → enumerate occupied slots → recover exact binding/session disposition → READY` 与 reverse shutdown oracle；
- `execution.config@1.0.0` 每个 exact key 的 type、required/default policy、secret classification、consumer、Manifest binding、reload behavior 与 redacted error；
- host-neutral `TaskPrompt` 保留 triggering turn text/attachments；只有 `NEW` 创建 immutable snapshot 并绑定 identity，命令面不存在 prompt parameter；
- `/wsr list/create/recover/status/action finish/abandon` exact command surface，以及 command/skill 共同调用一个 DSH-I-only `workflow_execution_intake` operation union；
- 一个 Intake session 最多绑定一个 Delivery、一个 active Delivery 恰好绑定一个 session；不同 session 可服务不同 worktree，restart 按 exact durable binding 恢复或进入 detached；
- DSH-I/DSH-E 的 owner、创建点、配置、service/tool view、persistence、namespace、级联 dispose、restart/reinstall recovery 与 crash boundary；DSH package update/remove 不经过 WSR admission，外置 durable truth 保留，兼容版本从最后一个 durable boundary 恢复，尚未持久化的交互状态允许丢失；
- 无 public DSH resume 不排除 Bootstrap recovery establishment；user recover 只把 unbound session 绑定到 exact detached Delivery 或 current-worktree Delivery；
- `/wsr action finish` 只表示 `ACTION_FINISH_REQUESTED`；current Action 仍通过唯一 `workflow_complete` protocol 决定 completion；
- Action-finish 触发的 bounded Runner reopen 必须先有 RED，且只能修改 internal Action-interaction distinction，不得扩大 public Runner surface 或预先修改 initial Workflow Package；
- Execution、DSH Intake 与独立 Workflow Package GitHub Release 的 exact coordinate、asset convention 与 owner。

实现、测试与审查必须以英文表格的逐行 oracle 为准。任何翻译歧义由英文规范与 Project Execution System Design 裁决；本译本不得建立第二套语义。
