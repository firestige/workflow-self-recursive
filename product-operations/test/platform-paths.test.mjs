import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { resolveConfiguredStateDirectory, resolveProductPaths } from "../src/platform-paths.mjs";

test("product paths use stable OS locations instead of the current working directory", () => {
  assert.deepEqual(resolveProductPaths({
    platform: "darwin",
    env: {},
    homeDirectory: "/Users/alice",
  }), {
    configPath: "/Users/alice/Library/Application Support/WSR/config.json",
    stateDirectory: "/Users/alice/Library/Application Support/WSR/state",
  });

  assert.deepEqual(resolveProductPaths({
    platform: "linux",
    env: { XDG_CONFIG_HOME: "/config", XDG_STATE_HOME: "/state" },
    homeDirectory: "/home/alice",
  }), {
    configPath: "/config/wsr/config.json",
    stateDirectory: "/state/wsr",
  });

  assert.deepEqual(resolveProductPaths({
    platform: "win32",
    env: { APPDATA: "C:\\Users\\Alice\\Roaming", LOCALAPPDATA: "C:\\Users\\Alice\\Local" },
    homeDirectory: "C:\\Users\\Alice",
    pathApi: path.win32,
  }), {
    configPath: "C:\\Users\\Alice\\Roaming\\WSR\\config.json",
    stateDirectory: "C:\\Users\\Alice\\Local\\WSR\\state",
  });
});

test("explicit CLI state overrides config state, which overrides the platform default", () => {
  assert.equal(resolveConfiguredStateDirectory({
    cliStateDirectory: "/cli/state",
    configuredStateDirectory: "/config/state",
    defaultStateDirectory: "/default/state",
  }), "/cli/state");
  assert.equal(resolveConfiguredStateDirectory({
    configuredStateDirectory: "/config/state",
    defaultStateDirectory: "/default/state",
  }), "/config/state");
  assert.equal(resolveConfiguredStateDirectory({ defaultStateDirectory: "/default/state" }), "/default/state");
});
