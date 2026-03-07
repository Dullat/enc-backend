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
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/refresh").post(refreshAccessToken);

// email verification
router.route("/verify-email").get(verifyEmail);
router.route("/resend-verification").post(resendVerificationEmail);

// password reset
router.route("/forget-password").post(requestPasswordReset);
router.route("/reset-password").get(renderResetPasswordForm);
router.route("/reset-password/:token").post(resetPassword);

module.exports = router;
