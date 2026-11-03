const stubs = require("./stubFileUploader");
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");
const seed = require("./seed");
const Course = require("../src/models/course");
const Section = require("../src/models/section");
const SubSection = require("../src/models/subSection");
const Category = require("../src/models/category");
const CourseProgress = require("../src/models/courseProgress");
const RatingAndReview = require("../src/models/ratingAndReview");

const PNG = Buffer.from("89504e470d0a1a0a", "hex");

describe("course, content, access and review endpoints", () => {
  let instructor;
  let otherInstructor;
  let student;
  let outsider;
  let admin;
  let category;

  before(async () => {
    await h.startTestEnvironment();
    await RatingAndReview.init();
  });
  after(h.stopTestEnvironment);
  beforeEach(async () => {
    await h.resetDatabase();
    stubs.deletions.length = 0;
    instructor = await h.createUser({ accountType: "Instructor", approved: true });
    otherInstructor = await h.createUser({ accountType: "Instructor", approved: true });
    student = await h.createUser({ accountType: "Student" });
    outsider = await h.createUser({ accountType: "Student" });
    admin = await h.createUser({ accountType: "Admin" });
    category = await seed.createCategory();
  });

  const createCoursePost = (user, fields = {}, { withThumbnail = true } = {}) => {
    const defaults = {
      courseName: "Intro",
      courseDescription: "Desc",
      whatYouWillLearn: "Learn",
      price: "0",
      category: String(category._id),
      tag: JSON.stringify(["js"]),
      instructions: JSON.stringify(["a laptop"]),
    };
    let req = h.asUser(user).post("/api/v1/course/createCourse");
    for (const [key, value] of Object.entries({ ...defaults, ...fields })) {
      if (value !== undefined) req = req.field(key, value);
    }
    return withThumbnail ? req.attach("thumbnailImage", PNG, "thumb.png") : req;
  };

  describe("createCourse", () => {
    it("rejects unauthenticated, student and unapproved instructor callers", async () => {
      assert.equal((await h.api().post("/api/v1/course/createCourse")).status, 401);
      assert.equal((await createCoursePost(student)).status, 403);
      const pending = await h.createUser({ accountType: "Instructor", approved: false });
      assert.equal((await createCoursePost(pending)).status, 403);
    });

    it("creates a free course (price 0 is valid) and returns no enrollment requests", async () => {
      const res = await createCoursePost(instructor);
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(res.body.data.price, 0);
      assert.equal(res.body.data.instructor, String(instructor._id));
      assert.equal(res.body.data.status, "Draft");
      assert.equal("enrollmentRequests" in res.body.data, false);
    });

    it("returns 400 (not 500) for malformed JSON in tag or instructions", async () => {
      assert.equal((await createCoursePost(instructor, { tag: "{not json" })).status, 400);
      assert.equal((await createCoursePost(instructor, { instructions: "[oops" })).status, 400);
      assert.equal((await createCoursePost(instructor, { tag: "null" })).status, 400);
    });

    it("rejects negative price, missing thumbnail, invalid and unknown category", async () => {
      assert.equal((await createCoursePost(instructor, { price: "-1" })).status, 400);
      assert.equal((await createCoursePost(instructor, {}, { withThumbnail: false })).status, 400);
      assert.equal((await createCoursePost(instructor, { category: "nope" })).status, 400);
      assert.equal((await createCoursePost(instructor, { category: String(seed.newId()) })).status, 404);
    });
  });

  describe("editCourse mass assignment", () => {
    it("ignores protected fields and applies whitelisted ones", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      const section = await seed.addSection(course);
      const res = await h.asUser(instructor).post("/api/v1/course/editCourse").send({
        courseId: String(course._id),
        courseName: "Renamed",
        price: 25,
        instructor: String(otherInstructor._id),
        studentsEnrolled: [],
        courseContent: [],
        ratingAndReviews: [String(seed.newId())],
        enrollmentRequests: [{ user: String(outsider._id), status: "Approved" }],
        status: "Draft",
      });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      const stored = await Course.findById(course._id);
      assert.equal(stored.courseName, "Renamed");
      assert.equal(stored.price, 25);
      assert.equal(String(stored.instructor), String(instructor._id));
      assert.equal(stored.studentsEnrolled.length, 1);
      assert.equal(stored.courseContent.length, 1);
      assert.equal(String(stored.courseContent[0]), String(section._id));
      assert.equal(stored.ratingAndReviews.length, 0);
      assert.equal(stored.enrollmentRequests.length, 0);
      assert.equal(stored.status, "Published");
      assert.equal(res.body.data.instructor.password, undefined);
    });

    it("rejects negative price, non-owner, invalid id, operator injection and anonymous callers", async () => {
      const course = await seed.createCourse({ instructor, category });
      const edit = (user, body) => h.asUser(user).post("/api/v1/course/editCourse").send(body);

      assert.equal((await edit(instructor, { courseId: String(course._id), price: -5 })).status, 400);
      assert.equal((await edit(otherInstructor, { courseId: String(course._id), courseName: "Hijack" })).status, 403);
      assert.equal((await edit(instructor, { courseId: "not-an-id" })).status, 400);
      assert.equal((await edit(instructor, { courseId: { $ne: null } })).status, 400);
      assert.equal((await edit(student, { courseId: String(course._id) })).status, 403);
      assert.equal((await h.api().post("/api/v1/course/editCourse").send({})).status, 401);
      assert.equal((await Course.findById(course._id)).courseName, "Course");
    });
  });

  describe("section and subsection ownership", () => {
    it("blocks non-owners, anonymous and student callers from every mutation", async () => {
      const course = await seed.createCourse({ instructor, category });
      const section = await seed.addSection(course);
      const subSection = await seed.addSubSection(section);
      const attempts = [
        ["addSection", { courseId: String(course._id), sectionName: "X" }],
        ["updateSection", { courseId: String(course._id), sectionId: String(section._id), sectionName: "X" }],
        ["deleteSection", { courseId: String(course._id), sectionId: String(section._id) }],
        ["addSubSection", { sectionId: String(section._id), title: "t", description: "d", externalVideoUrl: "https://example.com/v" }],
        ["updateSubSection", { sectionId: String(section._id), subSectionId: String(subSection._id), title: "x" }],
        ["deleteSubSection", { sectionId: String(section._id), subSectionId: String(subSection._id) }],
      ];
      for (const [route, body] of attempts) {
        const url = `/api/v1/course/${route}`;
        assert.equal((await h.api().post(url).send(body)).status, 401, `${route} anonymous`);
        assert.equal((await h.asUser(student).post(url).send(body)).status, 403, `${route} student`);
        assert.equal((await h.asUser(otherInstructor).post(url).send(body)).status, 403, `${route} non-owner`);
      }
      assert.equal(await Section.countDocuments(), 1);
      assert.equal(await SubSection.countDocuments(), 1);
    });

    it("lets the owner create and rename a section", async () => {
      const course = await seed.createCourse({ instructor, category });
      const created = await h.asUser(instructor).post("/api/v1/course/addSection").send({ courseId: String(course._id), sectionName: "Intro" });
      assert.equal(created.status, 200);
      assert.equal(created.body.updatedCourseDetails.courseContent.length, 1);
      const sectionId = created.body.updatedCourseDetails.courseContent[0]._id;
      const renamed = await h.asUser(instructor).post("/api/v1/course/updateSection").send({ courseId: String(course._id), sectionId, sectionName: "Renamed" });
      assert.equal(renamed.status, 200);
      assert.equal((await Section.findById(sectionId)).sectionName, "Renamed");
    });

    it("rejects invalid ids, operator bodies and sections from another course", async () => {
      const course = await seed.createCourse({ instructor, category });
      const otherCourse = await seed.createCourse({ instructor, category });
      const foreignSection = await seed.addSection(otherCourse);
      const post = (route, body) => h.asUser(instructor).post(`/api/v1/course/${route}`).send(body);

      assert.equal((await post("addSection", { courseId: "x", sectionName: "a" })).status, 400);
      assert.equal((await post("addSection", { courseId: { $gt: "" }, sectionName: "a" })).status, 400);
      assert.equal((await post("deleteSection", { courseId: String(course._id), sectionId: "bad" })).status, 400);
      assert.equal((await post("deleteSection", { courseId: String(course._id), sectionId: String(foreignSection._id) })).status, 404);
      assert.equal((await post("addSubSection", { sectionId: "bad", title: "t", description: "d" })).status, 400);
      assert.equal((await post("addSubSection", { sectionId: String(foreignSection._id), title: "t", description: "d", externalVideoUrl: "javascript:alert(1)" })).status, 400);
      assert.equal(await Section.countDocuments({ _id: foreignSection._id }), 1);
    });

    it("deleteSection removes the section from the course and cascades to subsections and assets", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      const section = await seed.addSection(course);
      const subSection = await seed.addSubSection(section, "data/asset_cascade");
      await CourseProgress.updateOne({ courseID: course._id, userId: student._id }, { $push: { completedVideos: subSection._id } });

      const res = await h.asUser(instructor).post("/api/v1/course/deleteSection").send({ courseId: String(course._id), sectionId: String(section._id) });
      assert.equal(res.status, 200);
      assert.equal((await Course.findById(course._id)).courseContent.length, 0);
      assert.equal(await Section.countDocuments({ _id: section._id }), 0);
      assert.equal(await SubSection.countDocuments({ _id: subSection._id }), 0);
      assert.deepEqual(stubs.deletions, ["data/asset_cascade"]);
      const progress = await CourseProgress.findOne({ courseID: course._id });
      assert.equal(progress.completedVideos.length, 0);
    });

    it("deleteSubSection pulls the reference from its section", async () => {
      const course = await seed.createCourse({ instructor, category });
      const section = await seed.addSection(course);
      const subSection = await seed.addSubSection(section);
      const res = await h.asUser(instructor).post("/api/v1/course/deleteSubSection").send({ sectionId: String(section._id), subSectionId: String(subSection._id) });
      assert.equal(res.status, 200);
      assert.equal((await Section.findById(section._id)).subSection.length, 0);
      assert.equal(await SubSection.countDocuments(), 0);
    });
  });

  describe("getFullCourseDetails", () => {
    it("returns content only to enrolled students, the owner and admins", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      const section = await seed.addSection(course);
      await seed.addSubSection(section);
      const fetchAs = (user) => h.asUser(user).post("/api/v1/course/getFullCourseDetails").send({ courseId: String(course._id) });

      const asStudent = await fetchAs(student);
      assert.equal(asStudent.status, 200);
      assert.equal(asStudent.body.data.courseDetails.courseContent[0].subSection.length, 1);
      assert.equal(asStudent.body.data.courseDetails.enrollmentRequests, undefined);
      assert.equal(asStudent.body.data.courseDetails.instructor.password, undefined);
      assert.equal(asStudent.body.data.courseDetails.instructor.email, undefined);
      assert.equal((await fetchAs(instructor)).status, 200);
      assert.equal((await fetchAs(admin)).status, 200);
      assert.equal((await fetchAs(outsider)).status, 403);
      assert.equal((await fetchAs(otherInstructor)).status, 403);
      assert.equal((await h.api().post("/api/v1/course/getFullCourseDetails").send({ courseId: String(course._id) })).status, 401);
    });

    it("returns 400 for invalid ids and 404 for unknown courses", async () => {
      const post = (courseId) => h.asUser(student).post("/api/v1/course/getFullCourseDetails").send({ courseId });
      assert.equal((await post("bad")).status, 400);
      assert.equal((await post({ $ne: null })).status, 400);
      assert.equal((await post(String(seed.newId()))).status, 404);
    });
  });

  describe("public course details and listing", () => {
    it("does not leak instructor password hash or contact details", async () => {
      const course = await seed.createCourse({ instructor, category });
      const res = await h.api().post("/api/v1/course/getCourseDetails").send({ courseId: String(course._id) });
      assert.equal(res.status, 200);
      const exposed = JSON.stringify(res.body);
      assert.equal(exposed.includes("password"), false);
      assert.equal(exposed.includes(instructor.email), false);
      assert.equal((await h.api().post("/api/v1/course/getCourseDetails").send({ courseId: "bad" })).status, 400);
    });

    it("hides draft courses from the public details endpoint", async () => {
      const draft = await seed.createCourse({ instructor, category, status: "Draft" });
      const res = await h.api().post("/api/v1/course/getCourseDetails").send({ courseId: String(draft._id) });
      assert.equal(res.status, 404);
    });

    it("ignores the nonexistent level filter and survives regex metacharacters in search", async () => {
      await seed.createCourse({ instructor, category, courseName: "Alpha" });
      const withLevel = await h.api().get("/api/v1/course/getAllCourses?level=beginner");
      assert.equal(withLevel.status, 200);
      assert.equal(withLevel.body.data.courses.length, 1);
      for (const search of ["(", "[a-", "(a+)+$", ".*"]) {
        const res = await h.api().get("/api/v1/course/getAllCourses").query({ search });
        assert.equal(res.status, 200, search);
      }
      const literal = await h.api().get("/api/v1/course/getAllCourses").query({ search: ".*" });
      assert.equal(literal.body.data.courses.length, 0);
      assert.equal((await h.api().get("/api/v1/course/getAllCourses?categoryId=bad")).status, 400);
    });

    it("instructor course search treats the term literally", async () => {
      await seed.createCourse({ instructor, category, courseName: "Alpha" });
      const res = await h.asUser(instructor).get("/api/v1/course/getInstructorCourses").query({ search: "(" });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.courses.length, 0);
    });
  });

  describe("updateCourseProgress", () => {
    it("rejects subsections that are not part of the enrolled course", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      const section = await seed.addSection(course);
      const subSection = await seed.addSubSection(section);
      const otherCourse = await seed.createCourse({ instructor: otherInstructor, category });
      const foreignSubSection = await seed.addSubSection(await seed.addSection(otherCourse));
      const mark = (user, courseId, subSectionId) =>
        h.asUser(user).post("/api/v1/course/updateCourseProgress").send({ courseId: String(courseId), subSectionId: String(subSectionId) });

      assert.equal((await mark(student, course._id, foreignSubSection._id)).status, 404);
      assert.equal((await mark(student, otherCourse._id, foreignSubSection._id)).status, 404);
      assert.equal((await mark(outsider, course._id, subSection._id)).status, 404);
      assert.equal((await mark(student, course._id, subSection._id)).status, 200);
      assert.equal((await mark(student, course._id, subSection._id)).status, 400);
      assert.equal((await mark(student, "bad", subSection._id)).status, 400);
      assert.equal((await mark(instructor, course._id, subSection._id)).status, 403);
      assert.equal((await h.api().post("/api/v1/course/updateCourseProgress").send({})).status, 401);
    });
  });

  describe("getAssetUrl", () => {
    it("signs assets only for enrolled users, owners and admins and clamps expiry", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      const subSection = await seed.addSubSection(await seed.addSection(course), "data/secret_lecture");
      const material = subSection.supportMaterials[0];
      const sign = (user, body) => h.asUser(user).post("/api/v1/course/getAssetUrl").send(body);

      const ok = await sign(student, { publicId: "data/secret_lecture", expiresInSec: 99999999 });
      assert.equal(ok.status, 200, JSON.stringify(ok.body));
      assert.equal(ok.body.publicId, "data/secret_lecture");
      assert.ok(ok.body.expiresAt - Math.floor(Date.now() / 1000) <= 3601);
      assert.match(ok.body.url, /^https:\/\/api\.cloudinary\.com\//);

      const tiny = await sign(student, { url: material.url, expiresInSec: 1 });
      assert.equal(tiny.status, 200);
      assert.ok(tiny.body.expiresAt - Math.floor(Date.now() / 1000) >= 59);

      assert.equal((await sign(instructor, { publicId: "data/secret_lecture" })).status, 200);
      assert.equal((await sign(admin, { publicId: "data/secret_lecture" })).status, 200);
      assert.equal((await sign(outsider, { publicId: "data/secret_lecture" })).status, 403);
      assert.equal((await sign(outsider, { url: material.url })).status, 403);
      assert.equal((await sign(student, { publicId: "data/not_registered_anywhere" })).status, 403);
      assert.equal((await sign(student, {})).status, 400);
      assert.equal((await sign(student, { publicId: { $ne: null } })).status, 400);
      assert.equal((await h.api().post("/api/v1/course/getAssetUrl").send({ publicId: "data/secret_lecture" })).status, 401);
    });

    it("never signs a foreign course asset when a legitimate url is paired with a foreign publicId", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      const mine = await seed.addSubSection(await seed.addSection(course), "data/mine");
      const otherCourse = await seed.createCourse({ instructor: otherInstructor, category });
      await seed.addSubSection(await seed.addSection(otherCourse), "data/theirs");
      const res = await h.asUser(student).post("/api/v1/course/getAssetUrl").send({ url: mine.supportMaterials[0].url, publicId: "data/theirs" });
      assert.notEqual(res.body.publicId, "data/theirs");
      const foreignOnly = await h.asUser(student).post("/api/v1/course/getAssetUrl").send({ publicId: "data/theirs" });
      assert.equal(foreignOnly.status, 403);
    });

    it("allows thumbnails of published courses to authenticated users only", async () => {
      const course = await seed.createCourse({ instructor, category });
      const draft = await seed.createCourse({ instructor, category, status: "Draft" });
      const sign = (user, url) => h.asUser(user).post("/api/v1/course/getAssetUrl").send({ url });
      assert.equal((await sign(outsider, course.thumbnail)).status, 200);
      assert.equal((await sign(outsider, draft.thumbnail)).status, 403);
      assert.equal((await sign(instructor, draft.thumbnail)).status, 200);
    });
  });

  describe("ratings and reviews", () => {
    it("validates the rating, requires enrollment and allows one review per course", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      const rate = (user, body) => h.asUser(user).post("/api/v1/course/createRating").send({ courseId: String(course._id), review: "Great", ...body });

      assert.equal((await rate(student, { rating: 0 })).status, 400);
      assert.equal((await rate(student, { rating: 6 })).status, 400);
      assert.equal((await rate(student, { rating: "abc" })).status, 400);
      assert.equal((await rate(student, { rating: 4.5 })).status, 400);
      assert.equal((await rate(student, { rating: { $gt: 0 } })).status, 400);
      assert.equal((await rate(student, { rating: 5, courseId: "bad" })).status, 400);
      assert.equal((await rate(outsider, { rating: 5 })).status, 403);
      assert.equal((await h.api().post("/api/v1/course/createRating").send({})).status, 401);
      assert.equal((await rate(instructor, { rating: 5 })).status, 403);

      const created = await rate(student, { rating: 4 });
      assert.equal(created.status, 200, JSON.stringify(created.body));
      assert.equal(created.body.data.rating, 4);
      assert.equal(typeof created.body.data.rating, "number");
      assert.equal((await rate(student, { rating: 5 })).status, 409);
      assert.equal((await Course.findById(course._id)).ratingAndReviews.length, 1);
    });

    it("computes the average from GET query and hides reviewer emails", async () => {
      const second = await h.createUser({ accountType: "Student" });
      const course = await seed.createCourse({ instructor, category, students: [student, second] });
      await h.asUser(student).post("/api/v1/course/createRating").send({ courseId: String(course._id), rating: 5, review: "A" });
      await h.asUser(second).post("/api/v1/course/createRating").send({ courseId: String(course._id), rating: 2, review: "B" });

      const average = await h.api().get("/api/v1/course/getAverageRating").query({ courseId: String(course._id) });
      assert.equal(average.status, 200);
      assert.equal(average.body.averageRating, 3.5);
      assert.equal((await h.api().get("/api/v1/course/getAverageRating")).status, 400);
      assert.equal((await h.api().get("/api/v1/course/getAverageRating").query({ courseId: "bad" })).status, 400);
      const empty = await seed.createCourse({ instructor, category });
      assert.equal((await h.api().get("/api/v1/course/getAverageRating").query({ courseId: String(empty._id) })).body.averageRating, 0);

      const reviews = await h.api().get("/api/v1/course/getReviews");
      assert.equal(reviews.status, 200);
      assert.equal(reviews.body.data.length, 2);
      assert.equal(JSON.stringify(reviews.body).includes("@test.local"), false);
    });
  });

  describe("categories", () => {
    it("orders most enrolled courses by enrollment count", async () => {
      const students = [student, outsider];
      const popular = await seed.createCourse({ instructor, category, students, courseName: "Popular" });
      await seed.createCourse({ instructor, category, courseName: "Quiet" });
      const res = await h.api().post("/api/v1/course/getCategoryPageDetails").send({ categoryId: String(category._id) });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(res.body.data.mostSellingCourses[0]._id, String(popular._id));
      assert.equal(JSON.stringify(res.body).includes("password"), false);
      assert.equal((await h.api().post("/api/v1/course/getCategoryPageDetails").send({ categoryId: "bad" })).status, 400);
      assert.equal((await h.api().post("/api/v1/course/getCategoryPageDetails").send({ categoryId: String(seed.newId()) })).status, 404);
    });

    it("refuses to delete a category that still has courses and enforces admin role", async () => {
      await seed.createCourse({ instructor, category });
      const empty = await seed.createCategory("Empty");
      const remove = (user, categoryId) => h.asUser(user).post("/api/v1/course/deleteCategory").send({ categoryId });

      assert.equal((await remove(admin, String(category._id))).status, 409);
      assert.equal(await Category.countDocuments({ _id: category._id }), 1);
      assert.equal((await remove(instructor, String(empty._id))).status, 403);
      assert.equal((await h.api().post("/api/v1/course/deleteCategory").send({})).status, 401);
      assert.equal((await remove(admin, "bad")).status, 400);
      assert.equal((await remove(admin, { $ne: null })).status, 400);
      assert.equal((await remove(admin, String(empty._id))).status, 200);
    });
  });

  describe("notes", () => {
    it("requires access to the course and validates ids", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      const save = (user, body) => h.asUser(user).post("/api/v1/course/saveNote").send(body);

      assert.equal((await save(student, { courseId: String(course._id), content: "hello" })).status, 200);
      assert.equal((await save(student, { courseId: String(course._id), content: "updated" })).status, 200);
      const fetched = await h.asUser(student).post("/api/v1/course/getNote").send({ courseId: String(course._id) });
      assert.equal(fetched.body.data.content, "updated");
      assert.equal((await save(outsider, { courseId: String(course._id), content: "x" })).status, 403);
      assert.equal((await save(student, { courseId: "bad" })).status, 400);
      assert.equal((await save(student, { courseId: String(course._id), content: { $set: 1 } })).status, 400);
      assert.equal((await h.api().post("/api/v1/course/getNote").send({})).status, 401);
    });
  });

  describe("enrollment approval workflow", () => {
    it("keeps a single pending request, enforces ownership and allows answering once", async () => {
      const course = await seed.createCourse({ instructor, category, requiresApproval: true });
      const request = () => h.asUser(student).post("/api/v1/course/requestEnrollment").send({ courseId: String(course._id) });

      assert.equal((await request()).status, 200);
      assert.equal((await request()).body.message, "Enrollment request already pending");
      assert.equal((await Course.findById(course._id)).enrollmentRequests.length, 1);
      assert.equal(h.sentMails.length, 1);

      const requestId = (await Course.findById(course._id)).enrollmentRequests[0]._id;
      const respond = (user, id, action = "approve") =>
        h.asUser(user).post(`/api/v1/course/enrollmentRequests/${course._id}/${id}/respond`).send({ action });

      assert.equal((await respond(otherInstructor, requestId)).status, 403);
      assert.equal((await respond(student, requestId)).status, 403);
      assert.equal((await respond(instructor, "bad")).status, 400);
      assert.equal((await respond(instructor, requestId, "maybe")).status, 400);
      assert.equal((await respond(instructor, seed.newId())).status, 404);

      const approved = await respond(instructor, requestId);
      assert.equal(approved.status, 200);
      const stored = await Course.findById(course._id);
      assert.equal(stored.studentsEnrolled.length, 1);
      assert.equal(await CourseProgress.countDocuments({ courseID: course._id, userId: student._id }), 1);
      assert.ok(h.sentMails.some((mail) => mail.to === student.email && /Enrolled/.test(mail.subject)));
      assert.equal((await respond(instructor, requestId)).status, 409);
      assert.equal((await Course.findById(course._id)).studentsEnrolled.length, 1);

      const again = await request();
      assert.equal(again.status, 400);
    });

    it("validates requestEnrollment input and role", async () => {
      assert.equal((await h.asUser(student).post("/api/v1/course/requestEnrollment").send({ courseId: "bad" })).status, 400);
      assert.equal((await h.asUser(student).post("/api/v1/course/requestEnrollment").send({ courseId: { $ne: null } })).status, 400);
      assert.equal((await h.asUser(instructor).post("/api/v1/course/requestEnrollment").send({})).status, 403);
      assert.equal((await h.api().post("/api/v1/course/requestEnrollment").send({})).status, 401);
      const draft = await seed.createCourse({ instructor, category, status: "Draft", requiresApproval: true });
      assert.equal((await h.asUser(student).post("/api/v1/course/requestEnrollment").send({ courseId: String(draft._id) })).status, 404);
    });
  });

  describe("deleteCourse", () => {
    it("cascades to sections, progress, notes, ratings and user references", async () => {
      const course = await seed.createCourse({ instructor, category, students: [student] });
      await seed.addSubSection(await seed.addSection(course));
      await h.asUser(student).post("/api/v1/course/saveNote").send({ courseId: String(course._id), content: "n" });
      await h.asUser(student).post("/api/v1/course/createRating").send({ courseId: String(course._id), rating: 3, review: "ok" });

      assert.equal((await h.asUser(otherInstructor).delete("/api/v1/course/deleteCourse").send({ courseId: String(course._id) })).status, 403);
      assert.equal((await h.asUser(instructor).delete("/api/v1/course/deleteCourse").send({ courseId: "bad" })).status, 400);
      const res = await h.asUser(instructor).delete("/api/v1/course/deleteCourse").send({ courseId: String(course._id) });
      assert.equal(res.status, 200, JSON.stringify(res.body));

      assert.equal(await Course.countDocuments(), 0);
      assert.equal(await Section.countDocuments(), 0);
      assert.equal(await SubSection.countDocuments(), 0);
      assert.equal(await CourseProgress.countDocuments(), 0);
      assert.equal(await RatingAndReview.countDocuments(), 0);
      const refreshedCategory = await Category.findById(category._id);
      assert.equal(refreshedCategory.courses.length, 0);
    });
  });
});
