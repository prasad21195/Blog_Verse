const nodemailer = require('nodemailer');

// Single reusable SMTP transporter. Works with Gmail (using an App
// Password, not your normal password) or any other SMTP provider --
// just change EMAIL_HOST/EMAIL_PORT in .env if you're not using Gmail.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"BlogVerse" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your BlogVerse verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1a1a1a;">Verify your email</h2>
        <p>Use the code below to finish creating your BlogVerse account. This code expires in 10 minutes.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f5f5f5; padding: 16px 24px; text-align: center; border-radius: 8px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

const sendPasswordResetOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"BlogVerse" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your BlogVerse password reset code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1a1a1a;">Reset your password</h2>
        <p>Use the code below to reset your BlogVerse account password. This code expires in 10 minutes.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f5f5f5; padding: 16px 24px; text-align: center; border-radius: 8px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email -- your password will not be changed.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail, sendPasswordResetOtpEmail };