import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  Search,
  Plus,
  Calendar,
  MapPin,
  Users,
  Trophy,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react";
import MainHeader from "../../component/common/MainHeader";
import "../../assets/css/HomePage.css";
import "../../assets/css/tournament-leader/TournamentList.css";
import "../../assets/css/TournamentPublic.css";

import { API_BASE } from "../../config/api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=1200&q=80";

function getApiOrigin() {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return window.location.origin;
  }
}

function resolveImageUrl(rawImage) {
  const src = String(rawImage || "").trim();
  if (!src) return FALLBACK_IMAGE;
  const apiOrigin = getApiOrigin();
  if (/^(https?:)?\/\//i.test(src)) {
    if (src.startsWith("//")) return `${window.location.protocol}${src}`;
    return src;
  }
  if (/^(data:|blob:)/i.test(src)) return src;
  if (src.startsWith("/")) return `${apiOrigin}${src}`;
  const cleaned = src.replace(/^\.?\//, "");
  return `${apiOrigin}/${cleaned}`;
}

function formatMoney(amount) {
  const num = Number(amount);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("vi-VN");
}

/** Nhãn trạng thái in hoa cho badge trên ảnh */
function getStatusBadgeLabel(s) {
  const map = {
    Pending: "SẮP DIỄN RA",
    Upcoming: "SẮP DIỄN RA",
    Ongoing: "ĐANG DIỄN RA",
    Finished: "ĐÃ KẾT THÚC",
    Completed: "ĐÃ KẾT THÚC",
    Delayed: "HOÃN",
    Cancelled: "ĐÃ HỦY",
    Rejected: "BỊ TỪ CHỐI",
  };
  return map[s] || String(s || "").toUpperCase();
}

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
};

const getStatusLabel = (s) => STATUS_LABELS[s] || s;
const getFormatLabel = (f) => FORMAT_LABELS[f] || f;

const TournamentList = () => {
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
  const [statuses, setStatuses] = useState([]);
  const [formats, setFormats] = useState([]);

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

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/tournaments?action=filters`, { withCredentials: true })
      .then((res) => {
        setStatuses(res.data.statuses || []);
        setFormats(res.data.formats || []);
      })
      .catch(() => {});
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

  if (loading) {
    return (
      <div className="tl-page">
        <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} />
        <div className="tl-loading">Đang tải danh sách giải đấu...</div>
      </div>
    );
  }

  return (
    <div className="tl-page hpv-page">
      <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} />

      <div className="tl-body">
        {/* Header - giống tournament public */}
        <div className="tp-header tl-leader-header">
          <div className="tp-header-text">
            <h1>Giải đấu của tôi</h1>
            <p>Quản lý và theo dõi các giải cờ vua của bạn. Lọc theo trạng thái và thể thức bên dưới.</p>
          </div>
          <button type="button" className="tp-all-btn tl-create-btn-inline" onClick={() => navigate("/leader/tournaments/create")}>
            <Plus size={18} />
            Tạo giải đấu
          </button>
        </div>

        {/* Bộ lọc ngang - trạng thái hệ thống + thể thức */}
        <div className="tp-filters tl-leader-filters">
          <div className="tp-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên giải hoặc địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="tp-filter-row">
            <select
              className="tp-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.filter((s) => s !== "Delayed").map((s) => (
                <option key={s} value={s}>{getStatusLabel(s)}</option>
              ))}
            </select>
            <select
              className="tp-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Tất cả thể thức</option>
              {formats.map((f) => (
                <option key={f} value={f}>{getFormatLabel(f)}</option>
              ))}
            </select>
            <button type="button" className="tl-filter-reset-btn" onClick={handleReset}>
              Đặt lại
            </button>
          </div>
        </div>

        {/* Nội dung danh sách */}
        <div className="tld-main-area">
            {filteredTournaments.length > 0 ? (
              <>
                <div className="tl-card-grid">
                  {paginatedTournaments.map((t) => {
                    const progress = t.maxPlayer > 0
                      ? Math.round((t.currentPlayers / t.maxPlayer) * 100)
                      : 0;

                    return (
                      <div className="tl-tournament-card tl-card-new" key={t.tournamentId}>
                        <div className="tl-card-banner tl-card-banner-img">
                          <img
                            src={resolveImageUrl(t.tournamentImage)}
                            alt={t.tournamentName || "Tournament"}
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                          <div className="tl-card-banner-overlay" />
                          <span className="tl-card-status-badge tl-card-status-pill">
                            {getStatusBadgeLabel(t.status)}
                          </span>
                        </div>

                        <div className="tl-card-content">
                          <span className="tl-card-format tl-card-format-pill">
                            {getFormatLabel(t.format).toUpperCase()}
                          </span>
                          <h3 className="tl-card-name">{t.tournamentName}</h3>

                          <div className="tl-card-details">
                            <div className="tl-card-detail-row">
                              <MapPin size={15} />
                              {t.location || "—"}
                            </div>
                            <div className="tl-card-detail-row">
                              <Calendar size={15} />
                              {t.startDate?.split(" ")[0].replaceAll("-", "/")} – {t.endDate?.split(" ")[0].replaceAll("-", "/")}
                            </div>
                            <div className="tl-card-detail-row">
                              <Trophy size={15} />
                              {formatMoney(t.prizePool ?? 0)} VND
                            </div>
                          </div>

                          <div className="tl-card-progress tl-card-progress-new">
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
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>

                          <button
                            className="tl-card-cta-btn"
                            onClick={() => navigate(`/leader/tournaments/${t.tournamentId}`)}
                          >
                            QUẢN LÝ
                          </button>
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
              <div className="tl-empty-state">
                <div className="tl-empty-icon-wrap">
                  <LayoutDashboard size={40} />
                </div>
                <h3>Không tìm thấy giải đấu</h3>
                <p>Bạn chưa tạo giải đấu nào hoặc bộ lọc đang quá chặt.</p>
                <button
                  className="tl-empty-create-btn"
                  onClick={() => navigate("/leader/tournaments/create")}
                >
                  Tạo giải đấu
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TournamentList;
