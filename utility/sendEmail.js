require("dotenv").config();
const nodeMailer = require("nodemailer");

const sendEmail = async ({ email, subject, html }) => {
  const transport = nodeMailer.createTransport({
    host: process.env.E_HOST,
    port: parseInt(process.env.E_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.E_USER,
      pass: process.env.E_PASS,
    },
  });

  return transport.sendMail({
    from: `"Enc" <noreply@mail-enc.dullat.in>`,
    to: email,
    subject: subject,
    html: html,
  });
};

const sendVerificationEmail = async (verificationToken, email, username) => {
  const verifyUrl = `http://enc-api.dullat.in/api/auth/verify-email?token=${verificationToken}&email=${email}`;
  await sendEmail({
    email: email,
    subject: `Verify your Enc Account`,
    html: `<h1>Welcome ${username}</h1>
             <p>Please click the link below to verify your email:</p>
             <a href="${verifyUrl}">Verify Email</a>`,
  });
};

const sendResetEmail = async (resetToken, email, username) => {
  const resetUrl = `http://enc-api.dullat.in/api/auth/reset-password?token=${resetToken}&email=${email}`;
  await sendEmail({
    email: email,
    subject: `Reset your Enc password`,
    html: `<h1>Reset your password ${username}</h1>
          <p>Please click the link below to reset your password</p>
          <a href="${resetUrl}">Reset_Password</a>`,
  });
};

module.exports = { sendVerificationEmail, sendResetEmail };
