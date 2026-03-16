require("dotenv").config();

const { Unauthorized } = require("../errors/Errors.error.js");

const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken)
      throw new Unauthorized("Access denied. No access token provided");

    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
      req.user = decoded;
      console.log(req.user, decoded);
      next();
    } catch (err) {
      throw new Unauthorized("Invalid or expired token");
    }
  } catch (err) {
    next(err);
  }
};

module.exports = authMiddleware;
