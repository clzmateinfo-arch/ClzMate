require("dotenv").config({ quiet: true });

const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");

const shouldSaveToEnv = process.argv.includes("--save");
const envPath = path.resolve(__dirname, "..", ".env");

function saveRefreshToken(refreshToken) {
  const line = `GMAIL_REFRESH_TOKEN=${refreshToken}`;
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const next = /^GMAIL_REFRESH_TOKEN=.*$/m.test(current)
    ? current.replace(/^GMAIL_REFRESH_TOKEN=.*$/m, line)
    : `${current.replace(/\s*$/, "")}\n${line}\n`;
  fs.writeFileSync(envPath, next);
}

const SCOPE = "https://www.googleapis.com/auth/gmail.send";
const PORT = Number(process.env.GMAIL_OAUTH_PORT) || 53682;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;
const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET (Desktop app OAuth client) in backend/.env first.");
  process.exit(1);
}

const state = crypto.randomBytes(16).toString("hex");
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT_URI,
  response_type: "code",
  scope: SCOPE,
  access_type: "offline",
  prompt: "consent",
  state,
}).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404).end();
    return;
  }
  const finish = (status, message) => {
    res.writeHead(status, { "Content-Type": "text/plain" }).end(message);
    server.close();
  };
  if (url.searchParams.get("state") !== state) return finish(400, "State mismatch, start again.");
  if (url.searchParams.get("error")) return finish(400, `Google returned: ${url.searchParams.get("error")}`);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      code: url.searchParams.get("code"),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!body.refresh_token) {
    console.error("No refresh token returned:", body.error_description || body.error || response.status);
    return finish(500, "Failed, see the terminal.");
  }
  if (shouldSaveToEnv) {
    saveRefreshToken(body.refresh_token);
    console.log(`\nSaved GMAIL_REFRESH_TOKEN (length ${body.refresh_token.length}) to ${envPath}. Copy it from there to the Render env; keep it secret.\n`);
  } else {
    console.log("\nSet this on the backend (Render env and backend/.env), keep it secret:\n");
    console.log(`GMAIL_REFRESH_TOKEN=${body.refresh_token}\n`);
  }
  finish(200, "Done. Return to the terminal; you can close this tab.");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Sign in with the Gmail account that should send ClzMate mail and approve "Send email on your behalf":\n\n${authUrl}\n`);
});
