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

module.exports = sendEmail;
