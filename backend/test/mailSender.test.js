const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const mailSender = require("../src/utils/mailSender");

const MAIL_ENV_KEYS = [
  "MAIL_TRANSPORT", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN",
  "MAIL_SERVICE", "MAIL_HOST", "MAIL_PORT", "MAIL_SECURE", "MAIL_USER", "MAIL_PASS",
  "MAIL_FROM_NAME", "MAIL_FROM_EMAIL",
];

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("mailSender", () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  let savedEnv;
  let calls;
  let loggedErrors;

  const useGmailApi = () => {
    process.env.GMAIL_CLIENT_ID = "client-id";
    process.env.GMAIL_CLIENT_SECRET = "client-secret";
    process.env.GMAIL_REFRESH_TOKEN = "refresh-token";
    process.env.MAIL_FROM_EMAIL = "clzmate.info@gmail.com";
    process.env.MAIL_FROM_NAME = "ClzMate";
  };

  const mockGoogle = ({ tokenResponses = [], sendResponses = [] }) => {
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      const queue = String(url).includes("oauth2.googleapis.com") ? tokenResponses : sendResponses;
      const next = queue.length > 1 ? queue.shift() : queue[0];
      return typeof next === "function" ? next(options) : next.clone();
    };
  };

  beforeEach(() => {
    savedEnv = Object.fromEntries(MAIL_ENV_KEYS.map((key) => [key, process.env[key]]));
    MAIL_ENV_KEYS.forEach((key) => delete process.env[key]);
    calls = [];
    loggedErrors = [];
    console.error = (...args) => loggedErrors.push(args.map(String).join(" "));
    mailSender.resetForTests();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    MAIL_ENV_KEYS.forEach((key) => {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    });
  });

  it("sends through the Gmail API over HTTPS with a correct MIME message", async () => {
    useGmailApi();
    mockGoogle({
      tokenResponses: [jsonResponse(200, { access_token: "access-1", expires_in: 3600 })],
      sendResponses: [jsonResponse(200, { id: "msg-1" })],
    });

    const result = await mailSender("student@example.com", "OTP Verification Email", "<h2>123456</h2>");

    assert.deepEqual(result, { messageId: "msg-1", transport: "gmail-api" });
    const sendCall = calls.find((call) => call.url.includes("gmail.googleapis.com"));
    assert.equal(sendCall.options.headers.Authorization, "Bearer access-1");
    const mime = Buffer.from(JSON.parse(sendCall.options.body).raw, "base64url").toString("utf8");
    assert.match(mime, /^To: student@example\.com$/m);
    assert.match(mime, /^Subject: OTP Verification Email$/m);
    assert.match(mime, /^From: "?ClzMate"? <clzmate\.info@gmail\.com>$/m);
    assert.match(mime, /123456/);
  });

  it("caches the access token and shares one refresh between concurrent sends", async () => {
    useGmailApi();
    mockGoogle({
      tokenResponses: [jsonResponse(200, { access_token: "access-1", expires_in: 3600 })],
      sendResponses: [jsonResponse(200, { id: "msg" })],
    });

    await Promise.all([mailSender("a@example.com", "s", "b"), mailSender("b@example.com", "s", "b")]);
    await mailSender("c@example.com", "s", "b");

    assert.equal(calls.filter((call) => call.url.includes("oauth2")).length, 1);
    assert.equal(calls.filter((call) => call.url.includes("gmail.googleapis.com")).length, 3);
  });

  it("refreshes the token once and retries when the API answers 401", async () => {
    useGmailApi();
    mockGoogle({
      tokenResponses: [
        jsonResponse(200, { access_token: "stale", expires_in: 3600 }),
        jsonResponse(200, { access_token: "fresh", expires_in: 3600 }),
      ],
      sendResponses: [
        (options) => (options.headers.Authorization === "Bearer stale"
          ? jsonResponse(401, { error: { message: "Invalid Credentials" } })
          : jsonResponse(200, { id: "msg-2" })),
      ],
    });

    const result = await mailSender("a@example.com", "s", "b");
    assert.equal(result.messageId, "msg-2");
    assert.equal(calls.filter((call) => call.url.includes("oauth2")).length, 2);
  });

  it("returns null and explains a revoked refresh token instead of throwing", async () => {
    useGmailApi();
    mockGoogle({ tokenResponses: [jsonResponse(400, { error: "invalid_grant" })], sendResponses: [jsonResponse(200, {})] });

    assert.equal(await mailSender("a@example.com", "s", "b"), null);
    assert.ok(loggedErrors.some((line) => line.includes("get-gmail-refresh-token")));
    assert.equal(calls.filter((call) => call.url.includes("gmail.googleapis.com")).length, 0);
  });

  it("returns null on Gmail API errors and network failures", async () => {
    useGmailApi();
    mockGoogle({
      tokenResponses: [jsonResponse(200, { access_token: "access", expires_in: 3600 })],
      sendResponses: [jsonResponse(400, { error: { message: "Invalid To header" } })],
    });
    assert.equal(await mailSender("bad", "s", "b"), null);
    assert.ok(loggedErrors.some((line) => line.includes("Invalid To header")));

    globalThis.fetch = async () => {
      throw Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
    };
    mailSender.resetForTests();
    assert.equal(await mailSender("a@example.com", "s", "b"), null);
  });

  it("uses SMTP when Gmail API credentials are absent or MAIL_TRANSPORT=smtp, and fails fast", async () => {
    process.env.MAIL_HOST = "127.0.0.1";
    process.env.MAIL_PORT = "1";
    process.env.MAIL_USER = "user@example.com";
    process.env.MAIL_PASS = "secret";
    globalThis.fetch = async () => {
      throw new Error("fetch must not be used for SMTP");
    };

    const startedAt = Date.now();
    assert.equal(await mailSender("a@example.com", "s", "b"), null);
    assert.ok(Date.now() - startedAt < 12_000);
    assert.ok(loggedErrors.some((line) => line.includes("(smtp)")));

    useGmailApi();
    process.env.MAIL_TRANSPORT = "smtp";
    mailSender.resetForTests();
    assert.equal(await mailSender("a@example.com", "s", "b"), null);
    assert.ok(loggedErrors.every((line) => !line.includes("gmail-api")));
  });
});
