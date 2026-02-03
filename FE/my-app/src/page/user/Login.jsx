import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import chessImg from "../../assets/img/chessLogin.jpg";
import axios from "axios";

const API_BASE = "http://localhost:8080/ctms/api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSigned, setKeepSigned] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanEmail || !cleanPass) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/login`,
        {
          email: cleanEmail,
          password: cleanPass,
          rememberMe: keepSigned,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // quan trọng để giữ session cookie
        }
      );

      if (res.data?.success) {
        // Lưu user/role để FE dùng hiển thị (session vẫn nằm ở cookie do BE set)
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));
        if (res.data.role) localStorage.setItem("role", res.data.role);

        // Redirect theo BE (admin/staff/player...) nếu có, không thì về "/"
        navigate(res.data.redirect || "/", { replace: true });
        return;
      }

      // login fail nhưng status vẫn 200 => show message từ BE
      setError(res.data?.message || "Đăng nhập thất bại.");
    } catch (err) {
      // Nếu BE trả 401/403/500 có body {message: "..."} thì lấy ra hiển thị
      const beMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;

      setError(beMsg || "Không thể kết nối server. Vui lòng thử lại.");
      console.error("LOGIN ERROR:", err);
    } finally {
      setLoading(false);
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

          {!!error?.trim() && (
            <div style={{ color: "red", marginBottom: 12 }}>
              {error}
            </div>
          )}

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
              autoComplete="email"
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
                autoComplete="current-password"
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                👁
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

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="register-link">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
