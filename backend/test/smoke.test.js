const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

describe("app smoke", () => {
  before(h.startTestEnvironment);
  after(h.stopTestEnvironment);
  beforeEach(h.resetDatabase);

  it("returns JSON 404 for unknown routes", async () => {
    const res = await h.api().get("/api/v1/nope");
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it("rejects protected route without token", async () => {
    const res = await h.api().get("/api/v1/profile/getUserDetails");
    assert.equal(res.status, 401);
  });

  it("accepts a valid token for an existing user", async () => {
    const user = await h.createUser();
    const res = await h.asUser(user).get("/api/v1/profile/getUserDetails");
    assert.equal(res.status, 200);
  });

  it("blocks disallowed CORS origins", async () => {
    const res = await h.api().get("/").set("Origin", "http://evil.test");
    assert.equal(res.status, 403);
  });

  it("strips operator keys from request bodies", async () => {
    const res = await h.api().post("/api/v1/auth/login").send({ email: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
  });
});
