import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Cropper from "react-easy-crop";
import {
  Mail,
  Calendar,
  MapPin,
  Trophy,
  User,
  Filter,
  Search,
  Star,
  Lock,
} from "lucide-react";
import MainHeader from "../../component/common/MainHeader";

import { API_BASE } from "../../config/api";
const API_PROFILE_ME = `${API_BASE}/api/profile/me`;
const API_PROFILE_AVATAR = `${API_BASE}/api/profile/me/avatar`;
const API_CHANGE_PASSWORD = `${API_BASE}/api/change-password`;

function formatDate(v) {
  if (!v) return "N/A";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.toLocaleDateString("vi-VN");
}
function toInputDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatNumber(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "N/A";
  return new Intl.NumberFormat("vi-VN").format(v);
}
function getAgeFromBirthday(birthday) {
  if (!birthday) return null;
  const d = new Date(birthday);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
}
function genderLabel(g) {
  if (!g) return "—";
  const s = String(g).toLowerCase();
  if (s === "male" || s === "nam" || s === "m") return "Nam";
  if (s === "female" || s === "nữ" || s === "nu" || s === "f") return "Nữ";
  return g;
}
function statusLabel(s) {
  if (!s) return "N/A";
  const map = {
    Pending: "Pending",
    Rejected: "Rejected",
    Delayed: "Delayed",
    Ongoing: "Ongoing",
    Completed: "Completed",
    Cancelled: "Cancelled",
  };
  return map[s] || s;
}
function statusLabelVi(s) {
  if (!s) return "N/A";
  const map = {
    Pending: "SẮP DIỄN RA",
    Rejected: "TỪ CHỐI",
    Delayed: "HOÃN",
    Ongoing: "ĐANG DIỄN RA",
    Completed: "KẾT THÚC",
    Cancelled: "HỦY",
  };
  return map[s] || s;
}
function roleLabel(role) {
  const map = {
    Player: "Player",
    Referee: "Referee",
    TournamentLeader: "Tournament Leader",
    Staff: "Staff",
    Admin: "Admin",
  };
  return map[role] || role || "Unknown";
}

function Pill({ children, variant = "neutral" }) {
  return <span className={`up-pill up-pill--${variant}`}>{children}</span>;
}

function StatCard({ label, value, hint }) {
  return (
    <div className="up-stat">
      <div className="up-stat__label">{label}</div>
      <div className="up-stat__value">{value}</div>
      {hint ? <div className="up-stat__hint">{hint}</div> : null}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="up-infoItem">
      <div className="up-infoItem__label">{label}</div>
      <div className="up-infoItem__value">{value}</div>
    </div>
  );
}

function EmptyState({ title, desc }) {
  return (
    <div className="up-empty">
      <div className="up-empty__title">{title}</div>
      <div className="up-empty__desc">{desc}</div>
    </div>
  );
}

function getStatusVariant(s) {
  switch (s) {
    case "Ongoing":
      return "info";
    case "Completed":
      return "success";
    case "Pending":
      return "warning";
    case "Rejected":
    case "Cancelled":
      return "danger";
    case "Delayed":
      return "neutral";
    default:
      return "neutral";
  }
}

/** ===== Helpers: crop image to blob (no external util) ===== */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedBlob(imageSrc, cropPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Crop failed"));
        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

/** ===== Modal: Edit Profile (remove Avatar URL, add Username) ===== */
function EditProfileModal({
  open,
  onClose,
  initialValues,
  onSubmit,
  saving,
  error,
}) {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      username: initialValues?.username || "",
      firstName: initialValues?.firstName || "",
      lastName: initialValues?.lastName || "",
      phoneNumber: initialValues?.phoneNumber || "",
      address: initialValues?.address || "",
    });
  }, [open, initialValues]);

  if (!open) return null;

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="up-modalOverlay" onMouseDown={onClose}>
      <div
        className="up-modal up-modal--edit"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="up-modal__head up-modal__head--purple">
          <div className="up-modal__title">Edit profile</div>
          <button
            className="up-iconBtn"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form className="up-modal__body" onSubmit={handleSubmit}>
          {error ? (
            <div className="up-alert up-alert--danger">{error}</div>
          ) : null}

          <div className="up-formGrid">
            <div className="up-field up-field--full">
              <div className="up-field__label">Username</div>
              <input
                className="up-input"
                value={form.username}
                onChange={set("username")}
                placeholder="Chữ cái, số, gạch dưới; 3–50 ký tự"
                maxLength={50}
              />
              <div className="up-field__hint">
                Username phải là duy nhất, không dấu và ký tự đặc biệt.
              </div>
            </div>

            <div className="up-field">
              <div className="up-field__label">First name</div>
              <input
                className="up-input"
                value={form.firstName}
                onChange={set("firstName")}
                placeholder="Bắt buộc"
                maxLength={50}
              />
            </div>

            <div className="up-field">
              <div className="up-field__label">Last name</div>
              <input
                className="up-input"
                value={form.lastName}
                onChange={set("lastName")}
                placeholder="Bắt buộc"
                maxLength={50}
              />
            </div>

            <div className="up-field">
              <div className="up-field__label">Phone</div>
              <input
                className="up-input"
                type="tel"
                value={form.phoneNumber}
                onChange={set("phoneNumber")}
                placeholder="VD: 0901234567 (10 số)"
                maxLength={20}
              />
            </div>

            <div className="up-field up-field--full">
              <div className="up-field__label">Address</div>
              <input
                className="up-input"
                value={form.address}
                onChange={set("address")}
                placeholder="Tối đa 255 ký tự"
                maxLength={255}
              />
            </div>
          </div>

          <div className="up-modal__foot">
            <button
              className="up-btn up-btn--ghost"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="up-btn up-btn--primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** ===== Modal: Đổi mật khẩu (old, new, confirm) ===== */
function ChangePasswordModal({
  open,
  onClose,
  onSubmit,
  saving,
  error,
  success,
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!open) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = [];
    if (!oldPassword.trim()) err.push("Vui lòng nhập mật khẩu hiện tại.");
    if (!newPassword.trim()) err.push("Vui lòng nhập mật khẩu mới.");
    else if (newPassword.length < 6)
      err.push("Mật khẩu mới phải có ít nhất 6 ký tự.");
    if (newPassword !== confirmPassword)
      err.push("Mật khẩu xác nhận không khớp.");
    if (err.length) return;
    onSubmit({
      oldPassword: oldPassword.trim(),
      newPassword: newPassword.trim(),
      confirmPassword: confirmPassword.trim(),
    });
  };

  return (
    <div className="up-modalOverlay" onMouseDown={onClose}>
      <div
        className="up-modal up-modal--edit"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="up-modal__head up-modal__head--purple">
          <div className="up-modal__title">Đổi mật khẩu</div>
          <button
            className="up-iconBtn"
            type="button"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <form className="up-modal__body" onSubmit={handleSubmit}>
          {error ? (
            <div className="up-alert up-alert--danger">{error}</div>
          ) : null}
          {success ? (
            <div className="up-alert up-alert--success">{success}</div>
          ) : null}
          <div className="up-formGrid">
            <div className="up-field up-field--full">
              <div className="up-field__label">Mật khẩu hiện tại</div>
              <input
                className="up-input"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
              />
            </div>
            <div className="up-field up-field--full">
              <div className="up-field__label">Mật khẩu mới</div>
              <input
                className="up-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <div className="up-field up-field--full">
              <div className="up-field__label">Xác nhận mật khẩu mới</div>
              <input
                className="up-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="up-modal__foot">
            <button
              className="up-btn up-btn--ghost"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              className="up-btn up-btn--primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** ===== Modal: Avatar crop + zoom (Facebook-style) ===== */
function AvatarCropModal({ open, src, onClose, onSave, saving, error }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [open, src]);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  if (!open) return null;

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    await onSave(croppedAreaPixels);
  };

  return (
    <div className="up-modalOverlay" onMouseDown={onClose}>
      <div
        className="up-modal up-modal--crop"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="up-modal__head">
          <div className="up-modal__title">Update avatar</div>
          <button
            className="up-iconBtn"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="up-modal__body">
          {error ? <div className="up-alert">{error}</div> : null}

          <div className="up-cropWrap">
            <div className="up-cropArea">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="up-cropControls">
              <div className="up-cropLabel">Zoom</div>
              <input
                className="up-range"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <div className="up-cropHint">
                Kéo ảnh để canh vị trí. Dùng thanh kéo để phóng to/thu nhỏ.
              </div>
            </div>
          </div>

          <div className="up-modal__foot">
            <button
              className="up-btn up-btn--ghost"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="up-btn up-btn--primary"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Uploading..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const navigate = useNavigate();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [tab, setTab] = useState("tournaments");

  // search & filter for tournaments
  const [searchTournament, setSearchTournament] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editErr, setEditErr] = useState("");

  // avatar state
  const fileRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarErr, setAvatarErr] = useState("");

  // modals: Xem tất cả giải đấu (list) + chi tiết 1 giải
  const [showAllTournamentsModal, setShowAllTournamentsModal] = useState(false);
  const [selectedTournamentForDetail, setSelectedTournamentForDetail] =
    useState(null);

  // change password modal
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [changePwdSaving, setChangePwdSaving] = useState(false);
  const [changePwdErr, setChangePwdErr] = useState("");
  const [changePwdSuccess, setChangePwdSuccess] = useState("");

  const fetchProfile = () => {
    setLoading(true);
    setErrMsg("");
    setUnauthorized(false);

    return axios
      .get(API_PROFILE_ME, { withCredentials: true })
      .then((res) => {
        if (res.data?.success) {
          const payload = res.data?.data ?? res.data;
          setRaw({
            role: payload.role,
            user: payload.user ?? {},
            stats: payload.stats ?? {},
            tournaments: payload.tournaments ?? [],
          });
        } else {
          setErrMsg(res.data?.message || "Không lấy được profile.");
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          setUnauthorized(true);
          setErrMsg("Vui lòng đăng nhập để xem trang này.");
        } else {
          setErrMsg(
            err?.response?.data?.message ||
              err?.message ||
              "Không thể kết nối server.",
          );
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrMsg("");
    setUnauthorized(false);

    axios
      .get(API_PROFILE_ME, { withCredentials: true })
      .then((res) => {
        if (!mounted) return;
        if (res.data?.success) {
          const payload = res.data?.data ?? res.data;
          setRaw({
            role: payload.role,
            user: payload.user ?? {},
            stats: payload.stats ?? {},
            tournaments: payload.tournaments ?? [],
          });
        } else {
          setErrMsg(res.data?.message || "Không lấy được profile.");
        }
      })
      .catch((err) => {
        if (!mounted) return;
        if (err?.response?.status === 401) {
          setUnauthorized(true);
          setErrMsg("Vui lòng đăng nhập để xem trang này.");
        } else {
          setErrMsg(
            err?.response?.data?.message ||
              err?.message ||
              "Không thể kết nối server.",
          );
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const role = raw?.role || "Player";
  const user = raw?.user || {};
  const stats = raw?.stats || {};
  const tournaments = raw?.tournaments || [];

  const filteredTournaments = useMemo(() => {
    let list = tournaments;
    const q = (searchTournament || "").trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        (t.tournamentName || "").toLowerCase().includes(q),
      );
    }
    if (filterStatus !== "all") {
      list = list.filter((t) => (t.tournamentStatus || "") === filterStatus);
    }
    return list;
  }, [tournaments, searchTournament, filterStatus]);

  const isPlayer = role === "Player";
  const isLeader = role === "TournamentLeader";
  const isReferee = role === "Referee";
  const isStaff = role === "Staff";
  const isAdmin = role === "Admin";

  const pageTitle = useMemo(() => {
    if (isPlayer) return "User Profile";
    if (isLeader) return "Leader Profile";
    if (isReferee) return "Referee Profile";
    if (isStaff) return "Staff Profile";
    if (isAdmin) return "Admin Profile";
    return "Profile";
  }, [isPlayer, isLeader, isReferee, isStaff, isAdmin]);

  const fullName =
    [user?.firstName ?? user?.first_name, user?.lastName ?? user?.last_name]
      .filter(Boolean)
      .join(" ") ||
    user?.username ||
    "Unknown";
  const name = user?.username || "Unknown";
  const apiOrigin = (API_BASE.match(/^https?:\/\/[^/]+/) || [API_BASE])[0];
  const avatar =
    (user?.avatar && user.avatar.startsWith("/")
      ? apiOrigin + user.avatar
      : user?.avatar) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EEF2FF&color=111827`;
  const userDisplayId = user?.userId
    ? `US-${String(user.userId).padStart(5, "0")}-X`
    : "—";
  const championCount = stats?.championCount ?? 0;
  const averageRating =
    stats?.averageRating != null ? Number(stats.averageRating) : null;
  const age = getAgeFromBirthday(user?.birthday);
  const rankingProgressData = useMemo(() => {
    if (!isPlayer || !tournaments.length) return [];
    const withRank = tournaments
      .filter((t) => t.ranking != null && t.startDate)
      .map((t) => ({ ...t, sortKey: new Date(t.startDate).getTime() }))
      .sort((a, b) => b.sortKey - a.sortKey)
      .slice(0, 6);
    return withRank.reverse();
  }, [isPlayer, tournaments]);
  const renderStars = (rating) => {
    if (rating == null || Number.isNaN(rating)) return "—";
    const r = Math.min(5, Math.max(0, rating));
    const full = Math.floor(r);
    const half = r - full >= 0.5 ? 1 : 0;
    return (
      <span className="up-ref-stars">
        {Array.from({ length: full }).map((_, i) => (
          <Star
            key={`f-${i}`}
            size={16}
            fill="currentColor"
            className="up-ref-star up-ref-star--full"
          />
        ))}
        {half ? (
          <Star
            key="h"
            size={16}
            fill="currentColor"
            className="up-ref-star up-ref-star--half"
          />
        ) : null}
        {Array.from({ length: 5 - full - half }).map((_, i) => (
          <Star
            key={`e-${i}`}
            size={16}
            className="up-ref-star up-ref-star--empty"
          />
        ))}
        <span className="up-ref-star-num">({r.toFixed(1)})</span>
      </span>
    );
  };

  const openEdit = () => {
    setEditErr("");
    setEditOpen(true);
  };

  const openChangePassword = () => {
    setChangePwdErr("");
    setChangePwdSuccess("");
    setChangePwdOpen(true);
  };

  const handleChangePassword = async (form) => {
    setChangePwdSaving(true);
    setChangePwdErr("");
    setChangePwdSuccess("");
    try {
      const res = await axios.post(
        API_CHANGE_PASSWORD,
        {
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      if (res.data?.success) {
        setChangePwdSuccess(res.data?.message || "Đổi mật khẩu thành công.");
        setTimeout(() => {
          setChangePwdOpen(false);
          setChangePwdSuccess("");
        }, 1500);
      } else {
        setChangePwdErr(res.data?.message || "Đổi mật khẩu thất bại.");
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Không thể kết nối server.";
      setChangePwdErr(msg);
    } finally {
      setChangePwdSaving(false);
    }
  };

  const handleSave = async (form) => {
    setSaving(true);
    setEditErr("");

    const payload = {
      username: form.username?.trim() || null,
      firstName: form.firstName?.trim() || null,
      lastName: form.lastName?.trim() || null,
      phoneNumber: form.phoneNumber?.trim() || null,
      address: form.address?.trim() || null,
      // birthday: không cho đổi trong edit profile
      // avatar: bỏ (đổi avatar qua upload)
    };

    try {
      const res = await axios.put(API_PROFILE_ME, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (!res.data?.success) {
        setEditErr(res.data?.message || "Update failed");
        return;
      }

      const payloadRes = res.data?.data ?? res.data;
      setRaw({
        role: payloadRes.role,
        user: payloadRes.user ?? {},
        stats: payloadRes.stats ?? {},
        tournaments: payloadRes.tournaments ?? [],
      });

      setEditOpen(false);
    } catch (e) {
      setEditErr(
        e?.response?.data?.message || e?.message || "Không thể kết nối server.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openFilePicker = () => {
    setAvatarErr("");
    if (fileRef.current) fileRef.current.click();
  };

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setAvatarErr("Chỉ hỗ trợ file ảnh.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(String(reader.result));
      setCropOpen(true);
    };
    reader.readAsDataURL(file);

    // reset input to allow choosing the same file again
    e.target.value = "";
  };

  const saveCroppedAvatar = async (croppedAreaPixels) => {
    setAvatarSaving(true);
    setAvatarErr("");

    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");

      const res = await axios.post(API_PROFILE_AVATAR, formData, {
        withCredentials: true,
        headers: { Accept: "application/json" },
      });

      if (!res.data?.success) {
        setAvatarErr(res.data?.message || "Upload failed");
        return;
      }

      const payloadRes = res.data?.data ?? res.data;
      setRaw({
        role: payloadRes.role,
        user: payloadRes.user ?? {},
        stats: payloadRes.stats ?? {},
        tournaments: payloadRes.tournaments ?? [],
      });

      setCropOpen(false);
    } catch (e) {
      setAvatarErr(
        e?.response?.data?.message || e?.message || "Không thể kết nối server.",
      );
    } finally {
      setAvatarSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="up-page">
        <div className="up-bg-orb up-bg-orb-1" />
        <div className="up-bg-orb up-bg-orb-2" />
        <div className="up-wrap">
          <div className="up-skeletonHeader" />
          <div className="up-grid up-grid--ref">
            <div className="up-skeletonCard" />
            <div className="up-skeletonCard" />
          </div>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="up-page">
        <div className="up-wrap up-unauthorized">
          <div className="up-unauthorized__card">
            <p className="up-unauthorized__msg">{errMsg}</p>
            <Link to="/login" className="up-btn up-btn--primary">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initialEditValues = {
    username: user.username ?? "",
    firstName: user.firstName ?? user.first_name ?? "",
    lastName: user.lastName ?? user.last_name ?? "",
    phoneNumber: user.phoneNumber ?? user.phone_number ?? "",
    address: user.address ?? "",
  };

  const headerUser = raw?.user
    ? {
        firstName: user.firstName ?? user.first_name ?? "",
        lastName: user.lastName ?? user.last_name ?? "",
        avatar:
          (user?.avatar && user.avatar.startsWith("/")
            ? (API_BASE.match(/^https?:\/\/[^/]+/) || [API_BASE])[0] +
              user.avatar
            : user?.avatar) || null,
      }
    : null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const location = useLocation();

  return (
    <div className="up-page up-page--ref up-page--with-header">
      <MainHeader
        user={headerUser}
        onLogout={handleLogout}
        currentPath={location.pathname}
      />
      <div className="up-bg-orb up-bg-orb-1" />
      <div className="up-bg-orb up-bg-orb-2" />

      <div className="up-wrap up-wrap--ref">
        {errMsg && !unauthorized ? (
          <div className="up-alert">{errMsg}</div>
        ) : null}

        <div className="up-layout-ref">
          {/* Left: Profile card (purple header + details + stats + chart) */}
          <div className="up-ref-left">
            <div className="up-ref-profile-card">
              <div className="up-ref-profile-header">
                <div className="up-ref-avatar-wrap">
                  <button
                    type="button"
                    className="up-ref-avatar-btn"
                    onClick={openFilePicker}
                    aria-label="Đổi ảnh đại diện"
                  >
                    <img
                      className="up-ref-avatar"
                      src={avatar}
                      alt={fullName}
                    />
                    <span className="up-ref-avatar-overlay">
                      <span className="up-ref-avatar-overlay-icon">📷</span>
                      <span className="up-ref-avatar-overlay-text">
                        Đổi ảnh đại diện
                      </span>
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    className="up-file up-file--hidden"
                    type="file"
                    accept="image/*"
                    onChange={onPickFile}
                  />
                  <span className="up-ref-badge up-ref-badge--pro">
                    PRO MEMBER
                  </span>
                </div>
                <h1 className="up-ref-name">{fullName}</h1>
                <p className="up-ref-id">{userDisplayId}</p>
                {avatarErr ? (
                  <div className="up-miniError">{avatarErr}</div>
                ) : null}
              </div>
              <div className="up-ref-details">
                <div className="up-ref-detail-row">
                  <Mail size={18} className="up-ref-detail-icon" />
                  <span className="up-ref-detail-text">
                    {user.email || "—"}
                  </span>
                </div>
                <div className="up-ref-detail-row">
                  <Calendar size={18} className="up-ref-detail-icon" />
                  <span className="up-ref-detail-text">
                    Sinh nhật: {formatDate(user.birthday)}
                  </span>
                </div>
                <div className="up-ref-detail-row">
                  <span className="up-ref-detail-icon up-ref-detail-icon--text">
                    Tuổi
                  </span>
                  <span className="up-ref-detail-text">
                    {age != null ? `${age} tuổi` : "—"}
                  </span>
                </div>
                <div className="up-ref-detail-row">
                  <User size={18} className="up-ref-detail-icon" />
                  <span className="up-ref-detail-text">
                    {genderLabel(user?.gender)}
                  </span>
                </div>
                <div className="up-ref-detail-row">
                  <MapPin size={18} className="up-ref-detail-icon" />
                  <span className="up-ref-detail-text">
                    {user.address || "—"}
                  </span>
                </div>
              </div>
              <div className="up-ref-stats-row">
                {isPlayer && (
                  <>
                    <div className="up-ref-stat-card up-ref-stat-card--blue">
                      <div className="up-ref-stat-value">
                        {formatNumber(stats.totalTournaments ?? 0)}
                      </div>
                      <div className="up-ref-stat-label">THAM GIA</div>
                      <div className="up-ref-stat-hint">Sự kiện</div>
                    </div>
                    <div className="up-ref-stat-card up-ref-stat-card--orange">
                      <div className="up-ref-stat-value">
                        {stats.avgRanking == null
                          ? "—"
                          : `#${Number(stats.avgRanking).toFixed(1)}`}
                      </div>
                      <div className="up-ref-stat-label">XẾP HẠNG TB</div>
                      <div className="up-ref-stat-hint">Top player</div>
                    </div>
                  </>
                )}
                {isLeader && (
                  <>
                    <div className="up-ref-stat-card up-ref-stat-card--blue">
                      <div className="up-ref-stat-value">
                        {formatNumber(stats.totalTournaments ?? 0)}
                      </div>
                      <div className="up-ref-stat-label">GIẢI ĐÃ TẠO</div>
                      <div className="up-ref-stat-hint">Điều hành</div>
                    </div>
                    <div className="up-ref-stat-card up-ref-stat-card--orange">
                      <div className="up-ref-stat-value">
                        {formatNumber(stats.totalParticipants ?? 0)}
                      </div>
                      <div className="up-ref-stat-label">NGƯỜI THAM GIA</div>
                      <div className="up-ref-stat-hint">Tổng</div>
                    </div>
                  </>
                )}
                {isReferee && (
                  <>
                    <div className="up-ref-stat-card up-ref-stat-card--blue">
                      <div className="up-ref-stat-value">
                        {formatNumber(stats.assignedMatches ?? 0)}
                      </div>
                      <div className="up-ref-stat-label">TRẬN ĐÃ TRỌNG TÀI</div>
                      <div className="up-ref-stat-hint">Tổng</div>
                    </div>
                    <div className="up-ref-stat-card up-ref-stat-card--orange">
                      <div className="up-ref-stat-value up-ref-stat-value--stars">
                        {averageRating != null
                          ? renderStars(averageRating)
                          : "—"}
                      </div>
                      <div className="up-ref-stat-label">RATING</div>
                      <div className="up-ref-stat-hint">Từ feedback</div>
                    </div>
                  </>
                )}
                {(isStaff || isAdmin) && (
                  <div className="up-ref-stat-card up-ref-stat-card--blue">
                    <div className="up-ref-stat-value">
                      {formatNumber(stats.totalTournaments ?? stats.tasks ?? 0)}
                    </div>
                    <div className="up-ref-stat-label">
                      {isStaff ? "CÔNG VIỆC" : "QUẢN TRỊ"}
                    </div>
                  </div>
                )}
              </div>
              {isPlayer && (
                <div className="up-ref-chart-card">
                  <div className="up-ref-chart-title">
                    <span>Tiến trình thứ hạng</span>
                  </div>
                  <div className="up-ref-chart-bars">
                    {rankingProgressData.length > 0 ? (
                      rankingProgressData.map((t, i) => {
                        const rank = t.ranking ?? 0;
                        const maxRank = Math.max(
                          ...rankingProgressData.map((x) => x.ranking ?? 1),
                          1,
                        );
                        const heightPct =
                          rank > 0
                            ? Math.max(
                                15,
                                100 -
                                  ((rank - 1) / Math.max(maxRank - 1, 1)) * 70,
                              )
                            : 15;
                        return (
                          <div
                            key={`${t.tournamentId}-${i}`}
                            className="up-ref-chart-bar-wrap"
                            title={`${t.tournamentName}: Hạng ${rank}`}
                          >
                            <div
                              className="up-ref-chart-bar"
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="up-ref-chart-bar-label">
                              {rank}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="up-ref-chart-empty">
                        Chưa có dữ liệu thứ hạng
                      </div>
                    )}
                  </div>
                  <p className="up-ref-chart-hint">
                    DỮ LIỆU TỪ {rankingProgressData.length || 6} GIẢI GẦN NHẤT
                  </p>
                </div>
              )}
              {(isLeader || isReferee) && (
                <div className="up-ref-rating-card">
                  <div className="up-ref-rating-label">Rating (sao)</div>
                  <div className="up-ref-rating-stars">
                    {averageRating != null ? (
                      renderStars(averageRating)
                    ) : (
                      <span className="up-ref-rating-none">
                        Chưa có đánh giá
                      </span>
                    )}
                  </div>
                  <div className="up-ref-rating-hint">
                    {isLeader
                      ? "Từ feedback về giải bạn tạo"
                      : "Từ feedback trận bạn trọng tài"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Lịch sử thi đấu / giải đã tạo / giải đã tham gia (trọng tài) + filter + table + achievements */}
          <div className="up-ref-right">
            <div className="up-ref-history-card">
              <div className="up-ref-history-head">
                <div>
                  <h2 className="up-ref-history-title">
                    {isPlayer && "Lịch sử thi đấu"}
                    {isLeader && "Lịch sử giải đã tạo (điều hành)"}
                    {isReferee && "Giải đã tham gia (trọng tài)"}
                    {(isStaff || isAdmin) && "Giải đấu / Công việc"}
                  </h2>
                  <p className="up-ref-history-subtitle">
                    {isPlayer && "Danh sách các giải đấu đã tham gia"}
                    {isLeader &&
                      "Danh sách các giải đấu bạn đã tạo hoặc điều hành"}
                    {isReferee && "Danh sách các giải đấu bạn đã làm trọng tài"}
                    {(isStaff || isAdmin) && "Danh sách liên quan"}
                  </p>
                </div>
                <div className="up-ref-filter-row">
                  <div className="up-ref-search-wrap">
                    <Search size={18} />
                    <input
                      type="text"
                      className="up-ref-search-input"
                      placeholder="Tìm giải đấu..."
                      value={searchTournament}
                      onChange={(e) => setSearchTournament(e.target.value)}
                    />
                  </div>
                  <div className="up-ref-filter-wrap">
                    <Filter size={18} />
                    <select
                      className="up-ref-filter-select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Tất cả</option>
                      <option value="Completed">Kết thúc</option>
                      <option value="Ongoing">Đang diễn ra</option>
                      <option value="Pending">Sắp diễn ra</option>
                      <option value="Cancelled">Đã hủy</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="up-ref-table-wrap">
                <table className="up-ref-table">
                  <thead>
                    <tr>
                      <th>GIẢI ĐẤU</th>
                      {isLeader && (
                        <>
                          <th>NGÀY TẠO</th>
                          <th>HẠN ĐĂNG KÝ</th>
                          <th>NGÀY KẾT THÚC</th>
                        </>
                      )}
                      {!isLeader && <th>TRẠNG THÁI</th>}
                      {isPlayer && <th>THỨ HẠNG</th>}
                      {!isLeader && (
                        <th>{isReferee ? "NGÀY GẮN" : "NGÀY THI ĐẤU"}</th>
                      )}
                      {isLeader && <th>TRẠNG THÁI</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTournaments.length ? (
                      filteredTournaments.map((t) => (
                        <tr
                          key={`${t.tournamentId}-${t.joinedDate || t.createdAt || t.assignedAt || ""}`}
                          className={
                            isLeader ? "up-ref-table-row--clickable" : ""
                          }
                          onClick={
                            isLeader
                              ? () => {
                                  setSelectedTournamentForDetail(t);
                                  setShowAllTournamentsModal(true);
                                }
                              : undefined
                          }
                          role={isLeader ? "button" : undefined}
                        >
                          <td>
                            <div className="up-ref-t-name">
                              <Trophy size={18} className="up-ref-t-icon" />
                              {t.tournamentName}
                            </div>
                          </td>
                          {isLeader && (
                            <>
                              <td>{formatDate(t.createdAt)}</td>
                              <td>{formatDate(t.registrationDeadline)}</td>
                              <td>{formatDate(t.endDate)}</td>
                            </>
                          )}
                          {!isLeader && (
                            <td>
                              <Pill
                                variant={getStatusVariant(t.tournamentStatus)}
                              >
                                {statusLabelVi(t.tournamentStatus)}
                              </Pill>
                            </td>
                          )}
                          {isPlayer && (
                            <td>
                              {t.ranking != null ? (
                                <span className="up-ref-rank-pill">
                                  Hạng {t.ranking}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          )}
                          {!isLeader && (
                            <td>
                              {formatDate(
                                t.startDate || t.createdAt || t.assignedAt,
                              )}
                            </td>
                          )}
                          {isLeader && (
                            <td>
                              <Pill
                                variant={getStatusVariant(t.tournamentStatus)}
                              >
                                {statusLabelVi(t.tournamentStatus)}
                              </Pill>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={isLeader ? 5 : isPlayer ? 4 : 3}
                          className="up-ref-table-empty"
                        >
                          {tournaments.length
                            ? "Không có giải đấu nào khớp bộ lọc."
                            : isLeader
                              ? "Bạn chưa tạo giải đấu nào."
                              : isReferee
                                ? "Bạn chưa được gán trọng tài giải nào."
                                : "Bạn chưa tham gia giải đấu nào."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="up-ref-viewall">
                <button
                  type="button"
                  className="up-ref-viewall-btn"
                  onClick={() => {
                    setSelectedTournamentForDetail(null);
                    setShowAllTournamentsModal(true);
                  }}
                >
                  {isPlayer && "Xem tất cả lịch sử giải đấu "}
                  {isLeader && "Xem tất cả giải đã tạo →"}
                  {isReferee && "Xem tất cả giải đã trọng tài →"}
                  {(isStaff || isAdmin) && "Xem tất cả →"}
                </button>
                {isPlayer && (
                  <button
                    type="button"
                    className="up-ref-viewall-btn"
                    onClick={() => navigate("/player/pending-registrations")}
                    style={{ marginLeft: 12 }}
                  >
                    Giải đang đăng ký
                  </button>
                )}
              </div>
              {isPlayer && (
                <div className="up-ref-achievements">
                  <div className="up-ref-ach-card up-ref-ach-card--green">
                    <Trophy size={24} className="up-ref-ach-icon" />
                    <div className="up-ref-ach-value">{championCount}</div>
                    <div className="up-ref-ach-label">GIẢI QUÂN QUÂN</div>
                    <div className="up-ref-ach-hint">
                      +{championCount} trong tháng này
                    </div>
                  </div>
                  <div className="up-ref-ach-card up-ref-ach-card--purple">
                    <User size={24} className="up-ref-ach-icon" />
                    <div className="up-ref-ach-value">ELITE IV</div>
                    <div className="up-ref-ach-label">CẤP ĐỘ NGƯỜI CHƠI</div>
                    <div className="up-ref-ach-hint">920/1000 EXP</div>
                  </div>
                </div>
              )}
              {(isLeader || isReferee) && (
                <div className="up-ref-achievements">
                  <div className="up-ref-ach-card up-ref-ach-card--purple">
                    <Star
                      size={24}
                      className="up-ref-ach-icon"
                      fill="currentColor"
                    />
                    <div className="up-ref-ach-value up-ref-ach-value--stars">
                      {averageRating != null
                        ? renderStars(averageRating)
                        : "Chưa có"}
                    </div>
                    <div className="up-ref-ach-label">RATING (SAO)</div>
                    <div className="up-ref-ach-hint">
                      {isLeader
                        ? "Từ feedback về giải bạn tạo"
                        : "Từ feedback trận bạn trọng tài"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="up-ref-actions">
          <Pill variant="neutral">{roleLabel(role)}</Pill>
          <button
            className="up-btn up-btn--black"
            type="button"
            onClick={openChangePassword}
            title="Đổi mật khẩu"
          >
            <Lock size={18} style={{ marginRight: "6px" }} />
            Đổi mật khẩu
          </button>
          <button
            className="up-btn up-btn--primary"
            type="button"
            onClick={openEdit}
          >
            Edit profile
          </button>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialValues={initialEditValues}
        onSubmit={handleSave}
        saving={saving}
        error={editErr}
      />

      <ChangePasswordModal
        open={changePwdOpen}
        onClose={() => {
          setChangePwdOpen(false);
          setChangePwdErr("");
          setChangePwdSuccess("");
        }}
        onSubmit={handleChangePassword}
        saving={changePwdSaving}
        error={changePwdErr}
        success={changePwdSuccess}
      />

      <AvatarCropModal
        open={cropOpen}
        src={cropSrc}
        onClose={() => setCropOpen(false)}
        onSave={saveCroppedAvatar}
        saving={avatarSaving}
        error={avatarErr}
      />

      {/* Modal: Xem tất cả giải đấu (list) + chi tiết 1 giải */}
      {showAllTournamentsModal && (
        <div
          className="up-modalOverlay"
          onClick={() => {
            setShowAllTournamentsModal(false);
            setSelectedTournamentForDetail(null);
          }}
        >
          <div
            className="up-modal up-modal--tournaments"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="up-modal__head">
              <div className="up-modal__title">
                {selectedTournamentForDetail
                  ? "Chi tiết giải đấu"
                  : isPlayer
                    ? "Lịch sử giải đã tham gia"
                    : isLeader
                      ? "Lịch sử giải đã tạo (điều hành)"
                      : isReferee
                        ? "Giải đã tham gia (trọng tài)"
                        : "Danh sách giải đấu"}
              </div>
              <button
                type="button"
                className="up-iconBtn"
                onClick={() => {
                  if (selectedTournamentForDetail)
                    setSelectedTournamentForDetail(null);
                  else {
                    setShowAllTournamentsModal(false);
                    setSelectedTournamentForDetail(null);
                  }
                }}
                aria-label={selectedTournamentForDetail ? "Quay lại" : "Đóng"}
              >
                {selectedTournamentForDetail ? "← Quay lại" : "✕"}
              </button>
            </div>
            <div className="up-modal__body">
              {selectedTournamentForDetail ? (
                <div className="up-tournament-detail">
                  <div className="up-tournament-detail__name">
                    <Trophy size={20} />{" "}
                    {selectedTournamentForDetail.tournamentName}
                  </div>
                  <div className="up-tournament-detail__row">
                    <span className="up-tournament-detail__label">
                      Trạng thái:
                    </span>
                    <Pill
                      variant={getStatusVariant(
                        selectedTournamentForDetail.tournamentStatus,
                      )}
                    >
                      {statusLabelVi(
                        selectedTournamentForDetail.tournamentStatus,
                      )}
                    </Pill>
                  </div>
                  {isLeader && (
                    <>
                      <div className="up-tournament-detail__row">
                        <span className="up-tournament-detail__label">
                          Ngày tạo:
                        </span>
                        <span>
                          {formatDate(selectedTournamentForDetail.createdAt)}
                        </span>
                      </div>
                      <div className="up-tournament-detail__row">
                        <span className="up-tournament-detail__label">
                          Hạn đăng ký:
                        </span>
                        <span>
                          {formatDate(
                            selectedTournamentForDetail.registrationDeadline,
                          )}
                        </span>
                      </div>
                      <div className="up-tournament-detail__row">
                        <span className="up-tournament-detail__label">
                          Ngày bắt đầu:
                        </span>
                        <span>
                          {formatDate(selectedTournamentForDetail.startDate)}
                        </span>
                      </div>
                      <div className="up-tournament-detail__row">
                        <span className="up-tournament-detail__label">
                          Ngày kết thúc:
                        </span>
                        <span>
                          {formatDate(selectedTournamentForDetail.endDate)}
                        </span>
                      </div>
                      {(selectedTournamentForDetail.description ||
                        selectedTournamentForDetail.location) && (
                        <>
                          {selectedTournamentForDetail.description && (
                            <div className="up-tournament-detail__row">
                              <span className="up-tournament-detail__label">
                                Mô tả:
                              </span>
                              <span>
                                {selectedTournamentForDetail.description}
                              </span>
                            </div>
                          )}
                          {selectedTournamentForDetail.location && (
                            <div className="up-tournament-detail__row">
                              <span className="up-tournament-detail__label">
                                Địa điểm:
                              </span>
                              <span>
                                {selectedTournamentForDetail.location}
                              </span>
                            </div>
                          )}
                          {(selectedTournamentForDetail.format ||
                            selectedTournamentForDetail.categories) && (
                            <div className="up-tournament-detail__row">
                              <span className="up-tournament-detail__label">
                                Format / Thể loại:
                              </span>
                              <span>
                                {[
                                  selectedTournamentForDetail.format,
                                  selectedTournamentForDetail.categories,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </div>
                          )}
                          {(selectedTournamentForDetail.maxPlayer != null ||
                            selectedTournamentForDetail.minPlayer != null) && (
                            <div className="up-tournament-detail__row">
                              <span className="up-tournament-detail__label">
                                Số người:
                              </span>
                              <span>
                                {[
                                  selectedTournamentForDetail.minPlayer,
                                  selectedTournamentForDetail.maxPlayer,
                                ]
                                  .filter((v) => v != null)
                                  .join("–")}
                              </span>
                            </div>
                          )}
                          {(selectedTournamentForDetail.entryFee != null ||
                            selectedTournamentForDetail.prizePool != null) && (
                            <div className="up-tournament-detail__row">
                              <span className="up-tournament-detail__label">
                                Lệ phí / Giải thưởng:
                              </span>
                              <span>
                                {formatNumber(
                                  selectedTournamentForDetail.entryFee,
                                )}{" "}
                                /{" "}
                                {formatNumber(
                                  selectedTournamentForDetail.prizePool,
                                )}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {isPlayer && (
                    <div className="up-tournament-detail__row">
                      <span className="up-tournament-detail__label">
                        Thứ hạng của bạn:
                      </span>
                      <span>
                        {selectedTournamentForDetail.ranking != null
                          ? `Hạng ${selectedTournamentForDetail.ranking}`
                          : "—"}
                      </span>
                    </div>
                  )}
                  {!isLeader && (
                    <div className="up-tournament-detail__row">
                      <span className="up-tournament-detail__label">
                        {isReferee ? "Ngày gắn:" : "Ngày thi đấu:"}
                      </span>
                      <span>
                        {formatDate(
                          selectedTournamentForDetail.startDate ||
                            selectedTournamentForDetail.createdAt ||
                            selectedTournamentForDetail.assignedAt,
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ) : tournaments.length > 0 ? (
                <ul className="up-tournament-list-modal">
                  {tournaments.map((t) => (
                    <li
                      key={`${t.tournamentId}-${t.joinedDate || t.createdAt || ""}`}
                    >
                      <button
                        type="button"
                        className="up-tournament-list-modal__item"
                        onClick={() => setSelectedTournamentForDetail(t)}
                      >
                        <Trophy size={18} className="up-ref-t-icon" />
                        <span className="up-tournament-list-modal__name">
                          {t.tournamentName}
                        </span>
                        <Pill variant={getStatusVariant(t.tournamentStatus)}>
                          {statusLabelVi(t.tournamentStatus)}
                        </Pill>
                        <span className="up-tournament-list-modal__date">
                          {formatDate(t.startDate)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="up-ref-table-empty">
                  {isLeader
                    ? "Bạn chưa tạo giải đấu nào."
                    : isReferee
                      ? "Bạn chưa được gán trọng tài giải nào."
                      : "Bạn chưa tham gia giải đấu nào."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
