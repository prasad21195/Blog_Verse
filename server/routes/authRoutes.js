const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { sendOtp, registerUser, loginUser, forgotPasswordSendOtp, resetPassword, getMe, logoutUser } = require('../controllers/authController');
const authenticateUser = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limit auth endpoints to slow down brute-force / credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

// Tighter limit on OTP requests specifically -- without this, someone
// could spam an inbox with codes or use it to email-bomb a third party.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many verification code requests. Please try again later.' },
});

router.post(
  '/send-otp',
  otpLimiter,
  [body('email').isEmail().withMessage('A valid email is required')],
  sendOtp
);

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('otp').notEmpty().withMessage('Verification code is required'),
  ],
  registerUser
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginUser
);

router.post(
  '/forgot-password/send-otp',
  otpLimiter,
  [body('email').isEmail().withMessage('A valid email is required')],
  forgotPasswordSendOtp
);

router.post(
  '/forgot-password/reset',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('otp').notEmpty().withMessage('Reset code is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  resetPassword
);

router.get('/me', authenticateUser, getMe);
router.post('/logout', authenticateUser, logoutUser);

module.exports = router;