const express = require("express");
const router = express.Router();

// ######### importing Controllers #########
const {
  registerUser,
  loginUser,
} = require("../controllers/auth.controller.js");

router.route("/api/auth/register").post(registerUser);
router.route("/api/auth/login").post(loginUser);

module.exports = router;
