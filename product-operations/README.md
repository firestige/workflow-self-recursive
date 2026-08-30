# Product operations

This package owns the top-level orchestration contract for WSR's independently released delivery
carriers. By default the CLI uses `release/product/0.2.0.json` and installs the stable DSH, Compose,
Workflow Package, Copilot and Codex coordinates recorded there. No owner source checkout or build is
required. The fixture adapter remains available only when `--fixture` is supplied explicitly.

## Commands

The stable command set is `setup`, `install`, `preflight`, `config`, `status`, `health`, `logs`,
`start`, `stop`, `restart`, `upgrade`, `rollback`, and `uninstall`. Every command writes one
`wsr.operations.result@1.0.0` JSON result to standard output. Exit code `0` means succeeded, `3` means
blocked/recoverable, and `2` means failed or invalid input.

Create a private configuration from `fixtures/config.json`, replacing its workspace and durable-state
paths and choosing an unused loopback `ports.dsh`, then run the published journey from the repository root:

```sh
node ./product-operations/bin/wsr.mjs setup --config-input /absolute/config.json
node ./product-operations/bin/wsr.mjs install
node ./product-operations/bin/wsr.mjs preflight
node ./product-operations/bin/wsr.mjs start
```

The default state and config are `.wsr/operations` and `.wsr/config.json`. Product operations writes
configuration as mode `0600` and state directories as mode `0700`. Set `DSH_HOME` before every command
when a non-default DSH profile home is required.

Mutable commands run preflight for every component before the first adapter effect. An interrupted
operation records the exact manifest digest and completed component set; only that command with that
manifest may resume. Repeated completion is a no-op. `uninstall` removes only adapter-owned managed
installation state and reports that user configuration and durable data remain preserved. There is no
purge command.
