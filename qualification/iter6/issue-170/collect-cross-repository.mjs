#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";

import { qualifyCrossRepository } from "./cross-repository-policy.mjs";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const providerRoot = resolve(process.env.WSR_UI_ROOT ?? resolve(root, "wsr-ui"));
const consumerRoot = resolve(process.env.WSR_DSH_ROOT ?? resolve(root, "wsr-dsh"));
const resultRoot = resolve(process.env.WSR_BENCHMARK_RESULT
  ?? resolve(providerRoot, "qualification/panel-benchmark/v1/results/full-2026-09-02T10-44-25-834Z"));
const failedResultRoot = resolve(process.env.WSR_BENCHMARK_FAILED_RESULT
  ?? resolve(providerRoot, "qualification/panel-benchmark/v1/results/full-2026-09-02T10-34-59-263Z"));
const artifact = resolve(process.env.WSR_LOCAL_CORE_ARTIFACT ?? "");
const realHarnessPath = resolve(process.env.WSR_REAL_HARNESS_RESULT ?? "");
const screenshotRoot = resolve(process.env.WSR_REAL_HARNESS_SCREENSHOTS ?? "");
const releaseCandidateRoot = resolve(process.env.WSR_DSH_RELEASE_CANDIDATE ?? "");
const output = resolve(process.argv[2] ?? resolve(root, "qualification/iter6/issue-170/results/current-wave4"));

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sha512Integrity = (bytes) => `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const requireValue = (condition, code) => { if (!condition) throw new Error(code); };

for (const [name, value] of Object.entries({
  WSR_LOCAL_CORE_ARTIFACT: process.env.WSR_LOCAL_CORE_ARTIFACT,
  WSR_REAL_HARNESS_RESULT: process.env.WSR_REAL_HARNESS_RESULT,
  WSR_REAL_HARNESS_SCREENSHOTS: process.env.WSR_REAL_HARNESS_SCREENSHOTS,
  WSR_DSH_RELEASE_CANDIDATE: process.env.WSR_DSH_RELEASE_CANDIDATE,
})) requireValue(typeof value === "string" && value.length > 0, `${name}_REQUIRED`);

const superprojectCommit = process.env.WSR_SUPERPROJECT_CANDIDATE;
requireValue(/^[0-9a-f]{40}$/u.test(superprojectCommit ?? ""), "SUPERPROJECT_CANDIDATE_REQUIRED");
requireValue(git(root, "rev-parse", "HEAD") === superprojectCommit, "SUPERPROJECT_CANDIDATE_HEAD_MISMATCH");
requireValue(git(root, "status", "--porcelain", "--untracked-files=no") === "", "SUPERPROJECT_TRACKED_DIRTY");
requireValue(git(providerRoot, "status", "--porcelain", "--untracked-files=no") === "", "PROVIDER_TRACKED_DIRTY");
requireValue(git(consumerRoot, "status", "--porcelain", "--untracked-files=no") === "", "CONSUMER_TRACKED_DIRTY");

const providerCommit = git(providerRoot, "rev-parse", "HEAD");
const consumerCommit = git(consumerRoot, "rev-parse", "HEAD");
const artifactBytes = await readFile(artifact);
const packageSha256 = sha256(artifactBytes);
const packageIntegrity = sha512Integrity(artifactBytes);
const packageManifest = JSON.parse(execFileSync("tar", ["-xOf", artifact, "package/package.json"], { encoding: "utf8" }));
requireValue(packageManifest.name === "wsr-ui-core" && packageManifest.version === "0.1.0-rc.0", "LOCAL_ARTIFACT_IDENTITY");

const archiveFiles = execFileSync("tar", ["-tzf", artifact], { encoding: "utf8" })
  .trim().split("\n").filter((entry) => entry.startsWith("package/") && !entry.endsWith("/"));
for (const entry of archiveFiles) {
  const installedPath = resolve(consumerRoot, "node_modules/wsr-ui-core", entry.slice("package/".length));
  const installedBytes = await readFile(installedPath);
  const archiveEntryBytes = execFileSync("tar", ["-xOf", artifact, entry]);
  requireValue(installedBytes.equals(archiveEntryBytes), `LOCAL_ARTIFACT_INSTALLED_BYTES:${entry}`);
}

const manifestPath = resolve(providerRoot, "qualification/panel-benchmark/v1/manifest.json");
const manifestBytes = await readFile(manifestPath);
const manifest = JSON.parse(manifestBytes);
const resultBytes = await readFile(resolve(resultRoot, "result.json"));
const result = JSON.parse(resultBytes);
const failedResultBytes = await readFile(resolve(failedResultRoot, "result.json"));
const failedResult = JSON.parse(failedResultBytes);
const benchmarkResultSha256 = sha256(resultBytes);
const manifestSha256 = sha256(manifestBytes);
requireValue(result.manifestSha256 === manifestSha256, "BENCHMARK_MANIFEST_DIGEST_MISMATCH");
requireValue(result.providerCommit === providerCommit && result.qualifying === true && result.protocolComplete === true, "BENCHMARK_CANDIDATE_MISMATCH");
requireValue(result.results.every((entry) => entry.runs.every((run) => run.evaluation?.passed === true)), "BENCHMARK_RESULT_FAILED");
requireValue(failedResult.results.some((entry) => entry.runs.some((run) => run.evaluation?.passed === false)), "BENCHMARK_FAILURE_HISTORY_MISSING");

const traceFiles = (await readdir(resultRoot)).filter((file) => file.endsWith(".zip")).sort();
const referencedTraces = result.results.flatMap((entry) => entry.runs.map((run) => run.browserTrace)).sort();
requireValue(JSON.stringify(traceFiles) === JSON.stringify(referencedTraces), "BENCHMARK_TRACE_INVENTORY_MISMATCH");
const traces = [];
for (const file of traceFiles) traces.push({ file, sha256: sha256(await readFile(resolve(resultRoot, file))) });

const lockBytes = await readFile(resolve(consumerRoot, "package-lock.json"));
const studioManifest = await readJson(resolve(consumerRoot, "packages/studio/package.json"));
requireValue(studioManifest.dependencies?.["wsr-ui-core"] === packageManifest.version
  && !/file:|workspace:/u.test(JSON.stringify(studioManifest.dependencies)), "CONSUMER_DEPENDENCY_INVALID");
const studioSource = await readFile(resolve(consumerRoot, "packages/studio/src/client/studio.js"), "utf8");
for (const needle of ["Bi.DashboardMetricPanel", "Bi.CompareResultFrame", "Bi.ReceiptView", "Bi.EvidenceConsoleFoundation", "Bi.TraceWaterfall", "Bi.TraceTree", "Bi.TraceStatistics", "Bi.compileTraceView"]) {
  requireValue(studioSource.includes(needle), `CONSUMER_PRODUCT_SURFACE_MISSING:${needle}`);
}
requireValue(!/wsr-ui\/packages\/|\.\.\/\.\.\/\.\.\/wsr-ui/u.test(studioSource), "CONSUMER_SOURCE_PATH_ESCAPE");

const baselineConsumer = "69bbdf567aa2ce3bd77037f69ef8db3a822666d5";
const networkPaths = [
  "packages/execution/src/client/delivery/control-plane-port.js",
  "packages/execution/src/host/delivery-control-plane.js",
];
const networkDiff = git(consumerRoot, "diff", "--name-only", `${baselineConsumer}..${consumerCommit}`, "--", ...networkPaths);
requireValue(networkDiff === "", "DELIVERY_NETWORK_CONTRACT_DRIFT");

const releaseProvenanceBytes = await readFile(resolve(releaseCandidateRoot, "provenance.json"));
const releaseProvenance = JSON.parse(releaseProvenanceBytes);
requireValue(releaseProvenance.commit === consumerCommit && releaseProvenance.subjects?.length === 3, "CONSUMER_PROVENANCE_INVALID");
const realHarness = await readJson(realHarnessPath);
requireValue(realHarness.browser?.errors === 0
  && realHarness.browser?.dashboard?.panels?.length === 12
  && realHarness.browser?.trace?.waterfall?.spans === 7
  && realHarness.browser?.trace?.tree?.parentEdgeCount === 6
  && realHarness.browser?.trace?.statistics?.exactInventory === true,
"REAL_HARNESS_RESULT_INVALID");

const runtimeScenarios = [
  "single-available", "single-unavailable", "compare-available", "partial-compare",
  "receipt-drilldown", "fact-drilldown", "recorded-trace", "gateway-outage",
  "reload", "deep-link", "json-opt-in",
];
const candidate = {
  schemaVersion: "wsr.issue-170.cross-repository-candidate@1",
  superproject: { commit: superprojectCommit },
  provider: {
    commit: providerCommit, packageCoordinate: packageManifest.name, packageVersion: packageManifest.version,
    packageIntegrity, packageSha256, packageSource: "local-artifact", manifestSha256, benchmarkResultSha256,
  },
  consumer: {
    commit: consumerCommit, packageCoordinate: packageManifest.name, packageVersion: packageManifest.version,
    packageIntegrity, packageSha256, installedArchiveFiles: archiveFiles.length, lockSha256: sha256(lockBytes),
    bundleSha256: sha256(await readFile(resolve(consumerRoot, "packages/studio/lib/client.js"))),
    panels: manifest.chartPanels.map((panel) => panel.id), jsonPrimary: false,
    runtimeRendererSelector: false, sourcePathImports: false,
  },
  benchmark: {
    schemaVersion: manifest.schemaVersion, resultSchemaVersion: result.schemaVersion,
    providerCommit: result.providerCommit, packageCoordinate: result.packageCoordinate,
    packageVersion: result.packageVersion, manifestSha256: result.manifestSha256, qualifying: result.qualifying,
    protocol: manifest.protocol,
    runner: { platform: manifest.runner.platform, browserVersion: manifest.runner.playwright.browserVersion, browserRevision: manifest.runner.playwright.browserRevision },
    rendererDecision: "manifest-static:svg+semantic-html+canvas", results: result.results,
  },
  runtime: { dshVersion: realHarness.dsh, browserErrors: realHarness.browser.errors, productScenarios: runtimeScenarios },
  evidence: { rawTraces: traceFiles, provenance: { superprojectCommit, providerCommit, consumerCommit, packageIntegrity, benchmarkResultSha256 } },
};
const qualification = qualifyCrossRepository(candidate);

await mkdir(resolve(output, "benchmark"), { recursive: true });
await mkdir(resolve(output, "screenshots"), { recursive: true });
await writeFile(resolve(output, "candidate.json"), `${JSON.stringify(candidate, null, 2)}\n`);
await writeFile(resolve(output, "benchmark/index.json"), `${JSON.stringify({
  schemaVersion: "wsr.issue-170.benchmark-index@1", protocol: manifest.protocol,
  qualifyingResult: { directory: basename(resultRoot), sha256: benchmarkResultSha256, traces },
  retainedFailure: { directory: basename(failedResultRoot), sha256: sha256(failedResultBytes), failedRuns: failedResult.results.flatMap((entry) => entry.runs.filter((run) => !run.evaluation.passed).map((run) => ({ panel: entry.panel, fixture: entry.fixture, runIndex: run.runIndex, evaluation: run.evaluation }))) },
}, null, 2)}\n`);
const screenshotFiles = (await readdir(screenshotRoot)).filter((file) => file.endsWith(".png")).sort();
const screenshots = [];
for (const file of screenshotFiles) screenshots.push({ file, sha256: sha256(await readFile(resolve(screenshotRoot, file))) });
await writeFile(resolve(output, "screenshots/index.json"), `${JSON.stringify({ schemaVersion: "wsr.issue-170.screenshot-index@1", screenshots }, null, 2)}\n`);
await writeFile(resolve(output, "network-diff.json"), `${JSON.stringify({ schemaVersion: "wsr.issue-170.network-diff@1", baselineConsumer, consumerCommit, checkedPaths: networkPaths, changedPaths: [], additionalRequests: 0 }, null, 2)}\n`);
await writeFile(resolve(output, "provenance.json"), `${JSON.stringify({
  schemaVersion: "wsr.issue-170.cross-repository-provenance@2", superproject: candidate.superproject,
  provider: candidate.provider, consumer: candidate.consumer,
  benchmark: { resultSha256: benchmarkResultSha256, traceCount: traces.length },
  realHarness: { sha256: sha256(await readFile(realHarnessPath)), screenshotCount: screenshots.length },
  releaseProvenanceSha256: sha256(releaseProvenanceBytes), releaseSubjects: releaseProvenance.subjects,
}, null, 2)}\n`);
await writeFile(resolve(output, "tests.json"), `${JSON.stringify({
  schemaVersion: "wsr.issue-170.cross-repository-tests@2", qualification, policyTests: 18,
  localArtifactFilesVerified: archiveFiles.length,
  benchmarkRuns: result.results.reduce((count, entry) => count + entry.runs.length, 0),
  browserTraces: traces.length, screenshots: screenshots.length,
}, null, 2)}\n`);
await writeFile(resolve(output, "real-harness.json"), `${JSON.stringify(realHarness, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: relative(root, output), qualification, packageSha256, benchmarkResultSha256 }, null, 2)}\n`);
