import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { bindLocalPackageCandidate, installLocalPackageCandidate, verifyLocalPackageCandidate } from "./bind-local-package-candidate.mjs";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "wsr-local-package-test-"));
  const profile = join(root, "profile");
  const source = join(root, "source", "package");
  await mkdir(join(profile, "node_modules", "wsr-ui-core"), { recursive: true });
  await mkdir(source, { recursive: true });
  const manifest = { name: "wsr-ui-core", version: "0.1.0-rc.0" };
  await writeFile(join(source, "package.json"), `${JSON.stringify(manifest)}\n`);
  await writeFile(join(profile, "node_modules", "wsr-ui-core", "package.json"), `${JSON.stringify(manifest)}\n`);
  await writeFile(join(profile, "pnpm-workspace.yaml"), "packages: []\n");
  const archive = join(root, "wsr-ui-core-0.1.0-rc.0.tgz");
  execFileSync("tar", ["-czf", archive, "-C", join(root, "source"), "package"]);
  return { root, profile, archive: await realpath(archive) };
}

test("binds the exact local archive and verifies the installed lock provenance", async () => {
  const value = await fixture();
  try {
    await bindLocalPackageCandidate({
      profileRoot: value.profile,
      packageName: "wsr-ui-core",
      version: "0.1.0-rc.0",
      archive: value.archive,
    });
    const policy = await readFile(join(value.profile, "pnpm-workspace.yaml"), "utf8");
    assert.match(policy, /"wsr-ui-core@0\.1\.0-rc\.0": "file:\/.*wsr-ui-core-0\.1\.0-rc\.0\.tgz"/u);
    await writeFile(join(value.profile, "pnpm-lock.yaml"), `resolution: {tarball: file:${value.archive}}\n`);
    await assert.doesNotReject(() => verifyLocalPackageCandidate({
      profileRoot: value.profile,
      packageName: "wsr-ui-core",
      version: "0.1.0-rc.0",
      archive: value.archive,
    }));
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("materializes the local archive over an existing registry installation", async () => {
  const value = await fixture();
  try {
    const installed = join(value.profile, "node_modules", "wsr-ui-core");
    await writeFile(join(installed, "registry-marker"), "must disappear\n");
    await installLocalPackageCandidate({
      nodeModulesRoot: join(value.profile, "node_modules"),
      packageName: "wsr-ui-core",
      version: "0.1.0-rc.0",
      archive: value.archive,
    });
    assert.deepEqual(JSON.parse(await readFile(join(installed, "package.json"), "utf8")), {
      name: "wsr-ui-core", version: "0.1.0-rc.0",
    });
    await assert.rejects(() => readFile(join(installed, "registry-marker")), /ENOENT/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("materializes the local artifact runtime dependency closure", async () => {
  const value = await fixture();
  try {
    const dependencyRoot = join(value.root, "provider-node-modules");
    await mkdir(join(dependencyRoot, "fixture-dep"), { recursive: true });
    await writeFile(
      join(dependencyRoot, "fixture-dep", "package.json"),
      `${JSON.stringify({ name: "fixture-dep", version: "1.0.0" })}\n`,
    );
    const source = join(value.root, "source", "package", "package.json");
    await writeFile(
      source,
      `${JSON.stringify({ name: "wsr-ui-core", version: "0.1.0-rc.0", dependencies: { "fixture-dep": "1.0.0" } })}\n`,
    );
    execFileSync("tar", [
      "-czf",
      value.archive,
      "-C",
      join(value.root, "source"),
      "package",
    ]);

    await installLocalPackageCandidate({
      nodeModulesRoot: join(value.profile, "node_modules"),
      packageName: "wsr-ui-core",
      version: "0.1.0-rc.0",
      archive: value.archive,
      dependencyModulesRoot: dependencyRoot,
    });

    assert.equal(
      JSON.parse(
        await readFile(
          join(value.profile, "node_modules", "fixture-dep", "package.json"),
          "utf8",
        ),
      ).version,
      "1.0.0",
    );
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("fails closed when an existing override or installed lock points elsewhere", async () => {
  const value = await fixture();
  try {
    await writeFile(join(value.profile, "pnpm-workspace.yaml"), 'packages: []\noverrides:\n  "wsr-ui-core@0.1.0-rc.0": "https://registry.example.invalid/package.tgz"\n');
    await assert.rejects(() => bindLocalPackageCandidate({
      profileRoot: value.profile,
      packageName: "wsr-ui-core",
      version: "0.1.0-rc.0",
      archive: value.archive,
    }), /LOCAL_PACKAGE_OVERRIDE_COLLISION/u);
    await writeFile(join(value.profile, "pnpm-workspace.yaml"), "packages: []\n");
    await bindLocalPackageCandidate({
      profileRoot: value.profile,
      packageName: "wsr-ui-core",
      version: "0.1.0-rc.0",
      archive: value.archive,
    });
    await writeFile(join(value.profile, "pnpm-lock.yaml"), "resolution: https://registry.npmjs.org/wsr-ui-core/-/wsr-ui-core-0.1.0-rc.0.tgz\n");
    await assert.rejects(() => verifyLocalPackageCandidate({
      profileRoot: value.profile,
      packageName: "wsr-ui-core",
      version: "0.1.0-rc.0",
      archive: value.archive,
    }), /LOCAL_PACKAGE_REMOTE_RESOLUTION/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});
