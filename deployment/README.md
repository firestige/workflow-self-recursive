# Local deployment

`compose.yaml` builds Evidence, Evolution, and BI from the checked-out submodule sources. It runs
four long-lived services plus the required one-shot Evidence migration job. Only BI is published to the
host, at `127.0.0.1:8080` by default. PostgreSQL and Evidence share the internal `evidence-db` network;
Evidence, Evolution, and BI share `app-tier`. Evolution and BI therefore have neither a PostgreSQL
network path nor database credentials.

This file documents the deployment implementation for maintainers. Users should begin with the
[quickstart](../docs/guides/quickstart.md) and continue with the [user guide](../docs/guides/user-guide.md).

## Start

From the repository root, run:

```sh
./deployment/start.sh
```

The launcher checks Docker Compose, creates any missing internal PostgreSQL role passwords under the
ignored `deployment/.local/` directory, builds the source checkout, waits for the services, and prints
the BI URL. Those generated values separate the database admin, runtime, and backup roles inside the
Compose network. They are not BI credentials, API authentication, or user-managed configuration.
The local preview has no application login and publishes BI only on loopback.

The launcher preserves existing generated values so that a retained PostgreSQL volume remains
accessible after restart. Set `WSR_BI_PORT` to change the loopback port.

## Configuration

`evolution.config.json` is non-secret. Edit its ordered `workflow_sources` when Deliveries may refer to
forks or other public Workflow repositories. The first exact Package/Snapshot digest match wins. Set
`WSR_EVOLUTION_CONFIG_FILE` to use another file.

## Operate

```sh
docker compose -f deployment/compose.yaml ps
docker compose -f deployment/compose.yaml logs -f
docker compose -f deployment/compose.yaml stop
```

`stop` retains the Evidence database. `down` also retains its named volume. Use `down --volumes` only
when intentionally deleting all local Evidence data.

`bi-app /healthz`, `evidence /healthz`, and `evolution /healthz` are service-local liveness checks. They
do not claim that another service or public GitHub is ready. Upstream failures remain scoped to the
requested route/panel: the SPA and unaffected Evidence/Evolution path remain available.

Run the bounded source-build, routing, and degraded-path smoke in an isolated temporary stack:

```sh
./deployment/smoke.sh
```

The deployment publishes no image and needs no registry or publisher credential.

The loopback bind is the supported local boundary. If a user-owned Compose override or external
reverse proxy exposes BI on `0.0.0.0` or a public interface, that operator also owns TLS,
authentication, firewall policy, and the resulting public-exposure risk.
