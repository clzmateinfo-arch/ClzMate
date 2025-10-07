// quick-drive-test.js
import { google } from "googleapis";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";

async function run() {
    const keyPath = path.resolve(process.cwd(), "./clzmate-1949b38aed98.json");
    const raw = await fsp.readFile(keyPath, "utf8");
    const keyJson = JSON.parse(raw);

    const jwtClient = new google.auth.JWT({
        email: keyJson.client_email,
        key: keyJson.private_key,
        scopes: ["https://www.googleapis.com/auth/drive"]
    });
    await jwtClient.authorize();
    const drive = google.drive({ version: "v3", auth: jwtClient });

    const res = await drive.files.list({
        q: `'${process.env.DRIVE_FOLDER_ID}' in parents and trashed = false`,
        pageSize: 10,
        fields: "files(id,name,createdTime)"
    });
    console.log("Files:", res.data.files);
}

run().catch(err => {
    console.error("Test failed:", err && err.message);
    process.exit(1);
});