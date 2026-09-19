import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', otp: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);   

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    if (name === 'name') {
      if (!value.trim()) return 'Name is required';
      return undefined;
    }
    if (name === 'email') {
      if (!value.trim()) return 'Email is required';
      if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter a valid email address';
      return undefined;
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return undefined;
    }
    if (name === 'otp') {
      if (!value) return 'Enter the code sent to your email';
      if (!/^\d{6}$/.test(value)) return 'Code must be 6 digits';
      return undefined;
    }
    return undefined;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name] && !value) return prev;
      return { ...prev, [name]: validateField(name, value) };
    });
  };

  const handleSendOtp = async () => {
    const emailError = validateField('email', form.email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }
    setSendingOtp(true);
    try {
      await api.post('/auth/send-otp', { email: form.email });
      setOtpSent(true);
      toast.success(`Verification code sent to ${form.email}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const validate = () => {
    const newErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      otp: validateField('otp', form.otp),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((err) => !err);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      toast.error('Please verify your email first');
      return;
    }
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      const { token, user } = res.data.data;
      login(token, user);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 420 }}>
      <h2 className="fw-bold mb-1 text-center">Create your account</h2>
      <p className="text-muted small text-center mb-4">
        <span className="text-danger">*</span> indicates a required field
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label">Name <span className="text-danger">*</span></label>
          <input name="name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={handleChange} />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Email <span className="text-danger">*</span></label>
          <div className="input-group">
            <input
              type="email"
              name="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={form.email}
              onChange={handleChange}
              disabled={otpSent}
            />
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={handleSendOtp}
              disabled={sendingOtp || otpSent || !form.email}
            >
              {sendingOtp ? 'Sending...' : otpSent ? 'Sent' : 'Send OTP'}
            </button>
          </div>
          {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
          {otpSent && (
            <div className="form-text">
              Wrong email?{' '}
              <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => { setOtpSent(false); setForm((prev) => ({ ...prev, otp: '' })); }}>
                Change it
              </button>
            </div>
          )}
        </div>

        {otpSent && (
          <div className="mb-3">
            <label className="form-label">Verification Code <span className="text-danger">*</span></label>
            <input
              name="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              className={`form-control ${errors.otp ? 'is-invalid' : ''}`}
              value={form.otp}
              onChange={handleChange}
            />
            {errors.otp ? (
              <div className="invalid-feedback">{errors.otp}</div>
            ) : (
              <div className="form-text">
                Check your inbox for the code. Didn't get it?{' '}
                <button type="button" className="btn btn-link btn-sm p-0 align-baseline" disabled={sendingOtp} onClick={handleSendOtp}>
                  Resend
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mb-3">
  <label className="form-label">Password <span className="text-danger">*</span></label>
  <div className="input-group">
    <input
      type={showPassword ? 'text' : 'password'}
      name="password"
      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
      value={form.password}
      onChange={handleChange}
    />
    <button
      type="button"
      className="btn btn-outline-secondary"
      tabIndex={-1}
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
    </button>
  </div>
  {errors.password ? (
    <div className="invalid-feedback d-block">{errors.password}</div>
  ) : (
    <div className="form-text">Minimum 6 characters</div>
  )}
</div>

        <button className="btn btn-dark w-100" disabled={loading || !otpSent}>
          {loading ? 'Creating...' : 'Register'}
        </button>
        {!otpSent && <p className="text-muted small text-center mt-2">Verify your email above to enable registration</p>}
      </form>
      <p className="text-center mt-3 text-muted">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;