# Issue 170 final published-coordinate qualification

Status: **PASS**

## Final identities

- Superproject final-pin candidate: `ed66fc6916adae0b328f4cdc05d4ad1f6ffc3097`
- Core qualified commit: `50cd463104a05a91d918eb21f3009a762b0753de`
- Core merged pin: `d55ce05f960c3d5d72b53932ccd5617f563e5bbf` (identical Git tree)
- DSH qualified commit: `b58ca4327b4e55b8b17d25c2cbc68ef1b6666a7a`
- DSH merged pin: `4a8fd50ef8b80bfc9459eb0fde4b7c0a6744ac20` (identical Git tree)

## Published coordinates

| Artifact | Coordinate | SHA-256 |
| --- | --- | --- |
| Shared BI Core | `wsr-ui-core@0.1.0-rc.1` | `1f3988137711d37a0d839ef93ecff325188017738675c86cb57a807ee99407f5` |
| Execution adapter | `dsh-wsr-execution@0.2.2` | `99e2e58b6fe262d7c8667145e77ddb7f74cefc40091110d38125fbebc6933b4b` |
| Studio adapter | `dsh-wsr-studio@0.1.2` | `acf3fc5a5f4f82a402f96c6707bfbd1efa80ce298c45633624ad0ca41d0ba3e3` |
| DSH suite | `dsh-wsr@0.2.2` | `0eeff303c77fd4b38e4f8600c5bf44d95defebe2faca9e7accc4c8b982794eb1` |
| DSH release set | `0.2.3` promoted from `0.2.3-rc.1` | exact candidate assets |

Core local rebuild and npm registry bytes compare equal. The three npm DSH
tarballs, candidate GitHub Release assets, and stable GitHub Release assets also
compare equal. The DSH publications carry npm provenance attestations.

## Gates

- Core fixed-runner benchmark: 7 targets, 21/21 independent runs and browser
  traces PASS, protocol complete, zero long tasks; result SHA-256
  `e4bfb9176d5cd3fd99181545ffabc93274e576266d1d6bd78e1831085d8232cd`.
- Cross-repository matrices: local artifact provenance, positive product,
  encapsulation negative, benchmark, and real Web all PASS.
- Real Harness replay: 12 Dashboard panels; Waterfall, Tree, and Statistics;
  single/compare, receipt/fact/trace, reload/deep-link, downstream outage; zero
  browser errors.
- DSH release gates: 141 tests, build, three-package inventory, clean profile,
  lifecycle, provider routing without credential reads, loopback outage, remote
  owner artifact, and provenance all PASS.
- Final local-product replay: `accept-current-branch.sh` rebuilt Core and all DSH
  packages locally, verified exact Core archive bytes in the isolated profile,
  and passed setup/install/preflight/provider-auth/start/health/workspace
  registration/cleanup at final pins. No already-published Core package supplied
  the artifact under test.
- Network drift: none in the frozen Delivery control-plane paths.

## Publication records

- Core PR: https://github.com/firestige/wsr-ui/pull/2
- DSH PR: https://github.com/firestige/wsr-dsh/pull/17
- DSH candidate qualification: https://github.com/firestige/wsr-dsh/actions/runs/33630327791
- DSH stable promotion: https://github.com/firestige/wsr-dsh/actions/runs/33630820399
- Candidate release: https://github.com/firestige/wsr-dsh/releases/tag/0.2.3-rc.1
- Stable release: https://github.com/firestige/wsr-dsh/releases/tag/0.2.3

## Scope and rollback

`#176` remains deferred and blocked because fixed DSH has no public versioned
Trajectory contribution contract. It is not part of the MVP completion claim.
Rollback uses the prior immutable DSH package coordinates/release assets; no
published version is rebound. The Waterfall/DataZoom defect that blocked the
first candidate was resolved under `#178` before this qualification.
