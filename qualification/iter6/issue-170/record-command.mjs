#!/usr/bin/env node
import { createHash } from "node:crypto";
import { appendFile, mkdir, realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const [recordFileInput, cwdInput, command, ...args] = process.argv.slice(2);
if (!recordFileInput || !cwdInput || !command) {
  throw new Error("usage: record-command.mjs <record-file> <cwd> <command> [args...]");
}
const recordFile = resolve(recordFileInput);
const cwd = await realpath(resolve(cwdInput));
await mkdir(dirname(recordFile), { recursive: true });
const stdoutHash = createHash("sha256");
const stderrHash = createHash("sha256");
const startedAt = new Date().toISOString();
const child = spawn(command, args, {
  cwd,
  env: process.env,
  stdio: [process.env.WSR_RECORD_STDIN === "inherit" ? "inherit" : "ignore", "pipe", "pipe"],
});
child.stdout.on("data", (chunk) => { stdoutHash.update(chunk); process.stdout.write(chunk); });
child.stderr.on("data", (chunk) => { stderrHash.update(chunk); process.stderr.write(chunk); });
const exitCode = await new Promise((accept, reject) => {
  child.once("error", reject);
  child.once("exit", (code, signal) => accept(code ?? (signal === null ? 1 : 128)));
});
const record = {
  command: [command, ...args],
  cwd,
  startedAt,
  finishedAt: new Date().toISOString(),
  exitCode,
  stdoutSha256: stdoutHash.digest("hex"),
  stderrSha256: stderrHash.digest("hex"),
};
await appendFile(recordFile, `${JSON.stringify(record)}\n`);
process.exitCode = exitCode;
