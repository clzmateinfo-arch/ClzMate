const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const isObjectId = (value) => typeof value === "string" && OBJECT_ID_PATTERN.test(value);

const isObjectIdArray = (value, maxLength = 50) =>
  Array.isArray(value) && value.length > 0 && value.length <= maxLength && value.every(isObjectId);

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const MAX_SEARCH_LENGTH = 100;

const buildSearchRegex = (rawSearch) => {
  const { escapeRegex } = require("../middleware/sanitize");
  const trimmed = typeof rawSearch === "string" ? rawSearch.trim().slice(0, MAX_SEARCH_LENGTH) : "";
  return trimmed ? new RegExp(escapeRegex(trimmed), "i") : null;
};

const sendServerError = (res, label, error, message) => {
  console.error(label, error);
  return res.status(500).json({ success: false, message });
};

module.exports = { isObjectId, isObjectIdArray, escapeHtml, buildSearchRegex, sendServerError, MAX_SEARCH_LENGTH };
