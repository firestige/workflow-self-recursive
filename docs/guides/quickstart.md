# Quickstart

English | [中文](quickstart.zh-CN.md)

This guide rebuilds the Iter6 reference assembly on one trusted personal computer. It installs the
top-level operations bundle from the `product-0.3.1` GitHub Release and consumes only that bundle's
stable compatibility manifest. No WSR source checkout or owner build is part of the product path.

## 1. Prepare configuration

Prerequisites are DSH `0.1.1-rc.2`, Node `24.12.0`, npm `11.6.2`, Docker with Compose, Codex CLI
`0.144.5` logged in locally, and an available local GitHub Copilot login. Install the exact operations
asset and download its editable configuration example:

```sh
npm install --global https://github.com/firestige/workflow-self-recursive/releases/download/product-0.3.1/wsr-product-operations-0.3.1.tgz
curl --proto '=https' --tlsv1.2 --fail --location --remote-name \
  https://github.com/firestige/workflow-self-recursive/releases/download/product-0.3.1/wsr-product-0.3.1.config.example.json
```

The example selects the GitHub repository that publishes Workflow Packages. Service ports are optional;
the shown values are the defaults. It contains no workspace, Workflow selector, Task, repository filter,
Role binding, or credential. To override the OS-level state location, add an absolute `state.root`.

```sh
wsr setup --config-input /absolute/config.json
wsr install
wsr preflight
```

The CLI stores global config and state in stable OS-level user directories documented in the package
README, so every command can run from any current directory. No token or credential is copied into WSR
configuration.

## 2. Start and create a Delivery

```sh
wsr start
```

`start` starts the published Docker Compose stack itself, waits for PostgreSQL, reconciles the managed
database roles without deleting Evidence, runs migrations, waits for Evidence and Evolution, and then
starts DSH. Do not start Compose separately. A blocked result includes the bounded, redacted stderr;
use `wsr status`, `wsr health`, and `wsr logs` for the complete layer checks.

Open the DSH web profile, register a workspace, create a Session there, and submit
the selector on the first line with the Task directive on following lines:

```text
/wsr create hello-world-workflow@0.2.0
Return a concise greeting and review it.
```

The Delivery card and Session Delivery view expose the durable status and final result. `WSR Studio`
is the conversation tab immediately after `Delivery`; it does not navigate away from the Session. Studio reads
Evidence and Evolution through the configured loopback services; it does not select or filter by a
repository. The active Session supplies the runtime workspace. If the Workflow declares Roles, place
their bindings in that repository's `.wsr/role-provider-bindings.json`.

## 3. Inspect and recover

Use `status`, `health`, and `logs` for layer-specific diagnostics. `restart` restarts Compose and DSH;
Execution reconstructs Delivery, checkpoint and Session bindings from durable state.

## 4. Upgrade or remove

`upgrade` and `rollback` use explicit compatible versions and digests, never an ambient `latest`.
`uninstall` preserves Delivery, checkpoints, bindings, Evidence, configuration, and other durable data
by default. Any future data purge must be a separate explicit destructive operation.

## Contributor source preview

Feature-branch human acceptance is a single command from the repository root:

```sh
./deployment/accept-current-branch.sh
```

The script creates isolated DSH profile, port, Compose project, Evidence volume, and state resources,
then builds and deploys the current DSH, Compose, and product-operations checkout. The human performs
only the printed browser checks and presses Enter when finished; the script removes every temporary
asset. Startup failure and interruption use the same cleanup path.

Contributors who need other source-built data-service scenarios should follow the separate
[source-build guide](../contributing/source-build.md). It is not the clean-machine product path.
