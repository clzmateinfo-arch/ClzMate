import os from "os";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
import zlib from "zlib";
import tar from "tar";
import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import { google } from "googleapis";
import { MongoClient } from "mongodb";
import { EJSON } from "bson";
import fsExtra from "fs-extra";

dotenv.config();

const {
    MONGO_URI,
    MONGO_DBS = "",
    BACKUP_DIR = path.join(process.cwd(), "backups"),
    GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REFRESH_TOKEN,
    DRIVE_FOLDER_ID,
    TOKEN_FILE_PATH = path.join(process.cwd(), "drive_access_token.json"),
    RETENTION_COUNT = "10",
    RESTORE_BATCH_SIZE = "1000",
    PORT = "3500"
} = process.env;

if (!MONGO_URI) {
    console.error("MONGO_URI is required in env.");
    process.exit(1);
}
if (!DRIVE_FOLDER_ID) {
    console.error("DRIVE_FOLDER_ID is required in env.");
    process.exit(1);
}

const RETENTION = parseInt(RETENTION_COUNT, 10);
const RESTORE_BATCH = parseInt(RESTORE_BATCH_SIZE, 10);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureDir(dir) {
    await fsExtra.mkdirp(dir);
}

function nowTs() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/* ---------- Token file helpers + Drive client (OAuth refresh -> token file) ---------- */

function resolveKeyPath(p) {
    if (!p) return null;
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

async function readSavedToken() {
    try {
        if (!(await fsExtra.pathExists(TOKEN_FILE_PATH))) return null;
        const raw = await fsp.readFile(TOKEN_FILE_PATH, "utf8");
        const json = JSON.parse(raw);
        if (!json.access_token || !json.expiry_date) return null;
        return json;
    } catch (err) {
        console.warn("Failed to read token file:", err && err.message);
        return null;
    }
}

async function saveToken(tokenObj) {
    try {
        await ensureDir(path.dirname(TOKEN_FILE_PATH));
        await fsp.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokenObj, null, 2), { encoding: "utf8", mode: 0o600 });
        console.log("Saved Drive access token to", TOKEN_FILE_PATH);
    } catch (err) {
        console.warn("Failed to save token file:", err && err.message);
    }
}

async function refreshAndSaveAccessToken() {
    if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REFRESH_TOKEN) {
        throw new Error("Missing OAuth config (GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN) required to refresh access token.");
    }

    const oauth2Client = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });

    // refresh token explicitly
    const tokenRes = await oauth2Client.refreshToken(GOOGLE_OAUTH_REFRESH_TOKEN);
    const creds = tokenRes && tokenRes.tokens ? tokenRes.tokens : tokenRes;
    if (!creds || !creds.access_token) throw new Error("Failed to obtain access token via refresh");
    const expiry = creds.expiry_date || (Date.now() + ((creds.expires_in || 3600) * 1000));
    const tokenObj = { access_token: creds.access_token, expiry_date: expiry, scope: creds.scope, token_type: creds.token_type };
    await saveToken(tokenObj);
    return tokenObj;
}

async function ensureValidAccessToken() {
    const saved = await readSavedToken();
    if (saved) {
        if (saved.expiry_date && Number(saved.expiry_date) - 30000 > Date.now()) {
            return saved;
        }
        if (GOOGLE_OAUTH_REFRESH_TOKEN) {
            try {
                return await refreshAndSaveAccessToken();
            } catch (err) {
                console.warn("Failed to refresh token:", err && err.message);
            }
        }
        return null;
    } else {
        if (GOOGLE_OAUTH_REFRESH_TOKEN) {
            return await refreshAndSaveAccessToken();
        }
        return null;
    }
}

async function createDriveClient() {
    // OAuth2 (personal Drive) preferred
    if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET) {
        const token = await ensureValidAccessToken();
        if (!token || !token.access_token) {
            throw new Error("No valid access token available for OAuth2. Provide GOOGLE_OAUTH_REFRESH_TOKEN to allow refreshing.");
        }
        const oauth2Client = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);
        const creds = { access_token: token.access_token };
        if (GOOGLE_OAUTH_REFRESH_TOKEN) creds.refresh_token = GOOGLE_OAUTH_REFRESH_TOKEN;
        if (token.expiry_date) creds.expiry_date = Number(token.expiry_date);
        oauth2Client.setCredentials(creds);

        // proactive refresh if very near expiry
        if (creds.expiry_date && Number(creds.expiry_date) - 30000 <= Date.now() && GOOGLE_OAUTH_REFRESH_TOKEN) {
            try {
                const refreshed = await oauth2Client.refreshAccessToken();
                const newCreds = (refreshed && refreshed.credentials) ? refreshed.credentials : refreshed;
                if (newCreds && newCreds.access_token) {
                    const tokenObj = {
                        access_token: newCreds.access_token,
                        expiry_date: newCreds.expiry_date || (Date.now() + ((newCreds.expires_in || 3600) * 1000)),
                        scope: newCreds.scope,
                        token_type: newCreds.token_type
                    };
                    await saveToken(tokenObj);
                    oauth2Client.setCredentials(tokenObj);
                }
            } catch (err) {
                console.warn("Failed to proactively refresh OAuth token:", err && err.message);
            }
        }

        return google.drive({ version: "v3", auth: oauth2Client });
    }

    // Fallback: service account JWT (Shared Drive scenario)
    if (GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
        const resolvedPath = resolveKeyPath(GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
        console.log(`Using Google service account key at: ${resolvedPath}`);
        try {
            await fsp.access(resolvedPath, fs.constants.R_OK);
        } catch (err) {
            throw new Error(`Service account key file not found or not readable at: ${resolvedPath}`);
        }
        let keyJson;
        try {
            const raw = await fsp.readFile(resolvedPath, "utf8");
            keyJson = JSON.parse(raw);
        } catch (err) {
            throw new Error(`Failed to read/parse service account key JSON at ${resolvedPath}: ${err && err.message}`);
        }
        if (!keyJson.client_email || !keyJson.private_key) {
            throw new Error("Service account JSON missing client_email or private_key.");
        }
        const scopes = ["https://www.googleapis.com/auth/drive"];
        const jwtClient = new google.auth.JWT({
            email: keyJson.client_email,
            key: keyJson.private_key,
            scopes
        });
        await jwtClient.authorize();
        return google.drive({ version: "v3", auth: jwtClient });
    }

    throw new Error("No Drive authentication configured: set GOOGLE_OAUTH_CLIENT_ID/SECRET and optionally GOOGLE_OAUTH_REFRESH_TOKEN, or set GOOGLE_SERVICE_ACCOUNT_KEY_PATH for Shared Drive usage.");
}

/* ---------- Backup/restore logic (unchanged except safe-delete additions) ---------- */

async function createEjsonDump(tmpDir) {
    const client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    try {
        let dbNames = [];
        if (MONGO_DBS && MONGO_DBS.trim()) {
            dbNames = MONGO_DBS.split(",").map(s => s.trim()).filter(Boolean);
        } else {
            const adminDb = client.db().admin();
            const dbs = await adminDb.listDatabases();
            dbNames = (dbs.databases || []).map(d => d.name).filter(n => !["admin", "local", "config"].includes(n));
        }

        const meta = { createdAt: new Date().toISOString(), dbs: [] };

        for (const dbName of dbNames) {
            const db = client.db(dbName);
            const collInfos = await db.listCollections().toArray();
            const dbMeta = { name: dbName, collections: [] };
            const dbDir = path.join(tmpDir, dbName);
            await ensureDir(dbDir);

            for (const cinfo of collInfos) {
                const collName = cinfo.name;
                const safeName = `${dbName}__${collName}`.replace(/[\/\\\s]/g, "_");
                const outFile = path.join(dbDir, `${safeName}.ndjson.gz`);
                const indexFile = path.join(dbDir, `${safeName}.indexes.json`);

                console.log(`Backing up ${dbName}.${collName} -> ${outFile}`);

                const coll = db.collection(collName);
                const cursor = coll.find({}, { batchSize: 1000 });

                const gzip = zlib.createGzip();
                const writeStream = fs.createWriteStream(outFile, { flags: "w" });
                gzip.pipe(writeStream);

                for await (const doc of cursor) {
                    const line = EJSON.stringify(doc);
                    const ok = gzip.write(line + "\n");
                    if (!ok) await new Promise((res) => gzip.once("drain", res));
                }
                gzip.end();
                await new Promise((res, rej) => writeStream.on("close", res).on("error", rej));

                let indexes = [];
                try {
                    indexes = await coll.indexes();
                } catch (err) {
                    console.warn(`Failed to read indexes for ${dbName}.${collName}:`, err && err.message);
                }
                await fsp.writeFile(indexFile, JSON.stringify(indexes || [], null, 2), "utf8");

                dbMeta.collections.push({ name: collName, file: path.basename(outFile), indexFile: path.basename(indexFile) });
            }

            meta.dbs.push(dbMeta);
        }

        await fsp.writeFile(path.join(tmpDir, "metadata.json"), JSON.stringify(meta, null, 2), "utf8");
        return meta;
    } finally {
        await client.close();
    }
}

async function packArchive(tmpDir, archivePath) {
    const parent = path.dirname(tmpDir);
    const base = path.basename(tmpDir);
    await tar.c({ gzip: true, file: archivePath, cwd: parent }, [base]);
}

async function uploadToDriveResumable(drive, filePath, fileName) {
    console.log(`Uploading ${filePath} to Drive as ${fileName}`);
    const fileSize = (await fsp.stat(filePath)).size;
    const res = await drive.files.create(
        {
            requestBody: { name: fileName, parents: [DRIVE_FOLDER_ID] },
            media: { mimeType: "application/gzip", body: fs.createReadStream(filePath) },
            fields: "id,name,createdTime,size"
        },
        {
            onUploadProgress: (evt) => {
                if (evt && evt.bytesRead) console.log(`Uploaded ${evt.bytesRead} / ${fileSize}`);
            }
        }
    );
    console.log("Drive upload complete:", res.data && res.data.id);
    // return data including size (string) for verification
    return res.data || {};
}

/**
 * Safely delete a local backup after verifying uploaded size.
 * - Verifies uploaded size matches local size (if uploadedSize provided).
 * - Moves file to BACKUP_DIR/.to_delete/<filename>.deleting_<ts> then attempts to remove.
 * - If remove fails, move file back to original location to avoid accidental data loss.
 *
 * Returns true if file removed, false otherwise.
 */
async function safeDeleteLocalBackup(localPath, uploadedSize = null) {
    try {
        if (!await fsExtra.pathExists(localPath)) {
            console.warn("Local path does not exist for deletion:", localPath);
            return false;
        }
        const st = await fsp.stat(localPath);
        const localSize = st.size;
        const uploadedNum = uploadedSize ? Number(uploadedSize) : null;

        if (uploadedNum && Number.isFinite(uploadedNum)) {
            // Allow a small delta (1% or 1KB whichever is larger) to account for metadata differences
            const allowedDelta = Math.max(1024, Math.floor(localSize * 0.01));
            if (Math.abs(localSize - uploadedNum) > allowedDelta) {
                console.warn("Uploaded size differs significantly from local size — aborting local delete.", { localSize, uploadedSize: uploadedNum, allowedDelta });
                return false;
            }
        } else {
            // If we don't have an uploaded size, we choose to be conservative and skip deletion
            console.warn("No uploaded size available — skipping local delete for safety:", localPath);
            return false;
        }

        const deleteDir = path.join(BACKUP_DIR, ".to_delete");
        await ensureDir(deleteDir);
        const base = path.basename(localPath);
        const tempName = `${base}.deleting_${nowTs()}`;
        const tempPath = path.join(deleteDir, tempName);

        // Atomic move to a quarantined deletion dir
        await fsExtra.move(localPath, tempPath, { overwrite: true });
        try {
            await fsExtra.remove(tempPath);
            console.log("Safely deleted local backup:", base);
            return true;
        } catch (err) {
            console.warn("Failed to remove temp file; attempting to move it back to backups:", err && err.message);
            try {
                await fsExtra.move(tempPath, localPath, { overwrite: true });
            } catch (moveBackErr) {
                console.error("Failed to move file back after failed delete — manual cleanup required:", moveBackErr && moveBackErr.message);
            }
            return false;
        }
    } catch (err) {
        console.warn("Safe delete failed:", err && err.message);
        return false;
    }
}

async function enforceLocalRetention() {
    try {
        await ensureDir(BACKUP_DIR);
        const items = await fsp.readdir(BACKUP_DIR);
        const files = [];
        for (const name of items) {
            const p = path.join(BACKUP_DIR, name);
            const st = await fsp.stat(p);
            if (st.isFile()) files.push({ name, path: p, mtime: st.mtimeMs });
        }
        files.sort((a, b) => b.mtime - a.mtime);
        if (files.length > RETENTION) {
            const toRemove = files.slice(RETENTION);
            for (const f of toRemove) {
                try { await fsp.unlink(f.path); console.log("Deleted local old backup:", f.name); } catch (err) { console.warn("Failed delete local:", f.path, err && err.message); }
            }
        }
    } catch (err) {
        console.warn("Local retention enforcement failed:", err && err.message);
    }
}

async function enforceDriveRetention(drive) {
    try {
        const listRes = await drive.files.list({
            q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false and mimeType = 'application/gzip'`,
            pageSize: 1000,
            fields: "files(id, name, createdTime)",
            orderBy: "createdTime desc"
        });
        const files = listRes.data.files || [];
        if (files.length > RETENTION) {
            const toDel = files.slice(RETENTION);
            for (const f of toDel) {
                try { await drive.files.delete({ fileId: f.id }); console.log("Deleted Drive old backup:", f.name); } catch (err) { console.warn("Failed deleting Drive file:", f.name, err && err.message); }
            }
        }
    } catch (err) {
        console.warn("Drive retention failed:", err && err.message);
    }
}

async function backupOnce() {
    const stamp = nowTs();
    const runDir = path.join(os.tmpdir(), `mongo_backup_dump_${stamp}`);
    await ensureDir(runDir);
    const tmpDir = path.join(runDir, "data");
    await ensureDir(tmpDir);
    try {
        console.log("Starting EJSON dump to", tmpDir);
        const meta = await createEjsonDump(tmpDir);
        const archiveName = `backup_${stamp}.tar.gz`;
        const archivePath = path.join(runDir, archiveName);
        console.log("Packing archive...");
        await packArchive(tmpDir, archivePath);
        await ensureDir(BACKUP_DIR);
        const finalLocalPath = path.join(BACKUP_DIR, archiveName);
        await fsExtra.move(archivePath, finalLocalPath, { overwrite: true });

        try { await fsExtra.remove(runDir); } catch (err) { console.warn("Failed to remove tmp runDir:", runDir, err && err.message); }

        const drive = await createDriveClient();
        const uploadRes = await uploadToDriveResumable(drive, finalLocalPath, archiveName);

        try {
            const uploadedSize = uploadRes && (uploadRes.size || uploadRes.bytes) ? Number(uploadRes.size || uploadRes.bytes) : null;
            if (uploadedSize && Number.isFinite(uploadedSize)) {
                const deleted = await safeDeleteLocalBackup(finalLocalPath, uploadedSize);
                if (!deleted) {
                    console.warn("Local backup was not deleted after upload; manual cleanup may be required:", finalLocalPath);
                }
            } else {
                console.warn("Upload did not return a size; local backup will be kept for safety:", finalLocalPath);
            }
        } catch (err) {
            console.warn("Error while attempting safe local delete after upload:", err && err.message);
        }

        await enforceLocalRetention();
        await enforceDriveRetention(drive);
        console.log("Backup cycle complete:", finalLocalPath);
        return { localPath: finalLocalPath, name: archiveName, meta, driveFile: uploadRes };
    } catch (err) {
        console.error("Backup failed:", err && err.stack ? err.stack : err);
        throw err;
    }
}

async function listDriveBackups() {
    const drive = await createDriveClient();
    const res = await drive.files.list({
        q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false and mimeType = 'application/gzip'`,
        pageSize: 1000,
        fields: "files(id, name, createdTime, size)",
        orderBy: "createdTime desc"
    });
    return res.data.files || [];
}

async function downloadDriveFileToPath(drive, fileId, destPath) {
    const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });
    await ensureDir(path.dirname(destPath));
    const dest = fs.createWriteStream(destPath);
    await pipeline(res.data, dest);
    return destPath;
}

async function restoreFromArchive(archivePath, { dropExisting = true } = {}) {
    if (!fs.existsSync(archivePath)) throw new Error("Archive not found: " + archivePath);
    const extractTo = path.join(path.dirname(archivePath), `restore_${nowTs()}`);
    await ensureDir(extractTo);
    console.log("Extracting archive to", extractTo);
    await tar.x({ file: archivePath, cwd: path.dirname(extractTo) });
    let extractedRoot;
    const entries = await fsp.readdir(path.dirname(extractTo), { withFileTypes: true });
    for (const e of entries) {
        if (e.isDirectory() && e.name.startsWith("dump_")) {
            const candidate = path.join(path.dirname(extractTo), e.name, "data");
            if (await fsExtra.pathExists(candidate)) { extractedRoot = candidate; break; }
        }
    }
    if (!extractedRoot) extractedRoot = extractTo;

    const client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    try {
        let metadata = null;
        const metaPath = path.join(extractedRoot, "metadata.json");
        if (await fsExtra.pathExists(metaPath)) {
            try { metadata = JSON.parse(await fsp.readFile(metaPath, "utf8")); } catch (err) { console.warn("Failed to parse metadata:", err && err.message); }
        }

        const dbFolders = await fsp.readdir(extractedRoot, { withFileTypes: true });
        for (const dbEnt of dbFolders) {
            if (!dbEnt.isDirectory()) continue;
            const dbName = dbEnt.name;
            const dbPath = path.join(extractedRoot, dbName);
            const files = await fsp.readdir(dbPath);
            for (const fname of files) {
                if (!fname.endsWith(".ndjson.gz")) continue;
                const safeName = fname.replace(/\.ndjson\.gz$/, "");
                let collectionName = null;
                if (metadata) {
                    for (const dbm of metadata.dbs || []) {
                        if (dbm.name === dbName) {
                            const collEntry = (dbm.collections || []).find(c => c.file === fname);
                            if (collEntry) { collectionName = collEntry.name; break; }
                        }
                    }
                }
                if (!collectionName) {
                    const parts = safeName.split("__");
                    collectionName = parts.slice(1).join("__") || parts[0];
                }

                const coll = client.db(dbName).collection(collectionName);
                if (dropExisting) {
                    try { await coll.drop(); console.log(`Dropped existing collection ${dbName}.${collectionName}`); } catch (_) { }
                }
                console.log(`Restoring ${dbName}.${collectionName} from ${fname}`);
                const gzPath = path.join(dbPath, fname);
                const readStream = fs.createReadStream(gzPath);
                const gunzip = zlib.createGunzip();
                const rl = (await import("readline")).createInterface({ input: readStream.pipe(gunzip), crlfDelay: Infinity });
                let batch = [];
                let total = 0;
                for await (const line of rl) {
                    if (!line || !line.trim()) continue;
                    const doc = EJSON.parse(line);
                    batch.push({ insertOne: { document: doc } });
                    if (batch.length >= RESTORE_BATCH) {
                        await coll.bulkWrite(batch, { ordered: false });
                        total += batch.length;
                        batch = [];
                    }
                }
                if (batch.length) { await coll.bulkWrite(batch, { ordered: false }); total += batch.length; batch = []; }
                console.log(`Inserted ${total} docs into ${dbName}.${collectionName}`);

                const indexFile = path.join(dbPath, `${safeName}.indexes.json`);
                if (await fsExtra.pathExists(indexFile)) {
                    try {
                        const idxs = JSON.parse(await fsp.readFile(indexFile, "utf8"));
                        const toCreate = (idxs || []).filter(i => i && i.name !== "_id_");
                        for (const idx of toCreate) {
                            const key = idx.key || idx.key;
                            const options = {};
                            ["name", "unique", "sparse", "expireAfterSeconds", "partialFilterExpression", "background"].forEach(k => {
                                if (idx[k] !== undefined) options[k] = idx[k];
                            });
                            try { await coll.createIndex(key, options); console.log(`Created index ${idx.name} on ${dbName}.${collectionName}`); } catch (err) { console.warn(`Failed to create index ${idx && idx.name} on ${dbName}.${collectionName}:`, err && err.message); }
                        }
                    } catch (err) { console.warn("Failed reading index file:", indexFile, err && err.message); }
                }
            }
        }
    } finally {
        await client.close();
    }

    console.log("Restore finished; cleaning up extracted files.");
    try { await fsExtra.remove(path.dirname(extractedRoot)); } catch (_) { }
}

/* ---------- REST API ---------- */
const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/backups", async (req, res) => {
    try {
        const files = await listDriveBackups();
        res.json({ ok: true, files });
    } catch (err) {
        res.status(500).json({ ok: false, error: err && err.message });
    }
});

app.post("/backup", async (req, res) => {
    try {
        const result = await backupOnce();
        res.json({ ok: true, result });
    } catch (err) {
        res.status(500).json({ ok: false, error: err && err.message });
    }
});

app.post("/restore", async (req, res) => {
    const { driveFileId, localFileName, dropExisting = true } = req.body || {};
    if (!driveFileId && !localFileName) return res.status(400).json({ ok: false, error: "driveFileId or localFileName is required" });
    const drive = await createDriveClient();
    try {
        let archivePath;
        if (driveFileId) {
            const dest = path.join(BACKUP_DIR, `restore_${driveFileId}_${nowTs()}.tar.gz`);
            await downloadDriveFileToPath(drive, driveFileId, dest);
            archivePath = dest;
        } else {
            const localPath = path.join(BACKUP_DIR, localFileName);
            if (!fs.existsSync(localPath)) return res.status(404).json({ ok: false, error: "localFileName not found in BACKUP_DIR" });
            archivePath = localPath;
        }
        await restoreFromArchive(archivePath, { dropExisting });
        res.json({ ok: true, restoredFrom: archivePath });
    } catch (err) {
        console.error("Restore failed:", err && err.stack ? err.stack : err);
        res.status(500).json({ ok: false, error: err && err.message });
    }
});

app.listen(Number(PORT), () => {
    console.log(`API listening on port ${PORT}`);
});

/* ---------- Scheduler ---------- */
async function startScheduler(runOnce = false) {
    if (runOnce) {
        try { await backupOnce(); console.log("One-time backup completed."); process.exit(0); } catch (err) { console.error("One-time backup failed:", err && err.message); process.exit(1); }
    } else {
        console.log("Starting scheduler: will run every 12 hours (cron: '0 0 1 * *') timezone Asia/Colombo");
        try { await backupOnce(); } catch (err) { console.warn("Initial backup failed:", err && err.message); }
        cron.schedule("0 0 1 * *", async () => {
            console.log(`[${new Date().toISOString()}] Scheduled run starting...`);
            try { await backupOnce(); } catch (err) { console.error("Scheduled backup failed:", err && err.message); }
        }, { timezone: "Asia/Colombo" });
    }
}

const args = process.argv.slice(2);
const runOnce = args.includes("--once") || args.includes("--run-once");
startScheduler(runOnce).catch(err => { console.error("Scheduler fatal:", err && err.message); process.exit(1); });
