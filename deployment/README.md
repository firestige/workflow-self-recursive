# Local deployment

`compose.yaml` is the developer qualification fixture. It builds Evidence, Evolution, and BI from the
checked-out submodule sources. It runs four long-lived services plus the required one-shot Evidence
migration job. Only BI is published to the host, at `127.0.0.1:8080` by default. PostgreSQL and
Evidence share the internal `evidence-db` network;
Evidence, Evolution, and BI share `app-tier`. Evolution and BI therefore have neither a PostgreSQL
network path nor database credentials.

It is not the supported end-user installation path. Release maintainers use the separate tooling under
`deployment/published/` to generate a versioned, immutable-image Compose bundle. That bundle remains
unavailable to end users until its image and clean-machine qualification gates pass; see the current
[quickstart status](../docs/guides/quickstart.md).

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
# Qualification modes

`accept-current-branch.sh` is a current-source composition check. It intentionally builds local archives and rewrites a temporary Product manifest, so its result is never evidence for a published coordinate. Invoke it with an explicit Product manifest; that manifest is the sole authority for the DSH bundle, Execution owner, Services/Compose, Workflow source, and Provider coordinates:

```sh
./deployment/accept-current-branch.sh \
  --product-manifest product-operations/manifests/product-0.5.13.json
```

The normal workload uses the Product manifest's exact Workflow source selector. An extra selector is allowed only as an explicitly non-composition diagnostic:

```sh
./deployment/accept-current-branch.sh \
  --product-manifest product-operations/manifests/product-0.5.13.json \
  --diagnostic-selector hello-world-workflow@0.2.0
```

Each invocation has an independent run identity covering its Product state, DSH home, Compose project and Evidence volume, workspace, and temporary assets. A failed stage first preserves `coordinates.json`, `lifecycle.log`, and a structured result under the selected temporary parent, then removes only resources whose names derive from that identity. `WSR_ACCEPT_RUN_ID` is intended for deterministic automation and must itself be unique; an existing failure-evidence directory is never overwritten.

`verify-owner-release.mjs` is the published-coordinate gate. It checks the Product Execution pin against DSH's single owner-release record, resolves the remote release tag to the recorded source revision, downloads the exact remote artifact, and verifies its SHA-256 digest. It does not accept a local archive override.
