import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const helperUrl = pathToFileURL(
  path.join(import.meta.dirname, "bind-local-evidence-build.mjs"),
).href;

test("binds migrate and evidence to the local Evidence checkout", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-local-evidence-"));
  context.after(() => rm(directory, { recursive: true }));
  const composePath = path.join(directory, "compose.yaml");
  const evidencePath = path.join(directory, "evidence checkout");
  await writeFile(
    composePath,
    `services:
  database:
    image: postgres:published
  migrate:
    image: evidence:published
    command: migrate
  evidence:
    image: evidence:published
    command: serve
  evolution:
    image: evolution:published
`,
  );
  const checksumsPath = path.join(directory, "SHA256SUMS");
  await writeFile(checksumsPath, `${"0".repeat(64)}  compose.yaml\n${"1".repeat(64)}  release.json\n`);

  const { bindLocalEvidenceBuild } = await import(helperUrl);
  await bindLocalEvidenceBuild(composePath, evidencePath);

  const actual = await readFile(composePath, "utf8");
  const buildBlock = `    build:\n      context: ${JSON.stringify(evidencePath)}\n      dockerfile: deployment/Dockerfile`;
  assert.equal(actual.match(new RegExp("build:", "g"))?.length, 2);
  assert.equal(actual.match(new RegExp("image: evidence:published", "g")), null);
  assert.match(actual, new RegExp(buildBlock.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(actual, /image: postgres:published/);
  assert.match(actual, /image: evolution:published/);
  const digest = createHash("sha256").update(actual).digest("hex");
  assert.equal(
    await readFile(checksumsPath, "utf8"),
    `${digest}  compose.yaml\n${"1".repeat(64)}  release.json\n`,
  );
});

test("fails closed when the published bundle shape is unexpected", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wsr-local-evidence-"));
  context.after(() => rm(directory, { recursive: true }));
  const composePath = path.join(directory, "compose.yaml");
  await writeFile(composePath, "services:\n  evidence:\n    build: .\n");

  const { bindLocalEvidenceBuild } = await import(helperUrl);
  await assert.rejects(
    bindLocalEvidenceBuild(composePath, path.join(directory, "evidence")),
    /expected image binding/,
  );
});
