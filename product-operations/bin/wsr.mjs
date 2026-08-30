#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCompatibilityManifest } from "../src/compatibility-manifest.mjs";
import { createFixtureAdapter } from "../src/fixture-adapter.mjs";
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

let exitCode = 0;
let output;
try {
  const { command, options } = parseArguments(process.argv.slice(2));
  const defaults = resolveProductPaths();
  const manifestPath = path.resolve(options.manifest ?? path.join(packageRoot, "manifests", "product-0.3.0.json"));
  const fixturePath = options.fixture ? path.resolve(options.fixture) : null;
  const manifest = await loadCompatibilityManifest(manifestPath);
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
  let adapters;
  if (fixturePath) {
    const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
    const adapter = createFixtureAdapter(fixture);
    adapters = new Map(manifest.components.map((component) => [component.id, adapter]));
  } else {
    adapters = createPublishedAdapters({ manifest, stateDirectory, configPath });
  }
  const operations = createOperations({
    manifest,
    adapters,
    stateDirectory,
    configPath,
  });

  if (configInput !== undefined) {
    await operations.writeConfig(configInput);
  }
  output = await operations.run(command);
  exitCode = output.status === "succeeded" ? 0 : output.status === "blocked" ? 3 : 2;
} catch (error) {
  output = failure(process.argv[2], error);
  exitCode = 2;
}

process.stdout.write(`${JSON.stringify(output)}\n`);
process.exitCode = exitCode;
