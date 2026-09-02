import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, stat, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createInstallationMaintenance } from "../src/installation-maintenance.mjs";

const preserved = Object.freeze({
  config: true,
  durableData: true,
  evidence: true,
  credentials: true,
  userPatches: true,
});

const manifest = Object.freeze({
  release: "0.4.0",
  digest: `sha256:${"a".repeat(64)}`,
  components: [
    {
      id: "dsh-bundle",
      version: "0.2.3",
      compatibility: {
        executionOwner: { package: "wsr-execution", version: "0.2.1" },
        packages: {
          execution: "dsh-wsr-execution@0.2.2",
          studio: "dsh-wsr-studio@0.1.2",
          suite: "dsh-wsr@0.2.2",
        },
      },
    },
    { id: "services", version: "0.1.0" },
    { id: "workflow-source", name: "hello-world-workflow", version: "0.2.0" },
  ],
});

async function fixture({ roots = {}, occupiedPorts = [] } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-maintenance-"));
  const stateDirectory = path.join(root, "state");
  const configPath = path.join(root, "config.json");
  const dshHome = path.join(root, "dsh-home");
  const profileDirectory = path.join(dshHome, "profiles", "web");
  await mkdir(profileDirectory, { recursive: true });
  await writeFile(configPath, `${JSON.stringify({
    schemaVersion: "wsr.global-config@1.0.0",
    installation: { dshMode: "suite", dshProfile: "web" },
    services: { ports: { dsh: 18081, evidence: 14318, evolution: 18000 } },
    workflowSource: { kind: "github", repository: "firestige/wsr-workflow-package" },
  })}\n`);
  await writeFile(path.join(profileDirectory, "cordis.patch.yml"), [
    "- id: web-runtime",
    "  config:",
    "    printUrl: true",
    "- id: workflow-execution",
    "  config:",
    "    configFile: /old/execution.json",
    "",
  ].join("\n"));
  const commands = [];
  const maintenance = createInstallationMaintenance({
    manifest,
    configPath,
    stateDirectory,
    dshHome,
    run: async (command, args) => {
      commands.push([command, ...args]);
      if (args.includes("list")) {
        return {
          status: 0,
          stdout: `${JSON.stringify([{ name: "dsh-profile-web", dependencies: Object.fromEntries(
            Object.entries(roots).map(([name, version]) => [name, { version }]),
          ) }])}\n`,
          stderr: "",
        };
      }
      return { status: 0, stdout: "", stderr: "" };
    },
    inspectPort: async (port) => ({ available: !occupiedPorts.includes(port) }),
    processAlive: () => false,
  });
  return { root, stateDirectory, configPath, dshHome, profileDirectory, commands, maintenance };
}

test("doctor reports obsolete roots, state drift, legacy user patch, and external port ownership", async () => {
  const input = await fixture({
    roots: { "dsh-wsr": "0.2.1", "wsr-execution": "0.2.1", "unrelated-user-plugin": "9.9.9" },
    occupiedPorts: [18081],
  });
  await mkdir(path.join(input.stateDirectory, "releases", "0.3.0"), { recursive: true });
  await writeFile(path.join(input.stateDirectory, "active-release.json"), `${JSON.stringify({
    schemaVersion: "wsr.active-release@1.0.0",
    release: "0.3.0",
    manifestDigest: `sha256:${"b".repeat(64)}`,
    manifest: "releases/0.3.0/compatibility.json",
  })}\n`);

  const diagnosis = await input.maintenance.diagnose({ command: "install", manifest });

  assert.equal(diagnosis.verdict, "BLOCKED");
  assert.deepEqual(new Set(diagnosis.findings.map(({ code }) => code)), new Set([
    "OBSOLETE_DSH_ROOT",
    "INACTIVE_PRODUCT_RELEASE",
    "LEGACY_USER_PATCH_DETECTED",
    "EXTERNAL_DSH_PORT_OCCUPIED",
  ]));
  assert.ok(diagnosis.plan.some(({ kind, packageName }) => kind === "dsh-root" && packageName === "dsh-wsr"));
  assert.ok(diagnosis.plan.every(({ packageName }) => packageName !== "unrelated-user-plugin"));
  assert.ok(diagnosis.manualActions.some((action) => action.includes("workflow-execution")));
  assert.deepEqual(diagnosis.preserved, preserved);
});

test("cleanup preview is byte-for-byte non-mutating", async () => {
  const input = await fixture({ roots: { "dsh-wsr": "0.2.1" } });
  const durableFile = path.join(input.stateDirectory, "durable", "execution", "delivery.json");
  const inactiveRelease = path.join(input.stateDirectory, "releases", "0.3.0", "compatibility.json");
  await mkdir(path.dirname(durableFile), { recursive: true });
  await mkdir(path.dirname(inactiveRelease), { recursive: true });
  await writeFile(durableFile, "durable-user-data\n");
  await writeFile(inactiveRelease, "obsolete-software-metadata\n");
  const configBefore = await readFile(input.configPath);
  const durableBefore = await readFile(durableFile);
  const patchBefore = await readFile(path.join(input.profileDirectory, "cordis.patch.yml"));

  const result = await input.maintenance.cleanup({ apply: false, manifest });

  assert.equal(result.status, "succeeded");
  assert.equal(result.changed, false);
  assert.deepEqual(result.data.removed, []);
  assert.ok(result.data.plan.length > 0);
  assert.deepEqual(await readFile(input.configPath), configBefore);
  assert.deepEqual(await readFile(durableFile), durableBefore);
  assert.deepEqual(await readFile(path.join(input.profileDirectory, "cordis.patch.yml")), patchBefore);
  assert.equal((await stat(inactiveRelease)).isFile(), true);
  assert.ok(input.commands.every((command) => !command.includes("remove")));
});

test("cleanup apply removes only obsolete owned software and preserves user data and patches", async () => {
  const input = await fixture({ roots: { "dsh-wsr": "0.2.1", "unrelated-user-plugin": "9.9.9" } });
  const durableFile = path.join(input.stateDirectory, "durable", "execution", "delivery.json");
  const inactiveReleaseDirectory = path.join(input.stateDirectory, "releases", "0.3.0");
  const inactiveDownload = path.join(input.stateDirectory, "downloads", "wsr-services-0.0.9.tar.gz");
  await mkdir(path.dirname(durableFile), { recursive: true });
  await mkdir(inactiveReleaseDirectory, { recursive: true });
  await mkdir(path.dirname(inactiveDownload), { recursive: true });
  await writeFile(durableFile, "durable-user-data\n");
  await writeFile(path.join(inactiveReleaseDirectory, "compatibility.json"), "obsolete\n");
  await writeFile(inactiveDownload, "obsolete\n");
  await writeFile(path.join(input.stateDirectory, "operations-state.json"), `${JSON.stringify({
    schema: "wsr.operations.state@1.0.0",
    active: null,
    completed: {
      [`install:sha256:${"b".repeat(64)}`]: { operationId: "old", completedAt: "2026-01-01T00:00:00.000Z" },
      [`setup:${manifest.digest}`]: { operationId: "current", completedAt: "2026-01-02T00:00:00.000Z" },
    },
  })}\n`);
  const configBefore = await readFile(input.configPath);
  const durableBefore = await readFile(durableFile);
  const patchBefore = await readFile(path.join(input.profileDirectory, "cordis.patch.yml"));

  const result = await input.maintenance.cleanup({ apply: true, manifest });

  assert.equal(result.status, "succeeded");
  assert.equal(result.changed, true);
  assert.ok(input.commands.some((command) => command.includes("remove") && command.at(-1) === "dsh-wsr"));
  assert.ok(input.commands.every((command) => command.at(-1) !== "unrelated-user-plugin"));
  await assert.rejects(stat(inactiveReleaseDirectory), /ENOENT/u);
  await assert.rejects(stat(inactiveDownload), /ENOENT/u);
  assert.deepEqual(await readFile(input.configPath), configBefore);
  assert.deepEqual(await readFile(durableFile), durableBefore);
  assert.deepEqual(await readFile(path.join(input.profileDirectory, "cordis.patch.yml")), patchBefore);
  const journal = JSON.parse(await readFile(path.join(input.stateDirectory, "operations-state.json"), "utf8"));
  assert.deepEqual(Object.keys(journal.completed), [`setup:${manifest.digest}`]);
  assert.deepEqual(result.data.preserved, preserved);
});

test("cleanup repairs a current-release journal that claims missing DSH roots", async () => {
  const input = await fixture();
  await writeFile(path.join(input.profileDirectory, "cordis.patch.yml"), "- id: web-runtime\n  config: {}\n");
  await mkdir(path.join(input.stateDirectory, "releases", manifest.release), { recursive: true });
  await writeFile(path.join(input.stateDirectory, "active-release.json"), `${JSON.stringify({
    schemaVersion: "wsr.active-release@1.0.0",
    release: manifest.release,
    manifestDigest: manifest.digest,
    manifest: `releases/${manifest.release}/compatibility.json`,
  })}\n`);
  const installKey = `install:${manifest.digest}`;
  await writeFile(path.join(input.stateDirectory, "operations-state.json"), `${JSON.stringify({
    schema: "wsr.operations.state@1.0.0",
    active: null,
    completed: {
      [installKey]: { operationId: "stale-install", completedAt: "2026-01-01T00:00:00.000Z" },
      [`setup:${manifest.digest}`]: { operationId: "valid-setup", completedAt: "2026-01-01T00:00:00.000Z" },
    },
  })}\n`);

  const result = await input.maintenance.cleanup({ apply: true, manifest });

  assert.equal(result.status, "succeeded");
  await assert.rejects(stat(path.join(input.stateDirectory, "active-release.json")), /ENOENT/u);
  const state = JSON.parse(await readFile(path.join(input.stateDirectory, "operations-state.json"), "utf8"));
  assert.equal(installKey in state.completed, false);
  assert.equal(`setup:${manifest.digest}` in state.completed, true);
  assert.equal((await input.maintenance.diagnose({ command: "install", manifest })).verdict, "READY");
});

test("cleanup refuses a symlinked obsolete target before any mutation", async () => {
  const input = await fixture({ roots: { "dsh-wsr": "0.2.1" } });
  const outside = path.join(input.root, "outside-user-data");
  const releases = path.join(input.stateDirectory, "releases");
  await mkdir(outside, { recursive: true });
  await writeFile(path.join(outside, "keep.txt"), "keep\n");
  await mkdir(releases, { recursive: true });
  await symlink(outside, path.join(releases, "0.3.0"));

  const result = await input.maintenance.cleanup({ apply: true, manifest });

  assert.equal(result.status, "blocked");
  assert.equal(result.changed, false);
  assert.equal(result.diagnostics[0].code, "CLEANUP_SYMLINK_REFUSED");
  assert.equal(await readFile(path.join(outside, "keep.txt"), "utf8"), "keep\n");
  assert.ok(input.commands.every((command) => !command.includes("remove")));
});

test("cleanup refuses a symlinked operation journal before any mutation", async () => {
  const input = await fixture({ roots: { "dsh-wsr": "0.2.1" } });
  const outsideJournal = path.join(input.root, "outside-operations-state.json");
  const journal = {
    schema: "wsr.operations.state@1.0.0",
    active: null,
    completed: {
      [`install:sha256:${"b".repeat(64)}`]: {
        operationId: "old",
        completedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  };
  await writeFile(outsideJournal, `${JSON.stringify(journal)}\n`);
  await mkdir(input.stateDirectory, { recursive: true });
  await symlink(outsideJournal, path.join(input.stateDirectory, "operations-state.json"));

  const result = await input.maintenance.cleanup({ apply: true, manifest });

  assert.equal(result.status, "blocked");
  assert.equal(result.changed, false);
  assert.equal(result.diagnostics[0].code, "CLEANUP_SYMLINK_REFUSED");
  assert.deepEqual(JSON.parse(await readFile(outsideJournal, "utf8")), journal);
  assert.ok(input.commands.every((command) => !command.includes("remove")));
});
