import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../assets/css/ForgotPassword.css";
import { Link } from "react-router-dom";
import chess from "../../assets/img/chessForgot.jpg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOTP = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:8080/ctms/api/forgot-password",
        {
          email,
        },
      );

      if (res.data.success) {
        navigate("/verify-otp", { state: { email } });
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>Forgot Password</h2>

        {/* Input */}
        <div className="input-group">
          <span className="input-icon">✉</span>

          <input
            type="email"
            placeholder="e.g. magnus@fide.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Error từ backend */}
        {error && <p className="error-text">{error}</p>}

        {/* Send OTP */}
        <button className="send-btn" onClick={handleSendOTP} disabled={loading}>
          {loading ? "Sending..." : "Send OTP →"}
        </button>

        {/* Footer */}
        <div className="forgot-footer">
          <span className="back-login" onClick={() => navigate("/login")}>
            ← Back to Login
          </span>
        </div>
      </div>
    </div>
  );
}
