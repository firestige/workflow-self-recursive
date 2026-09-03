#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const digest = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

async function archiveManifest(archive) {
  return JSON.parse(execFileSync("tar", ["-xOf", archive, "package/package.json"], { encoding: "utf8" }));
}

async function rewriteDependencies(archive, dependencies) {
  const temporary = await mkdtemp(resolve(tmpdir(), "wsr-local-dsh-"));
  try {
    execFileSync("tar", ["-xzf", archive, "-C", temporary]);
    const manifestPath = resolve(temporary, "package/package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.dependencies = { ...manifest.dependencies, ...dependencies };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const replacement = `${archive}.local`;
    execFileSync("tar", ["-czf", replacement, "-C", temporary, "package"]);
    await rename(replacement, archive);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export async function prepareLocalDshAcceptance({
  baseManifest, outputManifest, ownerArchive, executionArchive, studioArchive, suiteArchive, providerArchive,
}) {
  const paths = Object.fromEntries(await Promise.all(Object.entries({
    ownerArchive, executionArchive, studioArchive, suiteArchive, providerArchive,
  }).map(async ([key, value]) => [key, await realpath(resolve(value))])));
  const identities = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, value]) => [key, await archiveManifest(value)])));
  const expected = {
    ownerArchive: "wsr-execution", executionArchive: "dsh-wsr-execution",
    studioArchive: "dsh-wsr-studio", suiteArchive: "dsh-wsr", providerArchive: "wsr-ui-core",
  };
  for (const [key, name] of Object.entries(expected)) {
    if (identities[key].name !== name) throw new Error(`LOCAL_DSH_ARCHIVE_IDENTITY:${key}:${identities[key].name}`);
  }
  await rewriteDependencies(paths.studioArchive, {
    "wsr-ui-core": `file:${paths.providerArchive}`,
  });
  await rewriteDependencies(paths.suiteArchive, {
    "dsh-wsr-execution": `file:${paths.executionArchive}`,
    "dsh-wsr-studio": `file:${paths.studioArchive}`,
  });
  const document = JSON.parse(await readFile(resolve(baseManifest), "utf8"));
  const component = document.components?.find(({ id }) => id === "dsh-bundle");
  if (component === undefined) throw new Error("LOCAL_DSH_MANIFEST_COMPONENT_MISSING");
  component.coordinate = "fixture://issue-170/local-dsh-set";
  component.digest = digest(await readFile(paths.suiteArchive));
  component.compatibility.executionOwner.coordinate = paths.ownerArchive;
  component.compatibility.executionOwner.digest = digest(await readFile(paths.ownerArchive));
  component.compatibility.packages = {
    execution: `${identities.executionArchive.name}@${identities.executionArchive.version}`,
    studio: `${identities.studioArchive.name}@${identities.studioArchive.version}`,
    suite: `${identities.suiteArchive.name}@${identities.suiteArchive.version}`,
  };
  component.qualification = {
    packageSources: {
      execution: paths.executionArchive,
      studio: paths.studioArchive,
      suite: paths.suiteArchive,
    },
  };
  await writeFile(resolve(outputManifest), `${JSON.stringify(document, null, 2)}\n`);
  return {
    manifest: await realpath(resolve(outputManifest)),
    packages: Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, value]) => [key, {
      identity: `${(await archiveManifest(value)).name}@${(await archiveManifest(value)).version}`,
      source: value,
      sha256: digest(await readFile(value)),
    }]))),
  };
}

async function main() {
  const [baseManifest, outputManifest, ownerArchive, executionArchive, studioArchive, suiteArchive, providerArchive] = process.argv.slice(2);
  if ([baseManifest, outputManifest, ownerArchive, executionArchive, studioArchive, suiteArchive, providerArchive].some((value) => value === undefined)) {
    throw new Error("usage: prepare-local-dsh-acceptance <base-manifest> <output-manifest> <owner> <execution> <studio> <suite> <provider>");
  }
  process.stdout.write(`${JSON.stringify(await prepareLocalDshAcceptance({
    baseManifest, outputManifest, ownerArchive, executionArchive, studioArchive, suiteArchive, providerArchive,
  }))}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
