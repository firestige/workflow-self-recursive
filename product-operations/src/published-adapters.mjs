import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { normalizeGlobalConfig } from "./global-config.mjs";

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
  return normalizeGlobalConfig(JSON.parse(await readFile(configPath, "utf8")));
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

function boundedTail(value, maxBytes) {
  const bytes = Buffer.from(value ?? "", "utf8");
  return bytes.length <= maxBytes ? bytes.toString("utf8") : bytes.subarray(bytes.length - maxBytes).toString("utf8");
}

function redactDiagnostic(value) {
  return String(value ?? "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/gu, "")
    .replace(/(authorization\s*:\s*bearer\s+)\S+/giu, "$1[REDACTED]")
    .replace(/((?:password|token|secret|api[_-]?key)\s*[=:]\s*)\S+/giu, "$1[REDACTED]")
    .replace(/:\/\/([^\s/:@]+):([^\s/@]+)@/gu, "://$1:[REDACTED]@");
}

function resultOutput(result, maxBytes) {
  return boundedTail(redactDiagnostic([result.stdout, result.stderr].filter(Boolean).join("\n").trim()), maxBytes);
}

async function invoke(run, command, args, options, code) {
  const result = await run(command, args, options);
  if (result.status === 0) return succeeded({ command: path.basename(command), output: resultOutput(result, 16_384) });
  const prefix = `${path.basename(command)} failed with status ${result.status}`;
  const detail = resultOutput(result, Math.max(0, 4096 - Buffer.byteLength(prefix, "utf8") - 2));
  return blocked(code, `${prefix}${detail.length === 0 ? "" : `: ${detail}`}`);
}

function composeRows(output) {
  const source = String(output ?? "").trim();
  if (source.length === 0) return [];
  try {
    const parsed = JSON.parse(source);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return source.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  }
}

function composeReadiness(output) {
  let rows;
  try { rows = composeRows(output); }
  catch { return blocked("SERVICES_STATUS_INVALID", "wsr-compose returned an unreadable service status"); }
  const byService = new Map(rows.map((row) => [row.Service, row]));
  const ready = (name) => {
    const row = byService.get(name);
    if (name === "migrate") return row !== undefined && String(row.State).toLowerCase() === "exited" && Number(row.ExitCode) === 0;
    return row !== undefined && String(row.State).toLowerCase() === "running" && String(row.Health).toLowerCase() === "healthy";
  };
  const unavailable = ["database", "migrate", "evidence", "evolution"].filter((name) => !ready(name));
  return unavailable.length === 0
    ? succeeded({ services: rows })
    : blocked("SERVICES_NOT_READY", `Compose services not ready: ${unavailable.join(", ")}`);
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

function dshAdapter({ component, configPath, stateDirectory, run, launch, processControl, startupProbeDelayMs }) {
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
      "--port", String(config.services.ports.dsh),
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

  async function removeWorkspaceRoot(profile, packageName) {
    const result = await run("dsh", ["plugin", "--profile", profile, "remove", "--workspace-root", packageName]);
    if (result.status === 0) return succeeded({ packageName, removed: true });
    if (`${result.stdout}\n${result.stderr}`.includes("ERR_PNPM_CANNOT_REMOVE_MISSING_DEPS")) {
      return succeeded({ packageName, removed: false });
    }
    return blocked("DSH_REMOVE_FAILED", `dsh failed with status ${result.status}`);
  }

  async function setup() {
    const config = await loadConfig(configPath);
    const installationRoot = path.join(stateDirectory, "managed", "workspace-root");
    const executionStateRoot = path.join(stateDirectory, "durable", "execution");
    const repository = config.workflowSource.repository;
    const executionConfig = {
      schemaVersion: "execution.config@2.0.0",
      paths: {
        repositoryRoot: installationRoot,
        workspaceRoot: installationRoot,
        allowedWorktreeRoots: [installationRoot],
        stateRoot: executionStateRoot,
      },
      workflowSource: {
        kind: "github",
        repository,
        releasesBaseUrl: `https://api.github.com/repos/${repository}/releases`,
        assetPattern: "workflow-package-{name}-{version}.tar.gz",
      },
      runner: { implementationKey: "runner.v2", host: { engine: "langgraph" }, maxParallelToolCalls: 2 },
      observation: {
        enabled: true,
        endpoint: `http://127.0.0.1:${config.services.ports.evidence}`,
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
          baseUrl: `http://127.0.0.1:${config.services.ports.evidence}`,
          healthPath: "/healthz",
          healthKind: "json-status-ok",
          contracts: [
            { name: "evidence.query", revision: "0.1.0", operations: ["facts/read", "traces/read"] },
            { name: "evidence.query", revision: "1.0.0", operations: ["tasks/list"] },
          ],
        },
        evolution: {
          baseUrl: `http://127.0.0.1:${config.services.ports.evolution}`,
          healthPath: "/healthz",
          healthKind: "plain-ok",
          contracts: [{ name: "evolution.compute", revision: "1", operations: ["evaluations/compute"] }],
        },
      },
      observation: { baseUrl: `http://127.0.0.1:${config.services.ports.evidence}` },
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
    await Promise.all([
      mkdir(installationRoot, { recursive: true, mode: 0o700 }),
      mkdir(executionStateRoot, { recursive: true, mode: 0o700 }),
    ]);
    await Promise.all([
      writeJson(executionConfigFile, executionConfig),
      writeJson(hostConfigFile, hostConfig),
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
      const selectedIdentity = component.compatibility.packages[config.installation.dshMode];
      const localSource = component.coordinate.startsWith("fixture://")
        ? component.qualification?.packageSources?.[config.installation.dshMode]
        : undefined;
      const selected = typeof localSource === "string" ? localSource : selectedIdentity;
      if (["install", "upgrade", "rollback"].includes(command)) {
        const policy = await invoke(run, "dsh", ["plugin", "--profile", profile, "config", "set", "--location=project", "--json", "allowBuilds", '{"better-sqlite3":true}'], {}, "DSH_POLICY_FAILED");
        if (policy.status !== "succeeded") return policy;
        return invoke(run, "dsh", [
          "plugin", "--profile", profile, "add", "--workspace-root",
          component.compatibility.executionOwner.coordinate,
          selected,
        ], {}, "DSH_INSTALL_FAILED");
      }
      if (command === "uninstall") {
        await stop();
        const packageName = selectedIdentity.split("@")[0];
        const removed = await removeWorkspaceRoot(profile, packageName);
        if (removed.status !== "succeeded") return removed;
        return removeWorkspaceRoot(profile, "wsr-execution");
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
      WSR_EVIDENCE_PORT: String(config.services.ports.evidence),
      WSR_EVOLUTION_PORT: String(config.services.ports.evolution),
      WSR_LOCAL_STATE_DIR: path.join(stateDirectory, "durable", "services"),
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
      if (command === "health") {
        const config = await loadConfig(configPath);
        const endpoints = [
          `http://127.0.0.1:${config.services.ports.evidence}/healthz`,
          `http://127.0.0.1:${config.services.ports.evolution}/healthz`,
        ];
        try {
          const [evidence, evolution] = await Promise.all(endpoints.map((url) => fetchImpl(url, {
            signal: AbortSignal.timeout(3000),
          })));
          if (!evidence.ok || !evolution.ok) throw new Error("health endpoint returned a non-success status");
          const evidenceBody = await evidence.json();
          const evolutionBody = (await evolution.text()).trim();
          if (evidenceBody?.status !== "ok" || evolutionBody !== "ok") {
            throw new Error("health endpoint returned an incompatible body");
          }
          return succeeded({ endpoints });
        } catch (error) {
          return blocked("SERVICES_HEALTH_FAILED", error.message);
        }
      }
      if (command === "status") {
        const result = await run(executable, [command], { env: await environment() });
        if (result.status !== 0) {
          const prefix = `${path.basename(executable)} failed with status ${result.status}`;
          const detail = resultOutput(result, Math.max(0, 4096 - Buffer.byteLength(prefix, "utf8") - 2));
          return blocked("SERVICES_INSPECT_FAILED", `${prefix}${detail.length === 0 ? "" : `: ${detail}`}`);
        }
        return composeReadiness(result.stdout);
      }
      return invoke(run, executable, [command], { env: await environment() }, "SERVICES_INSPECT_FAILED");
    },
  });
}

function workflowAdapter({ component, configPath, stateDirectory, fetchImpl }) {
  const target = path.join(stateDirectory, "managed", "workflow", `${component.name}-${component.version}.tar.gz`);
  return Object.freeze({
    async preflight() {
      const config = await loadConfig(configPath);
      return succeeded({ repository: config.workflowSource.repository });
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
