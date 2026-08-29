# Quickstart

English | [中文](quickstart.zh-CN.md)

This guide starts Workflow Self Recursive's local data services and opens BI on one trusted personal
computer. The current deployment includes PostgreSQL, Evidence, Evolution, and BI. This launcher does
not start DeepSeek Harness (DSH) or Execution; they must be run separately.

## 1. Prepare

Install and start:

- Git;
- OpenSSL;
- Docker Desktop, or Docker Engine with Compose v2.

Clone all source components:

```sh
git clone --recurse-submodules https://github.com/firestige/workflow-self-recursive.git
cd workflow-self-recursive
```

For an existing checkout without its component repositories, run:

```sh
git submodule update --init --recursive
```

## 2. Start with one command

```sh
./deployment/start.sh
```

The first start downloads base images, builds the current source, and initializes the local database,
so it normally takes longer than later starts. The launcher prints the URL after every service is
healthy.

## 3. Open BI

Open the address printed by the launcher, which defaults to <http://127.0.0.1:8080/evaluate>.

When Evidence has no Tasks, the page shows an empty selection state. This means the services are ready
but have not received Execution data; it is not a startup failure.

## 4. Stop

Stop the services while retaining Evidence data:

```sh
docker compose -f deployment/compose.yaml stop
```

Run `./deployment/start.sh` again to resume.

Continue with the [user guide](user-guide.md) for Workflow sources, DSH/Execution, BI usage, logs, and
data reset. Maintainers can read the [deployment implementation](../../deployment/README.md).
