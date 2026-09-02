import { execFile } from "node:child_process";
import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import net from "node:net";
import path from "node:path";
import { promisify } from "node:util";

import { normalizeGlobalConfig } from "./global-config.mjs";

const execFileAsync = promisify(execFile);
const WSR_ROOTS = new Set([
  "dsh-wsr",
  "dsh-wsr-execution",
  "dsh-wsr-studio",
  "wsr-dsh-intake",
  "wsr-execution",
]);
const PRESERVED = Object.freeze({
  config: true,
  durableData: true,
  evidence: true,
  credentials: true,
  userPatches: true,
});

async function defaultRun(command, args) {
  try {
    const result = await execFileAsync(command, args, { maxBuffer: 4 * 1024 * 1024 });
    return { status: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      status: Number.isInteger(error.code) ? error.code : 1,
      stdout: typeof error.stdout === "string" ? error.stdout : "",
      stderr: typeof error.stderr === "string" ? error.stderr : "",
    };
  }
}

function defaultInspectPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (error) => resolve({ available: false, error: error.code ?? error.message }));
    server.listen({ host: "127.0.0.1", port, exclusive: true }, () => {
      server.close(() => resolve({ available: true }));
    });
  });
}

function defaultProcessAlive(pid) {
  try { process.kill(pid, 0); return true; }
  catch { return false; }
}

async function readJson(target) {
  try { return JSON.parse(await readFile(target, "utf8")); }
  catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function readText(target) {
  try { return await readFile(target, "utf8"); }
  catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function directoryEntries(target) {
  try { return await readdir(target); }
  catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function packageCoordinate(value) {
  const separator = value.lastIndexOf("@");
  if (separator <= 0 || separator === value.length - 1) throw new Error(`Invalid package coordinate: ${value}`);
  return { name: value.slice(0, separator), version: value.slice(separator + 1) };
}

function dshRoots(output) {
  const rows = JSON.parse(output);
  const profile = Array.isArray(rows) ? rows[0] : rows;
  const dependencies = profile?.dependencies ?? {};
  return new Map(Object.entries(dependencies).map(([name, value]) => [
    name,
    typeof value === "string" ? value : value?.version,
  ]));
}

function finding(code, severity, message) {
  return Object.freeze({ code, severity, message });
}

function planItem(kind, fields) {
  return Object.freeze({ kind, ...fields });
}

function decodeReleaseDirectory(entry) {
  try { return decodeURIComponent(entry); }
  catch { return entry; }
}

async function writeJsonAtomic(target, value) {
  await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  const temporary = `${target}.new`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, target);
}

export function createInstallationMaintenance({
  manifest,
  configPath,
  stateDirectory,
  dshHome = process.env.DSH_HOME ?? path.join(homedir(), ".dsh"),
  run = defaultRun,
  inspectPort = defaultInspectPort,
  processAlive = defaultProcessAlive,
}) {
  async function analyze() {
    const config = normalizeGlobalConfig(JSON.parse(await readFile(configPath, "utf8")));
    const profile = config.installation.dshProfile;
    const profileDirectory = path.join(dshHome, "profiles", profile);
    const rootResult = await run("dsh", ["plugin", "--profile", profile, "list", "--depth", "0", "--json"]);
    if (rootResult.status !== 0) {
      return {
        verdict: "BLOCKED",
        findings: [finding("DSH_ROOT_INVENTORY_FAILED", "blocked", "Cannot inspect DSH profile roots")],
        plan: [],
        manualActions: ["Repair the DSH profile before installing WSR"],
        preserved: { ...PRESERVED },
        config,
      };
    }

    let roots;
    try { roots = dshRoots(rootResult.stdout); }
    catch {
      return {
        verdict: "BLOCKED",
        findings: [finding("DSH_ROOT_INVENTORY_INVALID", "blocked", "DSH returned an unreadable root inventory")],
        plan: [],
        manualActions: ["Repair the DSH profile before installing WSR"],
        preserved: { ...PRESERVED },
        config,
      };
    }

    const dsh = manifest.components.find(({ id }) => id === "dsh-bundle");
    const selected = packageCoordinate(dsh.compatibility.packages[config.installation.dshMode]);
    const owner = dsh.compatibility.executionOwner;
    const expectedRoots = new Map([[selected.name, selected.version]]);
    if (config.installation.dshMode !== "studio") expectedRoots.set(owner.package, owner.version);
    const findings = [];
    const plan = [];
    const manualActions = [];
    const knownInstalledRoots = [...roots].filter(([name]) => WSR_ROOTS.has(name));

    for (const [name, version] of knownInstalledRoots) {
      if (expectedRoots.get(name) === version) continue;
      findings.push(finding("OBSOLETE_DSH_ROOT", "cleanup", `${name}@${version ?? "unknown"} conflicts with the target product`));
      plan.push(planItem("dsh-root", { packageName: name, version }));
    }

    const patchFile = path.join(profileDirectory, "cordis.patch.yml");
    const patch = await readText(patchFile);
    if (patch !== undefined && /(?:id:\s*workflow-execution\b|name:\s*['"]?(?:wsr-dsh-intake|dsh-wsr(?:-execution|-studio)?)(?:['"]|\s|$))/u.test(patch)) {
      findings.push(finding("LEGACY_USER_PATCH_DETECTED", "cleanup", `Legacy WSR configuration is present in ${patchFile}`));
      manualActions.push(`Review ${patchFile} and remove the legacy workflow-execution or WSR insert block`);
    }

    const activeReleaseFile = path.join(stateDirectory, "active-release.json");
    const activeRelease = await readJson(activeReleaseFile);
    if (activeRelease !== undefined && activeRelease.release !== manifest.release) {
      findings.push(finding("INACTIVE_PRODUCT_RELEASE", "cleanup", `Active product metadata still references ${activeRelease.release}`));
      plan.push(planItem("state-path", { path: activeReleaseFile, reason: "inactive-active-release" }));
    }
    const installationStateDrift = activeRelease !== undefined && knownInstalledRoots.length === 0;
    if (installationStateDrift) {
      findings.push(finding("INSTALLATION_STATE_DRIFT", "cleanup", "Product state records an installation but the DSH profile has no WSR roots"));
      if (!plan.some((item) => item.kind === "state-path" && item.path === activeReleaseFile)) {
        plan.push(planItem("state-path", { path: activeReleaseFile, reason: "stale-active-release" }));
      }
    }

    const releaseRoot = path.join(stateDirectory, "releases");
    for (const entry of await directoryEntries(releaseRoot)) {
      const release = decodeReleaseDirectory(entry);
      if (release === manifest.release) continue;
      const target = path.join(releaseRoot, entry);
      if (!plan.some((item) => item.kind === "state-path" && item.path === target)) {
        plan.push(planItem("state-path", { path: target, reason: "inactive-release" }));
      }
      if (activeRelease?.release !== release) {
        findings.push(finding("OBSOLETE_SOFTWARE_ARTIFACT", "cleanup", `Inactive release metadata ${release} can be removed`));
      }
    }

    const services = manifest.components.find(({ id }) => id === "services");
    const allowedDownloads = new Set(services === undefined ? [] : [`wsr-services-${services.version}.tar.gz`]);
    const downloadsRoot = path.join(stateDirectory, "downloads");
    for (const entry of await directoryEntries(downloadsRoot)) {
      if (allowedDownloads.has(entry)) continue;
      findings.push(finding("OBSOLETE_SOFTWARE_ARTIFACT", "cleanup", `Obsolete download ${entry} can be removed`));
      plan.push(planItem("state-path", { path: path.join(downloadsRoot, entry), reason: "obsolete-download" }));
    }

    const managedRoot = path.join(stateDirectory, "managed");
    const activeServiceDirectory = services === undefined ? undefined : `wsr-services-${services.version}`;
    for (const entry of await directoryEntries(managedRoot)) {
      if (!entry.startsWith("wsr-services-") || entry === activeServiceDirectory) continue;
      findings.push(finding("OBSOLETE_SOFTWARE_ARTIFACT", "cleanup", `Obsolete service bundle ${entry} can be removed`));
      plan.push(planItem("state-path", { path: path.join(managedRoot, entry), reason: "obsolete-service-bundle" }));
    }

    const workflow = manifest.components.find(({ id }) => id === "workflow-source");
    const workflowRoot = path.join(managedRoot, "workflow");
    const activeWorkflow = workflow === undefined ? undefined : `${workflow.name}-${workflow.version}.tar.gz`;
    for (const entry of await directoryEntries(workflowRoot)) {
      if (entry === activeWorkflow) continue;
      findings.push(finding("OBSOLETE_SOFTWARE_ARTIFACT", "cleanup", `Obsolete Workflow cache ${entry} can be removed`));
      plan.push(planItem("state-path", { path: path.join(workflowRoot, entry), reason: "obsolete-workflow-cache" }));
    }

    const operationsStateFile = path.join(stateDirectory, "operations-state.json");
    const operationsState = await readJson(operationsStateFile);
    if (operationsState?.active !== null && operationsState?.active !== undefined) {
      findings.push(finding("OPERATION_IN_PROGRESS", "blocked", `Operation ${operationsState.active.command} must finish or roll back before cleanup`));
      manualActions.push(`Resume or roll back operation ${operationsState.active.command}`);
    }
    const driftInvalidatedCommands = new Set(["install", "upgrade", "rollback", "start", "stop", "restart", "uninstall"]);
    const staleCompletions = Object.keys(operationsState?.completed ?? {}).filter((key) => {
      if (!key.endsWith(manifest.digest)) return true;
      const command = key.slice(0, key.indexOf(":"));
      return installationStateDrift && driftInvalidatedCommands.has(command);
    });
    if (staleCompletions.length > 0) {
      findings.push(finding("OBSOLETE_OPERATION_RECORD", "cleanup", `${staleCompletions.length} inactive operation records can be removed`));
      plan.push(planItem("operations-state", { path: operationsStateFile, staleCompletions }));
    }

    const processRecord = await readJson(path.join(stateDirectory, "run", "dsh.json"));
    const managedDsh = Number.isInteger(processRecord?.pid) && processRecord.pid > 0 && processAlive(processRecord.pid);
    for (const [name, port] of Object.entries(config.services.ports)) {
      const inspected = await inspectPort(port);
      if (inspected.available) continue;
      if (name === "dsh" && managedDsh) {
        findings.push(finding("MANAGED_DSH_RUNNING", "blocked", `WSR-managed DSH is using port ${port}`));
        manualActions.push("Run wsr stop before install, upgrade, or cleanup");
      } else {
        const code = name === "dsh" ? "EXTERNAL_DSH_PORT_OCCUPIED" : "EXTERNAL_SERVICE_PORT_OCCUPIED";
        findings.push(finding(code, "blocked", `Configured ${name} port ${port} is occupied by a process not proven to be WSR-managed`));
        manualActions.push(`Stop or reconfigure the process using port ${port}`);
      }
    }

    const verdict = findings.some(({ severity }) => severity === "blocked")
      ? "BLOCKED"
      : findings.some(({ severity }) => severity === "cleanup")
        ? "CLEANUP_REQUIRED"
        : "READY";
    return {
      verdict,
      findings,
      plan,
      manualActions: [...new Set(manualActions)],
      preserved: { ...PRESERVED },
      config,
      roots,
      operationsState,
    };
  }

  return Object.freeze({
    async diagnose() {
      const { config: _config, roots: _roots, operationsState: _operationsState, ...diagnosis } = await analyze();
      return diagnosis;
    },

    async cleanup({ apply }) {
      const analysis = await analyze();
      const data = {
        verdict: analysis.verdict,
        plan: analysis.plan,
        removed: [],
        manualActions: analysis.manualActions,
        preserved: { ...PRESERVED },
      };
      if (!apply) return { status: "succeeded", changed: false, data };

      const blocked = analysis.findings.filter(({ severity }) => severity === "blocked");
      if (blocked.length > 0) {
        return {
          status: "blocked",
          changed: false,
          diagnostics: blocked.map(({ code, message }) => ({ code, message })),
          data,
        };
      }

      for (const item of analysis.plan.filter(({ kind }) => ["state-path", "operations-state"].includes(kind))) {
        let metadata;
        try { metadata = await lstat(item.path); }
        catch (error) {
          if (error.code === "ENOENT") continue;
          throw error;
        }
        if (metadata.isSymbolicLink()) {
          return {
            status: "blocked",
            changed: false,
            diagnostics: [{ code: "CLEANUP_SYMLINK_REFUSED", message: `Refusing symlinked cleanup target ${item.path}` }],
            data,
          };
        }
      }

      for (const item of analysis.plan.filter(({ kind }) => kind === "dsh-root")) {
        const result = await run("dsh", [
          "plugin", "--profile", analysis.config.installation.dshProfile,
          "remove", "--workspace-root", item.packageName,
        ]);
        if (result.status !== 0) {
          return {
            status: "blocked",
            changed: data.removed.length > 0,
            diagnostics: [{ code: "CLEANUP_DSH_REMOVE_FAILED", message: `Cannot remove obsolete DSH root ${item.packageName}` }],
            data,
          };
        }
        data.removed.push(item);
      }

      for (const item of analysis.plan.filter(({ kind }) => kind === "state-path")) {
        await rm(item.path, { recursive: true, force: true });
        data.removed.push(item);
      }

      for (const item of analysis.plan.filter(({ kind }) => kind === "operations-state")) {
        const state = analysis.operationsState;
        if (state === undefined) continue;
        for (const key of item.staleCompletions) delete state.completed[key];
        await writeJsonAtomic(item.path, state);
        data.removed.push(item);
      }

      return { status: "succeeded", changed: data.removed.length > 0, data };
    },
  });
}
