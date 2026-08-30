# Quickstart

English | [中文](quickstart.zh-CN.md)

This guide rebuilds the Iter6 reference assembly on one trusted personal computer. It installs the
top-level operations bundle from the `product-0.2.0` GitHub Release and consumes only that bundle's
stable compatibility manifest. No WSR source checkout or owner build is part of the product path.

## 1. Prepare configuration

Prerequisites are DSH `0.1.1-rc.2`, Node `24.12.0`, npm `11.6.2`, Docker with Compose, Codex CLI
`0.144.5` logged in locally, and an available local GitHub Copilot login. Install the exact operations
asset and download its editable configuration example:

```sh
npm install --global https://github.com/firestige/workflow-self-recursive/releases/download/product-0.2.0/wsr-product-operations-0.2.0.tgz
curl --proto '=https' --tlsv1.2 --fail --location --remote-name \
  https://github.com/firestige/workflow-self-recursive/releases/download/product-0.2.0/wsr-product-0.2.0.config.example.json
```

Set `workspace` in the example to a canonical Git worktree root, choose an absolute `durableState`
path, and select unused loopback ports. The example binds `role.greeter` to Copilot and
`role.reviewer` to Codex.

```sh
wsr setup --config-input /absolute/config.json
wsr install
wsr preflight
```

`preflight` fails before Delivery admission when the workspace is not the exact Git root or has
uncommitted changes. Commit or stash them, then repeat it. No token or credential is copied into WSR
configuration.

## 2. Start and create a Delivery

```sh
wsr start
```

Open the DSH web profile, register the exact configured workspace, create a Session there, and submit
the selector on the first line with the Task directive on following lines:

```text
/wsr create hello-world-workflow@0.2.0
Return a concise greeting and review it.
```

The Delivery card and Session Delivery view expose the durable status and final result. Studio reads
Evidence and Evolution through the configured loopback services; it does not select or filter by a
repository.

## 3. Inspect and recover

Use `status`, `health`, and `logs` for layer-specific diagnostics. `restart` restarts Compose and DSH;
Execution reconstructs Delivery, checkpoint and Session bindings from durable state.

## 4. Upgrade or remove

`upgrade` and `rollback` use explicit compatible versions and digests, never an ambient `latest`.
`uninstall` preserves Delivery, checkpoints, bindings, Evidence, configuration, and other durable data
by default. Any future data purge must be a separate explicit destructive operation.

## Contributor source preview

Contributors who need the source-built data-service preview should follow the separate
[source-build guide](../contributing/source-build.md). It is not the clean-machine product path.
