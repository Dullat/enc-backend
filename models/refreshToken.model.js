const mongoose = require("mongoose");
const crypto = require("crypto");

const refreshToken = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: [true, "Pleasse provide user id"],
  },
  refreshToken: {
    type: String,
    required: [true, "Please provide refreshToken"],
  },
  userAgent: {
    type: String,
  },
  ip: {
    type: String,
    require: [true, "IP is hidden"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  lastUsed: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
});

module.exports = mongoose.model("RefreshToken", refreshToken);
