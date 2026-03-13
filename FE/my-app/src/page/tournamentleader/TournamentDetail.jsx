import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import MainHeader from "../../component/common/MainHeader";
import "../../assets/css/HomePage.css";
import "../../assets/css/TournamentDetailPublic.css";
import "../../assets/css/tournament-leader.css";
import "../../assets/css/tournament-leader/TournamentSetupTab.css";
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Clock3,
  LayoutDashboard,
  Users2,
  GitBranch,
  ShieldCheck,
  FileText,
  ChevronRight,
  UserPlus,
  ArrowRight,
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  AlertCircle,
  Eye,
  Mail,
  RefreshCw,
  UserCog,
  ArrowLeft,
  ImagePlus,
} from "lucide-react";

import { API_BASE } from "../../config/api";

const resolveMediaUrl = (value, apiBase = API_BASE) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:") || raw.startsWith("blob:"))
    return raw;
  if (raw.startsWith("/")) return `${apiBase}${raw}`;
  return `${apiBase}/${raw}`;
};
const FALLBACK_BANNER = "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=1000";

const Badge = ({ children, variant }) => (
  <span className={`td-badge td-badge-${variant}`}>{children}</span>
);

const StatCard = ({ label, value, icon, accent, onClick }) => (
  <div
    className="td-stat-card"
    onClick={onClick}
    style={{ cursor: onClick ? "pointer" : "default" }}
  >
    <div className={`td-stat-icon ${accent}`}>{icon}</div>
    <div className="td-stat-content">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
);

/** Cho phép chọn ngày + giờ (date + time picker) thay vì nhập tay. value/onChange dùng format "YYYY-MM-DDTHH:mm". */
const ScheduleDateTimePicker = ({ value, onChange, title }) => {
  const datePart = value && value.length >= 10 ? value.slice(0, 10) : "";
  const timePart = value && value.length >= 16 ? value.slice(11, 16) : "";
  const handleDate = (e) => {
    const d = e.target.value;
    onChange(d ? `${d}T${timePart || "00:00"}` : "");
  };
  const handleTime = (e) => {
    const t = e.target.value;
    const fallbackDate = new Date().toISOString().slice(0, 10);
    onChange(t ? `${datePart || fallbackDate}T${t}` : (datePart ? `${datePart}T00:00` : ""));
  };
  return (
    <div className="tsu-schedule-datetime-picker" title={title}>
      <input
        type="date"
        className="tsu-mini-input tsu-input-date"
        value={datePart}
        onChange={handleDate}
        aria-label="Chọn ngày"
      />
      <input
        type="time"
        className="tsu-mini-input tsu-input-time"
        value={timePart}
        onChange={handleTime}
        aria-label="Chọn giờ"
      />
    </div>
  );
};

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef(null);
  const [approvedPlayers, setApprovedPlayers] = useState([]);
  const [waitingPlayers, setWaitingPlayers] = useState([]);
  const [loadingApproved, setLoadingApproved] = useState(false);

  const fetchTournament = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/tournaments?id=${id}`,
        { withCredentials: true },
      );
      setTournament(res.data);
    } catch (err) {
      console.error("Error loading tournament:", err);
      setTournament(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchApprovedPlayers = async () => {
    setLoadingApproved(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/tournaments?action=players&id=${id}`,
        { withCredentials: true },
      );
      const rows = Array.isArray(res.data) ? res.data : [];
      setApprovedPlayers(rows.filter((r) => r.isPaid === true));
      setWaitingPlayers(rows.filter((r) => !r.isPaid));
    } catch (err) {
      console.error("Error loading players:", err);
      setApprovedPlayers([]);
      setWaitingPlayers([]);
    } finally {
      setLoadingApproved(false);
    }
  };

  useEffect(() => {
    fetchApprovedPlayers();
  }, [id]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !tournament?.tournamentId) return;
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=uploadImageFile`,
        formData,
        { withCredentials: true }
      );
      if (res?.data?.success && res?.data?.imageUrl) {
        const existingDetails = Array.isArray(tournament.tournamentImages) ? tournament.tournamentImages : [];
        await axios.put(
          `${API_BASE}/api/tournaments?action=updateImages&id=${tournament.tournamentId}`,
          { coverImage: res.data.imageUrl, detailImages: existingDetails },
          { withCredentials: true }
        );
        await fetchTournament();
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Thay banner thất bại.");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const menuItems = [
    { to: "/home", label: "Home" },
    { to: "/leader/tournaments", label: "Quản lý giải" },
  ];

  const tabs = [
    { label: "Overview", icon: <LayoutDashboard size={18} /> },
    { label: "Participants", icon: <Users2 size={18} /> },
    { label: "Setup & Schedule", icon: <GitBranch size={18} /> },
    { label: "Referees", icon: <ShieldCheck size={18} /> },
    { label: "Reports", icon: <FileText size={18} /> },
  ];

  const displayBannerUrl = resolveMediaUrl(tournament?.tournamentImage, API_BASE) || FALLBACK_BANNER;

  if (loading) {
    return (
      <div className="tdp-page td-page-wrapper hpv-page">
        <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} menuItems={menuItems} />
        <div className="tdp-container">
          <div className="tdp-state-card">Đang tải giải đấu...</div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tdp-page td-page-wrapper hpv-page">
        <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} menuItems={menuItems} />
        <div className="tdp-container">
          <div className="tdp-state-card">Không tìm thấy giải đấu.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tdp-page td-page-wrapper hpv-page">
      <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} menuItems={menuItems} />
      <div className="tdp-container">
        <button type="button" className="tdp-back-btn" onClick={() => navigate("/leader/tournaments")}>
          <ArrowLeft size={16} /> Quay lại danh sách giải
        </button>

        {/* Hero banner - giống tournament detail public, nút Sửa banner góc phải trên */}
        <section className="td-leader-hero tdp-hero tdp-hero-banner">
          <img
            className="tdp-hero-bg"
            src={displayBannerUrl}
            alt={tournament.tournamentName || "Tournament"}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_BANNER;
            }}
          />
          <div className="tdp-hero-overlay" />
          <div className="td-leader-hero-edit td-leader-hero-actions-row">
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="td-leader-hero-edit-btn"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
            >
              <ImagePlus size={16} />
              {uploadingBanner ? "Đang tải..." : "Sửa banner"}
            </button>
            <button
              type="button"
              className="tdp-register-btn"
              onClick={() => navigate(`/leader/tournaments/edit/${tournament.tournamentId ?? id}`)}
            >
              <Edit2 size={18} />
              Chỉnh sửa giải đấu
            </button>
            <button type="button" className="td-leader-btn-danger" title="Xóa giải">
              <Trash2 size={18} />
            </button>
          </div>
          <div className="tdp-hero-content">
            <div className="td-leader-hero-badges">
              <Badge variant="teal">{tournament.format}</Badge>
              <Badge variant="orange">{tournament.status}</Badge>
            </div>
            <h1>{tournament.tournamentName}</h1>
            <div className="tdp-hero-meta">
              <span className="tdp-meta-item">
                <Calendar size={14} />
                {tournament.startDate} — {tournament.endDate}
              </span>
              <span className="tdp-meta-item">
                <MapPin size={14} />
                {tournament.location}
              </span>
            </div>
          </div>
          <div className="tdp-hero-fee td-leader-hero-fee">
            {Number(tournament?.entryFee ?? 0) > 0 ? (
              <>
                <span className="tdp-hero-fee-label">Phí tham gia</span>
                <span className="tdp-hero-fee-value">
                  {Number(tournament.entryFee).toLocaleString("vi-VN")} VND
                </span>
              </>
            ) : (
              <span className="tdp-hero-fee-free">Miễn phí tham gia</span>
            )}
          </div>
        </section>

        {/* Tab navigation - cùng style với tournament detail public (tdp-tabs) */}
        <nav className="tdp-tabs">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              type="button"
              className={`tdp-tab ${activeTab === idx ? "active" : ""}`}
              onClick={() => setActiveTab(idx)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="td-tab-content tdp-tab-content-wrap">
          {activeTab === 0 && (
            <OverviewTab
              tournament={tournament}
              onTournamentUpdated={fetchTournament}
            />
          )}
          {activeTab === 1 && (
            <WaitingListTab
              tournamentId={tournament.tournamentId}
              onApprovedChanged={fetchApprovedPlayers}
            />
          )}
          {activeTab === 2 && (
            <BracketTab
              tournamentId={tournament.tournamentId ?? id}
              tournamentFormat={tournament.format}
              approvedPlayers={approvedPlayers}
              tournamentStartDate={tournament.startDate}
              tournamentEndDate={tournament.endDate}
              onApprovedChanged={fetchApprovedPlayers}
            />
          )}
          {activeTab === 3 && (
            <RefereeTab tournamentId={tournament.tournamentId ?? id} />
          )}
          {activeTab === 4 && <ReportsTab />}
        </div>

      </div>
    </div>
  );
};

const fmt = (raw) => {
  if (!raw) return "—";
  return raw.split(" ")[0].replaceAll("-", "/");
};

const OverviewTab = ({ tournament, onTournamentUpdated }) => {
  const [description, setDescription] = useState(tournament.description || "");
  const [rules, setRules] = useState(tournament.rules || "");
  const [notes, setNotes] = useState(tournament.notes || "");
  const [savingOverview, setSavingOverview] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editDraft, setEditDraft] = useState("");

  useEffect(() => {
    setDescription(tournament.description || "");
    setRules(tournament.rules || "");
    setNotes(tournament.notes || "");
  }, [tournament]);

  const handleSaveOverview = async (field, value) => {
    setSavingOverview(true);
    try {
      const payload = {
        tournamentId: tournament.tournamentId,
        tournamentName: tournament.tournamentName,
        description: field === "description" ? value : description,
        rules: field === "rules" ? value : rules,
        notes: field === "notes" ? value : notes,
        tournamentImage: tournament.tournamentImage,
        location: tournament.location,
        format: tournament.format,
        maxPlayer: Number(tournament.maxPlayer) || 0,
        minPlayer: Number(tournament.minPlayer) || 0,
        entryFee: Number(tournament.entryFee) || 0,
        prizePool: Number(tournament.prizePool) || 0,
        registrationDeadline: tournament.registrationDeadline || null,
        startDate: tournament.startDate || null,
        endDate: tournament.endDate || null,
      };
      await axios.put(
        `${API_BASE}/api/tournaments?id=${tournament.tournamentId}`,
        payload,
        { withCredentials: true }
      );
      if (field === "description") setDescription(value);
      if (field === "rules") setRules(value);
      if (field === "notes") setNotes(value);
      setEditingField(null);
      await onTournamentUpdated?.();
    } catch (err) {
      alert(err?.response?.data?.message || "Lưu thất bại.");
    } finally {
      setSavingOverview(false);
    }
  };

  const startEdit = (field) => {
    if (field === "description") setEditDraft(description);
    if (field === "rules") setEditDraft(rules);
    if (field === "notes") setEditDraft(notes);
    setEditingField(field);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditDraft("");
  };

  const progressPct =
    tournament.maxPlayer > 0
      ? Math.round(
          (tournament.currentPlayers / tournament.maxPlayer) * 100
        )
      : 0;

  const now = new Date();
  const regDead = tournament.registrationDeadline
    ? new Date(tournament.registrationDeadline)
    : null;
  const startD = tournament.startDate ? new Date(tournament.startDate) : null;
  const endD = tournament.endDate ? new Date(tournament.endDate) : null;

  const timeline = [
    {
      label: "Mở đăng ký",
      date: fmt(tournament.createAt),
      status: "done",
    },
    {
      label: "Đóng đăng ký",
      date: fmt(tournament.registrationDeadline),
      status: regDead && now >= regDead ? "done" : regDead ? "current" : "upcoming",
    },
    {
      label: "Bắt đầu giải",
      date: fmt(tournament.startDate),
      status:
        startD && now >= startD
          ? "done"
          : regDead && now >= regDead
            ? "current"
            : "upcoming",
    },
    {
      label: "Kết thúc giải",
      date: fmt(tournament.endDate),
      status:
        endD && now >= endD
          ? "done"
          : startD && now >= startD
            ? "current"
            : "upcoming",
    },
  ];

  const daysUntilRegClose =
    regDead && now < regDead
      ? Math.ceil((regDead - now) / (1000 * 60 * 60 * 24))
      : 0;

  const formatMoney = (amount) => {
    const num = Number(amount);
    if (Number.isNaN(num)) return "0";
    return num.toLocaleString("vi-VN");
  };

  const dateRangeStr = [tournament.startDate, tournament.endDate]
    .map((d) => (d ? fmt(d) : "—"))
    .filter(Boolean)
    .join(" — ") || "—";

  const InlineEditBlock = ({ label, fieldKey, value }) => (
    <div className="td-overview-inline-block">
      <div className="td-overview-inline-head">
        <label>{label}</label>
        {editingField !== fieldKey ? (
          <button type="button" className="td-overview-inline-edit-btn" onClick={() => startEdit(fieldKey)}>
            <Edit2 size={14} /> Sửa
          </button>
        ) : null}
      </div>
      {editingField === fieldKey ? (
        <div className="td-overview-inline-edit">
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            rows={fieldKey === "description" ? 4 : fieldKey === "rules" ? 5 : 3}
            placeholder={fieldKey === "description" ? "Mô tả giải đấu..." : fieldKey === "rules" ? "Luật thi đấu..." : "Ghi chú..."}
          />
          <div className="td-overview-inline-actions">
            <button
              type="button"
              className="td-overview-btn td-overview-btn-primary"
              disabled={savingOverview}
              onClick={() => handleSaveOverview(fieldKey, editDraft)}
            >
              {savingOverview ? "Đang lưu..." : "Lưu"}
            </button>
            <button type="button" className="td-overview-btn td-overview-btn-outline" onClick={cancelEdit}>
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div className="td-overview-inline-view">{value || "Chưa có nội dung."}</div>
      )}
    </div>
  );

  return (
    <section className="tdp-overview">
      <div className="tdp-overview-grid">
        <div className="tdp-overview-left">
          <article className="tdp-card tdp-overview-card">
            <h2>{tournament.tournamentName || "Tournament"} overview</h2>
            <div className="tdp-desc">
              <InlineEditBlock label="Mô tả" fieldKey="description" value={description} />
            </div>
            <div className="tdp-placement-rewards">
              <h4>Giải thưởng theo thứ hạng</h4>
              <ul>
                <li>
                  <span className="tdp-medal tdp-medal-gold" />
                  <div>
                    <strong>1st Place</strong>
                    <span>{formatMoney(tournament.prizePool ? Math.round(tournament.prizePool * 0.5) : 0)} VND</span>
                  </div>
                </li>
                <li>
                  <span className="tdp-medal tdp-medal-silver" />
                  <div>
                    <strong>2nd Place</strong>
                    <span>{formatMoney(tournament.prizePool ? Math.round(tournament.prizePool * 0.3) : 0)} VND</span>
                  </div>
                </li>
                <li>
                  <span className="tdp-medal tdp-medal-bronze" />
                  <div>
                    <strong>3rd Place</strong>
                    <span>{formatMoney(tournament.prizePool ? Math.round(tournament.prizePool * 0.2) : 0)} VND</span>
                  </div>
                </li>
              </ul>
            </div>
          </article>

          <article className="tdp-card tdp-event-phases">
            <h3>Event Phases</h3>
            <InlineEditBlock label="Luật & Quy định" fieldKey="rules" value={rules} />
            <div className="tdp-phase-block">
              <h4>Giai đoạn thi đấu</h4>
              <p>
                {tournament.format === "RoundRobin"
                  ? "Thi đấu vòng tròn tính điểm. Mỗi người chơi đấu với tất cả người chơi khác."
                  : tournament.format === "KnockOut"
                  ? "Thi đấu loại trực tiếp. Thua một trận sẽ bị loại khỏi giải."
                  : "Thi đấu kết hợp: vòng tròn để chọn top, sau đó loại trực tiếp cho vòng chung kết."}
              </p>
            </div>
            <div className="tdp-phase-block">
              <InlineEditBlock label="Ghi chú" fieldKey="notes" value={notes} />
            </div>
          </article>
        </div>

        <div className="tdp-overview-right">
          <article className="tdp-card tdp-participants-card">
            <h3>Người tham gia</h3>
            <p className="tdp-participants-intro">
              {tournament.currentPlayers || 0}/{tournament.maxPlayer || 0} người đã đăng ký
            </p>
            <div className="tdp-participants-info">
              <p><MapPin size={14} /> {tournament.location || "Online"}</p>
              <p><Calendar size={14} /> {dateRangeStr}</p>
              <p><Clock3 size={14} /> Hạn đăng ký: {fmt(tournament.registrationDeadline)}</p>
              <p><Trophy size={14} /> Quỹ thưởng: {formatMoney(tournament.prizePool)} VND</p>
            </div>
            <div className="tdp-reg-progress-wrap">
              <div className="td-reg-progress-bar">
                <div className="td-reg-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="td-reg-progress-footer">
                <strong>{tournament.currentPlayers || 0}</strong> / {tournament.maxPlayer} người chơi
              </p>
            </div>
            <div className="tdp-timeline-wrap">
              <h4>Timeline</h4>
              {timeline.map((item, idx) => (
                <div key={idx} className="td-timeline-item">
                  <span className={item.status === "done" ? "" : "dim"}>{item.label}</span>
                  <span>{item.date}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

const MAX_DETAIL_IMAGES = 10;

const ImageManagerModal = ({ tournament, onClose, onSaved }) => {
  const initialCover = tournament.tournamentImage || "";
  const initialDetails = Array.isArray(tournament.tournamentImages)
    ? [...tournament.tournamentImages]
    : [];

  const [coverImage, setCoverImage] = useState(initialCover);
  const [detailImages, setDetailImages] = useState(initialDetails);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [editingIdx, setEditingIdx] = useState(null);

  const coverInputRef = useRef(null);
  const addInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const touchStartX = useRef(null);

  const hasChanges =
    coverImage !== initialCover ||
    JSON.stringify(detailImages) !== JSON.stringify(initialDetails);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const allPreviewImages = [
    ...(coverImage ? [coverImage] : []),
    ...detailImages,
  ];

  const uploadSingleImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(
      `${API_BASE}/api/tournaments?action=uploadImageFile`,
      formData,
      { withCredentials: true }
    );
    if (!res?.data?.success || !res?.data?.imageUrl) {
      throw new Error(res?.data?.message || "Upload ảnh thất bại");
    }
    return res.data.imageUrl;
  };

  const handleSetCoverFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadSingleImage(file);
      setCoverImage(imageUrl);
      setToast("Đã cập nhật ảnh đại diện.");
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Upload ảnh thất bại.");
    } finally {
      setUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleAddFiles = async (files) => {
    if (!files?.length) return;
    if (detailImages.length >= MAX_DETAIL_IMAGES) {
      alert(`Đã đạt tối đa ${MAX_DETAIL_IMAGES} ảnh chi tiết.`);
      return;
    }
    const available = MAX_DETAIL_IMAGES - detailImages.length;
    const picked = Array.from(files).slice(0, available);

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of picked) {
        const imageUrl = await uploadSingleImage(file);
        uploaded.push(imageUrl);
      }
      setDetailImages((prev) => [...prev, ...uploaded]);
      setToast(`Đã thêm ${uploaded.length} ảnh.`);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Upload ảnh thất bại.");
    } finally {
      setUploading(false);
      if (addInputRef.current) addInputRef.current.value = "";
    }
  };

  const handleReplaceDetailImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || editingIdx === null) return;
    setUploading(true);
    try {
      const imageUrl = await uploadSingleImage(file);
      setDetailImages((prev) => prev.map((img, idx) => (idx === editingIdx ? imageUrl : img)));
      setToast("Đã thay ảnh.");
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Thay ảnh thất bại.");
    } finally {
      setUploading(false);
      setEditingIdx(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  const openReplacePicker = (idx) => {
    setEditingIdx(idx);
    replaceInputRef.current?.click();
  };

  const setAsCover = (idx) => {
    const selected = detailImages[idx];
    if (!selected) return;
    setDetailImages((prev) => prev.filter((_, i) => i !== idx));
    if (coverImage && coverImage !== selected) {
      setDetailImages((prev) => [coverImage, ...prev]);
    }
    setCoverImage(selected);
  };

  const moveImage = (from, to) => {
    if (from === to || from === null || to === null) return;
    setDetailImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "cover") {
      setCoverImage("");
    } else {
      setDetailImages((prev) => prev.filter((_, idx) => idx !== deleteTarget.idx));
    }
    setDeleteTarget(null);
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE}/api/tournaments?action=updateImages&id=${tournament.tournamentId}`,
        {
          coverImage: coverImage || null,
          detailImages,
        },
        { withCredentials: true }
      );
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Lưu ảnh thất bại");
      }
      setToast("Lưu ảnh thành công.");
      await onSaved();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Lưu ảnh thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const openPreview = (idx) => {
    setPreviewIdx(idx);
    setPreviewOpen(true);
  };

  const nextPreview = () =>
    setPreviewIdx((p) => (p + 1) % Math.max(allPreviewImages.length, 1));
  const prevPreview = () =>
    setPreviewIdx((p) => (p - 1 + Math.max(allPreviewImages.length, 1)) % Math.max(allPreviewImages.length, 1));

  return (
    <div className="ti-modal-overlay" onClick={onClose}>
      <div className="ti-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ti-modal-header">
          <div>
            <h2>Manage Tournament Images</h2>
            <p>Upload and organize images for this tournament</p>
        </div>
          <button className="ti-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
      </div>

        <div className="ti-modal-body">
          <section className="ti-card">
            <div className="ti-section-head">
              <h3>Cover Image</h3>
              <span className="ti-note">Recommended: 1920 x 1080</span>
      </div>
            <div
              className="ti-cover-preview"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) {
                  handleSetCoverFile({ target: { files: [e.dataTransfer.files[0]] } });
                }
              }}
            >
              {coverImage ? (
                <img src={resolveMediaUrl(coverImage)} alt="Cover" onClick={() => openPreview(0)} />
              ) : (
                <div className="ti-cover-placeholder">
                  <p>No cover image</p>
                  <button className="ti-primary-btn" onClick={() => coverInputRef.current?.click()}>
                    Upload Cover
                  </button>
                </div>
              )}
            </div>
            <div className="ti-btn-row">
              <button className="ti-primary-btn" onClick={() => coverInputRef.current?.click()} disabled={uploading}>
                Change Cover Image
              </button>
              <button
                className="ti-danger-btn"
                onClick={() => setDeleteTarget({ type: "cover" })}
                disabled={!coverImage || uploading}
              >
                Remove
              </button>
            </div>
          </section>

          <section className="ti-card">
            <div className="ti-section-head">
              <h3>Detail Images</h3>
              <span className="ti-note">{detailImages.length} / {MAX_DETAIL_IMAGES}</span>
            </div>
            <div className="ti-grid">
              {detailImages.map((img, idx) => (
                <div
                  key={`${img}-${idx}`}
                  className="ti-image-card"
                  draggable
                  onDragStart={() => setDraggingIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => moveImage(draggingIdx, idx)}
                >
                  <img src={resolveMediaUrl(img)} alt={`Detail ${idx + 1}`} onClick={() => openPreview((coverImage ? 1 : 0) + idx)} />
                  <span className="ti-order-badge">#{idx + 1}</span>
                  <div className="ti-card-actions">
                    <button onClick={() => openReplacePicker(idx)} title="Edit">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget({ type: "detail", idx })} title="Delete">
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => setAsCover(idx)} title="Set as cover">
                      <Trophy size={14} />
                    </button>
                    <button className="drag" title="Drag to reorder">
                      <GripVertical size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="ti-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleAddFiles(e.dataTransfer.files);
              }}
            >
              <p>Drag & drop images here or click to upload</p>
              <small>JPG, PNG, WEBP</small>
              <button className="ti-primary-btn" onClick={() => addInputRef.current?.click()} disabled={uploading}>
                Add Images
              </button>
      </div>
          </section>
        </div>

        <div className="ti-modal-footer">
          <div className="ti-counter">{(coverImage ? 1 : 0) + detailImages.length} images total</div>
          <div className="ti-footer-actions">
            <button className="ti-outline-btn" onClick={onClose}>Cancel</button>
            <button className="ti-primary-btn" onClick={handleSave} disabled={!hasChanges || saving || uploading}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSetCoverFile} />
        <input ref={addInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleAddFiles(e.target.files)} />
        <input ref={replaceInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleReplaceDetailImage} />
      </div>

      {deleteTarget && (
        <div className="ti-confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="ti-confirm" onClick={(e) => e.stopPropagation()}>
            <h4>Delete image?</h4>
            <p>Image will be removed from this tournament when you save.</p>
            <div className="ti-confirm-actions">
              <button className="ti-outline-btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="ti-danger-btn" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && allPreviewImages.length > 0 && (
        <div
          className="ti-preview-overlay"
          onClick={() => setPreviewOpen(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
            const delta = endX - touchStartX.current;
            if (delta > 40) prevPreview();
            if (delta < -40) nextPreview();
            touchStartX.current = null;
          }}
        >
          <button className="ti-preview-nav left" onClick={(e) => { e.stopPropagation(); prevPreview(); }}>
            <ChevronLeft size={24} />
          </button>
          <img src={resolveMediaUrl(allPreviewImages[previewIdx])} alt="preview" className="ti-preview-image" />
          <button className="ti-preview-nav right" onClick={(e) => { e.stopPropagation(); nextPreview(); }}>
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {toast && <div className="ti-toast">{toast}</div>}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Waiting List Tab
   ═══════════════════════════════════════════ */

const WaitingListTab = ({ tournamentId, onApprovedChanged }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchParticipants = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/tournaments?action=players&id=${tournamentId}`,
        { withCredentials: true },
      );
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading participants:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [tournamentId]);

  const fullName = (r) =>
    [r.firstName, r.lastName].filter(Boolean).join(" ") || r.titleAtRegistration || "-";
  const filteredRows = rows.filter((r) => {
    const matchesEmail = (r.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesName = fullName(r).toLowerCase().includes(searchTerm.toLowerCase());
    const rank = Number(r.rank ?? 0);
    const matchesRank = (() => {
      if (!rankFilter) return true;
      if (rankFilter === "lt1000") return rank < 1000;
      if (rankFilter === "1000-1199") return rank >= 1000 && rank <= 1199;
      if (rankFilter === "1200-1399") return rank >= 1200 && rank <= 1399;
      if (rankFilter === "1400-1599") return rank >= 1400 && rank <= 1599;
      if (rankFilter === "ge1600") return rank >= 1600;
      return true;
    })();
    return (matchesEmail || matchesName) && matchesRank;
  });

  const handleUpdateStatus = async (row, nextStatus) => {
    if (!row?.participantId) return;
    const isBan = nextStatus === "Disqualified";
    const confirmText = isBan
      ? `Bạn có chắc muốn ban người chơi ${fullName(row)} khỏi giải đấu?`
      : `Gỡ ban cho người chơi ${fullName(row)}? (Người chơi sẽ bị xóa khỏi danh sách tham gia)`;
    if (!window.confirm(confirmText)) return;

    try {
      setActionLoadingId(row.participantId);

      if (!isBan) {
        // Gỡ ban: xóa hẳn participant khỏi giải
        const res = await axios.delete(`${API_BASE}/api/participants`, {
          params: { id: row.participantId },
          withCredentials: true,
        });
        if (res?.data && res.data.success === false) {
          throw new Error(res.data.message || "Không thể gỡ ban người chơi.");
        }
      } else {
        // Ban người chơi: cập nhật status = Disqualified
        const payload = {
          titleAtRegistration: row.titleAtRegistration,
          seed: row.seed,
          status: nextStatus,
          isPaid: row.isPaid,
          paymentDate: row.paymentDate || null,
          paymentExpiresAt: row.paymentExpiresAt || null,
          notes: row.notes || null,
        };
        const res = await axios.put(
          `${API_BASE}/api/participants`,
          payload,
          {
            params: { participantId: row.participantId },
            withCredentials: true,
          },
        );
        if (!res?.data?.success) {
          throw new Error(res?.data?.message || "Cập nhật trạng thái thất bại.");
        }
      }

      await fetchParticipants();
      if (typeof onApprovedChanged === "function") {
        onApprovedChanged();
      }
    } catch (err) {
      console.error("Update participant status failed:", err);
      window.alert(err?.response?.data?.message || err.message || "Không thể cập nhật trạng thái người chơi.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="td-players-tab">
      <div className="td-players-header">
        <div className="td-players-search">
          <Search className="td-players-search-icon" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm bằng email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="td-players-actions">
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#f1f5f9",
                borderRadius: 12,
                padding: "8px 12px",
              }}
            >
              <Filter size={16} />
              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontWeight: 700,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                <option value="">Tất cả mốc rank</option>
                <option value="lt1000">Dưới 1000</option>
                <option value="1000-1199">1000 - 1199</option>
                <option value="1200-1399">1200 - 1399</option>
                <option value="1400-1599">1400 - 1599</option>
                <option value="ge1600">Từ 1600 trở lên</option>
              </select>
            </div>
            <button
              className="td-btn td-btn-secondary"
              onClick={() => {
                setSearchTerm("");
                setRankFilter("");
              }}
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              Xóa lọc
          </button>
          </div>
        </div>
      </div>

      <div className="td-players-table-wrapper">
        <table className="td-players-table">
          <thead>
            <tr>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Họ và tên
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Tên in-game
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Email
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                SĐT
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Rank
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Thời điểm đăng ký
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Trạng thái
              </th>
              <th
                className="text-right"
                style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}
              >
                Ghi chú / Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Loading participants...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8}>Chưa có người tham gia.</td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.participantId}>
                  <td>{fullName(row)}</td>
                  <td>{row.titleAtRegistration || "-"}</td>
                  <td>{row.email || "-"}</td>
                  <td>—</td>
                  <td>{row.rank ?? "-"}</td>
                  <td>
                    {row.registrationDate
                      ? new Date(row.registrationDate).toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td>
                    {(() => {
                      const rawStatus = (row.status || "").toString();
                      const norm = rawStatus.trim().toLowerCase();
                      if (norm === "disqualified") return "Đã ban khỏi giải";
                      if (row.isPaid) return "Đã thanh toán";
                      return "Chờ thanh toán";
                    })()}
                  </td>
                  <td className="text-right">
                    <div style={{ display: "inline-flex", gap: 8, justifyContent: "flex-end" }}>
                      <span style={{ marginRight: 8 }}>
                        {row.notes || "—"}
                      </span>
                      {(() => {
                        const norm = (row.status || "").toString().trim().toLowerCase();
                        const isDisqualified = norm === "disqualified";
                        const loadingThis = actionLoadingId === row.participantId;
                        if (isDisqualified) {
                          return (
                            <button
                              type="button"
                              className="tdp-register-btn"
                              disabled={loadingThis}
                              onClick={() => handleUpdateStatus(row, "Active")}
                            >
                              {loadingThis ? "Đang gỡ ban..." : "Gỡ ban"}
                            </button>
                          );
                        }
                        return (
                          <button
                            type="button"
                            className="tdp-register-btn"
                            disabled={loadingThis}
                            onClick={() => handleUpdateStatus(row, "Disqualified")}
                          >
                            {loadingThis ? "Đang ban..." : "Ban khỏi giải"}
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BracketTab = ({ tournamentId, tournamentFormat, approvedPlayers = [], tournamentStartDate, tournamentEndDate, onApprovedChanged }) => {
  const normalizeFormat = (value) => {
    const raw = String(value || "").trim().toLowerCase().replace(/[\s_]/g, "");
    if (raw === "roundrobin") return "RoundRobin";
    if (raw === "knockout") return "KnockOut";
    return "RoundRobin";
  };

  const effectiveFormat = normalizeFormat(tournamentFormat);
  const stageOptions = [effectiveFormat];

  const toDateTimeLocal = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const toSqlDateTime = (value) => {
    if (!value) return null;
    const normalized = value.replace("T", " ");
    return normalized.length === 16 ? `${normalized}:00` : normalized;
  };

  const scheduleInputHint = useMemo(() => {
    const fmt = (d) => {
      if (!d) return "";
      const x = new Date(d);
      return Number.isNaN(x.getTime()) ? "" : x.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
    };
    const start = fmt(tournamentStartDate);
    const end = fmt(tournamentEndDate);
    if (!start && !end) return "Định dạng: dd/mm/yyyy HH:mm. Nhập thời gian bắt đầu ván đấu.";
    if (start && end) return `Định dạng: dd/mm/yyyy HH:mm. Gợi ý: nhập trong khoảng ${start} - ${end}`;
    return `Định dạng: dd/mm/yyyy HH:mm. ${start ? `Từ ${start}` : ""}${end ? ` đến ${end}` : ""}`;
  }, [tournamentStartDate, tournamentEndDate]);

  const availablePlayers = useMemo(() => {
    const seen = new Set();
    return approvedPlayers
      .filter((p) => String(p.status || "").toLowerCase() === "active")
      .map((p) => ({
        participantId: p.participantId ?? p.participant_id,
        userId: Number(p.userId ?? p.user_id),
        fullName:
          p.fullName ||
          p.registrationFullName ||
          `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
          p.email ||
          p.registrationEmail ||
          "Unknown",
        email: p.email || p.registrationEmail || "",
        rank: Number(p.rankAtRegistration ?? p.eloRating ?? p.rank ?? 0),
      }))
      .filter((p) => Number.isInteger(p.userId) && p.userId > 0)
      .filter((p) => {
        if (seen.has(p.userId)) return false;
        seen.add(p.userId);
        return true;
      });
  }, [approvedPlayers]);

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [autoSetupLoading, setAutoSetupLoading] = useState(false);
  const [laneStep, setLaneStep] = useState("structure");
  const [serverSetupStep, setServerSetupStep] = useState("BRACKET");
  const [stepStatuses, setStepStatuses] = useState({});
  const [serverBanner, setServerBanner] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [tournamentReferees, setTournamentReferees] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    const loadSchedule = async () => {
      try {
        setLoadingRows(true);
        const [res, stateRes] = await Promise.all([
          axios.get(
            `${API_BASE}/api/tournaments?action=schedule&id=${tournamentId}`,
            { withCredentials: true },
          ),
          axios.get(
            `${API_BASE}/api/tournaments?action=setupState&id=${tournamentId}`,
            { withCredentials: true },
          ),
        ]);
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const rawStep = stateRes?.data?.currentStep || stateRes?.data?.step || "BRACKET";
        const step = String(rawStep).toUpperCase().replace("REFEREE", "REFEREES");
        setServerSetupStep(step);
        const statuses = stateRes?.data?.stepStatuses || {};
        setStepStatuses(statuses);
        const scheduleFinalized = statuses?.SCHEDULE === "FINALIZED";
        if (step === "BRACKET") setLaneStep("structure");
        else if (step === "PLAYERS") setLaneStep("players");
        else if (step === "REFEREES" || step === "COMPLETED") {
          if (!scheduleFinalized) {
            setLaneStep("schedule");
            setServerBanner({
              type: "error",
              text: "Bạn cần hoàn tất Schedule (nhấn Finalize Schedule) trước khi gán trọng tài.",
            });
          } else {
            setLaneStep("referee");
          }
        } else {
          setLaneStep("schedule");
        }
        // Dùng effectiveFormat cho stage fallback để KO không bị gán nhầm RoundRobin khi load
        const stageFallback = effectiveFormat || "RoundRobin";
        setRows(
          list.map((m, idx) => ({
            id: `sv-${m.matchId || idx + 1}`,
            matchId: m.matchId,
            stage: m.stage || stageFallback,
            roundName: m.roundName || "",
            roundIndex: Number(m.roundIndex || 1),
            boardNumber: Number(m.boardNumber || idx + 1),
            whitePlayerId: String(m.whitePlayerId ?? ""),
            blackPlayerId: String(m.blackPlayerId ?? ""),
            startTime: toDateTimeLocal(m.startTime),
            refereeId: m.refereeId ? String(m.refereeId) : "",
            groupId: m.groupId ?? null,
            groupName: m.groupName ?? "",
          })),
        );
      } catch (err) {
        console.error("Load schedule error:", err);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoadingRows(false);
      }
    };
    if (tournamentId && tournamentId !== "undefined") {
      loadSchedule();
    } else {
      if (mounted) setLoadingRows(false);
    }
    return () => {
      mounted = false;
    };
  }, [tournamentId, effectiveFormat]);

  useEffect(() => {
    if (!tournamentId || tournamentId === "undefined") return;
    axios
      .get(`${API_BASE}/api/tournaments?action=referees&id=${tournamentId}`, { withCredentials: true })
      .then((res) => setTournamentReferees(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setTournamentReferees([]));
  }, [tournamentId]);

  useEffect(() => {
    if (laneStep === "referee" && stepStatuses?.SCHEDULE !== "FINALIZED") {
      setLaneStep("schedule");
      setServerBanner({
        type: "error",
        text: "Bạn cần hoàn tất Schedule (nhấn Finalize Schedule) trước khi gán trọng tài.",
      });
    }
  }, [laneStep, stepStatuses?.SCHEDULE]);

  const makeRow = ({
    stage,
    roundIndex,
    boardNumber,
    whitePlayerId = "",
    blackPlayerId = "",
    roundName = "",
    startTime = "",
  }) => ({
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stage: stage || stageOptions[0] || "RoundRobin",
    roundName,
    roundIndex: Number(roundIndex || 1),
    boardNumber: Number(boardNumber || 1),
    whitePlayerId: String(whitePlayerId || ""),
    blackPlayerId: String(blackPlayerId || ""),
    startTime,
  });

  const sortRows = (list = []) =>
    [...list].sort((a, b) => {
      const byRound = Number(a.roundIndex || 0) - Number(b.roundIndex || 0);
      if (byRound !== 0) return byRound;
      return Number(a.boardNumber || 0) - Number(b.boardNumber || 0);
    });

  const groupRowsByRound = (list = []) => {
    const grouped = list.reduce((acc, row) => {
      const key = Number(row.roundIndex || 1);
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([roundIndex, matches]) => ({
        roundIndex: Number(roundIndex),
        matches: sortRows(matches),
      }))
      .sort((a, b) => a.roundIndex - b.roundIndex);
  };

  const stageRows = useMemo(() => {
    const rrRows = sortRows(rows.filter((r) => r.stage === "RoundRobin"));
    const koRows = sortRows(rows.filter((r) => r.stage === "KnockOut"));
    const nativeRows = sortRows(
      rows.filter((r) => stageOptions.includes(r.stage || effectiveFormat)),
    );
    return {
      roundRobinRounds: groupRowsByRound(rrRows),
      knockOutRounds: groupRowsByRound(koRows),
      nativeRounds: groupRowsByRound(nativeRows),
    };
  }, [rows, effectiveFormat]);

  const validateStructureRows = () => {
    const errors = [];
    if (rows.length === 0) {
      errors.push("Bạn chưa tạo structure bracket nào.");
      return errors;
    }
    rows.forEach((row, idx) => {
      const stage = row.stage || stageOptions[0];
      const roundIndex = Number(row.roundIndex || 1);
      const boardNumber = Number(row.boardNumber || 1);
      if (!stageOptions.includes(stage)) {
        errors.push(`Dòng ${idx + 1}: Stage không hợp lệ với thể thức hiện tại.`);
      }
      if (roundIndex <= 0) {
        errors.push(`Dòng ${idx + 1}: Round index phải >= 1.`);
      }
      if (boardNumber <= 0) {
        errors.push(`Dòng ${idx + 1}: Board number phải >= 1.`);
      }
    });
    return errors;
  };

  const validateRows = () => {
    const errors = [];
    const count = availablePlayers.length;
    const playerSet = new Set(availablePlayers.map((p) => p.userId));

    if (effectiveFormat === "RoundRobin" && (count < 4 || count > 10)) {
      errors.push("Round Robin yêu cầu từ 4 đến 10 người chơi đã được duyệt.");
    }
    if (effectiveFormat === "KnockOut" && (count < 8 || count > 32)) {
      errors.push("Knock Out yêu cầu từ 8 đến 32 người chơi đã được duyệt.");
    }
    if (rows.length === 0) {
      errors.push("Bạn chưa xếp cặp đấu nào.");
      return errors;
    }

    let hasRr = false;
    let hasKo = false;
    const rrPairs = new Set();
    const koRoundSlots = new Set();

    rows.forEach((row, idx) => {
      const stage = row.stage || stageOptions[0];
      const white = Number(row.whitePlayerId);
      const black = Number(row.blackPlayerId);
      const roundIndex = Number(row.roundIndex || 1);

      if (!stageOptions.includes(stage)) {
        errors.push(`Dòng ${idx + 1}: Stage không hợp lệ với thể thức hiện tại.`);
      }
      const hasWhite = Number.isInteger(white) && white > 0;
      const hasBlack = Number.isInteger(black) && black > 0;

      if (stage === "RoundRobin") {
        if (!hasWhite || !hasBlack) {
          errors.push(`Dòng ${idx + 1}: Thiếu người chơi trắng/đen.`);
          return;
        }
      } else if (stage === "KnockOut") {
        if ((hasWhite && !hasBlack) || (!hasWhite && hasBlack)) {
          errors.push(`Dòng ${idx + 1}: Knock Out phải để trống cả 2 hoặc điền đủ cả 2 người chơi.`);
          return;
        }
        if (!hasWhite && !hasBlack && roundIndex <= 1) {
          errors.push(`Dòng ${idx + 1}: Round 1 của Knock Out cần có đủ 2 người chơi.`);
          return;
        }
      }
      if (hasWhite && hasBlack && white === black) {
        errors.push(`Dòng ${idx + 1}: Một trận không thể để cùng 1 người chơi ở 2 bên.`);
      }
      if ((hasWhite && !playerSet.has(white)) || (hasBlack && !playerSet.has(black))) {
        errors.push(`Dòng ${idx + 1}: Có người chơi không thuộc danh sách đã duyệt.`);
      }
      if (roundIndex <= 0) {
        errors.push(`Dòng ${idx + 1}: Round index phải >= 1.`);
      }

      if (stage === "RoundRobin") {
        hasRr = true;
        const key = white < black ? `${white}-${black}` : `${black}-${white}`;
        if (rrPairs.has(key)) {
          errors.push(`Dòng ${idx + 1}: Cặp đấu Round Robin bị trùng.`);
        } else {
          rrPairs.add(key);
        }
      }

      if (stage === "KnockOut") {
        hasKo = true;
        if (hasWhite) {
          const wKey = `${roundIndex}-${white}`;
          if (koRoundSlots.has(wKey)) {
            errors.push(
              `Dòng ${idx + 1}: Người chơi đang bị xếp 2 trận trong cùng round Knock Out.`,
            );
          } else {
            koRoundSlots.add(wKey);
          }
        }
        if (hasBlack) {
          const bKey = `${roundIndex}-${black}`;
          if (koRoundSlots.has(bKey)) {
            errors.push(
              `Dòng ${idx + 1}: Người chơi đang bị xếp 2 trận trong cùng round Knock Out.`,
            );
          } else {
            koRoundSlots.add(bKey);
          }
        }
      }
    });
    return errors;
  };

  const structureErrors = validateStructureRows();
  const errors = validateRows();

  const labelForPlayer = (id) => {
    const p = availablePlayers.find((x) => x.userId === Number(id));
    if (!p) return "-";
    return `${p.fullName}${p.email ? ` (${p.email})` : ""}`;
  };

  const labelForReferee = (id) => {
    const r = tournamentReferees.find((x) => (x.refereeId ?? x.referee_id) === Number(id));
    if (!r) return "-";
    const name = (r.fullName ?? [r.firstName, r.lastName].filter(Boolean).join(" ")) || r.email;
    return name || `Referee #${id}`;
  };

  const applyRowErrors = (errorList = []) => {
    const next = {};
    const linePattern = /^Dòng\s+(\d+):\s*(.+)$/i;
    errorList.forEach((msg) => {
      const text = String(msg || "");
      const matched = text.match(linePattern);
      if (!matched) return;
      const rowIndex = Number(matched[1]) - 1;
      const row = rows[rowIndex];
      if (row?.id && !next[row.id]) {
        next[row.id] = matched[2] || text;
      }
    });
    setRowErrors(next);
  };

  const handleDeleteRow = (id) => {
    setRowErrors((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setRows((prev) => {
      const target = prev.find((r) => r.id === id);
      if (
        laneStep === "structure" &&
        target &&
        (target.whitePlayerId || target.blackPlayerId || target.startTime)
      ) {
        setServerBanner({
          type: "error",
          text: "Bạn vừa xóa một match đã có player/schedule. Các dữ liệu liên quan đã bị loại bỏ.",
        });
      }
      return prev.filter((r) => r.id !== id);
    });
  };

  const handleRowFieldChange = (id, field, value) => {
    const structureFields = new Set(["stage", "roundName", "roundIndex", "boardNumber"]);
    setRowErrors((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? (() => {
              const nextValue =
                field === "roundIndex" || field === "boardNumber"
                  ? Number(value || 1)
                  : value;
              const nextRow = { ...row, [field]: nextValue };
              if (
                laneStep === "structure" &&
                structureFields.has(field) &&
                (row.whitePlayerId || row.blackPlayerId || row.startTime)
              ) {
                nextRow.whitePlayerId = "";
                nextRow.blackPlayerId = "";
                nextRow.startTime = "";
                setServerBanner({
                  type: "error",
                  text: "Bạn đã đổi structure, hệ thống reset player/schedule của match này để tránh lệch dữ liệu.",
                });
              }
              return nextRow;
            })()
          : row,
      ),
    );
  };

  const addInlineMatch = ({ stage, roundIndex }) => {
    setRows((prev) => [...prev, makeRow({ stage, roundIndex, boardNumber: 1 })]);
    setServerBanner(null);
    setRowErrors({});
  };

  // Round Robin: tối đa 10 round, đủ full vòng theo luật quốc tế (8 người = 7 round, 28 trận).
  const MAX_ROUND_ROBIN_ROUNDS = 10;
  const MAX_KNOCKOUT_ROUNDS = 4;

  const addInlineRound = (stage) => {
    const targetRows = rows.filter((r) => r.stage === stage);
    const roundIndices = new Set(targetRows.map((r) => Number(r.roundIndex || 1)));
    const maxForStage = stage === "RoundRobin" ? MAX_ROUND_ROBIN_ROUNDS : MAX_KNOCKOUT_ROUNDS;
    if (roundIndices.size >= maxForStage) {
      setServerBanner({
        type: "error",
        text: stage === "RoundRobin"
          ? `Round Robin chỉ được tối đa ${MAX_ROUND_ROBIN_ROUNDS} round.`
          : `Knock Out chỉ được tối đa ${MAX_KNOCKOUT_ROUNDS} round.`,
      });
      return;
    }
    const maxRound = targetRows.reduce(
      (max, r) => Math.max(max, Number(r.roundIndex || 1)),
      0,
    );
    addInlineMatch({ stage, roundIndex: maxRound + 1 });
    setServerBanner(null);
  };

  const runAutoSetup = async () => {
    if (!tournamentId) return;
    try {
      setAutoSetupLoading(true);
      setServerBanner(null);
      // Dùng POST để tránh cache và đảm bảo backend trả về matches (GET có thể bị cache sai)
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=autoSetup&id=${tournamentId}`,
        {},
        { withCredentials: true, headers: { "Content-Type": "application/json" } },
      );
      const data = res?.data;
      // Phát hiện response sai định dạng (trả về tournament details thay vì { success, matches })
      if (data && data.tournamentId != null && !("matches" in data)) {
        setServerBanner({
          type: "error",
          text: "API trả về sai định dạng. Kiểm tra backend đã nhận đúng action=autoSetup. Thử tải lại trang và ấn Auto Setup.",
        });
        return;
      }
      if (!data?.success) {
        setServerBanner({
          type: "error",
          text: data?.message || "Auto setup thất bại.",
        });
        return;
      }
      const matches = Array.isArray(data?.matches) ? data.matches : [];
      if (matches.length === 0) {
        setServerBanner({
          type: "error",
          text: data?.message || "Auto setup không tạo được trận nào. Kiểm tra số người chơi và thể thức giải.",
        });
        return;
      }
      const warnings = data.warnings || [];
      const generatedRows = matches.map((m, idx) => ({
        id: `sv-${m.matchId || idx + 1}`,
        matchId: m.matchId,
        stage: m.stage || effectiveFormat,
        roundName: m.roundName || "",
        roundIndex: Number(m.roundIndex || 1),
        boardNumber: Number(m.boardNumber || idx + 1),
        whitePlayerId: m.whitePlayerId ? String(m.whitePlayerId) : "",
        blackPlayerId: m.blackPlayerId ? String(m.blackPlayerId) : "",
        startTime: toDateTimeLocal(m.startTime),
        refereeId: m.refereeId ? String(m.refereeId) : "",
      }));
      setRows(generatedRows);
      setRowErrors({});
      setServerBanner({
        type: "success",
        text: `${data.message || "Đã tạo " + generatedRows.length + " trận."}${warnings.length ? " " + warnings.join(" ") : ""}`,
      });
    } catch (err) {
      setServerBanner({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Auto setup thất bại. Kiểm tra kết nối và thử lại.",
      });
    } finally {
      setAutoSetupLoading(false);
    }
  };

  const handleSave = async () => {
    if (laneStep === "referee") {
      if (stepStatuses?.SCHEDULE !== "FINALIZED") {
        setServerBanner({
          type: "error",
          text: "Bạn cần hoàn tất Schedule (nhấn Finalize Schedule) trước khi gán trọng tài.",
        });
        return;
      }
      try {
        setSaving(true);
        setServerBanner(null);
        const assignments = rows
          .filter((r) => r.matchId && r.refereeId)
          .map((r) => ({
            matchId: Number(r.matchId),
            refereeId: Number(r.refereeId),
          }));
        const res = await axios.post(
          `${API_BASE}/api/tournaments?action=saveRefereeAssignments&id=${tournamentId}`,
          { matches: assignments },
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          },
        );
        if (!res?.data?.success) {
          setServerBanner({
            type: "error",
            text: res?.data?.message || "Lưu gán trọng tài thất bại.",
          });
          return;
        }
        const finalizeRes = await axios.post(
          `${API_BASE}/api/tournaments?action=finalizeStep&id=${tournamentId}&step=REFEREES`,
          {},
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          },
        );
        const successMsg = finalizeRes?.data?.message || res?.data?.message || "Lưu và công bố thành công.";
        setServerBanner({ type: "success", text: successMsg });
        setToast(successMsg);
        setServerSetupStep("COMPLETED");
        setRowErrors({});
        const [schedRes, stateRes] = await Promise.all([
          axios.get(`${API_BASE}/api/tournaments?action=schedule&id=${tournamentId}`, { withCredentials: true }),
          axios.get(`${API_BASE}/api/tournaments?action=setupState&id=${tournamentId}`, { withCredentials: true }),
        ]);
        const statuses = stateRes?.data?.stepStatuses || {};
        setStepStatuses(statuses);
        setServerSetupStep(stateRes?.data?.currentStep || stateRes?.data?.step || "COMPLETED");
        const list = Array.isArray(schedRes?.data) ? schedRes.data : [];
        setRows(
          list.map((m, idx) => ({
            id: `sv-${m.matchId || idx + 1}`,
            matchId: m.matchId,
            stage: m.stage || effectiveFormat,
            roundName: m.roundName || "",
            roundIndex: Number(m.roundIndex || 1),
            boardNumber: Number(m.boardNumber || idx + 1),
            whitePlayerId: String(m.whitePlayerId ?? ""),
            blackPlayerId: String(m.blackPlayerId ?? ""),
            startTime: toDateTimeLocal(m.startTime),
            refereeId: m.refereeId ? String(m.refereeId) : "",
          })),
        );
      } catch (err) {
        const msg = err?.response?.data?.message ?? err?.message ?? "Lưu trọng tài thất bại.";
        setServerBanner({
          type: "error",
          text: msg,
        });
      } finally {
        setSaving(false);
      }
      return;
    }
    if (laneStep !== "schedule") {
      setServerBanner({
        type: "error",
        text: "Hãy hoàn tất bước trước và vào Schedule để lưu.",
      });
      return;
    }
    if (errors.length > 0) {
      applyRowErrors(errors);
      setServerBanner({ type: "error", text: errors[0] });
      return;
    }
    const payload = {
      format: effectiveFormat,
      setupStep: "SCHEDULE",
      matches: rows.map((r) => ({
        stage: r.stage || effectiveFormat,
        roundName: r.roundName || `Round ${Math.max(1, Number(r.roundIndex || 1))}`,
        roundIndex: Math.max(1, Number(r.roundIndex || 1)),
        boardNumber: Math.max(1, Number(r.boardNumber || 1)),
        whitePlayerId: r.whitePlayerId ? Number(r.whitePlayerId) : null,
        blackPlayerId: r.blackPlayerId ? Number(r.blackPlayerId) : null,
        startTime: toSqlDateTime(r.startTime),
      })),
    };
    try {
      setSaving(true);
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=manualSetup&id=${tournamentId}`,
        payload,
        { withCredentials: true },
      );
      setServerBanner({ type: "success", text: res?.data?.message || "Lưu setup thành công." });
      setRowErrors({});
    } catch (err) {
      setServerBanner({
        type: "error",
        text: err?.response?.data?.message || "Lưu setup thất bại.",
      });
    } finally {
      setSaving(false);
    }
  };

  const resolveRoundLabel = (matches = [], roundIndex) => {
    const named = matches.find((m) => String(m.roundName || "").trim());
    return named?.roundName || `Round ${roundIndex}`;
  };

  const getKoWinnerRefs = (match) => {
    const round = Number(match.roundIndex || 1);
    const board = Number(match.boardNumber || 1);
    const prevRound = Math.max(1, round - 1);
    return {
      whiteRef: `W(R${prevRound}-B${board * 2 - 1})`,
      blackRef: `W(R${prevRound}-B${board * 2})`,
    };
  };

  const getKoPlayersForSelect = (match, slot) => {
    const round = Number(match.roundIndex || 1);
    const taken = new Set();

    rows.forEach((r) => {
      if (r.stage !== "KnockOut") return;
      if (Number(r.roundIndex || 1) !== round) return;
      if (r.id === match.id) return;
      const w = Number(r.whitePlayerId);
      const b = Number(r.blackPlayerId);
      if (Number.isInteger(w) && w > 0) taken.add(w);
      if (Number.isInteger(b) && b > 0) taken.add(b);
    });

    const oppositeId = Number(slot === "white" ? match.blackPlayerId : match.whitePlayerId);
    if (Number.isInteger(oppositeId) && oppositeId > 0) {
      taken.add(oppositeId);
    }

    const currentId = Number(slot === "white" ? match.whitePlayerId : match.blackPlayerId);
    return availablePlayers.filter(
      (p) => p.userId === currentId || !taken.has(p.userId),
    );
  };

  const autoFillPlayersIntoStructure = async () => {
    if (rows.length === 0) {
      setServerBanner({
        type: "error",
        text: "Chưa có structure bracket để auto add players.",
      });
      return;
    }
    try {
      const payload = {
        matches: rows.map((r) => ({
          matchId: r.matchId ? Number(r.matchId) : null,
          stage: r.stage || effectiveFormat,
          roundName: r.roundName || `Round ${Math.max(1, Number(r.roundIndex || 1))}`,
          roundIndex: Math.max(1, Number(r.roundIndex || 1)),
          boardNumber: Math.max(1, Number(r.boardNumber || 1)),
          whitePlayerId: r.whitePlayerId ? Number(r.whitePlayerId) : null,
          blackPlayerId: r.blackPlayerId ? Number(r.blackPlayerId) : null,
          startTime: toSqlDateTime(r.startTime),
        })),
      };
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=autoFillPlayers&id=${tournamentId}`,
        payload,
        { withCredentials: true },
      );
      const data = res?.data;
      if (!data?.success || !Array.isArray(data.matches)) {
        setServerBanner({
          type: "error",
          text: data?.message || "Auto add players thất bại.",
        });
        return;
      }
      const filled = data.matches.map((m, idx) => ({
        id: rows[idx]?.id || `sv-${m.matchId || idx + 1}`,
        matchId: m.matchId,
        stage: m.stage || effectiveFormat,
        roundName: m.roundName || "",
        roundIndex: Number(m.roundIndex || 1),
        boardNumber: Number(m.boardNumber || idx + 1),
        whitePlayerId: m.whitePlayerId ? String(m.whitePlayerId) : "",
        blackPlayerId: m.blackPlayerId ? String(m.blackPlayerId) : "",
        startTime: toDateTimeLocal(m.startTime),
        refereeId: rows[idx]?.refereeId || "",
      }));
      setRows(filled);
      setRowErrors({});
      setServerBanner({
        type: "success",
        text: data.message || "Auto add players đã áp dụng vào structure hiện tại.",
      });
    } catch (err) {
      setServerBanner({
        type: "error",
        text: err?.response?.data?.message || "Auto add players thất bại.",
      });
    }
  };

  const handleFinalizeCurrentStep = async () => {
    if (laneStep === "structure") {
      if (structureErrors.length > 0) {
        applyRowErrors(structureErrors);
        setServerBanner({ type: "error", text: structureErrors[0] });
        return;
      }
      try {
        if (rows.length === 0) {
          setServerBanner({ type: "error", text: "Chưa có vòng/trận nào. Hãy thêm ít nhất một dòng (Round + Board) trước khi Finalize." });
          return;
        }
        const bracketStage = (r) => {
          if (r.stage === "RoundRobin" || r.stage === "KnockOut") return r.stage;
          return effectiveFormat === "KnockOut" ? "KnockOut" : (r.stage || effectiveFormat);
        };
        const payload = {
          format: effectiveFormat,
          matches: rows.map((r) => ({
            stage: bracketStage(r),
            roundName: r.roundName || `Round ${Math.max(1, Number(r.roundIndex || 1))}`,
            roundIndex: Math.max(1, Number(r.roundIndex || 1)),
            boardNumber: Math.max(1, Number(r.boardNumber || 1)),
            whitePlayerId: r.whitePlayerId ? Number(r.whitePlayerId) : null,
            blackPlayerId: r.blackPlayerId ? Number(r.blackPlayerId) : null,
            startTime: toSqlDateTime(r.startTime),
          })),
        };
        const res = await axios.post(
          `${API_BASE}/api/tournaments?action=finalizeStep&id=${tournamentId}&step=BRACKET`,
          payload,
          { withCredentials: true },
        );
        setServerSetupStep("PLAYERS");
        setLaneStep("players");
        setServerBanner({
          type: "success",
          text: res?.data?.message || "Hoàn tất Structure.",
        });
        setRowErrors({});
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Không thể hoàn tất bước Structure.";
        setServerBanner({
          type: "error",
          text: `${msg} Bạn có thể nhấn vào bước 2 (Gán người chơi), 3 (Lịch) hoặc 4 (Trọng tài) trên thanh tiến trình để chuyển tab.`,
        });
      }
      return;
    }

    if (laneStep === "players") {
      if (errors.length > 0) {
        applyRowErrors(errors);
        setServerBanner({ type: "error", text: errors[0] });
        return;
      }
      try {
        const resolveStage = (r) => {
          if (r.stage === "RoundRobin" || r.stage === "KnockOut") return r.stage;
          return r.stage || effectiveFormat;
        };
        const payload = {
          format: effectiveFormat,
          matches: rows.map((r) => ({
            stage: resolveStage(r),
            roundName: r.roundName || `Round ${Math.max(1, Number(r.roundIndex || 1))}`,
            roundIndex: Math.max(1, Number(r.roundIndex || 1)),
            boardNumber: Math.max(1, Number(r.boardNumber || 1)),
            whitePlayerId: r.whitePlayerId ? Number(r.whitePlayerId) : null,
            blackPlayerId: r.blackPlayerId ? Number(r.blackPlayerId) : null,
            startTime: toSqlDateTime(r.startTime),
          })),
        };
        const res = await axios.post(
          `${API_BASE}/api/tournaments?action=finalizeStep&id=${tournamentId}&step=PLAYERS`,
          payload,
          { withCredentials: true },
        );
        setServerSetupStep("SCHEDULE");
        setLaneStep("schedule");
        setServerBanner({
          type: "success",
          text: res?.data?.message || "Hoàn tất Add Players.",
        });
        setRowErrors({});
      } catch (err) {
        setServerBanner({
          type: "error",
          text: err?.response?.data?.message || "Không thể hoàn tất bước Add Players.",
        });
      }
    }
  };

  const handleUnlockStep = async (stepKey) => {
    if (!tournamentId || !stepKey) return;
    const confirmed = window.confirm(
      "Sửa bước này sẽ làm các bước sau cần finalize lại. Bạn có chắc muốn mở khóa?",
    );
    if (!confirmed) return;
    try {
      setUnlocking(true);
      setServerBanner(null);
      await axios.post(
        `${API_BASE}/api/tournaments?action=unlockStep&id=${tournamentId}&step=${stepKey}`,
        {},
        { withCredentials: true },
      );
      const laneFromStep = stepKey === "BRACKET" ? "structure" : stepKey === "PLAYERS" ? "players" : stepKey === "SCHEDULE" ? "schedule" : "referee";
      const [res, stateRes] = await Promise.all([
        axios.get(`${API_BASE}/api/tournaments?action=schedule&id=${tournamentId}`, { withCredentials: true }),
        axios.get(`${API_BASE}/api/tournaments?action=setupState&id=${tournamentId}`, { withCredentials: true }),
      ]);
      const list = Array.isArray(res.data) ? res.data : [];
      const rawStep = stateRes?.data?.currentStep || stateRes?.data?.step || "BRACKET";
      const step = String(rawStep).toUpperCase();
      setServerSetupStep(step);
      setStepStatuses(stateRes?.data?.stepStatuses || {});
      setLaneStep(laneFromStep);
      const stageFallback = effectiveFormat || "RoundRobin";
      setRows(
        list.map((m, idx) => ({
          id: `sv-${m.matchId || idx + 1}`,
          matchId: m.matchId,
          stage: m.stage || stageFallback,
          roundName: m.roundName || "",
          roundIndex: Number(m.roundIndex || 1),
          boardNumber: Number(m.boardNumber || idx + 1),
          whitePlayerId: String(m.whitePlayerId ?? ""),
          blackPlayerId: String(m.blackPlayerId ?? ""),
          startTime: toDateTimeLocal(m.startTime),
          refereeId: m.refereeId ? String(m.refereeId) : "",
        })),
      );
      setServerBanner({ type: "success", text: "Đã mở khóa bước. Các bước sau cần được finalize lại." });
    } catch (err) {
      setServerBanner({
        type: "error",
        text: err?.response?.data?.message || "Mở khóa thất bại.",
      });
    } finally {
      setUnlocking(false);
    }
  };

  const handleUnlockCurrentStep = async () => {
    if (!tournamentId) return;
    let stepKey = null;
    if (laneStep === "structure") stepKey = "BRACKET";
    else if (laneStep === "players") stepKey = "PLAYERS";
    else if (laneStep === "schedule") stepKey = "SCHEDULE";
    else if (laneStep === "referee") stepKey = "REFEREES";
    if (!stepKey) return;
    await handleUnlockStep(stepKey);
  };

  const renderRoundCard = (match) => (
    <div key={match.id} className="tsu-preview-match">
      {laneStep === "structure" && (
        <div className="tsu-preview-topline">
          <div className="tsu-preview-small-grid">
            <input
              type="text"
              className="tsu-mini-input"
              placeholder="Round name"
              value={match.roundName || ""}
              onChange={(e) =>
                handleRowFieldChange(match.id, "roundName", e.target.value)
              }
            />
            <input
              type="number"
              className="tsu-mini-input"
              min={1}
              value={Number(match.boardNumber || 1)}
              onChange={(e) =>
                handleRowFieldChange(match.id, "boardNumber", e.target.value)
              }
            />
          </div>
          <button
            className="tsu-icon-btn"
            onClick={() => handleDeleteRow(match.id)}
            title="Xóa trận"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {laneStep !== "structure" && (
        <>
          <div className="tsu-preview-player white">
            <span className="tsu-preview-seat">W</span>
            {laneStep === "players" ? (
              <select
                className="tsu-mini-select"
                value={match.whitePlayerId || ""}
                onChange={(e) =>
                  handleRowFieldChange(match.id, "whitePlayerId", e.target.value)
                }
              >
                <option value="">-- White --</option>
                {availablePlayers.map((p) => (
                  <option key={`inline-w-${match.id}-${p.userId}`} value={p.userId}>
                    {labelForPlayer(p.userId)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="tsu-readonly-value">{labelForPlayer(match.whitePlayerId)}</span>
            )}
          </div>

          <div className="tsu-preview-player black">
            <span className="tsu-preview-seat">B</span>
            {laneStep === "players" ? (
              <select
                className="tsu-mini-select"
                value={match.blackPlayerId || ""}
                onChange={(e) =>
                  handleRowFieldChange(match.id, "blackPlayerId", e.target.value)
                }
              >
                <option value="">-- Black --</option>
                {availablePlayers.map((p) => (
                  <option key={`inline-b-${match.id}-${p.userId}`} value={p.userId}>
                    {labelForPlayer(p.userId)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="tsu-readonly-value">{labelForPlayer(match.blackPlayerId)}</span>
            )}
          </div>
        </>
      )}

      {laneStep === "schedule" && (
        <div className="tsu-preview-meta">
          <span>Round #{Number(match.roundIndex || 1)}</span>
          <ScheduleDateTimePicker
            value={match.startTime || ""}
            onChange={(v) => handleRowFieldChange(match.id, "startTime", v)}
            title={scheduleInputHint}
          />
        </div>
      )}
      {laneStep === "referee" && (
        <>
          <div className="tsu-preview-meta tsu-preview-schedule-readonly">
            <span>Round #{Number(match.roundIndex || 1)}</span>
            <span className="tsu-schedule-time">
              {match.startTime
                ? (() => {
                    const d = new Date(match.startTime);
                    return Number.isNaN(d.getTime())
                      ? match.startTime
                      : d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
                  })()
                : "—"}
            </span>
          </div>
          <div className="tsu-preview-referee">
            <span className="tsu-preview-seat">Trọng tài</span>
            <select
              className="tsu-mini-select"
              value={match.refereeId || ""}
              onChange={(e) => handleRowFieldChange(match.id, "refereeId", e.target.value)}
            >
              <option value="">-- Chọn trọng tài --</option>
              {tournamentReferees.map((r) => {
                const rid = r.refereeId ?? r.referee_id;
                return (
                  <option key={`ref-${match.id}-${rid}`} value={rid}>
                    {labelForReferee(rid)}
                  </option>
                );
              })}
            </select>
          </div>
        </>
      )}
      {rowErrors[match.id] && <p className="tsu-inline-error">{rowErrors[match.id]}</p>}
    </div>
  );

  const renderRoundRobinPreview = (rounds, title) => (
    <div className="tsu-preview-block">
      <h4>{title}</h4>
      {rounds.length === 0 ? (
        <p className="tsu-preview-empty">Chưa có trận nào cho phần này.</p>
      ) : (
        <div className="tsu-rr-rounds">
          {rounds.map((round) => (
            <div key={`rr-${round.roundIndex}`} className="tsu-rr-round-card">
              <div className="tsu-rr-round-head">
                <strong>{resolveRoundLabel(round.matches, round.roundIndex)}</strong>
                <div className="tsu-round-actions">
                  <span>{round.matches.length} trận</span>
                  <button
                    className="tsu-mini-btn"
                    hidden={laneStep !== "structure"}
                    onClick={() =>
                      addInlineMatch({
                        stage: "RoundRobin",
                        roundIndex: round.roundIndex,
                      })
                    }
                  >
                    + Match
                  </button>
                </div>
              </div>
              <div className="tsu-rr-round-list">
                {round.matches.map((match) => renderRoundCard(match))}
              </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );

  const renderKnockoutPreview = (rounds, title) => (
    <div className="tsu-preview-block">
      <h4>{title}</h4>
      {rounds.length === 0 ? (
        <p className="tsu-preview-empty">Chưa có trận nào cho phần này.</p>
      ) : (
        <div className="tsu-ko-scroll">
          <div className="tsu-ko-grid">
            {rounds.map((round) => (
              <div
                key={`ko-${round.roundIndex}`}
                className="tsu-ko-column"
                style={{
                  "--tsu-connector-len": `${Math.max(
                    12,
                    Math.round(18 - (Number(round.roundIndex || 1) - 1) * 2),
                  )}px`,
                  "--tsu-connector-stroke": `${Math.max(
                    1,
                    2 - (Number(round.roundIndex || 1) - 1) * 0.3,
                  )}px`,
                }}
              >
                <div className="tsu-ko-column-head">
                  <strong>{resolveRoundLabel(round.matches, round.roundIndex)}</strong>
                  <span>Round #{round.roundIndex}</span>
              </div>
                <div
                  className="tsu-ko-column-list"
                  style={{
                    "--tsu-ko-level-gap": `${14 * Math.max(
                      1,
                      2 ** (Number(round.roundIndex || 1) - 1),
                    )}px`,
                    "--tsu-ko-level-top": `${Math.round(
                      22 * (Math.max(1, 2 ** (Number(round.roundIndex || 1) - 1)) - 1),
                    )}px`,
                  }}
                >
                  {round.matches.map((match) => (
                    <div key={match.id} className="tsu-ko-match-card">
                      {laneStep === "structure" ? (
                        <div className="tsu-preview-topline">
                          <div className="tsu-preview-small-grid">
                            <input
                              type="text"
                              className="tsu-mini-input"
                              placeholder="Round name"
                              value={match.roundName || ""}
                              onChange={(e) =>
                                handleRowFieldChange(
                                  match.id,
                                  "roundName",
                                  e.target.value,
                                )
                              }
                            />
                            <input
                              type="number"
                              className="tsu-mini-input"
                              min={1}
                              value={Number(match.boardNumber || 1)}
                              onChange={(e) =>
                                handleRowFieldChange(
                                  match.id,
                                  "boardNumber",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <button
                            className="tsu-icon-btn"
                            onClick={() => handleDeleteRow(match.id)}
                            title="Xóa trận"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : laneStep === "referee" ? (
                        <div className="tsu-preview-topline">
                          <span className="tsu-preview-meta-head">
                            {match.roundName || `Round ${match.roundIndex}`} - Board{" "}
                            {match.boardNumber}
                          </span>
                        </div>
                      ) : (
                        <div className="tsu-preview-meta-head">
                          {match.roundName || `Round ${match.roundIndex}`} - Board{" "}
                          {match.boardNumber}
                        </div>
                      )}
                      {laneStep !== "structure" && (
                        <>
                          <div className="tsu-ko-player-row">
                            <span className="tsu-ko-seat">W</span>
                            {laneStep === "players" &&
                            Number(match.roundIndex || 1) > 1 ? (
                              <span className="tsu-readonly-value">
                                {getKoWinnerRefs(match).whiteRef}
                              </span>
                            ) : laneStep === "players" ? (
                              <select
                                className="tsu-mini-select"
                                value={match.whitePlayerId || ""}
                                onChange={(e) =>
                                  handleRowFieldChange(
                                    match.id,
                                    "whitePlayerId",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">-- White --</option>
                                {getKoPlayersForSelect(match, "white").map((p) => (
                                  <option
                                    key={`ko-w-${match.id}-${p.userId}`}
                                    value={p.userId}
                                  >
                                    {labelForPlayer(p.userId)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="tsu-readonly-value">
                                {Number(match.roundIndex || 1) > 1 &&
                                !match.whitePlayerId
                                  ? getKoWinnerRefs(match).whiteRef
                                  : labelForPlayer(match.whitePlayerId)}
                              </span>
                            )}
          </div>
                          <div className="tsu-ko-player-row">
                            <span className="tsu-ko-seat">B</span>
                            {laneStep === "players" &&
                            Number(match.roundIndex || 1) > 1 ? (
                              <span className="tsu-readonly-value">
                                {getKoWinnerRefs(match).blackRef}
                              </span>
                            ) : laneStep === "players" ? (
                              <select
                                className="tsu-mini-select"
                                value={match.blackPlayerId || ""}
                                onChange={(e) =>
                                  handleRowFieldChange(
                                    match.id,
                                    "blackPlayerId",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">-- Black --</option>
                                {getKoPlayersForSelect(match, "black").map((p) => (
                                  <option
                                    key={`ko-b-${match.id}-${p.userId}`}
                                    value={p.userId}
                                  >
                                    {labelForPlayer(p.userId)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="tsu-readonly-value">
                                {Number(match.roundIndex || 1) > 1 &&
                                !match.blackPlayerId
                                  ? getKoWinnerRefs(match).blackRef
                                  : labelForPlayer(match.blackPlayerId)}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                      {laneStep === "schedule" && (
                        <div className="tsu-ko-meta">
                          <span>Round #{Number(match.roundIndex || 1)}</span>
                          <ScheduleDateTimePicker
                            value={match.startTime || ""}
                            onChange={(v) => handleRowFieldChange(match.id, "startTime", v)}
                            title={scheduleInputHint}
                          />
                        </div>
                      )}
                      {laneStep === "referee" && (
                        <>
                          <div className="tsu-preview-meta tsu-preview-schedule-readonly">
                            <span>Round #{Number(match.roundIndex || 1)}</span>
                            <span className="tsu-schedule-time">
                              {match.startTime
                                ? (() => {
                                    const d = new Date(match.startTime);
                                    return Number.isNaN(d.getTime())
                                      ? match.startTime
                                      : d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
                                  })()
                                : "—"}
                            </span>
                          </div>
                          <div className="tsu-preview-referee">
                            <span className="tsu-preview-seat">Trọng tài</span>
                            <select
                              className="tsu-mini-select"
                              value={match.refereeId || ""}
                              onChange={(e) =>
                                handleRowFieldChange(match.id, "refereeId", e.target.value)
                              }
                            >
                              <option value="">-- Chọn trọng tài --</option>
                              {tournamentReferees.map((r) => {
                                const rid = r.refereeId ?? r.referee_id;
                                return (
                                  <option key={`ref-ko-${match.id}-${rid}`} value={rid}>
                                    {labelForReferee(rid)}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </>
                      )}
                      {rowErrors[match.id] && (
                        <p className="tsu-inline-error">{rowErrors[match.id]}</p>
                      )}
                    </div>
                  ))}
                  <button
                    className="tsu-round-add-btn"
                    hidden={laneStep !== "structure"}
                    onClick={() =>
                      addInlineMatch({
                        stage: "KnockOut",
                        roundIndex: round.roundIndex,
                      })
                    }
                  >
                    + Thêm match round này
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const setupSteps = [
    { key: "structure", label: "Cấu trúc bracket", step: 1 },
    { key: "players", label: "Gán người chơi", step: 2 },
    { key: "schedule", label: "Lịch thi đấu", step: 3 },
    { key: "referee", label: "Trọng tài", step: 4 },
  ];

  return (
    <div className="tsu-shell tsu-shell-hpv">
      <div className="tsu-top">
        <div>
          <h3 className="tsu-title-hpv">Setup &amp; Schedule — {effectiveFormat}</h3>
          <p className="tsu-desc-hpv">Thiết lập cấu trúc giải, gán cặp đấu, lịch và trọng tài.</p>
        </div>
        <span className="tsu-badge-players">{availablePlayers.length} người chơi đã duyệt</span>
      </div>

      {loadingRows ? (
        <div className="tsu-mode-loading">Đang tải lịch đã setup...</div>
      ) : (
        <>
          <div className="tsu-stepper tsu-stepper-hpv">
            {setupSteps.map(({ key, label, step }) => {
              const stepKey =
                key === "structure" ? "BRACKET" :
                key === "players" ? "PLAYERS" :
                key === "schedule" ? "SCHEDULE" :
                "REFEREES";
              const finalized = stepStatuses?.[stepKey] === "FINALIZED";
              const prevStep = step - 1;
              const prevKey =
                prevStep === 1 ? "BRACKET" :
                prevStep === 2 ? "PLAYERS" :
                prevStep === 3 ? "SCHEDULE" :
                null;
              const prevOk = !prevKey || stepStatuses?.[prevKey] === "FINALIZED";
              // Bước structure khi đã finalize thì không cho chuyển về (chỉ mở khóa mới chỉnh được)
              const isStructureLocked = key === "structure" && finalized;
              const disabled = !prevOk || isStructureLocked;
              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  className={`tsu-step-item ${laneStep === key ? "active" : ""} ${disabled ? "disabled" : ""} ${isStructureLocked ? "tsu-step-locked" : ""}`}
                  onClick={(e) => {
                    if (disabled) return;
                    if (isStructureLocked) {
                      e.stopPropagation();
                      return;
                    }
                    setLaneStep(key);
                  }}
                  onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (!isStructureLocked) setLaneStep(key);
                    }
                  }}
                >
                  <span className="tsu-step-num">{step}</span>
                  <span className="tsu-step-label">{label}</span>
                  {finalized && <span className="tsu-step-label"> (Finalized)</span>}
                  {isStructureLocked && (
                    <button
                      type="button"
                      className="tsu-step-unlock-inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlockStep("BRACKET");
                      }}
                      disabled={unlocking}
                    >
                      {unlocking ? "…" : "Unlock"}
                    </button>
                  )}
                  {step < 4 && <span className="tsu-step-connector" />}
                </div>
              );
            })}
          </div>
          <p className="tsu-stepper-hint">Nhấn vào từng bước trên để chuyển tab (Cấu trúc → Gán người chơi → Lịch → Trọng tài).</p>

          <div className="tsu-actions">
            {/*
              Finalize buttons chỉ hiển thị khi bước tương ứng đang ở trạng thái DRAFT.
              Nếu đã FINALIZED thì phải dùng nút Unlock trước, sau đó mới Finalize lại.
            */}
            {laneStep === "structure" && stepStatuses?.BRACKET !== "FINALIZED" && (
              <button
                className="tsu-btn tsu-btn-primary tsu-btn-hpv-primary"
                onClick={runAutoSetup}
                disabled={autoSetupLoading}
              >
                {autoSetupLoading ? "Đang tạo..." : "Auto Setup"}
              </button>
            )}
            {laneStep === "players" && (
              <button className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary" onClick={autoFillPlayersIntoStructure}>
                Auto Add Players
              </button>
            )}
            {laneStep === "structure" && stepStatuses?.BRACKET !== "FINALIZED" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                onClick={handleFinalizeCurrentStep}
              >
                Finalize Structure
              </button>
            )}
            {laneStep === "players" && stepStatuses?.PLAYERS !== "FINALIZED" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                onClick={handleFinalizeCurrentStep}
              >
                Finalize Players
              </button>
            )}
            {laneStep === "structure" && stepStatuses?.BRACKET === "FINALIZED" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                onClick={handleUnlockCurrentStep}
                disabled={unlocking}
              >
                {unlocking ? "Đang mở khóa..." : "Unlock Structure"}
              </button>
            )}
            {laneStep === "players" && stepStatuses?.PLAYERS === "FINALIZED" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                onClick={handleUnlockCurrentStep}
                disabled={unlocking}
              >
                {unlocking ? "Đang mở khóa..." : "Unlock Players"}
              </button>
            )}
            {laneStep === "schedule" && stepStatuses?.SCHEDULE === "FINALIZED" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                onClick={handleUnlockCurrentStep}
                disabled={unlocking}
              >
                {unlocking ? "Đang mở khóa..." : "Unlock Schedule"}
              </button>
            )}
            {laneStep === "referee" && stepStatuses?.REFEREES === "FINALIZED" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                onClick={handleUnlockCurrentStep}
                disabled={unlocking}
              >
                {unlocking ? "Đang mở khóa..." : "Unlock Referees"}
              </button>
            )}
            {laneStep === "schedule" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                disabled={saving || errors.length > 0 || stepStatuses?.SCHEDULE === "FINALIZED"}
                onClick={async () => {
                  if (errors.length > 0) {
                    applyRowErrors(errors);
                    setServerBanner({ type: "error", text: errors[0] });
                    return;
                  }
                  try {
                    setSaving(true);
                    const scheduleStage = (r) => {
                      if (r.stage === "RoundRobin" || r.stage === "KnockOut") return r.stage;
                      return r.stage || effectiveFormat;
                    };
                    const payload = {
                      format: effectiveFormat,
                      matches: rows.map((r) => ({
                        stage: scheduleStage(r),
                        roundName: r.roundName || `Round ${Number(r.roundIndex || 1)}`,
                        roundIndex: Number(r.roundIndex || 1),
                        boardNumber: Number(r.boardNumber || 1),
                        whitePlayerId: r.whitePlayerId ? Number(r.whitePlayerId) : null,
                        blackPlayerId: r.blackPlayerId ? Number(r.blackPlayerId) : null,
                        startTime: toSqlDateTime(r.startTime),
                      })),
                    };
                    const res = await axios.post(
                      `${API_BASE}/api/tournaments?action=finalizeStep&id=${tournamentId}&step=SCHEDULE`,
                      payload,
                      {
                        withCredentials: true,
                        headers: { "Content-Type": "application/json" },
                      },
                    );
                    setServerBanner({ type: "success", text: res?.data?.message || "Lưu lịch thành công." });
                    const [schedRes, stateRes] = await Promise.all([
                      axios.get(`${API_BASE}/api/tournaments?action=schedule&id=${tournamentId}`, { withCredentials: true }),
                      axios.get(`${API_BASE}/api/tournaments?action=setupState&id=${tournamentId}`, { withCredentials: true }),
                    ]);
                    const statuses = stateRes?.data?.stepStatuses || {};
                    setStepStatuses(statuses);
                    setServerSetupStep(stateRes?.data?.currentStep || stateRes?.data?.step || "REFEREES");
                    setLaneStep("referee");
                    const list = Array.isArray(schedRes.data) ? schedRes.data : [];
                    setRows(
                      list.map((m, idx) => ({
                        id: `sv-${m.matchId || idx + 1}`,
                        matchId: m.matchId,
                        stage: m.stage || stageOptions[0] || "RoundRobin",
                        roundName: m.roundName || "",
                        roundIndex: Number(m.roundIndex || 1),
                        boardNumber: Number(m.boardNumber || idx + 1),
                        whitePlayerId: String(m.whitePlayerId ?? ""),
                        blackPlayerId: String(m.blackPlayerId ?? ""),
                        startTime: toDateTimeLocal(m.startTime),
                        refereeId: m.refereeId ? String(m.refereeId) : "",
                      })),
                    );
                  } catch (err) {
                    const msg = err?.response?.data?.message ?? err?.message ?? "Không thể lưu lịch.";
                    setServerBanner({
                      type: "error",
                      text: msg,
                    });
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Finalize Schedule
              </button>
            )}
            {laneStep === "referee" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                onClick={() => setLaneStep("schedule")}
              >
                Quay lại Schedule
              </button>
            )}
            <button
              className="tsu-btn tsu-btn-primary ui-btn ui-btn-primary"
              onClick={handleSave}
              disabled={saving || laneStep !== "referee"}
            >
              {saving ? "Đang lưu..." : "Save & Publish"}
            </button>
        </div>

        <div className="tsu-preview-wrap">
          {laneStep === "referee" ? (
            <div className="tsu-referee-step">
              <div className="tsu-preview-head">
                <div>
                  <h3>4. Select Referee</h3>
                  <p>
                    Gán trọng tài cho từng ván đấu. Trọng tài phải được thêm vào
                    giải trước (tab Referees).
                  </p>
                  {tournamentReferees.length === 0 && (
                    <p className="tsu-referee-empty-hint">
                      Chưa có trọng tài nào. Vào tab Referees để thêm trọng tài
                      vào giải trước.
                    </p>
                  )}
                </div>
              </div>
              {effectiveFormat === "RoundRobin" &&
                renderRoundRobinPreview(
                  stageRows.nativeRounds,
                  "Round Robin - Chọn trọng tài",
                )}
              {effectiveFormat === "KnockOut" &&
                renderKnockoutPreview(
                  stageRows.nativeRounds,
                  "Knock Out - Chọn trọng tài",
                )}
            </div>
          ) : (
            <div className="tsu-schedule-wrap">
              <div className="tsu-preview-head">
                <div>
                  <h3>Schedule Preview</h3>
                  <p>
                    {laneStep === "structure" &&
                      "Bước Structure: chỉ dựng bracket (round, board, số match)."}
                    {laneStep === "players" && "Bước Add Players: dùng structure đã dựng để gán player vào từng match."}
                    {laneStep === "schedule" && (
                      <>
                        Bước Schedule: thêm thời gian thi đấu cho từng match.
                        {scheduleInputHint && (
                          <span className="tsu-schedule-hint-inline">
                            {" "}
                            {scheduleInputHint}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                {laneStep === "schedule" && (
                  <div className="tsu-preview-head-actions">
                    <button
                      type="button"
                      className="tsu-round-add-btn"
                      onClick={() => {
                        if (!tournamentStartDate || !tournamentEndDate || rows.length === 0) {
                          setServerBanner({
                            type: "error",
                            text: "Cần có khoảng thời gian giải (start/end) để auto lịch.",
                          });
                          return;
                        }
                        const start = new Date(tournamentStartDate).getTime();
                        const end = new Date(tournamentEndDate).getTime();
                        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
                          setServerBanner({
                            type: "error",
                            text: "Ngày bắt đầu/kết thúc giải không hợp lệ.",
                          });
                          return;
                        }
                        const step = (end - start) / Math.max(rows.length, 1);
                        const toLocal = (d) => {
                          const x = new Date(d);
                          const local = new Date(x.getTime() - x.getTimezoneOffset() * 60000);
                          return local.toISOString().slice(0, 16);
                        };
                        setRows((prev) =>
                          prev.map((row, i) => ({
                            ...row,
                            startTime: toLocal(new Date(start + step * i)),
                          })),
                        );
                        setServerBanner({
                          type: "success",
                          text: `Đã tự gán lịch cho ${rows.length} trận trong khoảng thời gian giải.`,
                        });
                      }}
                    >
                      Auto schedule
                    </button>
                  </div>
                )}
                {laneStep === "structure" && (
                  <div className="tsu-preview-head-actions">
                    {effectiveFormat === "RoundRobin" && (
                      <button
                        className="tsu-round-add-btn"
                        onClick={() => addInlineRound("RoundRobin")}
                      >
                        + Thêm round RoundRobin
                      </button>
                    )}
                    {effectiveFormat === "KnockOut" && (
                      <button
                        className="tsu-round-add-btn"
                        onClick={() => addInlineRound("KnockOut")}
                      >
                        + Thêm round KnockOut
                      </button>
                    )}
                  </div>
                )}
              </div>

              {effectiveFormat === "RoundRobin" &&
                renderRoundRobinPreview(
                  stageRows.nativeRounds,
                  "Round Robin rounds",
                )}

              {effectiveFormat === "KnockOut" &&
                renderKnockoutPreview(
                  stageRows.nativeRounds,
                  "Knock Out bracket",
                )}
            </div>
          )}
        </div>
      </>
    )}
    {toast && <div className="ti-toast">{toast}</div>}
  </div>
);
};

const RefereeTab = ({ tournamentId }) => {
  const [assignedReferees, setAssignedReferees] = useState([]);
  const [allReferees, setAllReferees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assignRole, setAssignRole] = useState("Assistant");
  const [assignRefereeId, setAssignRefereeId] = useState(null);
  const [showInviteModal] = useState(false);
  const [showReplaceModal] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Assistant");
  const [inviting] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  // Tính năng mời trọng tài qua email hiện tạm thời tắt – các handler chỉ hiển thị thông báo.
  const handleInviteByEmail = () => {
    alert("Tính năng mời trọng tài qua email hiện không được sử dụng. Hãy chọn trọng tài trong danh sách để gán trực tiếp.");
  };

  const handleReplaceInvite = () => {
    alert("Tính năng thay thế lời mời trọng tài hiện không được sử dụng.");
  };

  const fetchReferees = async () => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [assignedRes, allRes] = await Promise.all([
        axios.get(`${API_BASE}/api/tournaments?action=referees&id=${tournamentId}`, { withCredentials: true }),
        axios.get(`${API_BASE}/api/tournaments?action=allReferees`, { withCredentials: true }),
      ]);
      setAssignedReferees(Array.isArray(assignedRes?.data) ? assignedRes.data : []);
      setAllReferees(Array.isArray(allRes?.data) ? allRes.data : []);
    } catch (err) {
      console.error("Load referees error:", err);
      setAssignedReferees([]);
      setAllReferees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferees();
  }, [tournamentId]);

  const handleAssign = async () => {
    if (!tournamentId || !assignRefereeId) return;

    const selected = allReferees.find((r) => r.refereeId === assignRefereeId);
    if (!selected || !selected.email) {
      alert("Không tìm thấy email của trọng tài đã chọn.");
      return;
    }

    setAssigning(true);
    try {
      const payload = {
        email: String(selected.email).trim(),
        refereeRole: assignRole,
      };
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=inviteReferee&id=${tournamentId}`,
        payload,
        { withCredentials: true }
      );
      const message =
        res?.data?.message ||
        "Đã gửi lời mời cho trọng tài. Hệ thống sẽ gán vào giải sau khi họ chấp nhận.";
      alert(message);
      setShowAssignModal(false);
      setAssignRefereeId(null);
      // Assigned referees chỉ thay đổi sau khi trọng tài accept lời mời.
    } catch (err) {
      alert(err?.response?.data?.message || "Gửi lời mời trọng tài thất bại.");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (refereeId) => {
    if (!tournamentId || !confirm("Bạn có chắc muốn gỡ trọng tài này khỏi giải?")) return;
    try {
      await axios.delete(
        `${API_BASE}/api/tournaments?action=removeReferee&id=${tournamentId}&refereeId=${refereeId}`,
        { withCredentials: true }
      );
      await fetchReferees();
    } catch (err) {
      alert(err?.response?.data?.message || "Gỡ trọng tài thất bại.");
    }
  };

  const handleCreateReferee = async () => {
    const { firstName, lastName, email, phoneNumber } = createForm;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phoneNumber?.trim()) {
      alert("Vui lòng điền đầy đủ Họ, Tên, Email và Số điện thoại.");
      return;
    }
    setCreating(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=createReferee`,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber.trim(),
          address: (createForm.address || "").trim() || null,
        },
        { withCredentials: true }
      );
      const created = res?.data?.referee;
      setShowCreateModal(false);
      setCreateForm({ firstName: "", lastName: "", email: "", phoneNumber: "", address: "" });
      await fetchReferees();
      if (created?.email && tournamentId && confirm("Tạo trọng tài thành công. Bạn có muốn gửi lời mời tham gia giải này không?")) {
        try {
          const invitePayload = {
            email: String(created.email).trim(),
            refereeRole: assignRole,
          };
          const inviteRes = await axios.post(
            `${API_BASE}/api/tournaments?action=inviteReferee&id=${tournamentId}`,
            invitePayload,
            { withCredentials: true }
          );
          alert(inviteRes?.data?.message || "Đã gửi lời mời cho trọng tài.");
        } catch (inviteErr) {
          alert(inviteErr?.response?.data?.message || "Gửi lời mời trọng tài thất bại.");
        }
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Tạo trọng tài thất bại.");
    } finally {
      setCreating(false);
    }
  };


  const assignedIds = new Set(assignedReferees.map((r) => r.refereeId));
  const availableToAssign = allReferees.filter((r) => !assignedIds.has(r.refereeId));

  const resolveAvatar = (avatar) => {
    if (!avatar) return "";
    const raw = String(avatar).trim();
    if (raw.startsWith("http") || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
    if (raw.startsWith("/")) return `${API_BASE}${raw}`;
    return `${API_BASE}/${raw}`;
  };

  return (
    <div className="td-referee-section">
      <div className="td-referees-header">
        <h3>Trọng tài giải đấu</h3>
      </div>

      {loading ? (
        <div className="td-referee-loading">Đang tải danh sách trọng tài...</div>
      ) : (
        <div className="td-referee-grid">
          {assignedReferees.map((r) => (
            <div key={r.refereeId} className="referee-card">
              <div className="referee-content">
                <div className="referee-header">
                  <div className="avatar-wrapper">
                    {r.avatar ? (
                      <img src={resolveAvatar(r.avatar)} alt="" />
                    ) : (
                      <div className="referee-avatar-placeholder">
                        {(r.firstName?.[0] || r.lastName?.[0] || "?")}
                      </div>
                    )}
                    <span className={`status-dot active`} />
                  </div>
                  <button
                    type="button"
                    className="more-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(r.refereeId);
                    }}
                    title="Gỡ trọng tài"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <h4 className="referee-name">{[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}</h4>
                <p className="referee-email">{r.email || "—"}</p>
                <span className="referee-role-badge">{r.refereeRole || "Assistant"}</span>
              </div>
            </div>
          ))}

          <div
            className="td-referee-add"
            onClick={() => {
              setAssignRefereeId(null);
              setAssignRole("Assistant");
              setShowAssignModal(true);
            }}
          >
            <div className="td-add-icon">
              <UserPlus size={32} />
            </div>
            <h4>Thêm trọng tài</h4>
            <p>Chọn trọng tài đang rảnh để gán vào giải</p>
          </div>

          <div
            className="td-referee-add td-referee-create"
            onClick={() => {
              setCreateForm({ firstName: "", lastName: "", email: "", phoneNumber: "", address: "" });
              setShowCreateModal(true);
            }}
          >
            <div className="td-add-icon">
              <ShieldCheck size={32} />
            </div>
            <h4>Tạo trọng tài mới</h4>
            <p>Đăng ký trọng tài mới vào hệ thống</p>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Mời trọng tài vào giải</h3>
            <p className="td-modal-desc">
              Chọn một trọng tài trong hệ thống và gửi lời mời. Trọng tài chỉ được gán vào giải sau khi họ chấp nhận lời mời.
            </p>
            <div className="td-modal-body">
              <div className="td-referee-field">
                <label>Vai trò</label>
                <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}>
                  <option value="Chief">Chief</option>
                  <option value="Assistant">Assistant</option>
                </select>
              </div>
              <div className="td-referee-field">
                <label>Trọng tài</label>
                <select
                  value={assignRefereeId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAssignRefereeId(val ? Number(val) : null);
                  }}
                >
                  <option value="">Chọn trọng tài</option>
                  {availableToAssign.map((r) => (
                    <option key={r.refereeId} value={r.refereeId}>
                      {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"} - {r.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel ui-btn ui-btn-secondary" onClick={() => setShowAssignModal(false)}>
                Hủy
              </button>
              <button
                className="ui-btn ui-btn-primary"
                onClick={handleAssign}
                disabled={!assignRefereeId || assigning}
              >
                {assigning ? "Đang gửi..." : "Gửi lời mời"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal td-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Tạo trọng tài mới</h3>
            <p className="td-modal-desc">Điền thông tin để tạo tài khoản trọng tài mới trong hệ thống.</p>
            <div className="td-modal-body">
              <div className="td-referee-form">
                <div className="td-referee-field">
                  <label>Họ <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="Nguyễn"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div className="td-referee-field">
                  <label>Tên <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="Văn A"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
                <div className="td-referee-field">
                  <label>Email <span className="req">*</span></label>
                  <input
                    type="email"
                    placeholder="referee@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="td-referee-field">
                  <label>Số điện thoại <span className="req">*</span></label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={createForm.phoneNumber}
                    onChange={(e) => setCreateForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                  />
                </div>
                <div className="td-referee-field td-referee-field-full">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    placeholder="Địa chỉ (không bắt buộc)"
                    value={createForm.address}
                    onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel ui-btn ui-btn-secondary" onClick={() => setShowCreateModal(false)}>
                Hủy
              </button>
              <button
                className="ui-btn ui-btn-primary"
                onClick={handleCreateReferee}
                disabled={creating}
              >
                {creating ? "Đang tạo..." : "Tạo trọng tài"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Mời trọng tài qua email</h3>
            <p className="td-modal-desc">Nhập email để gửi thư mời tham gia giải với vai trò trọng tài. (Pending sau 7 ngày sẽ tự động Expired)</p>
            <div className="td-modal-body">
              <div className="td-referee-field">
                <label>Email <span className="req">*</span></label>
                <input
                  type="email"
                  placeholder="referee@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="td-referee-field">
                <label>Vai trò</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="Chief">Chief</option>
                  <option value="Assistant">Assistant</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel ui-btn ui-btn-secondary" onClick={() => setShowInviteModal(false)}>
                Hủy
              </button>
              <button
                className="ui-btn ui-btn-primary"
                onClick={handleInviteByEmail}
                disabled={!inviteEmail?.trim() || inviting}
              >
                {inviting ? "Đang gửi..." : "Gửi thư mời"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReplaceModal && (
        <ReplaceInviteModal
          invitation={showReplaceModal}
          onClose={() => setShowReplaceModal(null)}
          onReplace={handleReplaceInvite}
        />
      )}
    </div>
  );
};

const ReplaceInviteModal = ({ invitation, onClose, onReplace }) => {
  const [newEmail, setNewEmail] = useState(invitation?.invitedEmail || "");
  const [refereeRole, setRefereeRole] = useState(invitation?.refereeRole || "Assistant");
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!newEmail?.trim() || !invitation?.invitationId) return;
    setSubmitting(true);
    try {
      await onReplace(invitation.invitationId, newEmail.trim(), refereeRole);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Thay thế trọng tài</h3>
        <p className="td-modal-desc">
          Nhập email mới để thay thế lượt mời hiện tại ({invitation?.invitedEmail}).
        </p>
        <div className="td-modal-body">
          <div className="td-referee-field">
            <label>Email mới <span className="req">*</span></label>
            <input
              type="email"
              placeholder="new-referee@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div className="td-referee-field">
            <label>Vai trò</label>
            <select value={refereeRole} onChange={(e) => setRefereeRole(e.target.value)}>
              <option value="Chief">Chief</option>
              <option value="Assistant">Assistant</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel ui-btn ui-btn-secondary" onClick={onClose}>Hủy</button>
          <button
            className="ui-btn ui-btn-primary"
            onClick={handleSubmit}
            disabled={!newEmail?.trim() || submitting}
          >
            {submitting ? "Đang thay..." : "Thay thế"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportsTab = () => (
  <div className="td-reports-card">
    {/* Header */}
    <div className="td-reports-header">
      <div>
        <h3>Documentation Center</h3>
        <p>Audit logs, performance reviews and match data.</p>
      </div>

      <button className="td-export-btn">
        <Download size={20} />
        Export Final Ledger
      </button>
    </div>

    {/* Table */}
    <div className="td-reports-table-wrapper">
      <table className="td-reports-table">
        <thead>
          <tr>
            <th>Document Identity</th>
            <th>Authority</th>
            <th>Timestamp</th>
            <th>Validation</th>
            <th className="right">Action</th>
          </tr>
        </thead>

        <tbody></tbody>
      </table>
    </div>

    {/* Footer CTA */}
    <div className="td-reports-footer">
      <div className="td-footer-box">
        <div className="td-footer-icon">
          <AlertCircle size={32} />
        </div>

        <h4>Custom Analytics Engine</h4>
        <p>
          Need deep insights into player performance or fair play metrics? Our
          AI-driven engine can generate a specialized 30-page audit in under 5
          minutes.
        </p>

        <button className="td-audit-btn">
          Run Advanced Audit <ArrowRight size={14} />
        </button>
      </div>
    </div>
  </div>
);

export default TournamentDetail;
