#!/usr/bin/env node
// check-ga-manifest — fail-closed validation of a GA release manifest.
//
//   node scripts/check-ga-manifest.mjs <manifest.json> [--from-rc <rc.json>]
//
// A GA manifest is a promotion of an already-qualified rc: it must be preceded by
// one, it must not introduce new coordinates, and it must not ship prerelease
// artifacts. All three are checked before any tag is created — a tag pointing at a
// failed release is an unrecoverable consumption of outward-facing promise space.
//
// Inputs that are not GA manifests (rc manifests, candidate provenance records,
// publication state) are reported and skipped rather than judged by GA rules.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const PRERELEASE = /-(rc|dev|alpha|beta|canary|snapshot|preview)\b/i;
// Fields that legitimately differ between an rc and the GA promoted from it.
const IDENTITY_FIELDS = new Set(["release", "version", "coordinate", "downloadUrl", "digest", "sha256"]);

const args = process.argv.slice(2);
const manifestPath = args.find((a) => !a.startsWith("--"));
const rcIndex = args.indexOf("--from-rc");
const rcPath = rcIndex >= 0 ? args[rcIndex + 1] : null;

if (!manifestPath) {
  console.error("usage: check-ga-manifest <manifest.json> [--from-rc <rc.json>]");
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
  const isIdentity = (path) => IDENTITY_FIELDS.has(path.split(".").pop().replace(/\[\d+\]$/, ""));

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
    const match = predecessors.find((p) => diffAgainst(manifest, p.manifest).length === 0);
    const chosen = match ?? predecessors[predecessors.length - 1];
    promotedFrom = chosen.path;
    if (!match) for (const f of diffAgainst(manifest, chosen.manifest)) findings.push(f);
  }
}

console.log(`manifest: ${manifestPath}${promotedFrom ? `\npromoted from: ${promotedFrom}` : ""}\n`);

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
