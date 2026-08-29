# 线上自动化（Copilot cloud agent）——交接文档

这是整套机制里仅有的「只能在 UI 里做」的部分：Copilot automations 在 GitHub 网页界面中创建和管理（没有 REST/GraphQL API 面，`gh` 无法触达）。本文件是交接——复制下面的 prompt，按点击路径创建即可。

什么时候建都行：本地闭环（收集 → 提炼 → 队列）不依赖它也能跑；automation 的规范规则读的是本目录，所以先有文档、后建 automation 的顺序是对的。

**可用性**：Automations 是 GitHub 服务端灰度功能（页面数据里的 `automationsVisible` 字段决定面板是否显示），不是每个账号/仓库都有。如果仓库 → **Agents** 标签页看不到 **Automations** 面板，说明该功能尚未对你开放——跳过这一步即可，本地闭环不受影响，维护扫描按文末的[手动兜底](#手动兜底--周维护扫描无线上自动化时)执行。

语言规范：prompt 用英文写（给机器的指令）；automation 在 issue 上生成的评论用中文（与卡片内容语言一致，见 [card-format.md](card-format.md)）。

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

> Review all open issues against the requirement lifecycle rules in this repository's `.project/requirements/` (lifecycle.md, vocabulary.md, card-format.md).
>
> For each open issue:
> 1. **Duplicates / conflicts**: if a card duplicates another open card, or conflicts with the current main line or a confirmed decision, propose closing it (add the `retired` label and a one-line reason in a comment) and add `needs-decision` for human confirmation — unless the evidence is unambiguous and confidence is high, in which case apply directly.
> 2. **Stale detection**: if there has been no interaction for 90+ days, add the `stale` label and comment 「仍然相关吗？回复或留一条评论保留」. Exempt: cards in the current milestone, `in-progress`, `blocked`, and cards created fewer than 30 days ago. If a `stale` card still has no interaction after another 30 days, close it with the `retired` label and a one-line reason.
> 3. **Gate check**: a card labeled `ready` must have non-empty acceptance criteria, a priority label (`p0`–`p3`) and an effort label (`xs`–`l`); if not, list the missing items in a comment and add `needs-decision`.
>
> Apply label/comment changes directly when confident and clearly evidenced. Anything doubtful: add the `needs-decision` label and leave a concrete suggestion with a reason.
>
> Write all issue comments in Chinese (repo issue language policy: the template is bilingual, mechanism-generated content is Chinese, user content is unrestricted).

## 自动化 2 —— 新 issue 分类（可选，之后再加）

- **触发**：When an issue is created（issue 创建时）。
- **工具**：更新 issue 标签、评论 issue。
- **Prompt**：

> Label each newly created issue according to the vocabulary in `.project/requirements/vocabulary.md`: one type (`feature`/`bug`/`doc`/`benchmark`/`chore`/`memo`), one component (`component:*`, when inferable), and `impact:contract-change` when the issue touches system design boundaries. If the issue is a bare idea without acceptance criteria, make sure it carries the `idea` label. Do not add priority or effort labels — that belongs to the refine stage.
>
> Write any comments in Chinese (repo issue language policy: the template is bilingual, mechanism-generated content is Chinese, user content is unrestricted).

---

创建后，每条 automation 先按 **Run now** 实测一次，确认行为符合预期再交给定时器。注意：automation 启动的会话对仓库有访问权的人可见；prompt 按设计不含任何敏感信息。

---

## 手动兜底 —— 周维护扫描（无线上自动化时）

面板不可见时，用下面这套命令手动跑周扫描：确定性部分用命令，判断部分仍是你。

1. **待决队列**：`gh issue list --repo <owner/repo> --label needs-decision --state open` —— 所有 `needs-decision` 的卡，逐张拍板。
2. **门禁校验**：`pctl req scan`（确定性部分自动列出缺失项）——逐张检查正文有验收标准、且有 `p0`–`p3` 与 `xs`–`l` 标签；缺失的加 `needs-decision` 并在评论里列出缺项。
3. **僵尸检测**：`pctl req scan`（确定性部分自动列出候选）——超过 90 天未更新的加 `stale` 并评论「仍然相关吗？回复或留一条评论保留」；已 `stale` 又 30 天无互动的关闭并打 `retired` + 一行原因（`pctl req retire`）。豁免：当前里程碑、`in-progress`、`blocked`、创建不足 30 天。
4. **同类 / 冲突**：凭判断力自查，拿不准的挂 `needs-decision` 等裁决（`pctl req flag`）。

第 2、3 步是确定性的，可以包成一个 cron 脚本（GitHub Actions 定时工作流）自动跑——需要的话再扩展。
