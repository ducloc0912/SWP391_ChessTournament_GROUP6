import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import "../../assets/css/Verify.css";
import { API_BASE } from "../../config/api";

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [error, setError] = useState("");

  // 🔐 resend control
  const [counter, setCounter] = useState(0); // 0 = chưa đếm
  const [isResending, setIsResending] = useState(false);

  const inputsRef = useRef([]);

  /* =============================
      COUNTDOWN (CHỈ SAU RESEND)
  ============================= */
  useEffect(() => {
    if (counter <= 0) return;

    const interval = setInterval(() => {
      setCounter((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsResending(false); // 🔓 mở resend
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [counter]);

  /* =============================
      HANDLE INPUT
  ============================= */
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  /* =============================
      VERIFY OTP
  ============================= */
  const handleVerify = async () => {
    const otpCode = otp.join("");

    if (otpCode.length < 6) {
      setError("Please enter full 6-digit OTP");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE || "http://localhost:8080/ctms"}/api/verify-otp`,
        {
          email,
          otp: otpCode,
        },
      );

      if (res.data.success) {
        navigate("/reset-password", { state: { email } });
      } else {
        setError(res.data.message || "Invalid OTP");
      }
    } catch {
      setError("OTP verification failed");
    }
  };

  /* =============================
      RESEND OTP (ANTI SPAM)
  ============================= */
  const handleResend = async () => {
    if (isResending || counter > 0) return; // 🚫 chặn spam

    try {
      setIsResending(true);
      setCounter(60); // ⏱ bắt đầu đếm SAU khi bấm

      const res = await axios.post(
        `${API_BASE}/api/forgot-password`,
        { email },
      );

      if (!res.data.success) {
        setError(res.data.message || "Cannot resend OTP");
      }

      setOtp(Array(6).fill(""));
      inputsRef.current[0]?.focus();
    } catch {
      setError("Cannot resend OTP right now");
      setIsResending(false);
      setCounter(0);
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-card">
        <div className="otp-icon">🔐</div>

        <h2 className="otp-title">Verify OTP</h2>

        <p className="otp-subtitle">
          Enter the 6-digit code sent to <br />
          <strong>{email}</strong>
        </p>

        <div className="otp-inputs">
          {otp.map((digit, i) => (
            <input
              key={i}
              type="text"
              maxLength="1"
              value={digit}
              ref={(el) => (inputsRef.current[i] = el)}
              onChange={(e) => handleChange(e.target.value, i)}
            />
          ))}
        </div>

        {error && <p className="otp-error">{error}</p>}

        {/* TEXT COUNTDOWN */}
        {counter > 0 && (
          <p className="otp-resend-timer">
            Resend OTP in <strong>{counter}s</strong>
          </p>
        )}

        {/* RESEND BUTTON */}
        <button
          type="button"
          className={`otp-resend-btn ${
            counter === 0 && !isResending ? "active" : ""
          }`}
          disabled={isResending || counter > 0}
          onClick={handleResend}
        >
          Resend OTP
        </button>

        <button type="button" className="otp-submit-btn" onClick={handleVerify}>
          Verify Identity
        </button>

        <Link to="/forgot-password" className="otp-back">
          Back to Forgot Password
        </Link>
      </div>
    </div>
  );
};

export default Verify;
