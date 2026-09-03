# Published-image service bundle

This directory is release tooling. `build-bundle.py` accepts a qualified release manifest and emits a
self-contained, checksummed Compose bundle. The generated `compose.yaml` contains exact version plus
immutable digest coordinates for PostgreSQL, Evidence (also used by the migration job), and Evolution.
It contains no source checkout, build context, BI, Workflow Builder, or improvement-loop container.

The stable Iter 6 manifest is `release/compose/0.1.1.json`; the original qualified candidate remains at
`release/compose/0.1.0-rc.1.json`. The existing
`release-compose-bundle.yml` flow downloads the first-party qualification records, binds their tags,
product commits, OCI digests, platform gates, and provenance gates to that manifest, verifies the
three remote amd64/arm64 indexes, and only then generates the bundle artifact. A manual dispatch for
the stable manifest publishes the checksummed archive and manifest as the durable `compose-0.1.1`
GitHub Release; it does not rebuild or republish the pinned images.

In a generated bundle, run `./wsr-compose start`. It pulls the pinned images, runs the Evidence
migration before Evidence readiness, waits for Evidence before Evolution, and binds both APIs only to
loopback. `stop`, `down`, `restart`, `status`, and `logs` are non-destructive. `upgrade` and `rollback`
start the exact current bundle against the stable `wsr-evidence-data` volume, so selecting the newer or
older qualified bundle selects the version. A manifest is rejected unless its declared Evidence schema
revision remains readable by that bundle.

`./wsr-compose preflight` checks the two effective ports and the closed
loopback/Contract fixture without starting Docker. `./wsr-compose host-config`
prints the exact credential-free JSON consumed by the DSH Host and reused as
Execution's Observation base. See [loopback-host.md](loopback-host.md) for
endpoint ownership and degradation boundaries.

`purge` is the only data-deleting operation and requires
`WSR_CONFIRM_PURGE=DELETE_EVIDENCE_DATA`. Generated database role secrets are reused across ordinary
operations. The launcher binds the retained Evidence volume to a stable identity in its state directory
and idempotently reconciles all managed role passwords before migration; it refuses to rotate a volume
already bound to another state directory. Override the loopback ports with `WSR_EVIDENCE_PORT` and `WSR_EVOLUTION_PORT`, the durable
volume with `WSR_EVIDENCE_VOLUME`, and the ready bound with `WSR_READY_TIMEOUT_SECONDS`.

The existing parent `deployment/compose.yaml` remains the source-build developer qualification fixture.

Maintainers can run the real published-image lifecycle in an isolated project and randomly named test
volume with:

```sh
WSR_RUN_PUBLISHED_E2E=1 deployment/test-published-e2e.sh
```

The E2E covers pull, migration, readiness, schema identity, restart, upgrade, rollback, a partial
Evolution failure, retained secrets/data, and refusal of an unconfirmed purge. Its cleanup accepts only
the `wsr-published-e2e-*` fixture-volume namespace.
