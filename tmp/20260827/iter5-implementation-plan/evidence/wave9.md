# Iteration 5 Wave 9 Evidence — same-origin serving and local deployment

## Result

- Status: `PASS`.
- Superproject implementation: `79771c3c185a6688d8b74ce037871c838493526c`.
- BI implementation: `wsr-ui@7cfc8a840800ff097e31696ef0079050e5e0c057`.
- Evolution implementation: `evolution-system@a12fc92b68822ed64d07eda0663b96a17b131fb6`.
- Evidence input: `evidence-system@030e6ee14f689b828f62e2c66333a9f0da7d7e00`.
- Issue: [#55](https://github.com/firestige/workflow-self-recursive/issues/55), kept OPEN through Wave12.

The local source build now runs PostgreSQL, Evidence, stateless Evolution and the Nginx-hosted BI SPA.
Only BI binds to host loopback. Evolution and BI have no database endpoint, credential, configuration or
driver; all Evidence reads go through the published HTTP query boundary.

## Serving boundary

- The BI image is a Vite multi-stage build whose runtime contains Nginx, static `dist` and its template;
  it has no Node application server.
- Nginx permits exactly `POST /api/evolution/v1/evaluations:compute` and `GET` on the Evidence Task,
  Fact and Trace query routes. Wrong methods return 405.
- Unknown `/api` and `/v1/evidence` routes, including the two bare namespace roots, return JSON 404
  before SPA fallback. Manifest projection remains server-to-server and is not browser-exposed.
- `/evaluate` and other UI deep links use history fallback. A bounded two-second upstream connect timeout
  prevents a stopped private service from hanging a browser route.

## Evolution runtime boundary

- `WSR_EVOLUTION_CONFIG` points to a closed JSON document containing the Evidence origin, a non-empty
  ordered Workflow source list and lower-only operational limits. Database and credential fields fail
  validation.
- The source-built image bundles the exact Workflow DSL 2 candidate checker and locked Ajv dependency.
  Archive digest, member path/count and expanded bytes are bounded; checking uses an argv-only subprocess
  in a temporary directory, not a shell.
- The production assembly constructs the Evidence HTTP client, digest-exact ordered public Workflow
  resolver and the 12-coordinate Catalog 2.0 candidate compute service. Historical Catalog 1.0's 14
  metrics are not treated as the current implementation target.
- `/healthz` is service-local liveness. Dependency failure is reported by the affected request with a
  typed or gateway error; it does not make an unrelated UI route unavailable.

## Compose and operational boundary

- Four long-lived services plus the one-shot Evidence migration job are source-built from the pinned
  checkout. PostgreSQL is the only external image and is digest-pinned.
- `evidence-db` is internal and contains PostgreSQL/Evidence; `app-tier` contains
  Evidence/Evolution/BI. Runtime network inspection asserts exact endpoint membership. No DNS behavior
  specific to one container engine is used as an authority oracle.
- PostgreSQL, Evidence and Evolution publish no host port. BI defaults to `127.0.0.1:8080`.
- Evolution/BI receive no PostgreSQL environment, secret or dependency. Runtime packages contain no
  PostgreSQL driver. The superproject Docker context excludes `.git`, `tmp` and local secrets.
- File-backed PostgreSQL secrets use an owner-only directory with container-readable `0644` files, so
  the entrypoint can still read them after dropping root privileges on Linux.
- The operations guide assigns TLS, authentication, firewall policy and public risk to an operator who
  overrides loopback binding or adds an external public reverse proxy. No registry or publisher secret
  is defined.

## Validation

```text
wsr-ui: npm run format:check; npm run lint; npm run typecheck; npm test;
        npm run build; npm run browser; npm run deps:check; ./scripts/docker-smoke.sh
evolution-system: make check
superproject: python3 deployment/check-iter5-compose.py;
              docker compose -f deployment/compose.iter5.yaml config --quiet;
              ./deployment/smoke-iter5.sh
```

Results:

- UI format/lint/type/dependency checks PASS; **27 files / 208 tests PASS**; Vite build PASS;
  **15 Playwright tests PASS**; source-built Nginx/upstream smoke PASS.
- Evolution Ruff, strict mypy and package build PASS; **174 tests PASS**; source-built image health and
  bundled Node checker PASS.
- Compose static topology PASS. Full source-build smoke PASS for normal compute, Task query, SPA deep
  link, fail-closed Manifest/API routes, runtime network membership, Evolution-down isolation and
  Evidence-down typed degradation.

## Checklist disposition

| Wave9 exit item | Result | Evidence |
|---|---|---|
| RED integration coverage | `PASS` | exact route/method, bare namespace, config, archive, health, network and degraded tests |
| Nginx + dist runtime | `PASS` | multi-stage image and live two-upstream smoke |
| PostgreSQL only for Evidence | `PASS` | normalized topology, runtime endpoint membership, no Evolution/BI DB config/secret/driver |
| Stateless Evolution | `PASS` | closed config, Evidence HTTP client, ordered digest resolver and 12-metric service assembly |
| Source-only local operations | `PASS` | full Compose build/smoke; no registry, publisher or credential |
| Bounded degradation | `PASS` | stopped Evolution/Evidence affect only dependent routes; SPA remains available |
| Excluded products absent | `PASS` | no workflow-builder, intake sidebar, AI attribution or Workflow mutation service/artifact |
| Independent exit review | `PASS` | exact fixed implementation coordinates; P0=0/P1=0/P2=0 |

## Downstream release

Wave9 closes #55's implementation slice while keeping the issue open through Wave12. Wave10 is released
only for Execution/Evidence independence qualification; it must not introduce an Evolution, Evidence or
BI control edge into Execution.
