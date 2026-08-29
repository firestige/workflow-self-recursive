# 发布自动化

Iter4 把发布设施做到 implementation-ready。Wave12 会在所需批准门通过后，用它完成 Contract、Execution 与 Evidence 的真实发布序列。

## 通用生命周期

每个活跃组件都声明 `wsr.release-component@1.0.0`：仓库、`main` 发布分支、`release/next` 触发分支、资产模式、acceptance、publisher adapter、远程 qualification 模式与 `qualified-candidate-exact-assets` stable policy。

唯一支持的状态转换是：

`SOURCE → ACCEPTED → BUILT → MANIFESTED → RC → QUALIFIED → COMPONENT_MERGED → SUPERPROJECT_REPINNED → STABLE`

从精确组件 candidate 创建 `release/next`，并在推送的 commit 中包含不可变 `release/request.json`。该 push 会从同一 ref 运行 candidate workflow，因此首次发布不依赖 workflow 已经存在于默认分支。qualification 后，将组件 squash merge 到 `main`，再把 superproject repin 到组件 main commit。stable 仍指向已经验证的 RC commit 并逐字节复用 RC assets；不得从 squash commit 重建。

| 组件 | 资产与 publisher adapter | 本轮状态 |
|---|---|---|
| Execution | npm 双包 + DSH install + GitHub Release | active |
| Evidence | Python wheel/sdist + GHCR OCI + GitHub Release | active |
| system-contracts | publication records + GitHub Release | active |
| workflow-package | deterministic workflow assets + GitHub Release | active |
| Evolution | parameter-only | Iter4 不发布 |
| BI | excluded | Iter4 不做自动化 |

Python 兼容性按 minor 表达，并在 Python 3.13/3.14 上测试，不锁 Python patch 版本。npm/DSH 规则只属于 Execution adapter。

## 触发与恢复

candidate workflow 会拒绝 `release/next` 之外的 ref。首次 RC 由 push 触发，commit 中的 `release/request.json` 保存固定请求。Contract 与 Evidence 请求只包含 `candidate_tag`；Execution 还包含 `local_manual_e2e_evidence`、`authority_ref` 和 `authority_manifest`。例如：

```json
{
  "candidate_tag": "evidence-query-0.1.0-rc.1"
}
```

workflow 进入默认分支后，仍可从 `release/next` 使用 `workflow_dispatch` 作为等价恢复入口，并提供相同字段。Execution 要求一个准确的 superproject `authority_ref`（其 Execution submodule 必须指向 candidate）、指向已跟踪 unified candidate 的 `authority_manifest` 路径，以及带真实 credential 的本地 DSH evidence GitHub issue/comment URL。workflow 会物化这些已绑定资产，而不是重新构建。

| 失败点 | 可进入 stable？ | 恢复方式 |
|---|---:|---|
| acceptance/build 失败 | 否 | 修复源码；RC 创建前重跑 |
| RC tag 冲突 | 否 | 核查已有不可变 tag；字节变化时递增 RC 编号 |
| 下载 digest 不一致 | 否 | 保留 URL/digest 调查；不得替换 RC assets |
| 权限拒绝 | 否 | 修复 App/registry 配置；对同一不可变 candidate 重跑 |
| squash 后 candidate 与组件 `main` 不同 | repin 后可以 | 这是预期状态；stable 仍指向 qualified candidate commit |
| Execution core 已发布、intake 失败 | 暂不可 stable | 对同一 manifest 恢复；仅当 registry 字节一致时跳过 core，再发 intake |
| stable 操作失败 | 不得重建 | 从 qualified manifest 与 candidate commit 重试；不得转移 tag |

## GitHub App 身份

批准的 App owner 是 `firestige`，slug 为 `wsr-release`。安装 allowlist 精确包含 `workflow-self-recursive`、`wsr-execution`、`wsr-evidence`、`wsr-evolution`、`wsr-contracts`、`wsr-workflow-package`、`wsr-dsh`。注册权限为 Contents 读写、Workflows 读写、Metadata 只读；每个 promotion workflow 进一步把本次 token 限到自身仓库和 `contents: write`。

App ID 存为 Actions variable `WSR_RELEASE_APP_ID`，PEM private key 存为 Actions secret `WSR_RELEASE_APP_PRIVATE_KEY`。build 与 qualification 步骤拿不到 private key 或 installation token。candidate workflow 只有在所有本地资格门禁通过后才生成短期 token，并仅用于 scoped RC Release 写入；stable workflow 只在 final stable GitHub Release 前重新生成 token。若所选 release target 相对默认分支改变了 `.github/workflows/`，mint 时必须同时请求 `contents: write` 与 `workflows: write`，否则即使 Contents 可写，GitHub 仍拒绝创建 Release。GitHub 说明 installation token 一小时过期，并可进一步限制仓库和权限（[workflow 认证](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow)、[installation token 范围](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)、[Release target 权限规则](https://docs.github.com/en/rest/releases/releases#create-a-release)）。

Bootstrap 顺序：注册/安装 App；在四个 active 发布仓库分别配置 variable/secret；确认 PAT/private key 未进入仓库、日志、artifact 或 report；发布批准前只跑无副作用 oracle，真实发布序列只在 Wave12 执行。

轮换时先生成第二把 App key，替换 Actions secret、运行静态 attestation，再删除旧 key。事故撤销时禁用/卸载 App 或删除 key，取消发布 run，并保留 run URL 与不可变 digest。break-glass 的含义是暂停发布并由 owner 明确批准恢复 App 路径；host `gh` credential 或个人 PAT 不是发布 fallback。

## npm trusted publishing

Execution 选择 GitHub Actions OIDC trusted publishing，不使用长期 npm automation token。在 npmjs.com 为 `wsr-execution` 与 `dsh-wsr-execution` 分别配置：owner `firestige`、repository `execution-system`、workflow `release-promote.yml`，除非未来 workflow 使用 environment，否则 environment 留空。workflow 具有 `id-token: write`，会验证 npm 至少为 11.5，在 GitHub-hosted runner 上只按 core→intake 发布两个 qualified tgz，并且没有 `NODE_AUTH_TOKEN`。

npm 要求 npm CLI ≥11.5.1、Node ≥22.14、仓库/workflow 精确匹配以及 `id-token: write`；trusted publishing 使用短期凭据并生成 provenance（[npm trusted publishers](https://docs.npmjs.com/trusted-publishers/)）。若以后用 reusable workflow 包住 npm publish job，必须按 caller workflow 身份重新配置 npm，并让 caller/called 两侧都有 OIDC 权限。

发布后 adapter 会核对两包 tgz 精确 digest、非空 description、versions 与 `latest`。直接对源码运行 `npm pack`/`npm publish` 会 fail closed；只有 verified artifact builder 可打包，promotion 也只接受其 immutable manifest。

## 发布节奏与版本

不做日历强制发布；review 后的变更及其生态 qualification 就绪时再发。遵循 SemVer：向后兼容修复、元数据或自动化修正用 PATCH；向后兼容能力用 MINOR；不兼容的公开契约或安装变化才用 MAJOR。Execution 两包保持 lockstep；其他组件按实际产物独立版本化。
