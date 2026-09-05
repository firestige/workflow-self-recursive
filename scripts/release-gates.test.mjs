import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { chmod, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");

async function runNode(script, args, cwd) {
  try {
    const result = await execFileAsync(process.execPath, [script, ...args], { cwd });
    return { status: 0, ...result };
  } catch (error) {
    return { status: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

async function governanceFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-governance-"));
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await mkdir(path.join(root, ".github", "actions", "build"), { recursive: true });
  await writeFile(
    path.join(root, ".github", "workflows", "release-compose-bundle.yml"),
    `name: promote
on:
  workflow_dispatch:
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: gh release create v1
`,
  );
  await writeFile(
    path.join(root, ".github", "workflows", "release-candidate.yml"),
    `name: candidate
# release-compose-bundle.yml is documentation only
on:
  push:
    branches: [release/next]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
`,
  );
  await writeFile(
    path.join(root, ".github", "workflows", "ordinary.yml"),
    `name: ordinary
on:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
`,
  );
  await writeFile(
    path.join(root, ".github", "actions", "build", "action.yml"),
    `name: build
runs:
  using: composite
  steps:
    - shell: bash
      run: echo ok
`,
  );
  return root;
}

async function runGovernance(root) {
  return runNode(path.join(ROOT, "scripts", "check-release-governance.mjs"), [], root);
}

async function promotionVerificationScript(kind) {
  const workflow = await readFile(path.join(ROOT, ".github", "workflows", "release-compose-bundle.yml"), "utf8");
  const jobStart = workflow.indexOf(`  build-and-qualify-${kind}:`);
  const nextJob = workflow.indexOf("\n  build-and-qualify-", jobStart + 1);
  const job = workflow.slice(jobStart, nextJob === -1 ? undefined : nextJob);
  const stepStart = job.indexOf("      - name: Verify rc predecessor was published and matches its manifest asset");
  const runStart = job.indexOf("        run: |\n", stepStart) + "        run: |\n".length;
  const followingStep = job.indexOf("\n      - name:", runStart);
  assert.notEqual(jobStart, -1);
  assert.notEqual(stepStart, -1);
  assert.notEqual(runStart, -1);
  return job
    .slice(runStart, followingStep === -1 ? undefined : followingStep)
    .split("\n")
    .map((line) => line.startsWith("          ") ? line.slice(10) : line)
    .join("\n");
}

async function runPromotionVerification(kind, assetMatches, checkPass = true) {
  const root = await mkdtemp(path.join(os.tmpdir(), `wsr-${kind}-promotion-`));
  const bin = path.join(root, "bin");
  await mkdir(bin);
  const rc = path.join(root, "rc.json");
  const asset = path.join(root, "asset.release.json");
  await writeFile(rc, '{"release":"1.2.3-rc.7","version":"1.2.3-rc.7"}\n');
  await writeFile(asset, assetMatches ? await readFile(rc) : "different\n");
  const commands = {
    node: `#!/bin/sh
if [ "$FAKE_CHECK_FAIL" = "1" ]; then
  printf '%s\\n' 'subject: fixture coordinate' 'evidence: injected verifier failure' 'verdict: blocked'
  exit 1
fi
printf 'manifest: fixture.json\\npromoted from: %s\\n\\npass\\n' "$FAKE_RC"
`,
    jq: "#!/bin/sh\nprintf '%s\\n' '1.2.3-rc.7'\n",
    gh: `#!/bin/sh
if [ "$1 $2" = "release view" ]; then
  printf '%s\\n' true
  exit 0
fi
if [ "$1 $2" = "release download" ]; then
  while [ "$#" -gt 0 ]; do
    if [ "$1" = "--dir" ]; then shift; target="$1"; fi
    shift
  done
  cp "$FAKE_ASSET" "$target/fixture.release.json"
  exit 0
fi
exit 2
`,
  };
  for (const [name, source] of Object.entries(commands)) {
    const file = path.join(bin, name);
    await writeFile(file, source);
    await chmod(file, 0o755);
  }
  try {
    const result = await execFileAsync("/bin/bash", ["--noprofile", "--norc", "-e", "-o", "pipefail", "-c", await promotionVerificationScript(kind)], {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${bin}:/usr/bin:/bin`,
        FAKE_RC: rc,
        FAKE_ASSET: asset,
        FAKE_CHECK_FAIL: checkPass ? "0" : "1",
        RELEASE_MANIFEST: "fixture.json",
        RUNNER_TEMP: path.join(root, "runner"),
      },
    });
    return { status: 0, ...result };
  } catch (error) {
    return { status: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

test("a comment naming a promotion workflow does not count as a call", async () => {
  const result = await runGovernance(await governanceFixture());
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("a promotion workflow cannot expose workflow_call", async () => {
  const root = await governanceFixture();
  const promote = path.join(root, ".github", "workflows", "release-compose-bundle.yml");
  await writeFile(promote, (await readFile(promote, "utf8")).replace("  workflow_dispatch:\n", "  workflow_dispatch:\n  workflow_call:\n"));
  const result = await runGovernance(root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /workflow_call/);
});

test("a candidate workflow cannot expose workflow_dispatch", async () => {
  const root = await governanceFixture();
  const candidate = path.join(root, ".github", "workflows", "release-candidate.yml");
  await writeFile(candidate, (await readFile(candidate, "utf8")).replace("  push:\n", "  workflow_dispatch:\n  push:\n"));
  const result = await runGovernance(root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /candidate.*人工|人工.*candidate/i);
});

test("existing governance hazards remain blocked", async (t) => {
  await t.test("automatic trigger on promotion workflow", async () => {
    const root = await governanceFixture();
    const file = path.join(root, ".github", "workflows", "release-compose-bundle.yml");
    await writeFile(file, (await readFile(file, "utf8")).replace("  workflow_dispatch:\n", "  workflow_dispatch:\n  push:\n"));
    assert.equal((await runGovernance(root)).status, 1);
  });

  await t.test("publishing command in ordinary workflow", async () => {
    const root = await governanceFixture();
    const file = path.join(root, ".github", "workflows", "ordinary.yml");
    await writeFile(file, (await readFile(file, "utf8")).replace("echo ok", "gh release create v-bad"));
    assert.equal((await runGovernance(root)).status, 1);
  });

  await t.test("publishing command in composite action", async () => {
    const root = await governanceFixture();
    const file = path.join(root, ".github", "actions", "build", "action.yml");
    await writeFile(file, (await readFile(file, "utf8")).replace("echo ok", "gh release create v-bad"));
    assert.equal((await runGovernance(root)).status, 1);
  });
});

test("promotion checks an exact rc tag without a bounded release list", async () => {
  const workflow = await readFile(path.join(ROOT, ".github", "workflows", "release-compose-bundle.yml"), "utf8");
  assert.doesNotMatch(workflow, /^\s*gh release list/m);
  assert.equal((workflow.match(/gh release view "\$TAG"/g) ?? []).length, 2);
  assert.equal((workflow.match(/gh release download "\$TAG"/g) ?? []).length, 2);
});

test("compose qualification uses the Node 24 buildx action runtime", async () => {
  const action = await readFile(path.join(ROOT, ".github", "actions", "build-qualify-bundle", "action.yml"), "utf8");
  assert.match(action, /uses: docker\/setup-buildx-action@v4\b/);
  assert.doesNotMatch(action, /uses: docker\/setup-buildx-action@v3\b/);
});

test("all first-party workflows and actions use Node 24 action majors", async () => {
  const files = [
    path.join(ROOT, ".github", "workflows", "iter3-execution-ci.yml"),
    path.join(ROOT, ".github", "workflows", "release-candidate.yml"),
    path.join(ROOT, ".github", "workflows", "release-compose-bundle.yml"),
    path.join(ROOT, ".github", "workflows", "release-governance.yml"),
    path.join(ROOT, ".github", "actions", "build-qualify-bundle", "action.yml"),
  ];
  const text = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  for (const deprecated of [
    /actions\/checkout@v4\b/,
    /actions\/setup-node@v4\b/,
    /actions\/upload-artifact@v4\b/,
    /actions\/create-github-app-token@v2\b/,
    /docker\/setup-buildx-action@v3\b/,
  ]) assert.doesNotMatch(text, deprecated);
});

test("release guides describe candidate push as the only entry point", async () => {
  const guides = await Promise.all([
    readFile(path.join(ROOT, "docs", "guides", "release-automation.md"), "utf8"),
    readFile(path.join(ROOT, "docs", "guides", "release-automation.zh-CN.md"), "utf8"),
  ]);
  for (const guide of guides) {
    assert.match(guide, /release\/next/);
    assert.doesNotMatch(guide, /workflow_dispatch.*(?:candidate|候选)|(?:candidate|候选).*workflow_dispatch/i);
  }
});

test("both promotion jobs bind a published rc to its exact manifest asset", async (t) => {
  for (const kind of ["compose", "product"]) {
    await t.test(`${kind}: matching asset passes`, async () => {
      const result = await runPromotionVerification(kind, true);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.match(result.stdout, /asset-verified/);
    });
    await t.test(`${kind}: mismatched asset is rejected`, async () => {
      const result = await runPromotionVerification(kind, false);
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stderr, /manifest asset differs/);
    });
  }
});

test("promotion preserves checker diagnostics while failing closed", async () => {
  const result = await runPromotionVerification("compose", true, false);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /evidence: injected verifier failure/);
  assert.match(result.stderr, /check-ga-manifest failed/);
});

async function withArtifactServer(body, fn) {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { "content-type": "application/octet-stream" });
    response.end(body);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}/artifact`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function runManifest({ coordinate, digest, downloadUrl }) {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-manifest-"));
  const component = { id: "fixture", coordinate, digest };
  if (downloadUrl !== undefined) component.downloadUrl = downloadUrl;
  await writeFile(path.join(root, "ga.json"), JSON.stringify({ release: "1.2.3", components: [component] }));
  await writeFile(path.join(root, "rc.json"), JSON.stringify({ release: "1.2.3-rc.7", components: [component] }));
  return runNode(
    path.join(ROOT, "scripts", "check-ga-manifest.mjs"),
    ["ga.json", "--from-rc", "rc.json", "--verify-coordinates"],
    root,
  );
}

test("coordinate verification preserves non-GA input classification", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-classification-"));
  await t.test("candidate provenance is skipped", async () => {
    await writeFile(path.join(root, "candidate.json"), JSON.stringify({ coordinate: "opaque://ignored", digest: "bad" }));
    const result = await runNode(path.join(ROOT, "scripts", "check-ga-manifest.mjs"), ["candidate.json", "--verify-coordinates"], root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /非发布清单，跳过/);
  });
  await t.test("rc manifest is skipped", async () => {
    await writeFile(path.join(root, "rc.json"), JSON.stringify({ version: "1.2.3-rc.1", coordinate: "opaque://ignored", digest: "bad" }));
    const result = await runNode(path.join(ROOT, "scripts", "check-ga-manifest.mjs"), ["rc.json", "--verify-coordinates"], root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /GA 规则不适用，跳过/);
  });
});

test("implicit predecessor selection pins the newest content-equivalent rc", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-predecessor-"));
  const manifest = { schema: "fixture", release: "1.2.3", components: [] };
  await writeFile(path.join(root, "ga.json"), JSON.stringify(manifest));
  await writeFile(path.join(root, "older.json"), JSON.stringify({ ...manifest, release: "1.2.3-rc.2" }));
  await writeFile(path.join(root, "newer.json"), JSON.stringify({ ...manifest, release: "1.2.3-rc.10" }));
  const result = await runNode(path.join(ROOT, "scripts", "check-ga-manifest.mjs"), ["ga.json"], root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /promoted from: newer\.json/);
});

test("promotion rejects changes to nested component identity fields", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-component-identity-"));
  const rcComponent = {
    id: "fixture",
    release: "4.5.6",
    version: "4.5.6",
    coordinate: "https://example.invalid/fixture-4.5.6.tgz",
    downloadUrl: "https://example.invalid/fixture-4.5.6.tgz",
    digest: `sha256:${"1".repeat(64)}`,
    sha256: "1".repeat(64),
  };
  const gaComponent = {
    id: "fixture",
    release: "4.5.7",
    version: "4.5.7",
    coordinate: "https://example.invalid/fixture-4.5.7.tgz",
    downloadUrl: "https://example.invalid/fixture-4.5.7.tgz",
    digest: `sha256:${"2".repeat(64)}`,
    sha256: "2".repeat(64),
  };
  await writeFile(path.join(root, "rc.json"), JSON.stringify({ release: "1.2.3-rc.7", components: [rcComponent] }));
  await writeFile(path.join(root, "ga.json"), JSON.stringify({ release: "1.2.3", components: [gaComponent] }));

  const result = await runNode(
    path.join(ROOT, "scripts", "check-ga-manifest.mjs"),
    ["ga.json", "--from-rc", "rc.json"],
    root,
  );

  assert.equal(result.status, 1, result.stdout + result.stderr);
  for (const field of ["release", "version", "coordinate", "downloadUrl", "digest", "sha256"]) {
    assert.match(result.stdout, new RegExp(`\\$\\.components\\[0\\]\\.${field}`));
  }
});

test("GA prerelease policy ignores only the external DSH runtime version", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wsr-third-party-prerelease-"));
  const product = {
    schema: "wsr.compatibility@1.0.0",
    release: "1.2.3",
    components: [{
      id: "dsh-bundle",
      version: "0.2.11",
      compatibility: {
        dsh: "0.1.1-rc.2",
        packages: { suite: "dsh-wsr@0.2.10" },
      },
    }],
  };
  await writeFile(path.join(root, "rc.json"), JSON.stringify({ ...product, release: "1.2.3-rc.1" }));

  await t.test("allows the third-party DSH runtime prerelease", async () => {
    await writeFile(path.join(root, "ga.json"), JSON.stringify(product));
    const result = await runNode(
      path.join(ROOT, "scripts", "check-ga-manifest.mjs"),
      ["ga.json", "--from-rc", "rc.json"],
      root,
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });

  await t.test("still rejects a first-party DSH package prerelease", async () => {
    const invalid = structuredClone(product);
    invalid.components[0].compatibility.packages.suite = "dsh-wsr@0.2.10-rc.1";
    await writeFile(path.join(root, "ga.json"), JSON.stringify(invalid));
    const result = await runNode(
      path.join(ROOT, "scripts", "check-ga-manifest.mjs"),
      ["ga.json", "--from-rc", "rc.json"],
      root,
    );
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /packages\.suite/);
  });
});

test("coordinate verification accepts the exact bytes and digest", async () => {
  const body = Buffer.from("verified artifact\n");
  const digest = `sha256:${createHash("sha256").update(body).digest("hex")}`;
  await withArtifactServer(body, async (url) => {
    const result = await runManifest({ coordinate: url, digest, downloadUrl: url });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("coordinate verification rejects a digest mismatch", async () => {
  await withArtifactServer(Buffer.from("different bytes\n"), async (url) => {
    const result = await runManifest({ coordinate: url, digest: `sha256:${"0".repeat(64)}`, downloadUrl: url });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /digest 不匹配/);
  });
});

test("coordinate verification rejects an unresolvable coordinate", async () => {
  const result = await runManifest({
    coordinate: "opaque://artifact",
    digest: `sha256:${"0".repeat(64)}`,
  });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /坐标无法解析/);
});

test("coordinate verification fails closed on a malformed digest", async () => {
  await withArtifactServer(Buffer.from("artifact\n"), async (url) => {
    const result = await runManifest({ coordinate: url, digest: "not-a-digest", downloadUrl: url });
    assert.equal(result.status, 1, result.stdout + result.stderr);
  });
});

test("coordinate verification fails closed on a missing product digest", async () => {
  await withArtifactServer(Buffer.from("artifact\n"), async (url) => {
    const result = await runManifest({ coordinate: url, downloadUrl: url });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /缺少有效 sha256 digest/);
  });
});
