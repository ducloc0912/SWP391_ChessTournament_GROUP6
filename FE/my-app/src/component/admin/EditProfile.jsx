import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const raw = String(roleName || "")
    .trim()
    .toLowerCase();
  if (raw === "staff") return "staff";
  if (raw === "referee") return "referee";
  if (raw === "player") return "player";
  if (raw === "tournamentleader") return "tournament_leader";
  return "player";
}

// ===== Validation helpers =====
function isBlankOrSpaces(s) {
  return !String(s ?? "").trim();
}

function isValidPhoneVN(s) {
  // 10 digits, starts with 0
  return /^0\d{9}$/.test(String(s ?? "").trim());
}

function isNameValid(s) {
  // not empty, no digits
  const v = String(s ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!v) return false;
  return !/\d/.test(v);
}

function isAllowedImageType(file) {
  const t = String(file?.type || "").toLowerCase();
  return t === "image/jpeg" || t === "image/png";
}

function sniffImageSignature(file) {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  // JPG: FF D8 FF
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(false);
    reader.onload = () => {
      try {
        const buf = new Uint8Array(reader.result);
        const isPng =
          buf.length >= 8 &&
          buf[0] === 0x89 &&
          buf[1] === 0x50 &&
          buf[2] === 0x4e &&
          buf[3] === 0x47 &&
          buf[4] === 0x0d &&
          buf[5] === 0x0a &&
          buf[6] === 0x1a &&
          buf[7] === 0x0a;

        const isJpg =
          buf.length >= 3 &&
          buf[0] === 0xff &&
          buf[1] === 0xd8 &&
          buf[2] === 0xff;

        resolve(isPng || isJpg);
      } catch {
        resolve(false);
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 16));
  });
}

function verifyImageDecode(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
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

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(""); // current avatar (from server)
  const [avatarFile, setAvatarFile] = useState(null); // new file
  const [avatarPreview, setAvatarPreview] = useState(""); // preview URL
  const fileInputRef = useRef(null);

  useEffect(() => {
    // cleanup preview url
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

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
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: "GET",
      });

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

      setAvatarUrl(u.avatar ?? "");

      // reset chosen file
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  const validateBeforeUpdate = () => {
    if (!isNameValid(fullName)) {
      throw new Error("Họ và tên không được để trống và không được chứa số.");
    }
    if (isBlankOrSpaces(address)) {
      throw new Error(
        "Địa chỉ không được để trống (không chỉ là khoảng trắng).",
      );
    }
    if (!isValidPhoneVN(phoneNumber)) {
      throw new Error(
        "Số điện thoại phải đúng 10 chữ số và bắt đầu bằng số 0.",
      );
    }
    if (isBlankOrSpaces(username)) {
      throw new Error("Username không được để trống.");
    }
  };

  const validateAvatarFile = async (file) => {
    if (!file) return;

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) throw new Error("Ảnh đại diện tối đa 10MB.");

    if (!isAllowedImageType(file))
      throw new Error("Chỉ chấp nhận ảnh JPG hoặc PNG.");

    const sigOk = await sniffImageSignature(file);
    if (!sigOk)
      throw new Error("File không đúng định dạng ảnh (JPG/PNG) hoặc bị lỗi.");

    const decOk = await verifyImageDecode(file);
    if (!decOk) throw new Error("Không thể đọc ảnh. File có thể bị hỏng.");
  };

  const onPickAvatar = async (e) => {
    setErr("");
    setOkMsg("");

    const file = e.target.files?.[0] || null;
    if (!file) {
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview("");
      return;
    }

    try {
      await validateAvatarFile(file);
      setAvatarFile(file);

      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(URL.createObjectURL(file));
    } catch (ex) {
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setErr(ex?.message || String(ex));
    }
  };

  const removePickedAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSave = async () => {
    setSaving(true);
    setErr("");
    setOkMsg("");

    try {
      validateBeforeUpdate();

      if (avatarFile) await validateAvatarFile(avatarFile);

      let out;

      if (avatarFile) {
        const fd = new FormData();
        fd.set("userId", String(userId));
        fd.set("username", username.trim());
        fd.set("firstName", nameSplit.firstName.trim());
        fd.set("lastName", nameSplit.lastName.trim());
        fd.set("birthday", birthday ? birthday : "");
        fd.set("address", address.trim());
        fd.set("phoneNumber", phoneNumber.trim());
        fd.set("role", role);
        fd.set("avatar", avatarFile); // must match servlet req.getPart("avatar")

        out = await apiFetch(`/api/admin/user-update/${userId}`, {
          method: "POST",
          body: fd,
        });
      } else {
        const form = new URLSearchParams();
        form.set("userId", String(userId));
        form.set("username", username.trim());
        form.set("firstName", nameSplit.firstName.trim());
        form.set("lastName", nameSplit.lastName.trim());
        form.set("birthday", birthday ? birthday : "");
        form.set("address", address.trim());
        form.set("phoneNumber", phoneNumber.trim());
        form.set("role", role);

        out = await apiFetch(`/api/admin/user-update/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
      }

      if (out?.success !== true)
        throw new Error(out?.message || "Cập nhật thất bại.");

      setOkMsg("Cập nhật thành công!");
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

  const showAvatarSrc = avatarPreview || avatarUrl;

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
        .ep-btnDanger{ background: rgba(239,68,68,0.10); }
        .ep-btn:disabled{ opacity:.65; cursor:not-allowed; }
        .ep-sectionTitle{ font-weight:950; margin:2px 0 10px; }
        .ep-divider{ height:1px; background:rgba(15,23,42,0.08); margin:10px 0; }


        .ep-avatarRow{ display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
        .ep-avatar{
          width:72px; height:72px; border-radius:18px; overflow:hidden;
          border:1px solid rgba(15,23,42,0.12);
          background:rgba(15,23,42,0.03);
          display:flex; align-items:center; justify-content:center;
        }
        .ep-avatar img{ width:100%; height:100%; object-fit:cover; display:block; }
        .ep-avatarPlaceholder{ font-weight:950; opacity:.6; font-size:12px; padding:8px; text-align:center; }
        .ep-hint{ font-size:12px; opacity:.75; font-weight:750; }
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

            <button className="ep-btn" onClick={handleBack}>
              Quay lại
            </button>
          </div>

          <div className="ep-divider" />

          <div className="ep-sectionTitle">Ảnh đại diện</div>
          <div className="ep-avatarRow">
            <div className="ep-avatar">
              {showAvatarSrc ? (
                <img src={showAvatarSrc} alt="avatar" />
              ) : (
                <div className="ep-avatarPlaceholder">No Avatar</div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 280,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={onPickAvatar}
                className="ep-input"
              />
              <div className="ep-hint">
                Chỉ JPG/PNG • Tối đa 10MB • Hệ thống sẽ kiểm tra “đúng là ảnh”
                (magic bytes + decode).
              </div>

              {avatarFile && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    className="ep-btn ep-btnDanger"
                    onClick={removePickedAvatar}
                    disabled={saving || loading}
                  >
                    Bỏ ảnh đã chọn
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="ep-divider" />

          <div className="ep-sectionTitle">Thông tin cơ bản</div>

          <div className="ep-grid">
            <div className="ep-field">
              <div className="ep-label">Username</div>
              <input
                className="ep-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
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
              <input
                type="date"
                className="ep-input"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>

            <div className="ep-field">
              <div className="ep-label">Số điện thoại</div>
              <input
                className="ep-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0xxxxxxxxx"
              />
            </div>

            <div className="ep-field" style={{ gridColumn: "1 / -1" }}>
              <div className="ep-label">Địa chỉ</div>
              <input
                className="ep-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="ep-field">
              <div className="ep-label">Vai trò</div>
              <select
                className="ep-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ep-divider" />

          <div className="ep-actions">
            <button
              className="ep-btn"
              onClick={() => loadUser()}
              disabled={saving || loading}
            >
              Tải lại
            </button>

            <button
              className="ep-btn ep-btnPrimary"
              onClick={onSave}
              disabled={saving || loading}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
