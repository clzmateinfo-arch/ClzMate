exports.notFoundHandler = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });

exports.errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const isInvalidId = err?.name === "CastError";
  const isValidation = err?.name === "ValidationError";
  const isBadJson = err?.type === "entity.parse.failed";
  const status = isInvalidId || isValidation || isBadJson ? 400 : err?.status || err?.statusCode || 500;

  if (status >= 500) console.error(err);

  const message = status >= 500 ? "Internal server error" : isBadJson ? "Malformed JSON body" : isInvalidId ? "Invalid id" : err.message;
  res.status(status).json({ success: false, message });
};
