import assert from "node:assert/strict";
import test from "node:test";

import { assertLocalManifestConsistency } from "./local-manifest-consistency.mjs";

function fixture() {
  return {
    manifest: {
      components: [
        {
          id: "dsh-bundle",
          version: "0.2.10",
          compatibility: {
            executionOwner: { package: "wsr-execution", version: "0.2.6", release: "0.2.6" },
            packages: {
              execution: "dsh-wsr-execution@0.2.9",
              studio: "dsh-wsr-studio@0.1.2",
              suite: "dsh-wsr@0.2.9",
            },
          },
        },
        { id: "services", version: "0.1.6" },
        { id: "workflow-source", name: "implementation-workflow", version: "0.4.6" },
        { id: "providers", version: "0.2.6" },
      ],
    },
    artifacts: {
      dshRelease: { name: "wsr-dsh-monorepo", version: "0.2.10" },
      executionOwner: { name: "wsr-execution", version: "0.2.6" },
      dshPackages: {
        execution: { name: "dsh-wsr-execution", version: "0.2.9" },
        studio: { name: "dsh-wsr-studio", version: "0.1.2" },
        suite: { name: "dsh-wsr", version: "0.2.9" },
      },
      services: { name: "wsr-services", version: "0.1.6" },
      workflowSource: { name: "implementation-workflow", version: "0.4.6" },
      providers: { name: "wsr-execution", version: "0.2.6" },
    },
  };
}

test("accepts a product manifest whose component versions all exist in the local freeze", () => {
  const { manifest, artifacts } = fixture();
  assert.doesNotThrow(() => assertLocalManifestConsistency(manifest, artifacts));
});

test("fails closed and names every manifest/artifact version mismatch", () => {
  const cases = [
    ["dsh release", (value) => { value.manifest.components[0].version = "0.2.8"; }, /dsh-bundle\.version/],
    ["execution owner", (value) => { value.manifest.components[0].compatibility.executionOwner.release = "0.2.5"; }, /executionOwner\.release/],
    ["dsh package", (value) => { value.manifest.components[0].compatibility.packages.execution = "dsh-wsr-execution@0.2.7"; }, /packages\.execution/],
    ["services bundle", (value) => { value.manifest.components[1].version = "0.1.1"; }, /services\.version/],
    ["workflow source", (value) => { value.manifest.components[2].version = "0.4.5"; }, /workflow-source\.version/],
    ["providers", (value) => { value.manifest.components[3].version = "0.2.5"; }, /providers\.version/],
  ];

  for (const [label, mutate, expected] of cases) {
    const value = fixture();
    mutate(value);
    assert.throws(() => assertLocalManifestConsistency(value.manifest, value.artifacts), expected, label);
  }
});

test("fails closed when a required component is absent", () => {
  const { manifest, artifacts } = fixture();
  manifest.components = manifest.components.filter(({ id }) => id !== "services");
  assert.throws(() => assertLocalManifestConsistency(manifest, artifacts), /components\.services: manifest=\(missing\)/);
});
