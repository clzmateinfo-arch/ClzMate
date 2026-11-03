const { spawn } = require("child_process");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || "7.0.14";

async function main() {
  const mongoServer = await MongoMemoryServer.create();
  const extraArgs = process.argv.slice(2);
  const testFiles = extraArgs.length > 0 ? extraArgs : ["test/**/*.test.js"];

  const child = spawn(
    process.execPath,
    ["--test", "--test-concurrency=1", "--test-timeout=120000", ...testFiles],
    {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "test", TEST_MONGO_URI: mongoServer.getUri() },
    }
  );

  child.on("exit", async (code) => {
    await mongoServer.stop();
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
