const stubs = require("./stubFileUploader");
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const PNG_BYTES = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");

describe("upload guard", () => {
  let student;
  before(h.startTestEnvironment);
  after(h.stopTestEnvironment);
  beforeEach(async () => {
    await h.resetDatabase();
    student = await h.createUser();
  });

  const uploadAs = (fieldName, filename, contentType, bytes = PNG_BYTES) =>
    h.asUser(student).put("/api/v1/profile/updateUserProfileImage").attach(fieldName, bytes, { filename, contentType });

  it("accepts a real image for the profile image field", async () => {
    const res = await uploadAs("profileImage", "me.png", "image/png");
    assert.equal(res.status, 200);
  });

  it("rejects executables on any field", async () => {
    const res = await uploadAs("profileImage", "payload.exe", "application/octet-stream");
    assert.equal(res.status, 400);
  });

  it("rejects non-images on image fields even with a spoofed image mimetype", async () => {
    const res = await uploadAs("profileImage", "script.html", "image/png");
    assert.equal(res.status, 400);
  });

  it("rejects SVG profile images", async () => {
    const res = await uploadAs("profileImage", "me.svg", "image/svg+xml", Buffer.from("<svg/>"));
    assert.equal(res.status, 400);
  });

  it("rejects empty files", async () => {
    const res = await uploadAs("profileImage", "empty.png", "image/png", Buffer.alloc(0));
    assert.equal(res.status, 400);
  });

  it("still returns 400 when no file is sent", async () => {
    const res = await h.asUser(student).put("/api/v1/profile/updateUserProfileImage");
    assert.equal(res.status, 400);
  });
});
