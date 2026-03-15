import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import "../../assets/css/HomePage.css";
import { API_BASE } from "../../config/api";

/** Trang 1: Danh sách các giải đã làm trọng tài. Bấm vào giải → chuyển sang trang danh sách trận. */
const RefereeMatchesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    const role = (localStorage.getItem("role") || "").toUpperCase();
    if (role !== "REFEREE") {
      navigate("/home", { replace: true });
      return;
    }
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/referee/matches`, {
          withCredentials: true,
        });
        const data = res?.data;
        if (data && typeof data === "object" && Array.isArray(data.tournaments)) {
          setTournaments(data.tournaments);
        } else {
          setTournaments([]);
        }
      } catch (err) {
        console.error("Load referee tournaments error:", err);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const role = (localStorage.getItem("role") || "").toUpperCase();

  const formatTournamentStatus = (s) => {
    if (!s) return "Khác";
    switch (s) {
      case "Ongoing":
        return "Đang diễn ra";
      case "Upcoming":
        return "Sắp diễn ra";
      case "Completed":
        return "Đã kết thúc";
      case "Cancelled":
        return "Đã hủy";
      case "Delayed":
        return "Hoãn";
      default:
        return s;
    }
  };

  const tournamentPriority = (s) => {
    if (!s) return 3;
    if (s === "Ongoing") return 1;
    if (s === "Upcoming") return 2;
    return 3;
  };

  const sortedTournaments = React.useMemo(() => {
    const arr = tournaments.map((t) => ({
      tournamentId: t.tournamentId,
      name: t.tournamentName ?? t.name,
      status: t.tournamentStatus ?? t.status,
    }));
    arr.sort((a, b) => {
      const pa = tournamentPriority(a.status);
      const pb = tournamentPriority(b.status);
      if (pa !== pb) return pa - pb;
      return (a.name || "").localeCompare(b.name || "");
    });
    return arr;
  }, [tournaments]);

  return (
    <div id="home-page" className="hpv-page">
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
        menuItems={[
          { to: "/home", label: "Home" },
          ...(role === "REFEREE"
            ? [
                { to: "/referee/invitations", label: "Invitations" },
                { to: "/referee/matches", label: "Matches" },
              ]
            : []),
          { to: "/tournaments/public", label: "Tournaments" },
        ]}
      />

      <section className="hpv-section hpv-light">
        <div className="hpv-container">
          <div className="hpv-section-head">
            <h2>DANH SÁCH GIẢI</h2>
            <p>Các giải bạn được phân công làm trọng tài. Nhấn vào giải để xem và điều hành các trận.</p>
          </div>

          {loading ? (
            <div className="hpv-empty-card">Đang tải danh sách giải...</div>
          ) : sortedTournaments.length === 0 ? (
            <div className="hpv-empty-card">Hiện bạn chưa được phân công giải nào.</div>
          ) : (
            <div className="hpv-latest-grid">
              {sortedTournaments.map((t) => (
                <article
                  key={t.tournamentId}
                  className="hpv-latest-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/referee/matches/${t.tournamentId}`)}
                >
                  <div className="hpv-latest-body">
                    <div className="hpv-meta-line">
                      <span>{formatTournamentStatus(t.status)}</span>
                    </div>
                    <h3>{t.name || `Giải #${t.tournamentId}`}</h3>
                    <p>Nhấn để xem các trận được phân công trong giải này.</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RefereeMatchesPage;
