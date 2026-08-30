import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function defaultRun(command, args, options = {}) {
  try {
    const result = await execFileAsync(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      maxBuffer: 4 * 1024 * 1024,
    });
    return { status: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      status: Number.isInteger(error.code) ? error.code : 1,
      stdout: typeof error.stdout === "string" ? error.stdout : "",
      stderr: typeof error.stderr === "string" ? error.stderr : "",
    };
  }
}

async function defaultLaunch(command, args, options = {}) {
  await mkdir(path.dirname(options.logFile), { recursive: true, mode: 0o700 });
  const log = await open(options.logFile, "a", 0o600);
  try {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      detached: true,
      stdio: ["ignore", log.fd, log.fd],
    });
    child.unref();
    if (!Number.isInteger(child.pid)) throw new Error("DSH_PROCESS_NOT_STARTED");
    return child.pid;
  } finally {
    await log.close();
  }
}

const defaultProcessControl = Object.freeze({
  alive(pid) {
    try { process.kill(pid, 0); return true; }
    catch { return false; }
  },
  stop(pid) { process.kill(pid, "SIGTERM"); },
});

async function loadConfig(configPath) {
  return JSON.parse(await readFile(configPath, "utf8"));
}

async function writeJson(target, value) {
  await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  const temporary = `${target}.new`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, target);
}

function succeeded(data) {
  return { status: "succeeded", ...(data === undefined ? {} : { data }) };
}

function blocked(code, message) {
  return { status: "blocked", code, message };
}

async function invoke(run, command, args, options, code) {
  const result = await run(command, args, options);
  return result.status === 0
    ? succeeded({ command: path.basename(command), output: result.stdout.trim().slice(0, 4096) })
    : blocked(code, `${path.basename(command)} failed with status ${result.status}`);
}

async function downloadExact(url, target, digest, fetchImpl) {
  const response = await fetchImpl(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`ARTIFACT_DOWNLOAD_FAILED: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
  if (actual !== digest) throw new Error("ARTIFACT_DIGEST_MISMATCH");
  await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  const temporary = `${target}.new`;
  await writeFile(temporary, bytes, { mode: 0o600 });
  await rename(temporary, target);
}

function productBinding(binding, providers) {
  const provider = providers.compatibility.bindings?.[binding.provider];
  if (provider === undefined) throw new Error(`PROVIDER_BINDING_UNSUPPORTED: ${binding.provider}`);
  return {
    agentProvider: { identity: provider.identity, version: provider.version },
    model: { provider: provider.modelProvider, model: binding.model },
  };
}

function dshAdapter({ component, providers, configPath, stateDirectory, run, launch, processControl, startupProbeDelayMs }) {
  const managed = path.join(stateDirectory, "managed", "dsh");
  const executionConfigFile = path.join(managed, "execution-config.json");
  const intakeBindingFile = path.join(managed, "intake-bindings.json");
  const hostConfigFile = path.join(managed, "loopback-host.json");
  const overlayFile = path.join(managed, "product.patch.yml");
  const processFile = path.join(stateDirectory, "run", "dsh.json");
  const logFile = path.join(stateDirectory, "logs", "dsh.log");

  async function processRecord() {
    try {
      const value = JSON.parse(await readFile(processFile, "utf8"));
      return Number.isInteger(value?.pid) && value.pid > 0 ? value : undefined;
    } catch (error) {
      if (error.code === "ENOENT") return undefined;
      throw error;
    }
  }

  async function start() {
    const existing = await processRecord();
    if (existing !== undefined && processControl.alive(existing.pid)) {
      return succeeded({ pid: existing.pid, running: true, logFile });
    }
    if (existing !== undefined) await rm(processFile, { force: true });
    const config = await loadConfig(configPath);
    const pid = await launch("dsh", [
      config.installation.dshProfile,
      "--patch", overlayFile,
      "--no-open",
      "--host", "127.0.0.1",
      "--port", String(config.ports.dsh),
    ], { logFile });
    await new Promise((resolve) => setTimeout(resolve, startupProbeDelayMs));
    if (!processControl.alive(pid)) {
      await rm(processFile, { force: true });
      return blocked("DSH_START_FAILED", `DSH exited during startup; inspect ${logFile}`);
    }
    await writeJson(processFile, { pid });
    return succeeded({ pid, running: true, logFile });
  }

  async function stop() {
    const existing = await processRecord();
    if (existing === undefined) return succeeded({ running: false, logFile });
    if (processControl.alive(existing.pid)) processControl.stop(existing.pid);
    await rm(processFile, { force: true });
    return succeeded({ running: false, logFile });
  }

  async function setup() {
    const config = await loadConfig(configPath);
    const executionStateRoot = path.join(config.durableState, "execution");
    const bindings = Object.fromEntries(Object.entries(config.roleBindings)
      .map(([role, binding]) => [role, productBinding(binding, providers)]));
    const executionConfig = {
      schemaVersion: "execution.config@2.0.0",
      paths: {
        repositoryRoot: config.workspace,
        workspaceRoot: config.workspace,
        allowedWorktreeRoots: [config.workspace],
        stateRoot: executionStateRoot,
      },
      workflowSource: {
        kind: "github",
        repository: "firestige/wsr-workflow-package",
        releasesBaseUrl: "https://api.github.com/repos/firestige/wsr-workflow-package/releases",
        assetPattern: "workflow-package-{name}-{version}.tar.gz",
      },
      runner: { implementationKey: "runner.v2", host: { engine: "langgraph" }, maxParallelToolCalls: 2 },
      observation: {
        enabled: true,
        endpoint: `http://127.0.0.1:${config.ports.evidence}`,
        timeoutMs: 1000,
        maxBatchRecords: 64,
        maxBatchBytes: 262144,
        flushIntervalMs: 1000,
        shutdownFlushMs: 5000,
        serviceName: "wsr-dsh",
      },
      controls: {
        startupTimeoutMs: 30000,
        executionTimeoutMs: 7200000,
        shutdownTimeoutMs: 10000,
        maxConcurrentDeliveries: 1,
        allowExplicitRefresh: false,
        diagnosticMaxBytes: 4096,
      },
      intake: { maxCorrelationBytes: 256, maxOutputBytes: 8192 },
    };
    const hostConfig = {
      schemaVersion: "wsr.loopback-host@1.0.0",
      services: {
        evidence: {
          baseUrl: `http://127.0.0.1:${config.ports.evidence}`,
          healthPath: "/healthz",
          healthKind: "json-status-ok",
          contracts: [
            { name: "evidence.query", revision: "0.1.0", operations: ["facts/read", "traces/read"] },
            { name: "evidence.query", revision: "1.0.0", operations: ["tasks/list"] },
          ],
        },
        evolution: {
          baseUrl: `http://127.0.0.1:${config.ports.evolution}`,
          healthPath: "/healthz",
          healthKind: "plain-ok",
          contracts: [{ name: "evolution.compute", revision: "1", operations: ["evaluations/compute"] }],
        },
      },
      observation: { baseUrl: `http://127.0.0.1:${config.ports.evidence}` },
    };
    const overlay = [];
    if (config.installation.dshMode !== "studio") {
      overlay.push(
        "- id: wsr-execution",
        "  config:",
        `    configFile: ${JSON.stringify(executionConfigFile)}`,
        `    bindingFile: ${JSON.stringify(intakeBindingFile)}`,
      );
    }
    if (config.installation.dshMode !== "execution") {
      overlay.push(
        "- id: wsr-studio",
        "  config:",
        `    hostConfigFile: ${JSON.stringify(hostConfigFile)}`,
      );
    }
    await mkdir(executionStateRoot, { recursive: true, mode: 0o700 });
    await Promise.all([
      writeJson(executionConfigFile, executionConfig),
      writeJson(hostConfigFile, hostConfig),
      writeJson(path.join(config.workspace, ".wsr", "role-provider-bindings.json"), {
        schemaVersion: "execution.repository-role-provider-bindings@1.0.0",
        bindings,
      }),
    ]);
    await mkdir(path.dirname(overlayFile), { recursive: true, mode: 0o700 });
    await writeFile(overlayFile, `${overlay.join("\n")}\n`, { mode: 0o600 });
    return succeeded({ executionConfigFile, hostConfigFile, overlayFile });
  }

  return Object.freeze({
    async preflight(_component, context = {}) {
      const version = await run("dsh", ["--version"]);
      if (version.status !== 0) return blocked("DSH_UNAVAILABLE", "DSH is unavailable");
      if (version.stdout.trim() !== component.compatibility.dsh) {
        return blocked("DSH_VERSION_MISMATCH", `DSH must be ${component.compatibility.dsh}`);
      }
      const npm = await run("npm", ["--version"]);
      if (npm.status !== 0 || npm.stdout.trim() !== component.compatibility.npm) {
        return blocked("NPM_VERSION_MISMATCH", `npm must be ${component.compatibility.npm}`);
      }
      if (process.version.slice(1) !== component.compatibility.node) {
        return blocked("NODE_VERSION_MISMATCH", `Node must be ${component.compatibility.node}`);
      }
      if (context.command === "preflight") {
        const config = await loadConfig(configPath);
        const root = await run("git", ["rev-parse", "--show-toplevel"], { cwd: config.workspace });
        if (root.status !== 0 || path.resolve(root.stdout.trim()) !== path.resolve(config.workspace)) {
          return blocked("WORKSPACE_NOT_GIT_ROOT", "Workspace must be the canonical Git worktree root");
        }
        const status = await run("git", ["status", "--porcelain=v1", "--untracked-files=normal"], { cwd: config.workspace });
        if (status.status !== 0) return blocked("WORKSPACE_GIT_UNAVAILABLE", "Workspace Git status is unavailable");
        if (status.stdout.trim() !== "") {
          return blocked("WORKSPACE_DIRTY", "Workspace has uncommitted changes; commit or stash them before creating a new Delivery");
        }
      }
      return succeeded({ dsh: version.stdout.trim(), node: process.version.slice(1), npm: npm.stdout.trim() });
    },

    async apply(command) {
      if (command === "setup") {
        try { return await setup(); }
        catch (error) { return blocked("DSH_SETUP_FAILED", error.message); }
      }
      if (command === "start") return start();
      if (command === "stop") return stop();
      if (command === "restart") {
        const stopped = await stop();
        return stopped.status === "succeeded" ? start() : stopped;
      }
      const config = await loadConfig(configPath);
      const profile = config.installation.dshProfile;
      const selected = component.compatibility.packages[config.installation.dshMode];
      if (["install", "upgrade"].includes(command)) {
        const policy = await invoke(run, "dsh", ["plugin", "--profile", profile, "config", "set", "--location=project", "--json", "allowBuilds", '{"better-sqlite3":true}'], {}, "DSH_POLICY_FAILED");
        if (policy.status !== "succeeded") return policy;
        return invoke(run, "dsh", [
          "plugin", "--profile", profile, "add", "--workspace-root",
          component.compatibility.executionOwner.coordinate,
          selected,
        ], {}, "DSH_INSTALL_FAILED");
      }
      if (["rollback", "uninstall"].includes(command)) {
        if (command === "uninstall") await stop();
        const packageName = selected.split("@")[0];
        const removed = await invoke(run, "dsh", ["plugin", "--profile", profile, "remove", "--workspace-root", packageName], {}, "DSH_REMOVE_FAILED");
        if (removed.status !== "succeeded") return removed;
        return invoke(run, "dsh", ["plugin", "--profile", profile, "remove", "--workspace-root", "wsr-execution"], {}, "DSH_REMOVE_FAILED");
      }
      return succeeded();
    },

    async inspect(command) {
      const config = await loadConfig(configPath);
      if (command === "logs") {
        try { return succeeded({ logFile, tail: (await readFile(logFile, "utf8")).slice(-16_384) }); }
        catch (error) { return error.code === "ENOENT" ? { status: "unavailable", data: { logFile } } : blocked("DSH_LOGS_UNAVAILABLE", "DSH logs are unavailable"); }
      }
      if (command === "status" || command === "health") {
        const record = await processRecord();
        const running = record !== undefined && processControl.alive(record.pid);
        return running ? succeeded({ running, pid: record.pid, logFile }) : { status: "unavailable", data: { running: false, logFile } };
      }
      const result = await run("dsh", ["--profile", config.installation.dshProfile, "--dump-config"]);
      return result.status === 0
        ? succeeded({ profile: config.installation.dshProfile, composed: true })
        : { status: "unavailable", data: { profile: config.installation.dshProfile, composed: false } };
    },
  });
}

function servicesAdapter({ component, configPath, stateDirectory, bundleDirectory: override, run, fetchImpl }) {
  const managed = path.join(stateDirectory, "managed");
  const archive = path.join(stateDirectory, "downloads", `wsr-services-${component.version}.tar.gz`);
  const bundleDirectory = override ?? path.join(managed, `wsr-services-${component.version}`);
  const executable = path.join(bundleDirectory, "wsr-compose");

  async function environment() {
    const config = await loadConfig(configPath);
    return {
      WSR_EVIDENCE_PORT: String(config.ports.evidence),
      WSR_EVOLUTION_PORT: String(config.ports.evolution),
      WSR_LOCAL_STATE_DIR: path.join(config.durableState, "services"),
    };
  }

  async function install() {
    await downloadExact(component.downloadUrl, archive, component.digest, fetchImpl);
    await mkdir(managed, { recursive: true, mode: 0o700 });
    await rm(bundleDirectory, { recursive: true, force: true });
    const extracted = await invoke(run, "tar", ["-xzf", archive, "-C", managed], {}, "SERVICES_EXTRACT_FAILED");
    return extracted.status === "succeeded" ? succeeded({ bundleDirectory }) : extracted;
  }

  return Object.freeze({
    async preflight() {
      for (const [command, args, code] of [
        ["docker", ["info"], "DOCKER_UNAVAILABLE"],
        ["docker", ["compose", "version"], "COMPOSE_UNAVAILABLE"],
      ]) {
        const result = await run(command, args);
        if (result.status !== 0) return blocked(code, `${command} preflight failed`);
      }
      return succeeded();
    },
    async apply(command) {
      if (command === "setup") return succeeded();
      if (command === "install") return install();
      if (command === "uninstall") {
        const stopped = await invoke(run, executable, ["down"], { env: await environment() }, "SERVICES_STOP_FAILED");
        if (stopped.status !== "succeeded") return stopped;
        await rm(bundleDirectory, { recursive: true, force: true });
        return succeeded({ preservedEvidence: true });
      }
      if (["upgrade", "rollback"].includes(command)) {
        const installed = await install();
        if (installed.status !== "succeeded") return installed;
      }
      if (["start", "stop", "restart", "upgrade", "rollback"].includes(command)) {
        return invoke(run, executable, [command], { env: await environment() }, "SERVICES_OPERATION_FAILED");
      }
      return succeeded();
    },
    async inspect(command) {
      const action = command === "health" ? "preflight" : command;
      return invoke(run, executable, [action], { env: await environment() }, "SERVICES_INSPECT_FAILED");
    },
  });
}

function workflowAdapter({ component, configPath, stateDirectory, fetchImpl }) {
  const target = path.join(stateDirectory, "managed", "workflow", `${component.name}-${component.version}.tar.gz`);
  return Object.freeze({
    async preflight() {
      const config = await loadConfig(configPath);
      return config.workflowSource === `${component.name}@${component.version}`
        ? succeeded({ workflow: config.workflowSource })
        : blocked("WORKFLOW_SOURCE_MISMATCH", `Workflow source must be ${component.name}@${component.version}`);
    },
    async apply(command) {
      if (["install", "upgrade"].includes(command)) {
        try {
          await downloadExact(component.downloadUrl, target, component.digest, fetchImpl);
          return succeeded({ cache: target });
        } catch (error) {
          return blocked("WORKFLOW_ARTIFACT_INVALID", error.message);
        }
      }
      if (command === "uninstall") await rm(target, { force: true });
      return succeeded();
    },
    async inspect() {
      try {
        const bytes = await readFile(target);
        const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
        return digest === component.digest ? succeeded({ cached: true, digest }) : { status: "unavailable", data: { cached: false } };
      } catch {
        return { status: "unavailable", data: { cached: false } };
      }
    },
  });
}

function providerAdapter({ component, run }) {
  return Object.freeze({
    async preflight() {
      const codex = await run("codex", ["--version"]);
      if (codex.status !== 0 || !codex.stdout.includes(component.compatibility.codex)) {
        return blocked("CODEX_VERSION_MISMATCH", `Codex CLI must be ${component.compatibility.codex}`);
      }
      const login = await run("codex", ["login", "status"]);
      if (login.status !== 0) return blocked("CODEX_LOGIN_REQUIRED", "Codex local login is required");
      const copilot = await run("npm", [
        "exec", "--yes", `--package=@github/copilot@${component.compatibility.copilot}`, "--",
        "copilot", "--version",
      ]);
      if (copilot.status !== 0 || !copilot.stdout.includes(component.compatibility.copilot)) {
        return blocked("COPILOT_VERSION_MISMATCH", `Copilot runtime must be ${component.compatibility.copilot}`);
      }
      return succeeded({ copilot: component.compatibility.copilot, codex: component.compatibility.codex, codexLogin: "available", copilotLogin: "validated-on-first-invocation" });
    },
    async apply() { return succeeded(); },
    async inspect() { return succeeded({ compatibility: component.compatibility }); },
  });
}

export function createPublishedAdapters({
  manifest,
  configPath,
  stateDirectory,
  bundleDirectory,
  run = defaultRun,
  launch = defaultLaunch,
  processControl = defaultProcessControl,
  startupProbeDelayMs = 500,
  fetchImpl = globalThis.fetch,
}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
  const components = new Map(manifest.components.map((component) => [component.id, component]));
  return new Map([
    ["dsh-bundle", dshAdapter({
      component: components.get("dsh-bundle"),
      providers: components.get("providers"),
      configPath,
      stateDirectory,
      run,
      launch,
      processControl,
      startupProbeDelayMs,
    })],
    ["services", servicesAdapter({ component: components.get("services"), configPath, stateDirectory, bundleDirectory, run, fetchImpl })],
    ["workflow-source", workflowAdapter({ component: components.get("workflow-source"), configPath, stateDirectory, fetchImpl })],
    ["providers", providerAdapter({ component: components.get("providers"), run })],
  ]);
}

export const publishedDefaults = Object.freeze({ dshHome: path.join(homedir(), ".dsh") });
