const express = require("express");
const router = express.Router();

const {
  encryptAndDownloadDirect,
} = require("../controllers/enc.controller.js");

router.route("/api/enc-direct").post(encryptAndDownloadDirect);

module.exports = router;
