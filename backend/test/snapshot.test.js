require("./stubFileUploader");
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const h = require("./helpers");
const seed = require("./seed");
const RatingAndReview = require("../src/models/ratingAndReview");
const {
  buildSnapshot,
  createSnapshotPublisher,
  hashResources,
  isContentMutation,
  republishOnContentMutation,
  snapshotPublisher,
  triggerFrontendRebuild,
} = require("../src/utils/snapshotPublisher");

const fakeSnapshot = (hash) => ({ version: 1, generatedAt: new Date().toISOString(), hash, resources: {} });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("public snapshot", () => {
  let instructor;
  let student;
  let admin;
  let category;

  before(h.startTestEnvironment);
  after(h.stopTestEnvironment);
  beforeEach(async () => {
    await h.resetDatabase();
    snapshotPublisher.invalidate();
    instructor = await h.createUser({ accountType: "Instructor", approved: true });
    student = await h.createUser({ accountType: "Student" });
    admin = await h.createUser({ accountType: "Admin" });
    category = await seed.createCategory("Web");
  });

  it("serves a health check", async () => {
    const res = await h.api().get("/api/v1/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, "ok");
  });

  it("builds every public resource with a verifiable hash", async () => {
    const published = await seed.createCourse({ instructor, category, courseName: "Published one" });
    const res = await h.api().get("/api/v1/snapshot");
    assert.equal(res.status, 200);
    const snapshot = res.body.data;
    assert.equal(snapshot.version, 1);
    assert.ok(Date.parse(snapshot.generatedAt));
    assert.equal(snapshot.hash, hashResources(snapshot.resources));
    const { categories, newCourses, popularCourses, stats, reviews, course, catalog } = snapshot.resources;
    assert.equal(categories.length, 1);
    assert.equal(newCourses.length, 1);
    assert.equal(popularCourses.length, 1);
    assert.equal(typeof stats.courses, "number");
    assert.ok(Array.isArray(reviews));
    assert.equal(course[String(published._id)].success, true);
    assert.equal(course[String(published._id)].data.courseDetails.courseName, "Published one");
    const catalogCourse = catalog[String(category._id)].selectedCategory.courses[0];
    assert.equal(catalogCourse.instructor.firstName, instructor.firstName);
    assert.equal(catalogCourse.instructor.email, undefined);
    assert.equal(catalogCourse.category.name, "Web");
  });

  it("excludes draft courses and never leaks private fields", async () => {
    const draft = await seed.createCourse({ instructor, category, status: "Draft", courseName: "Secret draft" });
    const published = await seed.createCourse({ instructor, category, students: [student] });
    await RatingAndReview.create({ user: student._id, course: published._id, rating: 5, review: "Great" });

    const res = await h.api().get("/api/v1/snapshot");
    const serialized = JSON.stringify(res.body.data);
    assert.equal(res.body.data.resources.course[String(draft._id)], undefined);
    assert.equal(serialized.includes("Secret draft"), false);
    assert.equal(serialized.includes(instructor.email), false);
    assert.equal(serialized.includes(student.email), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("$2b$"), false);
    assert.equal(serialized.includes("enrollmentRequests"), false);
    assert.equal(res.body.data.resources.reviews.length, 1);
  });

  it("is deterministic so unchanged data is never re-uploaded", async () => {
    const otherCategory = await seed.createCategory("Data");
    await seed.createCourse({ instructor, category });
    await seed.createCourse({ instructor, category: otherCategory });
    const first = await buildSnapshot();
    const second = await buildSnapshot();
    assert.equal(first.hash, second.hash);
    assert.deepEqual(Object.keys(first.resources.catalog[String(category._id)]), ["selectedCategory"]);
  });

  it("works on an empty database", async () => {
    await h.resetDatabase();
    snapshotPublisher.invalidate();
    const res = await h.api().get("/api/v1/snapshot");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.resources.newCourses, []);
    assert.deepEqual(res.body.data.resources.course, {});
  });

  it("is admin only to publish or inspect", async () => {
    assert.equal((await h.api().post("/api/v1/admin/snapshot/publish")).status, 401);
    assert.equal((await h.asUser(student).post("/api/v1/admin/snapshot/publish")).status, 403);
    assert.equal((await h.asUser(instructor).get("/api/v1/admin/snapshot/status")).status, 403);

    const status = await h.asUser(admin).get("/api/v1/admin/snapshot/status");
    assert.equal(status.status, 200);
    assert.equal(status.body.data.enabled, false);

    const publish = await h.asUser(admin).post("/api/v1/admin/snapshot/publish");
    assert.equal(publish.status, 200);
    assert.equal(publish.body.data.skipped, "cloudinary-not-configured");
  });

  it("schedules a republish after a real content write, not after reads", async () => {
    const calls = [];
    const original = snapshotPublisher.schedule;
    snapshotPublisher.schedule = () => calls.push("schedule");
    try {
      const course = await seed.createCourse({ instructor, category });
      await h.api().post("/api/v1/course/getCourseDetails").send({ courseId: String(course._id) });
      await h.api().get("/api/v1/course/getAllCourses");
      await wait(20);
      assert.equal(calls.length, 0);

      const toggled = await h.asUser(instructor).post("/api/v1/course/togglePublish").send({ courseId: String(course._id), publish: false });
      assert.ok(toggled.status < 400, `togglePublish returned ${toggled.status}`);
      await wait(20);
      assert.equal(calls.length, 1);

      const rejected = await h.asUser(student).post("/api/v1/course/togglePublish").send({ courseId: String(course._id), publish: true });
      assert.equal(rejected.status, 403);
      await wait(20);
      assert.equal(calls.length, 1);
    } finally {
      snapshotPublisher.schedule = original;
    }
  });
});

describe("content mutation matcher", () => {
  it("matches only writes that change public data", () => {
    assert.equal(isContentMutation("POST", "/course/createCourse"), true);
    assert.equal(isContentMutation("POST", "/course/togglePublish"), true);
    assert.equal(isContentMutation("DELETE", "/course/deleteCourse"), true);
    assert.equal(isContentMutation("POST", "/course/enrollmentRequests/a/b/respond"), true);
    assert.equal(isContentMutation("POST", "/payment/verifyPayment"), true);
    assert.equal(isContentMutation("PUT", "/profile/updateProfile"), true);
    assert.equal(isContentMutation("POST", "/admin/deleteUser"), true);
    assert.equal(isContentMutation("POST", "/course/getCourseDetails"), false);
    assert.equal(isContentMutation("POST", "/course/getCategoryPageDetails"), false);
    assert.equal(isContentMutation("POST", "/course/saveNote"), false);
    assert.equal(isContentMutation("POST", "/auth/login"), false);
    assert.equal(isContentMutation("POST", "/classroom/create"), false);
    assert.equal(isContentMutation("GET", "/course/createCourse"), false);
    assert.equal(isContentMutation("POST", "/course/createCourseExtra"), false);
  });

  it("schedules only after successful responses", async () => {
    const calls = [];
    const app = express();
    app.use(republishOnContentMutation({ schedule: () => calls.push(1) }));
    app.post("/course/createCourse", (req, res) => res.status(Number(req.query.status)).end());
    await request(app).post("/course/createCourse?status=201");
    await request(app).post("/course/createCourse?status=400");
    await request(app).post("/course/createCourse?status=500");
    await wait(20);
    assert.equal(calls.length, 1);
  });
});

describe("snapshot publisher", () => {
  const silentLogger = { log() {}, error() {} };
  const makePublisher = (overrides = {}) => {
    const uploads = [];
    let buildHash = "aaa";
    const publisher = createSnapshotPublisher({
      build: async () => fakeSnapshot(buildHash),
      upload: async (snapshot) => {
        await wait(10);
        uploads.push(snapshot.hash);
      },
      fetchPublished: async () => null,
      isEnabled: () => true,
      rebuildFrontend: async () => {
        rebuilds.push(Date.now());
        return { triggered: true };
      },
      debounceMs: 30,
      rebuildDebounceMs: 40,
      logger: silentLogger,
      ...overrides,
    });
    return { publisher, uploads, rebuilds, setHash: (hash) => { buildHash = hash; } };
  };
  let rebuilds = [];
  beforeEach(() => {
    rebuilds = [];
  });

  it("triggers one frontend rebuild after content changes, none when unchanged", async () => {
    const { publisher, setHash } = makePublisher();
    await publisher.publish();
    await publisher.publish();
    await wait(80);
    assert.equal(rebuilds.length, 1);
    setHash("bbb");
    await publisher.publish();
    setHash("ccc");
    await publisher.publish();
    await wait(80);
    assert.equal(rebuilds.length, 2);
  });

  it("logs rebuild failures without breaking publishing", async () => {
    const errors = [];
    const { publisher } = makePublisher({
      rebuildFrontend: async () => { throw new Error("hook down"); },
      logger: { log() {}, error: (...args) => errors.push(args.join(" ")) },
    });
    assert.equal((await publisher.publish()).published, true);
    await wait(80);
    assert.ok(errors.some((line) => line.includes("hook down")));
  });

  it("skips the deploy hook when it is not configured", async () => {
    const previous = process.env.RENDER_DEPLOY_HOOK_URL;
    delete process.env.RENDER_DEPLOY_HOOK_URL;
    try {
      assert.deepEqual(await triggerFrontendRebuild(), { skipped: "deploy-hook-not-configured" });
    } finally {
      if (previous !== undefined) process.env.RENDER_DEPLOY_HOOK_URL = previous;
    }
  });

  it("skips when Cloudinary is not configured", async () => {
    const { publisher, uploads } = makePublisher({ isEnabled: () => false });
    assert.deepEqual(await publisher.publish(), { skipped: "cloudinary-not-configured" });
    publisher.schedule();
    await wait(60);
    assert.equal(uploads.length, 0);
  });

  it("uploads once, skips unchanged content and re-uploads when forced or changed", async () => {
    const { publisher, uploads, setHash } = makePublisher();
    assert.equal((await publisher.publish()).published, true);
    assert.equal((await publisher.publish()).skipped, "unchanged");
    assert.equal((await publisher.publish({ force: true })).published, true);
    setHash("bbb");
    assert.equal((await publisher.publish()).hash, "bbb");
    assert.deepEqual(uploads, ["aaa", "aaa", "bbb"]);
  });

  it("is single-flight and coalesces a burst into one follow-up publish", async () => {
    const { publisher, uploads, setHash } = makePublisher();
    const first = publisher.publish();
    setHash("bbb");
    const second = publisher.publish();
    assert.equal(first, second);
    await first;
    await wait(80);
    assert.deepEqual(uploads, ["aaa", "bbb"]);
    publisher.cancelScheduled();
  });

  it("debounces many schedules into one upload", async () => {
    const { publisher, uploads } = makePublisher();
    for (let i = 0; i < 5; i += 1) publisher.schedule();
    await wait(100);
    assert.deepEqual(uploads, ["aaa"]);
  });

  it("surfaces upload failures and retries on the next publish", async () => {
    let shouldFail = true;
    const uploads = [];
    const publisher = createSnapshotPublisher({
      build: async () => fakeSnapshot("aaa"),
      upload: async (snapshot) => {
        if (shouldFail) throw new Error("cloudinary down");
        uploads.push(snapshot.hash);
      },
      fetchPublished: async () => null,
      isEnabled: () => true,
      logger: silentLogger,
    });
    await assert.rejects(publisher.publish(), /cloudinary down/);
    assert.equal(publisher.status().lastResult.error, "cloudinary down");
    shouldFail = false;
    assert.equal((await publisher.publish()).published, true);
    assert.deepEqual(uploads, ["aaa"]);
  });

  it("never uploads when the snapshot cannot be built", async () => {
    const { publisher, uploads } = makePublisher({ build: async () => { throw new Error("db down"); } });
    await assert.rejects(publisher.publish(), /db down/);
    await assert.rejects(publisher.getSnapshot(), /db down/);
    assert.equal(uploads.length, 0);
  });

  it("boot sync does not re-upload an unchanged published snapshot", async () => {
    const { publisher, uploads } = makePublisher({ fetchPublished: async () => ({ hash: "aaa" }) });
    assert.equal((await publisher.syncOnBoot()).skipped, "unchanged");
    assert.equal(uploads.length, 0);
  });

  it("boot sync publishes when the published copy is missing, stale or unreadable", async () => {
    const stale = makePublisher({ fetchPublished: async () => ({ hash: "old" }) });
    assert.equal((await stale.publisher.syncOnBoot()).published, true);
    const missing = makePublisher({ fetchPublished: async () => null });
    assert.equal((await missing.publisher.syncOnBoot()).published, true);
    const unreachable = makePublisher({ fetchPublished: async () => { throw new Error("timeout"); } });
    assert.equal((await unreachable.publisher.syncOnBoot()).published, true);
  });
});
