#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const criticalFiles = Object.freeze([
  "package.json",
  "dist/bootstrap/interaction-broker.js",
  "dist/bootstrap/production.js",
  "dist/intake/presentation.js",
  "dist/providers/copilot/index.js",
  "dist/providers/codex/index.js",
]);

export async function verifyLocalCoreInstall(profileDirectory, archive) {
  if (!path.isAbsolute(profileDirectory) || !path.isAbsolute(archive)) {
    throw new TypeError("LOCAL_CORE_INSTALL_PATH_NOT_ABSOLUTE");
  }
  const installedRoot = path.join(profileDirectory, "node_modules", "wsr-execution");
  for (const relative of criticalFiles) {
    const archived = execFileSync("tar", ["-xOf", archive, `package/${relative}`]);
    const installed = await readFile(path.join(installedRoot, relative));
    if (!archived.equals(installed)) throw new TypeError(`LOCAL_CORE_INSTALL_MISMATCH:${relative}`);
  }
  return Object.freeze({ package: "wsr-execution", source: archive, verifiedFiles: criticalFiles.length });
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [profileDirectory, archive] = process.argv.slice(2);
  if (profileDirectory === undefined || archive === undefined) {
    throw new TypeError("usage: verify-local-core-install <profile-directory> <archive>");
  }
  process.stdout.write(`${JSON.stringify(await verifyLocalCoreInstall(path.resolve(profileDirectory), path.resolve(archive)))}\n`);
}
