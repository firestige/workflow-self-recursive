import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { loadCompatibilityManifest } from "../src/compatibility-manifest.mjs";

const productRoot = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(productRoot, "..");
const execFileAsync = promisify(execFile);

test("the current one-click product installs the qualified DSH 0.2.10 release set", async () => {
  const packageDocument = JSON.parse(await readFile(path.join(productRoot, "package.json"), "utf8"));
  const releaseManifestPath = path.join(repositoryRoot, "release/product", `${packageDocument.version}.json`);
  const packagedManifestPath = path.join(productRoot, "manifests", `product-${packageDocument.version}.json`);

  assert.equal(await readFile(packagedManifestPath, "utf8"), await readFile(releaseManifestPath, "utf8"));
  const manifest = await loadCompatibilityManifest(packagedManifestPath);
  const dsh = manifest.components.find(({ id }) => id === "dsh-bundle");
  const ownerRecord = JSON.parse(await readFile(path.join(repositoryRoot, "wsr-dsh/config/dsh-compatibility.json"), "utf8")).executionOwner;
  const [execution, studio, suite] = await Promise.all(["execution", "studio", "suite"].map(async (name) =>
    JSON.parse(await readFile(path.join(repositoryRoot, `wsr-dsh/packages/${name}/package.json`), "utf8"))));

  assert.equal(manifest.release, packageDocument.version);
  assert.equal(dsh.coordinate, "github-release://firestige/wsr-dsh/0.2.10/compatibility-matrix.json");
  assert.equal(dsh.version, "0.2.10");
  assert.equal(dsh.digest, "sha256:d2b17db8b9a3635a33a1db2470cce8a992ea50ffc84a777ac521e39cc92c3fa0");
  assert.deepEqual(dsh.compatibility.executionOwner, {
    package: ownerRecord.package,
    version: ownerRecord.version,
    release: ownerRecord.release,
    coordinate: ownerRecord.coordinate,
    digest: `sha256:${ownerRecord.assetSha256}`,
  });
  assert.deepEqual(dsh.compatibility.packages, {
    execution: `${execution.name}@${execution.version}`,
    studio: `${studio.name}@${studio.version}`,
    suite: `${suite.name}@${suite.version}`,
  });
});

test("the CLI default resolves the manifest matching its packaged product version", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-product-release-"));
  const packageDocument = JSON.parse(await readFile(path.join(productRoot, "package.json"), "utf8"));
  const manifest = await loadCompatibilityManifest(
    path.join(productRoot, "manifests", `product-${packageDocument.version}.json`),
  );
  const expectedOperationId = createHash("sha256")
    .update(`config\0${manifest.digest}`)
    .digest("hex")
    .slice(0, 24);

  const { stdout } = await execFileAsync(process.execPath, [
    path.join(productRoot, "bin/wsr.mjs"),
    "config",
    "--state-dir", path.join(directory, "state"),
    "--config", path.join(directory, "config.json"),
  ]);

  assert.equal(JSON.parse(stdout).operationId, expectedOperationId);
});

test("the Product publisher checks out the pinned DSH owner record", async () => {
  const workflow = await readFile(path.join(repositoryRoot, ".github/workflows/release-compose-bundle.yml"), "utf8");
  const productJob = workflow.split("build-and-qualify-product:")[1];
  assert.match(productJob, /actions\/checkout@v6[\s\S]*submodules: recursive/u);
});

test("the packed CLI resumes or rolls back an interrupted composite upgrade", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-packed-recovery-"));
  const archiveDirectory = path.join(directory, "archives");
  const extractedDirectory = path.join(directory, "extracted");
  await mkdir(archiveDirectory);
  await mkdir(extractedDirectory);
  const { stdout: archiveNameOutput } = await execFileAsync("npm", [
    "pack", productRoot, "--silent", "--pack-destination", archiveDirectory,
  ]);
  const archivePath = path.join(archiveDirectory, archiveNameOutput.trim());
  await execFileAsync("tar", ["-xzf", archivePath, "-C", extractedDirectory]);
  const packagedRoot = path.join(extractedDirectory, "package");
  const packageDocument = JSON.parse(await readFile(path.join(packagedRoot, "package.json"), "utf8"));
  const manifestPath = path.join(packagedRoot, "manifests", `product-${packageDocument.version}.json`);
  const fixturePath = path.join(directory, "fixture.json");
  const configPath = path.join(directory, "config.json");

  async function invoke(command, stateDirectory, fixture) {
    await writeFile(fixturePath, `${JSON.stringify(fixture)}\n`);
    try {
      const { stdout } = await execFileAsync(process.execPath, [
        path.join(packagedRoot, "bin/wsr.mjs"), command,
        "--manifest", manifestPath,
        "--state-dir", stateDirectory,
        "--config", configPath,
        "--fixture", fixturePath,
      ]);
      return JSON.parse(stdout);
    } catch (error) {
      return JSON.parse(error.stdout);
    }
  }

  const resumeState = path.join(directory, "resume-state");
  const interruptedForResume = await invoke("upgrade", resumeState, { interruptOnceAt: "services" });
  assert.equal(interruptedForResume.status, "blocked");
  assert.equal(interruptedForResume.resume.nextComponent, "services");
  const resumed = await invoke("upgrade", resumeState, {});
  assert.equal(resumed.status, "succeeded");
  assert.deepEqual(resumed.components.map(({ id, phase }) => ({ id, phase })), [
    { id: "dsh-bundle", phase: "resume" },
    { id: "services", phase: "apply" },
    { id: "workflow-source", phase: "apply" },
    { id: "providers", phase: "apply" },
  ]);

  const rollbackState = path.join(directory, "rollback-state");
  assert.equal((await invoke("upgrade", rollbackState, { interruptOnceAt: "services" })).status, "blocked");
  const rolledBack = await invoke("rollback", rollbackState, {});
  assert.equal(rolledBack.status, "succeeded");
  assert.deepEqual(rolledBack.components.map(({ id, phase }) => ({ id, phase })), [
    { id: "services", phase: "abort" },
    { id: "dsh-bundle", phase: "rollback" },
  ]);
});
