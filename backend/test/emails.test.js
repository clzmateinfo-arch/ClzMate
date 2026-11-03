process.env.FRONTEND_URL = "https://app.example.test";
process.env.MAIL_FROM_EMAIL = "support@example.test";

require("./stubFileUploader");
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");
const seed = require("./seed");
const templates = require("../src/mail/templates");
const mailSender = require("../src/utils/mailSender");
const Course = require("../src/models/course");
const User = require("../src/models/user");

const HOSTILE = `<img src=x onerror="alert(1)">'"&`;
const GMAIL_CLIP_BYTES = 102 * 1024;

const sampleEmails = () => ({
  otpEmail: templates.otpEmail({ name: HOSTILE, otp: "123456" }),
  welcomeStudent: templates.welcomeEmail({ name: HOSTILE, accountType: "Student", isPendingApproval: false }),
  welcomePendingInstructor: templates.welcomeEmail({ name: HOSTILE, accountType: "Instructor", isPendingApproval: true }),
  passwordResetRequestEmail: templates.passwordResetRequestEmail({ name: HOSTILE, resetUrl: "https://app.example.test/update-password/abc" }),
  passwordResetCompletedEmail: templates.passwordResetCompletedEmail({ name: HOSTILE }),
  passwordChangedEmail: templates.passwordChangedEmail({ name: HOSTILE }),
  enrollmentFree: templates.enrollmentConfirmedEmail({ name: HOSTILE, courseName: HOSTILE, instructorName: HOSTILE, reason: "free" }),
  enrollmentApproved: templates.enrollmentConfirmedEmail({ name: HOSTILE, courseName: HOSTILE, reason: "approved" }),
  enrollmentRequestInstructorEmail: templates.enrollmentRequestInstructorEmail({
    instructorName: HOSTILE, studentName: HOSTILE, studentEmail: HOSTILE, courseName: HOSTILE, courseId: "abc123",
  }),
  enrollmentRequestStudentEmail: templates.enrollmentRequestStudentEmail({ name: HOSTILE, courseName: HOSTILE, instructorName: HOSTILE }),
  enrollmentRejectedEmail: templates.enrollmentRejectedEmail({ name: HOSTILE, courseName: HOSTILE, note: HOSTILE }),
  paymentReceiptEmail: templates.paymentReceiptEmail({ name: HOSTILE, items: [{ courseName: HOSTILE, price: 1500.5 }], orderId: HOSTILE, paymentId: HOSTILE }),
  contactMessageEmail: templates.contactMessageEmail({ fullName: HOSTILE, email: "a@b.c", phone: HOSTILE, message: `${HOSTILE}\nsecond line` }),
  instructorApprovedEmail: templates.instructorApprovedEmail({ name: HOSTILE }),
});

describe("email templates", () => {
  it("render every template with escaping, branding, absolute links and a text version", () => {
    for (const [label, mail] of Object.entries(sampleEmails())) {
      assert.ok(mail.subject && !/[\r\n]/.test(mail.subject), `${label}: single-line subject`);
      assert.equal(mail.html.includes("<img src=x"), false, `${label}: raw HTML must be escaped`);
      assert.equal(mail.html.includes('onerror="alert'), false, `${label}: attribute injection escaped`);
      assert.match(mail.html, /^<!DOCTYPE html>/, `${label}: full document`);
      assert.ok(mail.html.includes("ClzMate"), `${label}: brand name`);
      assert.equal(/studynotion|i\.ibb\.co|FFD60A|Up Logo/i.test(mail.html), false, `${label}: no tutorial leftovers`);
      const hrefs = [...mail.html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
      assert.ok(hrefs.length > 0, `${label}: has links`);
      for (const href of hrefs) {
        assert.ok(href.startsWith("https://app.example.test") || href.startsWith("mailto:"), `${label}: absolute app link, got ${href}`);
      }
      assert.ok(mail.html.includes('src="https://app.example.test/logo.png"'), `${label}: logo from the app host`);
      assert.ok(mail.text.length > 40 && !/<[a-z]/i.test(mail.text.split(HOSTILE).join("")), `${label}: plain-text version without template markup`);
      assert.ok(mail.text.includes(HOSTILE) || label === "contactMessageEmail" || label === "otpEmail" || mail.text.includes("Hi "), `${label}: text keeps readable values`);
      assert.ok(Buffer.byteLength(mail.html) < GMAIL_CLIP_BYTES, `${label}: below Gmail clipping size`);
    }
  });

  it("puts the essential content of each email where users need it", () => {
    const mails = sampleEmails();
    assert.match(mails.otpEmail.subject, /^123456 is your ClzMate verification code$/);
    assert.ok(mails.otpEmail.text.includes("123456") && mails.otpEmail.text.includes("Expires in 5 minutes"));
    assert.ok(mails.welcomePendingInstructor.text.includes("pending approval"));
    assert.equal(mails.welcomeStudent.text.includes("pending approval"), false);
    assert.ok(mails.passwordResetRequestEmail.html.includes('href="https://app.example.test/update-password/abc"'));
    assert.ok(mails.passwordResetRequestEmail.text.includes("expires in 15 minutes"));
    assert.ok(mails.enrollmentApproved.text.includes("approved your enrollment request"));
    assert.ok(mails.enrollmentRequestInstructorEmail.html.includes('href="https://app.example.test/dashboard/course/abc123/requests"'));
    assert.ok(mails.enrollmentRejectedEmail.text.includes(`Note from the instructor: ${HOSTILE}`));
    assert.ok(mails.paymentReceiptEmail.text.includes("Total paid: Rs. 1,500.5"));
    assert.ok(mails.contactMessageEmail.text.includes("> second line"));
    assert.ok(mails.instructorApprovedEmail.html.includes('href="https://app.example.test/dashboard/add-course"'));
  });

  it("omits optional rows instead of printing empty values", () => {
    const rejected = templates.enrollmentRejectedEmail({ name: "Sam", courseName: "Algebra", note: "   " });
    assert.equal(rejected.text.includes("Note from the instructor"), false);
    const contact = templates.contactMessageEmail({ fullName: "Sam", email: "s@x.y", phone: "", message: "Hi" });
    assert.equal(contact.text.includes("Phone:"), false);
    const nameless = templates.passwordChangedEmail({ name: "" });
    assert.ok(nameless.text.includes("Hi there,"));
  });
});

describe("email events", () => {
  let instructor;
  let student;
  let admin;
  let category;

  before(h.startTestEnvironment);
  after(h.stopTestEnvironment);
  beforeEach(async () => {
    await h.resetDatabase();
    instructor = await h.createUser({ accountType: "Instructor", approved: true });
    student = await h.createUser({ accountType: "Student" });
    admin = await h.createUser({ accountType: "Admin" });
    category = await seed.createCategory();
  });

  const mailsTo = (email) => h.sentMails.filter((mail) => mail.to === email);
  const signupBody = (overrides = {}) => ({
    preferredName: "Nadee", firstName: "Nadee", lastName: "Perera", email: "nadee@example.test",
    password: "Passw0rd!long", confirmPassword: "Passw0rd!long", accountType: "Student", ...overrides,
  });

  async function signupAndVerify(overrides) {
    const body = signupBody(overrides);
    await h.api().post("/api/v1/auth/signup").send(body);
    await h.api().post("/api/v1/auth/sendotp").send({ email: body.email });
    const otpMail = mailsTo(body.email).find((mail) => /verification code$/.test(mail.subject));
    const res = await h.api().post("/api/v1/auth/verifyotp").send({ email: body.email, otp: otpMail.subject.slice(0, 6) });
    return { res, otpMail, email: body.email };
  }

  it("signup OTP greets the user by name and verification sends a welcome", async () => {
    const { res, otpMail, email } = await signupAndVerify();
    assert.equal(res.status, 200);
    assert.ok(otpMail.text.includes("Hi Nadee,"));
    const welcome = mailsTo(email).find((mail) => mail.subject === "Welcome to ClzMate");
    assert.ok(welcome, "welcome email sent");
    assert.equal(welcome.text.includes("pending approval"), false);
  });

  it("tells a newly verified instructor that approval is pending", async () => {
    const { email } = await signupAndVerify({ email: "teacher@example.test", accountType: "Instructor" });
    const welcome = mailsTo(email).find((mail) => mail.subject === "Welcome to ClzMate");
    assert.ok(welcome.text.includes("pending approval"));
  });

  it("does not send a welcome when OTP verification fails", async () => {
    await h.api().post("/api/v1/auth/signup").send(signupBody());
    await h.api().post("/api/v1/auth/sendotp").send({ email: "nadee@example.test" });
    const otp = mailsTo("nadee@example.test")[0].subject.slice(0, 6);
    await h.api().post("/api/v1/auth/verifyotp").send({ email: "nadee@example.test", otp: otp === "000000" ? "111111" : "000000" });
    assert.equal(mailsTo("nadee@example.test").some((mail) => mail.subject === "Welcome to ClzMate"), false);
  });

  it("verification still succeeds when the welcome email cannot be sent", async () => {
    await h.api().post("/api/v1/auth/signup").send(signupBody());
    await h.api().post("/api/v1/auth/sendotp").send({ email: "nadee@example.test" });
    const otp = mailsTo("nadee@example.test")[0].subject.slice(0, 6);
    const original = mailSender.sendTemplate;
    mailSender.sendTemplate = async () => null;
    try {
      const res = await h.api().post("/api/v1/auth/verifyotp").send({ email: "nadee@example.test", otp });
      assert.equal(res.status, 200);
      assert.equal((await User.findOne({ email: "nadee@example.test" })).verified, true);
    } finally {
      mailSender.sendTemplate = original;
    }
  });

  it("password reset sends the link, then a confirmation; failures send nothing extra", async () => {
    await h.api().post("/api/v1/auth/reset-password-token").send({ email: student.email });
    const resetMail = mailsTo(student.email).find((mail) => /^Reset your/.test(mail.subject));
    const token = resetMail.body.match(/https:\/\/app\.example\.test\/update-password\/([a-f0-9]{64})/)[1];

    const bad = await h.api().post("/api/v1/auth/reset-password").send({ token: "f".repeat(64), password: "NewPassw0rd!", confirmPassword: "NewPassw0rd!" });
    assert.equal(bad.status, 400);
    assert.equal(mailsTo(student.email).some((mail) => /was reset$/.test(mail.subject)), false);

    const ok = await h.api().post("/api/v1/auth/reset-password").send({ token, password: "NewPassw0rd!", confirmPassword: "NewPassw0rd!" });
    assert.equal(ok.status, 200);
    assert.equal(mailsTo(student.email).filter((mail) => /was reset$/.test(mail.subject)).length, 1);
  });

  it("password change sends a security notice only when it succeeds", async () => {
    const change = (oldPassword) =>
      h.asUser(student).post("/api/v1/auth/changepassword").send({ oldPassword, newPassword: "Another-pass1", confirmNewPassword: "Another-pass1" });
    assert.equal((await change("wrong-password")).status, 401);
    assert.equal(mailsTo(student.email).length, 0);
    assert.equal((await change(h.DEFAULT_PASSWORD)).status, 200);
    const notice = mailsTo(student.email);
    assert.equal(notice.length, 1);
    assert.match(notice[0].subject, /password was changed$/);
    assert.ok(notice[0].text.includes(`Hi ${student.preferredName},`));
  });

  it("free enrollment confirms the course and names the instructor", async () => {
    const course = await seed.createCourse({ instructor, category, price: 0, courseName: "Algebra Basics" });
    const res = await h.asUser(student).post("/api/v1/payment/verifyPayment").send({ coursesId: [String(course._id)] });
    assert.equal(res.status, 200);
    const [mail] = mailsTo(student.email);
    assert.equal(mail.subject, "You're enrolled in Algebra Basics");
    assert.ok(mail.text.includes("start learning right away"));
    assert.ok(mail.text.includes(`Instructor: ${instructor.firstName} ${instructor.lastName}`));
  });

  it("an enrollment request notifies the instructor and acknowledges the student once", async () => {
    const course = await seed.createCourse({ instructor, category, requiresApproval: true, courseName: "Geometry" });
    const request = () => h.asUser(student).post("/api/v1/course/requestEnrollment").send({ courseId: String(course._id) });
    await request();
    await request();

    const instructorMails = mailsTo(instructor.email);
    assert.equal(instructorMails.length, 1);
    assert.equal(instructorMails[0].subject, "New enrollment request for Geometry");
    assert.ok(instructorMails[0].text.includes(`Student: ${student.firstName} ${student.lastName}`));
    assert.ok(instructorMails[0].text.includes(`/dashboard/course/${course._id}/requests`));
    const studentMails = mailsTo(student.email);
    assert.equal(studentMails.length, 1);
    assert.equal(studentMails[0].subject, "Enrollment request sent: Geometry");
  });

  it("rejecting a request emails the student with the instructor's note", async () => {
    const course = await seed.createCourse({ instructor, category, requiresApproval: true, courseName: "Physics" });
    await h.asUser(student).post("/api/v1/course/requestEnrollment").send({ courseId: String(course._id) });
    const requestId = (await Course.findById(course._id)).enrollmentRequests[0]._id;
    h.sentMails.length = 0;
    const res = await h.asUser(instructor)
      .post(`/api/v1/course/enrollmentRequests/${course._id}/${requestId}/respond`)
      .send({ action: "reject", note: "Class is full this term" });
    assert.equal(res.status, 200);
    const [mail] = mailsTo(student.email);
    assert.equal(mail.subject, "Update on your request for Physics");
    assert.ok(mail.text.includes("Note from the instructor: Class is full this term"));
  });

  it("approving an instructor emails them once, and only on the transition", async () => {
    const pending = await h.createUser({ accountType: "Instructor", approved: false });
    const update = (body) => h.asUser(admin).post("/api/v1/admin/updateUser").send({ userId: String(pending._id), ...body });

    assert.equal((await update({ active: true })).status, 200);
    assert.equal(mailsTo(pending.email).length, 0);
    assert.equal((await update({ approved: true })).status, 200);
    assert.equal((await update({ approved: true })).status, 200);
    const approvals = mailsTo(pending.email);
    assert.equal(approvals.length, 1);
    assert.match(approvals[0].subject, /instructor account is approved$/);

    await h.asUser(admin).post("/api/v1/admin/updateUser").send({ userId: String(student._id), approved: true });
    assert.equal(mailsTo(student.email).length, 0);
  });
});
