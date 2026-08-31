#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { realpath } from "node:fs/promises";

const [originInput, workspaceInput] = process.argv.slice(2);
if (originInput === undefined || workspaceInput === undefined) {
  throw new Error("usage: register-acceptance-workspace.mjs ORIGIN WORKSPACE");
}
const origin = new URL(originInput);
if (origin.protocol !== "http:" || origin.hostname !== "127.0.0.1" || origin.pathname !== "/") {
  throw new Error("acceptance Host origin must be loopback HTTP");
}
const workspace = await realpath(workspaceInput);

async function create() {
  const rpcId = randomUUID();
  const response = await fetch(new URL("/api/workspace.create", origin), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "client-request", rpcId, method: "workspace.create", payload: { path: workspace } }),
  });
  if (!response.ok) throw new Error(`workspace.create HTTP ${response.status}`);
  const envelope = await response.json();
  if (envelope.rpcId !== rpcId || envelope.result?.ok !== true) {
    throw new Error(`workspace.create failed: ${JSON.stringify(envelope.result?.error)}`);
  }
  return envelope.result.value;
}

const deadline = Date.now() + 30_000;
let lastError;
while (Date.now() < deadline) {
  try {
    const result = await create();
    process.stdout.write(`${JSON.stringify({ workspace, result })}\n`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
throw new Error(`acceptance workspace registration timed out: ${lastError?.message ?? "unknown error"}`);
