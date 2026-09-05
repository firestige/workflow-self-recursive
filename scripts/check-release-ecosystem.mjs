#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const configPath = path.resolve(process.argv[2] || "release/governance-topology.json");
const root = process.cwd();
const errors = [];

function fail(file, verdict) {
  errors.push(`${file}: ${verdict}`);
  process.stdout.write(`::error file=${file}::${verdict}\n`);
}

function triggersOf(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => /^on:/.test(line));
  if (start < 0) return [];
  const inline = lines[start].slice(3).trim();
  if (inline) return inline.replace(/^[[{]|[\]}]$/g, "").split(",").map((value) => value.split(":")[0].trim()).filter(Boolean);
  const found = [];
  let depth = null;
  for (const line of lines.slice(start + 1)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const indent = line.match(/^\s*/)[0].length;
    if (indent === 0) break;
    if (depth === null) depth = indent;
    if (indent !== depth) continue;
    const match = line.trim().match(/^([A-Za-z_]+):/);
    if (match) found.push(match[1]);
  }
  return found;
}

function yamlFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.ya?ml$/.test(entry.name)) files.push(full);
    }
  };
  walk(directory);
  return files;
}

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch (error) {
  fail(path.relative(root, configPath), `cannot read topology: ${error.message}`);
  config = null;
}

if (config) {
  if (config.schemaVersion !== "wsr.release-topology@1.0.0" || !Array.isArray(config.repositories) || config.repositories.length === 0) {
    fail(path.relative(root, configPath), "invalid release topology schema");
  } else {
    for (const repository of config.repositories) {
      const repo = path.resolve(root, repository.path || "");
      const label = repository.path || ".";
      if (!existsSync(repo)) {
        fail(label, "configured repository is absent; submodules must be checked out");
        continue;
      }
      const candidatePath = path.join(repo, repository.candidate || "");
      if (!existsSync(candidatePath)) {
        fail(path.join(label, repository.candidate || ""), "configured candidate workflow is absent");
      } else {
        const text = readFileSync(candidatePath, "utf8");
        const triggers = triggersOf(text);
        const releaseNext = /^  push:\s*$[\s\S]*?^    branches:\s*(?:\n\s*-\s*release\/next\s*$|\[\s*release\/next\s*\])/m.test(text);
        if (triggers.length !== 1 || triggers[0] !== "push" || !releaseNext) {
          fail(path.relative(root, candidatePath), "candidate must only run on release/next push");
        }
      }
      for (const relative of repository.promotions || []) {
        const promotionPath = path.join(repo, relative);
        if (!existsSync(promotionPath)) {
          fail(path.join(label, relative), "configured promotion workflow is absent");
          continue;
        }
        const triggers = triggersOf(readFileSync(promotionPath, "utf8"));
        if (triggers.length !== 1 || triggers[0] !== "workflow_dispatch") {
          fail(path.relative(root, promotionPath), "promotion must only expose workflow_dispatch");
        }
      }

      const surfaces = [path.join(repo, ".github", "workflows"), path.join(repo, ".github", "actions")].flatMap(yamlFiles);
      for (const surface of surfaces) {
        const text = readFileSync(surface, "utf8");
        const node20 = [
          /actions\/checkout@v4\b/,
          /actions\/setup-node@v4\b/,
          /actions\/upload-artifact@v4\b/,
          /actions\/create-github-app-token@v2\b/,
          /docker\/setup-buildx-action@v3\b/,
          /docker\/setup-buildx-action@8d2750c68a42422c14e847fe6c8ac0403b4cbd6f/,
        ];
        if (node20.some((pattern) => pattern.test(text))) fail(path.relative(root, surface), "known Node 20 action reference");
        if (/actions\/create-github-app-token@/.test(text) && /^\s*app-id:/m.test(text)) {
          fail(path.relative(root, surface), "deprecated create-github-app-token app-id input");
        }
        if (surface.endsWith("/ci.yml") && /uses:\s*\.\/\.github\/workflows\/release-candidate\.yml/.test(text)) {
          fail(path.relative(root, surface), "ordinary CI can call the candidate publisher");
        }
      }
    }
  }
}

if (errors.length > 0) {
  process.stdout.write(`release ecosystem: FAIL (${errors.length})\n`);
  process.exit(1);
}
process.stdout.write(`release ecosystem: PASS (${config.repositories.length} repositories)\n`);
