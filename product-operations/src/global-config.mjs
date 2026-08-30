import path from "node:path";

export const GLOBAL_CONFIG_SCHEMA = "wsr.global-config@1.0.0";

export const DEFAULT_PORTS = Object.freeze({
  dsh: 3080,
  evidence: 4318,
  evolution: 8000,
});

function assertObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`config ${label} must be an object`);
  }
}

function rejectUnknown(value, allowed, label) {
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) throw new Error(`config ${label} contains unknown field ${field}`);
  }
}

export function normalizeGlobalConfig(config) {
  assertObject(config, "document");
  if (config.schemaVersion !== GLOBAL_CONFIG_SCHEMA) {
    throw new Error(`config schemaVersion must be ${GLOBAL_CONFIG_SCHEMA}`);
  }
  rejectUnknown(
    config,
    new Set(["schemaVersion", "installation", "services", "workflowSource", "state"]),
    "document",
  );

  assertObject(config.installation, "installation");
  rejectUnknown(config.installation, new Set(["dshMode", "dshProfile"]), "installation");
  if (!["execution", "studio", "suite"].includes(config.installation.dshMode)) {
    throw new Error("config installation.dshMode must be execution, studio, or suite");
  }
  if (typeof config.installation.dshProfile !== "string" || !/^[a-z][a-z0-9-]*$/u.test(config.installation.dshProfile)) {
    throw new Error("config installation.dshProfile is invalid");
  }

  assertObject(config.workflowSource, "workflowSource");
  rejectUnknown(config.workflowSource, new Set(["kind", "repository"]), "workflowSource");
  if (config.workflowSource.kind !== "github") {
    throw new Error("config workflowSource.kind must be github");
  }
  if (typeof config.workflowSource.repository !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(config.workflowSource.repository)) {
    throw new Error("config workflowSource.repository must be owner/repository");
  }

  const services = config.services ?? {};
  assertObject(services, "services");
  rejectUnknown(services, new Set(["ports"]), "services");
  const configuredPorts = services.ports ?? {};
  assertObject(configuredPorts, "services.ports");
  rejectUnknown(configuredPorts, new Set(Object.keys(DEFAULT_PORTS)), "services.ports");
  const ports = { ...DEFAULT_PORTS, ...configuredPorts };
  for (const [name, port] of Object.entries(ports)) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`config services.ports.${name} must be an integer from 1 to 65535`);
    }
  }

  if (config.state !== undefined) {
    assertObject(config.state, "state");
    rejectUnknown(config.state, new Set(["root"]), "state");
    if (typeof config.state.root !== "string" || !path.isAbsolute(config.state.root)) {
      throw new Error("config state.root must be an absolute path");
    }
  }

  return Object.freeze({
    schemaVersion: GLOBAL_CONFIG_SCHEMA,
    installation: Object.freeze({ ...config.installation }),
    services: Object.freeze({ ports: Object.freeze(ports) }),
    workflowSource: Object.freeze({ ...config.workflowSource }),
    ...(config.state === undefined ? {} : { state: Object.freeze({ ...config.state }) }),
  });
}
