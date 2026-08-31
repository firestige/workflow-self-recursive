import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import test from "node:test";
import assert from "node:assert/strict";

import { verifyLocalCoreInstall } from "./verify-local-core-install.mjs";

const criticalFiles = [
  "package.json",
  "dist/bootstrap/interaction-broker.js",
  "dist/bootstrap/production.js",
  "dist/intake/presentation.js",
  "dist/providers/copilot/index.js",
  "dist/providers/codex/index.js",
];

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "wsr-local-core-verifier-"));
  const material = path.join(root, "material", "package");
  const profile = path.join(root, "profile");
  const installed = path.join(profile, "node_modules", "wsr-execution");
  await Promise.all([mkdir(material, { recursive: true }), mkdir(installed, { recursive: true })]);
  for (const relative of criticalFiles) {
    const content = `${relative}:local-candidate\n`;
    await mkdir(path.dirname(path.join(material, relative)), { recursive: true });
    await mkdir(path.dirname(path.join(installed, relative)), { recursive: true });
    await writeFile(path.join(material, relative), content);
    await writeFile(path.join(installed, relative), content);
  }
  const archive = path.join(root, "wsr-execution-0.2.1.tgz");
  execFileSync("tar", ["-czf", archive, "-C", path.join(root, "material"), "package"]);
  return { root, profile, installed, archive };
}

test("accepts only an installed core whose critical runtime files equal the local archive", async () => {
  const value = await fixture();
  try {
    await assert.doesNotReject(verifyLocalCoreInstall(value.profile, value.archive));
    await writeFile(path.join(value.installed, "dist/intake/presentation.js"), "published core\n");
    await assert.rejects(verifyLocalCoreInstall(value.profile, value.archive), /LOCAL_CORE_INSTALL_MISMATCH/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});
