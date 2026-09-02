const REQUIRED_PANELS = [
  "metric-ratio-bar@1",
  "recorded-trace-waterfall@1",
  "recorded-trace-tree@1",
];
const INTERACTIVE_PANELS = new Set([
  "recorded-trace-waterfall@1",
  "recorded-trace-tree@1",
]);
const REQUIRED_SCENARIOS = [
  "single-available", "single-unavailable", "compare-available", "partial-compare",
  "receipt-drilldown", "fact-drilldown", "recorded-trace", "gateway-outage",
  "reload", "deep-link", "json-opt-in",
];
const RENDERER_READY = "geometry fonts ready and SVG attributes committed or Canvas draw completed";

function fail(code, detail) {
  throw new Error(`${code}: ${detail}`);
}

function nonEmpty(value) {
  return typeof value === "string" && value.length > 0;
}

export function qualifyCrossRepository(candidate) {
  if (candidate?.schemaVersion !== "wsr.issue-170.cross-repository-candidate@1") {
    fail("CROSS_REPOSITORY_SCHEMA", "candidate schema is not exact");
  }
  const { superproject, provider, consumer, benchmark, runtime, evidence } = candidate;
  if (!/^[0-9a-f]{40}$/u.test(superproject?.commit ?? "")) {
    fail("CROSS_REPOSITORY_SUPERPROJECT_IDENTITY", "superproject candidate commit is not exact");
  }
  if (![provider?.commit, provider?.qualifiedCommit, provider?.packageCoordinate, provider?.packageVersion, provider?.packageIntegrity,
    provider?.manifestSha256, provider?.benchmarkResultSha256, consumer?.commit, consumer?.qualifiedCommit, consumer?.lockSha256]
    .every(nonEmpty)) fail("CROSS_REPOSITORY_PROVENANCE", "candidate identity is incomplete");
  if (provider.packageCoordinate !== consumer.packageCoordinate
    || provider.packageVersion !== consumer.packageVersion
    || provider.packageIntegrity !== consumer.packageIntegrity) {
    fail("CROSS_REPOSITORY_PACKAGE_IDENTITY", "provider and consumer package identities differ");
  }
  if (provider.packageSource !== "registry-published+local-byte-match"
    || !nonEmpty(provider.packageSha256)
    || provider.publishedPackageSha256 !== provider.packageSha256) {
    fail("CROSS_REPOSITORY_PACKAGE_PUBLICATION", "published and locally rebuilt package bytes differ");
  }
  if (provider.treeEquivalent !== true || consumer.treeEquivalent !== true) {
    fail("CROSS_REPOSITORY_FINAL_PIN", "final main pins do not preserve the qualified candidate trees");
  }
  for (const panel of REQUIRED_PANELS) {
    if (!consumer.panels?.includes(panel)) fail("CROSS_REPOSITORY_PANEL_MISSING", panel);
  }
  if (consumer.jsonPrimary !== false) fail("CROSS_REPOSITORY_JSON_PRIMARY", "JSON must remain opt-in");
  if (consumer.runtimeRendererSelector !== false) fail("CROSS_REPOSITORY_RUNTIME_RENDERER", "renderer selection must be static");
  if (consumer.sourcePathImports !== false) fail("CROSS_REPOSITORY_SOURCE_PATH", "consumer must resolve only the package");

  if (benchmark?.schemaVersion !== "panel-benchmark@1"
    || benchmark?.resultSchemaVersion !== "panel-benchmark-result@1") {
    fail("CROSS_REPOSITORY_BENCHMARK_VERSION", "benchmark contract or result revision drifted");
  }
  if (benchmark.providerCommit !== provider.qualifiedCommit
    || benchmark.packageCoordinate !== provider.packageCoordinate
    || benchmark.packageVersion !== provider.packageVersion
    || benchmark.manifestSha256 !== provider.manifestSha256
    || benchmark.qualifying !== true) {
    fail("CROSS_REPOSITORY_BENCHMARK_IDENTITY", "benchmark is not bound to the provider candidate");
  }
  if (benchmark.protocol?.rendererReady !== RENDERER_READY) {
    fail("CROSS_REPOSITORY_RENDERER_READY", "renderer-ready definition drifted");
  }
  if (benchmark.protocol?.percentileAlgorithm !== "nearest-rank") {
    fail("CROSS_REPOSITORY_PERCENTILE", "percentile algorithm drifted");
  }
  if (benchmark.protocol?.warmupSamples !== 1 || benchmark.protocol?.measuredSamplesPerRun !== 30
    || benchmark.protocol?.independentRuns !== 3
    || benchmark.protocol?.interactiveWindowsPerRun !== 1
    || benchmark.protocol?.interactiveDurationMsPerRun !== 5000) {
    fail("CROSS_REPOSITORY_RUN_COUNT", "benchmark protocol sample counts drifted");
  }
  if (benchmark.rendererDecision !== "manifest-static:svg+semantic-html+canvas") {
    fail("CROSS_REPOSITORY_RUNTIME_RENDERER", "qualified renderers are not statically bound by the manifest");
  }
  for (const result of benchmark.results ?? []) {
    if (result.runs?.length !== 3) fail("CROSS_REPOSITORY_RUN_COUNT", `${result.panel}/${result.fixture}`);
    for (const run of result.runs) {
      if (run.warmupSamples !== 1 || run.rawSamples?.length !== 30 || !nonEmpty(run.browserTrace)) {
        fail("CROSS_REPOSITORY_RAW_EVIDENCE", `${result.panel}/${result.fixture}/run-${run.runIndex}`);
      }
      if (INTERACTIVE_PANELS.has(result.panel)
        && (run.interactionSample?.durationMs !== 5000
          || !Array.isArray(run.interactionSample?.frameDurations)
          || run.interactionSample.frameDurations.length === 0
          || !Array.isArray(run.interactionSample?.longTasks))) {
        fail("CROSS_REPOSITORY_INTERACTION_EVIDENCE", `${result.panel}/${result.fixture}/run-${run.runIndex}`);
      }
      if (run.evaluation?.passed !== true) {
        fail("CROSS_REPOSITORY_BENCHMARK_BUDGET", `${result.panel}/${result.fixture}/run-${run.runIndex}`);
      }
      const expectedPlatform = benchmark.runner?.platform?.replace(/\/v8$/u, "");
      if (run.environment?.platform !== expectedPlatform
        || run.environment?.browserVersion !== benchmark.runner?.browserVersion
        || run.environment?.browserRevision !== benchmark.runner?.browserRevision) {
        fail("CROSS_REPOSITORY_RUNNER_IDENTITY", `${result.panel}/${result.fixture}/run-${run.runIndex}`);
      }
    }
  }
  for (const panel of REQUIRED_PANELS) {
    for (const fixture of ["typical", "upper-bound"]) {
      if (!benchmark.results?.some((result) => result.panel === panel && result.fixture === fixture)) {
        fail("CROSS_REPOSITORY_RAW_EVIDENCE", `${panel}/${fixture}`);
      }
    }
  }
  if (!Array.isArray(evidence?.rawTraces) || evidence.rawTraces.length < 4) {
    fail("CROSS_REPOSITORY_RAW_EVIDENCE", "raw browser traces are incomplete");
  }
  if (evidence?.provenance === null || typeof evidence?.provenance !== "object"
    || evidence.provenance.superprojectCommit !== superproject.commit
    || evidence.provenance.providerCommit !== provider.commit
    || evidence.provenance.qualifiedProviderCommit !== provider.qualifiedCommit
    || evidence.provenance.consumerCommit !== consumer.commit
    || evidence.provenance.qualifiedConsumerCommit !== consumer.qualifiedCommit
    || evidence.provenance.packageIntegrity !== provider.packageIntegrity
    || evidence.provenance.benchmarkResultSha256 !== provider.benchmarkResultSha256) {
    fail("CROSS_REPOSITORY_PROVENANCE", "provenance does not bind the exact candidate");
  }
  if (runtime?.browserErrors !== 0 || runtime?.dshVersion !== "0.1.1-rc.2") {
    fail("CROSS_REPOSITORY_RUNTIME", "real Host qualification is not clean");
  }
  for (const scenario of REQUIRED_SCENARIOS) {
    if (!runtime.productScenarios?.includes(scenario)) fail("CROSS_REPOSITORY_RUNTIME_SCENARIO", scenario);
  }
  return {
    qualified: true,
    matrix: {
      localArtifactProvenance: "PASS",
      positiveProduct: "PASS",
      encapsulationNegative: "PASS",
      benchmark: "PASS",
      realWeb: "PASS",
    },
  };
}
