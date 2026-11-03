import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "src/shared/snapshot/bundled.json");
const env = loadEnv(process.env.SNAPSHOT_MODE || "production", projectRoot, "");

const REQUIRED_RESOURCES = ["categories", "newCourses", "popularCourses", "reviews", "stats", "course", "catalog"];
const attempts = Number(env.SNAPSHOT_ATTEMPTS) || 5;
const timeoutMs = Number(env.SNAPSHOT_TIMEOUT_MS) || 45_000;
const isForcedOffline = env.SNAPSHOT_FORCE_OFFLINE === "1";
const apiBase = String(env.VITE_APP_BASE_URL || "").replace(/\/+$/, "");
const remoteUrl = String(env.VITE_SNAPSHOT_URL || "");

export const originOf = (url) =>
  String(url || "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "")
    .replace(/\/api(\/v\d+)?$/, "");

const hashOf = (resources) => createHash("sha256").update(JSON.stringify(resources)).digest("hex").slice(0, 12);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const log = (message) => console.log(`[snapshot] ${message}`);

export function validateSnapshot(candidate) {
  if (!candidate || candidate.version !== 1) return "version is not 1";
  if (!candidate.resources || typeof candidate.resources !== "object") return "resources missing";
  if (!Number.isFinite(Date.parse(candidate.generatedAt))) return "generatedAt invalid";
  const missing = REQUIRED_RESOURCES.filter((key) => !(key in candidate.resources));
  if (missing.length) return `missing resources: ${missing.join(", ")}`;
  if (candidate.hash !== hashOf(candidate.resources)) return "hash mismatch";
  return null;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fromLiveApi() {
  if (!apiBase) throw new Error("VITE_APP_BASE_URL is not set");
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const body = await fetchJson(`${apiBase}/snapshot`);
      const problem = validateSnapshot(body?.data);
      if (problem) throw new Error(`invalid snapshot from API: ${problem}`);
      return body.data;
    } catch (error) {
      lastError = error;
      log(`live attempt ${attempt}/${attempts} failed: ${error.message}`);
      if (attempt < attempts) await sleep(Math.min(3000 * 2 ** (attempt - 1), 20_000));
    }
  }
  throw lastError;
}

async function fromCloudinary() {
  if (!remoteUrl) throw new Error("VITE_SNAPSHOT_URL is not set");
  const snapshot = await fetchJson(remoteUrl);
  const problem = validateSnapshot(snapshot);
  if (problem) throw new Error(`invalid Cloudinary snapshot: ${problem}`);
  return snapshot;
}

function fromPreviousBundle() {
  if (!existsSync(outputPath)) throw new Error("no previous bundle");
  const previous = JSON.parse(readFileSync(outputPath, "utf8"));
  const problem = validateSnapshot(previous);
  if (problem) throw new Error(`previous bundle invalid: ${problem}`);
  if (originOf(previous.source) !== originOf(apiBase)) throw new Error("previous bundle belongs to a different API");
  return previous;
}

async function main() {
  const tiers = [
    ["live", fromLiveApi],
    ["cloudinary", fromCloudinary],
    ["previous-bundle", fromPreviousBundle],
  ];
  for (const [label, load] of tiers) {
    if (isForcedOffline && label !== "previous-bundle") {
      log(`${label}: skipped (SNAPSHOT_FORCE_OFFLINE=1)`);
      continue;
    }
    try {
      const snapshot = await load();
      writeFileSync(outputPath, JSON.stringify({ ...snapshot, source: originOf(apiBase) }));
      const courseCount = Object.keys(snapshot.resources.course || {}).length;
      log(`SOURCE=${label} hash=${snapshot.hash} generatedAt=${snapshot.generatedAt} courses=${courseCount}`);
      return;
    } catch (error) {
      log(`${label}: ${error.message}`);
    }
  }
  if (existsSync(outputPath)) rmSync(outputPath);
  log("SOURCE=neutral-seed (no snapshot available; the site will rely on live data)");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    log(`unexpected error, continuing build without snapshot: ${error.message}`);
  });
}
