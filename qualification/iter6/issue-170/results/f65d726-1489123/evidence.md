# Issue 170 Wave 4 cross-repository qualification

Wave 4 is GREEN for the single candidate below. This qualification uses a local
`wsr-ui-core` archive; no published Core package substitutes for the candidate.

## Exact candidate

- Superproject: `b87a8aeaad3288f9fe853c18f47a4118c5efd9b1`
- Provider: `wsr-ui@f65d7267048bf178cf2fc08d16666a33adc5cffb`
- Consumer: `wsr-dsh@1489123d6b6a04bb18a9d21d4f3171a319fdb6a7`
- Package: `wsr-ui-core@0.1.0-rc.0`
- Local archive SHA-256: `e8588e43dea59294f04f7066abd68b94338d8cd043b91cc1d2341bcf1fcfaf28`
- Benchmark result SHA-256: `afb897079279b3c0abe7439cdaf8ef36e346e4ad5a934906b716c09212111997`

## Gate matrix

| Matrix | Result | Evidence |
| --- | --- | --- |
| Local-artifact provenance | PASS | 63 packed files compared byte-for-byte with the DSH installation; isolated acceptance rebuilt the same archive SHA-256; detached DSH candidate has three verified provenance subjects |
| Positive product | PASS | Core gates were green at the provider commit; DSH 141/141 tests, build, three-package pack verification, lifecycle, and clean-profile passed |
| Encapsulation negative | PASS | Cross-repository and local-artifact policies 22/22 plus acceptance-script tests 5/5; source escape, JSON-first, runtime renderer selection, identity drift, missing evidence, and protocol drift fail closed |
| Benchmark | PASS | 3 panels × typical/upper-bound plus UNAVAILABLE = 7 targets; 3 runs each = 21 runs/traces; 30 first-paint samples/run; one 5-second interaction window/run for Waterfall and Tree; all budgets passed with zero long tasks |
| Real Web | PASS | Saved-evidence replay rendered 12 Dashboard panels, Waterfall, Tree, Statistics, dark/light and normal narrow layouts with zero browser errors; isolated current-branch setup/install/preflight/start/health/registration/cleanup passed |

The fixed benchmark runner uses first paint as feedback, then one bounded
interaction window per interactive target and run. It does not regenerate
Evidence through Execution. The end-to-end isolated deployment remains the final
integration insurance rather than the defect-discovery loop.

The automated isolated script was run with browser opening disabled and a
pre-supplied Enter only after its health and workspace-registration steps. It is
therefore evidence for the deployment/runtime chain, not a new claim of human UI
review. The page-family human acceptance remains the owner's prior Wave 2
decision; current bytes are covered by the structured real-Harness replay.

The Waterfall Span Tree follow-up remains tracked by #178 and does not reopen the
accepted Studio page-family scope for this candidate.
