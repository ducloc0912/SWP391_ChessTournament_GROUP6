import React, { useState } from "react";
import "../assets/css/Login.css";
import chessImg from "../assets/img/chessLogin.jpg";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSigned, setKeepSigned] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:8080/ctms/api/login",
        {
          email,
          password,
          rememberMe: keepSigned,
        },
        { headers: { "Content-Type": "application/json" } },
      );

      if (res.data.success) {
        alert("Login successfully!");
        //navigate(res.data.redirect);
      } else {
        // ✅ DÙNG ĐÚNG MESSAGE TỪ BACKEND
        setError(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  return (
    <div className="login-container">
      <div
        className="login-left"
        style={{ backgroundImage: `url(${chessImg})` }}
      ></div>

      <div className="login-right">
        <form className="login-panel" onSubmit={handleLogin}>
          <h2 className="login-title">Login to your account</h2>

          {/* ✅ CHỈ HIỆN KHI THỰC SỰ CÓ LỖI */}
          {error?.trim() && <p className="error-text">{error}</p>}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="text"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(""); // reset lỗi khi gõ lại
              }}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(""); // reset lỗi khi gõ lại
                }}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁" : "👁"}
              </span>
            </div>
          </div>

          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={keepSigned}
                onChange={() => setKeepSigned(!keepSigned)}
              />
              Keep me signed in
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button className="btn-primary" type="submit">
            Login
          </button>

          <p className="register-link">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
