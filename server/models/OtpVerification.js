const mongoose = require('mongoose');

// Short-lived record used for two flows -- registration email verification
// and forgot-password verification -- distinguished by `purpose` so a code
// issued for one can't accidentally be accepted for the other. We never
// store the OTP in plain text -- same principle as passwords -- so even
// direct DB access can't reveal the live code.
const otpVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['register', 'reset-password'],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0, // failed verify attempts -- caps brute-forcing a 6-digit code
    },
  },
  { timestamps: true }
);

// MongoDB TTL index: documents are automatically deleted once expiresAt
// passes, so expired OTPs don't linger in the collection.
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpVerificationSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);