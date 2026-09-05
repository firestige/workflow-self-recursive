#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REQUIRED_COMPONENTS = [
  "system-contracts", "evidence-system", "evolution-system", "execution-system",
  "workflow-package", "wsr-dsh", "wsr-ui",
];
const REQUIRED_ARCHIVES = {
  executionOwner: "wsr-execution",
  dshExecution: "dsh-wsr-execution",
  dshStudio: "dsh-wsr-studio",
  dshSuite: "dsh-wsr",
  uiCore: "wsr-ui-core",
};
const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const COMMIT = /^[a-f0-9]{40}$/u;

const hash = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

export async function resolveDevArtifactSet(file) {
  const manifest = await realpath(path.resolve(file));
  const base = path.dirname(manifest);
  const document = JSON.parse(await readFile(manifest, "utf8"));
  const findings = [];
  if (document.schemaVersion !== "wsr.dev-artifact-set@1.0.0") findings.push("schemaVersion");
  if (typeof document.identity !== "string" || !/^[a-z0-9][a-z0-9-]+$/u.test(document.identity)) findings.push("identity");

  const components = Array.isArray(document.components) ? document.components : [];
  for (const id of REQUIRED_COMPONENTS) {
    const matches = components.filter((entry) => entry?.id === id);
    if (matches.length !== 1) {
      findings.push(`components.${id}`);
      continue;
    }
    const entry = matches[0];
    if (!COMMIT.test(entry.commit ?? "")) findings.push(`components.${id}.commit`);
    if (typeof entry.version !== "string" || entry.version.length === 0) findings.push(`components.${id}.version`);
    if (entry.coordinate !== `gitlink://${id}@${entry.commit}`) findings.push(`components.${id}.coordinate`);
    if (!SHA256.test(entry.digest ?? "")) findings.push(`components.${id}.digest`);
  }
  if (components.length !== REQUIRED_COMPONENTS.length) findings.push("components.count");

  const archives = {};
  for (const [key, expectedName] of Object.entries(REQUIRED_ARCHIVES)) {
    const entry = document.archives?.[key];
    if (!entry || typeof entry.path !== "string") {
      findings.push(`archives.${key}`);
      continue;
    }
    try {
      const resolved = await realpath(path.resolve(base, entry.path));
      const bytes = await readFile(resolved);
      if (hash(bytes) !== entry.sha256) findings.push(`${key}.sha256`);
      const packageDocument = JSON.parse(execFileSync("tar", ["-xOf", resolved, "package/package.json"], { encoding: "utf8" }));
      if (entry.name !== expectedName || packageDocument.name !== expectedName) findings.push(`${key}.name`);
      if (packageDocument.version !== entry.version) findings.push(`${key}.version`);
      archives[key] = { path: resolved, sha256: entry.sha256, identity: `${packageDocument.name}@${packageDocument.version}` };
    } catch (error) {
      findings.push(`${key}.archive:${error instanceof Error ? error.message : String(error)}`);
    }
  }

  let productManifest;
  let workflowDirectory;
  try { productManifest = await realpath(path.resolve(base, document.productManifest)); }
  catch { findings.push("productManifest"); }
  try {
    workflowDirectory = await realpath(path.resolve(base, document.workflowAssets?.directory));
    const metadata = await realpath(path.join(workflowDirectory, "release-metadata.json"));
    if (hash(await readFile(metadata)) !== document.workflowAssets?.metadataSha256) findings.push("workflowAssets.metadataSha256");
  } catch { findings.push("workflowAssets.directory"); }
  if (typeof document.workflowAssets?.selector !== "string" || !document.workflowAssets.selector.includes("@")) findings.push("workflowAssets.selector");

  if (findings.length > 0) throw new Error(`DEV_ARTIFACT_SET_INVALID: ${findings.join(", ")}`);
  return {
    schemaVersion: document.schemaVersion,
    identity: document.identity,
    manifest,
    productManifest,
    components,
    archives,
    workflowAssets: { directory: workflowDirectory, selector: document.workflowAssets.selector },
  };
}

async function main() {
  if (process.argv.length !== 3) throw new Error("usage: dev-artifact-set.mjs DEV_ARTIFACT_SET");
  process.stdout.write(`${JSON.stringify(await resolveDevArtifactSet(process.argv[2]))}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
