# Iteration 4 Wave 2 Evidence Implementation Baseline

| Field | Value |
| --- | --- |
| Result | `PASS` |
| Completed at | `2026-08-25T15:33:18Z` (`2026-08-25T23:33:18+0800`, Asia/Shanghai) |
| Executor | primary coordinator (`/root`) |
| Oracle reviewer | repository-owned TDD tests + Evidence CI + superproject qualification |
| Report owner | primary coordinator (`/root`) |
| Merge owner | primary coordinator (`/root`) |
| User approval | `firestige`: approved Wave 2 baseline, then explicitly corrected Python patch pinning and approved continuation; final rule is supported minors 3.13/3.14 with patch-pinned deployable image only |

## Conclusion

Wave 2 is PASS and Wave 3 is unlocked. Evidence now has a buildable/testable Python scaffold, a universal exact dependency lock, real PostgreSQL 18 migration/integration coverage, a loopback-only supported Compose deployment, and frozen ownership seams. No #48–52 business semantics, npm/Node runtime, PyPI publication, UI/Grafana, application authentication, external PostgreSQL listener, release workflow, or Wave 4 reserved release path was introduced.

## Inputs and outputs

| Kind | Repository / path | Revision |
| --- | --- | --- |
| Input design | superproject `docs/systems/evidence/evidence-system*.md`, `docs/agent-architecture*.md` | Wave 1 merge `1af7cd9fe8ca43659864a47e73f744a55d7d9558` |
| Input component | `firestige/evidence-system` | `981ba59814553ed27deb28fd8a0ac769c73464c7` |
| Component output | `firestige/evidence-system` PR [#1](https://github.com/firestige/evidence-system/pull/1) | merge `52c0dc73b8508b67f3c8978b8716cd291b66a7c8` |
| Superproject output | PR [#101](https://github.com/firestige/workflow-self-recursive/pull/101) | merge/repin `e229313dccb4fdb54444f3eb0408bf5dc5558a00` |
| Approved baseline | `docs/systems/evidence/implementation-baseline.md` plus zh-CN peer | status `APPROVED`, product `0.1.0` |
| Lock | `evidence-system/uv.lock` | SHA-256 `c721a0bcd25199319775d5fcf729ac67272e6c4386886e46204111873e868cc3` |

## Frozen stack and release shape

- Python package compatibility: `>=3.13,<3.15`; development selector `.python-version=3.14`; CI matrix 3.13/3.14. The deployable image separately pins Python 3.14.6 plus immutable multi-platform digest. This replaces the rejected exact `.python-version=3.14.7` proposal and avoids patch-level consumer lock-in.
- HTTP/OTLP: FastAPI 0.141.1, Uvicorn 0.52.4, OTLP/HTTP binary protobuf via `opentelemetry-proto` 1.44.0; no gRPC/Collector dependency.
- PostgreSQL: 18.x support, 18.4 deployment image digest; Psycopg 3.3.4 + pool 3.3.1; Alembic 1.19.1 + SQLAlchemy 2.0.52 for migrations only.
- Tooling: uv 0.11.28, uv_build 0.12.5, Ruff 0.16.4, mypy 2.3.1, pytest 9.1.1, pytest-asyncio 1.4.0, HTTPX 0.28.1.
- Functional release shape: GitHub Release wheel/sdist + immutable manifest, with qualified GHCR OCI manifest digest binding. No PyPI publication is authorized; the npm `wsr-evidence@0.0.1` coordinate remains name reservation only.
- Licenses, maintenance risks, noteworthy transitives, and alternatives are recorded dependency-by-dependency in the approved baseline. Psycopg/psycopg-binary LGPL and bundled-libpq obligations are explicitly carried into release inventory/SBOM qualification.

## Path and ownership map

| Owner | Exact paths | Frozen direction |
| --- | --- | --- |
| shared seams | `src/wsr_evidence/{clock,config,errors,model}.py` | stdlib only; no feature semantics |
| admission | `src/wsr_evidence/admission/**` | may use shared, projection, storage; owns transaction boundary |
| projection | `src/wsr_evidence/projection/**` | pure effects; may use shared only |
| query | `src/wsr_evidence/query/**` | may use shared + storage read ports; cannot mutate core schema |
| retention | `src/wsr_evidence/retention/**` | may use shared + storage maintenance ports; cannot rewrite core schema |
| storage/migration | `src/wsr_evidence/storage/**`, `migrations/**`, `alembic.ini` | owns PostgreSQL adapter/core revisions; runtime never auto-migrates |
| transport/assembly | `src/wsr_evidence/transport/**`, `app.py`, `cli.py` | maps HTTP/OTLP; no domain decisions/direct SQL |
| deployment/tooling | `deployment/**`, `scripts/**`, `Makefile`, `pyproject.toml`, `uv.lock`, `.github/workflows/ci.yml` | Wave 2 build/test/deploy only; Wave 4 reserved release surfaces untouched |

Architecture tests enforce the feature-layer import graph. `TransactionManager` is the DB seam; admission decides begin/end, storage implements it, projection never commits. `Clock` is injected for time-sensitive logic. Stable internal `ErrorCode`/`EvidenceError` categories are mapped/redacted only by transport.

## Commands and oracle results

| Command / oracle | Result |
| --- | --- |
| Initial RED: `uv lock && uv sync ...` | failed because the proposed exact Python 3.14.7 managed build was unavailable; user correction adopted minor-level compatibility |
| TDD RED: focused container-binding test | expected failure: missing `bind_scope`; minimal explicit container boundary then GREEN |
| Python 3.13 isolated unit suite | PASS, 10 tests; initially exposed eager self-annotation failure, fixed with postponed annotations |
| Python 3.14 isolated unit suite | PASS, 10 tests |
| `make check` | PASS: Ruff format/lint, strict mypy, 10 unit tests, wheel + sdist |
| `make integration` | PASS: real PostgreSQL 18.4, Alembic transactional DDL, 1 integration test; ephemeral volume removed |
| `make deployment` | PASS: digest-pinned images built, separate migration completed, service healthy, `GET 127.0.0.1:4318/healthz` returned `{"status":"ok"}`, PostgreSQL had no host port |
| `docker compose -f deployment/compose.yaml config --quiet` | PASS |
| component PR CI | first run [32865878659](https://github.com/firestige/evidence-system/actions/runs/32865878659) caught SQLAlchemy/Psycopg URL mismatch; final PR run [32866032066](https://github.com/firestige/evidence-system/actions/runs/32866032066) PASS, 5/5 jobs |
| component main CI | [32866139892](https://github.com/firestige/evidence-system/actions/runs/32866139892) PASS |
| superproject PR qualification | [32866202980](https://github.com/firestige/workflow-self-recursive/actions/runs/32866202980) PASS |
| superproject main qualification | [32866472620](https://github.com/firestige/workflow-self-recursive/actions/runs/32866472620) PASS |
| `git diff --check` | PASS in component and superproject |

## Build artifacts (local qualification only)

| Artifact | SHA-256 |
| --- | --- |
| `dist/wsr_evidence-0.1.0.tar.gz` | `d9930bdbd0a469830b5412ec1eaaae8b324a08d00eaa3694eed14b2fa71f6f5c` |
| `dist/wsr_evidence-0.1.0-py3-none-any.whl` | `b874cc1cf4ff1974981252990ee047728eea3bc4d10ce1205c9018dcda3f3b45` |

These are local Wave 2 build evidence, not published or immutable release assets. Wave 4 owns release manifests/adapters; Wave 11 owns real publication.

## Issue/disposition notes

- No issue was closed. #48–52 remain OPEN until their later implementation, integration, deployment, and release gates pass.
- The first component CI found that Alembic accepted `postgresql+psycopg://` while Psycopg runtime did not. The final boundary standardizes `WSR_EVIDENCE_DATABASE_URL` on `postgresql://`; only the migration adapter adds the SQLAlchemy driver marker.
- No exit condition fired. The approved stack satisfies standard OTLP, PostgreSQL single-transaction ownership, loopback-only exposure, and automatic-release adapter requirements without an external service or remote control plane.
