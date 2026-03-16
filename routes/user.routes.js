const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware.js");

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
  getMe,
  updateUsername,
  getSessions,
} = require("../controllers/user.controller.js");

// ######### setting Routes ###########

// core auth
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/refresh").post(refreshAccessToken);

// userInfo
router.route("/getme").get(authMiddleware, getMe);
router.route("/updateusername").patch(authMiddleware, updateUsername);
router.route("/get-sessions").get(authMiddleware, getSessions);

// email verification
router.route("/verify-email").get(verifyEmail);
router.route("/resend-verification").post(resendVerificationEmail);

// password reset
router.route("/forget-password").post(requestPasswordReset);
router.route("/reset-password").get(renderResetPasswordForm);
router.route("/reset-password/:token").post(resetPassword);

module.exports = router;
