import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("canonical CI replays v2 assets and the public exact-content cache qualification", () => {
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const workflow = readFileSync(path.join(repository, ".github/workflows/iter3-execution-ci.yml"), "utf8");
  const qualification = readFileSync(path.join(repository, "qualification/iter6/workflow-source/qualify.mjs"), "utf8");
  const releaseAuthority = JSON.parse(readFileSync(
    path.join(repository, "release/candidates/iter6-wave8.json"),
    "utf8",
  ));
  assert.equal(
    releaseAuthority.execution.candidate_archive_commit,
    "17052b41df892093a2956c9fe1dbea36e67e47dd",
  );
  assert.doesNotMatch(workflow, /test "\$\(git rev-parse HEAD:[^)]+\)" = [0-9a-f]{40}/u);
  assert.match(workflow, /node qualification\/iter6\/workflow-source\/qualify\.mjs/);
  assert.match(workflow, /release\/cli\/release\.cjs build/);
  assert.match(workflow, /release\/cli\/release\.cjs qualify/);
  assert.match(workflow, /uv run --project evolution-system --python 3\.14 \\\n\s+pytest -q evolution-system\/tests\/unit\/workflow_sources/);
  assert.doesNotMatch(workflow, /pnpm verify:(?:dsh-intake|iteration3-docs)/);
  assert.doesNotMatch(workflow, /workflow-source.*(?:latest|branch|local fallback)/i);
  assert.match(qualification, /FrozenWorkflowPackageValidatorV2/);
  assert.match(qualification, /contractVersion: "2\.0\.0"/);
  assert.match(qualification, /implementation-workflow@0\.4\.0/);
  assert.doesNotMatch(qualification, /FrozenWorkflowPackageValidator(?!V2)|contractVersion: "1\.|implementation-workflow@0\.3\.0/);
});
