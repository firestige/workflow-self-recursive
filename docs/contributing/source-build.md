# Source-built contributor preview

English | [中文](source-build.zh-CN.md)

This path is for contributors who need to build PostgreSQL, Evidence, Evolution, and BI from the
current checkout. It does not install or start DSH/Execution and is not a packaged-product substitute.

Install Git, OpenSSL, and Docker Desktop or Docker Engine with Compose v2, then clone every source
component:

```sh
git clone --recurse-submodules https://github.com/firestige/workflow-self-recursive.git
cd workflow-self-recursive
```

For an existing checkout without initialized component repositories:

```sh
git submodule update --init --recursive
```

Start the source-built data services:

```sh
./deployment/start.sh
```

The first start downloads base images, builds the checkout, initializes PostgreSQL, and waits for
service health. Open the printed BI URL, which defaults to <http://127.0.0.1:8080/evaluate>.

Stop while retaining Evidence data:

```sh
docker compose -f deployment/compose.yaml stop
```

Run `./deployment/start.sh` again to resume. See the [deployment implementation](../../deployment/README.md)
for the source topology, networks, generated local secrets, and maintainer smoke tests.

The checkout currently links the Workflow Package, Execution, Evidence, Evolution, shared Contracts,
and UI repositories as Git submodules. Those are source workstreams, not separate product installation
steps and not a statement that the product has six systems.

Release maintainers qualify the separate published-image service bundle with
`deployment/published/build-bundle.py`. That tooling consumes only frozen image coordinates and is not
an alternative source-preview launcher or an end-user release before clean-machine qualification.
