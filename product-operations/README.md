# Product operations

This package owns the top-level orchestration contract for WSR's independently released delivery
carriers. By default the CLI resolves the manifest matching its own package version; release `0.5.6` uses
`manifests/product-0.5.6.json` and installs the stable DSH, Compose,
Workflow Package, Copilot and Codex coordinates recorded there. No owner source checkout or build is
required. The fixture adapter remains available only when `--fixture` is supplied explicitly.

## Commands

The stable command set is `setup`, `doctor`, `cleanup`, `install`, `preflight`, `config`, `status`,
`health`, `logs`, `start`, `stop`, `restart`, `upgrade`, `rollback`, and `uninstall`. Every command writes one
`wsr.operations.result@1.0.0` JSON result to standard output. Exit code `0` means succeeded, `3` means
blocked/recoverable, and `2` means failed or invalid input.

Create a private configuration from the Release's `wsr-product-0.5.6.config.example.json`. It selects
the GitHub Workflow repository and may choose unused loopback ports; it does not select a workspace,
Task, Workflow version, or repository Role Provider binding. Then run the installed CLI from any directory:

```sh
wsr setup --config-input /absolute/config.json
wsr doctor
wsr install
wsr preflight
wsr start
```

`doctor` is read-only and returns `READY`, `CLEANUP_REQUIRED`, or `BLOCKED`. It inventories exact DSH
roots, legacy WSR roots and user patch references, active-release drift, interrupted operations, and
configured loopback-port ownership. `install` and `upgrade` run the same diagnosis before their first
adapter effect and fail closed unless it is ready.

`cleanup` previews an exact allowlisted plan without mutation. `cleanup --apply true` removes only
obsolete WSR package roots, inactive release/download/bundle/cache artifacts, and invalidated operation
records. It refuses symlinked targets and never edits a user patch or stops an externally owned process.
Configuration, durable Execution state, Delivery/checkpoint/binding state, Evidence data and volumes,
credentials, and non-WSR plugins are always preserved. Destructive user-data purge is deliberately not
part of this command.

`start` owns Compose startup as part of the product operation; no separate `docker compose up` is
required. It reconciles managed database credentials against a retained volume before migrations and
starts DSH only after the service adapter succeeds. Failed subprocess diagnostics retain a bounded,
redacted stderr tail. `health` is blocked when any component is unhealthy, while `status` verifies the
required Compose services rather than treating a successful `compose ps` invocation as readiness.

The default config/state locations are `~/Library/Application Support/WSR/config.json` and its `state`
directory on macOS, `${XDG_CONFIG_HOME:-~/.config}/wsr/config.json` and
`${XDG_STATE_HOME:-~/.local/state}/wsr` on Linux, and `%APPDATA%\WSR\config.json` plus
`%LOCALAPPDATA%\WSR\state` on Windows. `--config` and `--state-dir` override them; an absolute
`state.root` in the global config overrides only the default state directory. Product operations writes
configuration as mode `0600` and state directories as mode `0700`.

The active DSH Session supplies the runtime workspace. Each repository owns its optional
`.wsr/role-provider-bindings.json`; product setup never creates or overwrites it. Set `DSH_HOME` before
every command when a non-default DSH profile home is required.

Mutable commands run preflight for every component before the first adapter effect; install and upgrade
also require a ready doctor result. An interrupted operation records the exact manifest digest and
completed component set; only that command with that manifest may resume. Repeated completion is a
no-op. `uninstall` removes only adapter-owned managed
installation state and reports that user configuration and durable data remain preserved. There is no
purge command. Each successfully applied manifest is retained under `state/releases/<release>/`, with
`state/active-release.json` pointing at the active verified snapshot.
