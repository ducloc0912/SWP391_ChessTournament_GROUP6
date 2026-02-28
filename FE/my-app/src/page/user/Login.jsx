import React, { useState } from "react";
import "../../assets/css/Login.css";
import chessImg from "../../assets/img/chessLogin.jpg";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/ctms";

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
        `${API_BASE}/api/login`,
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );

      console.log("LOGIN RESPONSE:", res.data);
      console.log("ROLE:", res.data.role);

      if (!res.data.success) {
        setError(res.data.message || "Login failed");
        return;
      }

      const role = res.data.role?.toUpperCase(); // Ensure uppercase
      const userData = res.data.user;

      // Lưu user + role vào localStorage để Home và các trang khác biết đã đăng nhập
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      }
      if (role) {
        localStorage.setItem("role", role);
      }

      console.log("NAVIGATING WITH ROLE:", role);

      // Normalize role: remove spaces and underscores for comparison
      const normalizedRole = role?.replace(/[_\s]/g, "");
      
      switch (normalizedRole) {
        case "ADMIN":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "STAFF":
          navigate("/staff/dashboard", { replace: true });
          break;
        case "TOURNAMENTLEADER":
          navigate("/tournaments", { replace: true });
          break;
        case "REFEREE":
          navigate("/home", { replace: true });
          break;
        case "PLAYER":
          navigate("/home", { replace: true });
          break;
        default:
          console.log("Unknown role, going to home:", role, "normalized:", normalizedRole);
          navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      if (err.response?.status === 404) {
        setError("Không tìm thấy API đăng nhập. Kiểm tra backend đã chạy và context path là /ctms (hoặc đặt VITE_API_BASE=http://localhost:8080).");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === "ERR_NETWORK" || err.message?.includes("Network")) {
        setError("Không kết nối được server. Kiểm tra backend đã chạy tại " + API_BASE);
      } else {
        setError(err.response?.data?.message || "Lỗi đăng nhập. Thử lại sau.");
      }
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
