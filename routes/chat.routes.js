const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware.js");
const { getMessages } = require("../controllers/chat.controller.js");

router.get("/history/:userId", authMiddleware, getMessages);

module.exports = router;
