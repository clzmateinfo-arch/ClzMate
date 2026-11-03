const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

exports.MIN_PASSWORD_LENGTH = MIN_PASSWORD_LENGTH;

exports.validatePassword = (password) => {
  if (typeof password !== "string") return "Password must be a string";
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  if (password.length > MAX_PASSWORD_LENGTH) return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`;
  return null;
};
