#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function fail(code, detail) {
  throw new Error(`${code}: ${detail}`);
}

async function exactArchive({ packageName, version, archive }) {
  const artifact = await realpath(resolve(archive));
  const manifest = JSON.parse(execFileSync("tar", ["-xOf", artifact, "package/package.json"], { encoding: "utf8" }));
  if (manifest.name !== packageName || manifest.version !== version) {
    fail("LOCAL_PACKAGE_ARCHIVE_IDENTITY", `${manifest.name}@${manifest.version}`);
  }
  return { artifact, spec: `${packageName}@${version}` };
}

async function exactInputs(input) {
  const profile = await realpath(resolve(input.profileRoot));
  return { profile, ...await exactArchive(input) };
}

export async function installLocalPackageCandidate({ nodeModulesRoot, packageName, version, archive }) {
  if (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/u.test(packageName)) {
    fail("LOCAL_PACKAGE_NAME", packageName);
  }
  const modules = await realpath(resolve(nodeModulesRoot));
  const { artifact } = await exactArchive({ packageName, version, archive });
  const destination = resolve(modules, ...packageName.split("/"));
  if (!destination.startsWith(`${modules}/`)) fail("LOCAL_PACKAGE_DESTINATION", destination);
  const temporary = await mkdtemp(resolve(modules, ".wsr-local-package-"));
  try {
    execFileSync("tar", ["-xzf", artifact, "-C", temporary]);
    await mkdir(dirname(destination), { recursive: true });
    await rm(destination, { recursive: true, force: true });
    await cp(resolve(temporary, "package"), destination, { recursive: true });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export async function bindLocalPackageCandidate(input) {
  const { profile, artifact, spec } = await exactInputs(input);
  const policyPath = resolve(profile, "pnpm-workspace.yaml");
  const policy = await readFile(policyPath, "utf8");
  const key = JSON.stringify(spec);
  const value = JSON.stringify(`file:${artifact}`);
  const exactLine = `  ${key}: ${value}`;
  const existing = policy.split("\n").find((line) => line.trimStart().startsWith(`${key}:`));
  if (existing !== undefined && existing !== exactLine) fail("LOCAL_PACKAGE_OVERRIDE_COLLISION", existing.trim());
  if (existing === exactLine) return;
  const next = /^overrides:\s*$/mu.test(policy)
    ? policy.replace(/^overrides:\s*$/mu, (line) => `${line}\n${exactLine}`)
    : `${policy.trimEnd()}\noverrides:\n${exactLine}\n`;
  await writeFile(policyPath, next);
}

export async function verifyLocalPackageCandidate(input) {
  const { profile, artifact } = await exactInputs(input);
  const lock = await readFile(resolve(profile, "pnpm-lock.yaml"), "utf8");
  const registryPath = `registry.npmjs.org/${input.packageName}/`;
  if (lock.includes(registryPath)) fail("LOCAL_PACKAGE_REMOTE_RESOLUTION", registryPath);
  const installed = JSON.parse(await readFile(resolve(profile, "node_modules", input.packageName, "package.json"), "utf8"));
  if (installed.name !== input.packageName || installed.version !== input.version) {
    fail("LOCAL_PACKAGE_INSTALLED_IDENTITY", `${installed.name}@${installed.version}`);
  }
  const temporary = await mkdtemp(resolve(profile, ".wsr-verify-package-"));
  try {
    execFileSync("tar", ["-xzf", artifact, "-C", temporary]);
    const source = resolve(temporary, "package");
    const destination = resolve(profile, "node_modules", input.packageName);
    const verifyTree = async (directory, relative = "") => {
      for (const entry of await readdir(resolve(directory, relative))) {
        const next = join(relative, entry);
        const metadata = await stat(resolve(directory, next));
        if (metadata.isDirectory()) await verifyTree(directory, next);
        else if (!(await readFile(resolve(directory, next))).equals(await readFile(resolve(destination, next)))) {
          fail("LOCAL_PACKAGE_INSTALLED_CONTENT", next);
        }
      }
    };
    await verifyTree(source);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const verify = args[0] === "--verify";
  if (verify) args.shift();
  const install = args[0] === "--install";
  if (install) args.shift();
  if (args.length !== 4) fail("LOCAL_PACKAGE_USAGE", "[--verify] <profile> <name> <version> <archive>");
  const [root, packageName, version, archive] = args;
  if (install) await installLocalPackageCandidate({ nodeModulesRoot: root, packageName, version, archive });
  else {
    const operation = verify ? verifyLocalPackageCandidate : bindLocalPackageCandidate;
    await operation({ profileRoot: root, packageName, version, archive });
  }
  const artifact = await realpath(resolve(archive));
  const sha256 = createHash("sha256").update(await readFile(artifact)).digest("hex");
  process.stdout.write(`${JSON.stringify({ operation: install ? "materialize" : verify ? "verify" : "bind", package: `${packageName}@${version}`, source: artifact, sha256 })}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
