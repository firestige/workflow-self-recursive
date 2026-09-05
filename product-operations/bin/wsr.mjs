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
import { readVersionContext } from "../src/version-facts.mjs";

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const COMMANDS = new Set([
  "setup", "doctor", "cleanup", "install", "preflight", "config", "status", "health", "logs",
  "start", "stop", "restart", "upgrade", "rollback", "uninstall", "version",
]);
const OPTIONS = new Set(["fixture", "config", "state-dir", "manifest", "config-input", "apply"]);

const HELP = `Usage: wsr <command> [options]

Commands:
  help        Show this help without reading installation state
  version     Print structured CLI, applied, target, and active-operation versions
  setup       Write the private Product configuration
  doctor      Diagnose whether a new installation is ready
  cleanup     Preview or apply safe cleanup
  install     Install the target Product
  preflight   Check all component prerequisites
  config      Show configuration ownership
  status      Inspect components and summarize Product versions
  health      Check component health
  logs        Inspect component logs
  start       Start the Product
  stop        Stop the Product
  restart     Restart the Product
  upgrade     Upgrade to the target Product
  rollback    Roll back the active Product operation
  uninstall   Remove managed installation state while preserving user data

Options:
  --config <path>        Override the global config path
  --state-dir <path>     Override the Product state directory
  --manifest <path>      Override the target manifest (development/qualification)
  --fixture <path>       Use the explicit test fixture adapter
  --config-input <path>  Configuration input for setup
  --apply <true|false>   Apply cleanup (cleanup only)

Shortcuts:
  wsr --help       Show this help
  wsr --version    Print the CLI package version

Every command except help and --version writes one wsr.operations.result@1.0.0 JSON object.
Exit codes: 0 succeeded; 2 failed or invalid input; 3 blocked and recoverable.
`;

function parseArguments(argv) {
  const [command, ...rest] = argv;
  if (!COMMANDS.has(command)) throw new Error(`Unknown command: ${command ?? "none"}. Run 'wsr help' for usage.`);
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const name = rest[index];
    const value = rest[index + 1];
    if (!name?.startsWith("--") || value === undefined) {
      throw new Error(`Expected --name value, received ${name ?? "end of input"}. Run 'wsr help' for usage.`);
    }
    const option = name.slice(2);
    if (!OPTIONS.has(option)) throw new Error(`Unknown option: ${name}. Run 'wsr help' for usage.`);
    options[option] = value;
  }
  if (options.apply !== undefined && command !== "cleanup") {
    throw new Error(`--apply is valid only for cleanup. Run 'wsr help' for usage.`);
  }
  if (options["config-input"] !== undefined && command !== "setup") {
    throw new Error(`--config-input is valid only for setup. Run 'wsr help' for usage.`);
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
    diagnostics: [{ code: error.code ?? "CLI_INPUT_INVALID", message: error.message }],
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
  const rawArguments = process.argv.slice(2);
  if (rawArguments[0] === "help" || rawArguments[0] === "--help") {
    process.stdout.write(HELP);
    process.exit(0);
  }
  const packageDocument = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  if (rawArguments[0] === "--version") {
    process.stdout.write(`${packageDocument.version}\n`);
    process.exit(0);
  }
  const { command, options } = parseArguments(rawArguments);
  const defaults = resolveProductPaths();
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
  const targetManifestPath = options.manifest ? path.resolve(options.manifest) : defaultManifestPath;
  const targetManifest = await loadCompatibilityManifest(targetManifestPath);
  let versionFacts;
  let selectedActiveManifestPath;
  if (command === "version" || command === "status") {
    ({ facts: versionFacts, activeManifestPath: selectedActiveManifestPath } = await readVersionContext({
      cliVersion: packageDocument.version,
      targetManifest,
      targetManifestPath,
      stateDirectory,
      packagedManifestsDirectory: path.join(packageRoot, "manifests"),
    }));
  }
  const manifestPath = selectedActiveManifestPath
    ?? (options.manifest ? targetManifestPath : await activeManifestPath(stateDirectory, path.join(packageRoot, "manifests")))
    ?? defaultManifestPath;
  const manifest = await loadCompatibilityManifest(manifestPath);
  if (command === "version") {
    const operations = createOperations({
      manifest, adapters: new Map(), stateDirectory, configPath, versionFacts,
    });
    output = await operations.run(command);
    exitCode = 0;
    process.stdout.write(`${JSON.stringify(output)}\n`);
    process.exit(0);
  }
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
    versionFacts,
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
