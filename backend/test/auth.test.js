const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");
const User = require("../src/models/user");
const OTP = require("../src/models/OTP");
const { hashResetToken } = require("../src/controllers/resetPassword");

const signupBody = (overrides = {}) => ({
  preferredName: "Sam",
  firstName: "Sam",
  lastName: "Lee",
  email: "sam@test.local",
  password: "Passw0rd!long",
  confirmPassword: "Passw0rd!long",
  accountType: "Student",
  ...overrides,
});

const extractOtp = () => {
  const mail = h.sentMails[h.sentMails.length - 1];
  return mail.body.match(/<h2 class="highlight">(\d{6})<\/h2>/)[1];
};

const registerAndVerify = async (email = "sam@test.local") => {
  await h.api().post("/api/v1/auth/signup").send(signupBody({ email }));
  await h.api().post("/api/v1/auth/sendotp").send({ email });
  await h.api().post("/api/v1/auth/verifyotp").send({ email, otp: extractOtp() });
};

describe("auth", () => {
  before(h.startTestEnvironment);
  after(h.stopTestEnvironment);
  beforeEach(h.resetDatabase);

  describe("signup", () => {
    it("creates an unverified student", async () => {
      const res = await h.api().post("/api/v1/auth/signup").send(signupBody());
      assert.equal(res.status, 201);
      const user = await User.findOne({ email: "sam@test.local" });
      assert.equal(user.verified, false);
      assert.equal(user.accountType, "Student");
    });

    it("rejects self-assigned Admin", async () => {
      const res = await h.api().post("/api/v1/auth/signup").send(signupBody({ accountType: "Admin" }));
      assert.equal(res.status, 400);
      assert.equal(await User.countDocuments(), 0);
    });

    it("rejects Parent (not a valid role)", async () => {
      const res = await h.api().post("/api/v1/auth/signup").send(signupBody({ accountType: "Parent" }));
      assert.equal(res.status, 400);
    });

    it("creates instructors unapproved", async () => {
      const res = await h.api().post("/api/v1/auth/signup").send(signupBody({ accountType: "Instructor" }));
      assert.equal(res.status, 201);
      assert.equal((await User.findOne({ email: "sam@test.local" })).approved, false);
    });

    it("rejects short passwords, mismatches, bad email and operator bodies", async () => {
      const cases = [
        signupBody({ password: "short", confirmPassword: "short" }),
        signupBody({ confirmPassword: "different-password" }),
        signupBody({ email: "not-an-email" }),
        signupBody({ email: { $ne: null } }),
        signupBody({ accountType: { $ne: "x" } }),
        {},
      ];
      for (const body of cases) {
        const res = await h.api().post("/api/v1/auth/signup").send(body);
        assert.equal(res.status, 400, JSON.stringify(body));
      }
    });

    it("does not let a repeat signup take over a verified account", async () => {
      await registerAndVerify();
      const res = await h.api().post("/api/v1/auth/signup").send(signupBody({ password: "Another!pass1", confirmPassword: "Another!pass1" }));
      assert.equal(res.status, 409);
      const login = await h.api().post("/api/v1/auth/login").send({ email: "sam@test.local", password: "Passw0rd!long" });
      assert.equal(login.status, 200);
    });

    it("normalizes email case", async () => {
      await h.api().post("/api/v1/auth/signup").send(signupBody({ email: "Sam@Test.Local" }));
      assert.ok(await User.findOne({ email: "sam@test.local" }));
    });
  });

  describe("otp", () => {
    beforeEach(async () => {
      await h.api().post("/api/v1/auth/signup").send(signupBody());
    });

    it("stores only a hash and emails the code", async () => {
      const res = await h.api().post("/api/v1/auth/sendotp").send({ email: "sam@test.local" });
      assert.equal(res.status, 200);
      const stored = await OTP.findOne({ email: "sam@test.local" }).lean();
      assert.equal(stored.otp, undefined);
      assert.notEqual(stored.otpHash, extractOtp());
      assert.match(extractOtp(), /^\d{6}$/);
    });

    it("throttles resend within the cooldown", async () => {
      await h.api().post("/api/v1/auth/sendotp").send({ email: "sam@test.local" });
      const res = await h.api().post("/api/v1/auth/sendotp").send({ email: "sam@test.local" });
      assert.equal(res.status, 429);
      assert.equal(h.sentMails.length, 1);
    });

    it("locks after 5 wrong attempts even if the right code follows", async () => {
      await h.api().post("/api/v1/auth/sendotp").send({ email: "sam@test.local" });
      const rightOtp = extractOtp();
      const wrongOtp = rightOtp === "000000" ? "111111" : "000000";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const res = await h.api().post("/api/v1/auth/verifyotp").send({ email: "sam@test.local", otp: wrongOtp });
        assert.equal(res.status, 400);
      }
      const res = await h.api().post("/api/v1/auth/verifyotp").send({ email: "sam@test.local", otp: rightOtp });
      assert.equal(res.status, 400);
      assert.equal((await User.findOne({ email: "sam@test.local" })).verified, false);
    });

    it("verifies with the right code and cannot be replayed", async () => {
      await h.api().post("/api/v1/auth/sendotp").send({ email: "sam@test.local" });
      const otp = extractOtp();
      const ok = await h.api().post("/api/v1/auth/verifyotp").send({ email: "sam@test.local", otp });
      assert.equal(ok.status, 200);
      assert.equal(await OTP.countDocuments({ email: "sam@test.local" }), 0);
      const replay = await h.api().post("/api/v1/auth/verifyotp").send({ email: "sam@test.local", otp });
      assert.equal(replay.status, 400);
    });

    it("does not reveal whether an email is registered on verify", async () => {
      const res = await h.api().post("/api/v1/auth/verifyotp").send({ email: "ghost@test.local", otp: "123456" });
      assert.equal(res.status, 400);
    });

    it("rejects operator payloads", async () => {
      const res = await h.api().post("/api/v1/auth/verifyotp").send({ email: "sam@test.local", otp: { $ne: "" } });
      assert.equal(res.status, 400);
    });

    it("refuses sendotp for an already verified user", async () => {
      await h.api().post("/api/v1/auth/sendotp").send({ email: "sam@test.local" });
      await h.api().post("/api/v1/auth/verifyotp").send({ email: "sam@test.local", otp: extractOtp() });
      const res = await h.api().post("/api/v1/auth/sendotp").send({ email: "sam@test.local" });
      assert.equal(res.status, 409);
    });
  });

  describe("login", () => {
    it("blocks unverified accounts", async () => {
      await h.api().post("/api/v1/auth/signup").send(signupBody());
      const res = await h.api().post("/api/v1/auth/login").send({ email: "sam@test.local", password: "Passw0rd!long" });
      assert.equal(res.status, 403);
    });

    it("logs in verified users without leaking secrets", async () => {
      await registerAndVerify();
      const res = await h.api().post("/api/v1/auth/login").send({ email: "sam@test.local", password: "Passw0rd!long" });
      assert.equal(res.status, 200);
      assert.ok(res.body.token);
      assert.equal(res.body.user.password, undefined);
      assert.equal(res.body.user.token, undefined);
      assert.ok(res.headers["set-cookie"][0].includes("HttpOnly"));
    });

    it("gives identical responses for unknown email and wrong password", async () => {
      await registerAndVerify();
      const wrongPassword = await h.api().post("/api/v1/auth/login").send({ email: "sam@test.local", password: "nope-nope-nope" });
      const unknownEmail = await h.api().post("/api/v1/auth/login").send({ email: "ghost@test.local", password: "nope-nope-nope" });
      assert.equal(wrongPassword.status, 401);
      assert.equal(unknownEmail.status, 401);
      assert.equal(wrongPassword.body.message, unknownEmail.body.message);
    });

    it("rejects operator-injection credentials", async () => {
      await registerAndVerify();
      const res = await h.api().post("/api/v1/auth/login").send({ email: { $ne: null }, password: { $ne: null } });
      assert.equal(res.status, 400);
    });

    it("blocks deactivated accounts", async () => {
      await registerAndVerify();
      await User.updateOne({ email: "sam@test.local" }, { active: false });
      const res = await h.api().post("/api/v1/auth/login").send({ email: "sam@test.local", password: "Passw0rd!long" });
      assert.equal(res.status, 403);
    });
  });

  describe("auth middleware", () => {
    it("rejects tokens of deleted users", async () => {
      const user = await h.createUser();
      const token = h.tokenFor(user);
      await User.deleteOne({ _id: user._id });
      const res = await h.api().get("/api/v1/profile/getUserDetails").set("Authorization", `Bearer ${token}`);
      assert.equal(res.status, 401);
    });

    it("rejects tokens of deactivated users", async () => {
      const user = await h.createUser();
      await User.updateOne({ _id: user._id }, { active: false });
      const res = await h.asUser(user).get("/api/v1/profile/getUserDetails");
      assert.equal(res.status, 401);
    });

    it("prefers the Authorization header over a stale login cookie", async () => {
      const admin = await h.createUser({ accountType: "Admin" });
      const student = await h.createUser({ accountType: "Student" });
      const res = await h.api().post("/api/v1/admin/getAllUsers")
        .set("Cookie", `token=${h.tokenFor(student)}`)
        .set("Authorization", `Bearer ${h.tokenFor(admin)}`)
        .send({});
      assert.equal(res.status, 200);
    });

    it("logout clears the login cookie", async () => {
      const res = await h.api().post("/api/v1/auth/logout");
      assert.equal(res.status, 200);
      assert.match(res.headers["set-cookie"][0], /token=;/);
    });

    it("rejects garbage and non-string tokens", async () => {
      const garbage = await h.api().get("/api/v1/profile/getUserDetails").set("Authorization", "Bearer not.a.jwt");
      assert.equal(garbage.status, 401);
      const objectToken = await h.api().post("/api/v1/auth/changepassword").send({ token: { $ne: null } });
      assert.equal(objectToken.status, 401);
    });

    it("returns 403 for wrong role", async () => {
      const student = await h.createUser({ accountType: "Student" });
      const res = await h.asUser(student).get("/api/v1/course/getInstructorCourses");
      assert.equal(res.status, 403);
    });

    it("returns 403 for unapproved instructors", async () => {
      const instructor = await h.createUser({ accountType: "Instructor", approved: false });
      const res = await h.asUser(instructor).get("/api/v1/course/getInstructorCourses");
      assert.equal(res.status, 403);
    });

    it("unblocks an instructor, with the same token, once an admin approves", async () => {
      const admin = await h.createUser({ accountType: "Admin" });
      const instructor = await h.createUser({ accountType: "Instructor", approved: false });
      const before = await h.asUser(instructor).get("/api/v1/course/getInstructorCourses");
      assert.equal(before.status, 403);
      const approve = await h.asUser(admin).post("/api/v1/admin/updateUser").send({ userId: String(instructor._id), approved: true });
      assert.equal(approve.status, 200);
      const after = await h.asUser(instructor).get("/api/v1/course/getInstructorCourses");
      assert.equal(after.status, 200);
    });

    it("lets approved instructors through", async () => {
      const instructor = await h.createUser({ accountType: "Instructor", approved: true });
      const res = await h.asUser(instructor).get("/api/v1/course/getInstructorCourses");
      assert.equal(res.status, 200);
    });
  });

  describe("change password", () => {
    it("invalidates previously issued tokens and enforces policy", async () => {
      const user = await h.createUser();
      const oldToken = h.tokenFor(user);
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const weak = await h.asUser(user).post("/api/v1/auth/changepassword").send({
        oldPassword: h.DEFAULT_PASSWORD, newPassword: "short", confirmNewPassword: "short",
      });
      assert.equal(weak.status, 400);

      const ok = await h.asUser(user).post("/api/v1/auth/changepassword").send({
        oldPassword: h.DEFAULT_PASSWORD, newPassword: "Brand-new-pass1", confirmNewPassword: "Brand-new-pass1",
      });
      assert.equal(ok.status, 200);

      const stale = await h.api().get("/api/v1/profile/getUserDetails").set("Authorization", `Bearer ${oldToken}`);
      assert.equal(stale.status, 401);

      const login = await h.api().post("/api/v1/auth/login").send({ email: user.email, password: "Brand-new-pass1" });
      assert.equal(login.status, 200);
      const fresh = await h.api().get("/api/v1/profile/getUserDetails").set("Authorization", `Bearer ${login.body.token}`);
      assert.equal(fresh.status, 200);
    });

    it("rejects a wrong old password", async () => {
      const user = await h.createUser();
      const res = await h.asUser(user).post("/api/v1/auth/changepassword").send({
        oldPassword: "wrong-old-password", newPassword: "Brand-new-pass1", confirmNewPassword: "Brand-new-pass1",
      });
      assert.equal(res.status, 401);
    });
  });

  describe("password reset", () => {
    const requestResetToken = async (email) => {
      h.sentMails.length = 0;
      await h.api().post("/api/v1/auth/reset-password-token").send({ email });
      const mail = h.sentMails[0];
      return mail ? mail.body.match(/update-password\/([a-f0-9]{64})/)[1] : null;
    };

    it("answers identically for unknown emails and sends no mail", async () => {
      const known = await h.createUser({ email: "known@test.local" });
      const knownRes = await h.api().post("/api/v1/auth/reset-password-token").send({ email: known.email });
      h.sentMails.length = 0;
      const unknownRes = await h.api().post("/api/v1/auth/reset-password-token").send({ email: "ghost@test.local" });
      assert.equal(knownRes.status, 200);
      assert.equal(unknownRes.status, 200);
      assert.equal(knownRes.body.message, unknownRes.body.message);
      assert.equal(h.sentMails.length, 0);
    });

    it("stores only the hash of the token", async () => {
      const user = await h.createUser({ email: "known@test.local" });
      const token = await requestResetToken(user.email);
      const stored = await User.findById(user._id).select("+token");
      assert.equal(stored.token, hashResetToken(token));
      assert.notEqual(stored.token, token);
    });

    it("resets with a valid token once, then the token is dead", async () => {
      const user = await h.createUser({ email: "known@test.local" });
      const token = await requestResetToken(user.email);
      const body = { token, password: "Reset-pass-123", confirmPassword: "Reset-pass-123" };
      const first = await h.api().post("/api/v1/auth/reset-password").send(body);
      assert.equal(first.status, 200);
      const second = await h.api().post("/api/v1/auth/reset-password").send(body);
      assert.equal(second.status, 400);
      const login = await h.api().post("/api/v1/auth/login").send({ email: user.email, password: "Reset-pass-123" });
      assert.equal(login.status, 200);
    });

    it("cannot be hijacked with an operator token", async () => {
      const victim = await h.createUser({ email: "victim@test.local" });
      await requestResetToken(victim.email);
      const res = await h.api().post("/api/v1/auth/reset-password").send({
        token: { $ne: null }, password: "Hijacked-pass1", confirmPassword: "Hijacked-pass1",
      });
      assert.equal(res.status, 400);
      const login = await h.api().post("/api/v1/auth/login").send({ email: victim.email, password: "Hijacked-pass1" });
      assert.equal(login.status, 401);
    });

    it("does not accept the login cookie as a reset token", async () => {
      const user = await h.createUser({ email: "known@test.local" });
      const res = await h.api().post("/api/v1/auth/reset-password")
        .set("Cookie", `token=${h.tokenFor(user)}`)
        .send({ password: "Reset-pass-123", confirmPassword: "Reset-pass-123" });
      assert.equal(res.status, 400);
    });

    it("rejects expired tokens and weak passwords", async () => {
      const user = await h.createUser({ email: "known@test.local" });
      const token = await requestResetToken(user.email);
      const weak = await h.api().post("/api/v1/auth/reset-password").send({ token, password: "short", confirmPassword: "short" });
      assert.equal(weak.status, 400);
      await User.updateOne({ _id: user._id }, { resetPasswordTokenExpires: new Date(Date.now() - 1000) });
      const expired = await h.api().post("/api/v1/auth/reset-password").send({ token, password: "Reset-pass-123", confirmPassword: "Reset-pass-123" });
      assert.equal(expired.status, 400);
    });

    it("kills sessions issued before the reset", async () => {
      const user = await h.createUser({ email: "known@test.local" });
      const oldToken = h.tokenFor(user);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const token = await requestResetToken(user.email);
      await h.api().post("/api/v1/auth/reset-password").send({ token, password: "Reset-pass-123", confirmPassword: "Reset-pass-123" });
      const res = await h.api().get("/api/v1/profile/getUserDetails").set("Authorization", `Bearer ${oldToken}`);
      assert.equal(res.status, 401);
    });

    it("handles missing and malformed input without a 500", async () => {
      for (const body of [{}, { token: 123 }, { email: { $gt: "" } }]) {
        const a = await h.api().post("/api/v1/auth/reset-password").send(body);
        const b = await h.api().post("/api/v1/auth/reset-password-token").send(body);
        assert.ok(a.status < 500 && b.status < 500, JSON.stringify(body));
      }
    });
  });
});
