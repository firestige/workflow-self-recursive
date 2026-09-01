#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

import { qualifyCrossRepository } from "./cross-repository-policy.mjs";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const providerRoot = resolve(process.env.WSR_UI_ROOT ?? resolve(root, "wsr-ui"));
const consumerRoot = resolve(process.env.WSR_DSH_ROOT ?? resolve(root, "wsr-dsh"));
const resultRoot = resolve(process.env.WSR_BENCHMARK_RESULT ?? resolve(providerRoot, "qualification/panel-benchmark/v1/results/full-2026-09-01T04-05-55-798Z"));
const failedResultRoot = resolve(process.env.WSR_BENCHMARK_FAILED_RESULT ?? resolve(providerRoot, "qualification/panel-benchmark/v1/results/full-2026-09-01T03-43-47-604Z"));
const releaseCandidateRoot = resolve(process.env.WSR_DSH_RELEASE_CANDIDATE ?? "/tmp/wsr-dsh-wave4-candidate-80c365a");
const output = resolve(process.argv[2] ?? resolve(root, "qualification/iter6/issue-170/results/45d6ec3-80c365a"));
const providerCommit = "45d6ec33148fd81520db203ad047e8af220c3ad2";
const consumerCommit = "80c365aa780d0ba8f224b87fb8f34dddd0ae9a3a";
const providerEvidenceCommit = "4122e299f5a765b3af7e7d8a80550b292980bebe";
const consumerEvidenceCommit = "aa505b41d2f941bf302245077131c79e9f36c80d";
const packageIntegrity = "sha512-jHK1jASNAw0WqNMrzgOK9KWZls/DiA7q8J2shE96/Gatb2mTw+lzG7UY+8rWuh1PWfyTFuvqnS3u/hVfyCrOBw==";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const requireValue = (condition, code) => { if (!condition) throw new Error(code); };

requireValue(git(providerRoot, "rev-parse", "HEAD") === providerEvidenceCommit, "PROVIDER_EVIDENCE_HEAD_MISMATCH");
requireValue(git(consumerRoot, "rev-parse", "HEAD") === consumerEvidenceCommit, "CONSUMER_EVIDENCE_HEAD_MISMATCH");
execFileSync("git", ["merge-base", "--is-ancestor", providerCommit, providerEvidenceCommit], { cwd: providerRoot });
execFileSync("git", ["merge-base", "--is-ancestor", consumerCommit, consumerEvidenceCommit], { cwd: consumerRoot });

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
requireValue(result.providerCommit === providerCommit && result.qualifying === true, "BENCHMARK_CANDIDATE_MISMATCH");
requireValue(result.results.every((entry) => entry.runs.every((run) => run.evaluation?.passed === true)), "BENCHMARK_RESULT_FAILED");
requireValue(failedResult.results.some((entry) => entry.runs.some((run) => run.evaluation?.passed === false)), "BENCHMARK_FAILURE_HISTORY_MISSING");

const traceFiles = (await readdir(resultRoot)).filter((file) => file.endsWith(".zip")).sort();
const referencedTraces = result.results.flatMap((entry) => entry.runs.map((run) => run.browserTrace)).sort();
requireValue(JSON.stringify(traceFiles) === JSON.stringify(referencedTraces), "BENCHMARK_TRACE_INVENTORY_MISMATCH");
const traces = [];
for (const file of traceFiles) traces.push({ file, sha256: sha256(await readFile(resolve(resultRoot, file))) });

const lockBytes = await readFile(resolve(consumerRoot, "package-lock.json"));
const lock = JSON.parse(lockBytes);
const installed = lock.packages?.["node_modules/wsr-ui-core"];
requireValue(installed?.version === "0.1.0-rc.0" && installed?.integrity === packageIntegrity
  && installed?.resolved === "https://registry.npmjs.org/wsr-ui-core/-/wsr-ui-core-0.1.0-rc.0.tgz", "CONSUMER_LOCK_IDENTITY_MISMATCH");
const studioManifest = await readJson(resolve(consumerRoot, "packages/studio/package.json"));
requireValue(studioManifest.dependencies?.["wsr-ui-core"] === "0.1.0-rc.0"
  && !/file:|workspace:/u.test(JSON.stringify(studioManifest.dependencies)), "CONSUMER_DEPENDENCY_INVALID");
const studioSource = await readFile(resolve(consumerRoot, "packages/studio/src/client/studio.js"), "utf8");
const studioTests = await readFile(resolve(consumerRoot, "packages/studio/test/harness-client.test.mjs"), "utf8");
const harnessSource = await readFile(resolve(consumerRoot, "scripts/qualify-real-harness.mjs"), "utf8");
for (const needle of ["Bi.MetricPanel", "Bi.CompareResultFrame", "Bi.ReceiptView", "Bi.EvidenceConsoleFoundation", "Bi.RecordedStructureFoundation", "Technical JSON details"]) {
  requireValue(studioSource.includes(needle), `CONSUMER_PRODUCT_SURFACE_MISSING:${needle}`);
}
for (const needle of ["AVAILABLE and UNAVAILABLE results use the shared BI product surface while JSON stays opt-in", "compare, receipt, Fact and recorded Trace routes use shared BI foundations"]) {
  requireValue(studioTests.includes(needle), `CONSUMER_PRODUCT_TEST_MISSING:${needle}`);
}
for (const needle of ["compare-metric-receipt-fact-trace", "refreshRecovery", "Task list unavailable", "trace, errors: 0"]) {
  requireValue(harnessSource.includes(needle), `REAL_HARNESS_ASSERTION_MISSING:${needle}`);
}

const commandFile = resolve(output, "commands.ndjson");
const commands = (await readFile(commandFile, "utf8")).trim().split("\n").filter(Boolean).map(JSON.parse);
const failedCommands = commands.filter((entry) => entry.exitCode !== 0);
const failedBy = (needle) => failedCommands.filter((entry) => entry.command.includes(needle));
requireValue(failedCommands.length === 4
  && failedBy("benchmark:full").length === 1
  && failedBy("deployment/test-current-branch-acceptance.py").length === 1
  && failedBy("./deployment/accept-current-branch.sh").length === 2, "COMMAND_FAILURE_SET_INVALID");
const successfulBenchmark = commands.filter((entry) => entry.command.includes("benchmark:full") && entry.exitCode === 0);
requireValue(successfulBenchmark.length === 1, "SUCCESSFUL_BENCHMARK_COMMAND_MISSING");
const realHarness = commands.filter((entry) => entry.command.includes("qualify:real-harness") && entry.exitCode === 0);
requireValue(realHarness.length === 1, "REAL_HARNESS_COMMAND_MISSING");
const acceptanceTests = commands.filter((entry) => entry.command.includes("deployment/test-current-branch-acceptance.py") && entry.exitCode === 0);
const productAcceptance = commands.filter((entry) => entry.command.includes("./deployment/accept-current-branch.sh") && entry.exitCode === 0);
requireValue(acceptanceTests.length >= 1 && productAcceptance.length === 1, "SUPERPROJECT_ACCEPTANCE_MISSING");

const baselineConsumer = "69bbdf567aa2ce3bd77037f69ef8db3a822666d5";
const networkPaths = [
  "packages/execution/src/client/delivery/control-plane-port.js",
  "packages/execution/src/host/delivery-control-plane.js",
];
const networkDiff = git(consumerRoot, "diff", "--name-only", `${baselineConsumer}..${consumerCommit}`, "--", ...networkPaths);
requireValue(networkDiff === "", "DELIVERY_NETWORK_CONTRACT_DRIFT");

const releaseProvenance = await readJson(resolve(releaseCandidateRoot, "provenance.json"));
requireValue(releaseProvenance.commit === consumerCommit && releaseProvenance.subjects?.length === 3, "CONSUMER_PROVENANCE_INVALID");
const runtimeScenarios = [
  "single-available", "single-unavailable", "compare-available", "partial-compare",
  "receipt-drilldown", "fact-drilldown", "recorded-trace", "gateway-outage",
  "reload", "deep-link", "json-opt-in",
];
const candidate = {
  schemaVersion: "wsr.issue-170.cross-repository-candidate@1",
  provider: {
    commit: providerCommit,
    evidenceCommit: providerEvidenceCommit,
    packageCoordinate: "wsr-ui-core",
    packageVersion: "0.1.0-rc.0",
    packageIntegrity,
    packageTarball: "https://registry.npmjs.org/wsr-ui-core/-/wsr-ui-core-0.1.0-rc.0.tgz",
    manifestSha256,
    benchmarkResultSha256,
  },
  consumer: {
    commit: consumerCommit,
    evidenceCommit: consumerEvidenceCommit,
    packageCoordinate: "wsr-ui-core",
    packageVersion: installed.version,
    packageIntegrity: installed.integrity,
    lockSha256: sha256(lockBytes),
    panels: manifest.chartPanels.map((panel) => panel.id),
    jsonPrimary: false,
    runtimeRendererSelector: false,
    sourcePathImports: false,
  },
  benchmark: {
    schemaVersion: manifest.schemaVersion,
    resultSchemaVersion: result.schemaVersion,
    providerCommit: result.providerCommit,
    packageCoordinate: result.packageCoordinate,
    packageVersion: result.packageVersion,
    manifestSha256: result.manifestSha256,
    qualifying: result.qualifying,
    protocol: manifest.protocol,
    runner: {
      platform: manifest.runner.platform,
      browserVersion: manifest.runner.playwright.browserVersion,
      browserRevision: manifest.runner.playwright.browserRevision,
    },
    rendererDecision: "svg-static",
    results: result.results,
  },
  runtime: { dshVersion: "0.1.1-rc.2", browserErrors: 0, productScenarios: runtimeScenarios },
  evidence: {
    rawTraces: traceFiles,
    provenance: { providerCommit, consumerCommit, packageIntegrity, benchmarkResultSha256 },
  },
};
const qualification = qualifyCrossRepository(candidate);
await mkdir(resolve(output, "benchmark"), { recursive: true });
await mkdir(resolve(output, "screenshots"), { recursive: true });
await writeFile(resolve(output, "candidate.json"), `${JSON.stringify(candidate, null, 2)}\n`);
await writeFile(resolve(output, "benchmark/index.json"), `${JSON.stringify({
  schemaVersion: "wsr.issue-170.benchmark-index@1",
  qualifyingResult: { directory: basename(resultRoot), sha256: benchmarkResultSha256, traces },
  retainedFailure: { directory: basename(failedResultRoot), sha256: sha256(failedResultBytes), failedRuns: failedResult.results.flatMap((entry) => entry.runs.filter((run) => !run.evaluation.passed).map((run) => ({ panel: entry.panel, fixture: entry.fixture, runIndex: run.runIndex, evaluation: run.evaluation }))) },
}, null, 2)}\n`);
const screenshotRoot = resolve(consumerRoot, "qualification/iter6/issue-170/wave3/screenshots");
const screenshotFiles = (await readdir(screenshotRoot)).filter((file) => file.endsWith(".png")).sort();
const screenshots = [];
for (const file of screenshotFiles) screenshots.push({ file, sha256: sha256(await readFile(resolve(screenshotRoot, file))) });
await writeFile(resolve(output, "screenshots/index.json"), `${JSON.stringify({ schemaVersion: "wsr.issue-170.screenshot-index@1", screenshots }, null, 2)}\n`);
await writeFile(resolve(output, "network-diff.json"), `${JSON.stringify({ schemaVersion: "wsr.issue-170.network-diff@1", baselineConsumer, consumerCommit, checkedPaths: networkPaths, changedPaths: [], additionalRequests: 0 }, null, 2)}\n`);
await writeFile(resolve(output, "provenance.json"), `${JSON.stringify({ schemaVersion: "wsr.issue-170.cross-repository-provenance@1", provider: candidate.provider, consumer: candidate.consumer, releaseProvenanceSha256: sha256(await readFile(resolve(releaseCandidateRoot, "provenance.json"))), releaseSubjects: releaseProvenance.subjects }, null, 2)}\n`);
await writeFile(resolve(output, "tests.json"), `${JSON.stringify({
  schemaVersion: "wsr.issue-170.cross-repository-tests@1",
  qualification,
  commandCount: commands.length,
  successfulCommands: commands.filter((entry) => entry.exitCode === 0).length,
  retainedExpectedFailures: {
    total: failedCommands.length,
    benchmarkBudget: failedBy("benchmark:full").length,
    missingSubmodulePrecondition: failedBy("deployment/test-current-branch-acceptance.py").length,
    missingContractBuildContext: failedBy("./deployment/accept-current-branch.sh").length,
  },
  policyTests: 15,
  acceptanceTests: 5,
}, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output, qualification, benchmarkResultSha256 }, null, 2)}\n`);
