#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

const fail = (message) => {
  throw new Error(`ACCEPTANCE_TARGET_INVALID: ${message}`);
};

const scalar = (value, subject, pattern = /^\S+$/u) => {
  if (typeof value !== "string" || !pattern.test(value)) fail(`${subject} is missing or invalid`);
  return value;
};

const digest = (value, subject) => scalar(value, subject, /^sha256:[a-f0-9]{64}$/u);
const version = (value, subject) => scalar(value, subject, /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/u);
const packageName = (value, subject) => scalar(value, subject, /^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/u);
const coordinateFor = (value, subject, identities) => {
  const coordinate = scalar(value, subject);
  for (const identity of identities) {
    if (!coordinate.includes(identity)) fail(`${subject} does not identify ${identity.includes(".") ? `version ${identity}` : identity}`);
  }
  return coordinate;
};

const component = (manifest, id) => {
  const matches = manifest.components.filter((candidate) => candidate?.id === id);
  if (matches.length !== 1) fail(`components.${id} must occur exactly once (found ${matches.length})`);
  return matches[0];
};

const readJson = async (file, subject) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    fail(`${subject} cannot be read as JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export async function resolveAcceptanceTarget(productManifestFile, composeDirectory, diagnosticSelector) {
  const productManifest = path.resolve(productManifestFile);
  const manifest = await readJson(productManifest, "Product manifest");
  if (manifest?.schema !== "wsr.compatibility@1.0.0") fail("Product manifest schema must be wsr.compatibility@1.0.0");
  if (!Array.isArray(manifest.components)) fail("Product manifest components must be an array");

  const productRelease = version(manifest.release, "Product release");
  const dsh = component(manifest, "dsh-bundle");
  const services = component(manifest, "services");
  const workflow = component(manifest, "workflow-source");
  const providers = component(manifest, "providers");
  const execution = dsh.compatibility?.executionOwner;
  if (!execution || typeof execution !== "object") fail("dsh-bundle.compatibility.executionOwner is missing");

  const dshVersion = version(dsh.version, "dsh-bundle.version");
  const executionName = packageName(execution.package, "executionOwner.package");
  const executionVersion = version(execution.version, "executionOwner.version");
  if (execution.release !== executionVersion) fail("executionOwner.release must equal executionOwner.version");
  const servicesVersion = version(services.version, "services.version");
  const workflowName = packageName(workflow.name, "workflow-source.name");
  const workflowVersion = version(workflow.version, "workflow-source.version");
  const providersVersion = version(providers.version, "providers.version");

  for (const [subject, item] of [["dsh-bundle", dsh], ["services", services], ["workflow-source", workflow], ["providers", providers]]) {
    digest(item.digest, `${subject}.digest`);
  }
  coordinateFor(dsh.coordinate, "dsh-bundle.coordinate", [dshVersion]);
  coordinateFor(services.coordinate, "services.coordinate", [servicesVersion]);
  coordinateFor(workflow.coordinate, "workflow-source.coordinate", [workflowName, workflowVersion]);
  coordinateFor(providers.coordinate, "providers.coordinate", [providersVersion]);
  coordinateFor(execution.coordinate, "executionOwner.coordinate", [executionName, executionVersion]);
  digest(execution.digest, "executionOwner.digest");
  for (const name of ["execution", "studio", "suite"]) {
    scalar(dsh.compatibility?.packages?.[name], `dsh-bundle.compatibility.packages.${name}`, /^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*@[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/u);
  }

  const composeManifest = path.resolve(composeDirectory, `${servicesVersion}.json`);
  const compose = await readJson(composeManifest, "Compose release manifest");
  if (compose?.schemaVersion !== "wsr.compose-release@1.0.0") fail("Compose release schema must be wsr.compose-release@1.0.0");
  if (compose.version !== servicesVersion) fail(`Compose release version ${compose.version ?? "(missing)"} does not match services ${servicesVersion}`);

  const productSelector = `${workflowName}@${workflowVersion}`;
  const selector = diagnosticSelector === undefined ? productSelector : scalar(diagnosticSelector, "diagnostic selector", /^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*@[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/u);
  return {
    productManifest,
    productRelease,
    dsh: { version: dshVersion, coordinate: dsh.coordinate, digest: dsh.digest },
    execution: { name: executionName, version: executionVersion, coordinate: execution.coordinate, digest: execution.digest },
    services: { version: servicesVersion, coordinate: services.coordinate, digest: services.digest, composeManifest },
    workflow: { name: workflowName, version: workflowVersion, coordinate: workflow.coordinate, digest: workflow.digest },
    providers: { version: providersVersion, coordinate: providers.coordinate, digest: providers.digest },
    workload: { mode: diagnosticSelector === undefined ? "product-composition" : "diagnostic", selector },
  };
}

async function main() {
  const [productManifest, composeDirectory, diagnosticSelector] = process.argv.slice(2);
  if (!productManifest || !composeDirectory || process.argv.length > 5) {
    fail("usage: resolve-current-branch-target PRODUCT_MANIFEST COMPOSE_DIRECTORY [DIAGNOSTIC_SELECTOR]");
  }
  const target = await resolveAcceptanceTarget(productManifest, composeDirectory, diagnosticSelector);
  process.stdout.write(`${JSON.stringify(target)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
});
