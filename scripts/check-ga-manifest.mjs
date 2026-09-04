#!/usr/bin/env node
// check-ga-manifest — fail-closed validation of a GA release manifest.
//
//   node scripts/check-ga-manifest.mjs <manifest.json> [--from-rc <rc.json>]
//
// A GA manifest is a promotion of an already-qualified rc: it must be preceded by
// one, it must not introduce new content, it must not ship prerelease artifacts,
// and promoted product coordinates must be pullable with matching digests. The
// authoritative network check is opt-in for the credentialed promotion workflow;
// all required checks run before any tag is created — a tag pointing at a failed
// release is an unrecoverable consumption of outward-facing promise space.
//
// Inputs that are not GA manifests (rc manifests, candidate provenance records,
// publication state) are reported and skipped rather than judged by GA rules.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { createHash } from "node:crypto";

const PRERELEASE = /-(rc|dev|alpha|beta|canary|snapshot|preview)\b/i;
// Only the manifest's own release identity changes during promotion. Component
// versions, coordinates, and digests identify the already-qualified bytes and
// must remain exactly equal to the rc, even when they reuse these field names.
const RELEASE_IDENTITY_PATHS = new Set(["$.release", "$.version"]);
const SHA256_DIGEST = /^sha256:[0-9a-f]{64}$/i;

const args = process.argv.slice(2);
const manifestPath = args.find((a) => !a.startsWith("--"));
const rcIndex = args.indexOf("--from-rc");
const rcPath = rcIndex >= 0 ? args[rcIndex + 1] : null;
// Network verification (coordinate pullable + digest match) is opt-in: the PR-time
// gate (release-governance.yml) must not assume it can authenticate to every
// coordinate host, so it runs rules 1-3 only. The GA promote workflow — the
// authoritative, credentialed moment right before a tag is minted — passes this
// flag to also enforce S3's third requirement before publishing.
const VERIFY_COORDINATES = args.includes("--verify-coordinates");

if (!manifestPath) {
  console.error("usage: check-ga-manifest <manifest.json> [--from-rc <rc.json>] [--verify-coordinates]");
  process.exit(2);
}

const findings = [];
const record = (subject, evidence, verdict, fixes) => findings.push({ subject, evidence, verdict, fixes });

const readJson = (path) => {
  if (!existsSync(path)) {
    console.error(`check-ga-manifest: not found: ${path}`);
    process.exit(2);
  }
  return JSON.parse(readFileSync(path, "utf8"));
};

function* walk(node, path = "$") {
  if (typeof node === "string") yield [path, node];
  else if (Array.isArray(node)) for (const [i, v] of node.entries()) yield* walk(v, `${path}[${i}]`);
  else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) yield* walk(v, `${path}.${k}`);
}

/** Every object node in the tree (arrays included), depth-first — used to find
 *  every { coordinate, digest } pair regardless of where it is nested. */
function* walkObjects(node, path = "$") {
  if (Array.isArray(node)) {
    for (const [i, v] of node.entries()) yield* walkObjects(v, `${path}[${i}]`);
  } else if (node && typeof node === "object") {
    yield [path, node];
    for (const [k, v] of Object.entries(node)) yield* walkObjects(v, `${path}.${k}`);
  }
}

// ------------------------------------------------------- rule 1: no prerelease

function checkNoPrerelease(manifest) {
  for (const [path, value] of walk(manifest)) {
    const hit = PRERELEASE.exec(value);
    if (!hit) continue;
    record(
      path,
      value,
      `GA 清单引用了预发布制品（${hit[1]}）→ 未经确认的候选混入对外承诺`,
      ["把该组件晋升为正式版本后再发 GA", "或从本次发布集中移除该组件"],
    );
  }
}

// -------------------------------------------- rule 2: promotion must not drift

function diffAgainst(ga, rc) {
  const out = [];
  const flatten = (obj) => {
    const map = new Map();
    for (const [path, value] of walk(obj)) map.set(path, value);
    return map;
  };
  const gaMap = flatten(ga);
  const rcMap = flatten(rc);
  const isIdentity = (path) => RELEASE_IDENTITY_PATHS.has(path);

  for (const [path, value] of gaMap) {
    if (isIdentity(path)) continue;
    if (!rcMap.has(path)) {
      out.push({
        subject: path,
        evidence: `GA=${value}`,
        verdict: "GA 清单出现 rc 中不存在的字段 → 晋升引入了新内容",
        fixes: ["晋升不得重建：GA 必须与被选中的 rc 逐字段相等（身份字段除外）"],
      });
    } else if (rcMap.get(path) !== value) {
      out.push({
        subject: path,
        evidence: `rc=${rcMap.get(path)} → GA=${value}`,
        verdict: "GA 与被晋升的 rc 内容不一致",
        fixes: ["重新从该 rc 生成 GA 清单，不要手工编辑"],
      });
    }
  }
  for (const path of rcMap.keys()) {
    if (!isIdentity(path) && !gaMap.has(path)) {
      out.push({
        subject: path,
        evidence: "仅存在于 rc",
        verdict: "GA 清单丢失了 rc 中的字段 → 晋升不完整",
        fixes: ["重新从该 rc 生成 GA 清单"],
      });
    }
  }
  return out;
}

// ----------------------------------------- rule 3: a GA must be promoted from rc

// Sibling manifests are matched on their declared version, not their filename, so
// a misnamed file cannot pass itself off as the predecessor.
function findRcPredecessors(gaPath, gaVersion) {
  const dir = dirname(gaPath);
  const found = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json") || name === basename(gaPath)) continue;
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(join(dir, name), "utf8"));
    } catch {
      continue;
    }
    const version = parsed?.release ?? parsed?.version;
    if (typeof version === "string" && version.startsWith(`${gaVersion}-`) && PRERELEASE.test(version)) {
      found.push({ path: join(dir, name), version, manifest: parsed });
    }
  }
  return found.sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
}

// --------------------------------------- rule 4: coordinates must be pullable

// github-release://<owner>/<repo>/<rest> maps to a plain download URL by
// substitution; <rest> may itself contain slashes (tags can), so it is taken
// verbatim. An explicit downloadUrl (already resolved) always wins; a bare
// http(s) coordinate is used as-is. Any other scheme is not resolvable here.
function resolveCoordinateUrl(coordinate, downloadUrl) {
  if (typeof downloadUrl === "string" && downloadUrl.length > 0) return downloadUrl;
  const m = /^github-release:\/\/([^/]+)\/([^/]+)\/(.+)$/.exec(coordinate);
  if (m) return `https://github.com/${m[1]}/${m[2]}/releases/download/${m[3]}`;
  if (/^https?:\/\//.test(coordinate)) return coordinate;
  return null;
}

async function verifyCoordinateDigest(url, expectedDigest) {
  let response;
  try {
    response = await fetch(url, { redirect: "follow" });
  } catch (e) {
    return `无法拉取（${e.message}）`;
  }
  if (!response.ok || !response.body) return `无法拉取（HTTP ${response.status}）`;
  const hash = createHash("sha256");
  for await (const chunk of response.body) hash.update(chunk);
  const actual = `sha256:${hash.digest("hex")}`;
  return actual === expectedDigest ? null : `digest 不匹配（期望 ${expectedDigest}，实际 ${actual}）`;
}

async function checkCoordinatesPullable(manifest) {
  for (const [path, node] of walkObjects(manifest)) {
    const { coordinate, digest, downloadUrl } = node;
    if (typeof coordinate !== "string") continue;
    // Product coordinates are only authoritative when accompanied by a usable
    // digest. Silently skipping a missing or malformed digest would turn the
    // verification flag into a fail-open path. Compose image coordinates carry
    // their digest inline and are verified separately with imagetools inspect.
    if (!SHA256_DIGEST.test(digest ?? "")) {
      if (manifest.release !== undefined) {
        record(`${path}.digest`, String(digest ?? "(missing)"), "坐标缺少有效 sha256 digest → 无法验证制品身份", [
          "为每个 product 坐标提供 sha256:<64 hex> digest",
        ]);
      }
      continue;
    }
    const url = resolveCoordinateUrl(coordinate, downloadUrl);
    if (!url) {
      record(`${path}.coordinate`, coordinate, "坐标无法解析为可下载地址 → 无法确认可拉取性", [
        "改用 github-release:// 方案，或补充 downloadUrl",
      ]);
      continue;
    }
    const problem = await verifyCoordinateDigest(url, digest);
    if (problem) {
      record(`${path}.coordinate`, `${url} — ${problem}`, "坐标不可拉取或 digest 不匹配 → GA 引用了未经确认可达的制品", [
        "修正坐标/digest 后重新生成 GA 清单",
        "或确认该制品已正确发布",
      ]);
    }
  }
}

// ------------------------------------------------------------------- report

const manifest = readJson(manifestPath);
const version = manifest?.release ?? manifest?.version;

// Candidate provenance and publication state live under release/ too, but carry
// neither field; judging them by GA rules would flag their legitimate rc strings.
if (typeof version !== "string") {
  console.log(`manifest: ${manifestPath}\n(无 release/version 字段，非发布清单，跳过)`);
  process.exit(0);
}

if (PRERELEASE.test(version)) {
  console.log(`manifest: ${manifestPath}\nrc 清单（${version}）— GA 规则不适用，跳过`);
  process.exit(0);
}

checkNoPrerelease(manifest);

let promotedFrom = rcPath;
if (rcPath) {
  for (const f of diffAgainst(manifest, readJson(rcPath))) findings.push(f);
} else {
  const predecessors = findRcPredecessors(manifestPath, version);
  if (predecessors.length === 0) {
    record(
      manifest.release !== undefined ? "$.release" : "$.version",
      version,
      "GA 清单没有 rc 前身 → 版本号是凭空生成的，不是晋升出来的",
      [
        `先走候选流水线产出 ${join(dirname(manifestPath), `${version}-rc.1.json`)}`,
        "GA 只能从已限定的 rc 晋升，不得直接新建",
      ],
    );
  } else {
    // Several rc ordinals may carry identical content. Pin promotion to the
    // newest content-equivalent candidate deterministically; the workflow then
    // resolves this one exact tag rather than silently taking a list result.
    const match = [...predecessors].reverse().find((p) => diffAgainst(manifest, p.manifest).length === 0);
    const chosen = match ?? predecessors[predecessors.length - 1];
    promotedFrom = chosen.path;
    if (!match) for (const f of diffAgainst(manifest, chosen.manifest)) findings.push(f);
  }
}

console.log(`manifest: ${manifestPath}${promotedFrom ? `\npromoted from: ${promotedFrom}` : ""}\n`);

if (VERIFY_COORDINATES) await checkCoordinatesPullable(manifest);

if (findings.length === 0) {
  console.log("### ✅ GA 清单校验通过");
  process.exit(0);
}

for (const f of findings) {
  console.log(`::error::${f.verdict} @ ${f.subject}`);
  console.log("```");
  console.log(`subject:  ${f.subject}`);
  console.log(`evidence: ${f.evidence}`);
  console.log(`判定:     ${f.verdict}`);
  console.log("supportedFixes:");
  for (const fix of f.fixes) console.log(`          - ${fix}`);
  console.log("```\n");
}
console.error(`check-ga-manifest: ${findings.length} 项阻塞，不得打 tag`);
process.exit(1);
