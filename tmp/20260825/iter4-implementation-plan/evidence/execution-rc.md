# Wave12 Execution RC qualification

Status: `PASS — W12.5 EXECUTION_RC_CREATED` (2026-08-27)

## Immutable identity

- Release: <https://github.com/firestige/execution-system/releases/tag/0.1.3-rc.1>.
- Successful workflow: <https://github.com/firestige/execution-system/actions/runs/32990232622>.
- Product/tag target: `3c6259ca07276b1de8520fa6fc0d26c86fd93a41`.
- Publisher revision: `845610e3655d20c9c48a6a17b478bc0d8f85f0c4`.
- Authority: superproject `492aa8ee7ff7a837bb3798564de795a0016e9f7f`, `release/candidates/iter4-wave11.json`, SHA-256 `c5b78ce1d2c8a5b813032254759c93c9d94bbc1f6a6c250f4511e9dc7c534ef4`.
- Independent download directory: `/tmp/wsr-execution-rc-verify.6qG2wj`.

## Downloaded assets

| Asset | SHA-256 |
| --- | --- |
| `release-metadata.json` | `cae4b4e126fe075c8a5826d17fdc664706b02bc0cfe1ce9bd40971a45a4999bd` |
| `release-notes.md` | `9e72e4052350ec9c3c4417282bcb494d5b29b2f6599a1f7216288c5db501dbc3` |
| `release-qualification.json` | `84ff722f91759707c4083f2f3adc949f69e2f5c2303d2841e6cb534ca0107c26` |
| `wsr-execution-0.1.3.tgz` | `7c5ab0c061d2cc9f6e3d486e885ee2072870eb09aa0284f0285547fb828d3ca0` |
| `wsr-dsh-intake-0.1.3.tgz` | `d518a687c32077aa8ced55a446da4c744461d3bb58d85aa705638073979618b8` |
| core publication record | `9f608a587b0ff18f52cbaa2ab09257f80d77c87e40510c08434888a39bb36807` |
| Intake publication record | `28918537532e017ea1a079f893c23fcb7a02dd6717c3f6ff230795af0bb86fed` |

The release is a prerelease, its lightweight tag resolves exactly to the Wave11 product archive commit, `pnpm release:verify` accepts the independently downloaded directory, and both tgz plus metadata digests equal the immutable unified manifest.

## Qualification and recovery history

The successful run passed the 68-file full suite, coverage, typecheck, build, generated checks, static/feasibility harnesses, DSH distribution, exact candidate materialization, local artifact-install browser E2E, independent remote download verification, and clean remote-prerelease browser E2E. Its qualification record binds the product commit and publisher revision separately and records the #102 manual evidence URL.

All preceding attempts stopped before a tag or Release existed:

1. run `32988273522` proved the full gates but found that the Wave11 product checkout intentionally lacks the later materializer; publisher tooling was separated into its own exact checkout;
2. run `32988694595` encountered transient `CHROME_DEVTOOLS_PORT_UNAVAILABLE`; no byte or request changed;
3. run `32989203029` passed qualification but the read-only built-in token was denied before Release creation;
4. run `32989745111` proved the App installation and scoped repository token, then showed that a target differing from default branch under `.github/workflows/` additionally requires Workflows write.

The final token was minted only after qualification, scoped to `firestige/execution-system`, and requested the already approved Contents/Workflows write permissions. No npm coordinate, stable tag, main merge, DSH listing, or superproject main repin was created. A3 remains pending.
