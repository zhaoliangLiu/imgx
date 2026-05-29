import os from "node:os";
import path from "node:path";

export function expandHome(value: string): string {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

export function userConfigPath(): string {
  return path.join(os.homedir(), ".config", "imgx", "config.json");
}

export function projectConfigPath(cwd = process.cwd()): string {
  return path.join(cwd, "imgx.config.json");
}

export function defaultDbPath(): string {
  return path.join(os.homedir(), ".imgx", "imgx.db");
}

export function defaultCacheDir(): string {
  return path.join(os.homedir(), ".imgx", "cache");
}

