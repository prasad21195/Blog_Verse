const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Use Resend's default sender initially.
// After you verify your own domain, you can replace this with your domain email.
const FROM_EMAIL =
  process.env.EMAIL_FROM || 'BlogVerse <onboarding@resend.dev>';

// Send registration OTP
const sendOtpEmail = async (toEmail, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: 'Your BlogVerse verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Verify your email</h2>

          <p>
            Use the code below to finish creating your BlogVerse account.
            This code expires in 10 minutes.
          </p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            background: #f5f5f5;
            padding: 16px 24px;
            text-align: center;
            border-radius: 8px;
            margin: 24px 0;
          ">
            ${otp}
          </div>

          <p style="color: #888; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>

          <p style="color: #888; font-size: 13px;">
            — BlogVerse Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend registration OTP error:', error);
      throw new Error(error.message || 'Failed to send verification email');
    }

    console.log('Registration OTP email sent:', {
      id: data?.id,
      to: toEmail,
    });

    return data;
  } catch (err) {
    console.error('sendOtpEmail failed:', err);
    throw err;
  }
};


// Send forgot-password OTP
const sendPasswordResetOtpEmail = async (toEmail, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: 'Your BlogVerse password reset code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Reset your password</h2>

          <p>
            Use the code below to reset your BlogVerse account password.
            This code expires in 10 minutes.
          </p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            background: #f5f5f5;
            padding: 16px 24px;
            text-align: center;
            border-radius: 8px;
            margin: 24px 0;
          ">
            ${otp}
          </div>

          <p style="color: #888; font-size: 13px;">
            If you didn't request a password reset, you can safely ignore
            this email. Your password will not be changed.
          </p>

          <p style="color: #888; font-size: 13px;">
            — BlogVerse Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend password reset error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }

    console.log('Password reset OTP email sent:', {
      id: data?.id,
      to: toEmail,
    });

    return data;
  } catch (err) {
    console.error('sendPasswordResetOtpEmail failed:', err);
    throw err;
  }
};


module.exports = {
  sendOtpEmail,
  sendPasswordResetOtpEmail,
};