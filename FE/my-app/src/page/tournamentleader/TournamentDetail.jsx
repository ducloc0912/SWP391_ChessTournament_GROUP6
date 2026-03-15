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
  MessageSquare,
} from "lucide-react";

import TournamentFeedbackSection from "../../component/common/TournamentFeedbackSection";

import { API_BASE } from "../../config/api";

const resolveMediaUrl = (value, apiBase = API_BASE) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  )
    return raw;
  if (raw.startsWith("/")) return `${apiBase}${raw}`;
  return `${apiBase}/${raw}`;
};
const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=1000";

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
const ScheduleDateTimePicker = ({ value, onChange, title, disabled = false }) => {
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
        disabled={disabled}
        aria-label="Chọn ngày"
      />
      <input
        type="time"
        className="tsu-mini-input tsu-input-time"
        value={timePart}
        onChange={handleTime}
        disabled={disabled}
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
      const res = await axios.get(`${API_BASE}/api/tournaments?id=${id}`, {
        withCredentials: true,
      });
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
        { withCredentials: true },
      );
      if (res?.data?.success && res?.data?.imageUrl) {
        const existingDetails = Array.isArray(tournament.tournamentImages)
          ? tournament.tournamentImages
          : [];
        await axios.put(
          `${API_BASE}/api/tournaments?action=updateImages&id=${tournament.tournamentId}`,
          { coverImage: res.data.imageUrl, detailImages: existingDetails },
          { withCredentials: true },
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
    { label: "Feedback & Reviews", icon: <MessageSquare size={18} /> },
  ];

  const displayBannerUrl =
    resolveMediaUrl(tournament?.tournamentImage, API_BASE) || FALLBACK_BANNER;

  if (loading) {
    return (
      <div className="tdp-page td-page-wrapper hpv-page">
        <MainHeader
          user={user}
          onLogout={handleLogout}
          currentPath={location.pathname}
          menuItems={menuItems}
        />
        <div className="tdp-container">
          <div className="tdp-state-card">Đang tải giải đấu...</div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tdp-page td-page-wrapper hpv-page">
        <MainHeader
          user={user}
          onLogout={handleLogout}
          currentPath={location.pathname}
          menuItems={menuItems}
        />
        <div className="tdp-container">
          <div className="tdp-state-card">Không tìm thấy giải đấu.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tdp-page td-page-wrapper hpv-page">
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
        menuItems={menuItems}
      />
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
            <button
              type="button"
              className="td-leader-btn-danger"
              title="Xóa giải"
            >
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
          {activeTab === 4 && (
            <ReportsTab tournamentId={tournament.tournamentId ?? id} />
          )}
          {activeTab === 5 && (
            <LeaderFeedbackTab
              tournamentId={tournament.tournamentId ?? id}
              user={user}
              role={
                typeof window !== "undefined"
                  ? localStorage.getItem("role") || "TOURNAMENTLEADER"
                  : "TOURNAMENTLEADER"
              }
            />
          )}
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
        { withCredentials: true },
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
      ? Math.round((tournament.currentPlayers / tournament.maxPlayer) * 100)
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
      status:
        regDead && now >= regDead ? "done" : regDead ? "current" : "upcoming",
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

  const dateRangeStr =
    [tournament.startDate, tournament.endDate]
      .map((d) => (d ? fmt(d) : "—"))
      .filter(Boolean)
      .join(" — ") || "—";

  const InlineEditBlock = ({ label, fieldKey, value }) => (
    <div className="td-overview-inline-block">
      <div className="td-overview-inline-head">
        <label>{label}</label>
        {editingField !== fieldKey ? (
          <button
            type="button"
            className="td-overview-inline-edit-btn"
            onClick={() => startEdit(fieldKey)}
          >
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
            placeholder={
              fieldKey === "description"
                ? "Mô tả giải đấu..."
                : fieldKey === "rules"
                  ? "Luật thi đấu..."
                  : "Ghi chú..."
            }
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
            <button
              type="button"
              className="td-overview-btn td-overview-btn-outline"
              onClick={cancelEdit}
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div className="td-overview-inline-view">
          {value || "Chưa có nội dung."}
        </div>
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
              <InlineEditBlock
                label="Mô tả"
                fieldKey="description"
                value={description}
              />
            </div>
            <div className="tdp-placement-rewards">
              <h4>Giải thưởng theo thứ hạng</h4>
              <ul>
                <li>
                  <span className="tdp-medal tdp-medal-gold" />
                  <div>
                    <strong>1st Place</strong>
                    <span>
                      {formatMoney(
                        tournament.prizePool
                          ? Math.round(tournament.prizePool * 0.5)
                          : 0,
                      )}{" "}
                      VND
                    </span>
                  </div>
                </li>
                <li>
                  <span className="tdp-medal tdp-medal-silver" />
                  <div>
                    <strong>2nd Place</strong>
                    <span>
                      {formatMoney(
                        tournament.prizePool
                          ? Math.round(tournament.prizePool * 0.3)
                          : 0,
                      )}{" "}
                      VND
                    </span>
                  </div>
                </li>
                <li>
                  <span className="tdp-medal tdp-medal-bronze" />
                  <div>
                    <strong>3rd Place</strong>
                    <span>
                      {formatMoney(
                        tournament.prizePool
                          ? Math.round(tournament.prizePool * 0.2)
                          : 0,
                      )}{" "}
                      VND
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </article>

          <article className="tdp-card tdp-event-phases">
            <h3>Event Phases</h3>
            <InlineEditBlock
              label="Luật & Quy định"
              fieldKey="rules"
              value={rules}
            />
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
              {tournament.currentPlayers || 0}/{tournament.maxPlayer || 0} người
              đã đăng ký
            </p>
            <div className="tdp-participants-info">
              <p>
                <MapPin size={14} /> {tournament.location || "Online"}
              </p>
              <p>
                <Calendar size={14} /> {dateRangeStr}
              </p>
              <p>
                <Clock3 size={14} /> Hạn đăng ký:{" "}
                {fmt(tournament.registrationDeadline)}
              </p>
              <p>
                <Trophy size={14} /> Quỹ thưởng:{" "}
                {formatMoney(tournament.prizePool)} VND
              </p>
            </div>
            <div className="tdp-reg-progress-wrap">
              <div className="td-reg-progress-bar">
                <div
                  className="td-reg-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="td-reg-progress-footer">
                <strong>{tournament.currentPlayers || 0}</strong> /{" "}
                {tournament.maxPlayer} người chơi
              </p>
            </div>
            <div className="tdp-timeline-wrap">
              <h4>Timeline</h4>
              {timeline.map((item, idx) => (
                <div key={idx} className="td-timeline-item">
                  <span className={item.status === "done" ? "" : "dim"}>
                    {item.label}
                  </span>
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
      { withCredentials: true },
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
      alert(
        err?.response?.data?.message || err?.message || "Upload ảnh thất bại.",
      );
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
      alert(
        err?.response?.data?.message || err?.message || "Upload ảnh thất bại.",
      );
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
      setDetailImages((prev) =>
        prev.map((img, idx) => (idx === editingIdx ? imageUrl : img)),
      );
      setToast("Đã thay ảnh.");
    } catch (err) {
      alert(
        err?.response?.data?.message || err?.message || "Thay ảnh thất bại.",
      );
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
      setDetailImages((prev) =>
        prev.filter((_, idx) => idx !== deleteTarget.idx),
      );
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
        { withCredentials: true },
      );
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Lưu ảnh thất bại");
      }
      setToast("Lưu ảnh thành công.");
      await onSaved();
    } catch (err) {
      alert(
        err?.response?.data?.message || err?.message || "Lưu ảnh thất bại.",
      );
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
    setPreviewIdx(
      (p) =>
        (p - 1 + Math.max(allPreviewImages.length, 1)) %
        Math.max(allPreviewImages.length, 1),
    );

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
                  handleSetCoverFile({
                    target: { files: [e.dataTransfer.files[0]] },
                  });
                }
              }}
            >
              {coverImage ? (
                <img
                  src={resolveMediaUrl(coverImage)}
                  alt="Cover"
                  onClick={() => openPreview(0)}
                />
              ) : (
                <div className="ti-cover-placeholder">
                  <p>No cover image</p>
                  <button
                    className="ti-primary-btn"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    Upload Cover
                  </button>
                </div>
              )}
            </div>
            <div className="ti-btn-row">
              <button
                className="ti-primary-btn"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading}
              >
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
              <span className="ti-note">
                {detailImages.length} / {MAX_DETAIL_IMAGES}
              </span>
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
                  <img
                    src={resolveMediaUrl(img)}
                    alt={`Detail ${idx + 1}`}
                    onClick={() => openPreview((coverImage ? 1 : 0) + idx)}
                  />
                  <span className="ti-order-badge">#{idx + 1}</span>
                  <div className="ti-card-actions">
                    <button onClick={() => openReplacePicker(idx)} title="Edit">
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: "detail", idx })}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setAsCover(idx)}
                      title="Set as cover"
                    >
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
              <button
                className="ti-primary-btn"
                onClick={() => addInputRef.current?.click()}
                disabled={uploading}
              >
                Add Images
              </button>
            </div>
          </section>
        </div>

        <div className="ti-modal-footer">
          <div className="ti-counter">
            {(coverImage ? 1 : 0) + detailImages.length} images total
          </div>
          <div className="ti-footer-actions">
            <button className="ti-outline-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="ti-primary-btn"
              onClick={handleSave}
              disabled={!hasChanges || saving || uploading}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleSetCoverFile}
        />
        <input
          ref={addInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleAddFiles(e.target.files)}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleReplaceDetailImage}
        />
      </div>

      {deleteTarget && (
        <div
          className="ti-confirm-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div className="ti-confirm" onClick={(e) => e.stopPropagation()}>
            <h4>Delete image?</h4>
            <p>Image will be removed from this tournament when you save.</p>
            <div className="ti-confirm-actions">
              <button
                className="ti-outline-btn"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button className="ti-danger-btn" onClick={confirmDelete}>
                Delete
              </button>
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
          <button
            className="ti-preview-nav left"
            onClick={(e) => {
              e.stopPropagation();
              prevPreview();
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <img
            src={resolveMediaUrl(allPreviewImages[previewIdx])}
            alt="preview"
            className="ti-preview-image"
          />
          <button
            className="ti-preview-nav right"
            onClick={(e) => {
              e.stopPropagation();
              nextPreview();
            }}
          >
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
    [r.firstName, r.lastName].filter(Boolean).join(" ") ||
    r.titleAtRegistration ||
    "-";
  const filteredRows = rows.filter((r) => {
    const matchesEmail = (r.email || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesName = fullName(r)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
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
        const res = await axios.put(`${API_BASE}/api/participants`, payload, {
          params: { participantId: row.participantId },
          withCredentials: true,
        });
        if (!res?.data?.success) {
          throw new Error(
            res?.data?.message || "Cập nhật trạng thái thất bại.",
          );
        }
      }

      await fetchParticipants();
      if (typeof onApprovedChanged === "function") {
        onApprovedChanged();
      }
    } catch (err) {
      console.error("Update participant status failed:", err);
      window.alert(
        err?.response?.data?.message ||
          err.message ||
          "Không thể cập nhật trạng thái người chơi.",
      );
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
                    <div
                      style={{
                        display: "inline-flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <span style={{ marginRight: 8 }}>{row.notes || "—"}</span>
                      {(() => {
                        const norm = (row.status || "")
                          .toString()
                          .trim()
                          .toLowerCase();
                        const isDisqualified = norm === "disqualified";
                        const loadingThis =
                          actionLoadingId === row.participantId;
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
                            onClick={() =>
                              handleUpdateStatus(row, "Disqualified")
                            }
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
    const raw = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_]/g, "");
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
      return Number.isNaN(x.getTime())
        ? ""
        : x.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
    };
    const start = fmt(tournamentStartDate);
    const end = fmt(tournamentEndDate);
    if (!start && !end)
      return "Định dạng: dd/mm/yyyy HH:mm. Nhập thời gian bắt đầu ván đấu.";
    if (start && end)
      return `Định dạng: dd/mm/yyyy HH:mm. Gợi ý: nhập trong khoảng ${start} - ${end}`;
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
  const [actionLoading, setActionLoading] = useState({
    autoStructure: false,
    autoPlayers: false,
    autoSchedule: false,
    finalize: false,
    publish: false,
  });
  const [laneStep, setLaneStep] = useState("structure");
  const [stepStatuses, setStepStatuses] = useState({});
  const [serverBanner, setServerBanner] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [tournamentReferees, setTournamentReferees] = useState([]);
  const [toast, setToast] = useState("");
  const [resultModal, setResultModal] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const STEP_ORDER = ["BRACKET", "PLAYERS", "SCHEDULE", "REFEREES"];
  const LANE_TO_STEP = {
    structure: "BRACKET",
    players: "PLAYERS",
    schedule: "SCHEDULE",
    referee: "REFEREES",
  };
  const isFinalized = (stepKey) => stepStatuses?.[stepKey] === "FINALIZED";
  const canEditPlayers = isFinalized("BRACKET");
  const canEditSchedule = isFinalized("PLAYERS");
  const canEditReferees = isFinalized("SCHEDULE");
  const canPublish = STEP_ORDER.every((stepKey) => isFinalized(stepKey));

  const setActionBusy = (key, value) => {
    setActionLoading((prev) => ({ ...prev, [key]: value }));
  };

  const mapMatchesToRows = (list = [], stageFallback = effectiveFormat || "RoundRobin") =>
    list.map((m, idx) => ({
      id: `sv-${m.matchId || idx + 1}`,
      matchId: m.matchId,
      stage: m.stage || stageFallback,
      roundName: m.roundName || "",
      roundIndex: Number(m.roundIndex || 1),
      boardNumber: Number(m.boardNumber || idx + 1),
      player1Id: String(m.player1Id ?? ""),
      player2Id: String(m.player2Id ?? ""),
      startTime: toDateTimeLocal(m.startTime),
      refereeId: m.refereeId ? String(m.refereeId) : "",
      groupId: m.groupId ?? null,
      groupName: m.groupName ?? "",
    }));

  const refreshSetupData = async (nextLaneStep = null) => {
    const [res, stateRes] = await Promise.all([
      axios.get(`${API_BASE}/api/tournaments?action=schedule&id=${tournamentId}`, {
        withCredentials: true,
      }),
      axios.get(`${API_BASE}/api/tournaments?action=setupState&id=${tournamentId}`, {
        withCredentials: true,
      }),
    ]);
    const list = Array.isArray(res?.data) ? res.data : [];
    const rawStep = stateRes?.data?.currentStep || stateRes?.data?.step || "BRACKET";
    setStepStatuses(stateRes?.data?.stepStatuses || {});
    setRows(mapMatchesToRows(list));
    if (nextLaneStep) {
      setLaneStep(nextLaneStep);
    }
  };

  const markDirtyFromStep = async (stepKey) => {
    const startIndex = STEP_ORDER.indexOf(stepKey);
    if (startIndex < 0) return;
    const shouldMarkDirty = STEP_ORDER.slice(startIndex).some(
      (key) => stepStatuses?.[key] === "FINALIZED",
    );
    if (!shouldMarkDirty) return;
    try {
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=markDirtyStep&id=${tournamentId}&step=${stepKey}`,
        {},
        { withCredentials: true },
      );
      if (res?.data?.stepStatuses) {
        setStepStatuses(res.data.stepStatuses);
      }
    } catch (err) {
      console.error("markDirtyStep failed", err);
    }
  };

  const showResultModal = (type, message) => {
    setResultModal({
      open: true,
      type: type === "success" ? "success" : "error",
      message: String(message || ""),
    });
  };

  const closeResultModal = () => {
    setResultModal((prev) => ({ ...prev, open: false }));
  };

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
        setRows(mapMatchesToRows(list));
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
      .get(`${API_BASE}/api/tournaments?action=referees&id=${tournamentId}`, {
        withCredentials: true,
      })
      .then((res) =>
        setTournamentReferees(Array.isArray(res?.data) ? res.data : []),
      )
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
    player1Id = "",
    player2Id = "",
    roundName = "",
    startTime = "",
  }) => ({
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stage: stage || stageOptions[0] || "RoundRobin",
    roundName,
    roundIndex: Number(roundIndex || 1),
    boardNumber: Number(boardNumber || 1),
    player1Id: String(player1Id || ""),
    player2Id: String(player2Id || ""),
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
        errors.push(
          `Dòng ${idx + 1}: Stage không hợp lệ với thể thức hiện tại.`,
        );
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

    const rrPairs = new Set();
    const koRoundSlots = new Set();

    rows.forEach((row, idx) => {
      const stage = row.stage || stageOptions[0];
      const player1 = Number(row.player1Id);
      const player2 = Number(row.player2Id);
      const roundIndex = Number(row.roundIndex || 1);

      if (!stageOptions.includes(stage)) {
        errors.push(
          `Dòng ${idx + 1}: Stage không hợp lệ với thể thức hiện tại.`,
        );
      }
      const hasPlayer1 = Number.isInteger(player1) && player1 > 0;
      const hasPlayer2 = Number.isInteger(player2) && player2 > 0;

      if (stage === "RoundRobin") {
        if (!hasPlayer1 || !hasPlayer2) {
          errors.push(`Dòng ${idx + 1}: Thiếu người chơi trắng/đen.`);
          return;
        }
      } else if (stage === "KnockOut") {
        if ((hasPlayer1 && !hasPlayer2) || (!hasPlayer1 && hasPlayer2)) {
          errors.push(
            `Dòng ${idx + 1}: Knock Out phải để trống cả 2 hoặc điền đủ cả 2 người chơi.`,
          );
          return;
        }
        if (!hasPlayer1 && !hasPlayer2 && roundIndex <= 1) {
          errors.push(`Dòng ${idx + 1}: Round 1 của Knock Out cần có đủ 2 người chơi.`);
          return;
        }
      }
      if (hasPlayer1 && hasPlayer2 && player1 === player2) {
        errors.push(
          `Dòng ${idx + 1}: Một trận không thể để cùng 1 người chơi ở 2 bên.`,
        );
      }
      if (
        (hasPlayer1 && !playerSet.has(player1)) ||
        (hasPlayer2 && !playerSet.has(player2))
      ) {
        errors.push(
          `Dòng ${idx + 1}: Có người chơi không thuộc danh sách đã duyệt.`,
        );
      }
      if (roundIndex <= 0) {
        errors.push(`Dòng ${idx + 1}: Round index phải >= 1.`);
      }

      if (stage === "RoundRobin") {
        const key =
          player1 < player2
            ? `${player1}-${player2}`
            : `${player2}-${player1}`;
        if (rrPairs.has(key)) {
          errors.push(`Dòng ${idx + 1}: Cặp đấu Round Robin bị trùng.`);
        } else {
          rrPairs.add(key);
        }
      }

      if (stage === "KnockOut") {
        if (hasPlayer1) {
          const p1Key = `${roundIndex}-${player1}`;
          if (koRoundSlots.has(p1Key)) {
            errors.push(
              `Dòng ${idx + 1}: Người chơi đang bị xếp 2 trận trong cùng round Knock Out.`,
            );
          } else {
            koRoundSlots.add(p1Key);
          }
        }
        if (hasPlayer2) {
          const p2Key = `${roundIndex}-${player2}`;
          if (koRoundSlots.has(p2Key)) {
            errors.push(
              `Dòng ${idx + 1}: Người chơi đang bị xếp 2 trận trong cùng round Knock Out.`,
            );
          } else {
            koRoundSlots.add(p2Key);
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
    const r = tournamentReferees.find(
      (x) => (x.refereeId ?? x.referee_id) === Number(id),
    );
    if (!r) return "-";
    const name =
      (r.fullName ?? [r.firstName, r.lastName].filter(Boolean).join(" ")) ||
      r.email;
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
    void markDirtyFromStep("BRACKET");
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
        (target.player1Id || target.player2Id || target.startTime)
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
    const structureFields = new Set([
      "stage",
      "roundName",
      "roundIndex",
      "boardNumber",
    ]);
    let dirtyStepKey = null;
    if (structureFields.has(field)) dirtyStepKey = "BRACKET";
    else if (field === "player1Id" || field === "player2Id") dirtyStepKey = "PLAYERS";
    else if (field === "startTime") dirtyStepKey = "SCHEDULE";
    else if (field === "refereeId") dirtyStepKey = "REFEREES";
    if (dirtyStepKey) {
      void markDirtyFromStep(dirtyStepKey);
    }
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
                (row.player1Id || row.player2Id || row.startTime)
              ) {
                nextRow.player1Id = "";
                nextRow.player2Id = "";
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
    void markDirtyFromStep("BRACKET");
    setRows((prev) => [
      ...prev,
      makeRow({ stage, roundIndex, boardNumber: 1 }),
    ]);
    setServerBanner(null);
    setRowErrors({});
  };

  // Round Robin: tối đa 10 round, đủ full vòng theo luật quốc tế (8 người = 7 round, 28 trận).
  const MAX_ROUND_ROBIN_ROUNDS = 10;
  const MAX_KNOCKOUT_ROUNDS = 4;

  const addInlineRound = (stage) => {
    void markDirtyFromStep("BRACKET");
    const targetRows = rows.filter((r) => r.stage === stage);
    const roundIndices = new Set(
      targetRows.map((r) => Number(r.roundIndex || 1)),
    );
    const maxForStage =
      stage === "RoundRobin" ? MAX_ROUND_ROBIN_ROUNDS : MAX_KNOCKOUT_ROUNDS;
    if (roundIndices.size >= maxForStage) {
      setServerBanner({
        type: "error",
        text:
          stage === "RoundRobin"
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
      void markDirtyFromStep("BRACKET");
      setActionBusy("autoStructure", true);
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
        player1Id: m.player1Id ? String(m.player1Id) : "",
        player2Id: m.player2Id ? String(m.player2Id) : "",
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
      setActionBusy("autoStructure", false);
    }
  };

  const handleSave = async () => {
    if (!canPublish) {
      const msg = "Chỉ có thể Save & Publish khi cả 4 bước đều đã FINALIZED.";
      setServerBanner({ type: "error", text: msg });
      showResultModal("error", msg);
      return;
    }
    try {
      setActionBusy("publish", true);
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=publishSetup&id=${tournamentId}`,
        {},
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      const successMsg = res?.data?.message || "Save & Publish thành công.";
      setServerBanner({ type: "success", text: successMsg });
      setToast(successMsg);
      showResultModal("success", successMsg);
      await refreshSetupData("referee");
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Save & Publish thất bại.";
      setServerBanner({ type: "error", text: msg });
      showResultModal("error", msg);
    } finally {
      setActionBusy("publish", false);
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
      player1Ref: `W(R${prevRound}-B${board * 2 - 1})`,
      player2Ref: `W(R${prevRound}-B${board * 2})`,
    };
  };

  const getKoPlayersForSelect = (match, slot) => {
    const round = Number(match.roundIndex || 1);
    const taken = new Set();

    rows.forEach((r) => {
      if (r.stage !== "KnockOut") return;
      if (Number(r.roundIndex || 1) !== round) return;
      if (r.id === match.id) return;
      const w = Number(r.player1Id);
      const b = Number(r.player2Id);
      if (Number.isInteger(w) && w > 0) taken.add(w);
      if (Number.isInteger(b) && b > 0) taken.add(b);
    });

    const oppositeId = Number(
      slot === "player1" ? match.player2Id : match.player1Id,
    );
    if (Number.isInteger(oppositeId) && oppositeId > 0) {
      taken.add(oppositeId);
    }

    const currentId = Number(
      slot === "player1" ? match.player1Id : match.player2Id,
    );
    return availablePlayers.filter(
      (p) => p.userId === currentId || !taken.has(p.userId),
    );
  };

  const autoFillPlayersIntoStructure = async () => {
    if (!canEditPlayers) {
      setServerBanner({
        type: "error",
        text: "Bạn cần Finalize Structure trước khi tự động gán players.",
      });
      return;
    }
    if (rows.length === 0) {
      setServerBanner({
        type: "error",
        text: "Chưa có structure bracket để auto add players.",
      });
      return;
    }
    try {
      void markDirtyFromStep("PLAYERS");
      setActionBusy("autoPlayers", true);
      const payload = {
        matches: rows.map((r) => ({
          matchId: r.matchId ? Number(r.matchId) : null,
          stage: r.stage || effectiveFormat,
          roundName: r.roundName || `Round ${Math.max(1, Number(r.roundIndex || 1))}`,
          roundIndex: Math.max(1, Number(r.roundIndex || 1)),
          boardNumber: Math.max(1, Number(r.boardNumber || 1)),
          player1Id: r.player1Id ? Number(r.player1Id) : null,
          player2Id: r.player2Id ? Number(r.player2Id) : null,
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
        player1Id: m.player1Id ? String(m.player1Id) : "",
        player2Id: m.player2Id ? String(m.player2Id) : "",
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
    } finally {
      setActionBusy("autoPlayers", false);
    }
  };

  const autoScheduleCurrentMatches = async () => {
    if (!canEditSchedule) {
      setServerBanner({
        type: "error",
        text: "Bạn cần Finalize Players trước khi tự động xếp lịch.",
      });
      return;
    }
    if (rows.length === 0) {
      setServerBanner({
        type: "error",
        text: "Chưa có match để auto schedule.",
      });
      return;
    }
    try {
      void markDirtyFromStep("SCHEDULE");
      setActionBusy("autoSchedule", true);
      const payload = {
        matches: rows.map((r) => ({
          matchId: r.matchId ? Number(r.matchId) : null,
          stage: r.stage || effectiveFormat,
          roundName: r.roundName || `Round ${Math.max(1, Number(r.roundIndex || 1))}`,
          roundIndex: Math.max(1, Number(r.roundIndex || 1)),
          boardNumber: Math.max(1, Number(r.boardNumber || 1)),
          player1Id: r.player1Id ? Number(r.player1Id) : null,
          player2Id: r.player2Id ? Number(r.player2Id) : null,
          startTime: toSqlDateTime(r.startTime),
        })),
      };
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=autoSchedule&id=${tournamentId}`,
        payload,
        { withCredentials: true },
      );
      const data = res?.data;
      if (!data?.success || !Array.isArray(data.matches)) {
        setServerBanner({
          type: "error",
          text: data?.message || "Auto schedule thất bại.",
        });
        return;
      }
      setRows(mapMatchesToRows(data.matches));
      setRowErrors({});
      setServerBanner({
        type: "success",
        text: data?.message || `Đã auto schedule cho ${data.matches.length} trận.`,
      });
    } catch (err) {
      setServerBanner({
        type: "error",
        text: err?.response?.data?.message || "Auto schedule thất bại.",
      });
    } finally {
      setActionBusy("autoSchedule", false);
    }
  };

  const handleFinalizeCurrentStep = async () => {
    const nextLaneByStep = {
      BRACKET: "players",
      PLAYERS: "schedule",
      SCHEDULE: "referee",
      REFEREES: "referee",
    };
    const buildPayload = () => ({
      format: effectiveFormat,
      matches: rows.map((r) => ({
        matchId: r.matchId ? Number(r.matchId) : null,
        stage:
          r.stage === "RoundRobin" || r.stage === "KnockOut"
            ? r.stage
            : r.stage || effectiveFormat,
        roundName: r.roundName || `Round ${Math.max(1, Number(r.roundIndex || 1))}`,
        roundIndex: Math.max(1, Number(r.roundIndex || 1)),
        boardNumber: Math.max(1, Number(r.boardNumber || 1)),
        player1Id: r.player1Id ? Number(r.player1Id) : null,
        player2Id: r.player2Id ? Number(r.player2Id) : null,
        startTime: toSqlDateTime(r.startTime),
        refereeId: r.refereeId ? Number(r.refereeId) : null,
      })),
    });

    let stepKey = LANE_TO_STEP[laneStep];
    if (!stepKey) return;

    if (stepKey === "BRACKET") {
      if (structureErrors.length > 0) {
        applyRowErrors(structureErrors);
        setServerBanner({ type: "error", text: structureErrors[0] });
        showResultModal("error", structureErrors[0]);
        return;
      }
      if (rows.length === 0) {
        const msg = "Chưa có vòng/trận nào. Hãy thêm ít nhất một dòng trước khi Finalize Structure.";
        setServerBanner({ type: "error", text: msg });
        showResultModal("error", msg);
        return;
      }
    }

    if (stepKey === "PLAYERS") {
      if (!canEditPlayers) {
        const msg = "Bạn cần Finalize Structure trước khi Finalize Players.";
        setServerBanner({ type: "error", text: msg });
        showResultModal("error", msg);
        return;
      }
      if (errors.length > 0) {
        applyRowErrors(errors);
        setServerBanner({ type: "error", text: errors[0] });
        showResultModal("error", errors[0]);
        return;
      }
    }

    if (stepKey === "SCHEDULE") {
      if (!canEditSchedule) {
        const msg = "Bạn cần Finalize Players trước khi Finalize Schedule.";
        setServerBanner({ type: "error", text: msg });
        showResultModal("error", msg);
        return;
      }
      if (errors.length > 0) {
        applyRowErrors(errors);
        setServerBanner({ type: "error", text: errors[0] });
        showResultModal("error", errors[0]);
        return;
      }
    }

    if (stepKey === "REFEREES" && !canEditReferees) {
      const msg = "Bạn cần Finalize Schedule trước khi Finalize Referee.";
      setServerBanner({ type: "error", text: msg });
      showResultModal("error", msg);
      return;
    }

    try {
      setActionBusy("finalize", true);
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=finalizeStep&id=${tournamentId}&step=${stepKey}`,
        buildPayload(),
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      const successMsg =
        res?.data?.message ||
        (stepKey === "BRACKET"
          ? "Hoàn tất Structure."
          : stepKey === "PLAYERS"
            ? "Hoàn tất Players."
            : stepKey === "SCHEDULE"
              ? "Hoàn tất Schedule."
              : "Hoàn tất Referee.");
      setServerBanner({ type: "success", text: successMsg });
      showResultModal("success", successMsg);
      setRowErrors({});
      await refreshSetupData(nextLaneByStep[stepKey]);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể finalize bước hiện tại.";
      setServerBanner({ type: "error", text: msg });
      showResultModal("error", msg);
    } finally {
      setActionBusy("finalize", false);
    }
  };

  const handleRoundNameChange = (stage, roundIndex, value) => {
    void markDirtyFromStep("BRACKET");
    const normalizedStage = stage || effectiveFormat;
    const targetRound = Number(roundIndex || 1);
    setRows((prev) =>
      prev.map((r) => {
        const rowStage = r.stage || effectiveFormat;
        const rowRound = Number(r.roundIndex || 1);
        if (rowStage !== normalizedStage || rowRound !== targetRound) return r;
        return { ...r, roundName: value };
      }),
    );
  };

  const renderRoundCard = (match) => (
    <div key={match.id} className="tsu-preview-match">
      {laneStep === "structure" && (
        <div className="tsu-preview-topline">
          <div className="tsu-preview-small-grid">
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
          <div className="tsu-preview-player player1">
            <span className="tsu-preview-seat">P1</span>
            {laneStep === "players" ? (
              <select
                className="tsu-mini-select"
                value={match.player1Id || ""}
                disabled={!canEditPlayers}
                onChange={(e) =>
                  handleRowFieldChange(
                    match.id,
                    "player1Id",
                    e.target.value,
                  )
                }
              >
                <option value="">-- Player 1 --</option>
                {availablePlayers.map((p) => (
                  <option
                    key={`inline-w-${match.id}-${p.userId}`}
                    value={p.userId}
                  >
                    {labelForPlayer(p.userId)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="tsu-readonly-value">
                {labelForPlayer(match.player1Id)}
              </span>
            )}
          </div>

          <div className="tsu-preview-player player2">
            <span className="tsu-preview-seat">P2</span>
            {laneStep === "players" ? (
              <select
                className="tsu-mini-select"
                value={match.player2Id || ""}
                disabled={!canEditPlayers}
                onChange={(e) =>
                  handleRowFieldChange(
                    match.id,
                    "player2Id",
                    e.target.value,
                  )
                }
              >
                <option value="">-- Player 2 --</option>
                {availablePlayers.map((p) => (
                  <option
                    key={`inline-b-${match.id}-${p.userId}`}
                    value={p.userId}
                  >
                    {labelForPlayer(p.userId)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="tsu-readonly-value">
                {labelForPlayer(match.player2Id)}
              </span>
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
            disabled={!canEditSchedule}
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
              disabled={!canEditReferees}
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
      {rowErrors[match.id] && (
        <p className="tsu-inline-error">{rowErrors[match.id]}</p>
      )}
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
                {laneStep === "structure" ? (
                  <input
                    type="text"
                    className="tsu-mini-input"
                    placeholder={`Round ${round.roundIndex}`}
                    value={resolveRoundLabel(round.matches, round.roundIndex)}
                    onChange={(e) =>
                      handleRoundNameChange(
                        "RoundRobin",
                        round.roundIndex,
                        e.target.value,
                      )
                    }
                  />
                ) : (
                  <strong>
                    {resolveRoundLabel(round.matches, round.roundIndex)}
                  </strong>
                )}
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
                  {laneStep === "structure" ? (
                    <input
                      type="text"
                      className="tsu-mini-input"
                      placeholder={`Round ${round.roundIndex}`}
                      value={resolveRoundLabel(round.matches, round.roundIndex)}
                      onChange={(e) =>
                        handleRoundNameChange(
                          "KnockOut",
                          round.roundIndex,
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <strong>
                      {resolveRoundLabel(round.matches, round.roundIndex)}
                    </strong>
                  )}
                  <span>Round #{round.roundIndex}</span>
                </div>
                <div
                  className="tsu-ko-column-list"
                  style={{
                    "--tsu-ko-level-gap": `${
                      14 * Math.max(1, 2 ** (Number(round.roundIndex || 1) - 1))
                    }px`,
                    "--tsu-ko-level-top": `${Math.round(
                      22 *
                        (Math.max(1, 2 ** (Number(round.roundIndex || 1) - 1)) -
                          1),
                    )}px`,
                  }}
                >
                  {round.matches.map((match) => (
                    <div key={match.id} className="tsu-ko-match-card">
                      {laneStep === "structure" ? (
                        <div className="tsu-preview-topline">
                          <div className="tsu-preview-small-grid">
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
                          {match.roundName || `Round ${match.roundIndex}`} -
                          Board {match.boardNumber}
                        </div>
                      )}
                      {laneStep !== "structure" && (
                        <>
                          <div className="tsu-ko-player-row">
                            <span className="tsu-ko-seat">P1</span>
                            {laneStep === "players" &&
                            Number(match.roundIndex || 1) > 1 ? (
                              <span className="tsu-readonly-value">
                                {getKoWinnerRefs(match).player1Ref}
                              </span>
                            ) : laneStep === "players" ? (
                              <select
                                className="tsu-mini-select"
                                value={match.player1Id || ""}
                                disabled={!canEditPlayers}
                                onChange={(e) =>
                                  handleRowFieldChange(
                                    match.id,
                                    "player1Id",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">-- Player 1 --</option>
                                {getKoPlayersForSelect(match, "player1").map(
                                  (p) => (
                                    <option
                                      key={`ko-w-${match.id}-${p.userId}`}
                                      value={p.userId}
                                    >
                                      {labelForPlayer(p.userId)}
                                    </option>
                                  ),
                                )}
                              </select>
                            ) : (
                              <span className="tsu-readonly-value">
                                {Number(match.roundIndex || 1) > 1 &&
                                !match.player1Id
                                  ? getKoWinnerRefs(match).player1Ref
                                  : labelForPlayer(match.player1Id)}
                              </span>
                            )}
                          </div>
                          <div className="tsu-ko-player-row">
                            <span className="tsu-ko-seat">P2</span>
                            {laneStep === "players" &&
                            Number(match.roundIndex || 1) > 1 ? (
                              <span className="tsu-readonly-value">
                                {getKoWinnerRefs(match).player2Ref}
                              </span>
                            ) : laneStep === "players" ? (
                              <select
                                className="tsu-mini-select"
                                value={match.player2Id || ""}
                                disabled={!canEditPlayers}
                                onChange={(e) =>
                                  handleRowFieldChange(
                                    match.id,
                                    "player2Id",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">-- Player 2 --</option>
                                {getKoPlayersForSelect(match, "player2").map(
                                  (p) => (
                                    <option
                                      key={`ko-b-${match.id}-${p.userId}`}
                                      value={p.userId}
                                    >
                                      {labelForPlayer(p.userId)}
                                    </option>
                                  ),
                                )}
                              </select>
                            ) : (
                              <span className="tsu-readonly-value">
                                {Number(match.roundIndex || 1) > 1 &&
                                !match.player2Id
                                  ? getKoWinnerRefs(match).player2Ref
                                  : labelForPlayer(match.player2Id)}
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
                            disabled={!canEditSchedule}
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
                              disabled={!canEditReferees}
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
                        <p className="tsu-inline-error">
                          {rowErrors[match.id]}
                        </p>
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
          <h3 className="tsu-title-hpv">
            Setup &amp; Schedule — {effectiveFormat}
          </h3>
          <p className="tsu-desc-hpv">
            Thiết lập cấu trúc giải, gán cặp đấu, lịch và trọng tài.
          </p>
        </div>
        <span className="tsu-badge-players">
          {availablePlayers.length} người chơi đã duyệt
        </span>
      </div>

      {loadingRows ? (
        <div className="tsu-mode-loading">Đang tải lịch đã setup...</div>
      ) : (
        <>
          <div className="tsu-stepper tsu-stepper-hpv">
            {setupSteps.map(({ key, label, step }) => {
              const stepKey =
                key === "structure"
                  ? "BRACKET"
                  : key === "players"
                    ? "PLAYERS"
                    : key === "schedule"
                      ? "SCHEDULE"
                      : "REFEREES";
              const finalized = stepStatuses?.[stepKey] === "FINALIZED";
              const dirty = stepStatuses?.[stepKey] === "DIRTY";
              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  className={`tsu-step-item ${laneStep === key ? "active" : ""}`}
                  onClick={() => {
                    setLaneStep(key);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLaneStep(key);
                    }
                  }}
                >
                  <span className="tsu-step-num">{step}</span>
                  <span className="tsu-step-label">{label}</span>
                  {finalized && (
                    <span className="tsu-step-label"> (Finalized)</span>
                  )}
                  {dirty && <span className="tsu-step-label"> (Dirty)</span>}
                  {step < 4 && <span className="tsu-step-connector" />}
                </div>
              );
            })}
          </div>
          <p className="tsu-stepper-hint">
            Nhấn vào từng bước trên để chuyển tab (Cấu trúc → Gán người chơi →
            Lịch → Trọng tài).
          </p>

          <div className="tsu-actions">
            {laneStep === "structure" && (
              <button
                className="tsu-btn tsu-btn-primary tsu-btn-hpv-primary"
                onClick={runAutoSetup}
                disabled={actionLoading.autoStructure || actionLoading.finalize}
              >
                {actionLoading.autoStructure ? "Đang tạo..." : "Auto Generate Bracket"}
              </button>
            )}
            {laneStep === "players" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                onClick={autoFillPlayersIntoStructure}
                disabled={!canEditPlayers || actionLoading.autoPlayers || actionLoading.finalize}
              >
                {actionLoading.autoPlayers ? "Đang điền..." : "Auto Fill Players"}
              </button>
            )}
            {laneStep === "schedule" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                onClick={autoScheduleCurrentMatches}
                disabled={!canEditSchedule || actionLoading.autoSchedule || actionLoading.finalize}
              >
                {actionLoading.autoSchedule ? "Đang xếp..." : "Auto Schedule"}
              </button>
            )}
            <button
              className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
              onClick={handleFinalizeCurrentStep}
              disabled={
                actionLoading.finalize ||
                (laneStep === "players" && !canEditPlayers) ||
                (laneStep === "schedule" && !canEditSchedule) ||
                (laneStep === "referee" && !canEditReferees)
              }
            >
              {actionLoading.finalize
                ? "Đang finalize..."
                : laneStep === "structure"
                  ? "Finalize Structure"
                  : laneStep === "players"
                    ? "Finalize Players"
                    : laneStep === "schedule"
                      ? "Finalize Schedule"
                      : "Finalize Referee"}
            </button>
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
              disabled={actionLoading.publish || laneStep !== "referee" || !canPublish}
            >
              {actionLoading.publish ? "Đang publish..." : "Save & Publish"}
            </button>
          </div>

          <div className="tsu-preview-wrap">
            {laneStep === "referee" ? (
              <>
                <div className="tsu-referee-step">
                <div className="tsu-preview-head">
                  <div>
                    <h3>4. Select Referee</h3>
                    <p>
                      Gán trọng tài cho từng ván đấu. Trọng tài phải được thêm
                      vào giải trước (tab Referees).
                    </p>
                    {tournamentReferees.length === 0 && (
                      <p className="tsu-referee-empty-hint">
                        Chưa có trọng tài nào. Vào tab Referees để thêm trọng
                        tài vào giải trước.
                      </p>
                    )}
                  </div>
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
              </>
          ) : (
              <div className="tsu-schedule-wrap">
                <div className="tsu-preview-head">
                  <div>
                    <h3>Schedule Preview</h3>
                    <p>
                      {laneStep === "structure" &&
                        "Bước Structure: chỉ dựng bracket (round, board, số match)."}
                      {laneStep === "players" &&
                        "Bước Add Players: dùng structure đã dựng để gán player vào từng match."}
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
    {resultModal.open && (
      <div className="tsu-result-overlay" role="dialog" aria-modal="true">
        <div className="tsu-result-modal">
          <div className="tsu-result-icon-wrap">
            {resultModal.type === "success" ? (
              <CheckCircle2 size={58} className="tsu-result-icon success" />
            ) : (
              <AlertCircle size={58} className="tsu-result-icon error" />
            )}
          </div>
          <h4 className="tsu-result-title">
            {resultModal.type === "success" ? "Thành công" : "Có lỗi xảy ra"}
          </h4>
          <p className="tsu-result-message">{resultModal.message}</p>
          <button
            className="tsu-btn tsu-btn-primary ui-btn ui-btn-primary"
            onClick={closeResultModal}
          >
            OK
          </button>
        </div>
      </div>
    )}
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
    alert(
      "Tính năng mời trọng tài qua email hiện không được sử dụng. Hãy chọn trọng tài trong danh sách để gán trực tiếp.",
    );
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
        axios.get(
          `${API_BASE}/api/tournaments?action=referees&id=${tournamentId}`,
          { withCredentials: true },
        ),
        axios.get(`${API_BASE}/api/tournaments?action=allReferees`, {
          withCredentials: true,
        }),
      ]);
      setAssignedReferees(
        Array.isArray(assignedRes?.data) ? assignedRes.data : [],
      );
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
        { withCredentials: true },
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
    if (
      !tournamentId ||
      !confirm("Bạn có chắc muốn gỡ trọng tài này khỏi giải?")
    )
      return;
    try {
      await axios.delete(
        `${API_BASE}/api/tournaments?action=removeReferee&id=${tournamentId}&refereeId=${refereeId}`,
        { withCredentials: true },
      );
      await fetchReferees();
    } catch (err) {
      alert(err?.response?.data?.message || "Gỡ trọng tài thất bại.");
    }
  };

  const handleCreateReferee = async () => {
    const { firstName, lastName, email, phoneNumber } = createForm;
    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !phoneNumber?.trim()
    ) {
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
        { withCredentials: true },
      );
      const created = res?.data?.referee;
      setShowCreateModal(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
      });
      await fetchReferees();
      if (
        created?.email &&
        tournamentId &&
        confirm(
          "Tạo trọng tài thành công. Bạn có muốn gửi lời mời tham gia giải này không?",
        )
      ) {
        try {
          const invitePayload = {
            email: String(created.email).trim(),
            refereeRole: assignRole,
          };
          const inviteRes = await axios.post(
            `${API_BASE}/api/tournaments?action=inviteReferee&id=${tournamentId}`,
            invitePayload,
            { withCredentials: true },
          );
          alert(inviteRes?.data?.message || "Đã gửi lời mời cho trọng tài.");
        } catch (inviteErr) {
          alert(
            inviteErr?.response?.data?.message ||
              "Gửi lời mời trọng tài thất bại.",
          );
        }
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Tạo trọng tài thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const assignedIds = new Set(assignedReferees.map((r) => r.refereeId));
  const availableToAssign = allReferees.filter(
    (r) => !assignedIds.has(r.refereeId),
  );

  const resolveAvatar = (avatar) => {
    if (!avatar) return "";
    const raw = String(avatar).trim();
    if (
      raw.startsWith("http") ||
      raw.startsWith("data:") ||
      raw.startsWith("blob:")
    )
      return raw;
    if (raw.startsWith("/")) return `${API_BASE}${raw}`;
    return `${API_BASE}/${raw}`;
  };

  return (
    <div className="td-referee-section">
      <div className="td-referees-header">
        <h3>Trọng tài giải đấu</h3>
      </div>

      {loading ? (
        <div className="td-referee-loading">
          Đang tải danh sách trọng tài...
        </div>
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
                        {r.firstName?.[0] || r.lastName?.[0] || "?"}
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
                <h4 className="referee-name">
                  {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
                </h4>
                <p className="referee-email">{r.email || "—"}</p>
                <span className="referee-role-badge">
                  {r.refereeRole || "Assistant"}
                </span>
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
              setCreateForm({
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                address: "",
              });
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
        <div
          className="modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Mời trọng tài vào giải</h3>
            <p className="td-modal-desc">
              Chọn một trọng tài trong hệ thống và gửi lời mời. Trọng tài chỉ
              được gán vào giải sau khi họ chấp nhận lời mời.
            </p>
            <div className="td-modal-body">
              <div className="td-referee-field">
                <label>Vai trò</label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                >
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
                      {[r.firstName, r.lastName].filter(Boolean).join(" ") ||
                        "—"}{" "}
                      - {r.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel ui-btn ui-btn-secondary"
                onClick={() => setShowAssignModal(false)}
              >
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
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal td-modal-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Tạo trọng tài mới</h3>
            <p className="td-modal-desc">
              Điền thông tin để tạo tài khoản trọng tài mới trong hệ thống.
            </p>
            <div className="td-modal-body">
              <div className="td-referee-form">
                <div className="td-referee-field">
                  <label>
                    Họ <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nguyễn"
                    value={createForm.firstName}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="td-referee-field">
                  <label>
                    Tên <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Văn A"
                    value={createForm.lastName}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </div>
                <div className="td-referee-field">
                  <label>
                    Email <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="referee@example.com"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
                <div className="td-referee-field">
                  <label>
                    Số điện thoại <span className="req">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={createForm.phoneNumber}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        phoneNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="td-referee-field td-referee-field-full">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    placeholder="Địa chỉ (không bắt buộc)"
                    value={createForm.address}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel ui-btn ui-btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
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
        <div
          className="modal-overlay"
          onClick={() => setShowInviteModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Mời trọng tài qua email</h3>
            <p className="td-modal-desc">
              Nhập email để gửi thư mời tham gia giải với vai trò trọng tài.
              (Pending sau 7 ngày sẽ tự động Expired)
            </p>
            <div className="td-modal-body">
              <div className="td-referee-field">
                <label>
                  Email <span className="req">*</span>
                </label>
                <input
                  type="email"
                  placeholder="referee@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="td-referee-field">
                <label>Vai trò</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="Chief">Chief</option>
                  <option value="Assistant">Assistant</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel ui-btn ui-btn-secondary"
                onClick={() => setShowInviteModal(false)}
              >
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
  const [refereeRole, setRefereeRole] = useState(
    invitation?.refereeRole || "Assistant",
  );
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
          Nhập email mới để thay thế lượt mời hiện tại (
          {invitation?.invitedEmail}).
        </p>
        <div className="td-modal-body">
          <div className="td-referee-field">
            <label>
              Email mới <span className="req">*</span>
            </label>
            <input
              type="email"
              placeholder="new-referee@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div className="td-referee-field">
            <label>Vai trò</label>
            <select
              value={refereeRole}
              onChange={(e) => setRefereeRole(e.target.value)}
            >
              <option value="Chief">Chief</option>
              <option value="Assistant">Assistant</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button
            className="btn-cancel ui-btn ui-btn-secondary"
            onClick={onClose}
          >
            Hủy
          </button>
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

const LeaderFeedbackTab = ({ tournamentId, user, role }) => (
  <TournamentFeedbackSection
    tournamentId={tournamentId}
    user={user}
    role={role || "TOURNAMENTLEADER"}
  />
);

const ReportsTab = ({ tournamentId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  const loadReports = React.useCallback(
    async (overrideStatus) => {
      if (!tournamentId) return;
      const status = overrideStatus ?? statusFilter;
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        params.set("tournamentId", tournamentId);
        if (status) params.set("status", status);
        const res = await axios
          .get(`${API_BASE}/api/leader/reports?${params.toString()}`, {
            withCredentials: true,
          })
          .catch(() => null);
        setItems(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setError("Không thể tải danh sách report.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [tournamentId, statusFilter],
  );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDecision = async (reportId, valid) => {
    const note = window.prompt(
      valid
        ? "Nhập ghi chú/hình phạt (bắt buộc, hiển thị trong phản hồi cho player):"
        : "Nhập lý do xác nhận KHÔNG VI PHẠM (bắt buộc):",
      "",
    );
    if (!note || !note.trim()) {
      alert("Vui lòng nhập nội dung phản hồi trước khi gửi.");
      return;
    }
    try {
      await axios.put(
        `${API_BASE}/api/leader/reports`,
        { reportId, valid, note },
        { withCredentials: true },
      );
      await loadReports();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Không thể cập nhật trạng thái report.";
      alert(msg);
    }
  };

  const formatTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return String(value);
    }
  };

  const typeLabel = (type) => {
    switch (type) {
      case "Cheating":
        return "Gian lận";
      case "Misconduct":
        return "Hành vi xấu";
      case "TechnicalIssue":
        return "Lỗi kỹ thuật";
      default:
        return type || "Khác";
    }
  };

  return (
    <div className="td-reports-card">
      <div className="td-reports-header">
        <div>
          <h3>Báo cáo vi phạm</h3>
          <p>Danh sách report liên quan đến các trận trong giải này.</p>
        </div>

        <div className="td-reports-filter">
          <select
            value={statusFilter}
            onChange={(e) => {
              const next = e.target.value;
              setStatusFilter(next);
              loadReports(next);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Đang chờ xử lý</option>
            <option value="Investigating">Đang điều tra</option>
            <option value="Resolved">Đã xử lý</option>
            <option value="Dismissed">Đã từ chối</option>
          </select>
        </div>
      </div>

      <div className="td-reports-table-wrapper">
        {loading ? (
          <div className="td-state-card">Đang tải danh sách report...</div>
        ) : error ? (
          <div className="td-state-card">{error}</div>
        ) : items.length === 0 ? (
          <div className="td-state-card">Chưa có report nào cho giải này.</div>
        ) : (
          <table className="td-reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại</th>
                <th>Người tố cáo</th>
                <th>Trận</th>
                <th>Mô tả</th>
                <th>Bằng chứng</th>
                <th>Trạng thái</th>
                <th>Tạo lúc</th>
                <th className="right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.reportId}>
                  <td>{r.reportId}</td>
                  <td>{typeLabel(r.type)}</td>
                  <td>{r.reporterId ?? "—"}</td>
                  <td>{r.matchId ?? "—"}</td>
                  <td className="td-reports-desc">
                    {r.description?.length > 80
                      ? `${r.description.slice(0, 80)}…`
                      : r.description}
                  </td>
                  <td>
                    {r.evidenceUrl ? (
                      <a href={r.evidenceUrl} target="_blank" rel="noreferrer">
                        Xem
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{r.status}</td>
                  <td>{formatTime(r.createAt)}</td>
                  <td className="right">
                    {r.status === "Pending" || r.status === "Investigating" ? (
                      <div className="td-reports-actions">
                        <button
                          type="button"
                          className="td-btn-small td-btn-success"
                          onClick={() => handleDecision(r.reportId, true)}
                        >
                          Xác nhận vi phạm
                        </button>
                        <button
                          type="button"
                          className="td-btn-small td-btn-danger"
                          onClick={() => handleDecision(r.reportId, false)}
                        >
                          Xác nhận không vi phạm
                        </button>
                      </div>
                    ) : (
                      <span className="td-reports-status-done">
                        {r.status === "Resolved" ? "Đã phạt" : "Đã từ chối"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;

