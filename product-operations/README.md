# Product operations skeleton

This package owns the top-level orchestration contract for WSR's independently released delivery
carriers. It does not implement DSH package installation, Compose deployment, Workflow resolution, or
Provider login. Those behaviors enter through owner adapters in later waves.

The current executable is intentionally fixture-only. `fixtures/compatibility.json` uses exact fixture
coordinates, versions, and SHA-256 digests so the command and recovery contracts can be qualified
before final artifacts exist. It must not be presented as a product installation.

## Commands

The stable command set is `setup`, `install`, `preflight`, `config`, `status`, `health`, `logs`,
`start`, `stop`, `restart`, `upgrade`, `rollback`, and `uninstall`. Every command writes one
`wsr.operations.result@1.0.0` JSON result to standard output. Exit code `0` means succeeded, `3` means
blocked/recoverable, and `2` means failed or invalid input.

Run the fixture boundary from this directory:

```sh
node ./bin/wsr.mjs preflight \
  --manifest ./fixtures/compatibility.json \
  --state-dir /tmp/wsr-operations-state \
  --config /tmp/wsr-config.json
```

To exercise configuration ownership, copy `fixtures/config.json`, replace every absolute fixture path,
then pass it to `setup` with `--config-input`. Product operations writes configuration as mode `0600`
and the state directory as mode `0700`.

Mutable commands run preflight for every component before the first adapter effect. An interrupted
operation records the exact manifest digest and completed component set; only that command with that
manifest may resume. Repeated completion is a no-op. `uninstall` removes only adapter-owned managed
installation state and reports that user configuration and durable data remain preserved. There is no
purge command in this skeleton.
