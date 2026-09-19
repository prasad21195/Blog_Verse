import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const ForgotPassword = () => {
  const [step, setStep] = useState('email'); // 'email' -> 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resetting, setResetting] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);       
const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
const navigate = useNavigate();

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter a valid email address';
    return undefined;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }
    setSendingOtp(true);
    try {
      const res = await api.post('/auth/forgot-password/send-otp', { email });
      toast.success(res.data.message || 'If an account exists, a reset code has been sent');
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setSendingOtp(false);
    }
  };

  const validateResetForm = () => {
    const newErrors = {};
    if (!otp) {
      newErrors.otp = 'Enter the code sent to your email';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'Code must be 6 digits';
    }
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please re-enter your new password';
    } else if (newPassword && confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await api.post('/auth/forgot-password/send-otp', { email });
      toast.success(res.data.message || 'Code resent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!validateResetForm()) return;
    setResetting(true);
    try {
      await api.post('/auth/forgot-password/reset', { email, otp, newPassword });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 420 }}>
      <h2 className="fw-bold mb-1 text-center">Reset your password</h2>
      <p className="text-muted small text-center mb-4">
        {step === 'email'
          ? "Enter your account email and we'll send you a verification code."
          : `Enter the code sent to ${email} and choose a new password.`}
      </p>

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} noValidate>
          <div className="mb-3">
            <label className="form-label">Email <span className="text-danger">*</span></label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>
          <button className="btn btn-dark w-100" disabled={sendingOtp}>
            {sendingOtp ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} noValidate>
          <div className="mb-3">
            <label className="form-label">Verification Code <span className="text-danger">*</span></label>
            <input
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              className={`form-control ${errors.otp ? 'is-invalid' : ''}`}
              value={otp}
              onChange={(e) => { setOtp(e.target.value); setErrors((prev) => ({ ...prev, otp: undefined })); }}
            />
            {errors.otp ? (
              <div className="invalid-feedback">{errors.otp}</div>
            ) : (
              <div className="form-text">
                Didn't get it?{' '}
                <button type="button" className="btn btn-link btn-sm p-0 align-baseline" disabled={sendingOtp} onClick={handleResendOtp}>
                  Resend
                </button>
              </div>
            )}
          </div>


          <div className="mb-3">
  <label className="form-label">New Password <span className="text-danger">*</span></label>
  <div className="input-group">
    <input
      type={showNewPassword ? 'text' : 'password'}
      className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
      value={newPassword}
      onChange={(e) => { setNewPassword(e.target.value); setErrors((prev) => ({ ...prev, newPassword: undefined })); }}
    />
    <button
      type="button"
      className="btn btn-outline-secondary"
      tabIndex={-1}
      onClick={() => setShowNewPassword((prev) => !prev)}
      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
    >
      <i className={`bi ${showNewPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
    </button>
  </div>
  {errors.newPassword ? (
    <div className="invalid-feedback d-block">{errors.newPassword}</div>
  ) : (
    <div className="form-text">Minimum 6 characters</div>
  )}
</div>

<div className="mb-3">
  <label className="form-label">Re-enter New Password <span className="text-danger">*</span></label>
  <div className="input-group">
    <input
      type={showConfirmPassword ? 'text' : 'password'}
      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
      value={confirmPassword}
      onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: undefined })); }}
    />
    <button
      type="button"
      className="btn btn-outline-secondary"
      tabIndex={-1}
      onClick={() => setShowConfirmPassword((prev) => !prev)}
      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
    >
      <i className={`bi ${showConfirmPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
    </button>
  </div>
  {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
</div>

          <button className="btn btn-dark w-100" disabled={resetting}>
            {resetting ? 'Resetting...' : 'Reset Password'}
          </button>

          <button
            type="button"
            className="btn btn-link btn-sm w-100 mt-2"
            onClick={() => { setStep('email'); setOtp(''); setNewPassword(''); setConfirmPassword(''); setErrors({}); }}
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="text-center mt-3 text-muted">
        Remembered your password? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;