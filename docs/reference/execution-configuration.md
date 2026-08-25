# Execution configuration reference

`ExecutionInstallationConfig` is the single versioned installation document consumed by every embedding. The canonical schema is `execution.config@1.0.0`; the release ships its JSON Schema, TypeScript types, YAML/JSON defaults, and the `execution-config` CLI. YAML and JSON are parser alternatives, not configuration layers: there is no merge, environment override, content sniffing, or fallback.

Use `execution-config init|copy <absolute-path> [yaml|json]`, fill the required placeholders, then run `execution-config validate <absolute-path>` and `execution-config dump-effective <absolute-path>`. `validate` returns the canonical installation identity. `dump-effective` redacts path and endpoint values and never prints credential material.

## Fields

| Path | Class | Meaning and constraint |
| --- | --- | --- |
| `schemaVersion` | fixed | exactly `execution.config@1.0.0` |
| `paths.repositoryRoot` | required | absolute readable repository root |
| `paths.workspaceRoot` | required | absolute readable workspace containing allowed worktrees |
| `paths.allowedWorktreeRoots` | required | one or more absolute roots within `workspaceRoot` |
| `paths.stateRoot` | required | absolute readable/writable durable root outside repository/workspace |
| `paths.credentialStorePath` | required | absolute readable external credential file |
| `workflowSource` | default | exactly one `github` or `adapter` variant; requests cannot override it |
| `runner.implementationKey` | fixed | `runner.v1` |
| `runner.host.engine` | fixed | `langgraph` |
| `runner.provider.key` | fixed | `dsh` |
| `runner.provider.route` | required | exact provider route projected into admission |
| `runner.provider.modelId` | required | exact external `modelId`; no ambient model fallback |
| `runner.provider.baseUrl` | required | HTTP(S) URL without userinfo |
| `runner.provider.credentialRef` | required | key in the external credential store; not key material |
| `runner.provider.maxParallelToolCalls` | default | integer `1..32` |
| `observation.enabled` | default | `false` constructs no exporter/network resource |
| `observation.endpoint` | conditional | required only when enabled; trusted-preview endpoint is loopback HTTP(S) OTLP base URL |
| `observation.timeoutMs` | default | `100..10000` ms |
| `observation.maxBatchRecords` | default | `1..512`; official OTLP maximum used by this release is `512` |
| `observation.maxBatchBytes` | default | `1024..4194304` bytes; maximum `4 MiB` |
| `observation.flushIntervalMs` | default | `100..10000` ms |
| `observation.shutdownFlushMs` | default | `100..10000` ms bounded best-effort flush |
| `observation.serviceName` | default | non-empty OTLP Resource service name |
| `controls.startupTimeoutMs` | default | `1000..120000` ms |
| `controls.executionTimeoutMs` | default | `1000..86400000` ms |
| `controls.shutdownTimeoutMs` | default | `1000..120000` ms |
| `controls.maxConcurrentDeliveries` | default | installation bound `1..32`; same-worktree contention still returns immediately |
| `controls.allowExplicitRefresh` | default | whether a request may refresh `latest`; never chooses a Source |
| `controls.diagnosticMaxBytes` | default | bounded redacted diagnostic `256..16384` bytes |
| `intake.maxCorrelationBytes` | default | bounded presentation correlation `16..1024` bytes |
| `intake.maxOutputBytes` | default | bounded renderer output `256..65536` bytes |

`paths.allowedWorktreeRoots` remains the authority for the public application surface. The DSH Intake adapter additionally has a private, invocation-scoped admission path: after DSH registry and session-membership validation, it may authorize only the exact canonical conversation workspace supplied for that invocation. This does not widen the configured roots or admit a parent or sibling. Issue #94 will replace the issue #93 workspace-as-worktree transition with Delivery-selected worktrees.

The loader derives `<stateRoot>/packages`, `manifests`, `current-slots`, `staging`, and `runner/{journal,checkpoints,sessions,custody}`. Manifest/current-slot and Runner roots are durable truth; staging is temporary. The DSH plugin's separate `bindingFile` stores adapter-private session↔Delivery bindings and must also remain outside the plugin installation directory.

In the DSH Web product, configuration does not change the UI responsibility boundary: sidebar tabs invoke the existing list/status control-plane operations, while the chat timeline carries interactive commands, Action conversation, ordinary answers, and terminal results. The `/wsr list` and `/wsr status` aliases remain available for compatibility and automation.

The credential document is separate:

```yaml
version: 1
refs:
  DEEPSEEK_API_KEY: replace-with-the-provider-key
```

Only `credentialRef: DEEPSEEK_API_KEY` appears in `ExecutionInstallationConfig`. API key material never enters canonical config, Delivery Manifest/binding, result, diagnostic, or Observation.

## Examples

- [minimal YAML](../../execution-system/config/examples/execution.minimal.yaml) and [minimal JSON](../../execution-system/config/examples/execution.minimal.json) are semantically equivalent and keep Observation disabled.
- [full YAML](../../execution-system/config/examples/execution.full.yaml) and [full JSON](../../execution-system/config/examples/execution.full.json) are semantically equivalent and enable a loopback OTLP endpoint.

The examples use redacted deployment paths and identities. Create those paths and the credential file before validation; the loader verifies canonical accessibility before any component effect.

## Bootstrap and recovery

The application moves through `CREATED → STARTING → RECOVERING → READY → CLOSING → CLOSED`. New execution is accepted only in `READY`. Bootstrap validates config, constructs installation resources, enumerates each occupied canonical-worktree slot, restores exact persisted bindings, joins DSH private bindings, and publishes `READY` only after establishment. Startup failure rolls back in reverse dependency order with a bounded redacted diagnostic.

Closing first rejects new Intake, then quiesces, performs bounded Observation flush, and reverse-disposes Runner-owned `DSH-E` resources. Restart uses persisted Manifest/binding and Runner facts; it does not rebind an old Delivery to changed config, selector, or Package alias. State written after the last durable boundary may be lost.

Version `0.1.0` is an MVP developer preview. Configuration schema `1.0.0` is closed; unknown keys and incompatible schema versions fail closed. A future incompatible configuration schema or public TypeScript surface may require a new package version and explicit migration.
