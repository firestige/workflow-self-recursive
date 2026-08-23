# System Design Workflow Package 示例

## 1. 文档定位

本文不再把完整 Workflow、Prompt、Skill、模板和伪配置揉进一篇说明文档。实际 design-time package 位于：

- [`workflow-package/system-design/README.md`](../workflow-package/system-design/README.md)：定位与资源索引；
- [`workflow-package/system-design/workflow.md`](../workflow-package/system-design/workflow.md)：流程语义；
- [`workflow-package/system-design/templates/system-design-document.template.md`](../workflow-package/system-design/templates/system-design-document.template.md)：正式文档目录；
- [`workflow-package/system-design/validators/`](../workflow-package/system-design/validators/)：验证入口。

本文只用一个简化执行说明这些资源如何组合。上层通用原则见 [`workflow-composition-model.md`](workflow-composition-model.md)。

## 2. 为什么先 Grilling

System Design 的真实入口通常只有一两句话，例如：

> “给本地 Agent 团队增加一个可以恢复的 System Design 流程。”

这句话不足以直接拆 Module。它没有说明：

- 谁使用、在哪种部署环境使用；
- 什么叫“恢复”；
- 哪些状态必须保留；
- 是否允许用户中途改变需求；
- 性能、可靠性、安全和运维的现实期望；
- 什么结果足以进入实现。

因此 Workflow 先执行 Authority Scan 和 adaptive grilling。Brief template 的 topic 固定覆盖面，Agent 根据 Intake、仓库事实和用户回答动态选择下一问题；它不按预制问卷机械询问。

Grilling 有两个目标：

1. 为正式 System Design 准备足够丰富、经过压力测试的想法与意见；
2. 引导用户消除会改变后续设计的模糊地带。

Solution hypothesis 可以用来暴露取舍，但不会在 Brief 阶段成为正式架构决定。

## 3. 从 Brief 到 Skeleton

假设 grilling 最终确认：

- 用户是单人或小团队；
- 系统部署在自己的受信内网环境；
- 关键场景是中断后从最近有效 checkpoint 恢复；
- 已确认的设计输入不能因恢复而被环境默认配置替换；
- 多租户、公开 SaaS 和复杂企业鉴权不是目标；
- 恢复正确性比减少少量本地存储更重要；
- 具体 checkpoint 间隔需要后续测量。

这些内容被冻结为独立 Confirmed Design Brief。System Designer 不继承 grilling 的隐藏会话，只从 Brief 和显式 authority 开始正式设计。

Skeleton 首先把问题拆成较小问题，例如：

```text
恢复目标
├── 冻结本次执行使用的设计与资源身份
├── 持久化可恢复进度
├── 判断已有进度是否仍与冻结输入相容
├── 恢复或明确拒绝不安全恢复
└── 将运行调优参数交给测试阶段测量
```

System Designer 再依据这些子问题形成 Module、Interface、状态 ownership、关键流程和 View Plan。它不是根据常见“controller/service/repository”目录反推系统结构。

Skeleton 在大量扩写前接受独立 Architecture Direction Review。会决定技术方向能否成立的问题发布 architecture-feasibility Spike；没有结论不能继续扩写。

## 4. NFR 如何进入设计主线

NFR 不在文档末尾作为通用检查表补写。它经历三次语义转换：

```text
Grilling：场景、容忍度和项目背景
→ Skeleton：哪些质量要求改变架构形状
→ System Design：具体机制、取舍和验证关系
```

例如，受信内网、小团队部署意味着复杂 RBAC、独立身份服务和全量审计可能是过度设计；Design 应记录实际 trust boundary，而不是为了“安全章节完整”添加企业机制。Reviewer 同样不能脱离 Project Context 报告“缺少 RBAC”。

相反，如果恢复场景要求冻结输入不被替换，那么身份绑定、checkpoint lineage 和不兼容恢复拒绝就是设计主线，而不是可省略的可靠性细节。

质量要求最终形成：

```text
Problem/Goal → Scenario → Design Driver → Decision/Mechanism
→ Expected Outcome → Verification Method → Acceptance Evidence
```

已经存在明确成败门槛的要求记录为 Fitness Threshold。必须通过实验确定的数值按生命周期分类：

- 技术可行性：Skeleton 后、扩写前完成；
- 实现参数：`IMPLEMENTATION_READY` 前完成；
- 运行调优：测试阶段测量，并带 owner、方法和设计 reopen threshold。

## 5. 单一 Writer 与独立 Review

Confirmed Skeleton 由一个 System Designer 按推理依赖渐进扩写，保存 Draft checkpoint。它不会把章节拆给多个 Agent 并行拼接。

完整 Draft 进入三个相互独立的 Review session：

| Lens | 回答的问题 |
| --- | --- |
| Problem–Solution | Design 是否真的解决 Confirmed Brief，而非另一个相邻问题？ |
| Architecture | 问题拆解、Module、Interface、ownership 和依赖是否形成适合当前项目的整洁结构？ |
| Quality & Acceptance | NFR、风险、测量和验收是否既不缺失也不过度？ |

三个 Reviewer 可以读取同一个 Brief/Draft，但在 barrier 关闭前不能读取彼此结论。重复装载核心设计是获得相互独立判断的成本。

架构坏味道只属于 Architecture Reviewer 的调查方法。发现 shallow/pass-through Module 等模式不自动成为 Finding；Reviewer 必须证明它在当前设计中造成了真实复杂性、风险、测试困难或演进成本。

## 6. Finding 与人工介入

Aggregator 只合并相互印证的 Finding、保存 provenance、识别冲突并路由；不投票、不关闭 Finding、不成为隐藏架构师。

普通 Finding 由 System Designer 定向修订，再由对应 review lens 在 fresh session 中 recheck。真正的 Review 冲突只有同时满足以下条件才进入人工决定：

- 当前证据无法消解；
- 至少两个方向不能同时成立；
- 选择会改变系统边界、责任、质量目标或架构；
- 用户或指定人类确实拥有该决定。

进入 Human Decision Dialogue 前，Workflow 准备完整材料：问题、冲突主张、证据、既有调查、选项、影响、风险、建议和返回 Action。用户可以继续追问或提出新选项；只有明确确认才形成 Human Decision Record。

这既避免用自动化隐藏风险，也避免把可查证事实或普通措辞差异虚报成人工风险。

## 7. Artifact 生命周期与恢复

本 Workflow 不把讨论笔记原地扩写成最终文档：

```text
Raw Intake
→ Confirmed Brief
→ Confirmed Skeleton
→ Working Draft versions
→ DESIGN_REVIEWED
→ IMPLEMENTATION_READY
```

每个派生 artifact 绑定 source commit OID、artifact blob OID 和实际引用的 topic/decision identities。上游版本变化先进入 `STALE_PENDING_IMPACT`；change set 与语义影响分析决定局部失效范围。

设计阶段发现 Brief 问题时，Workflow 创建 Brief Change Request，启动 fresh local-grilling session，冻结新 Brief 版本，并只重新执行受影响的设计与 Review。旧版本仍保留 lineage，不被原地覆盖。

## 8. 完成含义

`IMPLEMENTATION_READY` 不是“文档看起来完整”，而是：

- Brief、Skeleton 和 Design 的依赖当前有效；
- 技术可行性与实现参数在正确生命周期闭合；
- 三个独立 Review 的 Blocking/Major Finding 已由对应 lens 关闭；
- Fresh Reader 只凭文档能正确复述问题、结构、流程、ownership、质量机制和验收；
- deterministic verification 证明文件、链接、ID、traceability、Finding、Spike 和状态转换闭合。

测试阶段的运行调优不由本 Workflow 执行。它作为明确 handoff 进入后续 Implementation/Test Workflow；若测量结果反证设计假设，则创建新的 System Design 版本。

## 9. 示例说明了什么

完整 Workflow Package 的深度来自关注点分离：

- README 负责定位和索引；
- Workflow Definition 负责流程；
- Role prompt 负责“谁”；
- Action Prompt 负责“这次做什么”；
- Skill 负责稳定方法；
- Template 负责产物覆盖面；
- Schema、Validator 和 Conformance 负责闭合与证据；
- Git/artifact identity 负责版本、恢复和影响分析。

实际资源与细节以 [`workflow-package/system-design/`](../workflow-package/system-design/) 为准，本文不再复制一份容易漂移的 package 内容。
