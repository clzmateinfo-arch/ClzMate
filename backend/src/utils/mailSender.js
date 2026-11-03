const nodemailer = require("nodemailer");
const MailComposer = require("nodemailer/lib/mail-composer");

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const HTTP_TIMEOUT_MS = 15_000;
const TOKEN_EXPIRY_MARGIN_MS = 60_000;
const SMTP_TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 };

const hasGmailApiCredentials = () =>
    Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN);

const selectedTransport = () => {
    const configured = String(process.env.MAIL_TRANSPORT || "").toLowerCase();
    if (configured === "gmail-api" || configured === "smtp") return configured;
    return hasGmailApiCredentials() ? "gmail-api" : "smtp";
};

const getFromAddress = () => {
    const name = process.env.MAIL_FROM_NAME || "ClzMate";
    const email = process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER || `no-reply@${process.env.APP_DOMAIN || "example.com"}`;
    return `"${name.replace(/"/g, "")}" <${email}>`;
};

const htmlToText = (html) =>
    String(html || "")
        .replace(/<(style|head)[\s\S]*?<\/\1>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|tr|h\d)>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

const buildMessage = (to, subject, html, { text, replyTo } = {}) => ({
    from: getFromAddress(),
    to,
    subject,
    html,
    text: text || htmlToText(html),
    ...(replyTo ? { replyTo } : {}),
});

let cachedAccessToken = null;
let accessTokenExpiresAt = 0;
let pendingTokenRequest = null;

async function fetchAccessToken() {
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        body: new URLSearchParams({
            client_id: process.env.GMAIL_CLIENT_ID,
            client_secret: process.env.GMAIL_CLIENT_SECRET,
            refresh_token: process.env.GMAIL_REFRESH_TOKEN,
            grant_type: "refresh_token",
        }),
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) {
        const reason = body.error === "invalid_grant"
            ? "refresh token revoked or expired, run scripts/get-gmail-refresh-token.js again"
            : body.error_description || body.error || `HTTP ${response.status}`;
        throw new Error(`Gmail token refresh failed: ${reason}`);
    }
    cachedAccessToken = body.access_token;
    accessTokenExpiresAt = Date.now() + (Number(body.expires_in) || 3600) * 1000 - TOKEN_EXPIRY_MARGIN_MS;
    return cachedAccessToken;
}

function getAccessToken({ forceRefresh = false } = {}) {
    if (!forceRefresh && cachedAccessToken && Date.now() < accessTokenExpiresAt) return Promise.resolve(cachedAccessToken);
    if (!pendingTokenRequest) {
        pendingTokenRequest = fetchAccessToken().finally(() => {
            pendingTokenRequest = null;
        });
    }
    return pendingTokenRequest;
}

const toRawMessage = (message) =>
    new Promise((resolve, reject) => {
        new MailComposer(message).compile().build((error, mime) => (error ? reject(error) : resolve(mime.toString("base64url"))));
    });

async function postGmailMessage(raw, accessToken) {
    return fetch(GMAIL_SEND_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
}

async function sendWithGmailApi(message) {
    const raw = await toRawMessage(message);
    let response = await postGmailMessage(raw, await getAccessToken());
    if (response.status === 401) response = await postGmailMessage(raw, await getAccessToken({ forceRefresh: true }));
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Gmail API send failed: ${body.error?.message || `HTTP ${response.status}`}`);
    return { messageId: body.id, transport: "gmail-api" };
}

let smtpTransporter = null;

function getSmtpTransporter() {
    if (smtpTransporter) return smtpTransporter;
    const { MAIL_SERVICE, MAIL_HOST, MAIL_PORT, MAIL_SECURE, MAIL_USER, MAIL_PASS } = process.env;
    const auth = { user: MAIL_USER, pass: MAIL_PASS };
    smtpTransporter = nodemailer.createTransport(
        MAIL_SERVICE && MAIL_SERVICE.toLowerCase() === "gmail"
            ? { service: "gmail", auth, pool: true, ...SMTP_TIMEOUTS }
            : {
                host: MAIL_HOST || "smtp.gmail.com",
                port: Number(MAIL_PORT) || 587,
                secure: String(MAIL_SECURE || "false").toLowerCase() === "true",
                auth,
                pool: true,
                tls: { rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== "false" },
                ...SMTP_TIMEOUTS,
            }
    );
    return smtpTransporter;
}

async function sendWithSmtp(message) {
    const info = await getSmtpTransporter().sendMail(message);
    return { messageId: info.messageId, transport: "smtp" };
}

const mailSender = async (email, title, bodyHtml, options = {}) => {
    const transport = selectedTransport();
    try {
        const message = buildMessage(email, title, bodyHtml, options);
        return transport === "gmail-api" ? await sendWithGmailApi(message) : await sendWithSmtp(message);
    } catch (error) {
        console.error(`Error while sending mail (${transport}) -`, error?.message || error, { to: email });
        return null;
    }
};

mailSender.sendTemplate = (email, mail, options = {}) =>
    mailSender(email, mail.subject, mail.html, { text: mail.text, ...options });

mailSender.resetForTests = () => {
    cachedAccessToken = null;
    accessTokenExpiresAt = 0;
    pendingTokenRequest = null;
    smtpTransporter = null;
};

module.exports = mailSender;
