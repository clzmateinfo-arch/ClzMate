const mongoose = require("mongoose");
require("dotenv-flow").config();

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
};

let hasRegisteredListeners = false;

function registerConnectionListeners() {
  if (hasRegisteredListeners) return;
  hasRegisteredListeners = true;
  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
  mongoose.connection.on("reconnected", () => console.log("MongoDB reconnected"));
  mongoose.connection.on("error", (error) => console.error("MongoDB connection error:", error));
  mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));
}

async function connectDB(uri = process.env.DATABASE_URL) {
  if (!uri) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  registerConnectionListeners();
  await mongoose.connect(uri, CONNECT_OPTIONS);
  return mongoose.connection;
}

module.exports = { connectDB };
