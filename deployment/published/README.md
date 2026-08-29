# Published-image service bundle

This directory is release tooling. `build-bundle.py` accepts a qualified release manifest and emits a
self-contained, checksummed Compose bundle. The generated `compose.yaml` contains exact version plus
immutable digest coordinates for PostgreSQL, Evidence (also used by the migration job), and Evolution.
It contains no source checkout, build context, BI, Workflow Builder, or improvement-loop container.

In a generated bundle, run `./wsr-compose start`. It pulls the pinned images, runs the Evidence
migration before Evidence readiness, waits for Evidence before Evolution, and binds both APIs only to
loopback. `stop`, `down`, `restart`, `status`, and `logs` are non-destructive. `upgrade` and `rollback`
start the exact current bundle against the stable `wsr-evidence-data` volume, so selecting the newer or
older qualified bundle selects the version. A manifest is rejected unless its declared Evidence schema
revision remains readable by that bundle.

`purge` is the only data-deleting operation and requires
`WSR_CONFIRM_PURGE=DELETE_EVIDENCE_DATA`. Generated database role secrets are reused across ordinary
operations. Override the loopback ports with `WSR_EVIDENCE_PORT` and `WSR_EVOLUTION_PORT`, the durable
volume with `WSR_EVIDENCE_VOLUME`, and the ready bound with `WSR_READY_TIMEOUT_SECONDS`.

The existing parent `deployment/compose.yaml` remains the source-build developer qualification fixture.
