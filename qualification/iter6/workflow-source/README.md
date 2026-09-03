# Iteration 6 Wave 4 Workflow source qualification

This qualification binds issue #118 to three exact owner revisions:

- `workflow-package` `70ee6aa2d38595bcaabe5bd205e36d8e3b823538`
- `execution-system` `b4b3b487af7f163c5934aa758d86b183d64115ec`
- `evolution-system` `7de7250d0c0c4d70e4de44a960ab15b46f5f132c`

Canonical CI builds the package-scoped four-asset layout from the pinned Workflow Package owner and replays its DSL2 Contract validator after extracting each archive into a private clean directory. It then runs the pinned Execution resolver against the public `firestige/wsr-workflow-package` GitHub Releases API for exact `implementation-workflow@0.4.0`, publishes the validated result into a new READY store, replaces the Source with an unavailable adapter, and proves that only the same exact cached content is replayed. The closed JSON result is retained in the CI log. Evolution's complete Workflow source unit suite runs in the same pinned topology.

The live public `0.4.0` package-scoped Releases are the qualified four-asset DSL2 sources. No V1 checker, latest, branch, local checkout, private credential, or alternate-source fallback participates in resolution.

Run the deterministic checks after building Execution:

```sh
node --test qualification/iter6/workflow-source/qualify.test.mjs
node qualification/iter6/workflow-source/qualify.mjs
```
