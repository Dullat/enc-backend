const jwt = require("jsonwebtoken");
require("dotenv").config();

const genAccessToken = (user) => {
  return jwt.sign(user, process.env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
};

const genRefreshToken = (user) => {
  return jwt.sign(user, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

module.exports = { genAccessToken, genRefreshToken };
