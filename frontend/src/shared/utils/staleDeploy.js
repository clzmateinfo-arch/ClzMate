const RELOAD_GUARD_KEY = "clz:stale-deploy-reload";
const RELOAD_GUARD_MS = 60_000;
const CACHE_BUSTER_PARAM = "_r";

const CHUNK_LOAD_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk [\w-]+ failed/i,
  /Loading CSS chunk [\w-]+ failed/i,
  /Unable to preload CSS/i,
];

export function isChunkLoadError(error) {
  const message = typeof error === "string" ? error : error?.message;
  return typeof message === "string" && CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function withCacheBuster(url, now = Date.now()) {
  const parsed = new URL(url);
  parsed.searchParams.set(CACHE_BUSTER_PARAM, String(now));
  return parsed.toString();
}

export function stripCacheBuster(url) {
  const parsed = new URL(url);
  if (!parsed.searchParams.has(CACHE_BUSTER_PARAM)) return null;
  parsed.searchParams.delete(CACHE_BUSTER_PARAM);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function readGuard(storage) {
  try {
    return Number(storage?.getItem(RELOAD_GUARD_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeGuard(storage, now) {
  if (!storage) return false;
  try {
    storage.setItem(RELOAD_GUARD_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

export function recoverFromStaleDeploy({
  storage = typeof window === "undefined" ? null : window.sessionStorage,
  now = Date.now(),
  currentUrl = typeof window === "undefined" ? "" : window.location.href,
  navigate = (url) => window.location.replace(url),
} = {}) {
  if (!currentUrl) return false;
  if (now - readGuard(storage) < RELOAD_GUARD_MS) return false;
  if (!writeGuard(storage, now)) return false;
  navigate(withCacheBuster(currentUrl, now));
  return true;
}

export function removeCacheBusterFromAddressBar() {
  if (typeof window === "undefined") return;
  const cleaned = stripCacheBuster(window.location.href);
  if (cleaned) window.history.replaceState(window.history.state, "", cleaned);
}
