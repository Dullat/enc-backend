const express = require("express");
const router = express.Router();

// ######### importing Controllers #########
const {
  registerUser,
  loginUser,
} = require("../controllers/auth.controller.js");

const { verifyEmail } = require("../controllers/user.controller.js");

// ######### setting Routes ###########

router.route("/api/auth/register").post(registerUser);
router.route("/api/auth/login").post(loginUser);
router.route("/api/verify-email").post(verifyEmail);

module.exports = router;
