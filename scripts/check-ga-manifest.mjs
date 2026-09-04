#!/usr/bin/env node
// check-ga-manifest — fail-closed validation of a GA release manifest.
//
//   node scripts/check-ga-manifest.mjs <manifest.json> [--from-rc <rc.json>]
//
// A GA manifest is a promotion of an already-qualified rc: it must not introduce
// new coordinates, and it must not ship prerelease artifacts. Both are checked
// before any tag is created — a tag pointing at a failed release is an
// unrecoverable consumption of outward-facing promise space.

import { readFileSync, existsSync } from "node:fs";

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

function checkPromotionEquivalence(ga, rc) {
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
      record(path, `GA=${value}`, "GA 清单出现 rc 中不存在的字段 → 晋升引入了新内容", [
        "晋升不得重建：GA 必须与被选中的 rc 逐字段相等（身份字段除外）",
      ]);
    } else if (rcMap.get(path) !== value) {
      record(path, `rc=${rcMap.get(path)} → GA=${value}`, "GA 与被晋升的 rc 内容不一致", [
        "重新从该 rc 生成 GA 清单，不要手工编辑",
      ]);
    }
  }
  for (const path of rcMap.keys()) {
    if (!isIdentity(path) && !gaMap.has(path)) {
      record(path, `仅存在于 rc`, "GA 清单丢失了 rc 中的字段 → 晋升不完整", ["重新从该 rc 生成 GA 清单"]);
    }
  }
}

// ------------------------------------------------------------------- report

const manifest = readJson(manifestPath);
checkNoPrerelease(manifest);
if (rcPath) checkPromotionEquivalence(manifest, readJson(rcPath));

console.log(`manifest: ${manifestPath}${rcPath ? `\npromoted from: ${rcPath}` : "\n(未提供 --from-rc，跳过晋升等价校验)"}\n`);

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
