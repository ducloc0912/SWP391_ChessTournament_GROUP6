import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import Cropper from "react-easy-crop";

const API_PROFILE_ME = "http://localhost:8080/ctms/api/profile/me";
const API_PROFILE_AVATAR = "http://localhost:8080/ctms/api/profile/me/avatar";

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
    cropPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Crop failed"));
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

/** ===== Modal: Edit Profile (remove Avatar URL, add Username) ===== */
function EditProfileModal({ open, onClose, initialValues, onSubmit, saving, error }) {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    birthday: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      username: initialValues?.username || "",
      firstName: initialValues?.firstName || "",
      lastName: initialValues?.lastName || "",
      phoneNumber: initialValues?.phoneNumber || "",
      address: initialValues?.address || "",
      birthday: initialValues?.birthday || "",
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
      <div className="up-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="up-modal__head">
          <div className="up-modal__title">Edit profile</div>
          <button className="up-iconBtn" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="up-modal__body" onSubmit={handleSubmit}>
          {error ? <div className="up-alert">{error}</div> : null}

          <div className="up-formGrid">
            <div className="up-field up-field--full">
              <div className="up-field__label">Username</div>
              <input className="up-input" value={form.username} onChange={set("username")} />
              <div className="up-field__hint">Username phải là duy nhất.</div>
            </div>

            <div className="up-field">
              <div className="up-field__label">First name</div>
              <input className="up-input" value={form.firstName} onChange={set("firstName")} />
            </div>

            <div className="up-field">
              <div className="up-field__label">Last name</div>
              <input className="up-input" value={form.lastName} onChange={set("lastName")} />
            </div>

            <div className="up-field">
              <div className="up-field__label">Phone</div>
              <input className="up-input" value={form.phoneNumber} onChange={set("phoneNumber")} />
            </div>

            <div className="up-field">
              <div className="up-field__label">Birthday</div>
              <input className="up-input" type="date" value={form.birthday} onChange={set("birthday")} />
            </div>

            <div className="up-field up-field--full">
              <div className="up-field__label">Address</div>
              <input className="up-input" value={form.address} onChange={set("address")} />
            </div>
          </div>

          <div className="up-modal__foot">
            <button className="up-btn up-btn--ghost" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="up-btn up-btn--primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
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
      <div className="up-modal up-modal--crop" onMouseDown={(e) => e.stopPropagation()}>
        <div className="up-modal__head">
          <div className="up-modal__title">Update avatar</div>
          <button className="up-iconBtn" type="button" onClick={onClose} aria-label="Close">
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
              <div className="up-cropHint">Kéo ảnh để canh vị trí. Dùng thanh kéo để phóng to/thu nhỏ.</div>
            </div>
          </div>

          <div className="up-modal__foot">
            <button className="up-btn up-btn--ghost" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="up-btn up-btn--primary" type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Uploading..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [tab, setTab] = useState("tournaments");

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

  const fetchProfile = () => {
    setLoading(true);
    setErrMsg("");

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
        setErrMsg(err?.response?.data?.message || err?.message || "Không thể kết nối server.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrMsg("");

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
        setErrMsg(err?.response?.data?.message || err?.message || "Không thể kết nối server.");
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

  const name = user?.username || "Unknown";
  const avatar =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EEF2FF&color=111827`;

  const openEdit = () => {
    setEditErr("");
    setEditOpen(true);
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
      birthday: form.birthday?.trim() || null,
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
      setEditErr(e?.response?.data?.message || e?.message || "Không thể kết nối server.");
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
        headers: { "Content-Type": "multipart/form-data" },
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
      setAvatarErr(e?.response?.data?.message || e?.message || "Không thể kết nối server.");
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
          <div className="up-grid">
            <div className="up-skeletonCard" />
            <div className="up-skeletonCard" />
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
    birthday: toInputDate(user.birthday),
  };

  return (
    <div className="up-page">
      <div className="up-bg-orb up-bg-orb-1" />
      <div className="up-bg-orb up-bg-orb-2" />

      <div className="up-wrap">
        <div className="up-topbar">
          <div>
            <div className="up-title">{pageTitle}</div>
            <div className="up-subtitle">Thông tin tài khoản & hoạt động giải đấu</div>
          </div>

          <div className="up-actions">
            <Pill variant="neutral">{roleLabel(role)}</Pill>

            <button className="up-btn up-btn--primary" type="button" onClick={openEdit}>
              Edit profile
            </button>
          </div>
        </div>

        {errMsg ? <div className="up-alert">{errMsg}</div> : null}

        {/* HERO */}
        <div className="up-hero">
          <div className="up-hero__left">
            <div className="up-avatarWrap">
              <button type="button" className="up-avatarBtn" onClick={openFilePicker} aria-label="Change avatar">
                <img className="up-avatar" src={avatar} alt={name} />
                <span className="up-avatarOverlay">📷</span>
              </button>
              <input
                ref={fileRef}
                className="up-file"
                type="file"
                accept="image/*"
                onChange={onPickFile}
              />
              {avatarErr ? <div className="up-miniError">{avatarErr}</div> : null}
            </div>

            <div>
              <div className="up-hero__name">{name}</div>
              <div className="up-hero__line">
                <span>Email:</span>
                <span className="up-strong">{user.email || "N/A"}</span>
                <span className="up-dot" />
                <span>Joined:</span>
                <span className="up-strong">{formatDate(user.createAt || user.create_at)}</span>
              </div>

              <div className="up-hero__badges">
                <Pill variant={user.isActive ? "success" : "danger"}>{user.isActive ? "Active" : "Inactive"}</Pill>
                <Pill variant="neutral">Rank: {user.rank ?? "N/A"}</Pill>
              </div>
            </div>
          </div>

          <div className="up-hero__right">
            <StatCard
              label="Total Tournaments"
              value={formatNumber(stats.totalTournaments ?? 0)}
              hint={isPlayer ? "Số giải đã tham gia" : ""}
            />
            <StatCard
              label="Avg Ranking"
              value={stats.avgRanking == null ? "N/A" : Number(stats.avgRanking).toFixed(2)}
              hint={isPlayer ? "Trung bình xếp hạng" : ""}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="up-tabs">
          <button
            type="button"
            className={`up-tab ${tab === "tournaments" ? "is-active" : ""}`}
            onClick={() => setTab("tournaments")}
          >
            Tournaments
          </button>
          <button
            type="button"
            className={`up-tab ${tab === "overview" ? "is-active" : ""}`}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
        </div>

        <div className="up-grid">
          {/* Left card */}
          <div className="up-card">
            <div className="up-card__head">
              <div className="up-card__title">Profile details</div>
            </div>
            <div className="up-card__body">
              <div className="up-infoGrid">
                <InfoItem label="Username" value={user.username || "N/A"} />
                <InfoItem label="First name" value={user.firstName || user.first_name || "N/A"} />
                <InfoItem label="Last name" value={user.lastName || user.last_name || "N/A"} />
                <InfoItem label="Phone" value={user.phoneNumber || user.phone_number || "N/A"} />
                <InfoItem label="Birthday" value={formatDate(user.birthday)} />
                <InfoItem label="Address" value={user.address || "N/A"} />
              </div>
            </div>
          </div>

          {/* Right card */}
          <div className="up-card">
            <div className="up-card__head">
              <div className="up-card__title">{tab === "tournaments" ? "Recent tournaments" : "Overview"}</div>
            </div>

            <div className="up-card__body">
              {tab === "tournaments" ? (
                tournaments.length ? (
                  <div className="up-list">
                    {tournaments.map((t) => (
                      <div className="up-listItem" key={`${t.tournamentId}-${t.joinedDate || t.createdAt || ""}`}
                      >
                        <div className="up-listItem__left">
                          <div className="up-listItem__title">{t.tournamentName}</div>
                          <div className="up-listItem__meta">
                            <span>{formatDate(t.startDate)}</span>
                            <span className="up-dot" />
                            <span>{statusLabel(t.tournamentStatus)}</span>
                          </div>
                        </div>

                        <div className="up-listItem__right">
                          <Pill variant={getStatusVariant(t.tournamentStatus)}>{statusLabel(t.tournamentStatus)}</Pill>
                          {isPlayer ? (
                            <Pill variant="neutral">Rank: {t.ranking ?? "N/A"}</Pill>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No tournaments" desc="Bạn chưa có dữ liệu giải đấu." />
                )
              ) : (
                <div className="up-overview">
                  <div className="up-overview__row">
                    <StatCard label="Total" value={formatNumber(stats.totalTournaments ?? 0)} />
                    <StatCard
                      label="Avg ranking"
                      value={stats.avgRanking == null ? "N/A" : Number(stats.avgRanking).toFixed(2)}
                    />
                  </div>
                  <div className="up-overview__hint">Thông tin tổng quan dựa trên dữ liệu hiện có.</div>
                </div>
              )}
            </div>
          </div>
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

      <AvatarCropModal
        open={cropOpen}
        src={cropSrc}
        onClose={() => setCropOpen(false)}
        onSave={saveCroppedAvatar}
        saving={avatarSaving}
        error={avatarErr}
      />
    </div>
  );
}
