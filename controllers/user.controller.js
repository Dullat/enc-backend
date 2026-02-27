require("dotenv").config();
const userModel = require("../models/user.model.js");
const {
  Unauthorized,
  NotFound,
  BadRequest,
} = require("../errors/Errors.error.js");

const verifyEmail = async (req, res, next) => {
  try {
    const { email, token } = req.query;

    if (!email || !token) throw new BadRequest("Bad verification link");

    const user = await userModel.findOneAndUpdate(
      {
        email,
        verificationToken: token,
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

module.exports = {
  verifyEmail,
};
