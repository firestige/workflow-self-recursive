# Evidence 实现基线

| 字段 | 冻结值 |
| --- | --- |
| 状态 | `APPROVED` |
| 批准人 | `firestige`，2026-08-25 |
| 生效范围 | Iteration 4 Wave 2 起 |
| 组件 | `firestige/wsr-evidence` |
| 产品版本 | `0.1.0` developer preview |
| 变更控制 | runtime dependency、service、ownership、deployment、release shape 或 supported platform 的任何变化都需要用户批准 |

本文冻结 Wave 3–11 所需的实现选择。它不定义 admission、projection、query 或 retention 语义；这些语义由各自拥有契约的 wave 定义。

## 1. Runtime 与兼容性

- Python distribution 名为 `wsr-evidence`，import package 为 `wsr_evidence`。
- `requires-python = ">=3.13,<3.15"`。CI 必须覆盖 Python 3.13 和 3.14。`.python-version` 为开发环境选择可用的最新 3.14 patch，不把兼容性收窄到某个 patch。
- 支持的生产目标是仓库提供的 Linux container，平台为 `linux/amd64` 与 `linux/arm64`。macOS 与 Linux 可以直接运行开发工具链。不支持原生 Windows 生产部署；Windows 开发使用 Docker/WSL2。
- 为实现可复现性，可部署 image 固定完整 Python patch 与 immutable image digest。patch 刷新不会改变支持的 Python minor 范围，但修改固定 image 前必须通过两个 minor 的 CI。
- Iteration 4 只支持 PostgreSQL 18.x。scaffold 以多平台 image digest 固定 PostgreSQL 18.4。

Python package 兼容范围有意宽于可部署 image identity。没有 NumPy、Pandas、Flask、Node 或 npm runtime dependency。

## 2. Protocol、storage 与 build stack

| 关注点 | 冻结选择 |
| --- | --- |
| HTTP server | FastAPI + Uvicorn，ASGI |
| OTLP | OTLP/HTTP binary protobuf；使用 `opentelemetry-proto` 生成的 message；无 gRPC server，也不强制部署 Collector |
| Database access | Psycopg 3 async connection 与 `psycopg-pool`；request path 不使用 ORM |
| Schema migration | Alembic + SQLAlchemy Core metadata，作为显式部署操作执行 |
| Test | pytest + pytest-asyncio；HTTP boundary 使用 HTTPX ASGI transport；PostgreSQL integration 使用真实 PostgreSQL 18 service |
| Dependency/build tool | uv universal lock；`uv_build`；wheel 与 sdist |
| Static quality | Ruff format/lint 与严格 mypy |
| Local deployment | Dockerfile + Docker Compose；API 仅发布到宿主机 `127.0.0.1:4318`；PostgreSQL 只在内部网络 |
| 功能 release shape | GitHub Release wheel、sdist、immutable manifest 与 OCI-image digest binding；OCI image 通过 GHCR 发布 |
| 明确不存在 | npm/Node、PyPI publication、Grafana/UI、remote control plane、application authentication、对外发布的 PostgreSQL port |

GitHub Release 是字节权威。Wave 4 必须让 Evidence adapter 从同一个 commit 与 lock 构建所有 asset，qualification 精确消费 candidate asset，并把 GHCR manifest digest 绑定到 immutable release manifest。package metadata 名称不授权 PyPI 发布；npm 上的 `wsr-evidence@0.0.1` 仍只是无关的名称占位。

## 3. 直接依赖锁定

`uv.lock` 记录 Python 3.13–3.14 的精确完整 transitive graph。批准后不得在未重新打开基线的情况下新增或替换直接依赖。

| 依赖 | 版本 | 用途 | License / 维护风险 | 已考虑替代项 |
| --- | ---: | --- | --- | --- |
| FastAPI | 0.141.1 | HTTP routing 与 OpenAPI boundary | MIT；通过精确 lock 和 boundary test 隔离 pre-1.0 API 变化 | Raw Starlette 会减少抽象，但需自行补 validation/response plumbing |
| Uvicorn | 0.52.4 | ASGI process server | BSD-3-Clause；server lifecycle 可在 assembly root 替换 | Hypercorn；当前没有引入另一 server 的需求 |
| opentelemetry-proto | 1.44.0 | 标准 OTLP protobuf message | Apache-2.0；由 contract fixture 控制 profile drift | vendored generated message 容易偏离 OTLP |
| Psycopg | 3.3.4 | Async PostgreSQL driver | LGPL-3.0-only；binary distribution 与 bundled libpq 需要 notice/SBOM 和及时安全更新 | `psycopg[c]` 增加系统构建耦合；asyncpg 会分裂 migration/runtime driver 行为 |
| psycopg-pool | 3.3.1 | 显式 async connection pool | LGPL-3.0-only；pool lifecycle/exhaustion 需要 integration test | 自制 pool 是无必要风险 |
| SQLAlchemy | 2.0.52 | 只用于 migration metadata/dialect | MIT；禁止演变成 request-path 隐式 ORM | raw migration SQL 会减少 metadata 检查 |
| Alembic | 1.19.1 | 有序 PostgreSQL schema revision | MIT；branch conflict 需要 owner discipline | 自制 migration 会重复实现 revision/locking machinery |
| HTTPX | 0.28.1（dev） | In-process ASGI boundary test | BSD-3-Clause；仅测试 | 直接调用 route 不能覆盖 HTTP 行为 |
| pytest | 9.1.1（dev） | Test runner | MIT；低风险 | stdlib unittest 的 fixture/marker 较弱 |
| pytest-asyncio | 1.4.0（dev） | Async test execution | Apache-2.0；低风险 | 手工 event-loop management |
| Ruff | 0.16.4（dev） | Formatter 与 lint | MIT；由 lock 控制格式变化 | Black 加独立 linter 会增加工具 |
| mypy | 2.3.1（dev） | 严格 static type gate | MIT；checker 升级可能暴露新诊断 | Pyright 会引入 Node 工具链 |
| uv_build | 0.12.5（build） | PEP 517 wheel/sdist backend | MIT OR Apache-2.0；精确声明 build backend | Hatchling 成熟，但会增加另一套工具族 |
| uv | 0.11.28（tool） | Resolver、universal lock、environment 与 build invocation | MIT OR Apache-2.0；CI/container 固定工具 | pip-tools 缺少同等 cross-platform project workflow |

值得注意的 locked transitive 包包括 FastAPI 带入的 Pydantic/Starlette、`opentelemetry-proto` 带入的 protobuf，以及所选 Psycopg extra 带入的 `psycopg-binary`。Release qualification 必须生成 dependency/license inventory；Wave 2 不豁免下游 license 义务。

## 4. Ownership 与 dependency direction

| Owner | 路径 | 可依赖 | 不得拥有 |
| --- | --- | --- | --- |
| shared seams | `clock.py`、`errors.py`、`model.py`、`config.py` | Python stdlib | feature-specific semantics |
| storage | `storage/**`、`migrations/**` | shared seams、Psycopg、Alembic/SQLAlchemy migration support | admission decision、projection formula、public query semantics |
| projection | `projection/**` | shared seams | transaction、HTTP、query、retention |
| admission | `admission/**` | shared seams、projection、storage | transport response shaping、query、retention |
| query | `query/**` | shared seams、storage read port | core schema mutation、admission/projection ownership、retention |
| retention | `retention/**` | shared seams、storage maintenance port | core schema rewrite、admission/projection ownership、query API |
| transport | `transport/**` | config/errors/model、admission 与 query use case | domain decision 或 direct SQL |
| assembly | `app.py`、`cli.py` | configuration 与 adapter | business semantics |
| deployment | `deployment/**`、`scripts/**`、`Makefile` | immutable image 与 component command | Wave 4 保留的 release lifecycle path |

Architecture test 强制 feature-layer import 方向。Query 与 retention 可以在自己的 namespace 请求新 storage port，但不得反向依赖 core schema 或重写 core migration。

## 5. Transaction、migration、时间与错误

- **Transaction owner：**admission 决定一个 acceptance transaction 何时开始和结束。storage 实现 `TransactionManager`；projection 生成 effect，但永不 commit。Wave 3 必须在同一个 transaction 内持久化 accepted identity 与全部必需初始 effect，任一失败则整条 record rollback。
- **Migration owner：**storage 拥有 core revision。runtime startup 永不自动 migration。deployment 使用受控的 write-capable migration role 单独运行 `alembic upgrade head`。application role 只拥有 ingest/query/retention 所需权限；inspection/backup 使用独立 read-only role。
- **Database seam：**runtime storage 通过显式 port 使用 Psycopg async connection。SQL/transaction 行为用真实 PostgreSQL 测试；unit test 使用 port 或纯 value，不使用替代数据库。
- **Clock seam：**时间敏感逻辑接收 `Clock` protocol。`SystemClock` 是 assembly 默认值；测试注入 deterministic clock。仅可通过语义明确的 storage port 读取 database time。
- **Error model：**内部失败使用稳定的 `ErrorCode` category 与 `EvidenceError`。transport 拥有 HTTP/OTLP mapping 与 redaction。raw driver error、SQL、credential 与内部 admission disposition 永不越过 API boundary。

## 6. 固定命令与 CI

| 动作 | 命令 |
| --- | --- |
| 同步环境 | `make sync` |
| Format | `make format` |
| Lint/type gate | `make lint` |
| Unit test | `make unit` |
| PostgreSQL integration | `make integration` |
| 应用 migration | `make migration` |
| Local deployment smoke | `make deployment` |
| Wheel/sdist build | `make build` |
| 非容器 aggregate | `make check` |

CI 无需 production secret：运行 Python 3.13/3.14 unit compatibility、format/lint/mypy/build、PostgreSQL 18 migration/integration job、Compose validation 与 container build。Release workflow 和 `release/**` 仍保留给 Wave 4。

## 7. 权威参考

- [Python 3.14 release series](https://www.python.org/downloads/)
- [uv project locking and sync](https://docs.astral.sh/uv/concepts/projects/sync/)
- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [OTLP specification](https://opentelemetry.io/docs/specs/otlp/)
- [Psycopg async and pool documentation](https://www.psycopg.org/psycopg3/docs/advanced/async.html)
- [Alembic documentation](https://alembic.sqlalchemy.org/en/latest/)
- [PostgreSQL 18 documentation](https://www.postgresql.org/docs/18/)

