import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const OWNER_PATHS = Object.freeze(["workflow-package", "execution-system", "evolution-system"]);

function pinnedOwners(repository) {
  return Object.freeze(Object.fromEntries(OWNER_PATHS.map((owner) => [
    owner,
    execFileSync("git", ["rev-parse", `HEAD:${owner}`], {
      cwd: repository,
      encoding: "utf8",
      shell: false,
    }).trim(),
  ])));
}

async function request(url) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "wsr-wave4-workflow-source-qualification",
  };
  if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  const response = await fetch(url, { headers, redirect: "follow" });
  return Object.freeze({ status: response.status, body: new Uint8Array(await response.arrayBuffer()) });
}

export async function qualifyExactPublicCache(repository) {
  const owners = pinnedOwners(repository);
  const deliveryModule = await import(pathToFileURL(path.join(
    repository,
    "execution-system/dist/delivery/index.js",
  )).href);
  const {
    FrozenWorkflowPackageValidatorV2,
    GitHubWorkflowPackageSource,
    WorkflowPackageResolver,
    WorkflowPackageStore,
  } = deliveryModule;
  const cleanRoot = await mkdtemp(path.join(tmpdir(), "wsr-wave4-workflow-source-"));
  let networkRequests = 0;
  try {
    const store = new WorkflowPackageStore({
      readyRoot: path.join(cleanRoot, "ready"),
      stagingRoot: path.join(cleanRoot, "staging"),
    });
    const source = new GitHubWorkflowPackageSource({
      kind: "github",
      repository: "firestige/wsr-workflow-package",
      releasesBaseUrl: "https://api.github.com/repos/firestige/wsr-workflow-package/releases",
      assetPattern: "workflow-package-{name}-{version}.tar.gz",
    }, Object.freeze({
      request: async (url) => {
        networkRequests += 1;
        return request(url);
      },
    }));
    const validator = new FrozenWorkflowPackageValidatorV2(Object.freeze({
      contractVersion: "2.0.0",
      providerIdentity: "provider.qualification",
      providerCapabilities: Object.freeze(["structured-completion", "action-interaction"]),
      hostCapabilities: Object.freeze([
        "deterministic-validation",
        "deterministic-selection",
        "deterministic-transformation",
      ]),
    }));
    const selector = "implementation-workflow@0.4.0";
    const first = await new WorkflowPackageResolver(store, source, validator).resolve(selector);
    if (!first.ok) throw new Error(`PUBLIC_WORKFLOW_QUALIFICATION_FAILED:${first.error.code}`);
    const requestsAfterDownload = networkRequests;
    const offline = Object.freeze({ fetch: async () => { throw new Error("network must not be used"); } });
    const replay = await new WorkflowPackageResolver(store, offline, validator).resolve(selector);
    if (!replay.ok || JSON.stringify(replay.value) !== JSON.stringify(first.value)
      || networkRequests !== requestsAfterDownload) {
      throw new Error("EXACT_CONTENT_CACHE_REPLAY_FAILED");
    }
    return Object.freeze({
      schemaVersion: "wsr.workflow-source-qualification@1.0.0",
      owners,
      source: "firestige/wsr-workflow-package",
      selector,
      packageDigest: first.value.packageDigest,
      workflowId: first.value.workflowId,
      networkRequests,
      cleanDirectoryDownload: "PASS",
      exactContentCacheReplay: "PASS",
    });
  } finally {
    await rm(cleanRoot, { recursive: true, force: true });
  }
}

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.stdout.write(`${JSON.stringify(await qualifyExactPublicCache(repository), null, 2)}\n`);
}
