const nodemailer = require('nodemailer');
const smtpConfig = require('../config/smtp');

const transporter = nodemailer.createTransport(smtpConfig);

async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: smtpConfig.auth.user,
    to,
    subject: 'KLS Resolutions OTP',
    text: `Your OTP for password reset is: ${otp}`
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };