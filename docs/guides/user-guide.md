# User guide

English | [中文](user-guide.zh-CN.md)

This guide covers configuration, daily operation, and BI usage for Workflow Self Recursive's local data
services. Complete the [quickstart](quickstart.md) first if the services are not running.

## Deployment boundary

`deployment/compose.yaml` builds and runs PostgreSQL, Evidence, Evolution, and BI from the current
checkout. It does not start DSH or Execution. BI listens only on `127.0.0.1`; the trusted local preview
has no application login and must not be exposed directly to a LAN or the public internet.

Start the services:

```sh
./deployment/start.sh
```

Choose another BI port:

```sh
WSR_BI_PORT=18080 ./deployment/start.sh
```

## Internal database passwords

The launcher creates PostgreSQL admin, runtime, and backup role passwords under the ignored
`deployment/.local/` directory. They only isolate database roles inside Compose. They are not user
accounts, a BI password, or API authentication, and users do not create, copy, or rotate them.

Later starts preserve the values so the existing PostgreSQL volume remains accessible. Do not delete
`deployment/.local/` while retaining the database volume, because replacement values would not match
that database.

## Workflow sources

The default configuration contains the official `firestige/workflow-package` source. Only when
Deliveries may refer to forks or other Workflow repositories must you add ordered `workflow_sources`
in [`deployment/evolution.config.json`](../../deployment/evolution.config.json).
Evolution uses the first exact Package/Snapshot digest match; a repository name or version string alone
is not a match.

To use another configuration file:

```sh
WSR_EVOLUTION_CONFIG_FILE=/absolute/path/evolution.json ./deployment/start.sh
```

## Use BI

In `/evaluate`:

1. Find and select Tasks by display name; the UI falls back to `task_id` when no name exists.
2. Single evaluates one Task set; Compare selects separate left and right Task sets.
3. Evolution computes Metric Results; BI does not compute metrics.
4. Open the receipt/passport from a result to inspect the Evidence and Workflow context used.
5. Fact and Trace drill-down query Evidence directly and retain the originating selection on return.

The URL carries selection identity for refresh, bookmarks, and return navigation. Convenience settings
such as layout and theme remain in browser-local storage.

## Run DeepSeek Harness (DSH) and Execution

See the [DSH Execution quickstart](dsh-execution-quickstart.md) for installation and operation. The
official Observation deployment connection between the local data services and host Execution remains
tracked by [#104](https://github.com/firestige/workflow-self-recursive/issues/104). Until that work is
complete, this guide does not prescribe an unqualified end-to-end connection command.

The current deployment therefore does not start Execution. When Evidence has no Tasks, BI can only
show an empty state; real data must be reported by a separately running Execution through the existing
Observation interface.

## Daily operation

```sh
docker compose -f deployment/compose.yaml ps
docker compose -f deployment/compose.yaml logs -f
docker compose -f deployment/compose.yaml stop
```

`stop` retains Evidence data. To remove containers and networks while retaining the named volume:

```sh
docker compose -f deployment/compose.yaml down
```

To permanently delete all Evidence data:

```sh
docker compose -f deployment/compose.yaml down --volumes
```

The project cannot recover data removed by the last command. Use it only for an intentional local reset.

## Troubleshooting

- If the launcher cannot find Docker or Compose, install Docker Desktop/Engine and start its daemon.
- If port `8080` is occupied, choose another loopback port with `WSR_BI_PORT`.
- If BI loads but one panel fails, inspect `docker compose -f deployment/compose.yaml logs -f`;
  upstream failures remain scoped to their request or panel.
- If the Task list is empty, first confirm that Execution has reported Observations; an empty list is not
  an Evidence health-check failure.

## Delivery qualification

Maintainers can run the isolated smoke:

```sh
./deployment/smoke.sh
```

It temporarily builds the services, checks networks, routes, health, and degraded upstream behavior,
then cleans up. It does not create real Delivery data or replace Execution-to-Evidence E2E validation.

See the [deployment implementation](../../deployment/README.md) for Compose networks, service
privileges, and reverse-proxy boundaries.
