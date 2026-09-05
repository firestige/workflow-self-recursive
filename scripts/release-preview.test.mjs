import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { renderReleasePreview } from "./render-release-preview.mjs";

const compose = (version, evidenceVersion = "0.1.1-rc.1") => ({
  schemaVersion: "wsr.compose-release@1.0.0",
  version,
  images: {
    postgres: {
      coordinate: "postgres:18.4-bookworm@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    evidence: {
      coordinate: `ghcr.io/firestige/wsr-evidence:${evidenceVersion}@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
      provenance: `https://github.com/firestige/wsr-evidence/releases/download/${evidenceVersion}/release-qualification.json`,
    },
  },
});

test("renders the candidate coordinate inventory and prerelease residue", () => {
  const preview = renderReleasePreview(compose("0.1.7-rc.1"), []);

  assert.match(preview, /Selected candidate: `compose-0\.1\.7-rc\.1`/);
  assert.match(preview, /\| `image\.postgres` \| `18\.4-bookworm` \|/);
  assert.match(preview, /\| `image\.evidence` \| `0\.1\.1-rc\.1` \|/);
  assert.match(preview, /GA readiness: BLOCKED/);
  assert.match(preview, /images\.evidence\.coordinate/);
  assert.doesNotMatch(preview, /version.*0\.1\.7-rc\.1.*residue/i);
});

test("renders content differences between parallel candidates of one base version", () => {
  const selected = compose("0.1.7-rc.2", "0.1.1-rc.2");
  const earlier = compose("0.1.7-rc.1", "0.1.1-rc.1");
  const preview = renderReleasePreview(selected, [earlier]);

  assert.match(preview, /Parallel candidate comparison/);
  assert.match(preview, /`compose-0\.1\.7-rc\.1`/);
  assert.match(preview, /`compose-0\.1\.7-rc\.2 \(selected\)`/);
  assert.match(preview, /image\.evidence/);
  assert.match(preview, /0\.1\.1-rc\.1/);
  assert.match(preview, /0\.1\.1-rc\.2/);
});

test("product inventory includes top-level and nested release coordinates", () => {
  const preview = renderReleasePreview({
    schema: "wsr.compatibility@1.0.0",
    release: "0.6.0-rc.1",
    components: [{
      id: "dsh-bundle",
      version: "0.3.0",
      coordinate: "github-release://firestige/wsr-dsh/0.3.0/compatibility-matrix.json",
      digest: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      compatibility: {
        executionOwner: {
          package: "wsr-execution",
          version: "0.3.0",
          coordinate: "https://example.test/wsr-execution-0.3.0.tgz",
          digest: "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
        },
      },
    }],
  }, []);

  assert.match(preview, /`dsh-bundle`/);
  assert.match(preview, /`dsh-bundle\.compatibility\.executionOwner`/);
  assert.match(preview, /GA readiness: READY/);
  assert.match(preview, /Content diff from selected rc: empty/);
});

test("product readiness ignores only the external DSH runtime prerelease", () => {
  const manifest = {
    schema: "wsr.compatibility@1.0.0",
    release: "0.5.13-rc.1",
    components: [{
      id: "dsh-bundle",
      version: "0.2.11",
      compatibility: {
        dsh: "0.1.1-rc.2",
        packages: { suite: "dsh-wsr@0.2.10" },
      },
    }],
  };
  assert.match(renderReleasePreview(manifest, []), /GA readiness: READY/);

  manifest.components[0].compatibility.packages.suite = "dsh-wsr@0.2.10-rc.1";
  const blocked = renderReleasePreview(manifest, []);
  assert.match(blocked, /GA readiness: BLOCKED/);
  assert.match(blocked, /components\.0\.compatibility\.packages\.suite/);
});

test("candidate publication exposes the generated preview in the summary and release", async () => {
  const workflow = await readFile(new URL("../.github/workflows/release-candidate.yml", import.meta.url), "utf8");

  assert.match(workflow, /scripts\/render-release-preview\.mjs/);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/);
  assert.match(workflow, /--notes-file "\$RELEASE_PREVIEW"/);
  assert.match(workflow, /"\$RELEASE_PREVIEW"/);
});
