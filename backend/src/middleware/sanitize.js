const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

const isUnsafeKey = (key) => key.startsWith("$") || key.includes(".");

function stripUnsafeKeys(value) {
  if (Array.isArray(value)) {
    value.forEach(stripUnsafeKeys);
    return value;
  }
  if (!isPlainObject(value)) return value;
  for (const key of Object.keys(value)) {
    if (isUnsafeKey(key)) {
      delete value[key];
    } else {
      stripUnsafeKeys(value[key]);
    }
  }
  return value;
}

exports.stripUnsafeKeys = stripUnsafeKeys;

exports.sanitizeRequest = (req, res, next) => {
  stripUnsafeKeys(req.body);
  stripUnsafeKeys(req.query);
  stripUnsafeKeys(req.params);
  next();
};

exports.escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
