<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/css/tournament-leader.css';
=======
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
>>>>>>> Dung
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Edit,
  XCircle,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import "../../assets/css/tournament-leader/TournamentDetail.css";

<<<<<<< HEAD
const Badge = ({ children, variant }) => (
  <span className={`td-badge td-badge-${variant}`}>
    {children}
  </span>
);

const StatCard = ({ label, value, icon, accent }) => (
  <div className="td-stat-card">
    <div className={`td-stat-icon ${accent}`}>
      {icon}
    </div>
    <div className="td-stat-content">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
);
=======
const fmt = (raw) => {
  if (!raw) return "—";
  return raw.split(" ")[0].replaceAll("-", "/");
};

const STATUS_LABELS = {
  Pending: "Chờ duyệt",
  Rejected: "Bị từ chối",
  Delayed: "Hoãn",
  Ongoing: "Đang diễn ra",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
  Upcoming: "Sắp diễn ra",
  Finished: "Đã kết thúc",
  Paid: "Đã thanh toán",
  Assistant: "Phó trọng tài",
  Chief: "Trọng tài chính",
  Open: "Mở",
  Closed: "Đã đóng",
  Resolved: "Đã xử lý",
  InProgress: "Đang xử lý",
};

const FORMAT_LABELS = {
  RoundRobin: "Vòng tròn",
  KnockOut: "Loại trực tiếp",
  Hybrid: "Kết hợp",
};

const getStatusLabel = (s) => STATUS_LABELS[s] || s;
const getFormatLabel = (f) => FORMAT_LABELS[f] || f;

const StatusBadge = ({ status }) => {
  const key = (status || "").toLowerCase();
  return <span className={`td-status-badge ${key}`}>{getStatusLabel(status)}</span>;
};

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */
>>>>>>> Dung

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
    const fetchTournament = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/ctms/api/tournaments?id=${id}`, {
          withCredentials: true
        });
        setTournament(res.data);
      } catch (err) {
        console.error('Error loading tournament:', err);
        setTournament(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
=======
    axios
      .get(`http://localhost:8080/ctms/api/tournaments?id=${id}`, {
        withCredentials: true,
      })
      .then((res) => setTournament(res.data))
      .catch(() => setTournament(null))
      .finally(() => setLoading(false));
>>>>>>> Dung
  }, [id]);

  const tabs = [
    { id: "overview", label: "Tổng quan" },
    { id: "participants", label: "Người chơi" },
    { id: "matches", label: "Trận đấu" },
    { id: "bracket", label: "Nhánh đấu" },
    { id: "referees", label: "Trọng tài" },
    { id: "reports", label: "Báo cáo" },
  ];

  if (loading) {
<<<<<<< HEAD
  return <div className="td-page-wrapper">Loading tournament...</div>;
  }

  if (!tournament) {
    return <div className="td-page-wrapper">Tournament not found</div>;
  }

  return (
    <div className="td-page-wrapper">

      {/* HERO */}
      <section className="td-hero">
        <div className="td-hero-content">
          <div className="td-hero-badges">
            <Badge variant="teal">{tournament.format}</Badge>
            <Badge variant="orange">{tournament.status}</Badge>
          </div>

          <h1 className="td-hero-title">
            {tournament.tournamentName}
          </h1>

          <div className="td-hero-meta">
            <div className="td-meta-item">
              <Calendar size={18} />
              <span>
                {tournament.startDate} — {tournament.endDate}
              </span>
            </div>
            <div className="td-meta-item">
              <MapPin size={18} />
              <span>
                {tournament.location}
              </span>
            </div>
          </div>
        </div>

        <div className="td-hero-actions">
          <button className="td-btn-primary">
            <Edit2 size={18} />
            Edit Tournament
          </button>
          <button className="td-btn-danger">
            <Trash2 size={20} />
          </button>
        </div>
      </section>

      {/* STATS */}
      <section className="td-stats-row">
        <StatCard
            label="Participants"
            value={`${tournament.currentPlayers}/${tournament.maxPlayer}`}
            icon={<Users />}
            accent="indigo"
          />
        <StatCard label="Total Matches" value="256" icon={<GitBranch />} accent="purple" />
        <StatCard label="Active Round" value="03" icon={<Trophy />} accent="amber" />
      </section>

        {/* Tab Interface */}
      <section className="td-tabs-section">
        <div className="td-tabs-header">
            {tabs.map((tab, idx) => (
            <button
                key={tab.label}
                onClick={() => setActiveTab(idx)}
                className={`td-tab-button ${activeTab === idx ? 'active' : ''}`}
            >
                <span className="td-tab-icon">
                {tab.icon}
                </span>
                <span className="td-tab-label">{tab.label}</span>
=======
    return (
      <div className="td-page">
        <div className="td-container">
          <p style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
            Đang tải giải đấu…
          </p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="td-page">
        <div className="td-container">
          <p style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
            Không tìm thấy giải đấu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="td-page">
      <div className="td-container">
        {/* ── Header Card ── */}
        <div className="td-card td-header">
          <div className="td-header-layout">
            <div className="td-header-left">
              <div className="td-header-title-row">
                <h1>{tournament.tournamentName}</h1>
                <StatusBadge status={tournament.status} />
              </div>

              <div className="td-header-meta">
                <span className="td-header-meta-item">
                  <Trophy size={16} /> {getFormatLabel(tournament.format)}
                </span>
                <span className="td-header-meta-item">
                  <MapPin size={16} /> {tournament.location || "Chưa xác định"}
                </span>
                <span className="td-header-meta-item">
                  <Calendar size={16} /> {fmt(tournament.startDate)} —{" "}
                  {fmt(tournament.endDate)}
                </span>
                <span className="td-header-meta-item">
                  <Clock size={16} /> Hạn đăng ký:{" "}
                  {fmt(tournament.registrationDeadline)}
                </span>
                <span className="td-header-meta-item">
                  <DollarSign size={16} /> Entry: ${tournament.entryFee ?? 0}
                </span>
                <span className="td-header-meta-item">
                  <Trophy size={16} /> Prize Pool: $
                  {Number(tournament.prizePool ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="td-header-right">
              <button
                className="td-btn td-btn-primary"
                onClick={() => navigate(`/tournaments/edit/${id}`)}
              >
                <Edit size={16} /> Chỉnh sửa giải
              </button>
              <button className="td-btn td-btn-secondary">
                <XCircle size={16} /> Hủy giải đấu
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="td-tabs-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`td-tab-link ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
>>>>>>> Dung
            </button>
          ))}
        </div>

<<<<<<< HEAD
        {/* Tab Content */}
        <div className="td-tab-content">
            {activeTab === 0 && <OverviewTab tournament={tournament} />}
            {activeTab === 1 && <PlayersTab tournamentId={tournament.tournamentId} />}
            {activeTab === 2 && <BracketTab />}
            {activeTab === 3 && <RefereeTab />}
            {activeTab === 4 && <ReportsTab />}
=======
        {/* ── Content ── */}
        <div className="td-tab-panel" key={activeTab}>
          {activeTab === "overview" && (
            <OverviewTab tournament={tournament} />
          )}
          {activeTab === "participants" && (
            <ParticipantsTab tournamentId={tournament.tournamentId} />
          )}
          {activeTab === "matches" && <MatchesTab />}
          {activeTab === "bracket" && <BracketTab />}
          {activeTab === "referees" && <RefereesTab tournamentId={tournament.tournamentId} />}
          {activeTab === "reports" && <ReportsTab tournamentId={tournament.tournamentId} />}
>>>>>>> Dung
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Overview Tab
   ═══════════════════════════════════════════ */

const OverviewTab = ({ tournament }) => {
  const [currentImage, setCurrentImage] = useState(0);

  const images =
    Array.isArray(tournament.tournamentImages) && tournament.tournamentImages.length > 0
      ? tournament.tournamentImages
      : tournament.tournamentImage
        ? [tournament.tournamentImage]
        : [
            "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=1000",
          ];

  const nextImage = () => setCurrentImage((p) => (p + 1) % images.length);
  const prevImage = () =>
    setCurrentImage((p) => (p - 1 + images.length) % images.length);

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

  return (
<<<<<<< HEAD
    <div className="td-overview-tab">

      {/* Top Stats */}
      <div className="td-overview-stats">
        <div className="td-overview-card">
          <span className="td-overview-label">Total Players</span>
          <strong className="td-overview-value">{tournament.maxPlayer}</strong>
        </div>

        <div className="td-overview-card">
          <span className="td-overview-label">Rounds</span>
          <strong className="td-overview-value">7</strong>
        </div>

        <div className="td-overview-card">
          <span className="td-overview-label">Prize Pool</span>
          <strong className="td-overview-value">${tournament.prizePool}</strong>
        </div>

        <div className="td-overview-card highlight">
          <span className="td-overview-label">Status</span>
          <strong className="td-overview-value">{tournament.status}</strong>
        </div>
      </div>

      {/* Tournament Description */}
      <div className="td-overview-section">
        <h3>About Tournament</h3>
        <p>
          {tournament.description}
        </p>
      </div>

      {/* Schedule */}
      <div className="td-overview-section">
        <h3>Schedule Overview</h3>

        <ul className="td-schedule-list">
          <li>
            <span>Registration Deadline</span>
            <strong>{tournament.registrationDeadline}</strong>
          </li>
          <li>
            <span>Opening Ceremony</span>
            <strong>15 March 2026</strong>
          </li>
          <li>
            <span>Final Round</span>
            <strong>22 March 2026</strong>
          </li>
        </ul>
=======
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="td-card td-gallery">
          <div className="td-gallery-wrapper">
            <img src={images[currentImage]} alt="Giải đấu" />
            <div className="td-gallery-overlay" />

            {images.length > 1 && (
              <>
                <div className="td-gallery-dots">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      className={`td-gallery-dot ${idx === currentImage ? "active" : ""}`}
                      onClick={() => setCurrentImage(idx)}
                    />
                  ))}
                </div>
                <button className="td-gallery-arrow left" onClick={prevImage}>
                  <ChevronLeft size={24} />
                </button>
                <button className="td-gallery-arrow right" onClick={nextImage}>
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <div className="td-gallery-edit-btns">
              <button className="td-gallery-edit-btn">
                <Edit size={16} />
              </button>
              <button className="td-gallery-edit-btn danger">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info + Timeline */}
      <div className="td-overview-layout">
        <div className="td-overview-left">
          {/* Tournament Info */}
          <div className="td-card td-card-pad">
            <h3 className="td-card-title">
              <AlertCircle size={20} /> Thông tin giải đấu
            </h3>
            <p className="td-info-text">
              {tournament.description || "Chưa có mô tả."}
            </p>
            {tournament.rules && (
              <div className="td-info-columns">
                <div>
                  <h4>Luật &amp; Quy định</h4>
                  <ul>
                    {tournament.rules
                      .split("\n")
                      .filter(Boolean)
                      .map((rule, i) => (
                        <li key={i}>{rule}</li>
                      ))}
                  </ul>
                </div>
                {tournament.notes && (
                  <div>
                    <h4>Lưu ý quan trọng</h4>
                    <ul>
                      {tournament.notes
                        .split("\n")
                        .filter(Boolean)
                        .map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Registration Progress */}
          <div className="td-card td-card-pad">
            <h3 className="td-card-title">Tiến độ đăng ký</h3>
            <div className="td-reg-progress-header">
              <span>{tournament.currentPlayers} đã đăng ký</span>
              <span>{tournament.maxPlayer} sức chứa</span>
            </div>
            <div className="td-reg-progress-bar">
              <div
                className="td-reg-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="td-reg-progress-footer">
              {daysUntilRegClose > 0 ? (
                <span>
                  Đóng đăng ký sau{" "}
                  <strong>{daysUntilRegClose} days</strong>
                </span>
              ) : (
                <span>Đã đóng đăng ký</span>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="td-card td-card-pad" style={{ height: "fit-content" }}>
          <h3 className="td-card-title">
            <Clock size={20} /> Mốc thời gian
          </h3>
          <div className="td-timeline-vertical">
            {timeline.map((item, idx) => (
              <div key={idx} className="td-timeline-item">
                <div className={`td-timeline-dot ${item.status}`} />
                <h4 className={item.status === "upcoming" ? "dim" : ""}>
                  {item.label}
                </h4>
                <p>{item.date}</p>
              </div>
            ))}
          </div>
        </div>
>>>>>>> Dung
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Participants Tab
   ═══════════════════════════════════════════ */

const ParticipantsTab = ({ tournamentId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(
        `http://localhost:8080/ctms/api/tournaments?action=players&id=${tournamentId}`,
        { withCredentials: true }
      )
      .then((res) => setPlayers(res.data || []))
      .catch((err) => console.error("Lỗi tải danh sách người chơi:", err))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  const filtered = players.filter((p) => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    return (
      name.includes(searchTerm.toLowerCase()) ||
      String(p.rank ?? "").includes(searchTerm)
    );
  });

  const getInitials = (first, last) =>
    `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();

  return (
<<<<<<< HEAD
    <div className="td-players-tab">
      <div className="td-players-header">
        <div className="td-players-search">
          <Search className="td-players-search-icon" size={18} />
=======
    <div className="td-card" style={{ overflow: "hidden" }}>
      {/* Toolbar */}
      <div className="td-toolbar">
        <div className="td-search-box">
          <Search size={16} />
>>>>>>> Dung
          <input
            type="text"
            placeholder="Tìm kiếm người chơi…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
<<<<<<< HEAD

        <div className="td-players-actions">
          <button className="td-btn td-btn-secondary">
            <Filter size={16} /> Filter
          </button>
          <button className="td-btn td-btn-primary">
            <Plus size={18} /> Add New Player
=======
        <div className="td-toolbar-actions">
          <button className="td-btn td-btn-secondary td-btn-sm">
            <Filter size={14} /> Lọc
          </button>
          <button className="td-btn td-btn-secondary td-btn-sm">
            <Download size={14} /> Xuất file
          </button>
          <button className="td-btn td-btn-primary td-btn-sm">
            <Plus size={14} /> Thêm người chơi
>>>>>>> Dung
          </button>
        </div>
      </div>

<<<<<<< HEAD
      <div className="td-players-table-wrapper">
        <table className="td-players-table">
          <thead>
            <tr>
              <th>Player Identity</th>
              <th>FIDE Rating</th>
              <th>Registration</th>
              <th>Check-In</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          
        </table>
      </div>
    </div>
  );
};

const BracketTab = () => {
  return (
    <div className="td-bracket-grid">
      
      {/* LEFT – BRACKET */}
      <div className="td-bracket-card">
        <div className="td-bracket-header">
          <h3>Live Bracket Visualization</h3>
          <button className="td-bracket-fullscreen">
            Fullscreen <ArrowRight size={14} />
          </button>
        </div>

        <div className="td-bracket-body">
          
          <div className="td-bracket-column">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="td-bracket-item">
                <div className="td-line primary"></div>
                <div className="td-line secondary"></div>
              </div>
            ))}
          </div>

          <div className="td-bracket-column mid">
            {[1, 2].map(i => (
              <div key={i} className="td-bracket-item mid">
                <div className="td-line primary"></div>
                <div className="td-line secondary"></div>
              </div>
            ))}
          </div>

          <div className="td-bracket-winner">
            <div className="td-winner-card">
              <Trophy size={32} />
              <div className="td-line winner"></div>
            </div>
          </div>

        </div>

        {/* HOVER OVERLAY */}
        <div className="td-bracket-overlay">
          <div className="td-overlay-card">
            <GitBranch size={48} />
            <h4>Bracket Interactive</h4>
            <p>
              The bracket is currently view-only. Start Round 4 to enable real-time updates.
            </p>
            <button>Enter Management View</button>
          </div>
        </div>
      </div>

      {/* RIGHT – MATCH LIST */}
      <div className="td-match-list">
        <div className="td-match-header">
          <h3>Featured Matchups</h3>
          <Badge variant="blue">3 Live Matches</Badge>
        </div>

      </div>

=======
      {loading ? (
        <p style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          Đang tải người chơi…
        </p>
      ) : (
        <>
          <div className="td-table-wrap">
            <table className="td-table">
              <thead>
                <tr>
                  <th>Tên người chơi</th>
                  <th>ELO</th>
                  <th>Thanh toán</th>
                  <th>Ngày đăng ký</th>
                  <th>Trạng thái</th>
                  <th className="right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "3rem",
                        color: "#9ca3af",
                      }}
                    >
                      Không tìm thấy người chơi
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.participantId}>
                      <td>
                        <span className="td-player-avatar">
                          {getInitials(p.firstName, p.lastName)}
                        </span>
                        <span className="td-player-name-col">
                          {p.firstName} {p.lastName}
                          <br />
                          <span className="email">{p.email}</span>
                        </span>
                      </td>
                      <td className="td-rating">{p.rank ?? "—"}</td>
                      <td>
                        <StatusBadge status={p.isPaid ? "Paid" : "Pending"} />
                      </td>
                      <td style={{ color: "#6b7280" }}>
                        {fmt(p.registrationDate)}
                      </td>
                      <td>
                        {p.status === "Active" ? (
                          <span className="td-approval approved">
                            <CheckCircle size={14} /> Đã duyệt
                          </span>
                        ) : (
                          <span className="td-approval pending">
                            <Clock size={14} /> {p.status}
                          </span>
                        )}
                      </td>
                      <td className="right">
                        <div className="td-icon-actions">
                          <button className="td-icon-btn">
                            <Eye size={16} />
                          </button>
                          <button className="td-icon-btn danger">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="td-table-footer">
            <span>
              Hiển thị {filtered.length}/{players.length} người chơi
            </span>
            <div className="td-table-footer-btns">
              <button className="td-page-btn" disabled>
                Trước
              </button>
              <button className="td-page-btn">Sau</button>
            </div>
          </div>
        </>
      )}
>>>>>>> Dung
    </div>
  );
};

<<<<<<< HEAD
const RefereeTab = () => {
  return (
    <div className="td-referee-grid">
      

      {/* ADD REFEREE */}
      <div className="td-referee-add">
        <div className="td-add-icon">
          <UserPlus size={32} />
=======
/* ═══════════════════════════════════════════
   Matches Tab
   ═══════════════════════════════════════════ */

const MatchesTab = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
    <div className="td-card td-matches-header">
      <div className="td-round-nav">
        <h3>Vòng 1</h3>
        <div className="td-round-arrows">
          <button className="td-round-arrow-btn">
            <ChevronLeft size={16} />
          </button>
          <button className="td-round-arrow-btn">
            <ChevronRight size={16} />
          </button>
>>>>>>> Dung
        </div>
      </div>
<<<<<<< HEAD
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

        <tbody>
          
        </tbody>
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
          Need deep insights into player performance or fair play metrics?
          Our AI-driven engine can generate a specialized 30-page audit
          in under 5 minutes.
        </p>

        <button className="td-audit-btn">
          Run Advanced Audit <ArrowRight size={14} />
=======
      <div className="td-toolbar-actions">
        <button className="td-btn td-btn-secondary td-btn-sm">
          <Users size={14} /> Tự động phân công trọng tài
        </button>
        <button className="td-btn td-btn-primary td-btn-sm">
          <Edit size={14} /> Nhập kết quả
>>>>>>> Dung
        </button>
      </div>
    </div>

    <div className="td-card" style={{ overflow: "hidden" }}>
      <div className="td-table-wrap">
        <table className="td-table">
          <thead>
            <tr>
              <th>Bàn</th>
              <th>Trắng</th>
              <th className="center">Kết quả</th>
              <th>Đen</th>
              <th>Trọng tài</th>
              <th className="right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((board) => (
              <tr key={board}>
                <td className="mono">#{board}</td>
                <td className="bold">
                  Kỳ thủ A{board}{" "}
                  <span className="td-rating-sub">(2750)</span>
                </td>
                <td className="center td-result-cell">
                  {board % 2 === 0 ? "1 - 0" : "½ - ½"}
                </td>
                <td className="bold">
                  Kỳ thủ B{board}{" "}
                  <span className="td-rating-sub">(2745)</span>
                </td>
                <td>
                  {board === 3 ? (
                    <span className="td-unassigned">
                      <AlertCircle size={12} /> Chưa phân công
                    </span>
                  ) : (
                    <span style={{ color: "#4b5563" }}>Trọng tài Smith</span>
                  )}
                </td>
                <td className="right">
                  <button className="td-btn td-btn-ghost td-btn-sm">
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <p
      style={{
        textAlign: "center",
        color: "#9ca3af",
        fontSize: 14,
        padding: "0.5rem",
      }}
    >
      Dữ liệu trận đấu sẽ hiển thị khi các vòng được tạo từ backend.
    </p>
  </div>
);

/* ═══════════════════════════════════════════
   Referees Tab
   ═══════════════════════════════════════════ */

const RefereesTab = ({ tournamentId }) => {
  const [referees, setReferees] = useState([]);
  const [allReferees, setAllReferees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    refereeId: "",
    refereeRole: "Assistant",
    note: "",
  });
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  const loadReferees = () => {
    setLoading(true);
    axios
      .get(
        `http://localhost:8080/ctms/api/tournaments?action=referees&id=${tournamentId}`,
        { withCredentials: true }
      )
      .then((res) => setReferees(res.data || []))
      .catch((err) => console.error("Lỗi tải trọng tài:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReferees();
  }, [tournamentId]);

  const loadAllReferees = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/ctms/api/tournaments?action=allReferees",
        {
          withCredentials: true,
        }
      );
      setAllReferees(res.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách trọng tài:", err);
    }
  };

  useEffect(() => {
    loadAllReferees();
  }, []);

  const getInitials = (first, last) =>
    `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();

  const assignedSet = new Set(referees.map((r) => r.refereeId));
  const availableReferees = allReferees.filter((r) => !assignedSet.has(r.refereeId));

  const handleAssign = async () => {
    if (!form.refereeId) {
      alert("Vui lòng chọn trọng tài.");
      return;
    }
    setAssigning(true);
    try {
      const res = await axios.post(
        `http://localhost:8080/ctms/api/tournaments?action=assignReferee&id=${tournamentId}`,
        {
          refereeId: Number(form.refereeId),
          refereeRole: form.refereeRole,
          note: form.note,
        },
        { withCredentials: true }
      );
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Assign referee failed");
      }
      setAssignOpen(false);
      setForm({ refereeId: "", refereeRole: "Assistant", note: "" });
      loadReferees();
    } catch (err) {
      console.error("Phân công trọng tài thất bại:", err);
      alert("Phân công trọng tài thất bại.");
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateReferee = async () => {
    if (
      !createForm.firstName.trim() ||
      !createForm.lastName.trim() ||
      !createForm.email.trim() ||
      !createForm.phoneNumber.trim()
    ) {
      alert("Vui lòng nhập đủ Họ, Tên, Email và SĐT.");
      return;
    }
    setCreating(true);
    try {
      const res = await axios.post(
        "http://localhost:8080/ctms/api/tournaments?action=createReferee",
        createForm,
        { withCredentials: true }
      );
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Create referee failed");
      }

      const newRef = res.data?.referee;
      setCreateOpen(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
      });
      await loadAllReferees();

      if (newRef?.refereeId) {
        setAssignOpen(true);
        setForm((prev) => ({ ...prev, refereeId: String(newRef.refereeId) }));
      }

      alert(
        "Đã tạo trọng tài mới thành công.\nMật khẩu mặc định: 12345."
      );
    } catch (err) {
      console.error("Tạo trọng tài thất bại:", err);
      alert("Tạo trọng tài thất bại. Email hoặc SĐT có thể đã tồn tại.");
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (refereeId) => {
    if (!window.confirm("Bạn có chắc muốn gỡ trọng tài này khỏi giải?")) return;
    try {
      await axios.delete(
        `http://localhost:8080/ctms/api/tournaments?action=removeReferee&id=${tournamentId}&refereeId=${refereeId}`,
        { withCredentials: true }
      );
      loadReferees();
    } catch (err) {
      console.error("Gỡ trọng tài thất bại:", err);
      alert("Gỡ trọng tài thất bại.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="td-referees-header">
        <h3>Trọng tài giải đấu</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="td-btn td-btn-secondary td-btn-sm"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={14} /> Thêm trọng tài mới
          </button>
          <button
            className="td-btn td-btn-primary td-btn-sm"
            onClick={() => setAssignOpen(true)}
          >
            <Plus size={14} /> Phân công trọng tài
          </button>
        </div>
      </div>

      {createOpen && (
        <div className="td-card" style={{ padding: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <input
              value={createForm.firstName}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, firstName: e.target.value }))
              }
              placeholder="Họ *"
              style={{
                height: 40,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
            />
            <input
              value={createForm.lastName}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, lastName: e.target.value }))
              }
              placeholder="Tên *"
              style={{
                height: 40,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
            />
            <input
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, email: e.target.value }))
              }
              placeholder="Email *"
              style={{
                height: 40,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
            />
            <input
              value={createForm.phoneNumber}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, phoneNumber: e.target.value }))
              }
              placeholder="SĐT *"
              style={{
                height: 40,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
            />
          </div>

          <textarea
            value={createForm.address}
            onChange={(e) =>
              setCreateForm((s) => ({ ...s, address: e.target.value }))
            }
            placeholder="Địa chỉ (không bắt buộc)"
            rows={2}
            style={{
              width: "100%",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: 10,
              marginBottom: 12,
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              className="td-btn td-btn-secondary td-btn-sm"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Hủy
            </button>
            <button
              className="td-btn td-btn-primary td-btn-sm"
              onClick={handleCreateReferee}
              disabled={creating}
            >
              {creating ? "Đang tạo..." : "Tạo trọng tài"}
            </button>
          </div>
        </div>
      )}

      {assignOpen && (
        <div className="td-card" style={{ padding: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 180px",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <select
              value={form.refereeId}
              onChange={(e) => setForm((s) => ({ ...s, refereeId: e.target.value }))}
              style={{
                height: 40,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
            >
              <option value="">Chọn trọng tài...</option>
              {availableReferees.map((r) => (
                <option key={r.refereeId} value={r.refereeId}>
                  {r.firstName} {r.lastName} ({r.email})
                </option>
              ))}
            </select>

            <select
              value={form.refereeRole}
              onChange={(e) => setForm((s) => ({ ...s, refereeRole: e.target.value }))}
              style={{
                height: 40,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: "0 10px",
              }}
            >
              <option value="Assistant">Phó trọng tài</option>
              <option value="Chief">Trọng tài chính</option>
            </select>
          </div>

          <textarea
            value={form.note}
            onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
            placeholder="Ghi chú (không bắt buộc)..."
            rows={2}
            style={{
              width: "100%",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: 10,
              marginBottom: 12,
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              className="td-btn td-btn-secondary td-btn-sm"
              onClick={() => setAssignOpen(false)}
            >
              Hủy
            </button>
            <button
              className="td-btn td-btn-primary td-btn-sm"
              onClick={handleAssign}
              disabled={assigning}
            >
              {assigning ? "Đang phân công..." : "Xác nhận phân công"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          Đang tải trọng tài…
        </p>
      ) : referees.length === 0 ? (
        <div className="td-card" style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
          Chưa có trọng tài nào được phân công cho giải này.
        </div>
      ) : (
        <div className="td-card" style={{ overflow: "hidden" }}>
          <div className="td-table-wrap">
            <table className="td-table">
              <thead>
                <tr>
                  <th>Trọng tài</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Ngày phân công</th>
                  <th>Công việc</th>
                  <th className="right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {referees.map((ref) => (
                  <tr key={ref.refereeId}>
                    <td>
                      <span className="td-player-avatar">
                        {getInitials(ref.firstName, ref.lastName)}
                      </span>
                      <span className="td-player-name-col">
                        {ref.firstName} {ref.lastName}
                        {ref.note && (
                          <>
                            <br />
                            <span className="email">{ref.note}</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td style={{ color: "#4b5563" }}>{ref.email}</td>
                    <td>
                      <StatusBadge status={ref.refereeRole} />
                    </td>
                    <td style={{ color: "#6b7280" }}>{fmt(ref.assignedAt)}</td>
                    <td>
                      <div className="td-workload-cell">
                        <div className="td-workload-bar">
                          <div
                            className="td-workload-fill"
                            style={{ width: `${Math.min((ref.matchCount / 10) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="td-workload-label">
                          {ref.matchCount} trận
                        </span>
                      </div>
                    </td>
                    <td className="right">
                      <button
                        className="td-text-link danger"
                        onClick={() => handleRemove(ref.refereeId)}
                      >
                        Gỡ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Reports Tab
   ═══════════════════════════════════════════ */

const ReportsTab = ({ tournamentId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(
        `http://localhost:8080/ctms/api/tournaments?action=reports&id=${tournamentId}`,
        { withCredentials: true }
      )
      .then((res) => setReports(res.data || []))
      .catch((err) => console.error("Lỗi tải báo cáo:", err))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  return (
    <div className="td-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
        <h3 style={{ fontWeight: 700, color: "#1f2937", margin: 0 }}>
          Báo cáo vi phạm
        </h3>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          Đang tải báo cáo…
        </p>
      ) : reports.length === 0 ? (
        <p style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
          Không có báo cáo nào cho giải này.
        </p>
      ) : (
        <div className="td-table-wrap">
          <table className="td-table">
            <thead>
              <tr>
                <th>Mã báo cáo</th>
                <th>Người báo cáo</th>
                <th>Người bị tố cáo</th>
                <th>Loại vi phạm</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th className="right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.reportId}>
                  <td className="mono">R-{String(r.reportId).padStart(3, "0")}</td>
                  <td>{r.reporterName}</td>
                  <td className="bold">{r.accusedName || "—"}</td>
                  <td>
                    <StatusBadge status={r.type} />
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ color: "#6b7280" }}>{fmt(r.createAt)}</td>
                  <td className="right">
                    <button className="td-btn td-btn-secondary td-btn-sm">
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Bracket Tab (placeholder)
   ═══════════════════════════════════════════ */

const BracketTab = () => (
  <div className="td-bracket-placeholder">
    <Trophy size={48} />
    <h3>Mô phỏng nhánh đấu</h3>
    <p>Nhánh đấu sẽ được tạo sau khi đóng đăng ký.</p>
    <button className="td-btn td-btn-secondary">
      Cấu hình nhánh đấu
    </button>
  </div>
);

export default TournamentDetail;
