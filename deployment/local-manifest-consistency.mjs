#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export class LocalManifestConsistencyError extends Error {
  constructor(findings) {
    super(findings.map(({ subject, expected, actual }) => `${subject}: manifest=${actual ?? "(missing)"}, artifact=${expected ?? "(missing)"}`).join("\n"));
    this.name = "LocalManifestConsistencyError";
    this.findings = findings;
  }
}

export function assertLocalManifestConsistency(manifest, artifacts) {
  const findings = [];
  const components = Array.isArray(manifest?.components) ? manifest.components : [];
  const component = (id) => {
    const matches = components.filter((value) => value?.id === id);
    if (matches.length !== 1) {
      findings.push({
        subject: `components.${id}`,
        actual: matches.length === 0 ? "(missing)" : `${matches.length} entries`,
        expected: "exactly one entry",
      });
      return {};
    }
    return matches[0];
  };
  const equal = (subject, actual, expected) => {
    if (actual !== expected) findings.push({ subject, actual, expected });
  };

  const dsh = component("dsh-bundle");
  const services = component("services");
  const workflow = component("workflow-source");
  const providers = component("providers");
  equal("dsh-bundle.version", dsh.version, artifacts?.dshRelease?.version);
  equal("dsh-bundle.compatibility.executionOwner.package", dsh.compatibility?.executionOwner?.package, artifacts?.executionOwner?.name);
  equal("dsh-bundle.compatibility.executionOwner.version", dsh.compatibility?.executionOwner?.version, artifacts?.executionOwner?.version);
  equal("dsh-bundle.compatibility.executionOwner.release", dsh.compatibility?.executionOwner?.release, artifacts?.executionOwner?.version);
  for (const key of ["execution", "studio", "suite"]) {
    const identity = artifacts?.dshPackages?.[key];
    equal(`dsh-bundle.compatibility.packages.${key}`, dsh.compatibility?.packages?.[key], identity && `${identity.name}@${identity.version}`);
  }
  equal("services.version", services.version, artifacts?.services?.version);
  equal("workflow-source.name", workflow.name, artifacts?.workflowSource?.name);
  equal("workflow-source.version", workflow.version, artifacts?.workflowSource?.version);
  equal("providers.version", providers.version, artifacts?.providers?.version);

  if (findings.length > 0) throw new LocalManifestConsistencyError(findings);
}

const readJson = async (file) => JSON.parse(await readFile(path.resolve(file), "utf8"));
const archivePackage = (file) => JSON.parse(execFileSync("tar", ["-xOf", path.resolve(file), "package/package.json"], { encoding: "utf8" }));

async function main(args) {
  if (args.length !== 8) {
    throw new Error(
      "usage: local-manifest-consistency PRODUCT_MANIFEST DSH_RELEASE_PACKAGE EXECUTION_ARCHIVE DSH_EXECUTION_ARCHIVE DSH_STUDIO_ARCHIVE DSH_SUITE_ARCHIVE SERVICES_RELEASE_MANIFEST WORKFLOW_PACKAGE_MANIFEST",
    );
  }
  const [
    productManifest, dshReleasePackage, executionArchive, dshExecutionArchive,
    dshStudioArchive, dshSuiteArchive, servicesReleaseManifest, workflowPackageManifest,
  ] = args;
  const [manifest, dshRelease, services, workflowDocument] = await Promise.all([
    readJson(productManifest), readJson(dshReleasePackage), readJson(servicesReleaseManifest), readJson(workflowPackageManifest),
  ]);
  const executionOwner = archivePackage(executionArchive);
  const artifacts = {
    dshRelease,
    executionOwner,
    dshPackages: {
      execution: archivePackage(dshExecutionArchive),
      studio: archivePackage(dshStudioArchive),
      suite: archivePackage(dshSuiteArchive),
    },
    services: { name: "wsr-services", version: services.version },
    workflowSource: workflowDocument.package,
    providers: executionOwner,
  };
  assertLocalManifestConsistency(manifest, artifacts);
  process.stdout.write("LOCAL_MANIFEST_CONSISTENCY: PASS\n");
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    if (error instanceof LocalManifestConsistencyError) {
      for (const finding of error.findings) {
        process.stderr.write([
          "LOCAL_MANIFEST_CONSISTENCY: BLOCKED",
          `subject: ${finding.subject}`,
          `evidence: manifest=${finding.actual ?? "(missing)"}; local artifact=${finding.expected ?? "(missing)"}`,
          "verdict: manifest version is not present in the frozen local artifacts",
          "supportedFixes: select a matching manifest or rebuild the intended local artifact set",
          "",
        ].join("\n"));
      }
      process.exitCode = 1;
      return;
    }
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
