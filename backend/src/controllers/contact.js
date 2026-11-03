const mailSender = require("../utils/mailSender");
const { escapeHtml, sendServerError } = require("../utils/validators");

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

const isBoundedString = (value, maxLength) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;

const isOptionalBoundedString = (value, maxLength) =>
  value === undefined || value === null || value === "" || (typeof value === "string" && value.length <= maxLength);

const stripLineBreaks = (value) => value.replace(/[\r\n]+/g, " ");

exports.submitContact = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body || {};

    const isValid =
      isBoundedString(firstName, MAX_NAME_LENGTH) &&
      isBoundedString(message, MAX_MESSAGE_LENGTH) &&
      isBoundedString(email, MAX_EMAIL_LENGTH) &&
      EMAIL_PATTERN.test(email.trim()) &&
      isOptionalBoundedString(lastName, MAX_NAME_LENGTH) &&
      isOptionalBoundedString(phone, MAX_PHONE_LENGTH);

    if (!isValid) {
      return res.status(400).json({ success: false, message: "firstName, a valid email and a message are required" });
    }

    const recipient = process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER;
    if (!recipient) {
      console.error("Contact form: neither MAIL_FROM_EMAIL nor MAIL_USER is configured");
      return res.status(500).json({ success: false, message: "Could not send your message" });
    }

    const fullName = stripLineBreaks(`${firstName} ${lastName || ""}`.trim());
    const body = [
      `<p><strong>Name:</strong> ${escapeHtml(fullName)}</p>`,
      `<p><strong>Email:</strong> ${escapeHtml(email.trim())}</p>`,
      phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : "",
      `<p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\r?\n/g, "<br>")}</p>`,
    ].join("");

    const sent = await mailSender(recipient, `Contact form message from ${fullName}`, body);
    if (!sent) {
      return res.status(500).json({ success: false, message: "Could not send your message" });
    }

    return res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    return sendServerError(res, "submitContact error", error, "Could not send your message");
  }
};
