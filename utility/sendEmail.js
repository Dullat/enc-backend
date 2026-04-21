require("dotenv").config();
const nodeMailer = require("nodemailer");
const fetch = require("node-fetch");

const sendEmail = async ({ email, subject, html }) => {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.E_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Enc", email: "noreply@mail-enc.dullat.in" },
        to: [{ email }],
        subject,
        htmlContent: html,
      }),
    });
    return res.json();
  } catch (err) {
    console.log(err);
    throw new Error(`Email send failed`);
  }
};

const sendVerificationEmail = async (verificationToken, email, username) => {
  const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify-email?token=${verificationToken}&email=${email}`;

  await sendEmail({
    email,
    subject: "Verify your Enc Account",
    html: `<h1>Welcome ${username}</h1>
           <p>Please click the link below to verify your email:</p>
           <a href="${verifyUrl}">Verify Email</a>`,
  });
};

const sendResetEmail = async (resetToken, email, username) => {
  const resetUrl = `${process.env.SERVER_URL}/api/auth/reset-password?token=${resetToken}&email=${email}`;

  await sendEmail({
    email,
    subject: "Reset your Enc password",
    html: `<h1>Reset your password, ${username}</h1>
           <p>Please click the link below to reset your password:</p>
           <a href="${resetUrl}">Reset Password</a>`,
  });
};

// const sendEmail = async ({ email, subject, html }) => {
//   const transport = nodeMailer.createTransport({
//     host: process.env.E_HOST,
//     port: parseInt(process.env.E_PORT) || 587,
//     secure: false,
//     auth: {
//       user: process.env.E_USER,
//       pass: process.env.E_PASS,
//     },
//   });
//
//   return transport.sendMail({
//     from: `"Enc" <noreply@mail-enc.dullat.in>`,
//     to: email,
//     subject: subject,
//     html: html,
//   });
// };

module.exports = { sendVerificationEmail, sendResetEmail };
