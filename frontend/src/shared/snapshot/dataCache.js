import { useEffect, useState } from "react";
import { axiosInstance } from "@/shared/services/api/apiConnector";
import { onSuccessfulMutation } from "@/shared/services/api/requestActivity";
import { apiScope, bundledSnapshot, bundledSnapshotTime } from "./bundled";
import { hasContent, hasExpectedShape, isContentMutationUrl, lookupInSnapshot, parseResourceKey } from "./resources";

const STORAGE_PREFIX = "clz:cache:";
const GIVE_UP_MS = 180_000;
const WATCH_INTERVAL_MS = 20_000;
const REMOTE_DELAY_MS = 1_200;
const REQUEST_TIMEOUT_MS = 150_000;
const HEALTH_TIMEOUT_MS = 15_000;
const REMOTE_TIMEOUT_MS = 20_000;
const MAX_PROBE_BACKOFF_MS = 6_000;
const MAX_NETWORK_RETRIES = 5;
const MAX_API_ERROR_ATTEMPTS = 3;
const BASE_URL = import.meta.env.VITE_APP_BASE_URL || "";
const SNAPSHOT_URL = import.meta.env.VITE_SNAPSHOT_URL || "";

const liveValues = new Map();
const keyListeners = new Map();
const inflightRevalidations = new Map();
const settledKeys = new Set();
const statusListeners = new Set();

let statusSnapshot = { pendingCount: 0, isWaking: false };
let liveProbe = null;
let isApiConfirmedLive = false;
let watcherId = null;
let hasWarmedUp = false;
let hasTriedRemote = false;
let remoteSnapshot = null;
let remoteSnapshotTime = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isBrowser = () => typeof window !== "undefined";

function updateStatus(patch) {
  statusSnapshot = { ...statusSnapshot, ...patch };
  statusListeners.forEach((listener) => listener());
}

export function subscribeToCacheStatus(listener) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export const getCacheStatus = () => statusSnapshot;

const storageKeyOf = (key) => `${STORAGE_PREFIX}${key}`;

function readEntry(key) {
  try {
    const raw = localStorage.getItem(storageKeyOf(key));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    const { definition } = parseResourceKey(key);
    const isValid =
      entry?.v === 1 &&
      typeof entry.fetchedAt === "number" &&
      entry.origin === apiScope &&
      hasExpectedShape(definition, entry.data) &&
      hasContent(entry.data);
    if (!isValid) {
      localStorage.removeItem(storageKeyOf(key));
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeEntry(key, data) {
  try {
    localStorage.setItem(storageKeyOf(key), JSON.stringify({ v: 1, fetchedAt: Date.now(), data, origin: apiScope }));
  } catch {
    return;
  }
}

function removeEntry(key) {
  try {
    localStorage.removeItem(storageKeyOf(key));
  } catch {
    return;
  }
}

function clearAllEntries() {
  try {
    Object.keys(localStorage)
      .filter((storageKey) => storageKey.startsWith(STORAGE_PREFIX))
      .forEach((storageKey) => localStorage.removeItem(storageKey));
  } catch {
    return;
  }
}

function bestCachedValue(key) {
  let best = null;
  const consider = (value, source, at) => {
    if (value === undefined || (source === "snapshot" && at === 0)) return;
    if (!best || at > best.at) best = { value, source, at };
  };
  consider(lookupInSnapshot(bundledSnapshot, key), "snapshot", bundledSnapshotTime);
  if (remoteSnapshot) consider(lookupInSnapshot(remoteSnapshot, key), "snapshot", remoteSnapshotTime);
  const entry = readEntry(key);
  if (entry) consider(entry.data, "cache", entry.fetchedAt);
  return best;
}

export function getResourceState(key) {
  if (liveValues.has(key)) {
    const { value } = liveValues.get(key);
    return { data: value, source: "live", isSettled: true, isNotFound: value === null };
  }
  const cached = bestCachedValue(key);
  if (cached) return { data: cached.value, source: cached.source, isSettled: true, isNotFound: false };
  return { data: undefined, source: "none", isSettled: settledKeys.has(key), isNotFound: false };
}

function emit(key) {
  keyListeners.get(key)?.forEach((listener) => listener());
}

function subscribeToKey(key, listener) {
  if (!keyListeners.has(key)) keyListeners.set(key, new Set());
  keyListeners.get(key).add(listener);
  return () => {
    const listeners = keyListeners.get(key);
    listeners?.delete(listener);
    if (listeners?.size === 0) keyListeners.delete(key);
  };
}

function markApiLive() {
  isApiConfirmedLive = true;
  if (statusSnapshot.isWaking) updateStatus({ isWaking: false });
}

function setLiveValue(key, value) {
  markApiLive();
  liveValues.set(key, { value });
  if (value !== null && hasContent(value)) writeEntry(key, value);
  else removeEntry(key);
  emit(key);
}

function classifyError(error) {
  if (error?.kind) return error.kind;
  const response = error?.response;
  if (!response) return "network";
  const contentType = String(response.headers?.["content-type"] || "");
  if ([502, 503, 504].includes(response.status) || !contentType.includes("application/json")) return "network";
  if (response.status >= 500) return "server";
  return "client";
}

async function fetchLiveValue(key) {
  const { param, definition } = parseResourceKey(key);
  const response = await axiosInstance({ ...definition.request(param), timeout: REQUEST_TIMEOUT_MS, skipActivityTracking: true });
  if (!response.data || typeof response.data !== "object") {
    throw Object.assign(new Error("Non-JSON response"), { kind: "network" });
  }
  const value = definition.pick(response.data);
  if (!hasExpectedShape(definition, value)) {
    throw Object.assign(new Error("Unexpected response shape"), { kind: definition.isParameterized ? "client" : "server" });
  }
  return value;
}

export function ensureApiLive() {
  if (liveProbe) return liveProbe;
  if (!isBrowser() || !BASE_URL) return Promise.resolve(false);
  isApiConfirmedLive = false;
  updateStatus({ isWaking: true });
  liveProbe = (async () => {
    const startedAt = Date.now();
    for (let attempt = 0; Date.now() - startedAt < GIVE_UP_MS; attempt += 1) {
      try {
        const response = await fetch(`${BASE_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
        const body = await response.json();
        if (response.ok && body?.success === true) return true;
      } catch {
        if (isApiConfirmedLive) return true;
      }
      if (isApiConfirmedLive) return true;
      await sleep(Math.min(1000 * 2 ** attempt, MAX_PROBE_BACKOFF_MS));
    }
    watchApi();
    return false;
  })().finally(() => {
    liveProbe = null;
    updateStatus({ isWaking: false });
  });
  return liveProbe;
}

function watchApi() {
  if (watcherId || !isBrowser()) return;
  watcherId = setInterval(async () => {
    if (document.hidden) return;
    try {
      const response = await fetch(`${BASE_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      const body = await response.json();
      if (response.ok && body?.success === true) {
        clearInterval(watcherId);
        watcherId = null;
        revalidateActiveKeys();
      }
    } catch {
      return;
    }
  }, WATCH_INTERVAL_MS);
}

async function fingerprint(value) {
  if (!globalThis.crypto?.subtle) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

export function isValidSnapshotDocument(candidate) {
  return (
    candidate?.version === 1 &&
    candidate.resources !== null &&
    typeof candidate.resources === "object" &&
    Number.isFinite(Date.parse(candidate.generatedAt)) &&
    typeof candidate.hash === "string"
  );
}

async function loadRemoteSnapshot() {
  if (hasTriedRemote || !SNAPSHOT_URL || !isBrowser()) return;
  hasTriedRemote = true;
  try {
    const response = await fetch(SNAPSHOT_URL, { cache: "no-cache", signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS) });
    if (!response.ok) return;
    const remote = await response.json();
    if (!isValidSnapshotDocument(remote)) return;
    const computedHash = await fingerprint(remote.resources);
    if (computedHash !== null && computedHash !== remote.hash) return;
    const generatedAt = Date.parse(remote.generatedAt);
    if (generatedAt <= bundledSnapshotTime) return;
    remoteSnapshot = remote;
    remoteSnapshotTime = generatedAt;
    for (const key of keyListeners.keys()) {
      if (!liveValues.has(key)) emit(key);
    }
  } catch {
    return;
  }
}

export function warmUpApi() {
  if (hasWarmedUp || !isBrowser()) return;
  hasWarmedUp = true;
  void ensureApiLive();
  setTimeout(() => {
    if (liveValues.size === 0) void loadRemoteSnapshot();
  }, REMOTE_DELAY_MS);
}

export function revalidate(key) {
  if (inflightRevalidations.has(key)) return inflightRevalidations.get(key);
  const task = (async () => {
    updateStatus({ pendingCount: statusSnapshot.pendingCount + 1 });
    const startedAt = Date.now();
    let networkRetries = 0;
    let apiErrors = 0;
    try {
      while (Date.now() - startedAt < GIVE_UP_MS) {
        try {
          setLiveValue(key, await fetchLiveValue(key));
          return;
        } catch (error) {
          const kind = classifyError(error);
          if (kind === "client" && parseResourceKey(key).definition.isParameterized) {
            setLiveValue(key, null);
            return;
          }
          if (kind === "network") {
            networkRetries += 1;
            if (networkRetries > MAX_NETWORK_RETRIES || !(await ensureApiLive())) break;
            continue;
          }
          apiErrors += 1;
          if (apiErrors >= MAX_API_ERROR_ATTEMPTS) break;
          await sleep(2000 * apiErrors);
        }
      }
    } finally {
      inflightRevalidations.delete(key);
      settledKeys.add(key);
      updateStatus({ pendingCount: Math.max(0, statusSnapshot.pendingCount - 1) });
      emit(key);
    }
  })();
  inflightRevalidations.set(key, task);
  return task;
}

function revalidateActiveKeys({ onlyWithoutLive = false } = {}) {
  for (const key of keyListeners.keys()) {
    if (!onlyWithoutLive || !liveValues.has(key)) void revalidate(key);
  }
}

export function invalidatePublicCache() {
  clearAllEntries();
  for (const key of [...liveValues.keys()]) {
    if (!keyListeners.has(key)) liveValues.delete(key);
  }
  revalidateActiveKeys();
}

if (isBrowser()) {
  onSuccessfulMutation((method, url) => {
    if (isContentMutationUrl(url)) invalidatePublicCache();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) revalidateActiveKeys({ onlyWithoutLive: true });
  });
  window.addEventListener("online", () => revalidateActiveKeys({ onlyWithoutLive: true }));
}

export async function getPublicResource(key) {
  warmUpApi();
  const current = getResourceState(key);
  if (current.data !== undefined) {
    void revalidate(key);
    return current.data;
  }
  await revalidate(key);
  return getResourceState(key).data;
}

const EMPTY_STATE = { data: undefined, source: "none", isSettled: true, isNotFound: false };

export function usePublicResource(key) {
  const [state, setState] = useState(() => (key ? getResourceState(key) : EMPTY_STATE));

  useEffect(() => {
    if (!key) {
      setState(EMPTY_STATE);
      return undefined;
    }
    const refresh = () => setState(getResourceState(key));
    refresh();
    const unsubscribe = subscribeToKey(key, refresh);
    warmUpApi();
    void revalidate(key);
    return unsubscribe;
  }, [key]);

  return state;
}
