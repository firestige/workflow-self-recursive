# workflow-self-recursive

English | [中文](README.zh-CN.md)

workflow-self-recursive is an open-source architecture for running agent workflows through a small, host-neutral execution boundary and making each run inspectable.

It binds each delivery to one resolved version and digest of a Workflow Package, keeps runtime results authoritative, and can record a minimal set of facts through OpenTelemetry. Runner is Execution module M02; LangGraph is its current replaceable Workflow Host substrate and [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) is its current concrete Agent Provider.

## Developer preview

workflow-self-recursive is currently an architecture-first developer preview for trusted local use by individuals and small teams. It does not yet provide a packaged end-user release, but its local data services can be started from source. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

## Architecture

The product architecture separates two systems that are intended to remain independently usable:

- **Execution** resolves and validates one exact Workflow Package, records that binding in an immutable Delivery Manifest, coordinates the current delivery, and emits bounded observations.
- **Evidence** accepts supported OTLP facts, builds factual projections, and serves human inspection without controlling execution. Execution continues when Evidence or telemetry is unavailable.

Workflow definitions and resources live in versioned Workflow Packages. Shared contracts define the boundary between the systems. Runner is the current M02 module; its Host and Provider substrates are private replaceable selections. A Runner-selection abstraction does not exist today.

## Get started

The packaged end-user release is not qualified yet. The stable top-level operations contract is being
built around `setup`, `install`, `preflight`, `config`, `status`, `health`, `logs`, `start`, `stop`,
`restart`, `upgrade`, `rollback`, and `uninstall`; its current adapter is fixture-only and must not be
used as a product installer.

Follow the [quickstart](docs/guides/quickstart.md) for the user-facing journey and current release
status. Contributors who need the existing source-built data-service preview should use the separate
[source-build guide](docs/contributing/source-build.md).

Installation and operation will resolve exact compatible artifacts rather than build internal source
repositories or select ambient `latest` versions. Uninstall preserves durable user data by default.

## Documentation

Start with the [conceptual architecture](docs/agent-architecture.md), then continue with:

- [Workflow composition model](docs/workflow-composition-model.md)
- [Execution System design](docs/systems/execution/project-execution-system.md)
  - [Runner module design](docs/systems/execution/modules/runner/runner.md)
    - [Interpreter](docs/systems/execution/modules/runner/interpreter.md)
    - [Lifecycle Coordinator](docs/systems/execution/modules/runner/lifecycle-coordinator.md)
    - [Workflow Host](docs/systems/execution/modules/runner/workflow-host.md)
    - [Managed Agent Invocation](docs/systems/execution/modules/runner/managed-agent-invocation.md)
    - [Custody](docs/systems/execution/modules/runner/custody.md)
  - [Runner traceability and implementation record](docs/systems/execution/modules/runner/traceability.md)
- [Evidence System design](docs/systems/evidence/evidence-system.md)
- [Execution–Evidence contracts](docs/contracts/execution-evidence/interaction-contract.md)

The internal repository topology is documented in the contributor source-build guide; it is not part of
the end-user installation model.

## License

[Apache-2.0](LICENSE)
