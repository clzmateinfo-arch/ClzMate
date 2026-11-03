const { escapeHtml } = require("../utils/validators");

const COLORS = {
  primary: "#8300c4",
  primaryDark: "#4c00a4",
  ink: "#1f1530",
  body: "#3f3a4d",
  muted: "#77708a",
  border: "#ebe4f6",
  page: "#f4f1fa",
  soft: "#faf7ff",
  noticeBg: "#fff8eb",
  noticeBorder: "#f5d9a8",
  noticeInk: "#7a4b00",
};
const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const DEFAULT_FRONTEND_URL = "https://clzmate.onrender.com";

const brandName = () => process.env.MAIL_BRAND_NAME || process.env.MAIL_FROM_NAME || "ClzMate";
const frontendUrl = () => String(process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/+$/, "");
const supportEmail = () => process.env.MAIL_SUPPORT_EMAIL || process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER || "";
const appLink = (path = "/") => `${frontendUrl()}${path.startsWith("/") ? path : `/${path}`}`;

const formatDateTime = (date = new Date()) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: process.env.MAIL_TIMEZONE || "Asia/Colombo",
    timeZoneName: "short",
  }).format(new Date(date));

const formatPrice = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const paragraphParts = (paragraph) => (Array.isArray(paragraph) ? paragraph : [paragraph]);

const paragraphToHtml = (paragraph) =>
  paragraphParts(paragraph)
    .map((part) =>
      typeof part === "object" && part !== null
        ? `<strong style="color:${COLORS.ink};">${escapeHtml(part.strong)}</strong>`
        : escapeHtml(part)
    )
    .join("");

const paragraphToText = (paragraph) =>
  paragraphParts(paragraph)
    .map((part) => (typeof part === "object" && part !== null ? part.strong : part))
    .join("");

const textBlock = (paragraphs, style) =>
  paragraphs
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px;${style}">${paragraphToHtml(paragraph)}</p>`)
    .join("");

function codeBlock(code, caption) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
<tr><td align="center" style="background:${COLORS.soft};border:1px dashed #cdb4ee;border-radius:12px;padding:20px 12px;">
<div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:34px;line-height:40px;font-weight:700;letter-spacing:10px;color:${COLORS.primaryDark};">${escapeHtml(code)}</div>
${caption ? `<div style="margin-top:8px;font-size:13px;color:${COLORS.muted};">${escapeHtml(caption)}</div>` : ""}
</td></tr></table>`;
}

function detailsTable(rows) {
  const body = rows
    .filter((row) => row && row.value !== undefined && row.value !== null && row.value !== "")
    .map(
      ({ label, value, isEmphasized }, index) => `<tr>
<td style="padding:10px 14px;${index ? `border-top:1px solid ${COLORS.border};` : ""}font-size:14px;color:${COLORS.muted};width:40%;vertical-align:top;">${escapeHtml(label)}</td>
<td style="padding:10px 14px;${index ? `border-top:1px solid ${COLORS.border};` : ""}font-size:14px;color:${COLORS.ink};font-weight:${isEmphasized ? 700 : 600};text-align:right;vertical-align:top;word-break:break-word;">${escapeHtml(value)}</td>
</tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border:1px solid ${COLORS.border};border-radius:12px;border-collapse:separate;">${body}</table>`;
}

function ctaButton({ label, url }) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
<tr><td align="center" bgcolor="${COLORS.primary}" style="border-radius:10px;background:${COLORS.primary};">
<a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:15px;font-weight:700;line-height:20px;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(label)}</a>
</td></tr></table>
<p style="margin:0 0 20px;font-size:12px;line-height:18px;color:${COLORS.muted};">If the button does not work, copy this link into your browser:<br><a href="${escapeHtml(url)}" target="_blank" style="color:${COLORS.primary};word-break:break-all;">${escapeHtml(url)}</a></p>`;
}

function noticeBox(paragraphs) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;">
<tr><td style="background:${COLORS.noticeBg};border:1px solid ${COLORS.noticeBorder};border-radius:12px;padding:14px 16px;font-size:13px;line-height:20px;color:${COLORS.noticeInk};">
${paragraphs.filter(Boolean).map(paragraphToHtml).join("<br>")}
</td></tr></table>`;
}

function quoteBlock(text) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;">
<tr><td style="border-left:4px solid ${COLORS.primary};background:${COLORS.soft};border-radius:0 12px 12px 0;padding:14px 16px;font-size:14px;line-height:22px;color:${COLORS.body};">${escapeHtml(text).replace(/\r?\n/g, "<br>")}</td></tr></table>`;
}

function renderEmail({ subject, preheader, heading, greetingName, intro = [], code, codeCaption, details, quote, cta, notice, outro = [], footerReason }) {
  const brand = brandName();
  const support = supportEmail();
  const year = new Date().getFullYear();
  const greeting = greetingName ? `Hi ${greetingName},` : "Hi there,";

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
<style>
@media only screen and (max-width: 620px) {
  .email-container { width: 100% !important; }
  .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
  .email-heading { font-size: 21px !important; line-height: 28px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader || heading)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;font-family:${FONT_STACK};">
<tr><td class="email-pad" style="padding:0 8px 20px;">
<a href="${escapeHtml(appLink("/"))}" target="_blank" style="text-decoration:none;">
<img src="${escapeHtml(appLink("/logo.png"))}" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:10px;">
<span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:800;color:${COLORS.ink};letter-spacing:-0.2px;">${escapeHtml(brand)}</span>
</a>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${COLORS.border};border-radius:16px;overflow:hidden;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="height:6px;line-height:6px;font-size:0;background:${COLORS.primary};">&nbsp;</td></tr>
<tr><td class="email-pad" style="padding:32px 40px 12px;">
<h1 class="email-heading" style="margin:0 0 20px;font-size:24px;line-height:32px;font-weight:800;color:${COLORS.ink};">${escapeHtml(heading)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${COLORS.body};">${escapeHtml(greeting)}</p>
${textBlock(intro, `font-size:15px;line-height:24px;color:${COLORS.body};`)}
${code ? codeBlock(code, codeCaption) : ""}
${details?.length ? detailsTable(details) : ""}
${quote ? quoteBlock(quote) : ""}
${cta ? ctaButton(cta) : ""}
${notice?.length ? noticeBox(notice) : ""}
${textBlock(outro, `font-size:15px;line-height:24px;color:${COLORS.body};`)}
<p style="margin:8px 0 24px;font-size:15px;line-height:24px;color:${COLORS.body};">Thanks,<br><strong style="color:${COLORS.ink};">The ${escapeHtml(brand)} team</strong></p>
</td></tr>
</table>
</td></tr>
<tr><td class="email-pad" align="center" style="padding:24px 24px 8px;font-size:12px;line-height:19px;color:${COLORS.muted};">
${support ? `Need help? Reply to this email or write to <a href="mailto:${escapeHtml(support)}" style="color:${COLORS.primary};text-decoration:none;">${escapeHtml(support)}</a><br>` : ""}
${footerReason ? `${escapeHtml(footerReason)}<br>` : ""}
&copy; ${year} ${escapeHtml(brand)} &middot; <a href="${escapeHtml(appLink("/"))}" target="_blank" style="color:${COLORS.muted};">${escapeHtml(frontendUrl().replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const lines = [
    heading,
    "",
    greeting,
    "",
    ...intro.filter(Boolean).flatMap((paragraph) => [paragraphToText(paragraph), ""]),
    ...(code ? [`    ${code}`, ...(codeCaption ? [codeCaption] : []), ""] : []),
    ...(details?.length ? [...details.filter((row) => row && row.value !== undefined && row.value !== null && row.value !== "").map(({ label, value }) => `${label}: ${value}`), ""] : []),
    ...(quote ? [quote.split(/\r?\n/).map((line) => `> ${line}`).join("\n"), ""] : []),
    ...(cta ? [`${cta.label}: ${cta.url}`, ""] : []),
    ...(notice?.length ? [...notice.filter(Boolean).map(paragraphToText), ""] : []),
    ...outro.filter(Boolean).flatMap((paragraph) => [paragraphToText(paragraph), ""]),
    `Thanks,`,
    `The ${brand} team`,
    "",
    "--",
    ...(support ? [`Need help? Write to ${support}`] : []),
    ...(footerReason ? [footerReason] : []),
    appLink("/"),
  ];

  return { subject, html, text: lines.join("\n") };
}

module.exports = { renderEmail, appLink, brandName, formatDateTime, formatPrice };
