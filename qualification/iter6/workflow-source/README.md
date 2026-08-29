# Iteration 6 Wave 4 Workflow source qualification

This qualification binds issue #118 to three exact owner revisions:

- `workflow-package` `ff972d150438321bcb64e3442b99aad54bb38f56`
- `execution-system` `32ab972ae9d673b57599ecbd01461f982c41ac7c`
- `evolution-system` `7de7250d0c0c4d70e4de44a960ab15b46f5f132c`

Canonical CI builds the package-scoped four-asset layout from the pinned Workflow Package owner and replays its Contract validator after extracting each archive into a private clean directory. It then runs the pinned Execution resolver against the public `firestige/wsr-workflow-package` GitHub Releases API for exact `implementation-workflow@0.3.0`, publishes the validated result into a new READY store, replaces the Source with an unavailable adapter, and proves that only the same exact cached content is replayed. The closed JSON result is retained in the CI log. Evolution's complete Workflow source unit suite runs in the same pinned topology.

The live public `0.3.0` Release is the historical aggregate compatibility fixture; it is not represented as the newer provenance layout. The four-asset qualification is built and validated from the exact pinned owner revision without publishing or changing Release authority. No latest, branch, local checkout, private credential, or alternate-source fallback participates in resolution.

Run the deterministic checks after building Execution:

```sh
node --test qualification/iter6/workflow-source/qualify.test.mjs
node qualification/iter6/workflow-source/qualify.mjs
```
