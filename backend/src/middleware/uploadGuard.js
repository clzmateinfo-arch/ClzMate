const path = require("path");

const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".com", ".msi", ".dll", ".scr", ".sh", ".ps1", ".vbs", ".jar", ".php", ".apk", ".dmg",
]);
const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"]);
const IMAGE_FIELD_PATTERN = /^(thumbnail|thumbnailimage|profileimage|image)$/i;

const flattenFiles = (files) =>
  Object.entries(files || {}).flatMap(([fieldName, value]) =>
    (Array.isArray(value) ? value : [value]).map((file) => ({ fieldName, file }))
  );

function getUploadError({ fieldName, file }) {
  const extension = path.extname(file.name || "").toLowerCase();

  if (!file.name || file.size === 0) return `${fieldName}: empty or unnamed file`;
  if (BLOCKED_EXTENSIONS.has(extension)) return `${fieldName}: file type ${extension} is not allowed`;

  if (IMAGE_FIELD_PATTERN.test(fieldName)) {
    const isImage = IMAGE_MIME_TYPES.has(String(file.mimetype || "").toLowerCase()) && IMAGE_EXTENSIONS.has(extension);
    if (!isImage) return `${fieldName} must be a PNG, JPEG, GIF, WebP or AVIF image`;
  }
  return null;
}

exports.uploadGuard = (req, res, next) => {
  const firstError = flattenFiles(req.files).map(getUploadError).find(Boolean);
  if (firstError) return res.status(400).json({ success: false, message: firstError });
  return next();
};
