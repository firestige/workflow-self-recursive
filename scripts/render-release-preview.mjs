#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isThirdPartyPrereleaseField } from "./release-content-policy.mjs";

const PRERELEASE = /-(?:rc|dev|alpha|beta|canary|snapshot|preview)\b/i;

function identity(manifest) {
  if (manifest?.schemaVersion === "wsr.compose-release@1.0.0" && typeof manifest.version === "string") {
    return { kind: "compose", version: manifest.version };
  }
  if (manifest?.schema === "wsr.compatibility@1.0.0" && typeof manifest.release === "string") {
    return { kind: "product", version: manifest.release };
  }
  throw new Error("unsupported release manifest schema");
}

const baseVersion = (version) => version.replace(/-rc\.\d+$/, "");
const digestFrom = (value) => value.digest ?? value.sha256 ?? value.coordinate?.match(/@(sha256:[a-f0-9]{64})$/i)?.[1] ?? "(none)";

function coordinateVersion(value) {
  if (typeof value.version === "string") return value.version;
  const coordinate = value.coordinate ?? "";
  const withoutDigest = coordinate.replace(/@sha256:[a-f0-9]{64}$/i, "");
  const slash = withoutDigest.lastIndexOf("/");
  const colon = withoutDigest.lastIndexOf(":");
  return colon > slash ? withoutDigest.slice(colon + 1) : "(not declared)";
}

function productCoordinates(component, prefix = component.id, root = true) {
  const rows = [];
  if (typeof component?.coordinate === "string") {
    rows.push({
      component: prefix,
      version: coordinateVersion(component),
      coordinate: component.coordinate,
      digest: digestFrom(component),
    });
  }
  for (const [key, value] of Object.entries(component ?? {})) {
    if (root && ["id", "layer", "version", "coordinate", "downloadUrl", "digest", "sha256"].includes(key)) continue;
    if (!root && ["version", "coordinate", "downloadUrl", "digest", "sha256"].includes(key)) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      rows.push(...productCoordinates(value, `${prefix}.${key}`, false));
    }
  }
  return rows;
}

function coordinates(manifest) {
  const { kind } = identity(manifest);
  if (kind === "compose") {
    return Object.entries(manifest.images ?? {}).map(([name, value]) => ({
      component: `image.${name}`,
      version: coordinateVersion(value),
      coordinate: value.coordinate ?? "(none)",
      digest: digestFrom(value),
    }));
  }
  return (manifest.components ?? []).flatMap((component) => productCoordinates(component));
}

function residues(manifest) {
  const found = [];
  const visit = (value, segments = []) => {
    if (typeof value === "string") {
      if (segments.length === 1 && ["version", "release"].includes(segments[0])) return;
      if (isThirdPartyPrereleaseField(manifest, segments)) return;
      if (PRERELEASE.test(value)) found.push({ path: segments.join("."), value });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...segments, String(index)]));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, item]) => visit(item, [...segments, key]));
    }
  };
  visit(manifest);
  return found;
}

const cell = (value) => `\`${String(value).replaceAll("|", "\\|")}\``;
const coordinateCell = (row) => `${row.coordinate} (${row.digest})`;

export function renderReleasePreview(manifest, comparisonManifests = []) {
  const selected = identity(manifest);
  if (!/-rc\.\d+$/.test(selected.version)) throw new Error("release preview requires an rc manifest");
  const selectedBase = baseVersion(selected.version);
  const comparisons = comparisonManifests.map((value) => ({ manifest: value, ...identity(value) }));
  for (const comparison of comparisons) {
    if (comparison.kind !== selected.kind || baseVersion(comparison.version) !== selectedBase) {
      throw new Error(`comparison candidate ${comparison.kind}-${comparison.version} does not share ${selected.kind}-${selectedBase}`);
    }
  }

  const selectedRows = coordinates(manifest);
  const prerelease = residues(manifest);
  const lines = [
    `# Release preview: ${selected.kind}-${selected.version}`,
    "",
    `Selected candidate: \`${selected.kind}-${selected.version}\``,
    "",
    "## Proposed GA coordinate inventory",
    "",
    "| Component | Version | Coordinate | Digest |",
    "|---|---|---|---|",
    ...selectedRows.map((row) => `| ${cell(row.component)} | ${cell(row.version)} | ${cell(row.coordinate)} | ${cell(row.digest)} |`),
    "",
    "## Promotion check",
    "",
    `Projected GA identity: \`${selected.kind}-${selectedBase}\``,
    "",
    "Content diff from selected rc: empty (root release identity excluded).",
    "",
    prerelease.length === 0 ? "GA readiness: READY — no prerelease residue outside the rc identity." : "GA readiness: BLOCKED — prerelease residue remains outside the rc identity.",
    "",
  ];
  if (prerelease.length > 0) {
    lines.push("| Manifest path | Residue |", "|---|---|", ...prerelease.map((item) => `| ${cell(item.path)} | ${cell(item.value)} |`), "");
  }

  lines.push("## Parallel candidate comparison", "");
  const candidates = [...comparisons, { manifest, ...selected }]
    .sort((left, right) => left.version.localeCompare(right.version, "en", { numeric: true }));
  if (candidates.length === 1) {
    lines.push("No other rc manifest for this base version is present.", "");
  } else {
    const byCandidate = candidates.map((candidate) => new Map(coordinates(candidate.manifest).map((row) => [row.component, coordinateCell(row)])));
    const components = [...new Set(byCandidate.flatMap((rows) => [...rows.keys()]))].sort();
    lines.push(
      `| Component | ${candidates.map((candidate) => cell(`${candidate.kind}-${candidate.version}${candidate.version === selected.version ? " (selected)" : ""}`)).join(" | ")} |`,
      `|---|${candidates.map(() => "---").join("|")}|`,
      ...components.map((component) => `| ${cell(component)} | ${byCandidate.map((rows) => cell(rows.get(component) ?? "(absent)")).join(" | ")} |`),
      "",
    );
  }
  return `${lines.join("\n")}\n`;
}

async function main(args) {
  let manifestPath;
  let outputPath;
  const comparisonPaths = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--manifest") manifestPath = args[++index];
    else if (args[index] === "--compare") comparisonPaths.push(args[++index]);
    else if (args[index] === "--output") outputPath = args[++index];
    else throw new Error(`unknown argument: ${args[index]}`);
  }
  if (!manifestPath) throw new Error("usage: render-release-preview --manifest FILE [--compare FILE]... [--output FILE]");
  const manifest = JSON.parse(await readFile(path.resolve(manifestPath), "utf8"));
  const comparisons = await Promise.all(comparisonPaths.map(async (file) => JSON.parse(await readFile(path.resolve(file), "utf8"))));
  const preview = renderReleasePreview(manifest, comparisons);
  if (outputPath) await writeFile(path.resolve(outputPath), preview);
  else process.stdout.write(preview);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
