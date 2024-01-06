const nodemailer = require("nodemailer");

const sendEmail = {};

sendEmail.sendEmail = (emailAdmin, action, htmlContent, service, attachments = []) => {
  const transporter = nodemailer.createTransport({
    host: process.env.HOST_EMAIL,
    port: process.env.PORT_EMAIL,
    secure: false,
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.PASS_EMAIL,
    },
    tls: {
      rejectUnauthorize: false,
    },
  });

  const info = transporter.sendMail({
    from: ` ${service} <${process.env.USER_EMAIL}>`,
    to: emailAdmin,
    subject: action,
    html: htmlContent,
    attachments,
  });

  return info;
};

module.exports = sendEmail;
