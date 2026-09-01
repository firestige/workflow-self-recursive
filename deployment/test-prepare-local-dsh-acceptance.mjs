import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loadCompatibilityManifest } from "../product-operations/src/compatibility-manifest.mjs";
import { prepareLocalDshAcceptance } from "./prepare-local-dsh-acceptance.mjs";

async function archive(root, name, version, dependencies = {}) {
  const directory = join(root, name.replaceAll("/", "-"));
  await mkdir(join(directory, "package"), { recursive: true });
  await writeFile(join(directory, "package/package.json"), `${JSON.stringify({ name, version, dependencies })}\n`);
  const output = join(root, `${name}-${version}.tgz`);
  execFileSync("tar", ["-czf", output, "-C", directory, "package"]);
  return output;
}

test("creates a local-only DSH manifest and binds transitive package archives", async () => {
  const root = await mkdtemp(join(tmpdir(), "wsr-local-dsh-test-"));
  try {
    const ownerArchive = await archive(root, "wsr-execution", "0.2.1");
    const executionArchive = await archive(root, "dsh-wsr-execution", "0.2.1");
    const studioArchive = await archive(root, "dsh-wsr-studio", "0.1.1", { "wsr-ui-core": "0.1.0-rc.0" });
    const suiteArchive = await archive(root, "dsh-wsr", "0.2.1", { "dsh-wsr-execution": "^0.2.0", "dsh-wsr-studio": "^0.1.1" });
    const providerArchive = await archive(root, "wsr-ui-core", "0.1.0-rc.0");
    const baseManifest = join(root, "base.json");
    const outputManifest = join(root, "compatibility.json");
    await writeFile(baseManifest, `${JSON.stringify({
      schema: "wsr.compatibility@1.0.0", release: "test", components: [{
        id: "dsh-bundle", layer: "DSH", coordinate: "fixture://old", version: "0.2.2",
        digest: `sha256:${"a".repeat(64)}`,
        compatibility: { executionOwner: { coordinate: "old", digest: `sha256:${"b".repeat(64)}` }, packages: {} },
      }],
    })}\n`);
    await prepareLocalDshAcceptance({ baseManifest, outputManifest, ownerArchive, executionArchive, studioArchive, suiteArchive, providerArchive });
    const loaded = await loadCompatibilityManifest(outputManifest);
    const component = loaded.components[0];
    assert.equal(component.coordinate, "fixture://issue-170/local-dsh-set");
    assert.equal(component.compatibility.executionOwner.coordinate, await realpath(ownerArchive));
    assert.equal(component.compatibility.packages.suite, await realpath(suiteArchive));
    const studio = JSON.parse(execFileSync("tar", ["-xOf", studioArchive, "package/package.json"], { encoding: "utf8" }));
    const suite = JSON.parse(execFileSync("tar", ["-xOf", suiteArchive, "package/package.json"], { encoding: "utf8" }));
    assert.equal(studio.dependencies["wsr-ui-core"], `file:${await realpath(providerArchive)}`);
    assert.equal(suite.dependencies["dsh-wsr-execution"], `file:${await realpath(executionArchive)}`);
    assert.equal(suite.dependencies["dsh-wsr-studio"], `file:${await realpath(studioArchive)}`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
