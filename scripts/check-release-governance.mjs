#!/usr/bin/env node
// check-release-governance — guards the release authority surface on pull requests.
//
//   node scripts/check-release-governance.mjs --base <sha> --head <sha> [--comment-file <path>]
//
// Hard failures block the merge; risk flags only demand a human look. The split
// matters: if maintaining CI also failed the gate, governance cost would be
// pushed back onto the human, which is what this whole design avoids.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Editing these lists is itself a governance change: the file is CODEOWNERS-guarded.
//
// Promotion consumes outward-facing promise space and is therefore manual-only.
// Candidate workflows may trigger automatically on purpose: a release candidate
// costs nothing to redo, and keeping that path cheap is what stops promotion
// from being abused as a way to obtain evidence.
const PROMOTE_WORKFLOWS = ["release-compose-bundle.yml", "promote-ga.yml", "release-promote.yml"];
const CANDIDATE_WORKFLOWS = ["release-candidate.yml"];
const RELEASE_WORKFLOWS = [...PROMOTE_WORKFLOWS, ...CANDIDATE_WORKFLOWS];
const WORKFLOW_DIR = ".github/workflows";
// Composite actions have no workflow-level trigger of their own, but a publish
// command hiding in one is reachable from any workflow that calls it — including
// one this file never classified as a release workflow. workflowFiles() cannot
// see in here, so rule 3 below scans it independently.
const ACTIONS_DIR = ".github/actions";
const GOVERNANCE_PATHS = [/^\.github\/workflows\//, /^\.github\/actions\//, /^scripts\/check-/, /^\.github\/CODEOWNERS$/];

// Commands that mint or move an outward-facing promise.
const PUBLISH_PATTERNS = [
  { re: /\bgit\s+tag\b/, what: "creates a git tag" },
  { re: /\bgh\s+release\s+create\b/, what: "creates a GitHub Release" },
  { re: /\bnpm\s+publish\b/, what: "publishes to npm" },
  { re: /\bdist-tag\s+add\b/, what: "moves an npm dist-tag" },
];

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const BASE = arg("base");
const HEAD = arg("head", "HEAD");
const COMMENT_FILE = arg("comment-file");

const errors = [];
const risks = [];
const annotations = [];

const fail = (subject, evidence, verdict, fixes) => {
  errors.push({ subject, evidence, verdict, fixes });
  annotations.push(`::error file=${subject}::${verdict}`);
};
const flag = (subject, evidence, verdict) => {
  risks.push({ subject, evidence, verdict });
  annotations.push(`::warning file=${subject}::${verdict}`);
};

function changedFiles() {
  if (!BASE) return null;
  const out = execFileSync("git", ["diff", "--name-only", `${BASE}...${HEAD}`], { encoding: "utf8" });
  return out.split("\n").filter(Boolean);
}

/** Extract the top-level trigger names from a workflow's `on:` block. */
function triggersOf(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => /^on:/.test(l));
  if (start === -1) return [];

  const inline = lines[start].slice(3).trim();
  if (inline) {
    return inline
      .replace(/^[[{]|[\]}]$/g, "")
      .split(",")
      .map((s) => s.split(":")[0].trim())
      .filter(Boolean);
  }

  const found = [];
  let depth = null;
  for (const line of lines.slice(start + 1)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const indent = line.match(/^\s*/)[0].length;
    if (indent === 0) break; // next top-level key
    if (depth === null) depth = indent;
    if (indent !== depth) continue; // nested option, not a trigger
    const key = line.trim().match(/^([A-Za-z_]+):/);
    if (key) found.push(key[1]);
  }
  return found;
}

function workflowFiles() {
  if (!existsSync(WORKFLOW_DIR)) return [];
  return execFileSync("ls", [WORKFLOW_DIR], { encoding: "utf8" })
    .split("\n")
    .filter((f) => /\.ya?ml$/.test(f));
}

/** Every action.yml/action.yaml under .github/actions/, recursively. */
function actionFiles() {
  if (!existsSync(ACTIONS_DIR)) return [];
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/^action\.ya?ml$/.test(entry.name)) out.push(full);
    }
  };
  walk(ACTIONS_DIR);
  return out;
}

// --------------------------------------------------------------- rule 1

function checkReleaseTriggers(files) {
  for (const name of PROMOTE_WORKFLOWS) {
    if (!files.includes(name)) continue;
    const path = join(WORKFLOW_DIR, name);
    const triggers = triggersOf(readFileSync(path, "utf8"));
    const illegal = triggers.filter((t) => t !== "workflow_dispatch" && t !== "workflow_call");
    if (illegal.length > 0) {
      fail(
        path,
        `on: ${triggers.join(", ")}`,
        `晋升 workflow 出现自动触发器 (${illegal.join(", ")}) → GA 可被非人工触发`,
        ["移除自动触发器", "若确需自动化，改为触发 candidate 流程而非晋升流程"],
      );
    }
  }
}

// --------------------------------------------------------------- rule 2

/** A promotion workflow exposed via workflow_call is only safe if no auto-triggered
 *  workflow calls it — otherwise the manual-only trigger is bypassable. */
function checkCallChain(files) {
  const callable = PROMOTE_WORKFLOWS.filter(
    (n) => files.includes(n) && triggersOf(readFileSync(join(WORKFLOW_DIR, n), "utf8")).includes("workflow_call"),
  );
  if (callable.length === 0) return;

  for (const name of files) {
    if (RELEASE_WORKFLOWS.includes(name)) continue;
    const path = join(WORKFLOW_DIR, name);
    const text = readFileSync(path, "utf8");
    const auto = triggersOf(text).filter((t) => t !== "workflow_dispatch" && t !== "workflow_call");
    if (auto.length === 0) continue;
    for (const target of callable) {
      if (text.includes(target)) {
        fail(
          path,
          `触发器 ${auto.join(", ")}；引用了 ${target}`,
          `自动触发的 workflow 调用了可 workflow_call 的发布流程 → 绕过人工闸门`,
          [`移除对 ${target} 的调用`, `或删除 ${target} 的 workflow_call 触发器`],
        );
      }
    }
  }
}

// --------------------------------------------------------------- rule 3

function scanForPublishPatterns(path, text) {
  for (const { re, what } of PUBLISH_PATTERNS) {
    if (!re.test(text)) continue;
    fail(path, `匹配 ${re}`, `非发布 workflow/action ${what} → 对外承诺可在闸门之外产生`, [
      "把该动作移入发布 workflow",
      "若只是本地/临时用途，改用不产生对外承诺的形式",
    ]);
  }
}

function checkStrayPublishing(files) {
  for (const name of files) {
    if (RELEASE_WORKFLOWS.includes(name)) continue;
    const path = join(WORKFLOW_DIR, name);
    scanForPublishPatterns(path, readFileSync(path, "utf8"));
  }
  // .github/actions/** is invisible to workflowFiles() and therefore to the
  // rest of this file — a publish command placed here would never be caught
  // above. Composite actions carry no release identity of their own, so none
  // of them is ever exempt the way a RELEASE_WORKFLOWS entry is.
  for (const path of actionFiles()) {
    scanForPublishPatterns(path, readFileSync(path, "utf8"));
  }
}

// --------------------------------------------------------------- rule 4

function flagGovernanceChanges(changed) {
  if (!changed) return;
  const touched = changed.filter((f) => GOVERNANCE_PATHS.some((re) => re.test(f)));
  if (touched.length === 0) return;
  flag(touched[0], touched.join(", "), `本 PR 修改了发布授权面（${touched.length} 个文件），需人工过目`);
}

// --------------------------------------------------------------- report

function render() {
  const lines = [];
  if (errors.length === 0 && risks.length === 0) {
    lines.push("### ✅ 发布授权面无变更", "", "未检出自动触发器、旁路调用或越界发布动作。");
  }
  for (const e of errors) {
    lines.push(
      `### ❌ 发布授权面异常`,
      "",
      "```",
      `subject:  ${e.subject}`,
      `evidence: ${e.evidence}`,
      `判定:     ${e.verdict}`,
      `supportedFixes:`,
      ...e.fixes.map((f) => `          - ${f}`),
      "```",
      "",
    );
  }
  for (const r of risks) {
    lines.push(`### ⚠️ ${r.verdict}`, "", "```", `subject:  ${r.subject}`, `evidence: ${r.evidence}`, "```", "");
  }
  return lines.join("\n");
}

// ------------------------------------------------------------------ main

const files = workflowFiles();
checkReleaseTriggers(files);
checkCallChain(files);
checkStrayPublishing(files);
flagGovernanceChanges(changedFiles());

for (const a of annotations) console.log(a);
const body = render();
if (COMMENT_FILE) writeFileSync(COMMENT_FILE, body);
console.log("\n" + body);

if (errors.length > 0) {
  console.error(`\nrelease-governance: ${errors.length} hard failure(s)`);
  process.exit(1);
}
console.log(`\nrelease-governance: pass${risks.length ? ` (${risks.length} risk flag(s))` : ""}`);
