import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { verifyProductOwnerRelease } from "./verify-owner-release.mjs";

const root = resolve(import.meta.dirname, "..");

test("published-coordinate acceptance binds Product pins to the single DSH owner record", async () => {
  const compatibility = JSON.parse(await readFile(resolve(root, "wsr-dsh/config/dsh-compatibility.json"), "utf8"));
  const product = JSON.parse(await readFile(resolve(root, "product-operations/manifests/product-0.4.0.json"), "utf8"));
  const bytes = Buffer.from("remote-owner");
  const owner = { ...compatibility.executionOwner, assetSha256: createHash("sha256").update(bytes).digest("hex") };
  const dsh = product.components.find(({ id }) => id === "dsh-bundle");
  dsh.compatibility.executionOwner = {
    package: owner.package, version: owner.version, release: owner.release,
    coordinate: owner.coordinate, digest: `sha256:${owner.assetSha256}`,
  };
  await assert.doesNotReject(verifyProductOwnerRelease(owner, product, {
    fetchBytes: async () => bytes,
    resolveRevision: async () => owner.revision,
  }));
});

test("local overrides and Product/owner drift are rejected before candidate qualification", async () => {
  const compatibility = JSON.parse(await readFile(resolve(root, "wsr-dsh/config/dsh-compatibility.json"), "utf8"));
  const product = JSON.parse(await readFile(resolve(root, "product-operations/manifests/product-0.4.0.json"), "utf8"));
  await assert.rejects(verifyProductOwnerRelease(
    { ...compatibility.executionOwner, coordinate: "/tmp/wsr-execution-0.2.1.tgz" }, product,
    { fetchBytes: async () => new Uint8Array(), resolveRevision: async () => compatibility.executionOwner.revision },
  ), /EXECUTION_OWNER_RECORD_INVALID/u);
  const dsh = product.components.find(({ id }) => id === "dsh-bundle");
  dsh.compatibility.executionOwner.digest = `sha256:${"0".repeat(64)}`;
  await assert.rejects(verifyProductOwnerRelease(compatibility.executionOwner, product, {
    fetchBytes: async () => new Uint8Array(), resolveRevision: async () => compatibility.executionOwner.revision,
  }), /PRODUCT_EXECUTION_OWNER_DRIFT/u);
});
