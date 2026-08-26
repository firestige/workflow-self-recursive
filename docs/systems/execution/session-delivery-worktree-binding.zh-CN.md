# Session、Delivery 与 Worktree 排他绑定设计

状态：`APPROVED — IMPLEMENTATION AUTHORIZED`

Issue：[#94](https://github.com/firestige/workflow-self-recursive/issues/94)

实施卡：[#102](https://github.com/firestige/workflow-self-recursive/issues/102)

Owner：Execution System

范围：批准后的设计权威；Owner 已于 2026-08-26 授权在 Iter4 Wave11 实施

## 1. 决策边界

本设计细化既有 Execution current-slot 与 DSH Intake binding，不修改 FROZEN 契约、Runner 五模块边界、公开 `execute`/`inspect`/`cancel` 语义或 Workflow outcome truth。本文的 Session 只指 host DSH Intake conversation session，绝不是 Runner-native Provider session。

不新增第三份持久化真相，也不引入跨 store 事务。Execution 继续通过 Manifest/current-slot 唯一拥有 Delivery 与 canonical-worktree 占用；DSH Intake Adapter 只拥有 host Session 与 Delivery 之间的 presentation binding。

## 2. 实体与权威

| 实体 | 身份 | 唯一 authority/writer | 持久化位置 | 规则 |
|---|---|---|---|---|
| Host Session availability | exact DSH session key | DSH host；Intake 观察 | DSH session registry，不是 WSR state | 不猜测 availability |
| Session–Delivery binding | session key + Delivery ID + correlation | DSH Intake Adapter | plugin 安装目录外的 private binding file | 双向均为零或一 |
| Delivery | Delivery ID + immutable `deliveryBindingIdentity` | Execution Delivery（M01） | Manifest + current-slot + Runner durable facts | Manifest 后 worktree 不可变 |
| Worktree occupancy | canonical realpath | Execution Delivery（M01） | 既有 current-slot | 至多一个 current Delivery；不排队、不抢占、不超时释放 |
| Conversation-workspace authorization | session key + DSH workspace ID + exact canonical path | DSH Intake 提供、private Bootstrap control 验证 | 仅 invocation-scoped；无 durable identity | 不授权父目录或相邻目录 |

`allowedWorktreeRoots` 仍是 public application surface 的唯一权威。DSH private path 只有在 live-Agent、registry resolution、session membership、absolute path、realpath 与 Git-worktree-root equality 全部通过后，才接受精确、类型化且 invocation-scoped 的 conversation-workspace authorization。该输入没有独立持久化 identity、不能被 caller 留存，也不是 Prepared Binding 或新真相源；它不会追加或扩大 `allowedWorktreeRoots`。`process.cwd()` 永远不是业务 workspace 或 fallback。

新建 Delivery 时，Intake 提供 registered conversation workspace proof；Execution 推导并 canonicalize 精确 Git worktree，执行排他 admission，并把 selected worktree 写入 Manifest。持久化后，durable worktree authority 是 Manifest/current-slot，不是 conversation 后续 cwd。

## 3. 闭合不变量

1. 一个 host Session 有零或一个 `BOUND` active Delivery。
2. 一个 active Delivery 有零或一个 `BOUND` host Session；零是合法 `DETACHED` recovery 状态。
3. Manifest 持久化后，一个 Delivery 恰好拥有一个 immutable canonical worktree。
4. 任一非空 current-slot 状态下，一个 canonical worktree 至多一个 current Delivery。
5. binding record 必须按 Delivery ID、canonical worktree、correlation、`deliveryBindingIdentity` 精确 join 一个 current Delivery。
6. 普通 contention 不修改任何 store。持久化 one-to-many、many-to-one、identity drift 或 duplicate 是 corruption，startup fail closed，不选 winner。
7. Session authority 缺失/非法时，在任何 Delivery、Package、Runner、binding effect 前返回 `DSH_INTAKE_WORKSPACE_UNAUTHORIZED`。
8. Session 已绑定返回 `SESSION_INTAKE_BOUND`；Delivery 已绑定其他 available Session 返回 `DELIVERY_INTAKE_BOUND`；worktree 占用保持既有 `CONTENDED`/exact `RECOVERY`。

现有 architecture 的“一个 active Delivery 恰好绑定一个 session”需细化为“至多一个 Session”，否则无法表达 crash-safe `DETACHED`。Wave11/#102 实施时必须同步修改该文字。

## 4. 独立生命周期投影

### 4.1 Host Session availability

WSR 只观察，不持久化或拥有：`UNKNOWN → AVAILABLE|UNAVAILABLE`；只有 exact host discovery/loss 可改变观察结果。availability 不创建、终止、移动或选择 Delivery；UI 切换 current Session 也不转移 binding。

### 4.2 Intake binding

```text
UNBOUND --new Delivery registration / explicit recover--> BOUND
BOUND --plugin restart--> RESTORING
RESTORING --exact Session + Delivery join--> BOUND
RESTORING --Delivery valid, Session unavailable--> DETACHED
DETACHED --authorized unbound Session explicit recover--> BOUND
BOUND/DETACHED --conclusive terminal or authorized abandonment--> UNBOUND
```

`RESTORING` 是内存 startup phase，不是第二份持久化真相；持久化状态只有 `BOUND`/`DETACHED`。新 Session 不会隐式继承 binding。带或不带 Delivery ID 的 recover 都必须证明 invoking Session 的 exact authorized workspace 等于 persisted Manifest worktree。

### 4.3 Delivery

沿用既有 current-slot 状态与 owner：`NO_DELIVERY → BOUND → START_UNCERTAIN → RUNNING_CORRELATED`，以及 `RESULT_UNRESOLVED`、`START_FAILED`、`TERMINAL_HANDLING` 分支。Pre-Manifest preparation 不是 Delivery state；Manifest 前死亡不留 Delivery，Manifest 后死亡留下 exact recoverable Delivery，与 Intake binding 是否写完无关。

### 4.4 Worktree occupancy

Worktree lifecycle 是既有 current-slot 的投影，不是新文件或 writer：`EMPTY=FREE`；`BOUND/START_UNCERTAIN/RUNNING_CORRELATED=OCCUPIED`；unresolved 状态=`UNCERTAIN`；terminal/start-failed handling=`RELEASING`。Crash、Session 丢失、时间流逝或新请求都不能把 occupied/uncertain 变成 free。

## 5. 建立、恢复与解除顺序

### Create

1. Intake 证明 live Session 与 exact registered workspace；失败零 Execution effect。
2. Execution 验证 private invocation authorization、推导 exact canonical Git worktree，并在 Package work 前 admission。
3. 只有 `NEW` 做 Package preparation，且 Runner effect 前先持久化 Manifest/current-slot。
4. Intake 按 correlation join registered Delivery，持久化包含 `deliveryBindingIdentity` 的排他 Session binding。
5. 若步骤 3–4 之间 crash，Delivery 合法但 detached；只能 restart/explicit recover join，不回滚、不伪造 terminal。

无需 pre-Delivery reservation；新增 reservation 会复制 authority，并违反既有“no Prepared Binding store”决策。

### Recover/rebind

Bootstrap 必须先完成 Execution recovery；失败则 application fail closed。随后 Intake 校验 binding document 并与完整 inventory join：exact binding + available Session=`BOUND`；Delivery valid + Session unavailable=`DETACHED`；Bootstrap 成功后确认 Delivery 不存在的 stale presentation binding 可删除；ambiguous inventory、identity mismatch、duplicate 或 corruption 阻断 startup。Explicit recover 只允许 unbound 且 workspace-authorized Session claim detached Delivery，原子替换 adapter-private record，不改 Manifest/current-slot。

### Release

只有 conclusive terminal 或 authorized abandonment 才清理 presentation binding，并通过既有 M01 transition 清 current-slot。任一 cleanup 中断时，restart 以 Execution truth 对账，绝不制造 outcome。Session 消失只 detach presentation，不释放 worktree。

## 6. 实现级 oracle

必须覆盖：同 worktree 双 Session contention、同 Session 二次 create、第二 Session claim bound Delivery、不同 worktree 并发、UI Session 切换、workspace/membership mismatch、Manifest 前/后 crash、binding 写后 crash、restart Session unavailable、跨 workspace recover、conclusive terminal 后 stale binding、duplicate/corrupt/identity mismatch。任何失败都不得产生 fallback、implicit switch、winner selection、新 selector work、worktree timeout release 或跨 Session presentation 泄漏。

## 7. 替换 #93 provisional 过渡

#93 检查继续作为 authorization source，但不再把 raw workspace string 当成 durable worktree。Wave11/#102 必须引入 private、typed、invocation-only conversation-workspace authorization input，由 Execution 推导/持久化 worktree；该输入没有自己的 identity 或 durable lifecycle。binding schema 从 `execution.intake-bindings@1.0.0` 显式迁移到 `execution.intake-bindings@2.0.0` 并增加 `deliveryBindingIdentity`；每条 v1 record 必须 exact join 一个 recovered Delivery，否则 fail closed，不静默改写。

## 8. 实施边界

Wave5 本身不改产品，只批准本设计与实现级验收。Owner 已于 2026-08-26 显式修订 Iter4 plan、DAG 与 release baseline：[#102](https://github.com/firestige/workflow-self-recursive/issues/102) 获准在 Iter4 Wave11 实施，`wsr-execution` / `wsr-dsh-intake` 必须从不可变的外部 `0.1.2` 基线锁步升级到 `0.1.3`。Wave12 是统一发布窗口；Wave11 不得产生外部发布状态。

后续 owned paths：Intake `binding-repository.js`/`index.d.ts`/`plugin.js`；private invocation-authorization seam 的 `bootstrap/contracts.ts`/`production.ts` 与 `core/request.ts`/`execution-core.ts`；只在必要时触及 `delivery/manifest.ts`/`admission.ts`/`current-slot.ts`，不得改状态语义；配套 `test/intake/**`、`test/delivery/**`、`test/bootstrap/**` 与 DSH restart/product qualification。Runner 五模块、FROZEN contracts、Evidence、公开 application methods 与 Provider-native Session 类型均禁止修改。
