import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import MainHeader from "../../component/common/MainHeader";
import TournamentPublicCard from "../../component/common/TournamentPublicCard";
import { API_BASE } from "../../config/api";
import "../../assets/css/TournamentPublic.css";

const PAGE_SIZE = 9;

function normalizeStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "upcoming") return "upcoming";
  if (s === "ongoing") return "ongoing";
  if (s === "completed") return "completed";
  if (s === "delayed") return "delayed";
  return "other";
}

function getStatusLabel(status) {
  const k = normalizeStatus(status);
  if (k === "upcoming") return "Sắp diễn ra";
  if (k === "ongoing") return "Đang diễn ra";
  if (k === "completed") return "Đã kết thúc";
  if (k === "delayed") return "Hoãn";
  return String(status || "-");
}

function getFormatLabel(format) {
  const map = { RoundRobin: "Vòng tròn", KnockOut: "Loại trực tiếp" };
  return map[format] || format || "-";
}

const menuItems = [
  { to: "/home", label: "Home" },
  { to: "/tournaments/following", label: "Các giải đang theo dõi" },
  { to: "/blog", label: "Blog" },
];

export default function FollowedTournamentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [unfollowingIds, setUnfollowingIds] = useState(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const fetchFollowed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/user/follow`, { withCredentials: true });
      setTournaments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Không thể tải danh sách giải đang theo dõi.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchFollowed();
  }, [fetchFollowed]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const handleUnfollow = async (tournamentId) => {
    setUnfollowingIds((prev) => new Set([...prev, tournamentId]));
    try {
      await axios.post(
        `${API_BASE}/api/user/follow?action=unfollow`,
        { tournamentId },
        { withCredentials: true, headers: { "Content-Type": "application/json" } },
      );
      setTournaments((prev) => prev.filter((t) => t.tournamentId !== tournamentId));
    } catch {
      alert("Hủy theo dõi thất bại. Vui lòng thử lại.");
    } finally {
      setUnfollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(tournamentId);
        return next;
      });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tournaments.filter((t) => {
      if (!q) return true;
      return String(t.tournamentName || "").toLowerCase().includes(q)
        || String(t.location || "").toLowerCase().includes(q);
    });
  }, [tournaments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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
              <h1>Các giải đang theo dõi</h1>
              <p>Danh sách các giải bạn đã follow. Bạn có thể hủy theo dõi trực tiếp trên từng card.</p>
            </div>
            <button
              type="button"
              className="tp-all-btn"
              onClick={() => navigate("/tournaments/public")}
            >
              Xem tất cả giải đấu
            </button>
          </div>

          <div className="tp-filters">
            <div className="tp-search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc địa điểm..."
              />
            </div>
          </div>

          {loading ? (
            <div className="tp-state-card">Đang tải danh sách theo dõi...</div>
          ) : error ? (
            <div className="tp-state-card">
              <p>{error}</p>
              <button type="button" className="tp-retry-btn" onClick={fetchFollowed}>Thử lại</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="tp-state-card">
              {tournaments.length === 0
                ? "Bạn chưa theo dõi giải đấu nào."
                : "Không có giải nào khớp với từ khóa tìm kiếm."}
            </div>
          ) : (
            <>
              <div className="tp-grid">
                {paginated.map((t) => (
                  <TournamentPublicCard
                    key={t.tournamentId}
                    tournament={t}
                    apiBase={API_BASE}
                    statusKey={normalizeStatus(t.status)}
                    statusLabel={getStatusLabel(t.status)}
                    formatLabel={getFormatLabel(t.format)}
                    onViewDetail={() => navigate(`/tournaments/public/${t.tournamentId}`)}
                    secondaryAction={{
                      disabled: unfollowingIds.has(t.tournamentId),
                      onClick: () => handleUnfollow(t.tournamentId),
                      label: unfollowingIds.has(t.tournamentId) ? "Đang xử lý..." : "Hủy theo dõi",
                    }}
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
