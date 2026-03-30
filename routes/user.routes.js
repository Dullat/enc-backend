const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware.js");

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
  getAllUsers,
} = require("../controllers/user.controller.js");

// #-------------- AUTH -------------------------#
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/refresh").post(refreshAccessToken);

// #------------- User info --------------#
router.route("/getme").get(authMiddleware, getMe);
router.route("/updateusername").patch(authMiddleware, updateUsername);
router.route("/get-sessions").get(authMiddleware, getSessions);
router.route("/get-all-users").get(authMiddleware, getAllUsers);

// #---------------- Email verification -----------#
router.route("/verify-email").get(verifyEmail);
router.route("/resend-verification").post(resendVerificationEmail);

// #-------------- Password ----------------------#
router.route("/forget-password").post(requestPasswordReset);
router.route("/reset-password").get(renderResetPasswordForm);
router.route("/reset-password/:token").post(resetPassword);

module.exports = router;
