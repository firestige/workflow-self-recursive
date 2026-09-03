import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadCompatibilityManifest } from "../src/compatibility-manifest.mjs";
import { createPublishedAdapters } from "../src/published-adapters.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const manifestPath = path.join(root, "release/product/0.5.2.json");
const packagedManifestPath = path.join(root, "product-operations/manifests/product-0.5.2.json");

async function configFixture(directory, overrides = {}) {
  const configPath = path.join(directory, "config.json");
  const config = {
    schemaVersion: "wsr.global-config@1.0.0",
    installation: { dshMode: "suite", dshProfile: "web" },
    services: { ports: { dsh: 18081, evidence: 4318, evolution: 8000 } },
    workflowSource: {
      kind: "github",
      repository: "firestige/wsr-workflow-package",
    },
    ...overrides,
  };
  await writeFile(configPath, `${JSON.stringify(config)}\n`);
  return configPath;
}

test("final product manifest binds only stable published artifacts", async () => {
  assert.equal(await readFile(packagedManifestPath, "utf8"), await readFile(manifestPath, "utf8"));
  const manifest = await loadCompatibilityManifest(manifestPath);
  assert.equal(manifest.release, "0.5.2");
  assert.deepEqual(manifest.components.map(({ id }) => id), [
    "dsh-bundle",
    "services",
    "workflow-source",
    "providers",
  ]);
  assert.ok(manifest.components.every(({ coordinate }) => !coordinate.startsWith("fixture://")));

  const [dsh, services, workflow, providers] = manifest.components;
  assert.equal(dsh.version, "0.2.5");
  assert.equal(dsh.coordinate, "github-release://firestige/wsr-dsh/0.2.5/compatibility-matrix.json");
  assert.deepEqual(dsh.compatibility.packages, {
    execution: "dsh-wsr-execution@0.2.4",
    studio: "dsh-wsr-studio@0.1.2",
    suite: "dsh-wsr@0.2.4",
  });
  assert.equal(dsh.compatibility.executionOwner.version, "0.2.3");
  assert.equal(dsh.compatibility.executionOwner.release, "0.2.3");
  assert.equal(services.version, "0.1.1");
  assert.match(services.coordinate, /compose-0\.1\.1\/wsr-services-0\.1\.1\.tar\.gz$/u);
  assert.equal(workflow.version, "0.4.1");
  assert.match(workflow.coordinate, /workflow-package\/implementation-workflow\/v0\.4\.1/u);
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

test("product preflight does not inspect a business workspace", async () => {
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
      if (command === "git") throw new Error("global product preflight must not inspect a repository");
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const result = await adapters.get("dsh-bundle").preflight(manifest.components[0], { command: "preflight" });
  assert.equal(result.status, "succeeded");
});

test("DSH setup uses an installation root and leaves repository Role Provider bindings per-repo", async () => {
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
  const installationRoot = path.join(stateDirectory, "managed/workspace-root");
  assert.equal(execution.paths.repositoryRoot, installationRoot);
  assert.equal(execution.paths.workspaceRoot, installationRoot);
  assert.deepEqual(execution.paths.allowedWorktreeRoots, [installationRoot]);
  assert.equal(execution.paths.stateRoot, path.join(stateDirectory, "durable/execution"));
  assert.equal(execution.workflowSource.repository, "firestige/wsr-workflow-package");
  assert.equal(execution.workflowSource.releasesBaseUrl, "https://api.github.com/repos/firestige/wsr-workflow-package/releases");
  assert.equal("provider" in execution.runner, false);
  await assert.rejects(readFile(path.join(directory, ".wsr/role-provider-bindings.json"), "utf8"), /ENOENT/u);
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

test("published adapters apply product defaults when optional service settings are omitted", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const configPath = await configFixture(directory, { services: undefined });
  const manifest = await loadCompatibilityManifest(manifestPath);
  const commands = [];
  const adapters = createPublishedAdapters({
    manifest,
    configPath,
    stateDirectory: path.join(directory, "state"),
    bundleDirectory: path.join(directory, "bundle"),
    run: async (command, args, options) => {
      commands.push({ command, args, options });
      return { status: 0, stdout: "ready\n", stderr: "" };
    },
  });

  assert.equal((await adapters.get("services").apply("start", manifest.components[1])).status, "succeeded");
  assert.equal(commands[0].options.env.WSR_EVIDENCE_PORT, "4318");
  assert.equal(commands[0].options.env.WSR_EVOLUTION_PORT, "8000");
});

test("workflow source selects a GitHub repository rather than a package version", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const manifest = await loadCompatibilityManifest(manifestPath);
  const acceptedConfig = await configFixture(directory);
  const accepted = createPublishedAdapters({
    manifest,
    configPath: acceptedConfig,
    stateDirectory: path.join(directory, "state-a"),
  });
  assert.equal((await accepted.get("workflow-source").preflight()).status, "succeeded");

  const alternateConfig = await configFixture(directory, {
    workflowSource: { kind: "github", repository: "another/workflows" },
  });
  const alternate = createPublishedAdapters({
    manifest,
    configPath: alternateConfig,
    stateDirectory: path.join(directory, "state-b"),
  });
  const result = await alternate.get("workflow-source").preflight();
  assert.equal(result.status, "succeeded");
  assert.equal(result.data.repository, "another/workflows");
});

test("published services health reads the running loopback endpoints instead of installation preflight", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const urls = [];
  const adapters = createPublishedAdapters({
    manifest,
    configPath,
    stateDirectory: path.join(directory, "state"),
    run: async () => { throw new Error("health must not invoke wsr-compose preflight"); },
    fetchImpl: async (url) => {
      urls.push(url);
      return url.endsWith(":4318/healthz")
        ? new Response('{"status":"ok"}', { status: 200 })
        : new Response("ok", { status: 200 });
    },
  });

  const result = await adapters.get("services").inspect("health");
  assert.equal(result.status, "succeeded");
  assert.deepEqual(urls, ["http://127.0.0.1:4318/healthz", "http://127.0.0.1:8000/healthz"]);
});

test("published services status rejects a partial Compose stack even when compose ps exits zero", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const adapters = createPublishedAdapters({
    manifest, configPath, stateDirectory: path.join(directory, "state"), bundleDirectory: path.join(directory, "bundle"),
    run: async () => ({
      status: 0,
      stdout: `${JSON.stringify({ Service: "database", State: "running", Health: "healthy", ExitCode: 0 })}\n`,
      stderr: "",
    }),
  });

  const result = await adapters.get("services").inspect("status");

  assert.equal(result.status, "blocked");
  assert.equal(result.code, "SERVICES_NOT_READY");
  assert.match(result.message, /migrate.*evidence.*evolution/iu);
});

test("published adapter returns bounded redacted command stderr instead of only an exit status", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const adapters = createPublishedAdapters({
    manifest, configPath, stateDirectory: path.join(directory, "state"), bundleDirectory: path.join(directory, "bundle"),
    run: async () => ({
      status: 19,
      stdout: "",
      stderr: "migration failed: password authentication failed\nAuthorization: Bearer should-not-leak",
    }),
  });

  const result = await adapters.get("services").apply("start");

  assert.equal(result.status, "blocked");
  assert.match(result.message, /password authentication failed/u);
  assert.doesNotMatch(result.message, /should-not-leak/u);
  assert.ok(Buffer.byteLength(result.message, "utf8") <= 4096);
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
  assert.deepEqual(launches[0].args.slice(4), ["--host", "127.0.0.1", "--port", "18081"]);
  assert.equal(launches[0].options.logFile, path.join(stateDirectory, "logs/dsh.log"));
  assert.deepEqual(JSON.parse(await readFile(path.join(stateDirectory, "run/dsh.json"), "utf8")), { pid: 4242 });

  const stopped = await dsh.apply("stop");
  assert.equal(stopped.status, "succeeded");
  assert.deepEqual(signals, [4242]);
});

test("published DSH start fails closed when the launched process exits during startup", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const stateDirectory = path.join(directory, "state");
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const adapters = createPublishedAdapters({
    manifest,
    configPath,
    stateDirectory,
    run: async () => ({ status: 0, stdout: "", stderr: "" }),
    launch: async () => 4242,
    processControl: { alive: () => false, stop: () => {} },
    startupProbeDelayMs: 0,
  });

  const result = await adapters.get("dsh-bundle").apply("start");
  assert.equal(result.status, "blocked");
  assert.equal(result.code, "DSH_START_FAILED");
  await assert.rejects(readFile(path.join(stateDirectory, "run/dsh.json"), "utf8"), /ENOENT/u);
});

test("published DSH uninstall treats an already-collapsed transitive owner root as absent", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-published-adapter-"));
  const configPath = await configFixture(directory);
  const manifest = await loadCompatibilityManifest(manifestPath);
  const removals = [];
  const adapters = createPublishedAdapters({
    manifest,
    configPath,
    stateDirectory: path.join(directory, "state"),
    run: async (command, args) => {
      if (command === "dsh" && args.includes("remove")) {
        removals.push(args.at(-1));
        return args.at(-1) === "wsr-execution"
          ? { status: 1, stdout: "[ERR_PNPM_CANNOT_REMOVE_MISSING_DEPS] dependency is absent", stderr: "" }
          : { status: 0, stdout: "", stderr: "" };
      }
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const result = await adapters.get("dsh-bundle").apply("uninstall");
  assert.equal(result.status, "succeeded");
  assert.deepEqual(removals, ["dsh-wsr", "wsr-execution"]);
});

test("published DSH rollback reconciles the stable package instead of removing roots", async () => {
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
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  const result = await adapters.get("dsh-bundle").apply("rollback");
  assert.equal(result.status, "succeeded");
  assert.ok(commands.some((command) => command.includes("add") && command.at(-1) === "dsh-wsr@0.2.4"));
  assert.ok(commands.every((command) => !command.includes("remove")));
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
