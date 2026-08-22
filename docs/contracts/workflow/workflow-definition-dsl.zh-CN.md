# Agent Ops Workflow Definition DSL — 契约表面

> **状态：FROZEN，已经发布。** 当前 Contract revision：`agentops.workflow-dsl@1.1.0`；`1.0.0` 保持为历史 resolving publication。R6 增加已批准的 author-intent surface，但不增加 Definition document 或 root schema。当前 exact publication binding 记录于 `system-contracts/workflow-dsl/publication/publication-record-1.1.0.json`。
>
> **规范语言：English。** 本文件是 [`workflow-definition-dsl.md`](workflow-definition-dsl.md) 的非规范 wholesale translation。English 发生变化会使先前 translation evidence 失效。
>
> **所有权。** English 文档拥有 portable Workflow Definition Contract。其 normative JSON Schemas、minimal Package/Snapshot、checker、canonicalization helper 与 executable fixture corpus 位于 [`system-contracts/workflow-dsl/`](../../../system-contracts/workflow-dsl/)。`workflow-package/` 存放 first-party consumer，不是第二个 Contract authority。

## 1. 范围与权威

| 字段 | 值 |
| --- | --- |
| Contract revision | `agentops.workflow-dsl@1.1.0` |
| Lifecycle | `FROZEN`；已发布；`conformance_claim=DEFINITION_AND_VALIDATOR_ONLY` |
| Upstream authority | [`workflow-composition-model.md`](../../workflow-composition-model.md)、[`agent-architecture.md`](../../agent-architecture.md)、两份 first-party Workflow semantic document，以及 #77 最新 owner decision |
| Machine representation | exact 同 revision 的 `system-contracts/workflow-dsl/` |
| 本 Contract 拥有 | portable Definition 字段、graph/dataflow closure、Action/Role/Route authority、Package/Snapshot identity、canonicalization、typed Runtime event port 与 conformance input/oracle |
| Runtime 拥有 | scheduling、persistence、attempt creation、retry execution、checkpoint storage、continuation restoration、provider adaptation、budget accounting 与 terminal settlement |

Contract 定义已准入 Runtime 必须保持什么，但不实现 Runtime。随附 fixture runner 只是当前 corpus 使用的抽象 operation test harness；它不是 scheduler、persistence engine、retry engine、continuation store 或 settlement engine。

### 1.1 分层隔离

| 层 | 可变性 | Owner | Portable 内容 |
| --- | --- | --- | --- |
| Workflow Definition | versioned | Package owner | graph、Actions、Roles、Routes、Artifact declarations、validators、budgets、Wait declarations、event edges |
| Workflow Package Snapshot | 每个 Delivery immutable | admission/configuration identity authority | exact Package/Definition/document/resource/route/graph identities 与 digests |
| Workflow State | 每个 Delivery mutable | selected Runtime | current graph node、Action invocation/attempt facts、results、Artifact refs、budgets、pending Wait、terminal proposal |
| Workflow Implementation | Runtime-private | selected Runtime | compiled graph、native callbacks/checkpoints/sessions |

Definition 与 Snapshot 不包含 provider-native checkpoint、session、invocation 或 attempt identity。替换 Runtime 不得改变它们的 portable semantics。

## 2. Normative document 与 schema 集合

Package index 命名六份 Definition document。Snapshot 在 admission 时另行生成。

| Kind | 典型文件 | Normative schema |
| --- | --- | --- |
| `agentops.package` | `package.json` | `schemas/package.schema.json` |
| `agentops.workflow-definition` | `workflow.json` | `schemas/workflow-definition.schema.json` |
| `agentops.actions` | `actions.json` | `schemas/actions.schema.json` |
| `agentops.roles` | `roles.json` | `schemas/roles.schema.json` |
| `agentops.routes` | `routes.json` | `schemas/routes.schema.json` |
| `agentops.artifacts` | `artifacts.json` | `schemas/artifacts.schema.json` |
| `agentops.validation` | `validation.json` | `schemas/validation.schema.json` |
| `agentops.workflow-package-snapshot` | admission output，例如 `snapshot.json` | `schemas/package-snapshot.schema.json` |

`schemas/agentops.meta.schema.json` 是一份 shared meta schema，提供共享 closed definition。集合仍严格保持八份 document、八个 root schema 加一份 shared meta schema；R6 不创建第九份 Definition 或第九个 root schema。全部 document 使用 JSON Schema draft-07，且每个 portable object boundary 都采用 `additionalProperties: false`。

## 3. Identity、canonicalization、Package digest 与 Snapshot

### 3.1 Canonical JSON

Canonicalization 作用于解析后的 JSON value，其中 number 表示为 IEEE-754 binary64 value：

1. 每个 string 与 object member name 必须只含 Unicode scalar value；lone UTF-16 surrogate 被拒绝；
2. object member name 按 UTF-16 code-unit sequence 升序排列，与不带 comparator 的 ECMAScript `Array.prototype.sort` 一致；
3. array 顺序严格保留；
4. string、finite number、boolean 与 `null` 使用 ECMAScript `JSON.stringify` serialization；这包括其 exponent 拼写，negative zero 编码为 `0`；
5. non-finite number、`undefined`、function 与其他非 JSON value 被拒绝；
6. 不输出 whitespace。

非 ECMAScript implementation 必须复现这些 exact UTF-16 ordering 与 binary64 serialization rule；不得替换成 Unicode code-point order、arbitrary-precision number serialization 或 host-default map order。

`canonical_digest(value) = "sha256:" + lowercase_hex(SHA-256(UTF-8(canonical_json(value))))`。

凡 Contract 指定 declaration order，array order 都具有语义；object member order 永无语义。

### 3.2 Package digest

`package.digest` 是完整 Package index 仅省略 `package.digest` 后的 canonical digest。因此 Package digest 在不形成自引用的前提下绑定 document path、resource index、authority declaration、environment requirement、compatibility range 与 Definition content identity。

`package.definition.contentIdentity` 另行绑定已声明 Workflow document 的 byte SHA-256。任一 digest 不匹配都拒绝 admission。

### 3.3 Snapshot 内容

Snapshot 绑定：

- Snapshot identity 与 canonical digest；
- exact Package name/version/digest；
- exact Definition identity/version/content identity；
- 六种 document kind 与 byte content identity；
- 每个 owned/referenced resource identity、ownership class 与 content identity；
- 每个 `Action → Role → Route` binding；
- graph node、typed event-edge 与 terminal identity；
- canonical authority order 与 merge proof；
- portable continuation binding vocabulary；
- `noAmbientFallback=true` 与 `allBindingsExact=true`。

Snapshot digest 是仅省略 `snapshot.digest` 后的 canonical digest。State 不得改写 Snapshot。任何 binding 变化都会为新的 authorized Delivery 产生新 Snapshot。

### 3.4 Portable continuation binding vocabulary

每个 applicable checkpoint 绑定以下 exact portable fact：

`delivery | snapshot | graphNode | action | attempt | inputBindings | artifactBindings | branchResults | budgets | pendingWait`

`action` 是适用的 Action identity，包括相关 branch 或 aggregator Action。Provider checkpoint/session type 被禁止。Snapshot 记录此 vocabulary，Definition 在 applicable checkpointed node 上声明它；Runtime 拥有实际 value 与 storage。

## 4. Action、Role、Route 与 authority

### 4.1 Action 是可复用 task template

每个 Action 声明 `id`、`name`、`purpose`、`resultSchema`、`responsibleAuthority` 与 `gate`；`inputSchema`、`allowedRoutes`、`escalation` 是条件字段。

Agent Action 还可以声明 `interaction:{mode:"action-scoped", completion:"structured-only"}`。该模式下的 input request 保持在同一 Action episode 与 admitted session 内，并通过 Action interaction capability 继续；它不是 Workflow Wait。只有 Action 已返回 structured result 并显式请求外部 approval 或 decision 时，才可以路由至已声明的 Workflow Wait。

Action authority shape 恰好有两种：

| Shape | Required authority | Agent binding |
| --- | --- | --- |
| Agent Action | `{kind:"role", role:<exact Role>}` | 一个或多个 allowed Route，全部携带同一个 responsible Role |
| deterministic Action | `{kind:"runtime", validator:<exact deterministic validator>}` | 无 Role 且无 `allowedRoutes` |

Action 永不携带 graph position、parallel branches、join configuration、Wait target、recovery target、successor set、invocation identity 或 attempt identity。每个实际 invocation 只继承其 Action envelope、适用时唯一 Role envelope 与 selected allowed Route 的交集。

### 4.2 Role 与 Route

Role 声明稳定 responsibility、closed Workflow authority concern set、Artifact/result write custody、prohibition 与可选 independence requirement。Write custody 不是 filesystem 或 provider permission grant。

Route 把一个 Role 绑定到 exact Agent definition、Role prompt、Action prompts、Skills、model、tools、Driver、session intent 与 Workflow data-access intent。Route 对 Action 可准入，当且仅当：

1. Route 列在该 Action 的 `allowedRoutes` 中；
2. Route Role 等于 Action 的唯一 responsible Role；
3. 每个 resource 都按 exact required kind 与 content identity 声明；
4. 要求 managed projection；
5. Route、Prompt、Skill、model、tool、Driver 或 session 都不能扩大 Action/Role authority。

Provider tool visibility 与 native side-effect authorization 仍属于 Runtime/Adapter concern。

每个 Route 声明 closed `resources.capabilities` set，其中包含 `structured-completion`，并可选包含 `action-interaction`。其 `sessionPolicy.scope` 严格为 `{kind:"episode"}` 或 `{kind:"data-bound", source:<source port>}`，另带 `isolation`。Delivery admission 解析并冻结 physical Agent/model/Driver/resource/path binding；Definition 从不提供 credential 或 provider-native session identity。

### 4.3 Canonical instruction merge

唯一可准入的 authority order 是：

```text
workflow_action → role_prompt → action_prompt → skill → artifact_user
```

Merge algorithm 按此顺序收集 Route 的 exact instruction resource，单独绑定 model/tool/Driver/session dependency，求 Action 与 Role envelope 交集，校验 Route authorization 与 resource closure，并输出 immutable merge proof。它不改变 resource byte，也不授予 provider permission。缺失或矛盾 binding 均 fail closed。

## 5. Graph 与 control routing

### 5.1 Node kind

Closed node vocabulary 是：

`action | parallel | wait | wait-renewal | recovery | cleanup`

Ordinary edge 只包含 `{id, from, to}`。`to` 是 exact node identity 或 `terminal:<exact terminal identity>`。没有 `routing` 的 node 最多有一个 ordinary success successor；显式 fan-out 只能由 parallel node 表示。有 `routing` 的 node 不得有 ordinary edge。`wait` 与 `wait-renewal` node 不得有 ordinary outgoing edge，因为其 successful continuation 是 recorded，而非 user-configurable。异常处理使用 typed event edge（§7），永不使用 Action target。

### 5.2 Action node

Action node 声明 `{id, kind:"action", action}`，以及可选 `budget`、`checkpoint`、`continuationSource` 与 `routing`。它把一个 graph position 绑定到一个可复用 Action。

Recovery node 要求 `{id, kind:"recovery", recovery}`，并可选声明 `action`、`budget`、`checkpoint` 与 `continuationSource:true`。`recovery` 引用一个 declared recovery policy；可选 `action` 命名 explicit recovery work，但绝不是 continuation target。

Cleanup node 要求 `{id, kind:"cleanup", disposition, action}`，并可选声明 `budget` 与 `checkpoint`。`disposition` 为 `cancellation | failure | continuation`；`action` 是在自身 authority 下执行 cleanup 的 ordinary Action。Cleanup closure 仍受 §7.3 约束。

### 5.3 Strict deterministic result routing

Mechanical branching 由 deterministic Action/validator 产生 top-level strict JSON boolean 或 closed enum property。Deterministic `routing` 声明：

```json
{
  "kind": "deterministic",
  "output": "routing",
  "cases": [
    {"value": "accept", "target": "node.accept"},
    {"value": "revise", "target": "node.revise"}
  ]
}
```

Checker 证明 `output` 是 producing Action `resultSchema` 的 top-level property，且其类型为 boolean 或 closed enum。`cases` 对该 closed result vocabulary 构成 total single-valued mapping：每个 allowed boolean/enum value 恰好出现一次，不同 value 可以指向同一个 node。Inline result schema 直接检查；routing 使用 referenced result schema 时，该 schema 必须解析为 exact declared `schema` resource byte、通过 content digest 且在 admission 时 materialized。byte 不可用或不是 JSON 时 fail closed，禁止 ambient fetch。Missing、duplicate 或 extra case value 拒绝 admission。Action result value 缺失、malformed、type mismatch 或 out-of-set 会使 producing attempt 失败。Runtime 不 coercion、不遍历 arbitrary JSON path、不比较 object/array，也不把 malformed output 当成 `false`。

### 5.4 Semantic routing 与 internal Planner

Semantic routing 只暴露 user-owned business branch 与一个 built-in fallback choice：

```json
{
  "kind": "semantic",
  "branches": [
    {"id": "branch.a", "meaning": "...", "target": "node.a"},
    {"id": "branch.b", "meaning": "...", "target": "node.b"}
  ],
  "fallback": {"kind": "question", "target": "node.ask"}
}
```

Runtime-internal Planner 是严格 `N → 1` closed-set classifier，闭集由 N 个已声明且 locally unique 的 business branch ID 加上 selected built-in fallback 组成。Duplicate branch ID 拒绝 admission。Definition 不暴露 classifier prompt、Planner Action、provider protocol、`proposalSchema`、`allowedTargets`、generic predicate、`ALL|SELECTED` 或 invalidation algorithm。

- successful classification 恰好返回一个 declared branch ID；
- 多个 plausible branch 仍只产生一个 ID；
- business inability to classify 选择 built-in fallback；
- out-of-set/malformed response 是 execution-format failure，不是 fallback；
- transient provider/Driver/format failure 可在 budget 内重试 exact classifier invocation；
- retry budget 耗尽通过 `budget-exhausted` 进入 `INCOMPLETE`；
- deterministic non-retryable configuration failure 通过 `nonretryable-failure` 进入 `FAILED`。

Semantic-routing node 构成 portable Planner invocation graph。Classifier invocation 之间的 self-cycle 与 mutual cycle 拒绝 admission。这是 static graph check，不是 Planner implementation。

### 5.5 Typed dataflow 与 Host operation

`dataflow.edges[]` 显式连接一个 declared source port 与一个 declared target port。Source port 可以是 delivery context、Workflow state、Artifact、site result 或 control result；target port 可以是 site input、control input、Workflow state 或 Artifact。Admission 拒绝 unresolved producer/consumer、duplicate sink、missing required input、stale control result 或 type-incompatible binding。因此 static topology 不等于 static path：Planner 可以产生 admitted typed result，declared decision 再从 declared successor 中选择。

`hostOperations[]` 声明 Host 拥有的 deterministic validation、selection 或 transformation。每项包含 exact operation identity、contract identity、configuration 与 required Host capabilities。它是 data，不是 callback/module locator；不能执行 Agent/Provider work，也不能扩张 declared successor set。

## 6. Parallel node、immutable result 与 join

### 6.1 Parallel 是 graph composition

Parallel node 声明：

- `id`、`kind:"parallel"`；
- 至少两个 `branches[]`，每个为 `{id, action, required:true}`；
- positive integer `maxConcurrency`；
- 恰好一个 `join`；
- 可选 `budget`、`checkpoint`、`continuationSource` 与 post-join `routing`。

该 node 没有 Action、Role、Route 或 responsible authority。每个 branch 引用一个单独声明的 Action。Runtime invocation/attempt identity 为 private，不能进入 Definition。

所有 declared branch 在被选中时都 required。不提供 optional-branch switch、dynamic branch creation、字面 `ALL|SELECTED` activation mode 或 completion-order semantics。

可选的 `selection.source` 读取一个 admitted typed value；该值必须是本 node 已声明 branch identity 的非空子集。`selection` 缺省时，selected set 是全部 declared branch；存在时，empty、unknown 或 duplicate branch identity 都在 branch effect 前 fail。`required:true` 约束该次 execution 的每个 selected member，barrier 只等待 exact selected set。该字段以 data 表达 selection，不是 `All|Selected` enum，也不是第二套 topology。

### 6.2 Barrier 与 branch result invariant

Join barrier 是内建语义，只在每个 selected branch 都有且仅有一个与 current input binding 对应的 current、admitted、successful result 时关闭。`FAILED`、`INCOMPLETE`、`CANCELLED`、malformed、stale、duplicate-current 或 unadmitted outcome 都不是 join input。

每个 branch result 都 immutable，由其 branch Action authority 拥有，并携带独立 identity/lineage。Branch 不 shared-write Workflow State、其他 branch result 或 aggregate output。Wall-clock completion order 不影响 result map、digest、route 或 authority。

可以重试一个 exact failed branch invocation，同时复用其他仍 current 的 successful result。不存在 full-rerun mode；重跑全部 branch 只是分别调度所有相关 exact invocation。

### 6.3 Closed join union

| Join | Input | Producer/owner | Output |
| --- | --- | --- | --- |
| `collect` | complete branch-ID → result-reference collection | parallel node identity 下的 deterministic Runtime join operator | 新 reference map；不复制或解释 body |
| `reducer` | 每个 branch Action 的整个 decoded JSON result payload | parallel node identity 下的 deterministic Runtime join operator | 一个新 reduced result |
| `aggregator` | complete read-only branch result map | 显式引用的 ordinary aggregator Action，仅使用自身 Action/Role/Route authority | 一个新的 aggregator-owned Artifact/result |

Aggregator 不继承 branch authority，不改变 branch identity/owner/provenance/disposition，也不向 branch 反向授权。Natural-language Review/Finding/domain-priority aggregation 必须使用 explicit aggregator Action。

### 6.4 Reducer vocabulary 与 exact rule

Closed reducer 如下：

| Operator | 整个 branch payload type | 规则 |
| --- | --- | --- |
| `sum|min|max` | inclusive `[-9007199254740991, 9007199254740991]` 的 JSON safe integer | 按 branch declaration order 读取；`sum` 每个 intermediate 与 final value 都必须保持 safe |
| `all|any` | strict JSON boolean | 按 branch declaration order 读取；不 coercion |
| `set-union` | non-null JSON scalar array；numeric member 必须是 safe integer | 按 branch declaration order 与 array-index order 读取；按 JSON type + exact value 去重并保留首次出现 |

Branch set 非空。Type mismatch、missing current result、duplicate current result、unadmitted result 或 safe-integer overflow 使整个 join 以 non-retryable `FAILED` 失败，不产生 partial output。若需 object-field projection，必须使用单独 deterministic Action，或改用 aggregator。

## 7. Runtime continuation 与 typed event edge

### 7.1 Internal continuation 没有 user target

以下行为恢复 exact recorded continuation，不暴露 configurable target：

- retryable Action 或 internal Planner failure；
- 与 pending Wait 匹配的 authorized answer；
- 从 exact checkpoint 进行 crash/process recovery；
- 重试一个 exact parallel branch invocation。

Stale、mismatched 或 duplicate Wait answer 被拒绝且不产生 State effect，Wait 保持 pending。若 restoration 已开始但 continuation missing、corrupt、expired 或 binding-mismatched，则 source 发出 `continuation-invalid`。

### 7.2 Typed Runtime event vocabulary

每个 event edge 为 `{id, from, event, to}`，只引用 graph/terminal identity。

| Event | Exact source applicability | Compatible targets |
| --- | --- | --- |
| `budget-exhausted` | 恰好每个 bound budget node，加上每个 `wait-renewal`；其他 source 禁止 | ordinary/parallel/recovery → Wait、recovery 或 `incomplete` terminal；wait-renewal → `incomplete`；cancellation cleanup → `cancelled`；failure/continuation cleanup → `failure` |
| `wait-expired` | 恰好每个 `wait`；其他 source 禁止 | expiry-handling action/recovery、同 logical Wait renewal，或 `incomplete` terminal |
| `cancelled` | 每个 non-terminal node | ordinary source → cancellation cleanup 或 `cancelled`；cancellation cleanup → `cancelled`；failure/continuation cleanup → `failure` |
| `nonretryable-failure` | 每个 Action、parallel deterministic operator/join、wait-renewal、recovery effect 与 cleanup；pure Wait 禁止 | ordinary source → failure cleanup 或 `failure`；cancellation cleanup → `cancelled`；failure/continuation cleanup → `failure` |
| `continuation-invalid` | 恰好每个标记为 possible resume/restore/recovery source 的 node；cleanup 与其他 node 禁止 | continuation/failure cleanup 或 `failure` terminal |

每个 applicable `(source,event)` 恰好有一条 edge。Missing、duplicate、prohibited、unknown-target 或 incompatible-target edge 都拒绝 admission。Normal success/business routing 不能使用 event port。

### 7.3 Cleanup closure 与 sticky disposition

Cancellation cleanup 只能到达 `cancelled` terminal。Failure 与 continuation cleanup 只能到达 `failure` terminal。Cleanup failure、cancellation 或 budget exhaustion 只追加 evidence，不能改变 original disposition，也不能启动 unbounded cleanup cycle。Cleanup `budget-exhausted` edge 按 sticky disposition 直接终止。

当前 Delivery 的 `nonretryable-failure` path 不能再次到达调度原 failed Action 或 deterministic operator 的 node。恢复该能力要求修正 configuration/environment 并启动新的 authorized Delivery。

Runtime disposition 与 terminal kind 是不同层：`INCOMPLETE` 只由 `incomplete` terminal settlement，`FAILED` 只由 `failure`，`CANCELLED` 只由 `cancelled`。

### 7.4 Wait 与 bounded renewal

Wait declaration 携带 `id`、`kind`、`purpose`、适用时 exact answer schema，以及要求 stale/duplicate rejection 的 correlation rule。它不携带 trigger/resume/restart Action target。

`wait-renewal` node 引用同一 logical Wait 并声明 nonnegative `maxRenewals`。Initial count 是 `0`。当 `count < maxRenewals` 时，successful renewal 原子增加 persisted count，创建新的 request identity/version，保持 continuation，并 deterministic return 到同一 Wait。这个 built-in return 不是 user-reconnectable event edge。

当 `count >= maxRenewals` 时不创建 request；renewal node 发出唯一 `budget-exhausted` edge 到 exact `incomplete` terminal。`maxRenewals=0` 表示首次 expiry 后不 renewal。

## 8. State、budget、recovery、terminal 与 Artifact 字段

### 8.1 Workflow State declaration

`state.fields[]` 声明 name、closed JSON-oriented type、可选 items/schema、requiredness 与 description。它不声明 shared-write reducer。已删除的 `overwrite`、`append`、`merge`、`keepFirst`、custom reducer、writer precedence、last-write-wins、parallel append 与 shallow-merge 字段均 invalid。

Mutable Workflow State 归 Runtime 所有。Parallel branch data 只能通过 immutable result identity 与 declared join 穿过 barrier。

### 8.2 Budget

Budget 声明 exact identity、resource dimension（`time|tokens|context|custom`）、适用时 custom name、content-addressed deterministic evaluator registration 与 accounting meaning。Numeric limit 保持为已准入 project/runtime policy。Graph node 绑定 budget；其 exact `budget-exhausted` edge 拥有 target。Budget 永不放松 Gate。

### 8.3 Recovery

Portable recovery policy vocabulary 为 `continue | checkpoint-recovery | intervene | fail`，并始终要求 `noBlindReplay:true`。Recovery 不声明 Action target 或 generic predicate。Effect 发生前重新校验 exact continuation/checkpoint binding。

### 8.4 Terminal

Terminal 声明 exact `id`、`kind`、`meaning`、可选 validator 与 checkpointed-proposal behavior。`kind` 为 `success|failure|incomplete|cancelled|custom`；standard Runtime disposition 只使用 compatible standard kind。同 kind 可以有多个 terminal。

### 8.5 Artifact

Artifact 仍是 immutable versioned output/intermediate，携带 real inline template content 或 exact resource reference、lifecycle、可选 section coverage 与 dependency validity，以及 exact producing/consuming Action。Parallel node 自身不能获得 Agent authority，也不能修改 branch-owned Artifact。

## 9. 最终 machine 字段

JSON Schemas 是 normative。本 catalog 让 downstream reader 无需猜测即可推出其组织。

### 9.1 Package index

Required top-level field：`kind`、`schemaVersion`、`package`、`documents`、`resources`、`authority`、`compatibility`；`environmentRequirements` 可选。

`package` 要求 `name`、`version`、`digest`、`purpose`、`status`、`ownership` 与 `definition`；`admissibility` 可选。`documents` 恰好命名 Workflow/Actions/Roles/Routes/Artifacts/Validation。Resource 分为不相交的 `owned` 与 `referenced` array。Authority order 为 constant，conflict mode 为 `fail-closed`。

### 9.2 Workflow document

Required：`kind`、`schemaVersion`、`workflow`、`state`、`graph`。Optional：`waits`、`budgets`、`recovery`、`handoffs`、`consumedHandoffs`。

`graph` 要求 `start`、`nodes`、`edges`、`eventEdges` 与 `terminals`。Node-specific field 由 §5–§7 的 node-kind union 闭合。Handoff 保持 upstream semantic-only authority 与 byte-faithful downstream consumption；不能携带 downstream Action/Gate/Wait/terminal control。

### 9.3 Action/Role/Route/Artifact document

- Action 使用 §4.1 的两种 authority shape，不含 graph composition 或 Runtime-private identity。
- Role 包含 responsibility、authority boundary 与可选 independence。
- Route 包含 exact Agent/resources/session/access projection，永不授予 provider permission。
- Artifact 包含 exact template、lifecycle、dependency validity、producer 与 consumers。

### 9.4 Validation document

`validators[]` 声明 deterministic input/output。`aggregation[]` 把 parallel node 绑定到其 explicit aggregator Action 与 rule。`review[]` 把每个 lens 绑定到真实 branch Action 与 admitted Finding shape。

每个 `conformance[]` entry 为：

```json
{
  "id": "conf.example",
  "class": "positive | negative | recovery",
  "meaning": "optional human-readable source intent",
  "input": {"operation": "..."},
  "trace": [{"event": "..."}],
  "oracle": {"disposition": "..."}
}
```

Free-string `scenario/preconditions/expected` field 无效。Normative schema 闭合当前 corpus 准入的少量 abstract operation。把它扩张成 production scheduling/persistence semantics 超出本 Contract revision。

### 9.5 Snapshot document

Snapshot 字段与 digest 恰如 §3.3。它不列在 `package.documents` 中，因为它是 admission output，不是 author-owned Definition input。

## 10. Package closure 与 admission check

除非全部满足，否则 admission 拒绝：

1. Package 与六份 document 在 exact Contract revision 下解析并通过 validation；
2. 全部 local identity 唯一，且每个 reference 以预期 kind 解析；
3. owned resource byte 匹配 content identity；referenced resource 拥有 exact comparable locator/identity；
4. Package Definition byte digest 与 canonical Package digest 匹配；
5. graph start/target、parallel branch Action、join Action、routing result vocabulary、Wait/budget/recovery binding、typed event port 与 terminal compatibility 闭合；
6. semantic Planner invocation graph 无 self/mutual cycle；
7. Action→Role→Route authority、instruction resource binding、aggregator ownership 与 review Action ownership 闭合；
8. Snapshot document/resource/route/graph/authority binding、merge proof 与 canonical digest 匹配；
9. forbidden Runtime/provider-native field 不存在；
10. positive、negative、recovery fixture class 齐全，且 executable trace/oracle check 通过。

任何 mismatch 都不存在 ambient fallback 或 substitution。

## 11. Conformance 与 fixture-harness boundary

| Level | Subject | Required evidence |
| --- | --- | --- |
| Document | 单份 JSON document | normative schema pass |
| Package | Package + Definition closure + Snapshot candidate | checker pass、exact digests、executable positive/negative/recovery fixtures |
| Runtime | 后续 implementation lifecycle 中的 selected implementation | 保持 admitted Definition/Snapshot，并通过 applicable Contract corpus，且不泄漏 native identity |

Checked-in corpus runner 只计算当前 fixture 声明的 abstract input 并比较 produced trace/oracle。Runtime conformance 需要后续 Runtime/Execution evidence；本 Contract repository 不提供它。

Revision 处于 `REVIEW_CANDIDATE` 或未发布期间，不得声明 physical conformance。

## 12. Version 与 compatibility

- `agentops.workflow-dsl@0.1.0` 是 `NON_RESOLVING_LEGACY_HISTORY_ONLY`。
- `agentops.workflow-dsl@1.0.0` 是 first-release candidate，在 frozen publication 前保持 non-resolving。
- 一个 Delivery 绑定一个 exact Snapshot 与 Contract revision；
- same identity/different content fail closed；
- `latest` 等 alias 只可在 resolution 前使用，不能进入 Snapshot；
- semantic change、closed-vocabulary change、removed field、changed authority、changed graph/event compatibility 或 changed canonicalization 要求 MAJOR revision；
- optional backward-compatible addition 可用 MINOR；non-semantic correction 可用 PATCH。

SemVer 永不授权 Runtime 隐式扩大 admitted exact binding。

## 13. First-party migration obligation

两套 first-party Definition 是 Contract consumer，必须通过相同 schema/checker rule：

- System Design 保留 `node.sd-09` 为 parallel node，删除 nominal `action.sd-09`，创建独立的 Problem–Solution、Architecture、Quality & Acceptance Reviewer Action，并保留 `action.sd-10` 为 explicit Finding Aggregator；
- Implementation 把其 multi-lens/multi-owner parallel work 移到 graph parallel node，并使用独立 branch Action 与 explicit join ownership；
- 每个旧 generic predicate 都由 producing deterministic Action 的 top-level strict boolean/closed-enum result routing 替代；若需要语义判断，则使用 semantic routing；
- 删除 Wait/retry/crash target，改用 recorded continuation 与 exact typed event edge；
- generator output 必须 byte/digest reproducible，且缺失的 System Design `resources/runtime-custodian.role.md` boundary resource 必须可解析且不得创建 Agent Role。

这些 migration 证明 consumer expressibility。它们不实现或测试计划在后续 iteration 开发的 production Runtime。

## 14. Portable Builder projection

Visual Builder 可以渲染 Action、parallel、Wait、renewal、recovery、cleanup 与 terminal node，以及 normal/typed event port。它必须生成相同 portable JSON，并由相同 schema/checker 验证。它是 authoring projection，不是 semantic 或 authority owner。

## 15. Forbidden portable field

Definition、Package、Snapshot 拒绝 Runtime/provider-native identity 与 API，包括代表性 token：

`stategraph | langgraph | langgraph.json | checkpoint_id | thread_id | memorysaver | sqlitesaver | invocationId | attemptId | providerCheckpoint | sessionId`

它们还拒绝已删除 user surface：

`predicate field/op/value | JSON-path routing | shared State reducer | writer precedence | last-write-wins | parallel append | shallow merge | Action execution.mode=parallel | per-branch Role | optional branch | implicit aggregator | resumeAction | restartAction | targetActionId | ALL | SELECTED`

## 16. Change discipline

本 candidate 仅限 #77 owner decision 与 pre-existing English authority。Reviewer 可以报告 contradiction、schema companion defect、Runtime implementation concern 或 enhancement，但在无需 owner review 的前提下，只有 authority-linked blocker 与 schema companion defect 可以改变当前 candidate。任何新增 required identity、event、Artifact kind、admission condition 或 normative obligation 都需要 exact authority citation 与新的 publication candidate binding。
