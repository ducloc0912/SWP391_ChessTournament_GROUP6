import React, { useState } from "react";
import "../../assets/css/Register.css";
import chess from "../../assets/img/chessRegis.jpg";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

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

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const res = await axios.post(
        "http://localhost:8080/ctms/api/register",
        form,
        { headers: { "Content-Type": "application/json" } },
      );

      if (res.data.success) {
        navigate("/login"); // basename đã tự xử lý
      } else {
        if (res.data.errors) {
          setErrors(res.data.errors);
        } else {
          alert(res.data.message || "Register failed");
        }
      }
    } catch (err) {
      if (err.response && err.response.status === 400) {
        // backend trả errors dạng JSON
        setErrors(err.response.data);
      } else {
        console.error(err);
        alert("Server error");
      }
    }
  };

  return (
    <div className="register-container fade-in">
      {/* LEFT SIDE */}
      <div
        className="register-left"
        style={{ backgroundImage: `url(${chess})` }}
      />

      {/* RIGHT SIDE */}
      <div className="register-right">
        <div className="form-card">
          <h1>Create an Account</h1>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* First Name */}
              <div>
                <label>First Name</label>
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <p className="error">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label>Last Name</label>
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && <p className="error">{errors.lastName}</p>}
              </div>

              {/* Username */}
              <div>
                <label>User Name</label>
                <input
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                />
                {errors.username && <p className="error">{errors.username}</p>}
              </div>

              {/* Phone */}
              <div>
                <label>Phone Number</label>
                <input
                  name="phone"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={handleChange}
                />
                {errors.phone && <p className="error">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="error">{errors.email}</p>}
              </div>

              {/* Address */}
              <div>
                <label>Address</label>
                <input
                  name="address"
                  placeholder="Address"
                  value={form.address}
                  onChange={handleChange}
                />
                {errors.address && <p className="error">{errors.address}</p>}
              </div>

              {/* Password */}
              <div>
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && <p className="error">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <p className="error">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
            {/* Checkbox */}
            <div className="checkbox">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={handleChange}
              />
              <span>
                I agree to the{" "}
                <a
                  href="https://docs.google.com/document/d/1U0PAg-QzNAmhrOqhWovNZVgVyaHm6-oWjUvwnPBkV24/edit"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms & Conditions
                </a>
              </span>
            </div>

            {errors.agree && <p className="error">{errors.agree}</p>}

            <button type="submit" className="register-btn">
              Register
            </button>
            <p className="login-text">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
