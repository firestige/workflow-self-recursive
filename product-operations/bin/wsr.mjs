#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCompatibilityManifest } from "../src/compatibility-manifest.mjs";
import { createFixtureAdapter } from "../src/fixture-adapter.mjs";
import { createInstallationMaintenance } from "../src/installation-maintenance.mjs";
import { createOperations } from "../src/operations.mjs";
import { resolveConfiguredStateDirectory, resolveProductPaths } from "../src/platform-paths.mjs";
import { createPublishedAdapters } from "../src/published-adapters.mjs";

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function parseArguments(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const name = rest[index];
    const value = rest[index + 1];
    if (!name?.startsWith("--") || value === undefined) {
      throw new Error(`Expected --name value, received ${name ?? "end of input"}`);
    }
    options[name.slice(2)] = value;
  }
  return { command, options };
}

function failure(command, error) {
  return {
    schema: "wsr.operations.result@1.0.0",
    command: command ?? "unknown",
    operationId: "cli-error",
    status: "failed",
    changed: false,
    components: [],
    diagnostics: [{ code: "CLI_INPUT_INVALID", message: error.message }],
  };
}

function booleanOption(options, name, fallback = false) {
  const value = options[name];
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`--${name} must be true or false`);
}

async function activeManifestPath(stateDirectory, packagedManifestsDirectory) {
  let digest;
  try {
    const state = JSON.parse(await readFile(path.join(stateDirectory, "operations-state.json"), "utf8"));
    digest = state.active?.manifestDigest;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (typeof digest !== "string") return undefined;

  const retained = path.join(stateDirectory, "operation-manifests", `${digest.replace(/^sha256:/u, "")}.json`);
  const candidates = [retained];
  try {
    for (const name of await readdir(packagedManifestsDirectory)) {
      if (name.endsWith(".json")) candidates.push(path.join(packagedManifestsDirectory, name));
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  for (const candidate of candidates) {
    try {
      await readFile(candidate);
      if ((await loadCompatibilityManifest(candidate)).digest === digest) return candidate;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`ACTIVE_MANIFEST_UNAVAILABLE: no exact manifest is available for ${digest}`);
}

let exitCode = 0;
let output;
try {
  const { command, options } = parseArguments(process.argv.slice(2));
  const defaults = resolveProductPaths();
  const packageDocument = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  const defaultManifestPath = path.join(packageRoot, "manifests", `product-${packageDocument.version}.json`);
  const fixturePath = options.fixture ? path.resolve(options.fixture) : null;
  const configPath = path.resolve(options.config ?? defaults.configPath);
  let configInput;
  if (command === "setup" && options["config-input"]) {
    configInput = JSON.parse(await readFile(path.resolve(options["config-input"]), "utf8"));
  }
  let configuredStateDirectory = configInput?.state?.root;
  if (configuredStateDirectory === undefined) {
    try {
      configuredStateDirectory = JSON.parse(await readFile(configPath, "utf8"))?.state?.root;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const stateDirectory = path.resolve(resolveConfiguredStateDirectory({
    cliStateDirectory: options["state-dir"],
    configuredStateDirectory,
    defaultStateDirectory: defaults.stateDirectory,
  }));
  const manifestPath = options.manifest
    ? path.resolve(options.manifest)
    : await activeManifestPath(stateDirectory, path.join(packageRoot, "manifests")) ?? defaultManifestPath;
  const manifest = await loadCompatibilityManifest(manifestPath);
  let adapters;
  let maintenance;
  if (fixturePath) {
    const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
    const adapter = createFixtureAdapter(fixture);
    adapters = new Map(manifest.components.map((component) => [component.id, adapter]));
  } else {
    adapters = createPublishedAdapters({ manifest, stateDirectory, configPath });
    maintenance = createInstallationMaintenance({ manifest, stateDirectory, configPath });
  }
  const operations = createOperations({
    manifest,
    adapters,
    stateDirectory,
    configPath,
    maintenance,
  });

  if (configInput !== undefined) {
    await operations.writeConfig(configInput);
  }
  output = await operations.run(command, {
    apply: command === "cleanup" ? booleanOption(options, "apply") : false,
  });
  exitCode = output.status === "succeeded" ? 0 : output.status === "blocked" ? 3 : 2;
} catch (error) {
  output = failure(process.argv[2], error);
  exitCode = 2;
}

process.stdout.write(`${JSON.stringify(output)}\n`);
process.exitCode = exitCode;
