# 发布自动化

Iter4 把发布设施做到 implementation-ready。Wave12 会在所需批准门通过后，用它完成 Contract、Execution 与 Evidence 的真实发布序列。

## 通用生命周期

每个活跃组件都声明 `wsr.release-component@1.0.0`：仓库、`main` 发布分支、`release/next` 触发分支、资产模式、acceptance、publisher adapter、远程 qualification 模式与 `qualified-candidate-exact-assets` stable policy。

唯一支持的状态转换是：

`SOURCE → ACCEPTED → BUILT → MANIFESTED → RC → QUALIFIED → COMPONENT_MERGED → SUPERPROJECT_REPINNED → STABLE`

从精确组件 candidate 创建 `release/next`，并在推送的 commit 中包含不可变 `release/request.json`。该 push 会从同一 ref 运行 candidate workflow，因此首次发布不依赖 workflow 已经存在于默认分支。qualification 后，将组件 squash merge 到 `main`，再把 superproject repin 到组件 main commit。stable 仍指向已经验证的 RC commit 并逐字节复用 RC assets；不得从 squash commit 重建。

| 组件 | 资产与 publisher adapter | 本轮状态 |
|---|---|---|
| Execution | 单个 npm core package + GitHub Release | active |
| DSH bundles | npm 三包集合 + DSH clean-profile + GitHub Release | active（`firestige/wsr-dsh`）|
| Evidence | Python wheel/sdist + GHCR OCI + GitHub Release | active |
| system-contracts | publication records + GitHub Release | active |
| workflow-package | deterministic workflow assets + GitHub Release | active |
| Evolution | parameter-only | Iter4 不发布 |
| BI | excluded | Iter4 不做自动化 |

Python 兼容性按 minor 表达，并在 Python 3.13/3.14 上测试，不锁 Python patch 版本。npm/DSH 规则只属于 Execution adapter。

## 触发与恢复

candidate workflow 会拒绝 push `release/next` 以外的事件或 ref。RC 由 push 触发，commit 中各仓专属的 `release/request.json` 保存固定 candidate tag，以及该 publisher 所需的全部不可变 authority/product ref。例如：

```json
{
  "candidate_tag": "evidence-query-0.1.0-rc.1"
}
```

candidate 不暴露人工或 reusable 入口。恢复方式是在 dev 修正不可变请求或实现后再次 push `release/next`；字节发生变化时使用下一个 RC ordinal。Execution 要求准确的 superproject `authority_ref`（其 Execution submodule 必须指向 candidate）和已跟踪 unified candidate 的 `authority_manifest` 路径。workflow 会物化这些已绑定资产，而不是重新构建。

| 失败点 | 可进入 stable？ | 恢复方式 |
|---|---:|---|
| acceptance/build 失败 | 否 | 修复源码；RC 创建前重跑 |
| RC tag 冲突 | 否 | 核查已有不可变 tag；字节变化时递增 RC 编号 |
| 下载 digest 不一致 | 否 | 保留 URL/digest 调查；不得替换 RC assets |
| 权限拒绝 | 否 | 修复 App/registry 配置；对同一不可变 candidate 重跑 |
| squash 后 candidate 与组件 `main` 不同 | repin 后可以 | 这是预期状态；stable 仍指向 qualified candidate commit |
| DSH 集合中前一包已发布、后一包失败 | 暂不可创建 stable DSH Release | 对同一 `wsr-dsh` manifest 恢复；仅跳过 registry 字节精确一致的包，再继续有序集合 |
| stable 操作失败 | 不得重建 | 从 qualified manifest 与 candidate commit 重试；不得转移 tag |

## GitHub App 身份

批准的 App owner 是 `firestige`，slug 为 `wsr-release`。安装 allowlist 精确包含 `workflow-self-recursive`、`wsr-execution`、`wsr-evidence`、`wsr-evolution`、`wsr-contracts`、`wsr-workflow-package`、`wsr-dsh`、`wsr-ui`。注册权限为 Contents 读写、Workflows 读写、Metadata 只读；每个 release workflow 进一步把本次 token 限到自身仓库及所需权限。

App Client ID 存为 Actions variable `WSR_RELEASE_CLIENT_ID`，PEM private key 存为 Actions secret `WSR_RELEASE_APP_PRIVATE_KEY`；不再使用已弃用的 `app-id` action 输入。build 与 qualification 步骤拿不到 private key 或 installation token。candidate workflow 只有在所有本地资格门禁通过后才生成短期 token，并仅用于 scoped RC Release 写入；stable workflow 只在 final stable GitHub Release 前重新生成 token。若所选 release target 相对默认分支改变了 `.github/workflows/`，mint 时必须同时请求 `contents: write` 与 `workflows: write`，否则即使 Contents 可写，GitHub 仍拒绝创建 Release。GitHub 说明 installation token 一小时过期，并可进一步限制仓库和权限（[workflow 认证](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow)、[installation token 范围](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)、[Release target 权限规则](https://docs.github.com/en/rest/releases/releases#create-a-release)）。

Bootstrap 顺序：注册/安装 App；在每个 active 发布仓库分别配置 variable/secret；确认 PAT/private key 未进入仓库、日志、artifact 或 report；发布批准前只跑无副作用 oracle，真实发布序列只在批准的发布计划内执行。

轮换时先生成第二把 App key，替换 Actions secret、运行静态 attestation，再删除旧 key。事故撤销时禁用/卸载 App 或删除 key，取消发布 run，并保留 run URL 与不可变 digest。break-glass 的含义是暂停发布并由 owner 明确批准恢复 App 路径；host `gh` credential 或个人 PAT 不是发布 fallback。

## npm trusted publishing

Execution 选择 GitHub Actions OIDC trusted publishing，不使用长期 npm automation token。为 `wsr-execution` 配置 owner `firestige`、repository `wsr-execution`、workflow `release-promote.yml`；三个独立版本的 `dsh-wsr-*` 包则绑定 `firestige/wsr-dsh` 的 promotion workflow。两条 workflow 都具有 `id-token: write`，要求 npm 至少为 11.5，只在 GitHub-hosted runner 上发布 immutable qualified tgz，并且没有 `NODE_AUTH_TOKEN`。

npm 要求 npm CLI ≥11.5.1、Node ≥22.14、仓库/workflow 精确匹配以及 `id-token: write`；trusted publishing 使用短期凭据并生成 provenance（[npm trusted publishers](https://docs.npmjs.com/trusted-publishers/)）。若以后用 reusable workflow 包住 npm publish job，必须按 caller workflow 身份重新配置 npm，并让 caller/called 两侧都有 OIDC 权限。

发布后，各 owner adapter 会核对自身 tgz 精确 digest、非空 description、versions 与 `latest`。直接对源码运行 `npm pack`/`npm publish` 会 fail closed；只有对应 verified artifact builder 可打包，promotion 也只接受其 immutable manifest。

## 发布节奏与版本

不做日历强制发布；review 后的变更及其生态 qualification 就绪时再发。遵循 SemVer：向后兼容修复、元数据或自动化修正用 PATCH；向后兼容能力用 MINOR；不兼容的公开契约或安装变化才用 MAJOR。Execution core 与 DSH bundle set 独立版本；各 release manifest 绑定跨 owner 的精确兼容坐标。
