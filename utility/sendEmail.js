require("dotenv").config();
const nodeMailer = require("nodemailer");

const sendEmail = async ({ email, subject, html }) => {
  const transport = nodeMailer.createTransport({
    host: process.env.E_HOST,
    port: process.env.E_PORT,
    auth: {
      user: process.env.E_USER,
      pass: process.env.E_PASS,
    },
  });

  return transport.sendMail({
    from: `"Enc-org Admin" <admin@email.com>`,
    to: email,
    subject: subject,
    html: html,
  });
};

const sendVerifiactionEmail = async (verificationToken, email, username) => {
  const verifyUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}&email=${email}`;
  await sendEmail({
    email: email,
    subject: `Verify your Enc Account`,
    html: `<h1>Welcome ${username}</h1>
             <p>Please click the link below to verify your email:</p>
             <a href="${verifyUrl}">Verify Email</a>`,
  });
};

module.exports = sendVerifiactionEmail;
