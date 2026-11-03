import { useEffect, useState, useSyncExternalStore } from "react";
import { getCacheStatus, subscribeToCacheStatus, warmUpApi } from "@/shared/snapshot/dataCache";
import { getOldestRequestStart, subscribeToRequestActivity } from "@/shared/services/api/requestActivity";

const SLOW_REQUEST_MS = 3_000;
const SHOW_DELAY_MS = 1_500;
const TICK_MS = 500;

export default function ServerStatusIndicator() {
  const cacheStatus = useSyncExternalStore(subscribeToCacheStatus, getCacheStatus);
  const oldestRequestStart = useSyncExternalStore(subscribeToRequestActivity, getOldestRequestStart);
  const [busySince, setBusySince] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const isBusy = cacheStatus.isWaking || cacheStatus.pendingCount > 0 || oldestRequestStart !== null;

  useEffect(() => {
    warmUpApi();
  }, []);

  useEffect(() => {
    setBusySince((current) => (isBusy ? current ?? Date.now() : null));
  }, [isBusy]);

  useEffect(() => {
    if (!isBusy) return undefined;
    const intervalId = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(intervalId);
  }, [isBusy]);

  const hasSlowRequest = oldestRequestStart !== null && now - oldestRequestStart >= SLOW_REQUEST_MS;
  const isShowing = busySince !== null && now - busySince >= SHOW_DELAY_MS;
  const isWaking = cacheStatus.isWaking || hasSlowRequest;

  if (!isShowing || (!isWaking && cacheStatus.pendingCount === 0)) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-[1000] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-white/40 bg-white/90 px-4 py-2 text-sm text-richblack-700 shadow-lg backdrop-blur-md"
    >
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-purple-200" aria-hidden />
      {isWaking ? "Waking up the server, this can take up to a minute on the first visit…" : "Updating content…"}
    </div>
  );
}
