require("./stubFileUploader");
const crypto = require("node:crypto");
const { describe, it, before, after, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");
const seed = require("./seed");
const Course = require("../src/models/course");
const CourseProgress = require("../src/models/courseProgress");
const User = require("../src/models/user");

describe("payment, enrollment and cart endpoints", () => {
  let instructor;
  let student;
  let freeCourse;
  let paidCourse;
  let approvalCourse;
  const originalEnv = {};

  before(h.startTestEnvironment);
  after(h.stopTestEnvironment);
  beforeEach(async () => {
    for (const key of ["NODE_ENV", "ALLOW_STUBBED_PAYMENT", "RAZORPAY_SECRET"]) originalEnv[key] = process.env[key];
    delete process.env.ALLOW_STUBBED_PAYMENT;
    delete process.env.RAZORPAY_SECRET;
    await h.resetDatabase();
    instructor = await h.createUser({ accountType: "Instructor", approved: true });
    student = await h.createUser({ accountType: "Student" });
    const category = await seed.createCategory();
    freeCourse = await seed.createCourse({ instructor, category, price: 0, courseName: "Free" });
    paidCourse = await seed.createCourse({ instructor, category, price: 50, courseName: "Paid" });
    approvalCourse = await seed.createCourse({ instructor, category, price: 0, requiresApproval: true, courseName: "Gated" });
  });
  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const verify = (user, body) => h.asUser(user).post("/api/v1/payment/verifyPayment").send(body);
  const isEnrolled = async (course) => !!(await Course.exists({ _id: course._id, studentsEnrolled: student._id }));

  describe("verifyPayment", () => {
    it("rejects anonymous, non-student, malformed and operator-injection requests", async () => {
      assert.equal((await h.api().post("/api/v1/payment/verifyPayment").send({})).status, 401);
      assert.equal((await verify(instructor, { coursesId: [String(freeCourse._id)] })).status, 403);
      assert.equal((await verify(student, {})).status, 400);
      assert.equal((await verify(student, { coursesId: [] })).status, 400);
      assert.equal((await verify(student, { coursesId: "abc" })).status, 400);
      assert.equal((await verify(student, { coursesId: ["not-an-id"] })).status, 400);
      assert.equal((await verify(student, { coursesId: [{ $ne: null }] })).status, 400);
      assert.equal((await verify(student, { coursesId: { $ne: null } })).status, 400);
      assert.equal((await verify(student, { coursesId: [String(seed.newId())] })).status, 404);
    });

    it("does not enroll a student in a paid course without payment (402)", async () => {
      const res = await verify(student, { coursesId: [String(paidCourse._id)] });
      assert.equal(res.status, 402);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, "Payment gateway not configured");
      assert.equal(await isEnrolled(paidCourse), false);
      assert.equal(await CourseProgress.countDocuments({ userId: student._id }), 0);
    });

    it("rejects the whole request when a paid course is mixed in with free ones", async () => {
      const res = await verify(student, { coursesId: [String(freeCourse._id), String(paidCourse._id)] });
      assert.equal(res.status, 402);
      assert.equal(await isEnrolled(freeCourse), false);
    });

    it("rejects a paid course with a forged signature even when the gateway secret is configured", async () => {
      process.env.RAZORPAY_SECRET = "gateway-secret";
      const forged = await verify(student, {
        coursesId: [String(paidCourse._id)],
        razorpay_order_id: "order_1",
        razorpay_payment_id: "pay_1",
        razorpay_signature: "deadbeef",
      });
      assert.equal(forged.status, 400);
      const missing = await verify(student, { coursesId: [String(paidCourse._id)] });
      assert.equal(missing.status, 402);
      assert.equal(await isEnrolled(paidCourse), false);
    });

    it("enrolls a paid course when the HMAC signature is valid", async () => {
      process.env.RAZORPAY_SECRET = "gateway-secret";
      const signature = crypto.createHmac("sha256", "gateway-secret").update("order_1|pay_1").digest("hex");
      const res = await verify(student, {
        coursesId: [String(paidCourse._id)],
        razorpay_order_id: "order_1",
        razorpay_payment_id: "pay_1",
        razorpay_signature: signature,
      });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(res.body.results[0].status, "enrolled");
      assert.equal(await isEnrolled(paidCourse), true);
    });

    it("enrolls free courses, creates progress once, sends an email and skips repeats", async () => {
      const res = await verify(student, { coursesId: [String(freeCourse._id), String(freeCourse._id)] });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(res.body.results.length, 1);
      assert.equal(res.body.results[0].status, "enrolled");
      assert.equal(await isEnrolled(freeCourse), true);
      assert.equal(await CourseProgress.countDocuments({ userId: student._id, courseID: freeCourse._id }), 1);
      const refreshed = await User.findById(student._id);
      assert.equal(refreshed.courses.length, 1);
      assert.equal(refreshed.courseProgress.length, 1);
      assert.ok(h.sentMails.some((mail) => mail.to === student.email));

      const repeat = await verify(student, { coursesId: [String(freeCourse._id)] });
      assert.equal(repeat.status, 200);
      assert.equal(repeat.body.results[0].status, "already-enrolled");
      assert.equal((await Course.findById(freeCourse._id)).studentsEnrolled.length, 1);
      assert.equal(await CourseProgress.countDocuments({ userId: student._id }), 1);
    });

    it("creates a single pending request for approval courses without enrolling", async () => {
      await verify(student, { coursesId: [String(approvalCourse._id)] });
      const second = await verify(student, { coursesId: [String(approvalCourse._id)] });
      assert.equal(second.body.results[0].status, "pending");
      const stored = await Course.findById(approvalCourse._id);
      assert.equal(stored.studentsEnrolled.length, 0);
      assert.equal(stored.enrollmentRequests.length, 1);
      assert.equal(h.sentMails.filter((mail) => mail.to === instructor.email).length, 1);
    });

    it("does not enroll unpublished courses", async () => {
      const draft = await seed.createCourse({ instructor, price: 0, status: "Draft" });
      const res = await verify(student, { coursesId: [String(draft._id)] });
      assert.equal(res.status, 404);
    });

    it("keeps the stubbed development behaviour only outside production with the explicit flag", async () => {
      process.env.ALLOW_STUBBED_PAYMENT = "true";
      process.env.NODE_ENV = "production";
      assert.equal((await verify(student, { coursesId: [String(paidCourse._id)] })).status, 402);
      process.env.NODE_ENV = "test";
      const res = await verify(student, { coursesId: [String(paidCourse._id)] });
      assert.equal(res.status, 200);
      assert.equal(await isEnrolled(paidCourse), true);
    });
  });

  describe("capturePayment", () => {
    const capture = (user, body) => h.asUser(user).post("/api/v1/payment/capturePayment").send(body);

    it("validates input and role", async () => {
      assert.equal((await h.api().post("/api/v1/payment/capturePayment").send({})).status, 401);
      assert.equal((await capture(instructor, { coursesId: [String(freeCourse._id)] })).status, 403);
      assert.equal((await capture(student, {})).status, 400);
      assert.equal((await capture(student, { coursesId: [] })).status, 400);
      assert.equal((await capture(student, { coursesId: ["bad"] })).status, 400);
      assert.equal((await capture(student, { coursesId: [String(seed.newId())] })).status, 404);
    });

    it("computes the total from database prices and rejects already enrolled students", async () => {
      const res = await capture(student, { coursesId: [String(paidCourse._id), String(freeCourse._id)], amount: 1, price: 1 });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(res.body.data.totalAmount, 50);
      assert.match(res.body.data.receipt, /^rcpt_/);

      await verify(student, { coursesId: [String(freeCourse._id)] });
      const again = await capture(student, { coursesId: [String(freeCourse._id)] });
      assert.equal(again.status, 400);
    });
  });

  describe("sendPaymentSuccessEmail", () => {
    const send = (user, body) => h.asUser(user).post("/api/v1/payment/sendPaymentSuccessEmail").send(body);

    it("computes the amount server side and refuses courses the student is not enrolled in", async () => {
      process.env.ALLOW_STUBBED_PAYMENT = "true";
      await verify(student, { coursesId: [String(paidCourse._id)] });
      h.sentMails.length = 0;

      const ok = await send(student, { orderId: "order<script>", paymentId: "pay_1", coursesId: [String(paidCourse._id)], amount: 1 });
      assert.equal(ok.status, 200, JSON.stringify(ok.body));
      const mail = h.sentMails.find((entry) => entry.subject === "Payment Received");
      assert.ok(mail.body.includes("$50"));
      assert.equal(mail.body.includes("<script>"), false);

      assert.equal((await send(student, { orderId: "o", paymentId: "p", coursesId: [String(freeCourse._id)] })).status, 403);
      assert.equal((await send(student, { orderId: "o", paymentId: "p" })).status, 400);
      assert.equal((await send(student, { orderId: { $ne: 1 }, paymentId: "p", coursesId: [String(paidCourse._id)] })).status, 400);
      assert.equal((await send(instructor, { orderId: "o", paymentId: "p", coursesId: [String(paidCourse._id)] })).status, 403);
      assert.equal((await h.api().post("/api/v1/payment/sendPaymentSuccessEmail").send({})).status, 401);
    });
  });

  describe("cart", () => {
    const addToCart = (user, courseId) => h.asUser(user).post("/api/v1/cart").send({ courseId });

    it("requires authentication and a valid course id", async () => {
      assert.equal((await h.api().get("/api/v1/cart")).status, 401);
      assert.equal((await addToCart(student, "bad")).status, 400);
      assert.equal((await addToCart(student, { $ne: null })).status, 400);
      assert.equal((await h.asUser(student).delete("/api/v1/cart/bad")).status, 400);
      assert.equal((await addToCart(student, String(seed.newId()))).status, 404);
    });

    it("adds, totals, dedupes, removes and clears", async () => {
      const added = await addToCart(student, String(paidCourse._id));
      assert.equal(added.status, 200, JSON.stringify(added.body));
      assert.equal(added.body.data.total, 50);
      assert.equal((await addToCart(student, String(paidCourse._id))).status, 400);
      await addToCart(student, String(freeCourse._id));

      const fetched = await h.asUser(student).get("/api/v1/cart");
      assert.equal(fetched.body.data.totalItems, 2);
      assert.equal(fetched.body.data.total, 50);

      const removed = await h.asUser(student).delete(`/api/v1/cart/${paidCourse._id}`);
      assert.equal(removed.body.data.totalItems, 1);
      assert.equal(removed.body.data.total, 0);

      const cleared = await h.asUser(student).post("/api/v1/cart/clear");
      assert.equal(cleared.status, 200);
      assert.equal((await User.findById(student._id)).cart.length, 0);
    });

    it("rejects courses that are already enrolled or unpublished", async () => {
      await verify(student, { coursesId: [String(freeCourse._id)] });
      assert.equal((await addToCart(student, String(freeCourse._id))).status, 400);
      const draft = await seed.createCourse({ instructor, status: "Draft", price: 10 });
      assert.equal((await addToCart(student, String(draft._id))).status, 404);
      assert.equal((await User.findById(student._id)).cart.length, 0);
    });
  });
});
