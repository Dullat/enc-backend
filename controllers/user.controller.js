require("dotenv").config();
const path = require("path");
const userModel = require("../models/user.model.js");
const crypto = require("crypto");
const {
  Unauthorized,
  NotFound,
  BadRequest,
  UnprocessableEntity,
} = require("../errors/Errors.error.js");

const renderResetPasswordForm = async (req, res, next) => {
  try {
    const { email, token: rawResetTokne } = req.query;

    if (!email || !rawResetTokne)
      throw new BadRequest("Missing email or token");

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(rawResetTokne)
      .digest("hex");

    const user = await userModel.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) throw new Unauthorized("Reset token invalid or expired");

    res.render("reset-password", { token: rawResetTokne });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const rawResetTokne = req.params.token;
    const { password, confirmPassword } = req.body;

    if (!rawResetTokne) throw new BadRequest("Expired");
    if (!password || !confirmPassword)
      throw new BadRequest("No new password provided");

    if (password !== confirmPassword)
      throw new UnprocessableEntity("Password do not match");

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(rawResetTokne)
      .digest("hex");

    const user = await userModel.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) throw new Unauthorized("Token invalid or expired");

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.render("reset-success");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  renderResetPasswordForm,
  resetPassword,
};
