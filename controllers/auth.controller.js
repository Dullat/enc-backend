const userModel = require("../models/user.model.js");
const refreshTokenModel = require("../models/refreshToken.model.js");
const {
  sendVerificationEmail,
  sendResetEmail,
} = require("../utility/sendEmail.js");
const { genAccessToken, genRefreshToken } = require("../utility/getToken.js");
const {
  BadRequest,
  Conflict,
  Unauthorized,
  InternalServer,
  Forbidden,
} = require("../errors/Errors.error.js");

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    let missingFields = [];
    if (!username) missingFields.push("username");
    if (!email) missingFields.push("email");
    if (!password) missingFields.push("password");
    if (missingFields.length > 0)
      throw new BadRequest(
        `Missing Required fields: ${missingFields.join(", ")}`,
      );

    const alreadyExist = await userModel.findOne({ email });
    if (alreadyExist) throw new Conflict("This email is already in use");

    const rawVerificationToken = crypto.randomBytes(40).toString("hex");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(rawVerificationToken)
      .digest("hex");

    const user = await userModel.create({
      username,
      email,
      password,
      verificationToken: hashedVerificationToken,
    });

    try {
      await sendVerificationEmail(
        rawVerificationToken,
        user.email,
        user.username,
      );
    } catch (emailError) {
      await userModel.findByIdAndDelete(user._id);
      throw new InternalServer(
        "Failed to send verification email, Please try again",
      );
    }

    res.status(201).json({
      success: true,
      message: "User created successfully, Verify email before logging-in",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        plan: user.plan,
        storageLimit: user.storageLimit,
        role: user.role,
      },
    });
  } catch (err) {
    next(err); // will be caught by (err, req, res, next) middleware
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const missingFields = [];
    if (!email) missingFields.push("email");
    if (!password) missingFields.push("password");
    if (missingFields.length > 0)
      throw new BadRequest(
        `Missing Required Fields : ${missingFields.join(", ")}`,
      );

    const user = await userModel.findOne({ email });
    if (!user) {
      throw new Unauthorized("Invalid credentials");
    }

    const doesPassMatch = await user.comparePassword(password);
    if (!doesPassMatch) {
      throw new Unauthorized("Invalid credentials");
    }

    if (!user.isEmailVerified) {
      throw new Forbidden("Please verify your email first");
    }

    const accessToken = genAccessToken({ _id: user._id, email: user.email });
    const refreshToken = genRefreshToken({ _id: user._id, email: user.email });

    const hashedToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const dbToken = await refreshTokenModel.create({
      userId: user._id,
      refreshToken: hashedToken,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 5,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "api/auth",
    });

    res.status(200).json({
      success: true,
      message: "User Logged-in successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        plan: user.plan,
        storageLimit: user.storageLimit,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      await refreshTokenModel.deleteOne({ refreshToken: hashedToken });
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/auth",
    });

    res.status(200).json({
      success: true,
      message: "Logged-out successfully",
    });
  } catch (err) {
    next(err);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken;

    if (!rawRefreshToken) throw new Unauthorized();

    let decoded;
    try {
      decoded = jwt.verify(rawRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new Unauthorized("Expired or invalid token");
    }

    const oldHashedToken = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const existingToken = await refreshTokenModel.findOne({
      refreshToken: oldHashedToken,
    });

    if (!existingToken) throw new Unauthorized("Expired token");

    const newRefreshToken = genRefreshToken({
      _id: decoded._id,
      email: decoded.email,
    });

    const hashedToken = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    const dbToken = await refreshTokenModel.findOneAndUpdate(
      { _id: existingToken._id },
      {
        lastUsed: Date.now(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        refreshToken: hashedToken,
      },
    );

    const accessToken = genAccessToken({
      _id: decoded._id,
      email: decoded.email,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 5,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/auth",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.status(200).json({ sucess: true, message: "Token refreshed" });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, token: rawVerificationToken } = req.query;

    if (!email || !rawVerificationToken)
      throw new BadRequest("Bad verification link");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(rawVerificationToken)
      .digest("hex");

    const user = await userModel.findOneAndUpdate(
      {
        email,
        verificationToken: hashedVerificationToken,
      },
      {
        isEmailVerified: true,
        $unset: { verificationToken: "" },
      },
      {
        new: true,
      },
    );

    if (!user) throw new Unauthorized("Invalid or expired verification link");

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new BadRequest("Please provide an email");

    const user = await userModel.findOne({ email });

    if (!user) throw new NotFound("User does not exist");
    if (user.isEmailVerified) throw new Conflict("Email is already verified");

    const rawVerificationToken = crypto.randomBytes(40).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(rawVerificationToken)
      .digest("hex");

    await userModel.findOneAndUpdate(
      { email },
      { verificationToken: hashedVerificationToken },
    );

    try {
      await sendVerificationEmail(
        rawVerificationToken,
        user.email,
        user.username,
      );
    } catch (emailError) {
      throw new InternalServer("Failed to send verification link");
    }

    res.status(200).json({
      success: true,
      message: "New verification link is sent to your email",
    });
  } catch (err) {
    next(err);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) throw new BadRequest("No email provided");

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If account with this email exist, a reset link has been sent",
      });
    }
    const rawResetToken = crypto.randomBytes(40).toString("hex");
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(rawResetToken)
      .digest("hex");

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 15);

    try {
      await sendResetEmail(rawResetToken, user.email, user.username);
    } catch (err) {
      throw new InternalServer("Reset link failed");
    }

    await user.save();
    res.status(200).json({
      sucess: true,
      message: "Reset link has been sent to your email",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
  refreshAccessToken,
  requestPasswordReset,
};
