process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-1234";
process.env.JWT_EXPIRES = "1h";
process.env.CORS_ALLOWED_ORIGINS = "http://localhost:5173";
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || "7.0.14";
process.env.MAIL_USER = "noreply@test.local";
process.env.CLOUD_NAME = "";
process.env.API_KEY = "";
process.env.API_SECRET = "";

const path = require("path");

const sentMails = [];
const mailSenderPath = require.resolve("../src/utils/mailSender");
require.cache[mailSenderPath] = {
  id: mailSenderPath,
  filename: mailSenderPath,
  loaded: true,
  exports: Object.assign(
    async (to, subject, body, options = {}) => {
      sentMails.push({ to, subject, body, text: options.text, replyTo: options.replyTo });
      return { messageId: "test" };
    },
    {
      sendTemplate: async (to, mail, options = {}) => {
        sentMails.push({ to, subject: mail.subject, body: mail.html, text: mail.text, replyTo: options.replyTo });
        return { messageId: "test" };
      },
    }
  ),
};

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const { createApp } = require(path.join("..", "src", "app"));
const { signToken } = require("../src/utils/jwt");
const User = require("../src/models/user");
const Profile = require("../src/models/profile");

let mongoServer;
let app;

async function startTestEnvironment() {
  const sharedUri = process.env.TEST_MONGO_URI;
  if (!sharedUri) mongoServer = await MongoMemoryServer.create();
  const dbName = `clzmate_test_${process.pid}`;
  await mongoose.connect(sharedUri || mongoServer.getUri(), { dbName });
  app = createApp();
  return app;
}

async function stopTestEnvironment() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

async function resetDatabase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  sentMails.length = 0;
}

const DEFAULT_PASSWORD = "Passw0rd!long";

async function createUser({ accountType = "Student", email, verified = true, approved, active = true, password = DEFAULT_PASSWORD } = {}) {
  const uniqueEmail = email || `${accountType.toLowerCase()}-${new mongoose.Types.ObjectId()}@test.local`;
  const profile = await Profile.create({ gender: null, dateOfBirth: null, about: null, contactNumber: null });
  const user = await User.create({
    preferredName: accountType,
    firstName: accountType,
    lastName: "Tester",
    email: uniqueEmail,
    password: await bcrypt.hash(password, 4),
    accountType,
    additionalDetails: profile._id,
    verified,
    active,
    approved: approved === undefined ? accountType !== "Instructor" : approved,
    image: "",
  });
  return user;
}

function tokenFor(user) {
  return signToken({ email: user.email, id: String(user._id), accountType: user.accountType });
}

function api() {
  return request(app);
}

function asUser(user) {
  const token = tokenFor(user);
  return {
    get: (url) => request(app).get(url).set("Authorization", `Bearer ${token}`),
    post: (url) => request(app).post(url).set("Authorization", `Bearer ${token}`),
    put: (url) => request(app).put(url).set("Authorization", `Bearer ${token}`),
    patch: (url) => request(app).patch(url).set("Authorization", `Bearer ${token}`),
    delete: (url) => request(app).delete(url).set("Authorization", `Bearer ${token}`),
  };
}

module.exports = {
  startTestEnvironment,
  stopTestEnvironment,
  resetDatabase,
  createUser,
  tokenFor,
  api,
  asUser,
  sentMails,
  DEFAULT_PASSWORD,
};
