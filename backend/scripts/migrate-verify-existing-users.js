require("dotenv").config({ quiet: true });

const fs = require("fs");
const path = require("path");
const { MongoClient, ObjectId } = require("mongoose").mongo;

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, value = "true"] = argument.replace(/^--/, "").split("=");
    return [key, value];
  })
);

const isApply = args.apply === "true";
const cutoff = new Date(args.before || "");
const revertFile = args.revert;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const client = new MongoClient(process.env.DATABASE_URL, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const users = client.db().collection("users");

  try {
    if (revertFile) {
      const { ids } = JSON.parse(fs.readFileSync(revertFile, "utf8"));
      const objectIds = ids.map((id) => new ObjectId(id));
      console.log(`revert: ${objectIds.length} users listed in ${revertFile}`);
      if (!isApply) return console.log("dry run: add --apply to set verified=false on them again");
      const result = await users.updateMany({ _id: { $in: objectIds } }, { $set: { verified: false } });
      return console.log(`reverted: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
    }

    if (Number.isNaN(cutoff.getTime())) {
      throw new Error("--before=<ISO date> is required: only accounts created before it are marked verified");
    }

    const filter = { verified: { $ne: true }, createdAt: { $lt: cutoff } };
    const candidates = await users.find(filter, { projection: { _id: 1, accountType: 1 } }).toArray();
    const byRole = candidates.reduce((counts, user) => ({ ...counts, [user.accountType]: (counts[user.accountType] || 0) + 1 }), {});
    console.log(`users created before ${cutoff.toISOString()} and not verified: ${candidates.length}`, JSON.stringify(byRole));
    console.log(`unverified users created on/after the cutoff (left untouched): ${await users.countDocuments({ verified: { $ne: true }, createdAt: { $gte: cutoff } })}`);

    if (!isApply) return console.log("dry run: nothing changed. Re-run with --apply to mark them verified.");

    const backupPath = path.resolve(args.backup || `verify-migration-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ cutoff: cutoff.toISOString(), ids: candidates.map((user) => String(user._id)) }));
    const result = await users.updateMany(
      { _id: { $in: candidates.map((user) => user._id) }, verified: { $ne: true } },
      { $set: { verified: true } }
    );
    console.log(`applied: matched ${result.matchedCount}, modified ${result.modifiedCount}. Undo file: ${backupPath}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(`migration failed: ${error.message}`);
  process.exit(1);
});
