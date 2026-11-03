import neutralSnapshot from "./neutral.json";

const generatedModules = import.meta.glob("./bundled.json", { eager: true, import: "default" });

export const originOf = (url) =>
  String(url || "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "")
    .replace(/\/api(\/v\d+)?$/, "");

export const apiScope = originOf(import.meta.env.VITE_APP_BASE_URL);

export function pickBundledSnapshot(candidate, currentApiScope = apiScope) {
  const isValid =
    candidate &&
    candidate.version === 1 &&
    candidate.resources &&
    typeof candidate.resources === "object" &&
    Number.isFinite(Date.parse(candidate.generatedAt));
  if (!isValid) return { snapshot: neutralSnapshot, isForeign: false };
  if (candidate.source && originOf(candidate.source) !== currentApiScope) {
    return { snapshot: neutralSnapshot, isForeign: true };
  }
  return { snapshot: candidate, isForeign: false };
}

const picked = pickBundledSnapshot(generatedModules["./bundled.json"]);

export const bundledSnapshot = picked.snapshot;
export const isBundledForeign = picked.isForeign;
export const bundledSnapshotTime = Date.parse(bundledSnapshot.generatedAt) || 0;
