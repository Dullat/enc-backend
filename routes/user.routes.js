const express = require("express");
const router = express.Router();

// ######### importing Controllers #########
const {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
  refreshAccessToken,
  requestPasswordReset,
} = require("../controllers/auth.controller.js");

const {
  resetPassword,
  renderResetPasswordForm,
} = require("../controllers/user.controller.js");

// ######### setting Routes ###########

// core auth
router.route("/api/auth/register").post(registerUser);
router.route("/api/auth/login").post(loginUser);
router.route("/api/auth/logout").post(logoutUser);
router.route("/api/auth/refresh").post(refreshAccessToken);

// email verification
router.route("/api/auth/verify-email").get(verifyEmail);
router.route("/api/auth/resend-verification").post(resendVerificationEmail);

// password reset
router.route("/api/auth/forget-password").post(requestPasswordReset);
router.route("/api/auth/reset-password").get(renderResetPasswordForm);
router.route("/api/auth/reset-password/:token").post(resetPassword);

module.exports = router;
