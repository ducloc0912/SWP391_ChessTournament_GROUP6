import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  Clock,
  PlayCircle,
  CheckCircle,
  Search,
  Plus,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Eye,
  Edit2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import MainHeader from "../../component/common/MainHeader";
import FilterSection from "../../component/tournament/FilterSection";
import "../../assets/css/tokens.css";
import "../../assets/css/components/card.css";
import "../../assets/css/components/button.css";
import "../../assets/css/tournament-leader/TournamentList.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/ctms";

const EDITABLE_STATUSES = ["Pending", "Rejected", "Delayed", "Cancelled"];
const CANCELLED_ABLE = ["Pending", "Ongoing", "Delayed"];
const PAGE_SIZE = 6;

const STATUS_LABELS = {
  Pending: "Chờ duyệt",
  Rejected: "Bị từ chối",
  Delayed: "Hoãn",
  Ongoing: "Đang diễn ra",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
  Upcoming: "Sắp diễn ra",
  Finished: "Đã kết thúc",
};

const FORMAT_LABELS = {
  RoundRobin: "Vòng tròn",
  KnockOut: "Loại trực tiếp",
  Hybrid: "Kết hợp",
};

const getStatusLabel = (s) => STATUS_LABELS[s] || s;
const getFormatLabel = (f) => FORMAT_LABELS[f] || f;
const BACKEND_ORIGIN = "http://localhost:8080";

const resolveTournamentImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${BACKEND_ORIGIN}${url}`;
  }
  return `${BACKEND_ORIGIN}/ctms/${url}`;
};

const TournamentList = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tournaments, setTournaments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/tournaments`, {
        withCredentials: true,
      });
      if (Array.isArray(res.data)) {
        setTournaments(res.data);
      } else {
        setTournaments([]);
      }
    } catch (err) {
      console.error(err);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const filteredTournaments = useMemo(() => {
    if (!Array.isArray(tournaments)) return [];
    return tournaments.filter((t) => {
      const matchesSearch =
        t.tournamentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter ? t.status === statusFilter : true;
      const matchesType = typeFilter ? t.format === typeFilter : true;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tournaments, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / PAGE_SIZE));
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
    setTypeFilter("");
  };

  const handleOpenConfirm = (tournament) => {
    setSelectedTournament(tournament);
    setCancelReason("");
    setShowConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy giải!");
      return;
    }
    try {
      await axios.delete(`${API_BASE}/api/tournaments`, {
        params: { id: selectedTournament.tournamentId, reason: cancelReason },
        withCredentials: true,
      });
      setShowConfirm(false);
      setSelectedTournament(null);
      setCancelReason("");
      alert("Hủy giải thành công!");
      fetchTournaments();
    } catch (err) {
      console.error(err);
      alert("Hủy giải thất bại!");
    }
  };

  /* Stats */
  const stats = useMemo(() => {
    const total = tournaments.length;
    const upcoming = tournaments.filter((t) => t.status === "Upcoming" || t.status === "Pending").length;
    const ongoing = tournaments.filter((t) => t.status === "Ongoing").length;
    const finished = tournaments.filter((t) => t.status === "Finished" || t.status === "Completed").length;
    return { total, upcoming, ongoing, finished };
  }, [tournaments]);

  const pageContent = (
    <div className="tl-body">
        {/* Header */}
        <div className="tl-header-section">
          <div>
            <h1 className="tl-header-title">Giải đấu của tôi</h1>
            <p className="tl-header-subtitle">Quản lý và theo dõi các giải cờ vua của bạn</p>
          </div>
          <div className="tl-header-actions">
            <div className="tl-search-box">
              <Search className="tl-search-icon" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm giải đấu..."
                className="tl-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="tl-create-btn ui-btn ui-btn-primary" onClick={() => navigate("/tournaments/create")}>
              <Plus size={20} />
              Tạo giải đấu
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="tl-stats-grid">
          <div className="tl-stat-card ui-card ui-card-flat">
            <div>
              <p className="tl-stat-label">Tổng giải đấu</p>
              <h3 className="tl-stat-value">{stats.total}</h3>
            </div>
            <div className="tl-stat-icon indigo"><LayoutDashboard size={24} /></div>
          </div>
          <div className="tl-stat-card ui-card ui-card-flat">
            <div>
              <p className="tl-stat-label">Chờ duyệt</p>
              <h3 className="tl-stat-value">{stats.upcoming}</h3>
            </div>
            <div className="tl-stat-icon blue"><Clock size={24} /></div>
          </div>
          <div className="tl-stat-card ui-card ui-card-flat">
            <div>
              <p className="tl-stat-label">Đang diễn ra</p>
              <h3 className="tl-stat-value">{stats.ongoing}</h3>
            </div>
            <div className="tl-stat-icon emerald"><PlayCircle size={24} /></div>
          </div>
          <div className="tl-stat-card ui-card ui-card-flat">
            <div>
              <p className="tl-stat-label">Đã kết thúc</p>
              <h3 className="tl-stat-value">{stats.finished}</h3>
            </div>
            <div className="tl-stat-icon gray"><CheckCircle size={24} /></div>
          </div>
        </div>

        {/* Content: Sidebar + Grid */}
        <div className="tld-content-layout">
          <aside className="tld-filter-wrap">
            <FilterSection
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
              onReset={handleReset}
            />
          </aside>

          <div className="tld-main-area">
            {filteredTournaments.length > 0 ? (
              <>
                <div className="tl-card-grid">
                  {paginatedTournaments.map((t) => {
                    const progress = t.maxPlayer > 0
                      ? Math.round((t.currentPlayers / t.maxPlayer) * 100)
                      : 0;
                    const coverUrl = resolveTournamentImageUrl(t.tournamentImage);

                    return (
                      <div className="tl-tournament-card ui-card ui-card-hover" key={t.tournamentId}>
                        <div className="tl-card-banner">
                          {coverUrl && (
                            <img
                              src={coverUrl}
                              alt={t.tournamentName}
                              className="tl-card-banner-image"
                              loading="lazy"
                            />
                          )}
                          <div className="tl-card-banner-overlay" />
                          {!coverUrl && <Trophy size={48} className="tl-card-banner-icon" />}
                          <span className={`tl-card-status-badge ${t.status}`}>
                            {getStatusLabel(t.status)}
                          </span>
                        </div>

                        <div className="tl-card-content">
                          <span className="tl-card-format">{getFormatLabel(t.format)}</span>
                          <h3 className="tl-card-name">{t.tournamentName}</h3>

                          <div className="tl-card-details">
                            <div className="tl-card-detail-row">
                              <MapPin size={16} />
                              {t.location || "—"}
                            </div>
                            <div className="tl-card-detail-row">
                              <Calendar size={16} />
                              {t.startDate?.split(" ")[0].replaceAll("-", "/")} – {t.endDate?.split(" ")[0].replaceAll("-", "/")}
                            </div>
                            <div className="tl-card-detail-row">
                              <Trophy size={16} />
                              Quỹ thưởng: ${t.prizePool ?? 0}
                            </div>
                            <div className="tl-card-detail-row">
                              <Clock size={16} />
                              Hạn đăng ký: {t.registrationDeadline?.split(" ")[0].replaceAll("-", "/")}
                            </div>
                          </div>

                          <div className="tl-card-progress">
                            <div className="tl-card-progress-header">
                              <span className="tl-card-progress-label">
                                <Users size={14} />
                                {t.currentPlayers}/{t.maxPlayer} người chơi
                              </span>
                              <span className="tl-card-progress-pct">{progress}%</span>
                            </div>
                            <div className="tl-card-progress-bar">
                              <div
                                className="tl-card-progress-fill"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="tl-card-footer">
                          <button
                            className="tl-card-manage-btn ui-btn"
                            onClick={() => navigate(`/tournaments/${t.tournamentId}`)}
                          >
                            Quản lý
                          </button>
                          <div className="tl-card-actions">
                            <button
                              className="tl-card-action-btn ui-btn ui-btn-icon"
                              title="Xem chi tiết"
                              onClick={() => navigate(`/tournaments/${t.tournamentId}`)}
                            >
                              <Eye size={18} />
                            </button>
                            {EDITABLE_STATUSES.includes(t.status) && (
                              <button
                                className="tl-card-action-btn ui-btn ui-btn-icon"
                                title="Chỉnh sửa"
                                onClick={() => navigate(`/tournaments/edit/${t.tournamentId}`)}
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            {CANCELLED_ABLE.includes(t.status) && (
                              <button
                                className="tl-card-action-btn danger ui-btn ui-btn-icon"
                                title="Hủy giải"
                                onClick={() => handleOpenConfirm(t)}
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="tl-pagination">
                    <button
                      className="tl-page-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        className={`tl-page-num ${currentPage === num ? "active" : ""}`}
                        onClick={() => setCurrentPage(num)}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      className="tl-page-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="tl-empty-state ui-card">
                <div className="tl-empty-icon-wrap">
                  <LayoutDashboard size={40} />
                </div>
                <h3>Không tìm thấy giải đấu</h3>
                <p>Bạn chưa tạo giải đấu nào hoặc bộ lọc đang quá chặt.</p>
                <button
                  className="tl-empty-create-btn ui-btn ui-btn-primary"
                  onClick={() => navigate("/tournaments/create")}
                >
                  Tạo giải đấu
                </button>
              </div>
            )}
          </div>
        </div>
      {/* Cancel Modal */}
      {showConfirm && (
        <div className="tl-modal-overlay">
          <div className="tl-modal ui-card">
            <h3>Hủy giải đấu</h3>
            <p>
              Bạn chắc chắn muốn hủy giải{" "}
              <strong>{selectedTournament?.tournamentName}</strong>?
            </p>
            <label className="tl-modal-label">Lý do hủy giải</label>
            <textarea
              className="tl-modal-textarea"
              rows={4}
              placeholder="Nhập lý do hủy giải..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="tl-modal-actions">
              <button
                className="tl-btn-cancel ui-btn ui-btn-secondary"
                onClick={() => {
                  setShowConfirm(false);
                  setSelectedTournament(null);
                }}
              >
                Hủy
              </button>
              <button className="tl-btn-confirm ui-btn ui-btn-primary" onClick={handleConfirmCancel}>
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return hideHeader ? (
      <div className="tl-loading">Đang tải danh sách giải đấu...</div>
    ) : (
      <div className="tl-page">
        <MainHeader
          user={user}
          onLogout={handleLogout}
          currentPath={location.pathname}
        />
        <div className="tl-loading">Đang tải danh sách giải đấu...</div>
      </div>
    );
  }

  if (hideHeader) {
    return pageContent;
  }

  return (
    <div className="tl-page">
      <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} />
      {pageContent}
    </div>
  );
};

export default TournamentList;
