import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const COORDINATE = /^(?:fixture|npm|ghcr|github-release):\/\/[^\s]+$/;

function canonical(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fail(message) {
  throw new Error(`Invalid compatibility manifest: ${message}`);
}

export async function loadCompatibilityManifest(manifestPath) {
  let document;
  try {
    document = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot load compatibility manifest ${manifestPath}: ${error.message}`);
  }

  if (document?.schema !== "wsr.compatibility@1.0.0") {
    fail("schema must be wsr.compatibility@1.0.0");
  }
  if (typeof document.release !== "string" || document.release.length === 0) {
    fail("release is required");
  }
  if (!Array.isArray(document.components) || document.components.length === 0) {
    fail("at least one component is required");
  }

  const seen = new Set();
  for (const component of document.components) {
    if (typeof component.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(component.id)) {
      fail("component id must be a stable kebab-case identifier");
    }
    if (seen.has(component.id)) {
      fail(`duplicate component ${component.id}`);
    }
    seen.add(component.id);
    if (typeof component.layer !== "string" || component.layer.length === 0) {
      fail(`component ${component.id} requires a result layer`);
    }
    if (!COORDINATE.test(component.coordinate ?? "")) {
      fail(`component ${component.id} requires an explicit artifact coordinate`);
    }
    if (!EXACT_VERSION.test(component.version ?? "")) {
      fail(`component ${component.id} requires an exact version; ranges and tags are forbidden`);
    }
    if (!SHA256.test(component.digest ?? "")) {
      fail(`component ${component.id} requires an exact sha256 digest`);
    }
  }

  const digest = `sha256:${createHash("sha256").update(canonical(document)).digest("hex")}`;
  return Object.freeze({ ...document, components: document.components.map(Object.freeze), digest });
}
