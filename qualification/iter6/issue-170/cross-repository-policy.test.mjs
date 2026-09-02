import assert from "node:assert/strict";
import test from "node:test";

import { qualifyCrossRepository } from "./cross-repository-policy.mjs";

const sha256 = (character) => character.repeat(64);

function fixture() {
  const run = (index, interactive = false) => ({
    runIndex: index,
    warmupSamples: 1,
    rawSamples: Array.from({ length: 30 }, (_, sampleIndex) => ({ sampleIndex: sampleIndex + 1 })),
    browserTrace: `trace-${index}.zip`,
    environment: {
      platform: "linux/arm64",
      browserVersion: "151.0.7922.34",
      browserRevision: "1234",
    },
    evaluation: { passed: true },
    ...(interactive ? { interactionSample: { durationMs: 5000, frameDurations: [16.67], longTasks: [] } } : {}),
  });
  return {
    schemaVersion: "wsr.issue-170.cross-repository-candidate@1",
    superproject: { commit: "53bbdf599ddc582a4ce2b627457105f872dd8eef" },
    provider: {
      commit: "45d6ec33148fd81520db203ad047e8af220c3ad2",
      qualifiedCommit: "15d6ec33148fd81520db203ad047e8af220c3ad2",
      treeEquivalent: true,
      packageCoordinate: "wsr-ui-core",
      packageVersion: "0.1.0-rc.1",
      packageIntegrity: "sha512-qualified",
      packageSha256: sha256("d"),
      publishedPackageSha256: sha256("d"),
      packageSource: "registry-published+local-byte-match",
      manifestSha256: sha256("a"),
      benchmarkResultSha256: sha256("b"),
    },
    consumer: {
      commit: "80c365aa780d0ba8f224b87fb8f34dddd0ae9a3a",
      qualifiedCommit: "10c365aa780d0ba8f224b87fb8f34dddd0ae9a3a",
      treeEquivalent: true,
      packageCoordinate: "wsr-ui-core",
      packageVersion: "0.1.0-rc.1",
      packageIntegrity: "sha512-qualified",
      packageSha256: sha256("d"),
      lockSha256: sha256("c"),
      panels: ["metric-ratio-bar@1", "recorded-trace-waterfall@1", "recorded-trace-tree@1"],
      jsonPrimary: false,
      runtimeRendererSelector: false,
      sourcePathImports: false,
    },
    benchmark: {
      schemaVersion: "panel-benchmark@1",
      resultSchemaVersion: "panel-benchmark-result@1",
      providerCommit: "15d6ec33148fd81520db203ad047e8af220c3ad2",
      packageCoordinate: "wsr-ui-core",
      packageVersion: "0.1.0-rc.1",
      manifestSha256: sha256("a"),
      qualifying: true,
      protocol: {
        warmupSamples: 1,
        measuredSamplesPerRun: 30,
        independentRuns: 3,
        interactiveWindowsPerRun: 1,
        interactiveDurationMsPerRun: 5000,
        percentileAlgorithm: "nearest-rank",
        rendererReady: "geometry fonts ready and SVG attributes committed or Canvas draw completed",
      },
      rendererDecision: "manifest-static:svg+semantic-html+canvas",
      runner: {
        platform: "linux/arm64/v8",
        browserVersion: "151.0.7922.34",
        browserRevision: "1234",
      },
      results: [
        { panel: "metric-ratio-bar@1", fixture: "typical", runs: [run(1), run(2), run(3)] },
        { panel: "metric-ratio-bar@1", fixture: "upper-bound", runs: [run(1), run(2), run(3)] },
        { panel: "recorded-trace-waterfall@1", fixture: "typical", runs: [run(1, true), run(2, true), run(3, true)] },
        { panel: "recorded-trace-waterfall@1", fixture: "upper-bound", runs: [run(1, true), run(2, true), run(3, true)] },
        { panel: "recorded-trace-tree@1", fixture: "typical", runs: [run(1, true), run(2, true), run(3, true)] },
        { panel: "recorded-trace-tree@1", fixture: "upper-bound", runs: [run(1, true), run(2, true), run(3, true)] },
      ],
    },
    runtime: {
      dshVersion: "0.1.1-rc.2",
      browserErrors: 0,
      productScenarios: [
        "single-available", "single-unavailable", "compare-available", "partial-compare",
        "receipt-drilldown", "fact-drilldown", "recorded-trace", "gateway-outage",
        "reload", "deep-link", "json-opt-in",
      ],
    },
    evidence: {
      rawTraces: [
        "metric-ratio-bar@1.typical.run-1.zip",
        "metric-ratio-bar@1.upper-bound.run-1.zip",
        "recorded-trace-waterfall@1.typical.run-1.zip",
        "recorded-trace-waterfall@1.upper-bound.run-1.zip",
        "recorded-trace-tree@1.typical.run-1.zip",
        "recorded-trace-tree@1.upper-bound.run-1.zip",
      ],
      provenance: {
        superprojectCommit: "53bbdf599ddc582a4ce2b627457105f872dd8eef",
        providerCommit: "45d6ec33148fd81520db203ad047e8af220c3ad2",
        qualifiedProviderCommit: "15d6ec33148fd81520db203ad047e8af220c3ad2",
        consumerCommit: "80c365aa780d0ba8f224b87fb8f34dddd0ae9a3a",
        qualifiedConsumerCommit: "10c365aa780d0ba8f224b87fb8f34dddd0ae9a3a",
        packageIntegrity: "sha512-qualified",
        benchmarkResultSha256: sha256("b"),
      },
    },
  };
}

test("accepts one exact provider, consumer, benchmark and runtime candidate", () => {
  assert.equal(qualifyCrossRepository(fixture()).qualified, true);
});

const negativeCases = [
  ["missing superproject identity", "CROSS_REPOSITORY_SUPERPROJECT_IDENTITY", (value) => { value.superproject.commit = ""; }],
  ["missing Panel", "CROSS_REPOSITORY_PANEL_MISSING", (value) => value.consumer.panels.pop()],
  ["JSON-first fallback", "CROSS_REPOSITORY_JSON_PRIMARY", (value) => { value.consumer.jsonPrimary = true; }],
  ["benchmark version drift", "CROSS_REPOSITORY_BENCHMARK_VERSION", (value) => { value.benchmark.schemaVersion = "panel-benchmark@2"; }],
  ["renderer-ready drift", "CROSS_REPOSITORY_RENDERER_READY", (value) => { value.benchmark.protocol.rendererReady = "load event"; }],
  ["percentile drift", "CROSS_REPOSITORY_PERCENTILE", (value) => { value.benchmark.protocol.percentileAlgorithm = "interpolated"; }],
  ["run-count drift", "CROSS_REPOSITORY_RUN_COUNT", (value) => value.benchmark.results[0].runs.pop()],
  ["interaction protocol drift", "CROSS_REPOSITORY_RUN_COUNT", (value) => { value.benchmark.protocol.interactiveWindowsPerRun = 30; }],
  ["missing interaction evidence", "CROSS_REPOSITORY_INTERACTION_EVIDENCE", (value) => { delete value.benchmark.results[2].runs[0].interactionSample; }],
  ["performance budget failure", "CROSS_REPOSITORY_BENCHMARK_BUDGET", (value) => { value.benchmark.results[0].runs[0].evaluation.passed = false; }],
  ["runner browser drift", "CROSS_REPOSITORY_RUNNER_IDENTITY", (value) => { value.benchmark.results[0].runs[0].environment.browserVersion = "future"; }],
  ["runtime renderer selection", "CROSS_REPOSITORY_RUNTIME_RENDERER", (value) => { value.consumer.runtimeRendererSelector = true; }],
  ["source-path escape", "CROSS_REPOSITORY_SOURCE_PATH", (value) => { value.consumer.sourcePathImports = true; }],
  ["missing raw trace", "CROSS_REPOSITORY_RAW_EVIDENCE", (value) => { value.evidence.rawTraces = []; }],
  ["missing provenance", "CROSS_REPOSITORY_PROVENANCE", (value) => { value.evidence.provenance = null; }],
  ["package integrity drift", "CROSS_REPOSITORY_PACKAGE_IDENTITY", (value) => { value.consumer.packageIntegrity = "sha512-other"; }],
  ["unpublished package source", "CROSS_REPOSITORY_PACKAGE_PUBLICATION", (value) => { value.provider.packageSource = "local-artifact"; }],
  ["published byte drift", "CROSS_REPOSITORY_PACKAGE_PUBLICATION", (value) => { value.provider.publishedPackageSha256 = sha256("e"); }],
  ["provider final-pin tree drift", "CROSS_REPOSITORY_FINAL_PIN", (value) => { value.provider.treeEquivalent = false; }],
  ["consumer final-pin tree drift", "CROSS_REPOSITORY_FINAL_PIN", (value) => { value.consumer.treeEquivalent = false; }],
  ["runtime product gap", "CROSS_REPOSITORY_RUNTIME_SCENARIO", (value) => value.runtime.productScenarios.pop()],
];

for (const [name, code, mutate] of negativeCases) {
  test(`fails closed for ${name}`, () => {
    const value = fixture();
    mutate(value);
    assert.throws(() => qualifyCrossRepository(value), new RegExp(code, "u"));
  });
}
