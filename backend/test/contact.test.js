require("./stubFileUploader");
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

describe("contact form endpoint", () => {
  before(h.startTestEnvironment);
  after(h.stopTestEnvironment);
  beforeEach(h.resetDatabase);

  const submit = (body) => h.api().post("/api/v1/reach/contact").send(body);
  const valid = { firstName: "Ann", lastName: "Lee", email: "ann@example.com", phone: "+94771234567", message: "Hello there" };

  it("sends an HTML-escaped email to the configured inbox and answers success", async () => {
    const res = await submit({ ...valid, message: "<script>alert(1)</script>\nline2", firstName: "A<b>\r\nBcc: x@y.z" });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.success, true);
    assert.equal(h.sentMails.length, 1);
    const [mail] = h.sentMails;
    assert.equal(mail.to, process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER);
    assert.equal(mail.body.includes("<script>"), false);
    assert.ok(mail.body.includes("&lt;script&gt;"));
    assert.equal(/[\r\n]/.test(mail.subject), false);
    assert.equal(mail.replyTo, "ann@example.com");
    assert.ok(mail.text.includes("> line2"));
  });

  it("accepts the payload without optional fields", async () => {
    const res = await submit({ firstName: "Ann", email: "ann@example.com", message: "Hi" });
    assert.equal(res.status, 200);
  });

  it("rejects missing, malformed, oversized and operator-injection payloads", async () => {
    const cases = [
      {},
      { ...valid, firstName: "" },
      { ...valid, email: "not-an-email" },
      { ...valid, email: "a@b" },
      { ...valid, message: "" },
      { ...valid, message: "x".repeat(5001) },
      { ...valid, firstName: "x".repeat(101) },
      { ...valid, email: { $ne: null } },
      { ...valid, message: ["a"] },
      { ...valid, phone: "1".repeat(31) },
    ];
    for (const body of cases) assert.equal((await submit(body)).status, 400, JSON.stringify(body).slice(0, 60));
    assert.equal(h.sentMails.length, 0);
  });
});
