import React, { useState } from "react";
import "../../assets/css/Register.css";
import chess from "../../assets/img/chessRegis.jpg";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../../config/api";

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
    role: "Player",
    agree: false,
  });

  const ROLE_OPTIONS = [
    { value: "Player", label: "Người chơi (Player)", desc: "Tham gia thi đấu cờ vua" },
    { value: "TournamentLeader", label: "Trưởng ban tổ chức (Tournament Leader)", desc: "Tạo và quản lý giải đấu, mời trọng tài" },
    { value: "Referee", label: "Trọng tài (Referee)", desc: "Điều hành trận đấu, được mời bởi trưởng ban tổ chức" },
  ];

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
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
        `${API_BASE}/api/user/register`,
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

              {/* Role */}
              <div className="form-field-full">
                <label>Vai trò đăng ký</label>
                <div className="role-options">
                  {ROLE_OPTIONS.map((opt) => (
                    <label key={opt.value} className={`role-option ${form.role === opt.value ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="role"
                        value={opt.value}
                        checked={form.role === opt.value}
                        onChange={handleChange}
                      />
                      <span className="role-label">{opt.label}</span>
                      <span className="role-desc">{opt.desc}</span>
                    </label>
                  ))}
                </div>
                {errors.role && <p className="error">{errors.role}</p>}
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
                  href="#!"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
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

      {showTermsModal && (
        <div
          onClick={() => setShowTermsModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(92vw, 760px)",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>
                ĐIỀU KHOẢN & ĐIỀU KIỆN
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ color: "#334155", lineHeight: 1.7, fontSize: 14 }}>
              <div
                style={{
                  background: "#f8fafc",

                  padding: "10px 12px",
                  marginBottom: 14,
                  color: "#0f172a",
                  fontWeight: 600,
                }}
              >
                Cập nhật lần cuối: 29/01/2026
              </div>

              <p>
                Khi đăng ký tham gia bất kỳ giải đấu nào được tổ chức thông qua
                Chess Tournament Management System, bạn xác nhận rằng bạn đã
                đọc, hiểu và đồng ý với các Điều khoản & Điều kiện dưới đây.
              </p>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                1. Phạm vi áp dụng
              </h4>
              <p>
                Điều khoản này áp dụng cho tất cả người đăng ký tham gia giải
                đấu, bao gồm nhưng không giới hạn:
              </p>
              <ul>
                <li>Kỳ thủ / người chơi</li>
                <li>Trọng tài</li>
                <li>Huấn luyện viên</li>
                <li>Thành viên ban tổ chức (nếu đăng ký thông qua nền tảng)</li>
              </ul>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                2. Vai trò của nền tảng
              </h4>
              <ul>
                <li>
                  Chess Tournament Management System là nền tảng công nghệ hỗ
                  trợ đăng ký và quản lý giải đấu.
                </li>
                <li>
                  Chúng tôi không trực tiếp tổ chức, điều hành hoặc quyết định
                  kết quả giải đấu.
                </li>
                <li>
                  Mọi giải đấu được tổ chức bởi đơn vị tổ chức giải đấu (bên thứ
                  ba).
                </li>
              </ul>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                3. Trách nhiệm của người tham gia
              </h4>
              <p>Khi đăng ký giải đấu, bạn cam kết:</p>
              <ul>
                <li>Cung cấp thông tin chính xác, đầy đủ và trung thực.</li>
                <li>
                  Tuân thủ thể lệ giải đấu, quyết định của trọng tài và ban tổ
                  chức.
                </li>
                <li>
                  Tuân thủ các quy định về đạo đức, tinh thần thể thao và
                  fair-play.
                </li>
                <li>
                  Không gian lận, dàn xếp kết quả, sử dụng công cụ hỗ trợ trái
                  phép, gây rối hoặc xúc phạm.
                </li>
              </ul>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                4. Thể lệ & kết quả thi đấu
              </h4>
              <ul>
                <li>
                  Thể lệ, hình thức thi đấu, luật áp dụng và cơ cấu giải thưởng
                  do đơn vị tổ chức giải đấu ban hành.
                </li>
                <li>
                  Kết quả thi đấu được xác nhận bởi ban tổ chức và/hoặc trọng
                  tài.
                </li>
                <li>
                  Nền tảng không chịu trách nhiệm cho khiếu nại kết quả, tranh
                  chấp chuyên môn hoặc quyết định kỷ luật.
                </li>
              </ul>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                5. Phí tham gia & hoàn tiền
              </h4>
              <ul>
                <li>
                  Phí tham gia (nếu có) do đơn vị tổ chức giải đấu quy định.
                </li>
                <li>
                  Chính sách hoàn tiền, hủy đăng ký hoặc thay đổi thông tin phụ
                  thuộc thể lệ giải đấu và quy định của đơn vị tổ chức.
                </li>
                <li>
                  Nền tảng không chịu trách nhiệm hoàn tiền thay cho đơn vị tổ
                  chức, trừ khi có thông báo khác.
                </li>
              </ul>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                6. Quyền sử dụng hình ảnh & thông tin
              </h4>
              <p>
                Khi tham gia giải đấu, bạn đồng ý rằng hình ảnh, tên, thành tích
                thi đấu của bạn có thể được sử dụng cho:
              </p>
              <ul>
                <li>Hiển thị kết quả</li>
                <li>Truyền thông giải đấu</li>
                <li>Báo cáo và thống kê</li>
              </ul>
              <p>
                Việc sử dụng này không nhằm mục đích thương mại cá nhân nếu
                không có sự đồng ý riêng của bạn.
              </p>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                7. Dữ liệu cá nhân & bảo mật
              </h4>
              <p>
                Thông tin cá nhân được thu thập nhằm mục đích quản lý giải đấu,
                xác thực người tham gia và hiển thị kết quả.
              </p>
              <p>
                Dữ liệu được xử lý theo chính sách bảo mật của Chess Tournament
                Management System. Đơn vị tổ chức giải đấu chịu trách nhiệm sử
                dụng dữ liệu đúng mục đích và đúng pháp luật.
              </p>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                8. Giới hạn trách nhiệm
              </h4>
              <p>Nền tảng không chịu trách nhiệm đối với:</p>
              <ul>
                <li>Tranh chấp giữa người tham gia và ban tổ chức</li>
                <li>
                  Thiệt hại phát sinh từ việc hủy, hoãn hoặc thay đổi giải đấu
                </li>
                <li>
                  Sự cố ngoài khả năng kiểm soát hợp lý (mất kết nối, sự cố kỹ
                  thuật, thiên tai...)
                </li>
              </ul>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                9. Từ chối & hủy tư cách tham gia
              </h4>
              <ul>
                <li>
                  Ban tổ chức có quyền từ chối hoặc hủy tư cách tham gia nếu vi
                  phạm thể lệ.
                </li>
                <li>
                  Có thể không hoàn phí trong trường hợp vi phạm nghiêm trọng.
                </li>
                <li>
                  Nền tảng chỉ hỗ trợ kỹ thuật cho quyết định này và không chịu
                  trách nhiệm pháp lý.
                </li>
              </ul>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                10. Luật áp dụng
              </h4>
              <p>
                Điều khoản này được điều chỉnh theo pháp luật Việt Nam. Mọi
                tranh chấp liên quan đến giải đấu sẽ do người tham gia và đơn vị
                tổ chức giải đấu trực tiếp giải quyết.
              </p>

              <h4 style={{ color: "#0f172a", marginTop: 16 }}>
                11. Xác nhận đồng ý
              </h4>
              <p>Bằng việc nhấn “Đăng ký tham gia”, bạn xác nhận rằng:</p>
              <ul>
                <li>☑ Bạn đã đọc và hiểu Điều khoản & Điều kiện</li>
                <li>☑ Bạn tự nguyện tham gia giải đấu</li>
                <li>
                  ☑ Bạn đồng ý chịu trách nhiệm về mọi hành vi của mình trong
                  giải đấu
                </li>
              </ul>
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "9px 14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
