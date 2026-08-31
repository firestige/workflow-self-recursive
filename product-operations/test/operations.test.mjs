import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import { loadCompatibilityManifest } from "../src/compatibility-manifest.mjs";
import { createFixtureAdapter } from "../src/fixture-adapter.mjs";
import { createOperations } from "../src/operations.mjs";

const execFileAsync = promisify(execFile);

const exactComponent = (id, version = "1.2.3") => ({
  id,
  layer: id,
  coordinate: `fixture://${id}`,
  version,
  digest: `sha256:${createHash("sha256").update(id).digest("hex")}`,
});

const manifestDocument = (components = [exactComponent("execution")]) => ({
  schema: "wsr.compatibility@1.0.0",
  release: "fixture-1",
  components,
});

const productConfig = (_root, overrides = {}) => ({
  schemaVersion: "wsr.global-config@1.0.0",
  installation: { dshMode: "suite", dshProfile: "web" },
  services: { ports: { dsh: 18081, evidence: 4318, evolution: 8000 } },
  workflowSource: {
    kind: "github",
    repository: "firestige/wsr-workflow-package",
  },
  ...overrides,
});

async function harness({ manifest = manifestDocument(), fixture = {} } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-operations-"));
  const manifestPath = path.join(root, "compatibility.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
  const compatibility = await loadCompatibilityManifest(manifestPath);
  const adapter = createFixtureAdapter(fixture);
  const operations = createOperations({
    manifest: compatibility,
    adapters: new Map(compatibility.components.map((component) => [component.id, adapter])),
    stateDirectory: path.join(root, "state"),
    configPath: path.join(root, "config", "config.json"),
  });
  return { root, adapter, operations };
}

test("compatibility manifest rejects ambient and inexact component coordinates", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-manifest-"));
  const manifestPath = path.join(root, "compatibility.json");
  await writeFile(
    manifestPath,
    JSON.stringify(
      manifestDocument([
        {
          ...exactComponent("execution"),
          version: "latest",
          digest: "sha256:pending",
        },
      ]),
    ),
  );

  await assert.rejects(loadCompatibilityManifest(manifestPath), /exact version/i);
});

test("preflight failure returns a typed result before installation effects", async () => {
  const { adapter, operations } = await harness({
    manifest: manifestDocument([exactComponent("execution"), exactComponent("services")]),
    fixture: { preflightFailures: { services: "docker is unavailable" } },
  });

  const result = await operations.run("install");

  assert.equal(result.schema, "wsr.operations.result@1.0.0");
  assert.equal(result.command, "install");
  assert.equal(result.status, "blocked");
  assert.equal(result.changed, false);
  assert.match(result.diagnostics[0].message, /docker is unavailable/);
  assert.deepEqual(adapter.effects(), []);
});

test("install resumes the exact interrupted journal and is then idempotent", async () => {
  const { adapter, operations } = await harness({
    manifest: manifestDocument([
      exactComponent("execution"),
      exactComponent("services"),
      exactComponent("workflow-source"),
    ]),
    fixture: { interruptOnceAt: "services" },
  });

  const interrupted = await operations.run("install");
  assert.equal(interrupted.status, "blocked");
  assert.equal(interrupted.resume?.nextComponent, "services");
  assert.deepEqual(adapter.effects(), ["install:execution"]);

  const resumed = await operations.run("install");
  assert.equal(resumed.status, "succeeded");
  assert.equal(resumed.changed, true);
  assert.deepEqual(adapter.effects(), [
    "install:execution",
    "install:services",
    "install:workflow-source",
  ]);

  const repeated = await operations.run("install");
  assert.equal(repeated.status, "succeeded");
  assert.equal(repeated.changed, false);
  assert.deepEqual(adapter.effects(), [
    "install:execution",
    "install:services",
    "install:workflow-source",
  ]);
});

test("a resume attempt fails closed when the compatibility manifest changes", async () => {
  const first = await harness({
    manifest: manifestDocument([exactComponent("execution"), exactComponent("services")]),
    fixture: { interruptOnceAt: "services" },
  });
  const interrupted = await first.operations.run("install");
  assert.equal(interrupted.status, "blocked");

  const changedManifestPath = path.join(first.root, "compatibility-next.json");
  await writeFile(
    changedManifestPath,
    JSON.stringify(
      manifestDocument([
        exactComponent("execution", "1.2.4"),
        exactComponent("services", "1.2.4"),
      ]),
    ),
  );
  const changedManifest = await loadCompatibilityManifest(changedManifestPath);
  const changed = createOperations({
    manifest: changedManifest,
    adapters: new Map(changedManifest.components.map((component) => [component.id, first.adapter])),
    stateDirectory: path.join(first.root, "state"),
    configPath: path.join(first.root, "config", "config.json"),
  });

  const result = await changed.run("install");
  assert.equal(result.status, "blocked");
  assert.match(result.diagnostics[0].message, /rollback or resume the exact manifest/i);
});

test("rollback after interruption unwinds only completed components in reverse order", async () => {
  const { adapter, operations } = await harness({
    manifest: manifestDocument([
      exactComponent("execution"),
      exactComponent("services"),
      exactComponent("workflow-source"),
    ]),
    fixture: { interruptOnceAt: "workflow-source" },
  });
  const interrupted = await operations.run("install");
  assert.equal(interrupted.status, "blocked");
  assert.deepEqual(adapter.effects(), ["install:execution", "install:services"]);

  const rolledBack = await operations.run("rollback");
  assert.equal(rolledBack.status, "succeeded");
  assert.deepEqual(adapter.effects(), [
    "install:execution",
    "install:services",
    "rollback:services",
    "rollback:execution",
  ]);

  const retried = await operations.run("install");
  assert.equal(retried.status, "succeeded");
});

test("setup owns a private editable config and repeated setup preserves it", async () => {
  const { operations, root } = await harness();
  const config = productConfig(root);

  const first = await operations.writeConfig(config);
  assert.equal(first.status, "succeeded");
  assert.equal(first.changed, true);
  const configMode = (await stat(first.data.path)).mode & 0o777;
  assert.equal(configMode, 0o600);

  const second = await operations.writeConfig(config);
  assert.equal(second.changed, false);
  assert.deepEqual(JSON.parse(await readFile(first.data.path, "utf8")), config);
});

test("configuration rejects credential-bearing fields instead of persisting login material", async () => {
  const { operations, root } = await harness();
  const config = productConfig(root, {
    workflowSource: {
      kind: "github",
      repository: "firestige/wsr-workflow-package",
      token: "must-not-persist",
    },
  });

  await assert.rejects(operations.writeConfig(config), /unknown field.*token/i);
});

test("uninstall removes managed installation state but preserves config and product state", async () => {
  const { operations, root } = await harness();
  const config = productConfig(root);
  await operations.writeConfig(config);
  assert.equal((await operations.run("install")).status, "succeeded");
  const retainedManifest = path.join(root, "state", "releases", "fixture-1", "compatibility.json");
  assert.deepEqual(JSON.parse(await readFile(retainedManifest, "utf8")), manifestDocument());

  const result = await operations.run("uninstall");

  assert.equal(result.status, "succeeded");
  assert.equal(result.data.preserved.config, true);
  assert.equal(result.data.preserved.durableData, true);
  assert.deepEqual(JSON.parse(await readFile(retainedManifest, "utf8")), manifestDocument());
  assert.deepEqual(JSON.parse(await readFile(result.data.configPath, "utf8")), config);
});

test("install can reconcile again after uninstall without treating stale completion as current", async () => {
  const { adapter, operations } = await harness();

  assert.equal((await operations.run("install")).changed, true);
  assert.equal((await operations.run("uninstall")).changed, true);
  assert.equal((await operations.run("install")).changed, true);
  assert.deepEqual(adapter.effects(), [
    "install:execution",
    "uninstall:execution",
    "install:execution",
  ]);
});

test("configuration has no repository selector and rejects repository as an unknown field", async () => {
  const { operations, root } = await harness();
  await assert.rejects(
    operations.writeConfig({ ...productConfig(root), repository: "/work/repository" }),
    /unknown field repository/i,
  );
});

test("global configuration rejects repository-scoped fields and workflow selectors", async () => {
  const { operations, root } = await harness();
  await assert.rejects(operations.writeConfig(productConfig(root, { workspace: "/work/repository" })), /unknown field workspace/i);
  await assert.rejects(operations.writeConfig(productConfig(root, { roleBindings: {} })), /unknown field roleBindings/i);
  await assert.rejects(operations.writeConfig(productConfig(root, { workflowSource: "hello-world-workflow@0.2.0" })), /workflowSource.*object/i);
});

test("global configuration validates GitHub source and allows omitted service defaults", async () => {
  const { operations, root } = await harness();
  await assert.doesNotReject(operations.writeConfig(productConfig(root, { services: undefined })));
  await assert.rejects(operations.writeConfig(productConfig(root, { installation: { dshMode: "all", dshProfile: "web" } })), /dshMode/i);
  await assert.rejects(operations.writeConfig(productConfig(root, { services: { ports: { dsh: 0 } } })), /services\.ports\.dsh/i);
  await assert.rejects(operations.writeConfig(productConfig(root, { workflowSource: { kind: "github", repository: "not-a-repository" } })), /workflowSource\.repository/i);
});

test("successful install records the verified compatibility manifest and active release", async () => {
  const { operations, root } = await harness();

  assert.equal((await operations.run("install")).status, "succeeded");

  assert.deepEqual(
    JSON.parse(await readFile(path.join(root, "state", "releases", "fixture-1", "compatibility.json"), "utf8")),
    manifestDocument(),
  );
  assert.deepEqual(
    JSON.parse(await readFile(path.join(root, "state", "active-release.json"), "utf8")),
    {
      schemaVersion: "wsr.active-release@1.0.0",
      release: "fixture-1",
      manifestDigest: (await loadCompatibilityManifest(path.join(root, "compatibility.json"))).digest,
      manifest: "releases/fixture-1/compatibility.json",
    },
  );
});

test("start can apply again after a completed stop", async () => {
  const { adapter, operations } = await harness();

  assert.equal((await operations.run("start")).changed, true);
  assert.equal((await operations.run("stop")).changed, true);
  assert.equal((await operations.run("start")).changed, true);
  assert.deepEqual(adapter.effects(), ["start:execution", "stop:execution", "start:execution"]);
});

test("the stable command set always returns the versioned result envelope", async () => {
  const commands = [
    "setup",
    "install",
    "preflight",
    "config",
    "status",
    "health",
    "logs",
    "start",
    "stop",
    "restart",
    "upgrade",
    "rollback",
    "uninstall",
  ];

  for (const command of commands) {
    const { operations } = await harness();
    const result = await operations.run(command);
    assert.equal(result.schema, "wsr.operations.result@1.0.0", command);
    assert.equal(result.command, command);
    assert.ok(["succeeded", "blocked", "failed"].includes(result.status));
  }
});

test("health aggregates blocked components and preserves their actionable diagnostics", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-health-"));
  const manifestPath = path.join(root, "compatibility.json");
  await writeFile(manifestPath, `${JSON.stringify(manifestDocument([
    exactComponent("execution"), exactComponent("services"),
  ]))}\n`);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const adapters = new Map([
    ["execution", { inspect: async () => ({ status: "succeeded", data: { running: true } }) }],
    ["services", { inspect: async () => ({
      status: "blocked", code: "SERVICES_HEALTH_FAILED", message: "Evidence is not ready",
    }) }],
  ]);
  const operations = createOperations({
    manifest, adapters, stateDirectory: path.join(root, "state"), configPath: path.join(root, "config.json"),
  });

  const result = await operations.run("health");

  assert.equal(result.status, "blocked");
  assert.deepEqual(result.components.map(({ id, status }) => [id, status]), [
    ["execution", "succeeded"], ["services", "blocked"],
  ]);
  assert.deepEqual(result.diagnostics, [{
    code: "SERVICES_HEALTH_FAILED", component: "services", message: "Evidence is not ready",
  }]);
});

test("CLI emits one machine-readable typed result using the fixture boundary", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-cli-"));
  const manifestPath = path.join(root, "compatibility.json");
  const fixturePath = path.join(root, "fixture.json");
  await writeFile(manifestPath, `${JSON.stringify(manifestDocument())}\n`);
  await writeFile(fixturePath, "{}\n");

  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [
      new URL("../bin/wsr.mjs", import.meta.url).pathname,
      "preflight",
      "--manifest",
      manifestPath,
      "--state-dir",
      path.join(root, "state"),
      "--config",
      path.join(root, "config.json"),
      "--fixture",
      fixturePath,
    ],
  );

  assert.equal(stderr, "");
  const result = JSON.parse(stdout);
  assert.equal(result.schema, "wsr.operations.result@1.0.0");
  assert.equal(result.command, "preflight");
  assert.equal(result.status, "succeeded");
});
