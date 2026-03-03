import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../../assets/css/ResetPassword.css";
import { API_BASE } from "../../config/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/reset-password`,
        {
          email,
          password,
          confirmPassword,
        },
      );

      if (res.data.success) {
        navigate("/login");
      } else {
        setError(res.data.message || "Reset password failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Server error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-wrapper">
      <div className="rp-card">
        <h2 className="rp-title">Reset Password</h2>

        {/* NEW PASSWORD */}
        <div className="rp-group">
          <label>New Password</label>
          <div className="rp-input">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span onClick={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? "🙈" : "👁"}
            </span>
          </div>
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="rp-group">
          <label>Confirm Password</label>
          <div className="rp-input">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? "🙈" : "👁"}
            </span>
          </div>
        </div>

        {error && <p className="rp-error">{error}</p>}

        <button
          className="rp-reset-btn"
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? "Processing..." : "Reset password"}
        </button>

        <button className="rp-cancel-btn" onClick={() => navigate("/")}>
          Cancel
        </button>

        <p className="rp-footer">PROFESSIONAL - SECURE ENCRYPTION</p>
      </div>
    </div>
  );
};

export default ResetPassword;
