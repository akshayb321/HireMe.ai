import React, { useEffect, useState } from "react";
import { TextField } from "@mui/material";
import { MuiOtpInput } from "mui-one-time-password-input";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../config/api.js";
import "./Auth.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");

  const [resendTimer, setResendTimer] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      setPasswordError("");
    }

    if (name === "confirmPassword") {
      setConfirmPasswordError("");
    }
  };

  const handleOtpChange = (value) => {
    setOtp(value);

    if (otpError) {
      setOtpError("");
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/forgot-password/send-otp", {
        email: formData.email.trim(),
      });

      setOtpSent(true);
      setOtp("");
      setOtpError("");
      setResendTimer(60);

      toast.success(response.data.message || "OTP sent successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError("Please enter the complete OTP");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/forgot-password/verify-otp", {
        email: formData.email.trim(),
        otp,
      });

      setOtpVerified(true);
      setOtpError("");

      toast.success(response.data.message || "Email verified");
    } catch (error) {
      setOtpVerified(false);

      setOtpError(
        error.response?.data?.message || "Invalid OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      setLoading(true);

      const response = await api.post("/auth/forgot-password/send-otp", {
        email: formData.email.trim(),
      });

      setOtp("");
      setOtpError("");
      setResendTimer(60);

      toast.success(response.data.message || "New OTP sent");
    } catch (error) {
      setOtpError(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setPasswordError("");
    setConfirmPasswordError("");

    if (!otpVerified) {
      setOtpError("Please verify your email first");
      return;
    }

    if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/forgot-password/reset", {
        email: formData.email.trim(),
        password: formData.password,
      });

      toast.success(response.data.message || "Password reset successfully");

      navigate("/auth/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-layout">
        {/* Left Section */}
        {/* Left Section */}
        <div className="auth-left">
          <div className="auth-left-content">
            {/* Brand */}
            <div className="auth-left-brand">
              <div className="auth-left-brand-icon">
                <img
                  src="https://res.cloudinary.com/jwqnivpq/image/upload/v1789569626/ChatGPT_Image_Sep_16_2026_08_10_16_PM.png"
                  alt="HireMe.ai logo"
                />
              </div>

              <h2>
                HireMe <span>AI</span>
              </h2>
            </div>

            {/* Main Heading */}
            <div className="auth-left-heading">
              <h1>Forgot Password?</h1>

              <p>
                No worries, let's get you back
                <br />
                on track towards a better future.
              </p>
            </div>

            {/* Illustration */}
            <div className="auth-illustration">
              <div className="auth-illustration-glow"></div>

              <img
                src="https://res.cloudinary.com/jwqnivpq/image/upload/v1789737353/left_img.png"
                alt="Password recovery illustration"
              />
            </div>

            {/* Bottom Features */}
            <div className="auth-left-bottom">
              <div className="auth-left-bottom-item">
                <span>Practice</span>
              </div>

              <span className="auth-bottom-dot">•</span>

              <div className="auth-left-bottom-item">
                <span>Learn</span>
              </div>

              <span className="auth-bottom-dot">•</span>

              <div className="auth-left-bottom-item">
                <span>Grow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="auth-right">
          <div className="auth-mobile-brand">
            <img
              src="https://res.cloudinary.com/jwqnivpq/image/upload/v1789569626/ChatGPT_Image_Sep_16_2026_08_10_16_PM.png"
              alt="HireMe.ai Logo"
            />
            <span>
              HireMe <span>AI</span>
            </span>
          </div>
          <div className="auth-card forgot-password-card">
            <div className="auth-header">
              <h1>Forgot Password?</h1>

              <p>Verify your email to reset your HireMe.ai password.</p>
            </div>

            <form onSubmit={handleResetPassword}>
              {/* Email */}
              <div className="auth-input-group">
                <div className="email-input-group">
                  <TextField
                    required
                    type="email"
                    className={otpVerified ? "email-verified-input" : ""}
                    label={
                      <>
                        <i className="fa-solid fa-envelope"></i>
                        Email Address
                      </>
                    }
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={otpSent}
                    fullWidth
                  />

                  {otpVerified && (
                    <div className="verified-badge">
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Send OTP */}
              {!otpSent && (
                <button
                  type="button"
                  className="auth-submit-btn verify-email-btn"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Sending OTP
                    </>
                  ) : (
                    <>
                      Send OTP
                      <i className="fa-solid fa-arrow-right"></i>
                    </>
                  )}
                </button>
              )}

              {/* OTP Verification */}
              {otpSent && !otpVerified && (
                <div
                  className={`signup-otp-section ${
                    otpError ? "otp-error" : ""
                  }`}
                >
                  <div className="otp-heading">
                    <div className="otp-title">
                      <div className="otp-title-icon">
                        <i className="fa-solid fa-shield-halved"></i>
                      </div>

                      <div>
                        <h3>Verify your email</h3>
                        <p>Enter the 6-digit OTP sent to your email</p>
                      </div>
                    </div>

                    <span className="otp-email">{formData.email}</span>
                  </div>

                  <div className="otp-input-wrapper">
                    <MuiOtpInput
                      value={otp}
                      onChange={handleOtpChange}
                      length={6}
                    />
                  </div>

                  {otpError && (
                    <p className="otp-error-message">
                      <i className="fa-solid fa-circle-exclamation"></i>
                      {otpError}
                    </p>
                  )}

                  <button
                    type="button"
                    className="auth-submit-btn"
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6 || loading}
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        Verifying
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <i className="fa-solid fa-arrow-right"></i>
                      </>
                    )}
                  </button>

                  <div className="otp-resend">
                    {resendTimer > 0 ? (
                      <p>Resend OTP in {resendTimer}s</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* New Password */}
              {otpVerified && (
                <>
                  <div className="auth-input-group password-input-group">
                    <TextField
                      required
                      type={showPassword ? "text" : "password"}
                      label={
                        <>
                          <i className="fa-solid fa-lock"></i>
                          New Password
                        </>
                      }
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      error={!!passwordError}
                      helperText={passwordError}
                      fullWidth
                    />

                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide new password" : "Show new password"
                      }
                    >
                      <i
                        className={`fa-solid ${
                          showPassword ? "fa-eye-slash" : "fa-eye"
                        }`}
                      ></i>
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="auth-input-group password-input-group">
                    <TextField
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      label={
                        <>
                          <i className="fa-solid fa-lock"></i>
                          Confirm Password
                        </>
                      }
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={!!confirmPasswordError}
                      helperText={confirmPasswordError}
                      fullWidth
                    />

                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      <i
                        className={`fa-solid ${
                          showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                        }`}
                      ></i>
                    </button>
                  </div>

                  {/* Reset Password */}
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        Resetting Password
                      </>
                    ) : (
                      <>
                        Reset Password
                        <i className="fa-solid fa-arrow-right"></i>
                      </>
                    )}
                  </button>
                </>
              )}
            </form>

            <div className="auth-bottom">
              <p>
                Remember your password? <Link to="/auth/login">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
