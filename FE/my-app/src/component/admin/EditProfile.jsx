import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "http://localhost:8080/ctms";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "tournament_leader", label: "Tournament Leader" },
  { value: "referee", label: "Referee" },
  { value: "player", label: "Player" },
];

function toISODateInput(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeRoleKeyFromServer(roleName) {
  const raw = String(roleName || "").trim().toLowerCase();
  if (raw === "staff") return "staff";
  if (raw === "referee") return "referee";
  if (raw === "player") return "player";
  if (raw === "tournamentleader") return "tournament_leader";
  return "player";
}

export default function EditProfile({ userId: userIdProp, onBack }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const userId = useMemo(() => {
    const fromProp = Number(userIdProp);
    if (!Number.isNaN(fromProp) && fromProp > 0) return fromProp;

    const fromParams = Number(id);
    if (!Number.isNaN(fromParams) && fromParams > 0) return fromParams;

    return NaN;
  }, [userIdProp, id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("player");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const nameSplit = useMemo(() => {
    const s = (fullName || "").trim().replace(/\s+/g, " ");
    if (!s) return { firstName: "", lastName: "" };
    const parts = s.split(" ");
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return {
      firstName: parts.slice(0, -1).join(" "),
      lastName: parts[parts.length - 1],
    };
  }, [fullName]);

  const loadUser = async () => {
    setLoading(true);
    setErr("");
    setOkMsg("");

    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, { method: "GET" });

      const data = res?.data || {};
      const u = data.user || {};
      const roleName = data.role;

      setUsername(u.username ?? "");
      const fn = (u.firstName ?? "").trim();
      const ln = (u.lastName ?? "").trim();
      setFullName(`${fn} ${ln}`.trim());

      setBirthday(toISODateInput(u.birthday));
      setAddress(u.address ?? "");
      setPhoneNumber(u.phoneNumber ?? "");

      setRole(normalizeRoleKeyFromServer(roleName));
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) {
      setErr("userId không hợp lệ.");
      setLoading(false);
      return;
    }
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onSave = async () => {
    setSaving(true);
    setErr("");
    setOkMsg("");

    try {
      const cp = currentPassword.trim();
      const np = newPassword.trim();
      const cnp = confirmNewPassword.trim();

      const wantsChangePass = !!(cp || np || cnp);

      // ✅ Validate chỉ khi user thật sự muốn đổi pass
      if (wantsChangePass) {
        // Admin đổi cho user khác: backend sẽ cho phép bỏ currentPassword
        // Nhưng FE vẫn nên check basic: new + confirm
        if (!np) throw new Error("Vui lòng nhập mật khẩu mới.");
        if (!cnp) throw new Error("Vui lòng xác nhận mật khẩu mới.");
        if (np !== cnp) throw new Error("Mật khẩu mới và xác nhận không khớp.");
        if (np.length < 6) throw new Error("Mật khẩu mới tối thiểu 6 ký tự.");
      }

      // ✅ Gửi x-www-form-urlencoded để tránh preflight
      const form = new URLSearchParams();
      form.set("userId", String(userId));
      form.set("username", username.trim());
      form.set("firstName", nameSplit.firstName.trim());
      form.set("lastName", nameSplit.lastName.trim());
      form.set("birthday", birthday ? birthday : ""); // yyyy-MM-dd
      form.set("address", address.trim());
      form.set("phoneNumber", phoneNumber.trim());
      form.set("role", role);

      // ✅ CHỈ gửi password fields khi muốn đổi
      if (wantsChangePass) {
        form.set("currentPassword", cp); // có thể rỗng nếu admin đổi cho user khác
        form.set("newPassword", np);
        form.set("confirmNewPassword", cnp);
      }

      const out = await apiFetch(`/api/admin/user-update/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });

      if (out?.success !== true) {
        throw new Error(out?.message || "Cập nhật thất bại.");
      }

      setOkMsg("Cập nhật thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      await loadUser();
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (typeof onBack === "function") return onBack();
    navigate(-1);
  };

  return (
    <div className="ep-page">
      <style>{`
        .ep-page{
          min-height: 100%;
          padding: 16px;
          background: radial-gradient(1200px 500px at 10% 0%, rgba(59,130,246,0.12), transparent 60%),
                      radial-gradient(1200px 500px at 90% 0%, rgba(249,115,22,0.10), transparent 55%),
                      linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          color:#0b0f1a;
        }
        .ep-wrap{ max-width: 900px; margin:0 auto; display:flex; flex-direction:column; gap:14px; }
        .ep-card{ border-radius:16px; background:rgba(255,255,255,0.92); border:1px solid rgba(15,23,42,0.08);
          box-shadow:0 14px 34px rgba(15,23,42,0.06); padding:14px; }
        .ep-title{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .ep-h1{ font-size:18px; font-weight:950; }
        .ep-sub{ opacity:.75; font-weight:750; margin-top:4px; }
        .ep-alert{ border-radius:12px; padding:10px 12px; border:1px solid rgba(15,23,42,0.08);
          background:rgba(255,255,255,0.9); box-shadow:0 10px 24px rgba(15,23,42,0.06); font-weight:800; }
        .ep-err{ color:#b91c1c; background:#fff1f2; border-color:#fecdd3; }
        .ep-ok{ color:#065f46; background:#ecfdf5; border-color:#a7f3d0; }
        .ep-warn{ color:#92400e; background:#fffbeb; border-color:#fcd34d; }
        .ep-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media (max-width:820px){ .ep-grid{ grid-template-columns:1fr; } }
        .ep-field{ display:flex; flex-direction:column; gap:6px; }
        .ep-label{ font-size:12px; font-weight:950; text-transform:uppercase; letter-spacing:.05em; opacity:.85; }
        .ep-input,.ep-select{ border:1px solid rgba(15,23,42,0.12); background:#fff; border-radius:14px; padding:10px 12px;
          font-weight:800; color:#0b0f1a; outline:none; }
        .ep-actions{ display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; }
        .ep-btn{ border-radius:14px; padding:10px 12px; border:1px solid rgba(15,23,42,0.12); background:rgba(255,255,255,0.95);
          box-shadow:0 10px 24px rgba(15,23,42,0.06); color:#0b0f1a; font-weight:950; cursor:pointer; }
        .ep-btnPrimary{ background: rgba(59,130,246,0.12); }
        .ep-btn:disabled{ opacity:.65; cursor:not-allowed; }
        .ep-sectionTitle{ font-weight:950; margin:2px 0 10px; }
        .ep-divider{ height:1px; background:rgba(15,23,42,0.08); margin:10px 0; }
      `}</style>

      <div className="ep-wrap">
        {loading && <div className="ep-alert ep-warn">Đang tải dữ liệu...</div>}
        {err && <div className="ep-alert ep-err">Lỗi: {err}</div>}
        {okMsg && <div className="ep-alert ep-ok">{okMsg}</div>}

        <div className="ep-card">
          <div className="ep-title">
            <div>
              <div className="ep-h1">Sửa hồ sơ người dùng</div>
              <div className="ep-sub">UserId: {String(userId)}</div>
            </div>

            <button className="ep-btn" onClick={handleBack}>Quay lại</button>
          </div>

          <div className="ep-divider" />

          <div className="ep-sectionTitle">Thông tin cơ bản</div>

          <div className="ep-grid">
            <div className="ep-field">
              <div className="ep-label">Username</div>
              <input className="ep-input" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div className="ep-field">
              <div className="ep-label">Họ và tên</div>
              <input
                className="ep-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </div>

            <div className="ep-field">
              <div className="ep-label">Ngày sinh</div>
              <input type="date" className="ep-input" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
            </div>

            <div className="ep-field">
              <div className="ep-label">Số điện thoại</div>
              <input className="ep-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>

            <div className="ep-field" style={{ gridColumn: "1 / -1" }}>
              <div className="ep-label">Địa chỉ</div>
              <input className="ep-input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="ep-field">
              <div className="ep-label">Vai trò</div>
              <select className="ep-select" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ep-divider" />

          <div className="ep-sectionTitle">Đổi mật khẩu (tuỳ chọn)</div>

          <div className="ep-grid">
            <div className="ep-field">
              <div className="ep-label">Mật khẩu hiện tại</div>
              <input type="password" className="ep-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>

            <div className="ep-field">
              <div className="ep-label">Mật khẩu mới</div>
              <input type="password" className="ep-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>

            <div className="ep-field">
              <div className="ep-label">Xác nhận mật khẩu mới</div>
              <input type="password" className="ep-input" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
            </div>
          </div>

          <div className="ep-divider" />

          <div className="ep-actions">
            <button className="ep-btn" onClick={() => loadUser()} disabled={saving || loading}>Tải lại</button>
            <button className="ep-btn ep-btnPrimary" onClick={onSave} disabled={saving || loading}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
