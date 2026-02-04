import React, { useState, useEffect } from "react";
import "../../assets/css/Login.css";
import chessImg from "../../assets/img/chessLogin.jpg";
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
        { email, password },
        { headers: { "Content-Type": "application/json" } },
      );

      console.log("LOGIN RESPONSE:", res.data);

      if (!res.data.success) {
        setError(res.data.message || "Login failed");
        return;
      }

      const role = res.data.role;

      switch (role) {
        case "ADMIN":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "STAFF":
          navigate("/staff", { replace: true });
          break;
        case "TOURNAMENTLEADER":
          navigate("/tournamentLeader", { replace: true });
          break;
        case "REFEREE":
          navigate("/referee", { replace: true });
          break;
        case "PLAYER":
          navigate("/player", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
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

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="text"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
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
                  setError("");
                }}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁"}
              </span>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="login-options">
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
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
