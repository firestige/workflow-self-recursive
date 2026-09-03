#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { validateExecutionOwnerRelease, verifyExecutionOwnerRelease } from "../wsr-dsh/scripts/lib/execution-owner-release.mjs";

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

export async function verifyProductOwnerRelease(ownerValue, product, ports) {
  const owner = validateExecutionOwnerRelease(ownerValue);
  const components = Array.isArray(product?.components) ? product.components : [];
  const matches = components.filter((component) => component?.id === "dsh-bundle");
  const pinned = matches.length === 1 ? matches[0]?.compatibility?.executionOwner : undefined;
  if (pinned?.package !== owner.package || pinned.version !== owner.version || pinned.release !== owner.release
    || pinned.coordinate !== owner.coordinate || pinned.digest !== `sha256:${owner.assetSha256}`) {
    fail("PRODUCT_EXECUTION_OWNER_DRIFT");
  }
  return verifyExecutionOwnerRelease(owner, ports);
}

async function fetchBytes(coordinate) {
  const response = await fetch(coordinate, { redirect: "follow" });
  if (!response.ok) fail("EXECUTION_OWNER_REMOTE_UNAVAILABLE");
  return new Uint8Array(await response.arrayBuffer());
}

async function resolveRevision(repository, release) {
  const response = await fetch(`https://api.github.com/repos/${repository}/git/ref/tags/${encodeURIComponent(release)}`, {
    headers: { accept: "application/vnd.github+json", "user-agent": "wsr-published-coordinate-gate" },
  });
  if (!response.ok) fail("EXECUTION_OWNER_REMOTE_UNAVAILABLE");
  const body = await response.json();
  return body?.object?.type === "commit" ? body.object.sha : undefined;
}

export async function verifyProductOwnerReleaseFiles(ownerConfigurationFile, productManifestFile) {
  const [configuration, product] = await Promise.all([
    readFile(ownerConfigurationFile, "utf8").then(JSON.parse),
    readFile(productManifestFile, "utf8").then(JSON.parse),
  ]);
  return verifyProductOwnerRelease(configuration.executionOwner, product, { fetchBytes, resolveRevision });
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , ownerConfigurationFile, productManifestFile] = process.argv;
  if (ownerConfigurationFile === undefined || productManifestFile === undefined) {
    fail("USAGE: verify-owner-release <dsh-compatibility.json> <product-manifest.json>");
  }
  const result = await verifyProductOwnerReleaseFiles(ownerConfigurationFile, productManifestFile);
  process.stdout.write(`${JSON.stringify({ status: "PASS", version: result.owner.version, revision: result.owner.revision, bytes: result.bytes })}\n`);
}
