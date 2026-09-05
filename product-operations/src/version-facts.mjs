import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { loadCompatibilityManifest } from "./compatibility-manifest.mjs";

const SHA256 = /^sha256:[0-9a-f]{64}$/u;

function invalid(message) {
  const error = new Error(`Version metadata is invalid: ${message}`);
  error.code = "VERSION_FACTS_INVALID";
  throw error;
}

async function optionalJson(target, label) {
  try {
    return JSON.parse(await readFile(target, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    invalid(`${label} cannot be read: ${error.message}`);
  }
}

async function verifiedManifest(target, expected, label) {
  let manifest;
  try {
    manifest = await loadCompatibilityManifest(target);
  } catch (error) {
    invalid(`${label} cannot be verified: ${error.message}`);
  }
  if ((expected.release !== undefined && manifest.release !== expected.release)
    || manifest.digest !== expected.manifestDigest) {
    invalid(`${label} does not match its recorded release and digest`);
  }
  return manifest;
}

function stateRelativePath(stateDirectory, relative, label) {
  if (typeof relative !== "string" || path.isAbsolute(relative)) invalid(`${label} path must be relative`);
  const resolved = path.resolve(stateDirectory, relative);
  const prefix = `${path.resolve(stateDirectory)}${path.sep}`;
  if (!resolved.startsWith(prefix)) invalid(`${label} path escapes the state directory`);
  return resolved;
}

async function findActiveManifest({
  digest, targetManifest, targetManifestPath, stateDirectory, packagedManifestsDirectory,
}) {
  if (digest === targetManifest.digest) return targetManifestPath;
  const retained = path.join(stateDirectory, "operation-manifests", `${digest.slice("sha256:".length)}.json`);
  try {
    await readFile(retained);
    return retained;
  } catch (error) {
    if (error.code !== "ENOENT") invalid(`active operation manifest cannot be read: ${error.message}`);
  }
  let names;
  try {
    names = await readdir(packagedManifestsDirectory);
  } catch (error) {
    if (error.code !== "ENOENT") invalid(`packaged manifests cannot be read: ${error.message}`);
    names = [];
  }
  for (const name of names.filter((value) => value.endsWith(".json")).sort()) {
    const candidate = path.join(packagedManifestsDirectory, name);
    let manifest;
    try {
      manifest = await loadCompatibilityManifest(candidate);
    } catch (error) {
      invalid(`packaged active manifest candidate cannot be verified: ${error.message}`);
    }
    if (manifest.digest === digest) return candidate;
  }
  invalid(`no exact manifest is available for active operation ${digest}`);
}

export async function readVersionContext({
  cliVersion, targetManifest, targetManifestPath, stateDirectory, packagedManifestsDirectory,
}) {
  if (typeof cliVersion !== "string" || cliVersion.length === 0) invalid("CLI package version is missing");

  const appliedRecord = await optionalJson(path.join(stateDirectory, "active-release.json"), "applied release");
  let applied = null;
  if (appliedRecord !== null) {
    if (appliedRecord.schemaVersion !== "wsr.active-release@1.0.0"
      || typeof appliedRecord.release !== "string"
      || !SHA256.test(appliedRecord.manifestDigest ?? "")) {
      invalid("applied release record has an unsupported shape");
    }
    const manifestPath = stateRelativePath(stateDirectory, appliedRecord.manifest, "applied manifest");
    await verifiedManifest(manifestPath, appliedRecord, "applied manifest");
    applied = { release: appliedRecord.release, manifestDigest: appliedRecord.manifestDigest };
  }

  const operationState = await optionalJson(path.join(stateDirectory, "operations-state.json"), "operation state");
  let activeOperation = null;
  let activeManifestPath = null;
  if (operationState !== null) {
    if (operationState.schema !== "wsr.operations.state@1.0.0"
      || typeof operationState.completed !== "object"
      || !(operationState.active === null || typeof operationState.active === "object")) {
      invalid("operation state has an unsupported shape");
    }
    if (operationState.active !== null) {
      const active = operationState.active;
      if (typeof active.operationId !== "string" || typeof active.command !== "string"
        || !SHA256.test(active.manifestDigest ?? "")
        || !Array.isArray(active.completedComponents)
        || !(active.currentComponent === null || typeof active.currentComponent === "string")) {
        invalid("active operation has an unsupported shape");
      }
      activeManifestPath = await findActiveManifest({
        digest: active.manifestDigest,
        targetManifest,
        targetManifestPath,
        stateDirectory,
        packagedManifestsDirectory,
      });
      const verifiedActiveManifest = await verifiedManifest(activeManifestPath, {
        release: active.release,
        manifestDigest: active.manifestDigest,
      }, "active operation manifest");
      activeOperation = {
        operationId: active.operationId,
        command: active.command,
        release: verifiedActiveManifest.release,
        manifestDigest: active.manifestDigest,
        currentComponent: active.currentComponent,
        resumable: true,
      };
    }
  }

  const target = { release: targetManifest.release, manifestDigest: targetManifest.digest };
  const alignment = applied === null
    ? "not-installed"
    : applied.manifestDigest === target.manifestDigest ? "aligned" : "drifted";
  return {
    facts: {
      cli: { version: cliVersion },
      applied,
      target,
      activeOperation,
      alignment,
    },
    activeManifestPath,
  };
}
