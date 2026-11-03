const stubs = require("./stubFileUploader");
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");
const seed = require("./seed");
const Course = require("../src/models/course");
const CourseProgress = require("../src/models/courseProgress");
const Note = require("../src/models/note");
const Profile = require("../src/models/profile");
const RatingAndReview = require("../src/models/ratingAndReview");
const User = require("../src/models/user");
const { resetStatsCache } = require("../src/controllers/stats");

const PNG = Buffer.from("89504e470d0a1a0a", "hex");

describe("profile, admin and stats endpoints", () => {
  let admin;
  let instructor;
  let student;
  let category;

  before(async () => {
    await h.startTestEnvironment();
    await RatingAndReview.init();
  });
  after(h.stopTestEnvironment);
  beforeEach(async () => {
    await h.resetDatabase();
    resetStatsCache();
    stubs.uploads.length = 0;
    admin = await h.createUser({ accountType: "Admin" });
    instructor = await h.createUser({ accountType: "Instructor", approved: true });
    student = await h.createUser({ accountType: "Student" });
    category = await seed.createCategory();
  });

  describe("getUserDetails", () => {
    it("requires authentication and never returns the password hash or token", async () => {
      assert.equal((await h.api().get("/api/v1/profile/getUserDetails")).status, 401);
      const res = await h.asUser(student).get("/api/v1/profile/getUserDetails");
      assert.equal(res.status, 200);
      assert.equal(res.body.data.email, student.email);
      assert.equal(res.body.data.password, undefined);
      assert.equal(res.body.data.token, undefined);
      assert.equal(res.body.data.resetPasswordTokenExpires, undefined);
      assert.ok(res.body.data.additionalDetails);
    });
  });

  describe("getPublicProfile", () => {
    it("validates the id and returns 404 for unknown users", async () => {
      assert.equal((await h.api().get("/api/v1/profile/public/not-an-id")).status, 400);
      assert.equal((await h.api().get(`/api/v1/profile/public/${seed.newId()}`)).status, 404);
    });

    it("exposes only public fields and published courses for instructors", async () => {
      await Profile.updateOne({ _id: instructor.additionalDetails }, { about: "Teacher", contactNumber: "0771234567", gender: "F" });
      await seed.createCourse({ instructor, category, courseName: "Visible" });
      await seed.createCourse({ instructor, category, status: "Draft", courseName: "Hidden" });

      const res = await h.api().get(`/api/v1/profile/public/${instructor._id}`);
      assert.equal(res.status, 200);
      const { user } = res.body.data;
      assert.equal(user.additionalDetails.about, "Teacher");
      assert.deepEqual(user.courses.map((course) => course.courseName), ["Visible"]);
      const serialized = JSON.stringify(res.body);
      for (const secret of [instructor.email, "0771234567", "password", "accountType", "resetPassword"]) {
        assert.equal(serialized.includes(secret), false, secret);
      }
    });

    it("returns only name and image for protected profiles and hides deactivated users", async () => {
      await Profile.updateOne({ _id: student.additionalDetails }, { protectMe: true, about: "private" });
      const res = await h.api().get(`/api/v1/profile/public/${student._id}`);
      assert.equal(res.body.data.isProtected, true);
      assert.deepEqual(Object.keys(res.body.data.user).sort(), ["image", "preferredName"]);
      await User.updateOne({ _id: student._id }, { active: false });
      assert.equal((await h.api().get(`/api/v1/profile/public/${student._id}`)).status, 404);
    });
  });

  describe("updateUserProfileImage", () => {
    it("returns 400 when no file or a non-image is sent and uploads an image", async () => {
      const put = (user) => h.asUser(user).put("/api/v1/profile/updateUserProfileImage");
      assert.equal((await h.api().put("/api/v1/profile/updateUserProfileImage")).status, 401);
      assert.equal((await put(student)).status, 400);
      assert.equal((await put(student).attach("profileImage", Buffer.from("text"), { filename: "x.txt", contentType: "text/plain" })).status, 400);
      const ok = await put(student).attach("profileImage", PNG, { filename: "me.png", contentType: "image/png" });
      assert.equal(ok.status, 200, JSON.stringify(ok.body));
      assert.equal(ok.body.data.password, undefined);
      assert.match((await User.findById(student._id)).image, /cloudinary/);
    });
  });

  describe("updateProfile", () => {
    it("rejects non-string fields and updates valid ones", async () => {
      const put = (body) => h.asUser(student).put("/api/v1/profile/updateProfile").send(body);
      assert.equal((await put({ about: { $set: "x" }, firstName: ["a"] })).status, 400);
      assert.equal((await put({ about: "x".repeat(3000) })).status, 400);
      const ok = await put({ firstName: "Nina", about: "Hello" });
      assert.equal(ok.status, 200);
      assert.equal(ok.body.updatedUserDetails.password, undefined);
      assert.equal(ok.body.updatedUserDetails.additionalDetails.about, "Hello");
    });
  });

  describe("instructorDashboard", () => {
    it("keeps the success contract and role guard", async () => {
      await seed.createCourse({ instructor, category, price: 10, students: [student] });
      const res = await h.asUser(instructor).get("/api/v1/profile/instructorDashboard");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.courses[0].totalAmountGenerated, 10);
      assert.equal((await h.asUser(student).get("/api/v1/profile/instructorDashboard")).status, 403);
      assert.equal((await h.api().get("/api/v1/profile/instructorDashboard")).status, 401);
    });
  });

  describe("deleteAccount", () => {
    it("cascades a student's enrollment, progress, notes and reviews", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student], requiresApproval: true });
      await Course.updateOne({ _id: course._id }, { $push: { enrollmentRequests: { user: student._id, status: "Approved" } } });
      await h.asUser(student).post("/api/v1/course/saveNote").send({ courseId: String(course._id), content: "n" });
      await h.asUser(student).post("/api/v1/course/createRating").send({ courseId: String(course._id), rating: 4, review: "ok" });

      assert.equal((await h.api().delete("/api/v1/profile/deleteProfile")).status, 401);
      const res = await h.asUser(student).delete("/api/v1/profile/deleteProfile");
      assert.equal(res.status, 200, JSON.stringify(res.body));

      const stored = await Course.findById(course._id);
      assert.equal(stored.studentsEnrolled.length, 0);
      assert.equal(stored.enrollmentRequests.length, 0);
      assert.equal(stored.ratingAndReviews.length, 0);
      assert.equal(await CourseProgress.countDocuments({ userId: student._id }), 0);
      assert.equal(await Note.countDocuments({ userId: student._id }), 0);
      assert.equal(await RatingAndReview.countDocuments(), 0);
      assert.equal(await User.countDocuments({ _id: student._id }), 0);
      assert.equal(await Profile.countDocuments({ _id: student.additionalDetails }), 0);
    });

    it("refuses with 409 when an instructor owns published courses with students, and deletes otherwise", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      const blocked = await h.asUser(instructor).delete("/api/v1/profile/deleteProfile");
      assert.equal(blocked.status, 409);
      assert.equal(await User.countDocuments({ _id: instructor._id }), 1);

      await Course.updateOne({ _id: course._id }, { status: "Draft" });
      const allowed = await h.asUser(instructor).delete("/api/v1/profile/deleteProfile");
      assert.equal(allowed.status, 200);
      assert.equal(await Course.countDocuments(), 0);
      assert.equal((await User.findById(student._id)).courses.length, 0);
    });
  });

  describe("admin user management", () => {
    const adminPost = (user, route, body) => h.asUser(user).post(`/api/v1/admin/${route}`).send(body);

    it("rejects anonymous and non-admin callers on every route", async () => {
      for (const route of ["getAllUsers", "updateUser", "deleteUser"]) {
        assert.equal((await h.api().post(`/api/v1/admin/${route}`).send({})).status, 401, route);
        assert.equal((await adminPost(student, route, {})).status, 403, route);
        assert.equal((await adminPost(instructor, route, {})).status, 403, route);
      }
    });

    it("caps the page size, treats search literally and never returns password hashes", async () => {
      const capped = await adminPost(admin, "getAllUsers", { limit: 100000, page: -4 });
      assert.equal(capped.status, 200);
      assert.equal(capped.body.data.limit, 100);
      assert.equal(capped.body.data.page, 1);
      assert.equal(JSON.stringify(capped.body).includes("password"), false);

      for (const q of ["(", "[a-", "(a+)+$"]) assert.equal((await adminPost(admin, "getAllUsers", { q })).status, 200, q);
      const wildcard = await adminPost(admin, "getAllUsers", { q: ".*" });
      assert.equal(wildcard.body.data.users.length, 0);
      const byEmail = await adminPost(admin, "getAllUsers", { q: student.email.toUpperCase() });
      assert.equal(byEmail.body.data.users.length, 1);
      assert.equal((await adminPost(admin, "getAllUsers", { q: { $ne: "" } })).status, 200);
    });

    it("validates updateUser input and enforces the accountType enum", async () => {
      assert.equal((await adminPost(admin, "updateUser", { userId: "bad" })).status, 400);
      assert.equal((await adminPost(admin, "updateUser", { userId: { $ne: null } })).status, 400);
      assert.equal((await adminPost(admin, "updateUser", { userId: String(student._id), accountType: "Root" })).status, 400);
      assert.equal((await adminPost(admin, "updateUser", { userId: String(student._id), accountType: { $ne: "x" } })).status, 400);
      assert.equal((await adminPost(admin, "updateUser", { userId: String(student._id), active: "false" })).status, 400);
      assert.equal((await adminPost(admin, "updateUser", { userId: String(seed.newId()), active: false })).status, 404);
      assert.equal((await adminPost(admin, "updateUser", { userId: String(admin._id), accountType: "Student" })).status, 400);

      const ok = await adminPost(admin, "updateUser", { userId: String(student._id), accountType: "Instructor", approved: true });
      assert.equal(ok.status, 200);
      assert.equal(ok.body.data.accountType, "Instructor");
      assert.equal(ok.body.data.password, undefined);
    });

    it("refuses self deletion and cascades like deleteAccount", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      assert.equal((await adminPost(admin, "deleteUser", { userId: String(admin._id) })).status, 400);
      assert.equal((await adminPost(admin, "deleteUser", { userId: "bad" })).status, 400);
      assert.equal((await adminPost(admin, "deleteUser", { userId: String(seed.newId()) })).status, 404);
      assert.equal((await adminPost(admin, "deleteUser", { userId: String(instructor._id) })).status, 409);

      const res = await adminPost(admin, "deleteUser", { userId: String(student._id) });
      assert.equal(res.status, 200);
      assert.equal((await Course.findById(course._id)).studentsEnrolled.length, 0);
      assert.equal(await CourseProgress.countDocuments({ userId: student._id }), 0);
      assert.equal(await Profile.countDocuments({ _id: student.additionalDetails }), 0);
    });
  });

  describe("site stats", () => {
    it("counts via aggregation, caches for 60 seconds and is public", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      const section = await seed.addSection(course);
      const subSection = await seed.addSubSection(section);
      await CourseProgress.updateOne({ courseID: course._id, userId: student._id }, { $push: { completedVideos: subSection._id } });

      const first = await h.api().get("/api/v1/site/stats");
      assert.equal(first.status, 200);
      assert.deepEqual(first.body.data, { totalStudents: 1, mentors: 1, courses: 1, awards: 1 });

      await h.createUser({ accountType: "Student" });
      const cached = await h.api().get("/api/v1/site/stats");
      assert.equal(cached.body.data.totalStudents, 1);
      resetStatsCache();
      assert.equal((await h.api().get("/api/v1/site/stats")).body.data.totalStudents, 2);
    });
  });

  describe("student dashboard", () => {
    it("requires authentication and returns enrolled courses", async () => {
      await seed.createCourse({ instructor, category, students: [student], price: 20 });
      assert.equal((await h.api().get("/api/v1/student/dashboard")).status, 401);
      const res = await h.asUser(student).get("/api/v1/student/dashboard");
      assert.equal(res.status, 200);
      assert.equal(res.body.data.studentData.totalSpent, 20);
    });
  });
});
