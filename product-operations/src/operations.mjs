import { createHash } from "node:crypto";
import { mkdir, readFile, rename, chmod, writeFile } from "node:fs/promises";
import path from "node:path";

import { normalizeGlobalConfig } from "./global-config.mjs";

const RESULT_SCHEMA = "wsr.operations.result@1.0.0";
const COMMANDS = new Set([
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
  "doctor",
  "cleanup",
]);
const READ_COMMANDS = new Set(["config", "status", "health", "logs"]);
const ORDER_REVERSED = new Set(["stop", "rollback", "uninstall"]);
const INVALIDATED_COMPLETIONS = Object.freeze({
  install: ["uninstall"],
  uninstall: ["install", "start", "stop", "restart", "upgrade", "rollback"],
  start: ["stop"],
  stop: ["start", "restart"],
  restart: ["stop"],
  upgrade: ["rollback"],
  rollback: ["upgrade"],
});

function operationId(command, manifestDigest) {
  return createHash("sha256").update(`${command}\0${manifestDigest}`).digest("hex").slice(0, 24);
}

function envelope(command, operation, status, options = {}) {
  return {
    schema: RESULT_SCHEMA,
    command,
    operationId: operation,
    status,
    changed: options.changed ?? false,
    components: options.components ?? [],
    diagnostics: options.diagnostics ?? [],
    ...(options.resume ? { resume: options.resume } : {}),
    ...(options.data ? { data: options.data } : {}),
  };
}

async function readState(statePath) {
  try {
    return JSON.parse(await readFile(statePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return { schema: "wsr.operations.state@1.0.0", completed: {}, active: null };
    }
    throw error;
  }
}

async function writeJsonAtomic(target, value, mode = 0o600) {
  await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  const temporary = `${target}.new`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode });
  await chmod(temporary, mode);
  await rename(temporary, target);
}

const READY_DIAGNOSIS = Object.freeze({
  verdict: "READY",
  findings: [],
  plan: [],
  manualActions: [],
  preserved: Object.freeze({
    config: true,
    durableData: true,
    evidence: true,
    credentials: true,
    userPatches: true,
  }),
});

export function createOperations({ manifest, adapters, stateDirectory, configPath, maintenance }) {
  const statePath = path.join(stateDirectory, "operations-state.json");
  const installationMaintenance = maintenance ?? Object.freeze({
    async diagnose() { return READY_DIAGNOSIS; },
    async cleanup() {
      return {
        status: "succeeded",
        changed: false,
        data: { ...READY_DIAGNOSIS, removed: [] },
      };
    },
  });

  async function retainAppliedManifest() {
    const releaseName = encodeURIComponent(manifest.release);
    const relativeManifestPath = path.posix.join("releases", releaseName, "compatibility.json");
    const { digest: _digest, ...document } = manifest;
    await writeJsonAtomic(path.join(stateDirectory, relativeManifestPath), document);
    await writeJsonAtomic(path.join(stateDirectory, "active-release.json"), {
      schemaVersion: "wsr.active-release@1.0.0",
      release: manifest.release,
      manifestDigest: manifest.digest,
      manifest: relativeManifestPath,
    });
  }

  async function retainOperationManifest() {
    const digestName = manifest.digest.replace(/^sha256:/u, "");
    const { digest: _digest, ...document } = manifest;
    await writeJsonAtomic(path.join(stateDirectory, "operation-manifests", `${digestName}.json`), document);
  }

  async function preflight(command, id) {
    const components = [];
    const diagnostics = [];
    for (const component of manifest.components) {
      const adapter = adapters.get(component.id);
      if (!adapter) {
        diagnostics.push({
          code: "ADAPTER_MISSING",
          component: component.id,
          message: `No adapter owns ${component.id}`,
        });
        continue;
      }
      const result = await adapter.preflight(component, { command, manifest });
      components.push({ id: component.id, layer: component.layer, status: result.status, phase: "preflight" });
      if (result.status !== "succeeded") {
        diagnostics.push({
          code: result.code ?? "PREFLIGHT_FAILED",
          component: component.id,
          message: result.message ?? `Preflight failed for ${component.id}`,
        });
      }
    }
    return diagnostics.length > 0
      ? envelope(command, id, "blocked", { components, diagnostics })
      : envelope(command, id, "succeeded", { components });
  }

  async function inspect(command, id) {
    if (command === "config") {
      return envelope(command, id, "succeeded", {
        data: { owner: "product.operations", path: configPath, editable: true },
      });
    }
    const components = [];
    const diagnostics = [];
    for (const component of manifest.components) {
      const adapter = adapters.get(component.id);
      if (!adapter) {
        components.push({ id: component.id, layer: component.layer, status: "unavailable" });
        if (command === "health") diagnostics.push({
          code: "ADAPTER_MISSING", component: component.id, message: `No adapter owns ${component.id}`,
        });
        continue;
      }
      const result = await adapter.inspect(command, component, { manifest });
      components.push({
        id: component.id,
        layer: component.layer,
        status: result.status,
        phase: "inspect",
        data: result.data,
      });
      if (command === "health" && result.status !== "succeeded") diagnostics.push({
        code: result.code ?? "COMPONENT_UNHEALTHY",
        component: component.id,
        message: result.message ?? `${component.id} is not healthy`,
      });
    }
    return envelope(command, id, diagnostics.length === 0 ? "succeeded" : "blocked", { components, diagnostics });
  }

  async function diagnose(command, id) {
    const checked = await preflight(command, id);
    if (checked.status !== "succeeded") {
      return envelope(command, id, "blocked", {
        components: checked.components,
        diagnostics: checked.diagnostics,
        data: { ...READY_DIAGNOSIS, verdict: "BLOCKED" },
      });
    }
    const diagnosis = await installationMaintenance.diagnose({ command, manifest });
    const blocking = diagnosis.findings.filter(({ severity }) => severity !== "warning");
    return envelope(command, id, diagnosis.verdict === "READY" ? "succeeded" : "blocked", {
      components: checked.components,
      diagnostics: blocking.map(({ code, message }) => ({ code, message })),
      data: diagnosis,
    });
  }

  async function cleanup(id, options) {
    const result = await installationMaintenance.cleanup({
      apply: options.apply === true,
      manifest,
    });
    return envelope("cleanup", id, result.status, {
      changed: result.changed,
      diagnostics: result.diagnostics ?? [],
      data: result.data,
    });
  }

  async function mutate(command, id) {
    const state = await readState(statePath);
    if (state.active && state.active.manifestDigest !== manifest.digest) {
      return envelope(command, id, "blocked", {
        diagnostics: [{
          code: "INCOMPATIBLE_RESUME",
          message: "An interrupted operation exists; rollback or resume the exact manifest before changing compatibility coordinates.",
        }],
      });
    }

    const resuming = state.active?.command === command;
    if (state.active && !resuming && command !== "rollback") {
      return envelope(command, id, "blocked", {
        diagnostics: [{
          code: "OPERATION_IN_PROGRESS",
          message: `Resume or rollback interrupted ${state.active.command} before ${command}.`,
        }],
      });
    }

    const key = `${command}:${manifest.digest}`;
    const readiness = command === "install"
      ? resuming ? await preflight(command, id) : await diagnose(command, id)
      : command === "upgrade" ? await preflight(command, id) : undefined;
    if (readiness !== undefined && readiness.status !== "succeeded") return readiness;
    if (state.completed[key]) {
      if (["install", "upgrade", "rollback"].includes(command)) await retainAppliedManifest();
      const data = command === "uninstall"
        ? { preserved: { config: true, durableData: true }, configPath }
        : undefined;
      return envelope(command, id, "succeeded", { changed: false, data });
    }

    const checked = readiness ?? await preflight(command, id);
    if (checked.status !== "succeeded") return checked;

    let active;
    let ordered;
    if (command === "rollback" && state.active && state.active.command !== "rollback") {
      const interrupted = state.active;
      const componentById = new Map(manifest.components.map((component) => [component.id, component]));
      const targetComponents = [...interrupted.completedComponents].reverse();
      active = {
        operationId: id,
        command,
        manifestDigest: manifest.digest,
        completedComponents: [],
        currentComponent: null,
        abortComponent: interrupted.currentComponent ?? null,
        interruptedCommand: interrupted.command,
        targetComponents,
      };
      ordered = targetComponents.map((componentId) => componentById.get(componentId));
    } else {
      active = state.active ?? {
        operationId: id,
        command,
        manifestDigest: manifest.digest,
        completedComponents: [],
        currentComponent: null,
      };
      if (active.command !== command) {
        return envelope(command, id, "blocked", {
          diagnostics: [{
            code: "OPERATION_IN_PROGRESS",
            message: `Resume or rollback interrupted ${active.command} before ${command}.`,
          }],
        });
      }
      if (active.targetComponents) {
        const componentById = new Map(manifest.components.map((component) => [component.id, component]));
        ordered = active.targetComponents.map((componentId) => componentById.get(componentId));
      } else {
        ordered = ORDER_REVERSED.has(command) ? [...manifest.components].reverse() : manifest.components;
      }
    }
    state.active = active;
    await retainOperationManifest();
    await writeJsonAtomic(statePath, state);

    const components = [];
    if (command === "rollback" && active.abortComponent !== null && active.abortComponent !== undefined) {
      const component = manifest.components.find(({ id: componentId }) => componentId === active.abortComponent);
      const adapter = component === undefined ? undefined : adapters.get(component.id);
      if (component === undefined || typeof adapter?.abort !== "function") {
        return envelope(command, id, "blocked", {
          changed: active.completedComponents.length > 0,
          components,
          diagnostics: [{
            code: "ADAPTER_ABORT_MISSING",
            component: active.abortComponent,
            message: `Atomic component ${active.abortComponent} cannot abort its interrupted operation`,
          }],
        });
      }
      const aborted = await adapter.abort(active.interruptedCommand, component, { manifest });
      if (aborted.status !== "succeeded") {
        return envelope(command, id, "blocked", {
          changed: active.completedComponents.length > 0,
          components,
          diagnostics: [{
            code: aborted.code ?? "ADAPTER_ABORT_BLOCKED",
            component: component.id,
            message: aborted.message ?? `Atomic component ${component.id} could not abort its interrupted operation`,
          }],
        });
      }
      components.push({ id: component.id, layer: component.layer, status: "succeeded", phase: "abort" });
      active.abortComponent = null;
      await writeJsonAtomic(statePath, state);
    }
    for (const component of ordered) {
      if (active.completedComponents.includes(component.id)) {
        components.push({ id: component.id, layer: component.layer, status: "resumed", phase: "resume" });
        continue;
      }
      active.currentComponent = component.id;
      await writeJsonAtomic(statePath, state);
      const result = await adapters.get(component.id).apply(command, component, { manifest });
      if (result.status !== "succeeded") {
        await writeJsonAtomic(statePath, state);
        components.push({ id: component.id, layer: component.layer, status: result.status, phase: command === "rollback" ? "rollback" : "apply" });
        return envelope(command, id, "blocked", {
          changed: active.completedComponents.length > 0,
          components,
          diagnostics: [{
            code: result.code ?? "ADAPTER_BLOCKED",
            component: component.id,
            message: result.message ?? `Adapter blocked at ${component.id}`,
          }],
          resume: { operationId: id, manifestDigest: manifest.digest, nextComponent: component.id },
        });
      }
      active.completedComponents.push(component.id);
      active.currentComponent = null;
      components.push({ id: component.id, layer: component.layer, status: "succeeded", phase: command === "rollback" ? "rollback" : "apply" });
      await writeJsonAtomic(statePath, state);
    }

    for (const invalidated of INVALIDATED_COMPLETIONS[command] ?? []) {
      delete state.completed[`${invalidated}:${manifest.digest}`];
    }
    state.completed[key] = { operationId: id, completedAt: new Date().toISOString() };
    state.active = null;
    await writeJsonAtomic(statePath, state);
    if (["install", "upgrade", "rollback"].includes(command)) await retainAppliedManifest();
    const data = command === "uninstall"
      ? { preserved: { config: true, durableData: true }, configPath }
      : undefined;
    return envelope(command, id, "succeeded", { changed: true, components, data });
  }

  return Object.freeze({
    async run(command, options = {}) {
      if (!COMMANDS.has(command)) {
        return envelope(command, "invalid", "failed", {
          diagnostics: [{ code: "UNKNOWN_COMMAND", message: `Unknown command: ${command}` }],
        });
      }
      const id = operationId(command, manifest.digest);
      if (command === "preflight") return preflight(command, id);
      if (command === "doctor") return diagnose(command, id);
      if (command === "cleanup") return cleanup(id, options);
      if (READ_COMMANDS.has(command)) return inspect(command, id);
      return mutate(command, id);
    },

    async writeConfig(config) {
      normalizeGlobalConfig(config);
      let changed = true;
      try {
        changed = (await readFile(configPath, "utf8")).trim() !== JSON.stringify(config, null, 2);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      await mkdir(stateDirectory, { recursive: true, mode: 0o700 });
      if (changed) await writeJsonAtomic(configPath, config);
      else await chmod(configPath, 0o600);
      return envelope("setup", operationId("setup", manifest.digest), "succeeded", {
        changed,
        data: { owner: "product.operations", path: configPath },
      });
    },
  });
}
