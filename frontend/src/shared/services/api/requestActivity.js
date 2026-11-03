const activeRequests = new Map();
const activityListeners = new Set();
const mutationListeners = new Set();
let nextRequestId = 1;

const notifyActivity = () => activityListeners.forEach((listener) => listener());

export function markRequestStart() {
  const requestId = nextRequestId++;
  activeRequests.set(requestId, Date.now());
  notifyActivity();
  return requestId;
}

export function markRequestEnd(requestId) {
  if (activeRequests.delete(requestId)) notifyActivity();
}

export function getOldestRequestStart() {
  let oldest = null;
  for (const startedAt of activeRequests.values()) {
    if (oldest === null || startedAt < oldest) oldest = startedAt;
  }
  return oldest;
}

export function subscribeToRequestActivity(listener) {
  activityListeners.add(listener);
  return () => activityListeners.delete(listener);
}

export function onSuccessfulMutation(listener) {
  mutationListeners.add(listener);
  return () => mutationListeners.delete(listener);
}

export function notifySuccessfulMutation(method, url) {
  mutationListeners.forEach((listener) => {
    try {
      listener(method, url);
    } catch (error) {
      console.error("Mutation listener failed", error);
    }
  });
}
