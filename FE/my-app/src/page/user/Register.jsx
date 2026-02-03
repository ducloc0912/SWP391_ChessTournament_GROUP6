import React, { useState } from "react";
import chess from "../../assets/img/chessRegis.jpg";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = "http://localhost:8080/ctms/api/auth";

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // validate nhẹ FE
    if (!form.agree) {
      setError("Bạn cần đồng ý Terms & Conditions.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);

      // 1) Register
      const res = await axios.post(`${API_BASE}/register`, form, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (!res.data?.success) {
        setError(res.data?.message || "Register failed");
        return;
      }

      // 2) Auto login để tạo session
      const loginRes = await axios.post(
        `${API_BASE}/login`,
        { email: form.email.trim().toLowerCase(), password: form.password },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );

      if (loginRes.data?.success) {
        if (loginRes.data.user) localStorage.setItem("user", JSON.stringify(loginRes.data.user));
        if (loginRes.data.role) localStorage.setItem("role", loginRes.data.role);
        navigate(loginRes.data.redirect || "/");
      } else {
        // đăng ký ok nhưng login fail -> chuyển về login
        setError(loginRes.data?.message || "Register ok but auto-login failed");
        navigate("/login");
      }

    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Server error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container fade-in">
      <div className="register-left" style={{ backgroundImage: `url(${chess})` }} />

      <div className="register-right">
        <div className="form-card">
          <h1>Create an Account</h1>

          {!!error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label>First Name</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} />
              </div>

              <div>
                <label>Last Name</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} />
              </div>

              <div>
                <label>User Name</label>
                <input name="username" value={form.username} onChange={handleChange} />
              </div>

              <div>
                <label>Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} />
              </div>

              <div>
                <label>Email Address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} />
              </div>

              <div>
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleChange} />
              </div>

              <div>
                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} />
              </div>

              <div>
                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
              </div>
            </div>

            <div className="checkbox">
              <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
              <span>I agree to the Terms & Conditions</span>
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="login-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
