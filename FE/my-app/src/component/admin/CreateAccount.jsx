import React, { Component } from "react";
import { API_BASE } from "../../config/api";

class CreateAccount extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      email: "",
      password: "",
      fullName: "",
      dob: "",
      phone: "",
      loading: false,
      successMessage: "",
      errorMessage: "",
    };
  }

  handleBack = () => {
    if (typeof this.props.onBack === "function") {
      this.props.onBack();
      return;
    }

    window.location.href = "/admin/dashboard";
  };

  handleReload = () => {
    this.setState({
      username: "",
      email: "",
      password: "",
      fullName: "",
      dob: "",
      phone: "",
      loading: false,
      successMessage: "",
      errorMessage: "",
    });
  };

  handleChange = (event) => {
    const { name, value } = event.target;

    this.setState({
      [name]: value,
      successMessage: "",
      errorMessage: "",
    });
  };

  splitFullName = (fullName) => {
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      return {
        firstName: "",
        lastName: "",
      };
    }

    const parts = trimmedName.split(/\s+/);

    if (parts.length === 1) {
      return {
        firstName: parts[0],
        lastName: "",
      };
    }

    return {
      firstName: parts[parts.length - 1],
      lastName: parts.slice(0, parts.length - 1).join(" "),
    };
  };

  validateForm = () => {
    const { username, email, password, fullName, dob, phone } = this.state;

    if (!username.trim()) {
      return "Username không được để trống.";
    }

    if (!email.trim()) {
      return "Email không được để trống.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Email không đúng định dạng.";
    }

    if (!password.trim()) {
      return "Mật khẩu không được để trống.";
    }

    if (password.trim().length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (!fullName.trim()) {
      return "Họ tên không được để trống.";
    }

    if (!dob) {
      return "Ngày sinh không được để trống.";
    }

    if (!phone.trim()) {
      return "Số điện thoại không được để trống.";
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      return "Số điện thoại phải đúng 10 chữ số và bắt đầu bằng số 0.";
    }

    return "";
  };

  handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = this.validateForm();
    if (validationError) {
      this.setState({
        errorMessage: validationError,
        successMessage: "",
      });
      return;
    }

    const { username, email, password, fullName, dob, phone } = this.state;
    const { firstName, lastName } = this.splitFullName(fullName);

    const payload = {
      username: username.trim(),
      email: email.trim(),
      password: password.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phone.trim(),
      birthday: dob,
    };

    try {
      this.setState({
        loading: true,
        successMessage: "",
        errorMessage: "",
      });

      const response = await fetch(`${API_BASE}/api/admin/users/create-staff`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || "Tạo tài khoản staff thất bại.");
      }

      this.setState({
        username: "",
        email: "",
        password: "",
        fullName: "",
        dob: "",
        phone: "",
        loading: false,
        successMessage: data?.message || "Tạo tài khoản staff thành công.",
        errorMessage: "",
      });
    } catch (error) {
      this.setState({
        loading: false,
        successMessage: "",
        errorMessage: error.message || "Có lỗi xảy ra khi tạo tài khoản.",
      });
    }
  };

  render() {
    const {
      username,
      email,
      password,
      fullName,
      dob,
      phone,
      loading,
      successMessage,
      errorMessage,
    } = this.state;

    return (
      <div className="ca-page">
        <style>{`
          .ca-page{
            min-height:100%;
            padding:16px;
            background:
              radial-gradient(1200px 500px at 10% 0%, rgba(59,130,246,0.12), transparent 60%),
              radial-gradient(1200px 500px at 90% 0%, rgba(249,115,22,0.10), transparent 55%),
              linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
            color:#0b0f1a;
            font-weight:400;
          }

          .ca-wrap{
            max-width:900px;
            margin:0 auto;
            display:flex;
            flex-direction:column;
            gap:14px;
            font-weight:400;
          }

          .ca-card{
            border-radius:16px;
            background:rgba(255,255,255,0.92);
            border:1px solid rgba(15,23,42,0.08);
            box-shadow:0 14px 34px rgba(15,23,42,0.06);
            padding:14px;
            font-weight:400;
          }

          .ca-title{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:10px;
            flex-wrap:wrap;
          }

          .ca-h1{
            font-size:18px;
            font-weight:400;
          }

          .ca-sub{
            opacity:.75;
            font-weight:400;
            margin-top:4px;
          }

          .ca-alert{
            border-radius:12px;
            padding:10px 12px;
            border:1px solid rgba(15,23,42,0.08);
            background:rgba(255,255,255,0.9);
            box-shadow:0 10px 24px rgba(15,23,42,0.06);
            font-weight:400;
          }

          .ca-err{
            color:#b91c1c;
            background:#fff1f2;
            border-color:#fecdd3;
          }

          .ca-ok{
            color:#065f46;
            background:#ecfdf5;
            border-color:#a7f3d0;
          }

          .ca-grid{
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:12px;
          }

          @media (max-width:820px){
            .ca-grid{
              grid-template-columns:1fr;
            }
          }

          .ca-field{
            display:flex;
            flex-direction:column;
            gap:6px;
          }

          .ca-label{
            font-size:12px;
            font-weight:400;
            text-transform:uppercase;
            letter-spacing:.05em;
            opacity:.85;
          }

          .ca-input{
            border:1px solid rgba(15,23,42,0.12);
            background:#fff;
            border-radius:14px;
            padding:10px 12px;
            font-weight:400;
            color:#0b0f1a;
            outline:none;
          }

          .ca-input:disabled{
            background:#f8fafc;
            color:#475569;
          }

          .ca-divider{
            height:1px;
            background:rgba(15,23,42,0.08);
            margin:10px 0;
          }

          .ca-sectionTitle{
            font-weight:400;
            margin:2px 0 10px;
          }

          .ca-actions{
            display:flex;
            gap:10px;
            justify-content:flex-end;
            flex-wrap:wrap;
          }

          .ca-btn{
            border-radius:14px;
            padding:10px 12px;
            border:1px solid rgba(15,23,42,0.12);
            background:rgba(255,255,255,0.95);
            box-shadow:0 10px 24px rgba(15,23,42,0.06);
            color:#0b0f1a;
            font-weight:400;
            cursor:pointer;
          }

          .ca-btnPrimary{
            background:rgba(59,130,246,0.12);
          }

          .ca-btn:disabled{
            opacity:.65;
            cursor:not-allowed;
          }
        `}</style>

        <div className="ca-wrap">
          {successMessage && (
            <div className="ca-alert ca-ok">{successMessage}</div>
          )}

          {errorMessage && (
            <div className="ca-alert ca-err">{errorMessage}</div>
          )}

          <div className="ca-card">
            <div className="ca-title">
              <div>
                <div className="ca-h1">Tạo tài khoản Staff</div>
                <div className="ca-sub">
                  Quản lý hệ thống Chess Tournament
                </div>
              </div>

              <button className="ca-btn" onClick={this.handleBack}>
                Quay lại
              </button>
            </div>

            <div className="ca-divider" />

            <div className="ca-sectionTitle">Thông tin cơ bản</div>

            <form onSubmit={this.handleSubmit}>
              <div className="ca-grid">
                <div className="ca-field">
                  <div className="ca-label">Username</div>
                  <input
                    type="text"
                    className="ca-input"
                    name="username"
                    value={username}
                    onChange={this.handleChange}
                    placeholder="Nhập username"
                  />
                </div>

                <div className="ca-field">
                  <div className="ca-label">Họ và tên</div>
                  <input
                    type="text"
                    className="ca-input"
                    name="fullName"
                    value={fullName}
                    onChange={this.handleChange}
                    placeholder="Ví dụ: Nguyễn Văn A"
                  />
                </div>

                <div className="ca-field">
                  <div className="ca-label">Email</div>
                  <input
                    type="email"
                    className="ca-input"
                    name="email"
                    value={email}
                    onChange={this.handleChange}
                    placeholder="Nhập email"
                  />
                </div>

                <div className="ca-field">
                  <div className="ca-label">Mật khẩu</div>
                  <input
                    type="password"
                    className="ca-input"
                    name="password"
                    value={password}
                    onChange={this.handleChange}
                    placeholder="Nhập mật khẩu"
                  />
                </div>

                <div className="ca-field">
                  <div className="ca-label">Ngày sinh</div>
                  <input
                    type="date"
                    className="ca-input"
                    name="dob"
                    value={dob}
                    onChange={this.handleChange}
                  />
                </div>

                <div className="ca-field">
                  <div className="ca-label">Số điện thoại</div>
                  <input
                    type="text"
                    className="ca-input"
                    name="phone"
                    value={phone}
                    onChange={this.handleChange}
                    placeholder="0xxxxxxxxx"
                  />
                </div>

                <div className="ca-field" style={{ gridColumn: "1 / -1" }}>
                  <div className="ca-label">Vai trò</div>
                  <input
                    type="text"
                    className="ca-input"
                    value="Staff"
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className="ca-divider" />

              <div className="ca-actions">
                <button
                  type="button"
                  className="ca-btn"
                  onClick={this.handleReload}
                  disabled={loading}
                >
                  Làm mới
                </button>

                <button
                  type="submit"
                  className="ca-btn ca-btnPrimary"
                  disabled={loading}
                >
                  {loading ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateAccount;