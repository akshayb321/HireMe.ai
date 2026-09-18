import React, { useState } from "react";
import { TextField } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../config/api.js";
import "./Auth.css";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitData = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!formData.password) {
      toast.error("Please enter your password");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      toast.success(response.data.message || "Login successful");

      navigate("/dashboard", {
        state: response.data,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-layout">
        {/* =====================================================
            LEFT SECTION — PrepMate AI UI
            ===================================================== */}

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
              <h1>Welcome Back!</h1>

              <p>
                Sign in to continue your journey
                <br />
                towards a better future.
              </p>
            </div>

            {/* Illustration */}
            <div className="auth-illustration">
              <div className="auth-illustration-glow"></div>

              <img
                src="https://res.cloudinary.com/jwqnivpq/image/upload/v1789737353/left_img.png"
                alt="AI interview preparation illustration"
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

        {/* =====================================================
            RIGHT SECTION — UNCHANGED
            ===================================================== */}

        <div className="auth-right">
          <div className="auth-card login-card">
            <div className="auth-header">
              <h1>Welcome Back!</h1>

              <p>Login to your HireMe.ai account and continue preparing.</p>
            </div>

            <form onSubmit={submitData}>
              {/* Email */}
              <div className="auth-input-group">
                <TextField
                  required
                  type="email"
                  label={
                    <>
                      <i className="fa-solid fa-envelope"></i>
                      Email Address
                    </>
                  }
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                />
              </div>

              {/* Password */}
              <div className="auth-input-group password-input-group">
                <TextField
                  required
                  type={showPassword ? "text" : "password"}
                  label={
                    <>
                      <i className="fa-solid fa-lock"></i>
                      Password
                    </>
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                />

                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i
                    className={`fa-solid ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>

              {/* Forgot Password */}
              <div className="auth-forgot">
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Logging in
                  </>
                ) : (
                  <>
                    Login
                    <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            <div className="auth-bottom">
              <p>
                Don't have an account? <Link to="/signup">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
