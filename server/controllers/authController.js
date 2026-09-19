const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const generateToken = require('../utils/generateToken');
const { sendOtpEmail, sendPasswordResetOtpEmail } = require('../utils/sendEmail');

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// Generates a random 6-digit code, e.g. "042817". Padded so it's always
// 6 digits even if the random number is small.
const generateOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

// POST /api/auth/send-otp
// Step 1 of registration: generate a code, hash it (never store OTPs in
// plain text -- same principle as passwords), save with a short expiry,
// and email it. No User is created yet.
const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email is required' });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Upsert -- if the user clicks "Resend OTP", this replaces the old
    // code/expiry instead of creating duplicate records for one email.
    await OtpVerification.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'register' },
      {
        email: normalizedEmail,
        purpose: 'register',
        otpHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        attempts: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail(normalizedEmail, otp);

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}`,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register
// Step 2: only creates the User if a matching, unexpired OTP record
// exists and the submitted code matches the hash.
const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password, otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please verify your email with the code sent to you' });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    const otpRecord = await OtpVerification.findOne({ email: normalizedEmail, purpose: 'register' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'No verification code found for this email. Please request a new one.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await otpRecord.deleteOne();
      return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new one.' });
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await otpRecord.deleteOne();
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' });
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isOtpValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Incorrect verification code' });
    }

    // OTP confirmed -- consume it so it can't be reused, then create the account.
    await otpRecord.deleteOne();

    // Hash password before saving -- plain text passwords are NEVER stored
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Need +password because the schema excludes it by default (select: false)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password/send-otp
// Step 1 of password reset: unlike registration, the email here MUST
// already belong to a real account -- we're proving "you own this inbox
// AND this inbox already has an account", not creating a new one.
const forgotPasswordSendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email is required' });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Deliberately vague message -- confirming/denying whether an email
      // is registered here would let someone enumerate real accounts.
      return res.status(200).json({
        success: true,
        message: `If an account exists for ${normalizedEmail}, a reset code has been sent`,
        data: {},
      });
    }

    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    await OtpVerification.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'reset-password' },
      {
        email: normalizedEmail,
        purpose: 'reset-password',
        otpHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        attempts: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendPasswordResetOtpEmail(normalizedEmail, otp);

    res.status(200).json({
      success: true,
      message: `If an account exists for ${normalizedEmail}, a reset code has been sent`,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password/reset
// Step 2: verify the code, then overwrite the account's password. The old
// password is never checked here -- possession of the OTP is the proof
// of identity, same as clicking a reset link would be in an email-link flow.
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code and new password are all required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    const otpRecord = await OtpVerification.findOne({ email: normalizedEmail, purpose: 'reset-password' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'No reset code found for this email. Please request a new one.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await otpRecord.deleteOne();
      return res.status(400).json({ success: false, message: 'Reset code expired. Please request a new one.' });
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await otpRecord.deleteOne();
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' });
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isOtpValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Incorrect reset code' });
    }

    // Code confirmed -- consume it so it can't be replayed, then update the password.
    await otpRecord.deleteOne();

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.', data: {} });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me (protected)
const getMe = async (req, res, next) => {
  try {
    // req.user was attached by authMiddleware after verifying the JWT
    res.status(200).json({ success: true, message: 'Current user', data: req.user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
// Stateless JWT -- there's nothing to invalidate server-side for this project.
// The frontend simply deletes the token from localStorage and clears context.
const logoutUser = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = { sendOtp, registerUser, loginUser, forgotPasswordSendOtp, resetPassword, getMe, logoutUser };