import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import { loadCompatibilityManifest } from "../src/compatibility-manifest.mjs";

const execFileAsync = promisify(execFile);
const cliPath = path.resolve(import.meta.dirname, "../bin/wsr.mjs");

function manifestDocument(release = "target-2") {
  return {
    schema: "wsr.compatibility@1.0.0",
    release,
    components: [{
      id: "execution",
      layer: "execution",
      coordinate: "fixture://execution",
      version: "1.2.3",
      digest: `sha256:${createHash("sha256").update(release).digest("hex")}`,
    }],
  };
}

async function invoke(args) {
  try {
    const result = await execFileAsync(process.execPath, [cliPath, ...args]);
    return { ...result, exitCode: 0 };
  } catch (error) {
    return { stdout: error.stdout, stderr: error.stderr, exitCode: error.code };
  }
}

async function cliFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-cli-description-"));
  const manifestPath = path.join(root, "target.json");
  const fixturePath = path.join(root, "fixture.json");
  const stateDirectory = path.join(root, "state");
  await writeFile(manifestPath, `${JSON.stringify(manifestDocument())}\n`);
  await writeFile(fixturePath, "{}\n");
  return { root, manifestPath, fixturePath, stateDirectory };
}

test("help and --help are available before config, state, manifest, or adapters", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-cli-help-"));
  await mkdir(path.join(root, "not-a-file"));

  for (const command of ["help", "--help"]) {
    const result = await invoke([
      command,
      "--config", path.join(root, "not-a-file"),
      "--state-dir", path.join(root, "missing-state"),
      "--manifest", path.join(root, "missing-manifest.json"),
      "--fixture", path.join(root, "missing-fixture.json"),
    ]);
    assert.equal(result.exitCode, 0, command);
    assert.equal(result.stderr, "", command);
    assert.match(result.stdout, /Usage: wsr <command> \[options\]/u, command);
    assert.match(result.stdout, /help[\s\S]*version[\s\S]*setup[\s\S]*uninstall/u, command);
    assert.match(result.stdout, /Exit codes:[\s\S]*0[\s\S]*2[\s\S]*3/u, command);
  }
});

test("--version reports only the CLI package version before installation inputs", async () => {
  const result = await invoke([
    "--version", "--config", "/missing/config", "--manifest", "/missing/manifest",
  ]);
  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\n$/u);
});

test("version distinguishes absent applied state from the default target", async () => {
  const fixture = await cliFixture();
  const result = await invoke([
    "version", "--manifest", fixture.manifestPath, "--state-dir", fixture.stateDirectory,
  ]);
  assert.equal(result.exitCode, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.schema, "wsr.operations.result@1.0.0");
  assert.equal(output.command, "version");
  assert.match(output.data.cli.version, /^\d+\.\d+\.\d+/u);
  assert.equal(output.data.applied, null);
  assert.equal(output.data.target.release, "target-2");
  assert.match(output.data.target.manifestDigest, /^sha256:[0-9a-f]{64}$/u);
  assert.equal(output.data.activeOperation, null);
  assert.equal(output.data.alignment, "not-installed");
});

test("version reports applied drift and a separately verified active operation", async () => {
  const fixture = await cliFixture();
  const appliedPath = path.join(fixture.stateDirectory, "releases", "applied-1", "compatibility.json");
  const operationPath = path.join(fixture.stateDirectory, "operation-manifests");
  await mkdir(path.dirname(appliedPath), { recursive: true });
  await mkdir(operationPath, { recursive: true });
  await writeFile(appliedPath, `${JSON.stringify(manifestDocument("applied-1"))}\n`);
  const applied = await loadCompatibilityManifest(appliedPath);
  const activeDocument = manifestDocument("active-3");
  const temporaryActivePath = path.join(fixture.root, "active.json");
  await writeFile(temporaryActivePath, `${JSON.stringify(activeDocument)}\n`);
  const active = await loadCompatibilityManifest(temporaryActivePath);
  await writeFile(path.join(operationPath, `${active.digest.slice(7)}.json`), `${JSON.stringify(activeDocument)}\n`);
  await writeFile(path.join(fixture.stateDirectory, "active-release.json"), `${JSON.stringify({
    schemaVersion: "wsr.active-release@1.0.0",
    release: applied.release,
    manifestDigest: applied.digest,
    manifest: "releases/applied-1/compatibility.json",
  })}\n`);
  await writeFile(path.join(fixture.stateDirectory, "operations-state.json"), `${JSON.stringify({
    schema: "wsr.operations.state@1.0.0",
    completed: {},
    active: {
      operationId: "resume-me",
      command: "upgrade",
      manifestDigest: active.digest,
      completedComponents: [],
      currentComponent: "execution",
    },
  })}\n`);

  const result = await invoke([
    "version", "--manifest", fixture.manifestPath, "--state-dir", fixture.stateDirectory,
  ]);
  assert.equal(result.exitCode, 0);
  const versions = JSON.parse(result.stdout).data;
  assert.equal(versions.applied.release, "applied-1");
  assert.equal(versions.target.release, "target-2");
  assert.equal(versions.alignment, "drifted");
  assert.deepEqual(versions.activeOperation, {
    operationId: "resume-me",
    command: "upgrade",
    release: "active-3",
    manifestDigest: active.digest,
    currentComponent: "execution",
    resumable: true,
  });
});

test("version reports an installed target as aligned only after verifying the retained manifest", async () => {
  const fixture = await cliFixture();
  const retainedPath = path.join(fixture.stateDirectory, "releases", "target-2", "compatibility.json");
  await mkdir(path.dirname(retainedPath), { recursive: true });
  await writeFile(retainedPath, `${JSON.stringify(manifestDocument())}\n`);
  const retained = await loadCompatibilityManifest(retainedPath);
  await writeFile(path.join(fixture.stateDirectory, "active-release.json"), `${JSON.stringify({
    schemaVersion: "wsr.active-release@1.0.0",
    release: retained.release,
    manifestDigest: retained.digest,
    manifest: "releases/target-2/compatibility.json",
  })}\n`);

  const result = await invoke(["version", "--manifest", fixture.manifestPath, "--state-dir", fixture.stateDirectory]);
  assert.equal(result.exitCode, 0);
  const versions = JSON.parse(result.stdout).data;
  assert.deepEqual(versions.applied, versions.target);
  assert.equal(versions.alignment, "aligned");
});

test("version fails closed when the applied manifest is missing or does not match its record", async () => {
  for (const retainedDocument of [null, manifestDocument("different-release")]) {
    const fixture = await cliFixture();
    const retainedPath = path.join(fixture.stateDirectory, "releases", "claimed", "compatibility.json");
    await mkdir(path.dirname(retainedPath), { recursive: true });
    if (retainedDocument !== null) await writeFile(retainedPath, `${JSON.stringify(retainedDocument)}\n`);
    await writeFile(path.join(fixture.stateDirectory, "active-release.json"), `${JSON.stringify({
      schemaVersion: "wsr.active-release@1.0.0",
      release: "claimed",
      manifestDigest: `sha256:${"b".repeat(64)}`,
      manifest: "releases/claimed/compatibility.json",
    })}\n`);

    const result = await invoke(["version", "--manifest", fixture.manifestPath, "--state-dir", fixture.stateDirectory]);
    assert.equal(result.exitCode, 2);
    assert.equal(JSON.parse(result.stdout).diagnostics[0].code, "VERSION_FACTS_INVALID");
  }
});

test("version and status fail closed for corrupt or unavailable version metadata", async () => {
  for (const corrupt of ["{", JSON.stringify({
    schema: "wsr.operations.state@1.0.0",
    completed: {},
    active: {
      operationId: "lost", command: "upgrade", manifestDigest: `sha256:${"a".repeat(64)}`,
      completedComponents: [], currentComponent: null,
    },
  })]) {
    const fixture = await cliFixture();
    await mkdir(fixture.stateDirectory, { recursive: true });
    await writeFile(path.join(fixture.stateDirectory, "operations-state.json"), `${corrupt}\n`);
    for (const command of ["version", "status"]) {
      const result = await invoke([
        command, "--manifest", fixture.manifestPath, "--state-dir", fixture.stateDirectory,
        "--fixture", fixture.fixturePath,
      ]);
      assert.equal(result.exitCode, 2, `${command}: ${corrupt}`);
      const output = JSON.parse(result.stdout);
      assert.equal(output.status, "failed");
      assert.equal(output.diagnostics[0].code, "VERSION_FACTS_INVALID");
    }
  }
});

test("status preserves component inspection and adds the version summary from version", async () => {
  const fixture = await cliFixture();
  const common = ["--manifest", fixture.manifestPath, "--state-dir", fixture.stateDirectory];
  const exact = JSON.parse((await invoke(["version", ...common])).stdout).data;
  const status = JSON.parse((await invoke(["status", ...common, "--fixture", fixture.fixturePath])).stdout);
  assert.equal(status.components.length, 1);
  assert.deepEqual(status.data.versions, exact);
});

test("unknown commands and invalid arguments include an actionable help hint", async () => {
  for (const args of [["wat"], ["status", "--state-dir"], ["status", "--wat", "value"]]) {
    const result = await invoke(args);
    assert.equal(result.exitCode, 2, args.join(" "));
    assert.equal(result.stderr, "");
    const output = JSON.parse(result.stdout);
    assert.equal(output.status, "failed");
    assert.match(output.diagnostics[0].message, /wsr help/u);
  }
});
