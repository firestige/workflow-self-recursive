# 线上自动化（Copilot cloud agent）——交接文档

这是整套机制里仅有的「只能在 UI 里做」的部分：Copilot automations 在 GitHub 网页界面中创建和管理（没有 REST/GraphQL API 面，`gh` 无法触达）。本文件是交接——复制下面的 prompt，按点击路径创建即可。

什么时候建都行：本地闭环（收集 → 提炼 → 队列）不依赖它也能跑；automation 的规范规则读的是本目录，所以先有文档、后建 automation 的顺序是对的。

参考：
- [About Copilot automations](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-automations)
- [Creating automations](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-automations)
- [Rationale / confidence / approvals](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-automation-rationale-and-approvals)

点击路径：仓库 → **Agents** 标签页 → **Automations** 面板 → **Create new**。

---

## 自动化 1 —— 周维护扫描（建议先建这条）

- **触发**：On a schedule —— **weekly（每周）**。
- **工具**：更新 issue 标签、评论 issue。不给代码推送权限。
- **Prompt**（原样复制；规范规则在仓库里，不写进 prompt）：

> 按本仓库 `.project/requirements/` 中的需求生命周期规则（lifecycle.md、vocabulary.md、card-format.md）审查所有打开的 issue。
>
> 对每个打开的 issue：
> 1. **同类 / 冲突**：如果某卡与另一张打开的卡重复，或与当前主线、已确认的决策冲突，提议关闭它（打 `retired` 标签、在评论里写一行原因）并标记 `needs-decision` 等人工确认——除非证据无歧义且置信度高，此时直接应用。
> 2. **僵尸检测**：如果 90 天以上无互动，加 `stale` 标签并评论「仍然相关吗？回复或留一条评论保留」。豁免：当前里程碑内的卡、`in-progress`、`blocked`、以及创建不足 30 天的卡。如果一张 `stale` 卡又过了 30 天仍无互动，关闭它并打 `retired` 标签、附一行原因。
> 3. **门禁校验**：标了 `ready` 的卡必须有非空的验收标准、优先级标签（`p0`–`p3`）和工作量标签（`xs`–`l`）；不满足的在评论里列出缺失项并标记 `needs-decision`。
>
> 置信度高、证据明确的标签/评论变更：直接应用。任何存疑的：加 `needs-decision` 标签，给人留下带理由的具体建议。

## 自动化 2 —— 新 issue 分类（可选，之后再加）

- **触发**：When an issue is created（issue 创建时）。
- **工具**：更新 issue 标签、评论 issue。
- **Prompt**：

> 按 `.project/requirements/vocabulary.md` 的词汇表给每个新建 issue 打标签：一个类型（`feature`/`bug`/`doc`/`benchmark`/`chore`/`memo`）、一个组件（`component:*`，可推断时）、当 issue 触及系统设计边界时打 `impact:contract-change`。如果 issue 是没有验收标准的裸想法，确保它带 `idea` 标签。不要加优先级和工作量标签——那属于提炼环节。

---

创建后，每条 automation 先按 **Run now** 实测一次，确认行为符合预期再交给定时器。注意：automation 启动的会话对仓库有访问权的人可见；prompt 按设计不含任何敏感信息。
