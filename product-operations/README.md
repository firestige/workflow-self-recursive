# Product operations

This package owns the top-level orchestration contract for WSR's independently released delivery
carriers. By default the CLI resolves the manifest matching its own package version; release `0.5.14-rc.1` uses
`manifests/product-0.5.14-rc.1.json` and installs the stable DSH, Compose,
Workflow Package, Copilot and Codex coordinates recorded there. No owner source checkout or build is
required. The fixture adapter remains available only when `--fixture` is supplied explicitly.

## Self-description and version facts

`wsr help` and `wsr --help` print the complete command, option, and exit-code reference without
reading configuration, installation state, a Product manifest, or an adapter. `wsr --version` follows
the usual CLI convention and prints only the current CLI package version with exit code `0`; it is also
independent of installation state.

`wsr version` writes a structured `wsr.operations.result@1.0.0` result. Its `data` distinguishes four
facts: `cli` is the running package version, `applied` is the last completely committed Product release
and manifest digest (or `null`), `target` is the CLI's default Product release and digest, and
`activeOperation` is a separately verified resumable operation (or `null`). `alignment` is
`not-installed`, `aligned`, or `drifted`. `wsr status` keeps its component inspection results and exposes
the same object at `data.versions`. Missing installation state is not an error; malformed records,
missing retained manifests, and release/digest mismatches fail closed with exit code `2`.

The `active-release.json`, `operations-state.json`, and retained manifests used to establish these facts
remain internal implementation details; callers should use `version` or `status` instead of reading them.

## Commands

The stable command set is `help`, `version`, `setup`, `doctor`, `cleanup`, `install`, `preflight`, `config`, `status`,
`health`, `logs`, `start`, `stop`, `restart`, `upgrade`, `rollback`, and `uninstall`. Every command writes one
`wsr.operations.result@1.0.0` JSON result to standard output, except for the human-readable `help` and
plain-text `--version` shortcuts. Exit code `0` means succeeded, `3` means
blocked/recoverable, and `2` means failed or invalid input.

Create a private configuration from the Release's `wsr-product-0.5.14-rc.1.config.example.json`. It selects
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
configured loopback-port ownership. A new `install` requires a ready diagnosis. `upgrade` instead relies
on every component's ownership-aware preflight, because the running prior release and its artifacts are
valid upgrade inputs rather than drift to remove before the operation.

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

Mutable commands run preflight for every component before the first adapter effect; a new install also
requires a ready doctor result. An interrupted operation records the exact manifest digest and
the current and completed component set. Retrying the same command resumes at that component; a newer
CLI resolves the journal's exact retained or packaged historical manifest before using its own default.
The composite journal never records a component's private steps: each component owner is responsible
for retry, idempotency, compensation, and abort. Rollback first asks the current component to abort its
uncommitted work, then rolls back committed components in reverse order. Component results expose
`preflight`, `apply`, `resume`, `abort`, `rollback`, or `inspect` as their phase. Repeated completion is a
no-op. `uninstall` removes only adapter-owned managed
installation state and reports that user configuration and durable data remain preserved. There is no
purge command. Each successfully applied manifest is retained under `state/releases/<release>/`, with
`state/active-release.json` pointing at the active verified snapshot; mutable-operation manifests are
retained by digest under `state/operation-manifests/` before the first component effect.

Services namespaces are derived from the absolute state directory, so two installations cannot share
a Compose project or Evidence volume. The platform-default installation keeps the historical
`wsr-services` project and `wsr-evidence-data` volume names. Before mutation, both Product Operations
and the Services launcher verify existing ownership. A failed Services start compensates containers
and networks while preserving Evidence data; `abort` uses the same non-destructive `down` boundary.
