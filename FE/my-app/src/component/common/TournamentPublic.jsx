import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight, MapPin, Search, Trophy, Users } from "lucide-react";
import MainHeader from "./MainHeader";
import "../../assets/css/TournamentPublic.css";

import { API_BASE } from "../../config/api";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=1200&q=80";
const PAGE_SIZE = 9;

const STATUS_OPTIONS = [
  { value: "registering", label: "Đang đăng ký" },
  { value: "ongoing", label: "Đang diễn ra" },
  { value: "finished", label: "Kết thúc" },
];

const FORMAT_LABELS = {
  RoundRobin: "Vòng tròn",
  KnockOut: "Loại trực tiếp",
  Hybrid: "Kết hợp",
};

function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function formatMoney(amount) {
  const num = Number(amount);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("vi-VN");
}

function normalizeStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();

  if (["ongoing"].includes(normalized)) return "ongoing";
  if (["completed", "finished", "cancelled", "rejected"].includes(normalized)) return "finished";
  return "registering";
}

function getStatusLabel(status) {
  const key = normalizeStatus(status);
  if (key === "ongoing") return "Đang diễn ra";
  if (key === "finished") return "Kết thúc";
  return "Đang đăng ký";
}

function getFormatLabel(format) {
  return FORMAT_LABELS[format] || format || "—";
}

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

export default function TournamentPublic() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [prizeFilter, setPrizeFilter] = useState("");
  const [feeFilter, setFeeFilter] = useState("");
  const [nameSort, setNameSort] = useState("az");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem("user");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const tournamentRes = await axios.get(`${API_BASE}/api/public/tournaments`);

        let list = Array.isArray(tournamentRes?.data) ? tournamentRes.data : [];

        if (list.length === 0) {
          const homeRes = await axios.get(`${API_BASE}/api/home`).catch(() => null);
          const upcomingList = Array.isArray(homeRes?.data?.upcomingTournaments)
            ? homeRes.data.upcomingTournaments
            : [];
          if (upcomingList.length > 0) {
            list = upcomingList;
          }
        }

        setTournaments(list);
      } catch (err) {
        console.error("Load public tournaments failed:", err);
        setError("Không thể tải danh sách giải đấu từ server.");
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTournaments = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const base = tournaments.filter((t) => {
      const name = (t.tournamentName || "").toLowerCase();
      const locationName = (t.location || "").toLowerCase();
      const matchesSearch = !q || name.includes(q) || locationName.includes(q);
      const matchesStatus = !statusFilter || normalizeStatus(t.status) === statusFilter;
      const prize = Number(t.prizePool || 0);
      const matchesPrize = (() => {
        if (!prizeFilter) return true;
        if (prizeFilter === "lt3000000") return prize < 3000000;
        if (prizeFilter === "3000000-7000000") return prize >= 3000000 && prize <= 7000000;
        if (prizeFilter === "gt7000000") return prize > 7000000;
        return true;
      })();

      const fee = Number(t.entryFee || 0);
      const matchesFee = (() => {
        if (!feeFilter) return true;
        if (feeFilter === "free") return fee === 0;
        if (feeFilter === "paid") return fee > 0;
        return true;
      })();

      return matchesSearch && matchesStatus && matchesPrize && matchesFee;
    });

    return [...base].sort((a, b) => {
      const nameA = String(a.tournamentName || "").toLowerCase();
      const nameB = String(b.tournamentName || "").toLowerCase();
      return nameSort === "za" ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
    });
  }, [tournaments, searchText, statusFilter, prizeFilter, feeFilter, nameSort]);

  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / PAGE_SIZE));
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, prizeFilter, feeFilter, nameSort]);

  const menuItems = [
    { to: "/home", label: "Home" },
    { to: "/tournaments/public", label: "Tournaments" },
    { to: "/blog", label: "Blog" },
  ];

  return (
    <div className="tp-page">
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
        menuItems={menuItems}
      />

      <section className="tp-section">
        <div className="tp-container">
          <div className="tp-header">
            <div className="tp-header-text">
              <h1>Danh sách giải đấu</h1>
              <p>Tìm và đăng ký các giải cờ vua đang diễn ra</p>
            </div>
            <button
              type="button"
              className="tp-all-btn"
              onClick={() => navigate("/tournaments/public")}
            >
              Xem tất cả các trận đấu
            </button>
          </div>

          <div className="tp-filters">
            <div className="tp-search-box">
              <Search size={18} />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Tìm theo tên giải hoặc địa điểm..."
              />
            </div>

            <div className="tp-filter-row">
              <select
                className="tp-select"
                value={prizeFilter}
                onChange={(e) => setPrizeFilter(e.target.value)}
              >
                <option value="">Tất cả giải thưởng</option>
                <option value="lt3000000">Dưới 3.000.000</option>
                <option value="3000000-7000000">3.000.000 - 7.000.000</option>
                <option value="gt7000000">Trên 7.000.000</option>
              </select>
              <select
                className="tp-select"
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
              >
                <option value="">Tất cả phí tham gia</option>
                <option value="free">Miễn phí</option>
                <option value="paid">Có phí</option>
              </select>
              <select
                className="tp-select"
                value={nameSort}
                onChange={(e) => setNameSort(e.target.value)}
              >
                <option value="az">Tên giải A-Z</option>
                <option value="za">Tên giải Z-A</option>
              </select>
              <select
                className="tp-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="tp-state-card">Đang tải danh sách giải đấu...</div>
          ) : error ? (
            <div className="tp-state-card">
              <p>{error}</p>
              <button type="button" className="tp-retry-btn" onClick={() => window.location.reload()}>
                Thử lại
              </button>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="tp-state-card">Không có giải đấu phù hợp với bộ lọc hiện tại.</div>
          ) : (
            <>
              <div className="tp-grid">
                {paginatedTournaments.map((t) => {
                  const currentPlayers = Number(t.currentPlayers ?? t.current_players ?? 0);
                  const maxPlayers = Number(t.maxPlayer ?? t.max_player ?? 0);
                  const progress = maxPlayers > 0 ? Math.round((currentPlayers / maxPlayers) * 100) : 0;
                  const statusKey = normalizeStatus(t.status);

                  return (
                    <article key={t.tournamentId} className="tp-card">
                      <div className="tp-card-banner">
                        <img
                          src={resolveImageUrl(t.tournamentImage)}
                          alt={t.tournamentName || "Tournament"}
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                        <span className={`tp-status-badge tp-status-${statusKey}`}>
                          {getStatusLabel(t.status)}
                        </span>
                      </div>

                      <div className="tp-card-body">
                        <span className="tp-format">{getFormatLabel(t.format)}</span>
                        <h3>{t.tournamentName || "Tournament"}</h3>

                        <div className="tp-meta">
                          <p>
                            <MapPin size={15} />
                            {t.location || "Online"}
                          </p>
                          <p>
                            <Calendar size={15} />
                            {formatDate(t.startDate)} - {formatDate(t.endDate)}
                          </p>
                          <p>
                            <Trophy size={15} />
                            {formatMoney(t.prizePool)} VND
                          </p>
                        </div>

                        <div className="tp-progress">
                          <div className="tp-progress-head">
                            <span>
                              <Users size={14} /> {currentPlayers}/{maxPlayers} người chơi
                            </span>
                            <strong>{progress}%</strong>
                          </div>
                          <div className="tp-progress-bar">
                            <div
                              className="tp-progress-fill"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          className="tp-detail-btn"
                          onClick={() => navigate(`/tournaments/public/${t.tournamentId}`)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="tp-pagination">
                  <button
                    type="button"
                    className="tp-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    aria-label="Trang trước"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="tp-page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`tp-page-num ${currentPage === num ? "active" : ""}`}
                        onClick={() => setCurrentPage(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="tp-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    aria-label="Trang sau"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
