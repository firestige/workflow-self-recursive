import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { assertPinnedOwners } from "./qualify.mjs";

const expected = Object.freeze({
  "workflow-package": "4f77fcc25c26d85cba170ba6aa859d05eee3b298",
  "execution-system": "5d03924df88e1afda3b7ffb5ecf182482cc8d1d5",
  "evolution-system": "b302595942b2307514570a47be9ed87f26f8cf84",
});

test("accepts only the exact cutover owner revisions", () => {
  assert.deepEqual(assertPinnedOwners(expected), expected);
  assert.throws(
    () => assertPinnedOwners({ ...expected, "execution-system": "0".repeat(40) }),
    /OWNER_REVISION_MISMATCH:execution-system/,
  );
});

test("rejects missing, open, and extra owner coordinates", () => {
  assert.throws(
    () => assertPinnedOwners({ ...expected, "evolution-system": "main" }),
    /OWNER_REVISION_MISMATCH:evolution-system/,
  );
  assert.throws(
    () => assertPinnedOwners({
      ...expected,
      "private-source": "1".repeat(40),
    }),
    /OWNER_REVISION_SET_INVALID/,
  );
});

test("canonical CI replays v2 assets and the public exact-content cache qualification", () => {
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const workflow = readFileSync(path.join(repository, ".github/workflows/iter3-execution-ci.yml"), "utf8");
  const releaseAuthority = JSON.parse(readFileSync(
    path.join(repository, "release/candidates/iter6-wave8.json"),
    "utf8",
  ));
  assert.equal(
    releaseAuthority.execution.candidate_archive_commit,
    "17052b41df892093a2956c9fe1dbea36e67e47dd",
  );
  assert.match(workflow, new RegExp(`HEAD:execution-system\\)" = ${expected["execution-system"]}`));
  assert.match(workflow, /node qualification\/iter6\/workflow-source\/qualify\.mjs/);
  assert.match(workflow, /release\/cli\/release\.cjs build/);
  assert.match(workflow, /release\/cli\/release\.cjs qualify/);
  assert.match(workflow, /uv run --project evolution-system --python 3\.14 \\\n\s+pytest -q evolution-system\/tests\/unit\/workflow_sources/);
  assert.doesNotMatch(workflow, /pnpm verify:(?:dsh-intake|iteration3-docs)/);
  assert.doesNotMatch(workflow, /workflow-source.*(?:latest|branch|local fallback)/i);
});
