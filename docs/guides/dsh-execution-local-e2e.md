# DSH bundle local pre-release E2E

This guide qualifies unpublished DSH bundle candidates from the sole DSH
release authority, [`firestige/wsr-dsh`](https://github.com/firestige/wsr-dsh).
For normal installation from published artifacts, use the
[DSH Execution quickstart](dsh-execution-quickstart.md).

## Prerequisites

Use Node `24.12.0`, npm `11.6.2`, DSH `0.1.1-rc.2`, and Chrome. Verify the
exact tools before running the gates:

```sh
node --version
npm --version
dsh --version
```

## Build and static qualification

Run from the superproject root with all submodules initialized:

```sh
npm --prefix wsr-dsh ci --ignore-scripts --no-audit --no-fund
npm --prefix wsr-dsh run test
npm --prefix wsr-dsh run build
npm --prefix wsr-dsh run pack:verify
npm --prefix wsr-dsh run provenance:verify
```

The DSH repository consumes the exact immutable `wsr-execution@0.1.4` owner
asset recorded in its manifest. It must not substitute an npm `latest`, branch,
local Execution checkout, or rebuilt owner archive.

## Clean-profile and lifecycle qualification

```sh
npm --prefix wsr-dsh run qualify:clean-profile
npm --prefix wsr-dsh run qualify:lifecycle
npm --prefix wsr-dsh run qualify:provider-routing
npm --prefix wsr-dsh run qualify:real-harness
```

These gates create temporary DSH homes and package archives. They qualify
Execution-only, Studio-only, and suite installation; suite/component
reconciliation; upgrade, rollback, removal, and reinstall; single-slot UI
composition; Provider routing; a real Host; and browser surfaces. They do not
publish anything and must not delete external Delivery, checkpoint, binding,
Evidence, or user configuration data.

## Candidate and stable publication

Only the `wsr-dsh` candidate and promotion workflows may publish
`dsh-wsr-execution`, `dsh-wsr-studio`, or `dsh-wsr`. Candidate bytes are
redownloaded and requalified before npm OIDC promotion. See the
[`wsr-dsh` release lifecycle](https://github.com/firestige/wsr-dsh/blob/main/docs/release-lifecycle.md).
