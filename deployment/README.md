# Iteration 5 local deployment

`compose.iter5.yaml` builds Evidence, Evolution, and BI from the checked-out submodule sources. It runs
four long-lived services plus the required one-shot Evidence migration job. Only BI is published to the
host, at `127.0.0.1:8080` by default. PostgreSQL and Evidence share the internal `evidence-db` network;
Evidence, Evolution, and BI share `app-tier`. Evolution and BI therefore have neither a PostgreSQL
network path nor database credentials.

## Configuration

Create three distinct local password files outside version control and restrict their permissions:

```sh
mkdir -p deployment/.secrets
chmod 700 deployment/.secrets
openssl rand -out deployment/.secrets/admin-password -hex 32
openssl rand -out deployment/.secrets/backup-password -hex 32
openssl rand -out deployment/.secrets/runtime-password -hex 32
chmod 644 deployment/.secrets/*
```

The directory remains owner-only, while the files must be readable by the PostgreSQL process after
the container entrypoint drops root privileges. Do not use `0600` host files with this file-backed
mount on Linux.

`evolution.config.json` is non-secret. Edit its ordered `workflow_sources` when Deliveries may refer to
forks or other public Workflow repositories. The first exact Package/Snapshot digest match wins. Set
`WSR_EVOLUTION_CONFIG_FILE` to use another file and `WSR_BI_PORT` to change the loopback port.

## Operate

```sh
docker compose -f deployment/compose.iter5.yaml up --build --wait
docker compose -f deployment/compose.iter5.yaml ps
docker compose -f deployment/compose.iter5.yaml down --volumes
```

`bi-app /healthz`, `evidence /healthz`, and `evolution /healthz` are service-local liveness checks. They
do not claim that another service or public GitHub is ready. Upstream failures remain scoped to the
requested route/panel: the SPA and unaffected Evidence/Evolution path remain available.

Run the bounded source-build, routing, and degraded-path smoke with temporary generated secrets:

```sh
./deployment/smoke-iter5.sh
```

The deployment publishes no image and needs no registry or publisher credential.

The loopback bind is the supported local boundary. If a user-owned Compose override or external
reverse proxy exposes BI on `0.0.0.0` or a public interface, that operator also owns TLS,
authentication, firewall policy, and the resulting public-exposure risk.
