import os from "node:os";
import path from "node:path";

export function resolveProductPaths({
  platform = process.platform,
  env = process.env,
  homeDirectory = os.homedir(),
  pathApi = path,
} = {}) {
  if (platform === "darwin") {
    const root = pathApi.join(homeDirectory, "Library", "Application Support", "WSR");
    return { configPath: pathApi.join(root, "config.json"), stateDirectory: pathApi.join(root, "state") };
  }
  if (platform === "win32") {
    const configRoot = env.APPDATA ?? pathApi.join(homeDirectory, "AppData", "Roaming");
    const stateRoot = env.LOCALAPPDATA ?? pathApi.join(homeDirectory, "AppData", "Local");
    return {
      configPath: pathApi.join(configRoot, "WSR", "config.json"),
      stateDirectory: pathApi.join(stateRoot, "WSR", "state"),
    };
  }
  const configRoot = env.XDG_CONFIG_HOME ?? pathApi.join(homeDirectory, ".config");
  const stateRoot = env.XDG_STATE_HOME ?? pathApi.join(homeDirectory, ".local", "state");
  return {
    configPath: pathApi.join(configRoot, "wsr", "config.json"),
    stateDirectory: pathApi.join(stateRoot, "wsr"),
  };
}

export function resolveConfiguredStateDirectory({
  cliStateDirectory,
  configuredStateDirectory,
  defaultStateDirectory,
}) {
  return cliStateDirectory ?? configuredStateDirectory ?? defaultStateDirectory;
}
