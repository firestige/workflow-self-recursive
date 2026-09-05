import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const CHECKER = path.resolve(import.meta.dirname, "check-release-ecosystem.mjs");

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-release-ecosystem-"));
  for (const repo of [".", "component"]) {
    const base = path.join(root, repo);
    await mkdir(path.join(base, ".github", "workflows"), { recursive: true });
    await writeFile(path.join(base, ".github", "workflows", "release-candidate.yml"), `on:\n  push:\n    branches: [release/next]\njobs: {}\n`);
    await writeFile(path.join(base, ".github", "workflows", "release-promote.yml"), `on:\n  workflow_dispatch:\njobs: {}\n`);
  }
  const config = {
    schemaVersion: "wsr.release-topology@1.0.0",
    repositories: [
      { path: ".", candidate: ".github/workflows/release-candidate.yml", promotions: [".github/workflows/release-promote.yml"] },
      { path: "component", candidate: ".github/workflows/release-candidate.yml", promotions: [".github/workflows/release-promote.yml"] },
    ],
  };
  await writeFile(path.join(root, "topology.json"), JSON.stringify(config));
  return root;
}

async function run(root) {
  try {
    const result = await execFileAsync(process.execPath, [CHECKER, path.join(root, "topology.json")], { cwd: root });
    return { status: 0, ...result };
  } catch (error) {
    return { status: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

test("configured release topology accepts only automatic candidates and manual promotions", async () => {
  assert.equal((await run(await fixture())).status, 0);
});

test("configured release topology rejects every authority regression", async (t) => {
  const cases = [
    ["candidate dispatch", ".github/workflows/release-candidate.yml", "  push:\n", "  workflow_dispatch:\n  push:\n"],
    ["callable promotion", ".github/workflows/release-promote.yml", "  workflow_dispatch:\n", "  workflow_dispatch:\n  workflow_call:\n"],
    ["Node 20 action", ".github/workflows/release-candidate.yml", "jobs: {}", "jobs:\n  x:\n    steps:\n      - uses: actions/checkout@v4"],
    ["deprecated App ID", ".github/workflows/release-promote.yml", "jobs: {}", "jobs:\n  x:\n    steps:\n      - uses: actions/create-github-app-token@v3\n        with:\n          app-id: 1"],
  ];
  for (const [name, file, before, after] of cases) {
    await t.test(name, async () => {
      const root = await fixture();
      const target = path.join(root, "component", file);
      const text = await import("node:fs/promises").then(({ readFile }) => readFile(target, "utf8"));
      await writeFile(target, text.replace(before, after));
      assert.equal((await run(root)).status, 1);
    });
  }
});

test("configured repositories must be present instead of silently skipped", async () => {
  const root = await fixture();
  const config = JSON.parse(await import("node:fs/promises").then(({ readFile }) => readFile(path.join(root, "topology.json"), "utf8")));
  config.repositories.push({ path: "missing", candidate: ".github/workflows/release-candidate.yml", promotions: [] });
  await writeFile(path.join(root, "topology.json"), JSON.stringify(config));
  assert.equal((await run(root)).status, 1);
});
