import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { resolveDevArtifactSet } from "./dev-artifact-set.mjs";

const sha256 = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

async function archive(root, file, name, version) {
  const source = join(root, `${file}-source`);
  await mkdir(join(source, "package"), { recursive: true });
  await writeFile(join(source, "package/package.json"), `${JSON.stringify({ name, version })}\n`);
  const target = join(root, file);
  execFileSync("tar", ["-czf", target, "-C", source, "package"]);
  return { path: file, sha256: sha256(await import("node:fs/promises").then(({ readFile }) => readFile(target))), name, version };
}

async function fixture(root) {
  const archives = {
    executionOwner: await archive(root, "wsr-execution.tgz", "wsr-execution", "0.2.6"),
    dshExecution: await archive(root, "dsh-execution.tgz", "dsh-wsr-execution", "0.2.9"),
    dshStudio: await archive(root, "dsh-studio.tgz", "dsh-wsr-studio", "0.1.3"),
    dshSuite: await archive(root, "dsh-suite.tgz", "dsh-wsr", "0.2.10"),
    uiCore: await archive(root, "ui-core.tgz", "wsr-ui-core", "0.1.0"),
  };
  const components = [
    ["system-contracts", "1.1.0"], ["evidence-system", "0.1.1"],
    ["evolution-system", "0.1.1"], ["execution-system", "0.2.6"],
    ["workflow-package", "0.4.12"], ["wsr-dsh", "0.2.11"], ["wsr-ui", "0.1.0"],
  ].map(([id, version]) => ({ id, commit: "a".repeat(40), version, coordinate: `gitlink://${id}@${"a".repeat(40)}`, digest: `sha256:${"b".repeat(64)}` }));
  const manifest = join(root, "artifact-set.json");
  await writeFile(manifest, `${JSON.stringify({
    schemaVersion: "wsr.dev-artifact-set@1.0.0",
    identity: "issues-221-225-product-dev",
    productManifest: "product-dev.json",
    components,
    archives,
    workflowAssets: { directory: "workflow-assets", selector: "implementation-workflow@0.4.12" },
  })}\n`);
  await writeFile(join(root, "product-dev.json"), "{}\n");
  await mkdir(join(root, "workflow-assets"));
  await writeFile(join(root, "workflow-assets/release-metadata.json"), "{}\n");
  const document = JSON.parse(await import("node:fs/promises").then(({ readFile }) => readFile(manifest, "utf8")));
  document.workflowAssets.metadataSha256 = sha256(Buffer.from("{}\n"));
  await writeFile(manifest, `${JSON.stringify(document)}\n`);
  return manifest;
}

test("resolves and verifies every immutable dev archive before composition", async () => {
  const root = await mkdtemp(join(tmpdir(), "wsr-dev-set-test-"));
  try {
    const result = await resolveDevArtifactSet(await fixture(root));
    assert.equal(result.identity, "issues-221-225-product-dev");
    assert.equal(result.components.length, 7);
    assert.equal(result.archives.dshStudio.identity, "dsh-wsr-studio@0.1.3");
    assert.equal(result.workflowAssets.selector, "implementation-workflow@0.4.12");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails closed when an archive digest or required component differs", async () => {
  const root = await mkdtemp(join(tmpdir(), "wsr-dev-set-test-"));
  try {
    const manifest = await fixture(root);
    const document = JSON.parse(await import("node:fs/promises").then(({ readFile }) => readFile(manifest, "utf8")));
    document.archives.executionOwner.sha256 = `sha256:${"0".repeat(64)}`;
    document.components = document.components.filter(({ id }) => id !== "system-contracts");
    await writeFile(manifest, `${JSON.stringify(document)}\n`);
    await assert.rejects(() => resolveDevArtifactSet(manifest), /DEV_ARTIFACT_SET_INVALID: components\.system-contracts.*executionOwner\.sha256/s);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
