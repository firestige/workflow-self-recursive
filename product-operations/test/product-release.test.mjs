import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { loadCompatibilityManifest } from "../src/compatibility-manifest.mjs";

const productRoot = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(productRoot, "..");
const execFileAsync = promisify(execFile);

test("the current one-click product installs the qualified DSH 0.2.3 release set", async () => {
  const packageDocument = JSON.parse(await readFile(path.join(productRoot, "package.json"), "utf8"));
  const releaseManifestPath = path.join(repositoryRoot, "release/product", `${packageDocument.version}.json`);
  const packagedManifestPath = path.join(productRoot, "manifests", `product-${packageDocument.version}.json`);

  assert.equal(await readFile(packagedManifestPath, "utf8"), await readFile(releaseManifestPath, "utf8"));
  const manifest = await loadCompatibilityManifest(packagedManifestPath);
  const dsh = manifest.components.find(({ id }) => id === "dsh-bundle");

  assert.equal(manifest.release, packageDocument.version);
  assert.equal(dsh.coordinate, "github-release://firestige/wsr-dsh/0.2.3/compatibility-matrix.json");
  assert.equal(dsh.version, "0.2.3");
  assert.equal(dsh.digest, "sha256:91987c554ca7c14ab8e516590fd77aa393f9fd609d1120e55622f93c894b1ae1");
  assert.deepEqual(dsh.compatibility.packages, {
    execution: "dsh-wsr-execution@0.2.2",
    studio: "dsh-wsr-studio@0.1.2",
    suite: "dsh-wsr@0.2.2",
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
