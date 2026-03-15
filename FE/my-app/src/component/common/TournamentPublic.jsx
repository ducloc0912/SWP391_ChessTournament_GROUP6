import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Trophy } from "lucide-react";
import MainHeader from "./MainHeader";
import TournamentPublicCard from "./TournamentPublicCard";
import "../../assets/css/TournamentPublic.css";
import { API_BASE } from "../../config/api";

const PAGE_SIZE = 9;

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Sắp diễn ra" },
  { value: "ongoing", label: "Đang diễn ra" },
  { value: "completed", label: "Đã kết thúc" },
  { value: "delayed", label: "Hoãn" },
];

const FORMAT_LABELS = {
  RoundRobin: "Vòng tròn",
  KnockOut: "Loại trực tiếp",
};

function normalizeStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "upcoming") return "upcoming";
  if (normalized === "ongoing") return "ongoing";
  if (normalized === "completed") return "completed";
  if (normalized === "delayed") return "delayed";
  return "other";
}

function getStatusLabel(status) {
  const key = normalizeStatus(status);
  if (key === "upcoming") return "Sắp diễn ra";
  if (key === "ongoing") return "Đang diễn ra";
  if (key === "completed") return "Đã kết thúc";
  if (key === "delayed") return "Hoãn";
  return "Trạng thái khác";
}

function getFormatLabel(format) {
  return FORMAT_LABELS[format] || format || "-";
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
  const [followedIds, setFollowedIds] = useState(new Set());
  const [followLoading, setFollowLoading] = useState({});

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

  useEffect(() => {
    if (!user?.userId) return;
    axios
      .get(`${API_BASE}/api/user/follow?action=list`, { withCredentials: true })
      .then((res) => {
        const ids = new Set((res.data || []).map((t) => t.tournamentId));
        setFollowedIds(ids);
      })
      .catch((err) => console.error("Load followed tournaments failed:", err));
  }, [user?.userId]);

  const handleFollowToggle = async (event, tournamentId) => {
    event.preventDefault();
    event.stopPropagation();
    const isFollowing = followedIds.has(tournamentId);
    setFollowLoading((prev) => ({ ...prev, [tournamentId]: true }));
    try {
      const action = isFollowing ? "unfollow" : "follow";
      const res = await axios.post(
        `${API_BASE}/api/user/follow?action=${action}`,
        { tournamentId },
        { withCredentials: true },
      );
      if (res?.data?.success || res?.status === 200) {
        setFollowedIds((prev) => {
          const next = new Set(prev);
          if (isFollowing) next.delete(tournamentId);
          else next.add(tournamentId);
          return next;
        });
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [tournamentId]: false }));
    }
  };

  const filteredTournaments = useMemo(() => {
    return [...tournaments]
      .filter((t) => normalizeStatus(t.status) !== "other")
      .filter((t) => {
        const q = searchText.trim().toLowerCase();
        const name = String(t.tournamentName || "").toLowerCase();
        const locationName = String(t.location || "").toLowerCase();
        const normStatus = normalizeStatus(t.status);
        const prize = Number(t.prizePool || 0);
        const fee = Number(t.entryFee || 0);

        const matchesSearch = !q || name.includes(q) || locationName.includes(q);
        const matchesStatus = !statusFilter || normStatus === statusFilter;
        const matchesPrize =
          !prizeFilter ||
          (prizeFilter === "lt3000000" && prize < 3000000) ||
          (prizeFilter === "3000000-7000000" && prize >= 3000000 && prize <= 7000000) ||
          (prizeFilter === "gt7000000" && prize > 7000000);
        const matchesFee =
          !feeFilter ||
          (feeFilter === "free" && fee === 0) ||
          (feeFilter === "paid" && fee > 0);

        return matchesSearch && matchesStatus && matchesPrize && matchesFee;
      })
      .sort((a, b) => {
        const nameA = String(a.tournamentName || "").toLowerCase();
        const nameB = String(b.tournamentName || "").toLowerCase();
        return nameSort === "za" ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
      });
  }, [tournaments, searchText, statusFilter, prizeFilter, feeFilter, nameSort]);

  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / PAGE_SIZE));
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, prizeFilter, feeFilter, nameSort]);

  const menuItems = [
    { to: "/home", label: "Home" },
    { to: "/tournaments/following", label: "Các giải đang theo dõi" },
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
              <p>
                Xem các giải cờ vua <strong>sắp diễn ra</strong>, <strong>đang diễn ra</strong> hoặc <strong>đã kết thúc</strong>.
              </p>
            </div>
            <div className="tp-header-actions">
              {user ? (
                <button
                  type="button"
                  className="tp-all-btn"
                  onClick={() => navigate("/tournaments/following")}
                >
                  <Trophy size={16} /> Các giải đang theo dõi
                </button>
              ) : null}
              <button
                type="button"
                className="tp-all-btn"
                onClick={() => navigate("/tournaments/public")}
              >
                Xem tất cả giải đấu
              </button>
            </div>
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
              <select className="tp-select" value={prizeFilter} onChange={(e) => setPrizeFilter(e.target.value)}>
                <option value="">Tất cả giải thưởng</option>
                <option value="lt3000000">Dưới 3.000.000</option>
                <option value="3000000-7000000">3.000.000 - 7.000.000</option>
                <option value="gt7000000">Trên 7.000.000</option>
              </select>
              <select className="tp-select" value={feeFilter} onChange={(e) => setFeeFilter(e.target.value)}>
                <option value="">Tất cả phí tham gia</option>
                <option value="free">Miễn phí</option>
                <option value="paid">Có phí</option>
              </select>
              <select className="tp-select" value={nameSort} onChange={(e) => setNameSort(e.target.value)}>
                <option value="az">Tên giải A-Z</option>
                <option value="za">Tên giải Z-A</option>
              </select>
              <select className="tp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
                {paginatedTournaments.map((t) => (
                  <TournamentPublicCard
                    key={t.tournamentId}
                    tournament={t}
                    apiBase={API_BASE}
                    statusKey={normalizeStatus(t.status)}
                    statusLabel={getStatusLabel(t.status)}
                    formatLabel={getFormatLabel(t.format)}
                    onViewDetail={() => navigate(`/tournaments/public/${t.tournamentId}`)}
                    secondaryAction={
                      user
                        ? {
                          disabled: followLoading[t.tournamentId],
                          onClick: (event) => handleFollowToggle(event, t.tournamentId),
                          label: followedIds.has(t.tournamentId) ? "Bỏ theo dõi" : "Theo dõi",
                        }
                        : null
                    }
                  />
                ))}
              </div>

              {totalPages > 1 ? (
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
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
