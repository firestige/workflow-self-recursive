#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOCAL_SERVICES = new Set(["migrate", "evidence"]);

export async function bindLocalEvidenceBuild(composePath, evidenceCheckout) {
  const source = await readFile(composePath, "utf8");
  const context = path.resolve(evidenceCheckout);
  const lines = source.split("\n");
  const replaced = new Set();
  let service;

  const output = lines.flatMap((line) => {
    const serviceMatch = /^  ([a-z][a-z0-9_-]*):$/.exec(line);
    if (serviceMatch) {
      service = serviceMatch[1];
      return [line];
    }
    if (!LOCAL_SERVICES.has(service) || !/^    image: /.test(line)) {
      return [line];
    }
    if (replaced.has(service)) {
      throw new Error(`multiple image bindings found for service ${service}`);
    }
    replaced.add(service);
    return [
      "    build:",
      `      context: ${JSON.stringify(context)}`,
      "      dockerfile: deployment/Dockerfile",
    ];
  });

  for (const required of LOCAL_SERVICES) {
    if (!replaced.has(required)) {
      throw new Error(`expected image binding for service ${required}`);
    }
  }
  const outputText = output.join("\n");
  const checksumPath = path.join(path.dirname(composePath), "SHA256SUMS");
  const checksums = await readFile(checksumPath, "utf8");
  const composeChecksumRows = checksums.match(/^[0-9a-f]{64}  compose\.yaml$/gmu) ?? [];
  if (composeChecksumRows.length !== 1) {
    throw new Error("expected one compose.yaml checksum binding");
  }
  const digest = createHash("sha256").update(outputText).digest("hex");
  const updatedChecksums = checksums.replace(
    /^[0-9a-f]{64}  compose\.yaml$/mu,
    `${digest}  compose.yaml`,
  );
  await Promise.all([
    writeFile(composePath, outputText, "utf8"),
    writeFile(checksumPath, updatedChecksums, "utf8"),
  ]);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) {
    throw new Error("usage: bind-local-evidence-build.mjs COMPOSE-FILE EVIDENCE-CHECKOUT");
  }
  await bindLocalEvidenceBuild(process.argv[2], process.argv[3]);
}
