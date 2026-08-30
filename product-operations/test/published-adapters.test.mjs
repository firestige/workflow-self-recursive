import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadCompatibilityManifest } from "../src/compatibility-manifest.mjs";
import { createPublishedAdapters } from "../src/published-adapters.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const manifestPath = path.join(root, "release/product/0.2.0.json");

async function configFixture(directory, overrides = {}) {
  const configPath = path.join(directory, "config.json");
  const config = {
    schema: "wsr.operations.config@1.0.0",
    workspace: directory,
    durableState: path.join(directory, "durable"),
    installation: { dshMode: "suite", dshProfile: "web" },
    ports: { evidence: 4318, evolution: 8000 },
    workflowSource: "hello-world-workflow@0.2.0",
    roleBindings: {
      "role.greeter": { provider: "copilot", model: "gpt-5.3-codex" },
      "role.reviewer": { provider: "codex", model: "gpt-5.6-sol" },
    },
    ...overrides,
  };
  await writeFile(configPath, `${JSON.stringify(config)}\n`);
  return configPath;
}

test("final product manifest binds only stable published artifacts", async () => {
  const manifest = await loadCompatibilityManifest(manifestPath);
  assert.equal(manifest.release, "0.2.0");
  assert.deepEqual(manifest.components.map(({ id }) => id), [
    "dsh-bundle",
    "services",
    "workflow-source",
    "providers",
  ]);
  assert.ok(manifest.components.every(({ coordinate }) => !coordinate.startsWith("fixture://")));

  const [dsh, services, workflow, providers] = manifest.components;
  assert.equal(dsh.version, "0.2.2");
  assert.equal(dsh.compatibility.executionOwner.version, "0.2.1");
  assert.equal(dsh.compatibility.executionOwner.release, "0.2.1");
  assert.equal(services.version, "0.1.0");
  assert.match(services.coordinate, /compose-0\.1\.0\/wsr-services-0\.1\.0\.tar\.gz$/u);
  assert.equal(workflow.version, "0.2.0");
  assert.match(workflow.coordinate, /workflow-package\/hello-world-workflow\/v0\.2\.0/u);
  assert.equal(providers.compatibility.copilot, "1.0.78");
  assert.equal(providers.compatibility.codex, "0.144.5");
});

test("published DSH preflight fails closed on an inexact local DSH runtime", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const commands = [];
  const adapters = createPublishedAdapters({
    manifest,
    configPath,
    stateDirectory: path.join(directory, "state"),
    run: async (command, args) => {
      commands.push([command, ...args]);
      if (command === "dsh") return { status: 0, stdout: "0.1.0\n", stderr: "" };
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const result = await adapters.get("dsh-bundle").preflight(manifest.components[0]);
  assert.equal(result.status, "blocked");
  assert.equal(result.code, "DSH_VERSION_MISMATCH");
  assert.deepEqual(commands[0], ["dsh", "--version"]);
});

test("explicit product preflight rejects a dirty workspace before custody admission", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const adapters = createPublishedAdapters({
    manifest,
    configPath,
    stateDirectory: path.join(directory, "state"),
    run: async (command, args) => {
      if (command === "dsh") return { status: 0, stdout: "0.1.1-rc.2\n", stderr: "" };
      if (command === "npm") return { status: 0, stdout: "11.6.2\n", stderr: "" };
      if (command === "git" && args.includes("--show-toplevel")) return { status: 0, stdout: `${directory}\n`, stderr: "" };
      if (command === "git") return { status: 0, stdout: " M product.txt\n", stderr: "" };
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const result = await adapters.get("dsh-bundle").preflight(manifest.components[0], { command: "preflight" });
  assert.equal(result.status, "blocked");
  assert.equal(result.code, "WORKSPACE_DIRTY");
  assert.doesNotMatch(result.message, /product\.txt/u);
});

test("DSH setup materializes the v2 product config and exact repository Role Provider bindings", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const stateDirectory = path.join(directory, "state");
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const adapters = createPublishedAdapters({
    manifest,
    configPath,
    stateDirectory,
    run: async () => ({ status: 0, stdout: "", stderr: "" }),
  });

  const result = await adapters.get("dsh-bundle").apply("setup");
  assert.equal(result.status, "succeeded");
  const execution = JSON.parse(await readFile(path.join(stateDirectory, "managed/dsh/execution-config.json"), "utf8"));
  assert.equal(execution.schemaVersion, "execution.config@2.0.0");
  assert.equal(execution.runner.implementationKey, "runner.v2");
  assert.equal(execution.paths.repositoryRoot, directory);
  assert.equal(execution.workflowSource.repository, "firestige/wsr-workflow-package");
  assert.equal("provider" in execution.runner, false);

  const bindings = JSON.parse(await readFile(path.join(directory, ".wsr/role-provider-bindings.json"), "utf8"));
  assert.deepEqual(bindings, {
    schemaVersion: "execution.repository-role-provider-bindings@1.0.0",
    bindings: {
      "role.greeter": {
        agentProvider: { identity: "provider.copilot", version: "1.0.78" },
        model: { provider: "github-copilot", model: "gpt-5.3-codex" },
      },
      "role.reviewer": {
        agentProvider: { identity: "provider.codex", version: "0.144.5" },
        model: { provider: "openai", model: "gpt-5.6-sol" },
      },
    },
  });
  const overlay = await readFile(path.join(stateDirectory, "managed/dsh/product.patch.yml"), "utf8");
  assert.match(overlay, /id: wsr-execution[\s\S]*execution-config\.json[\s\S]*id: wsr-studio[\s\S]*loopback-host\.json/u);
  assert.doesNotMatch(overlay, /__REQUIRED__/u);
});

test("published services adapter delegates lifecycle to the exact released wsr-compose owner", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const commands = [];
  const bundleDirectory = path.join(directory, "wsr-services-0.1.0");
  const adapters = createPublishedAdapters({
    manifest,
    configPath,
    stateDirectory: path.join(directory, "state"),
    bundleDirectory,
    run: async (command, args, options) => {
      commands.push({ command, args, options });
      return { status: 0, stdout: "ready\n", stderr: "" };
    },
  });
  const services = adapters.get("services");

  const result = await services.apply("start", manifest.components[1]);
  assert.equal(result.status, "succeeded");
  assert.equal(commands[0].command, path.join(bundleDirectory, "wsr-compose"));
  assert.deepEqual(commands[0].args, ["start"]);
  assert.equal(commands[0].options.env.WSR_EVIDENCE_PORT, "4318");
  assert.equal(commands[0].options.env.WSR_EVOLUTION_PORT, "8000");
});

test("published DSH lifecycle launches the configured profile and retains only pid and logs", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const stateDirectory = path.join(directory, "state");
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const launches = [];
  const signals = [];
  const adapters = createPublishedAdapters({
    manifest,
    configPath,
    stateDirectory,
    run: async () => ({ status: 0, stdout: "", stderr: "" }),
    launch: async (command, args, options) => {
      launches.push({ command, args, options });
      return 4242;
    },
    processControl: {
      alive: () => true,
      stop: (pid) => signals.push(pid),
    },
  });
  const dsh = adapters.get("dsh-bundle");
  await dsh.apply("setup");

  const started = await dsh.apply("start");
  assert.equal(started.status, "succeeded");
  assert.equal(launches[0].command, "dsh");
  assert.deepEqual(launches[0].args.slice(0, 4), ["web", "--patch", path.join(stateDirectory, "managed/dsh/product.patch.yml"), "--no-open"]);
  assert.equal(launches[0].options.logFile, path.join(stateDirectory, "logs/dsh.log"));
  assert.deepEqual(JSON.parse(await readFile(path.join(stateDirectory, "run/dsh.json"), "utf8")), { pid: 4242 });

  const stopped = await dsh.apply("stop");
  assert.equal(stopped.status, "succeeded");
  assert.deepEqual(signals, [4242]);
});

test("published provider preflight uses Codex read-only login status and never persists credentials", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const commands = [];
  const adapters = createPublishedAdapters({
    manifest,
    configPath,
    stateDirectory: path.join(directory, "state"),
    run: async (command, args) => {
      commands.push([command, ...args]);
      if (command === "codex" && args[0] === "--version") return { status: 0, stdout: "codex-cli 0.144.5\n", stderr: "" };
      if (command === "codex") return { status: 0, stdout: "Logged in using ChatGPT\n", stderr: "" };
      return { status: 0, stdout: "GitHub Copilot CLI 1.0.78.\n", stderr: "" };
    },
  });

  const result = await adapters.get("providers").preflight(manifest.components[3]);
  assert.equal(result.status, "succeeded");
  assert.ok(commands.some(([command, ...args]) => command === "codex" && args.join(" ") === "login status"));
  assert.doesNotMatch(JSON.stringify(result), /token|credential|secret/iu);
});

test("published adapter source contains no source checkout or ambient latest fallback", async () => {
  const source = await readFile(path.join(root, "product-operations/src/published-adapters.mjs"), "utf8");
  assert.doesNotMatch(source, /git\s+clone|\.\.\/(?:execution|evidence|evolution)-system|@latest/u);
});
