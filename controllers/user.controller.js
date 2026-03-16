require("dotenv").config();
const path = require("path");
const userModel = require("../models/user.model.js");
const refreshTokenModel = require("../models/refreshToken.model.js");
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

    await refreshTokenModel.deleteMany({ userId: user._id });

    res.render("reset-success");
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { user: decodedUser } = req;

    if (!decodedUser) {
      throw new Unauthorized("Authentication required");
    }

    const user = await userModel.findOne({ _id: decodedUser._id });

    if (!user) {
      throw new Unauthorized(
        "User account no longer exists. Please log in again.",
      );
    }

    const loginMethods = [];
    if (user.password) loginMethods.push("email");
    if (user.googleId) loginMethods.push("google");

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        plan: user.plan,
        storageLimit: user.storageLimit,
        role: user.role,
        pubKey: user.publicKey,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        loginMethods,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    const { user: decodedUser } = req;

    if (!decodedUser) {
      throw new Unauthorized("Authentication required");
    }

    if (!username) throw new BadRequest("No username is provided");

    const user = await userModel.findByIdAndUpdate(
      decodedUser._id,
      { username },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new Unauthorized(
        "User account no longer exists. Please log in again.",
      );
    }

    res.status(201).json({
      success: true,
      message: "Username updated successfully",
      username: user.username,
    });
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const decodedUser = req.user;

    const tokens = await refreshTokenModel.find({ userId: decodedUser._id });

    if (!tokens) throw new NotFound("Sessions with this user not found");

    const tokensArray = tokens.map((token) => ({
      ip: token.ip,
      createdAt: token.createdAt,
      userAgent: token.userAgent,
    }));

    res.status(200).json({
      success: true,
      message: "Sessions found",
      sessions: tokensArray,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  renderResetPasswordForm,
  resetPassword,
  getMe,
  updateUsername,
  getSessions,
};
