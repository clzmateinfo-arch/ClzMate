require("dotenv").config();
require("dotenv-flow").config({ silent: true });

const { createApp } = require("./src/app");
const { connectDB } = require("./src/config/database");
const { cloudinaryConnect } = require("./src/config/cloudinary");
const { assertSecurityConfig } = require("./src/config/securityConfig");
const { snapshotPublisher } = require("./src/utils/snapshotPublisher");

const SNAPSHOT_BOOT_DELAY_MS = 3000;

async function start() {
  assertSecurityConfig();
  await connectDB();
  cloudinaryConnect();

  const port = process.env.PORT || 5000;
  const server = createApp().listen(port, () => {
    console.log(`Server started on port ${port} in ${process.env.NODE_ENV || "development"} mode`);
  });

  setTimeout(() => {
    snapshotPublisher.syncOnBoot().catch((error) => console.error("[snapshot] boot sync failed:", error.message));
  }, SNAPSHOT_BOOT_DELAY_MS).unref();

  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
