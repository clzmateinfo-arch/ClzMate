const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;

require("../models/user");
require("../models/profile");
require("../models/section");
require("../models/subSection");
require("../models/ratingAndReview");
const Course = require("../models/course");
const Category = require("../models/category");
const { showAllCategories, getCategoryPageDetails } = require("../controllers/category");
const { getAllCourses, getCourseDetails } = require("../controllers/course");
const { getAllRatingReview } = require("../controllers/ratingAndReview");
const { getSiteStats, resetStatsCache } = require("../controllers/stats");

const SNAPSHOT_VERSION = 1;
const DEFAULT_DEBOUNCE_MS = 8000;
const DEFAULT_REBUILD_DEBOUNCE_MS = 5 * 60 * 1000;
const SNAPSHOT_CACHE_MS = 60 * 1000;
const PUBLISHED_FETCH_TIMEOUT_MS = 15000;

const snapshotRoot = () =>
  (process.env.SNAPSHOT_FOLDER || process.env.FOLDER_NAME || "clzmate").replace(/[^a-zA-Z0-9_-]/g, "") || "clzmate";

const snapshotPublicId = () => `${snapshotRoot()}/snapshot/snapshot.json`;

const isCloudinaryConfigured = () =>
  Boolean(process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET);

const publishedSnapshotUrl = () =>
  process.env.CLOUD_NAME ? `https://res.cloudinary.com/${process.env.CLOUD_NAME}/raw/upload/${snapshotPublicId()}` : null;

const hashResources = (resources) =>
  crypto.createHash("sha256").update(JSON.stringify(resources)).digest("hex").slice(0, 12);

async function runController(handler, { query = {}, body = {} } = {}) {
  let status = 200;
  let payload;
  const res = {
    status(code) {
      status = code;
      return res;
    },
    json(value) {
      payload = value;
      return res;
    },
    set() {
      return res;
    },
    setHeader() {
      return res;
    },
  };
  await handler({ query, body, params: {}, headers: {}, cookies: {} }, res);
  return { status, payload };
}

async function requireData(handler, input, label) {
  const { status, payload } = await runController(handler, input);
  if (status >= 400 || !payload || payload.success !== true || payload.data === undefined) {
    throw new Error(`snapshot source "${label}" failed (HTTP ${status}${payload?.message ? `: ${payload.message}` : ""})`);
  }
  return payload.data;
}

async function optionalData(handler, input, label) {
  const { status, payload } = await runController(handler, input);
  if (status === 200 && payload?.success === true) return payload;
  if (status === 400 || status === 404) return null;
  throw new Error(`snapshot source "${label}" failed (HTTP ${status}${payload?.message ? `: ${payload.message}` : ""})`);
}

async function buildSnapshot() {
  resetStatsCache();

  const [categories, newCourses, popularCourses, stats, reviews] = await Promise.all([
    requireData(showAllCategories, {}, "categories"),
    requireData(getAllCourses, { query: { page: "1", limit: "3" } }, "newCourses"),
    requireData(getAllCourses, { query: { page: "1", limit: "3", sort: "popular" } }, "popularCourses"),
    requireData(getSiteStats, {}, "stats"),
    requireData(getAllRatingReview, { query: {} }, "reviews"),
  ]);

  const [publishedCourseIds, categoryIds] = await Promise.all([
    Course.find({ status: "Published" }).distinct("_id"),
    Category.find({}).distinct("_id"),
  ]);

  const course = {};
  for (const courseId of publishedCourseIds) {
    const payload = await optionalData(getCourseDetails, { body: { courseId: String(courseId) } }, `course ${courseId}`);
    if (payload) course[String(courseId)] = payload;
  }

  const catalog = {};
  for (const categoryId of categoryIds) {
    const payload = await optionalData(getCategoryPageDetails, { body: { categoryId: String(categoryId) } }, `catalog ${categoryId}`);
    if (payload) catalog[String(categoryId)] = { selectedCategory: payload.data.selectedCategory };
  }

  const resources = {
    categories,
    newCourses: newCourses.courses ?? [],
    popularCourses: popularCourses.courses ?? [],
    stats,
    reviews,
    course,
    catalog,
  };

  if (!Array.isArray(resources.categories) || !resources.stats || typeof resources.stats !== "object") {
    throw new Error("refusing to publish: snapshot is missing categories or stats");
  }

  const plain = JSON.parse(JSON.stringify(resources));
  return {
    version: SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    hash: hashResources(plain),
    resources: plain,
  };
}

async function uploadToCloudinary(snapshot) {
  const encoded = Buffer.from(JSON.stringify(snapshot)).toString("base64");
  return cloudinary.uploader.upload(`data:application/json;base64,${encoded}`, {
    resource_type: "raw",
    type: "upload",
    public_id: snapshotPublicId(),
    overwrite: true,
    invalidate: true,
  });
}

async function fetchPublishedSnapshot() {
  const url = publishedSnapshotUrl();
  if (!url) return null;
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(PUBLISHED_FETCH_TIMEOUT_MS) });
  if (!response.ok) return null;
  return response.json();
}

async function triggerFrontendRebuild() {
  const hookUrl = process.env.RENDER_DEPLOY_HOOK_URL;
  if (!hookUrl) return { skipped: "deploy-hook-not-configured" };
  const response = await fetch(hookUrl, { method: "POST", signal: AbortSignal.timeout(PUBLISHED_FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`deploy hook returned HTTP ${response.status}`);
  return { triggered: true };
}

function createSnapshotPublisher({
  build = buildSnapshot,
  upload = uploadToCloudinary,
  fetchPublished = fetchPublishedSnapshot,
  isEnabled = isCloudinaryConfigured,
  rebuildFrontend = triggerFrontendRebuild,
  debounceMs = Number(process.env.SNAPSHOT_DEBOUNCE_MS) || DEFAULT_DEBOUNCE_MS,
  rebuildDebounceMs = Number(process.env.DEPLOY_HOOK_DEBOUNCE_MS) || DEFAULT_REBUILD_DEBOUNCE_MS,
  logger = console,
} = {}) {
  let rebuildTimer = null;

  function scheduleFrontendRebuild() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => {
      rebuildTimer = null;
      rebuildFrontend()
        .then((result) => {
          if (result?.triggered) logger.log("[snapshot] frontend rebuild triggered");
        })
        .catch((error) => logger.error("[snapshot] frontend rebuild failed:", error.message));
    }, rebuildDebounceMs);
    rebuildTimer.unref?.();
  }

  let lastPublishedHash = null;
  let lastResult = null;
  let runningPublish = null;
  let hasQueuedPublish = false;
  let debounceTimer = null;
  let cachedSnapshot = null;
  let cachedSnapshotAt = 0;
  let runningBuild = null;

  async function getSnapshot({ fresh = false } = {}) {
    if (!fresh && cachedSnapshot && Date.now() - cachedSnapshotAt < SNAPSHOT_CACHE_MS) return cachedSnapshot;
    if (runningBuild) return runningBuild;
    runningBuild = (async () => {
      try {
        const snapshot = await build();
        cachedSnapshot = snapshot;
        cachedSnapshotAt = Date.now();
        return snapshot;
      } finally {
        runningBuild = null;
      }
    })();
    return runningBuild;
  }

  function publish({ force = false } = {}) {
    if (!isEnabled()) return Promise.resolve({ skipped: "cloudinary-not-configured" });
    if (runningPublish) {
      hasQueuedPublish = true;
      return runningPublish;
    }
    runningPublish = (async () => {
      try {
        const snapshot = await getSnapshot({ fresh: true });
        if (!force && snapshot.hash === lastPublishedHash) {
          lastResult = { skipped: "unchanged", hash: snapshot.hash, at: new Date().toISOString() };
          return lastResult;
        }
        await upload(snapshot);
        lastPublishedHash = snapshot.hash;
        lastResult = {
          published: true,
          hash: snapshot.hash,
          generatedAt: snapshot.generatedAt,
          bytes: Buffer.byteLength(JSON.stringify(snapshot)),
          url: publishedSnapshotUrl(),
        };
        logger.log(`[snapshot] published ${lastResult.hash} (${Math.round(lastResult.bytes / 1024)} KB)`);
        scheduleFrontendRebuild();
        return lastResult;
      } catch (error) {
        lastResult = { error: error.message, at: new Date().toISOString() };
        throw error;
      } finally {
        runningPublish = null;
        if (hasQueuedPublish) {
          hasQueuedPublish = false;
          schedule();
        }
      }
    })();
    return runningPublish;
  }

  function invalidate() {
    cachedSnapshot = null;
  }

  function schedule() {
    invalidate();
    if (!isEnabled()) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      publish().catch((error) => logger.error("[snapshot] publish failed:", error.message));
    }, debounceMs);
    debounceTimer.unref?.();
  }

  async function syncOnBoot() {
    if (!isEnabled()) return { skipped: "cloudinary-not-configured" };
    try {
      const published = await fetchPublished();
      lastPublishedHash = published?.hash || null;
    } catch (error) {
      logger.error("[snapshot] could not read published snapshot:", error.message);
    }
    return publish();
  }

  function status() {
    return {
      enabled: isEnabled(),
      url: publishedSnapshotUrl(),
      lastPublishedHash,
      lastResult,
      isPublishing: Boolean(runningPublish),
      isScheduled: Boolean(debounceTimer),
    };
  }

  function cancelScheduled() {
    clearTimeout(debounceTimer);
    clearTimeout(rebuildTimer);
    debounceTimer = null;
    rebuildTimer = null;
  }

  return { getSnapshot, publish, schedule, invalidate, syncOnBoot, status, cancelScheduled };
}

const CONTENT_MUTATION_PATH =
  /^\/(course\/(createCourse|addSection|updateSection|deleteSection|addSubSection|updateSubSection|deleteSubSection|editCourse|togglePublish|deleteCourse|createCategory|updateCategory|deleteCategory|createRating|enrollmentRequests\/[^/]+\/[^/]+\/respond)|admin\/(updateUser|deleteUser)|payment\/verifyPayment|profile\/(deleteProfile|updateProfile|updateUserProfileImage))\/?$/;

const isContentMutation = (method, path) =>
  !["GET", "HEAD", "OPTIONS"].includes(method) && CONTENT_MUTATION_PATH.test(path);

const snapshotPublisher = createSnapshotPublisher();

const republishOnContentMutation = (publisher = snapshotPublisher) => (req, res, next) => {
  if (isContentMutation(req.method, req.path)) {
    res.on("finish", () => {
      if (res.statusCode < 400) publisher.schedule();
    });
  }
  next();
};

module.exports = {
  SNAPSHOT_VERSION,
  buildSnapshot,
  createSnapshotPublisher,
  hashResources,
  isContentMutation,
  publishedSnapshotUrl,
  republishOnContentMutation,
  snapshotPublicId,
  snapshotPublisher,
  triggerFrontendRebuild,
};
