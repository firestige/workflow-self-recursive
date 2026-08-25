# Evidence Implementation Baseline

| Field | Frozen value |
| --- | --- |
| Status | `APPROVED` |
| Approved by | `firestige`, 2026-08-25 |
| Applies from | Iteration 4 Wave 2 |
| Component | `firestige/evidence-system` |
| Product version | `0.1.0` developer preview |
| Change control | Any runtime dependency, service, ownership, deployment, release-shape, or supported-platform change requires user approval |

This document freezes the implementation choices needed by Waves 3–11. It does not define admission, projection, query, or retention semantics; their contract-owning waves do that.

## 1. Runtime and compatibility

- The Python distribution is `wsr-evidence`; its import package is `wsr_evidence`.
- `requires-python = ">=3.13,<3.15"`. CI must exercise Python 3.13 and 3.14. `.python-version` selects the latest available 3.14 patch for development and does not narrow compatibility to one patch.
- The supported production target is the repository-provided Linux container on `linux/amd64` and `linux/arm64`. macOS and Linux may run the development toolchain directly. Native Windows production is not supported; Windows development uses Docker/WSL2.
- Deployable images pin a full Python patch and immutable image digest for reproducibility. A patch refresh does not change the supported Python minor range, but must pass both-minor CI before the pinned image changes.
- PostgreSQL 18.x is the only supported database major in Iteration 4. The scaffold pins PostgreSQL 18.4 by multi-platform image digest.

Python package compatibility is deliberately broader than the deployable image identity. There is no NumPy, Pandas, Flask, Node, or npm runtime dependency.

## 2. Protocol, storage, and build stack

| Concern | Frozen choice |
| --- | --- |
| HTTP server | FastAPI + Uvicorn, ASGI |
| OTLP | OTLP/HTTP binary protobuf; generated messages from `opentelemetry-proto`; no gRPC server and no mandatory Collector |
| Database access | Psycopg 3 async connections and `psycopg-pool`; no ORM in the request path |
| Schema migration | Alembic with SQLAlchemy Core metadata, executed as an explicit deployment operation |
| Tests | pytest + pytest-asyncio; HTTP boundary tests use HTTPX ASGI transport; PostgreSQL integration tests use a real PostgreSQL 18 service |
| Dependency/build tool | uv universal lock; `uv_build`; wheel and sdist |
| Static quality | Ruff formatting/lint and strict mypy |
| Local deployment | Dockerfile plus Docker Compose; API host publication is `127.0.0.1:4318`; PostgreSQL is internal-only |
| Functional release shape | GitHub Release wheel, sdist, immutable manifest, and OCI-image digest binding; OCI image published through GHCR |
| Explicitly absent | npm/Node, PyPI publication, Grafana/UI, remote control plane, application authentication, externally published PostgreSQL port |

GitHub Release is the byte authority. Wave 4 must make the Evidence adapter build all assets from one commit and lock, qualify the exact candidate assets, and bind the GHCR manifest digest to the immutable release manifest. The package metadata name does not authorize PyPI publication; `wsr-evidence@0.0.1` on npm remains unrelated name reservation only.

## 3. Direct dependency lock

`uv.lock` records the exact full transitive graph for Python 3.13–3.14. Direct dependencies may not be added or replaced after this approval without reopening the baseline.

| Dependency | Version | Purpose | License / maintenance risk | Considered alternative |
| --- | ---: | --- | --- | --- |
| FastAPI | 0.141.1 | HTTP routing and OpenAPI boundary | MIT; pre-1.0 API churn is contained by exact lock and boundary tests | Raw Starlette would reduce abstraction but add validation/response plumbing |
| Uvicorn | 0.52.4 | ASGI process server | BSD-3-Clause; server lifecycle remains replaceable at the assembly root | Hypercorn; no current requirement justifies another server |
| opentelemetry-proto | 1.44.0 | Standard OTLP protobuf messages | Apache-2.0; profile drift is controlled by contract fixtures | Vendored generated messages risk divergence from OTLP |
| Psycopg | 3.3.4 | Async PostgreSQL driver | LGPL-3.0-only; binary distribution and bundled libpq require notices/SBOM and prompt security refreshes | `psycopg[c]` adds system build coupling; asyncpg would split migration/runtime driver behavior |
| psycopg-pool | 3.3.1 | Explicit async connection pool | LGPL-3.0-only; pool lifecycle and exhaustion require integration tests | Hand-written pool is unnecessary risk |
| SQLAlchemy | 2.0.52 | Migration metadata/dialect support only | MIT; prohibited from becoming implicit request-path ORM | Raw migration SQL reduces metadata checks |
| Alembic | 1.19.1 | Ordered PostgreSQL schema revisions | MIT; branch conflicts require owner discipline | Bespoke migrations would recreate revision/locking machinery |
| HTTPX | 0.28.1 (dev) | In-process ASGI boundary tests | BSD-3-Clause; test-only | Direct route calls would not exercise HTTP behavior |
| pytest | 9.1.1 (dev) | Test runner | MIT; low | stdlib unittest has weaker fixtures/markers |
| pytest-asyncio | 1.4.0 (dev) | Async test execution | Apache-2.0; low | Manual event-loop management |
| Ruff | 0.16.4 (dev) | Formatter and lint | MIT; formatting changes are lock-controlled | Black plus separate linters adds tools |
| mypy | 2.3.1 (dev) | Strict static type gate | MIT; checker upgrades can reveal new diagnostics | Pyright would add a Node-based toolchain |
| uv_build | 0.12.5 (build) | PEP 517 wheel/sdist backend | MIT OR Apache-2.0; exact build backend is declared | Hatchling is mature but adds another tool family |
| uv | 0.11.28 (tool) | Resolver, universal lock, environment, build invocation | MIT OR Apache-2.0; CI and container pin the tool | pip-tools lacks the same cross-platform project workflow |

Noteworthy locked transitives include Pydantic/Starlette through FastAPI, protobuf through `opentelemetry-proto`, and `psycopg-binary` through the selected Psycopg extra. Release qualification must produce dependency/license inventory; Wave 2 does not waive downstream license obligations.

## 4. Ownership and dependency direction

| Owner | Paths | May depend on | Must not own |
| --- | --- | --- | --- |
| shared seams | `clock.py`, `errors.py`, `model.py`, `config.py` | Python stdlib | Feature-specific semantics |
| storage | `storage/**`, `migrations/**` | shared seams, Psycopg, Alembic/SQLAlchemy migration support | Admission decisions, projection formulas, public query semantics |
| projection | `projection/**` | shared seams | Transactions, HTTP, query, retention |
| admission | `admission/**` | shared seams, projection, storage | Transport response shaping, query, retention |
| query | `query/**` | shared seams, storage read ports | Core schema mutation, admission/projection ownership, retention |
| retention | `retention/**` | shared seams, storage maintenance ports | Core schema rewrite, admission/projection ownership, query API |
| transport | `transport/**` | config/errors/model, admission and query use cases | Domain decisions or direct SQL |
| assembly | `app.py`, `cli.py` | configuration and adapters | Business semantics |
| deployment | `deployment/**`, `scripts/**`, `Makefile` | immutable images and component commands | Release lifecycle paths reserved for Wave 4 |

The architecture test enforces feature-layer imports. Query and retention may request new storage ports in their own namespaces, but may not reverse-depend core schema or rewrite core migrations.

## 5. Transactions, migrations, time, and errors

- **Transaction owner:** admission decides when the one acceptance transaction begins and ends. Storage implements `TransactionManager`; projection produces effects but never commits. Wave 3 must persist accepted identity plus all required initial effects in that one transaction and roll back the whole record on failure.
- **Migration owner:** storage owns core revisions. Runtime startup never auto-migrates. Deployment runs `alembic upgrade head` separately using a controlled write-capable migration role. The application role owns only required ingest/query/retention privileges; inspection/backup uses a distinct read-only role.
- **Database seam:** runtime storage uses Psycopg async connections behind explicit ports. Tests use real PostgreSQL for SQL/transaction behavior; unit tests use ports or pure values, not a substitute database.
- **Clock seam:** time-sensitive logic receives the `Clock` protocol. `SystemClock` is the assembly default; tests inject a deterministic clock. Database time may be read only through a storage port whose semantics are explicit.
- **Error model:** internal failures use stable `ErrorCode` categories and `EvidenceError`. Transport owns HTTP/OTLP mapping and redaction. Raw driver errors, SQL, credentials, and internal admission dispositions never cross the API boundary.

## 6. Fixed commands and CI

| Action | Command |
| --- | --- |
| Synchronize | `make sync` |
| Format | `make format` |
| Lint/type gate | `make lint` |
| Unit tests | `make unit` |
| PostgreSQL integration | `make integration` |
| Apply migrations | `make migration` |
| Local deployment smoke | `make deployment` |
| Wheel/sdist build | `make build` |
| Non-container aggregate | `make check` |

CI runs without production secrets: Python 3.13/3.14 unit compatibility, formatting/lint/mypy/build, a PostgreSQL 18 migration/integration job, Compose validation, and container build. Release workflows and `release/**` remain reserved to Wave 4.

## 7. Authoritative references

- [Python 3.14 release series](https://www.python.org/downloads/)
- [uv project locking and sync](https://docs.astral.sh/uv/concepts/projects/sync/)
- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [OTLP specification](https://opentelemetry.io/docs/specs/otlp/)
- [Psycopg async and pool documentation](https://www.psycopg.org/psycopg3/docs/advanced/async.html)
- [Alembic documentation](https://alembic.sqlalchemy.org/en/latest/)
- [PostgreSQL 18 documentation](https://www.postgresql.org/docs/18/)

