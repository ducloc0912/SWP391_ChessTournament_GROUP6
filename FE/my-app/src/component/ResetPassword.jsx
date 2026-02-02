import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../assets/css/ResetPassword.css";

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
        "http://localhost:8080/ctms/api/reset-password",
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
    <div className="reset-wrapper">
      <div className="reset-card">
        <h2 className="reset-title">Reset Password</h2>

        {/* NEW PASSWORD */}
        <div className="reset-group">
          <label>New Password</label>
          <div className="reset-input">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span onClick={() => setShowNewPassword(!showNewPassword)}>👁</span>
          </div>
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="reset-group">
          <label>Confirm Password</label>
          <div className="reset-input">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              👁
            </span>
          </div>
        </div>

        {error && <p className="reset-error">{error}</p>}

        <button className="reset-btn" onClick={handleReset} disabled={loading}>
          {loading ? "Processing..." : "Reset password"}
        </button>

        <button className="cancel-btn" onClick={() => navigate("/")}>
          ← Cancel
        </button>

        <div className="reset-footer">
          PROFESSIONAL &nbsp;•&nbsp; SECURE ENCRYPTION
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
