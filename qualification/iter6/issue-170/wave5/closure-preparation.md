# Issue 170 Wave 5 closure preparation

Status: **READY FOR HUMAN CHECKPOINT**

No merge, stable publication, final gitlink commit, or issue state transition
has been performed by this preparation step.

## Proven gates

- #172 / Wave 1: provider candidate `45d6ec33148fd81520db203ad047e8af220c3ad2`, evidence `4122e299f5a765b3af7e7d8a80550b292980bebe`
- #173 / Wave 2: consumer candidate `69bbdf567aa2ce3bd77037f69ef8db3a822666d5`, evidence `17f867e`
- #175 / Wave 3: combined consumer candidate `80c365aa780d0ba8f224b87fb8f34dddd0ae9a3a`, evidence `aa505b41d2f941bf302245077131c79e9f36c80d`
- #174 / Wave 4: superproject candidate `b87a8aeaad3288f9fe853c18f47a4118c5efd9b1`, provider `f65d7267048bf178cf2fc08d16666a33adc5cffb`, consumer `1489123d6b6a04bb18a9d21d4f3171a319fdb6a7`, evidence commit `ffe77bd9`
- Qualified local provider archive: `wsr-ui-core@0.1.0-rc.0`, SHA-256 `e8588e43dea59294f04f7066abd68b94338d8cd043b91cc1d2341bcf1fcfaf28`, integrity `sha512-3MUE0+jelXCUHN9Uw7PvHkL28Ak/P4vnvjSNdPNGj/gaGHPWR8LadobImijqch4E1QdoCdhwRkel7aLpl2We8A==`
- Registry history only: `wsr-ui-core@0.1.0-rc.0` is already occupied by different bytes and must not be rebound or used as the Wave 4 candidate

The Wave 4 local-artifact provenance, positive product, encapsulation negative,
benchmark, and real-Web matrices are all GREEN. The qualification candidate
contains exact gitlinks, while the final published-coordinate pins remain
uncommitted as required by the final-pin checkpoint.

## Release-coordinate audit

The existing DSH source versions cannot be promoted. The qualified tarballs no
longer match the immutable npm bytes already published at
`dsh-wsr-execution@0.2.1`, `dsh-wsr-studio@0.1.1`, and `dsh-wsr@0.2.1`;
`publish-npm-set.mjs` therefore rejects the current candidate with
`NPM_VERSION_DIGEST_COLLISION`.

Recommended unused final coordinates:

| Artifact | Proposed coordinate | Reason |
| --- | --- | --- |
| Shared BI provider | `wsr-ui-core@0.1.0-rc.1` | Next immutable prerelease; preserves the owner's prerelease decision and cannot collide with the occupied `rc.0` |
| Execution adapter | `dsh-wsr-execution@0.2.2` | Patch release for the Delivery presentation correction |
| Studio adapter | `dsh-wsr-studio@0.1.2` | Patch release for the missing MVP BI product surface |
| Composition suite | `dsh-wsr@0.2.2` | Pins the corrected component floor |
| DSH release set | `0.2.3` via `0.2.3-rc.1` | Next release-set revision after `0.2.2` |

All proposed npm coordinates were unoccupied when audited on 2026-09-02.
Provider publication changes the package version and tarball integrity. DSH
package version/dependency changes also change runtime bytes.
Consequently the execution plan requires the complete Wave 4 matrix to run
again against the approved publication coordinates before any completion claim.

## Authorized execution sequence after checkpoint

1. Apply the approved provider and DSH version/dependency changes with RED→GREEN tests.
2. Rebuild and publish `wsr-ui-core@0.1.0-rc.1`; record exact registry integrity and provenance.
3. Lock DSH Studio to that exact provider prerelease, build `0.2.3-rc.1`, and run the DSH release-candidate workflow.
4. Re-run the complete Wave 4 clean provider/consumer, negative-policy, fixed-runner benchmark, isolated acceptance, and real-Web matrix against the changed bytes.
5. Promote the exact qualified DSH candidate bytes to the three stable npm coordinates and GitHub release `0.2.3`.
6. Re-run final stable-coordinate qualification, commit the two superproject gitlinks through the single integrator, and create/merge the topic PR.
7. Publish the prepared evidence comments, use `pctl req close` for #172–#175, append correction comments to #104/#110/#111/#112/#119/#120, update #170, then use `pctl req close` for #170.

Any byte, integrity, metadata, dependency-resolution, commit, or pin drift restarts
the complete qualification matrix. #176 remains open/blocked and outside MVP.

## Closure-comment mapping

The final comments should bind each issue to the final stable identities while
preserving these already-proven sources:

- #172: provider boundary, React 18 consumer, package provenance, all Panel benchmark runs, and final `wsr-ui-core` coordinate/integrity.
- #173: exact package lock, thin Host adapter, AVAILABLE/UNAVAILABLE and drill-down journeys, DSH package coordinates, and consumer evidence.
- #174: final cross-repository candidate, 22 local-artifact/cross-repository policy cases plus five acceptance-script cases, raw benchmark/trace index, exact replay/registration identities, screenshots, command ledger, and zero network drift.
- #175: exact current Action/Intervention semantics, terminal Outcome semantics, native primitives, responsive/a11y/visual evidence, and unchanged Delivery contract/network paths.
- #170: the four closed active goals, #176 deferred state, #168 authority record, final pins/releases, historical corrections, and unchanged exclusion inventory.

The historical correction for #104/#110/#111/#112/#119/#120 should state that
their original infrastructure/data-path work remains closed, but their Iter6 BI
product-surface acceptance was incomplete; #170 restored the shared Panel
authority, formal DSH consumption, Delivery presentation, and a fail-closed
cross-repository product gate. The original issue history must not be rewritten
or reopened.

## Scope audit

- #168 is CLOSED with the shared-authority trigger decision recorded.
- #176 is OPEN, `blocked`, has no milestone, and awaits a public versioned DSH Trajectory contribution contract.
- #114, #137, #58, #59, #60, #113, and #109 remain outside the MVP milestone and outside #170's active goals.
- #104, #110, #111, #112, #119, and #120 remain CLOSED pending correction comments only.
