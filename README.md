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

## Get the source

Clone this repository together with its component repositories:

```sh
git clone --recurse-submodules https://github.com/firestige/workflow-self-recursive.git
cd workflow-self-recursive
```

If you already cloned the repository without submodules, initialize them with:

```sh
git submodule update --init --recursive
```

Start the local Evidence, Evolution, and BI data services on a trusted personal computer:

```sh
./deployment/start.sh
```

The launcher handles internal database initialization; no user account or manually configured database
password is required. See the [quickstart](docs/guides/quickstart.md) and [user guide](docs/guides/user-guide.md).

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

The source is split into five Git submodules: [Workflow Package](https://github.com/firestige/workflow-package), [Execution System](https://github.com/firestige/execution-system), [Evidence System](https://github.com/firestige/evidence-system), [Evolution System](https://github.com/firestige/evolution-system), and [System Contracts](https://github.com/firestige/system-contracts). These are repository workstreams, not five product systems.

## License

[Apache-2.0](LICENSE)
