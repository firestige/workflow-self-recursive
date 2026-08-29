# Quickstart

English | [中文](quickstart.zh-CN.md)

This guide describes the supported first-use journey on one trusted personal computer. The packaged
product journey is not qualified yet: do not substitute a source checkout or the fixture operations
adapter for a published release.

## 1. Check release availability

The final journey will begin with the top-level `preflight` and `setup` operations. They will verify an
exact compatibility manifest for the DSH bundle, Evidence/Evolution service images, Workflow source,
and local Agent Providers before any installation effect.

The Iter6 command contract exists under `product-operations`, but currently accepts fixture adapters
only. It is for automated qualification, not installation.

## 2. Install and configure

The stable product operations are `setup`, `install`, and `config`. Setup will collect the repository
and workspace, durable-state location, loopback ports, exact Workflow source, and Role-to-Provider/model
bindings. WSR reuses local DSH, Copilot, and Codex login state; configuration and diagnostics must not
contain credentials.

## 3. Start and inspect

The stable daily operations are `start`, `status`, `health`, `logs`, `stop`, and `restart`. Results map
separately to DSH/Execution, Evidence/Evolution, Workflow source, and Provider layers so a partial
failure remains diagnosable.

## 4. Upgrade or remove

`upgrade` and `rollback` will use explicit compatible versions and digests, never an ambient `latest`.
`uninstall` preserves Delivery, checkpoints, bindings, Evidence, configuration, and other durable data
by default. Any future data purge must be a separate explicit destructive operation.

## Source preview for contributors

Contributors who need the existing source-built data-service preview should follow the separate
[source-build guide](../contributing/source-build.md). It is not the final clean-machine product path.
