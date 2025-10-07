// get-refresh-token-local.js
import http from "http";
import { URL } from "url";
import open from "open"; // optional: attempt to auto-open browser, won't break if not installed
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || "<PASTE_CLIENT_ID_HERE>";
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "<PASTE_CLIENT_SECRET_HERE>";
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

if (!CLIENT_ID || CLIENT_ID.startsWith("<PASTE")) {
  console.error("Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in your environment or edit this file.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly"
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent"
});

console.log("\nOpen this URL in your browser (or it may open automatically):\n");
console.log(authUrl, "\n");

(async () => {
  // try to open browser, optional; ignore if 'open' not installed
  try { await open(authUrl); } catch (_) { }

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
      if (reqUrl.pathname === "/oauth2callback") {
        const code = reqUrl.searchParams.get("code");
        const error = reqUrl.searchParams.get("error");
        if (error) {
          console.error("OAuth error:", error);
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("OAuth error: " + error);
          server.close();
          return;
        }
        if (!code) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing code in callback");
          server.close();
          return;
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        // tokens contains access_token, refresh_token, expiry_date, etc.
        console.log("\nSuccess! Save these into your server .env:");
        console.log("GOOGLE_OAUTH_CLIENT_ID=" + CLIENT_ID);
        console.log("GOOGLE_OAUTH_CLIENT_SECRET=" + CLIENT_SECRET);
        console.log("GOOGLE_OAUTH_REFRESH_TOKEN=" + (tokens.refresh_token || tokens.refreshToken));
        console.log("\nFull tokens object:\n", tokens);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h2>Success — you can close this tab.</h2><p>Check your terminal for the refresh token and tokens object.</p>");

        server.close();
      } else {
        res.writeHead(404);
        res.end();
      }
    } catch (err) {
      console.error("Callback handling error:", err);
      try { res.writeHead(500); res.end("Internal error"); } catch (e) { }
      server.close();
    }
  });

  server.listen(PORT, () => {
    console.log(`\nListening for OAuth callback on http://localhost:${PORT}/oauth2callback`);
  });

})();
