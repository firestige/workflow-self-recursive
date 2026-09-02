# Issue 170 Wave 5 closure preparation

Status: **PUBLICATION AND FINAL-PIN GATES PASS; ISSUE CLOSURE IN PROGRESS**

The owner approved Wave 5, package publication, merge, and the release flow on
2026-09-02. Core PR #2 and DSH PR #17 are merged. The exact qualified DSH
candidate was promoted to stable packages and GitHub Release `0.2.3`.

## Proven gates

- #172 / Wave 1: provider candidate `45d6ec33148fd81520db203ad047e8af220c3ad2`, evidence `4122e299f5a765b3af7e7d8a80550b292980bebe`
- #173 / Wave 2: consumer candidate `69bbdf567aa2ce3bd77037f69ef8db3a822666d5`, evidence `17f867e`
- #175 / Wave 3: combined consumer candidate `80c365aa780d0ba8f224b87fb8f34dddd0ae9a3a`, evidence `aa505b41d2f941bf302245077131c79e9f36c80d`
- #174 / Wave 4 final qualified source: provider `50cd463104a05a91d918eb21f3009a762b0753de`, consumer `b58ca4327b4e55b8b17d25c2cbc68ef1b6666a7a`
- Final merged pins: provider `d55ce05f960c3d5d72b53932ccd5617f563e5bbf`, consumer `4a8fd50ef8b80bfc9459eb0fde4b7c0a6744ac20`; each has the same Git tree as its qualified source
- Final-pin superproject candidate: `ed66fc6916adae0b328f4cdc05d4ad1f6ffc3097`
- Published provider: `wsr-ui-core@0.1.0-rc.1`, SHA-256 `1f3988137711d37a0d839ef93ecff325188017738675c86cb57a807ee99407f5`
- Final evidence: `qualification/iter6/issue-170/results/50cd463-b58ca43/`

The local-artifact provenance, positive product, encapsulation negative,
benchmark, and real-Web matrices are all GREEN at the published coordinate and
final merged pins. The final isolated product replay rebuilt and installed the
Core archive locally rather than resolving the already-published package.

## Released coordinates

| Artifact | Final coordinate | SHA-256 |
| --- | --- | --- |
| Shared BI provider | `wsr-ui-core@0.1.0-rc.1` | `1f3988137711d37a0d839ef93ecff325188017738675c86cb57a807ee99407f5` |
| Execution adapter | `dsh-wsr-execution@0.2.2` | `99e2e58b6fe262d7c8667145e77ddb7f74cefc40091110d38125fbebc6933b4b` |
| Studio adapter | `dsh-wsr-studio@0.1.2` | `acf3fc5a5f4f82a402f96c6707bfbd1efa80ce298c45633624ad0ca41d0ba3e3` |
| Composition suite | `dsh-wsr@0.2.2` | `0eeff303c77fd4b38e4f8600c5bf44d95defebe2faca9e7accc4c8b982794eb1` |
| DSH release set | `0.2.3` via `0.2.3-rc.1` | exact promoted candidate assets |

Candidate workflow: https://github.com/firestige/wsr-dsh/actions/runs/33630327791

Promotion workflow: https://github.com/firestige/wsr-dsh/actions/runs/33630820399

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
