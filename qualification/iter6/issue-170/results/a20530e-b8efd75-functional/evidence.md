# Issue 170 functional qualification before benchmark

This directory records the functional freeze candidate assembled after the
owner accepted WSR Studio on 2026-09-02. It is deliberately not a complete
Wave 4 qualification result: benchmark execution was deferred until the
product behavior is frozen.

The provider was packed locally from `a20530e`; the archive SHA-256 was
`4bd3e31e7a84cc9adbebe191f23f288281a864d948191ad3881388f86840661a`.
`accept-current-branch.sh` rebuilt that archive inside an isolated directory,
materialized it over the DSH dependency installation, bound the same archive
into the isolated DSH profile, and verified the installed runtime files
against the archive. No published `wsr-ui-core` bytes qualified this run.

The exact combination was superproject `ec0c0b88`, provider `a20530e`, and
consumer `b8efd75`. Setup, install, preflight, provider authentication, start,
health, workspace registration, and cleanup passed. The saved-evidence real
Harness passed with zero browser errors. Provider gates passed 240 tests and
15 browser journeys; consumer gates passed 138 tests. The local-artifact and
cross-repository fail-closed policies passed 23 tests.

Waterfall Span Tree/DataZoom cohesion remains a Core component concern and is
tracked by issue #178. The owner explicitly ruled that defect non-blocking for
issue #170 and accepted the current WSR Studio page family.

The full `panel-benchmark@1`, final cross-repository `candidate.json`, release
provenance, and the complete Wave 4 matrix remain pending. Existing historical
benchmark evidence must not be rebound to this candidate.
