const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const mailSender = require("../utils/mailSender");
const { validatePassword } = require("../utils/passwordPolicy");
const { isNonEmptyString } = require("../middleware/sanitize");
const { appLink } = require("../mail/layout");
const { passwordResetRequestEmail, passwordResetCompletedEmail } = require("../mail/templates");

const RESET_TOKEN_TTL_MINUTES = 15;
const RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_MINUTES * 60 * 1000;
const GENERIC_RESET_MESSAGE = "If the email is registered, a password reset link has been sent";

const hashResetToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const greetingName = (user) => user.preferredName || user.firstName;

exports.hashResetToken = hashResetToken;

exports.resetPasswordToken = async (req, res) => {
  try {
    const { email } = req.body;
    if (!isNonEmptyString(email)) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user && user.active) {
      const token = crypto.randomBytes(32).toString("hex");
      user.token = hashResetToken(token);
      user.resetPasswordTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      await mailSender.sendTemplate(
        user.email,
        passwordResetRequestEmail({
          name: greetingName(user),
          resetUrl: appLink(`/update-password/${token}`),
          ttlMinutes: RESET_TOKEN_TTL_MINUTES,
        })
      );
    }

    return res.status(200).json({ success: true, message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    console.error("Error while creating password reset token:", error);
    return res.status(500).json({ success: false, message: "Error while creating password reset token" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!isNonEmptyString(token) || !isNonEmptyString(password) || !isNonEmptyString(confirmPassword)) {
      return res.status(400).json({ success: false, message: "Token, password and confirmPassword are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const user = await User.findOne({
      token: hashResetToken(token),
      resetPasswordTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Reset token is invalid or has expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordChangedAt = new Date();
    user.token = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    await mailSender.sendTemplate(user.email, passwordResetCompletedEmail({ name: greetingName(user), at: user.passwordChangedAt }));

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error while resetting password:", error);
    return res.status(500).json({ success: false, message: "Error while resetting password" });
  }
};
