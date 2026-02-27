const userModel = require("../models/user.model.js");
const refreshTokenModel = require("../models/refreshToken.model.js");
const sendEmail = require("../utility/sendEmail.js");
const { genAccessToken, genRefreshToken } = require("../utility/getToken.js");
const {
  BadRequest,
  Conflict,
  Unauthorized,
} = require("../errors/Errors.error.js");

const crypto = require("crypto");

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    let missingFields = [];
    if (!name) missingFields.push("user");
    if (!email) missingFields.push("email");
    if (!password) missingFields.push("password");
    if (missingFields.length > 0)
      throw new BadRequest(
        `Missing Required fields: ${missingFields.join(", ")}`,
      );

    const alreadyExist = await userModel.findOne({ email });
    if (alreadyExist) throw new Conflict("This email is already in use");

    const verificationToken = crypto.randomBytes(40).toString("hex");

    const user = await userModel.create({
      name,
      email,
      password,
      verificationToken,
    });
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

    const verifyUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}&email=${email}`;

    await sendEmail({
      email: user.email,
      subject: `Verify your Enc Account`,
      html: `<h1>Welcome ${user.name}</h1>
             <p>Please click the link below to verify your email:</p>
             <a href="${verifyUrl}">Verify Email</a>`,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 5,
    });

    res.cookie("refreshToken", dbToken.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "api/auth/",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
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

    res.cookie("accessToken", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 5,
    });

    res.cookie("refreshToken", {
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
        name: user.name,
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

module.exports = {
  registerUser,
  loginUser,
};
