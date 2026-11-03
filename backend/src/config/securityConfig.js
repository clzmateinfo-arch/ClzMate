const MIN_SECRET_LENGTH_PRODUCTION = 32;
const MIN_SECRET_LENGTH_DEVELOPMENT = 16;

exports.assertSecurityConfig = () => {
  const secret = process.env.JWT_SECRET || "";
  const isProduction = process.env.NODE_ENV === "production";
  const minLength = isProduction ? MIN_SECRET_LENGTH_PRODUCTION : MIN_SECRET_LENGTH_DEVELOPMENT;

  if (secret.length < minLength) {
    const message = `JWT_SECRET must be at least ${minLength} characters`;
    if (isProduction) throw new Error(message);
    console.warn(`WARNING: ${message}`);
  }

  if (isProduction && !(process.env.CORS_ALLOWED_ORIGINS || "").trim()) {
    throw new Error("CORS_ALLOWED_ORIGINS must be set in production");
  }
};
