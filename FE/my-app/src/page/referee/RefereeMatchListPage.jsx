import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import { ArrowLeft } from "lucide-react";
import "../../assets/css/HomePage.css";
import { API_BASE } from "../../config/api";

const RefereeMatchListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tournamentId } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
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
    if (!user || !tournamentId) return;

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/referee/matches`, {
          withCredentials: true,
        });
        const data = res?.data;
        const list =
          data && typeof data === "object" && Array.isArray(data.matches)
            ? data.matches
            : Array.isArray(data)
            ? data
            : [];

        const tid = parseInt(tournamentId, 10);
        if (Number.isNaN(tid)) {
          setMatches([]);
          return;
        }
        const forThisTournament = list.filter((m) => {
          const mid = m.tournamentId ?? m.tournament_id;
          return mid != null && Number(mid) === tid;
        });
        setMatches(forThisTournament);
      } catch (err) {
        console.error("Load referee matches error:", err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user, tournamentId, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const role = (localStorage.getItem("role") || "").toUpperCase();

  const formatPlayerName = (first, last) =>
    [first, last].filter(Boolean).join(" ") || "—";

  const formatStatus = (s) => {
    switch (s) {
      case "Scheduled": return "Chưa bắt đầu";
      case "Ongoing": return "Đang diễn ra";
      case "Completed": return "Đã kết thúc";
      case "Cancelled": return "Đã hủy";
      case "Postponed": return "Hoãn";
      default: return s || "—";
    }
  };

  const formatStartTime = (startTime) => {
    if (!startTime) return "—";
    const d = new Date(startTime);
    if (Number.isNaN(d.getTime())) return String(startTime);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const myMatches = matches.filter((m) => {
    const a = m.assignedToMe ?? m.assigned_to_me;
    return a === true || a === 1;
  });

  const tournamentName =
    matches.length > 0 ? matches[0].tournamentName : `Giải #${tournamentId}`;

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
          <button
            type="button"
            className="hpv-btn hpv-btn-secondary"
            style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => navigate("/referee/matches")}
          >
            <ArrowLeft size={18} />
            Quay lại danh sách giải
          </button>

          <div className="hpv-section-head">
            <h2>CÁC TRẬN ĐƯỢC PHÂN CÔNG</h2>
            <p>{tournamentName}</p>
          </div>

          {loading ? (
            <div className="hpv-empty-card">Đang tải danh sách trận...</div>
          ) : myMatches.length === 0 ? (
            <div className="hpv-empty-card">
              Không có trận nào được phân công cho bạn trong giải này.
            </div>
          ) : (
            <div className="hpv-latest-grid">
              {myMatches.map((m) => (
                <article key={m.matchId} className="hpv-latest-card">
                  <div className="hpv-latest-body">
                    <div className="hpv-meta-line">
                      <span>
                        {m.roundName || (m.roundIndex ? `Round ${m.roundIndex}` : "Round ?")}
                        {m.boardNumber ? ` - Board ${m.boardNumber}` : ""}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>
                      Thời gian bắt đầu: {formatStartTime(m.startTime)}
                    </p>
                    <p style={{ margin: "4px 0", fontWeight: 500 }}>
                      <span style={{ color: "#555" }}>Kỳ thủ:</span>{" "}
                      {formatPlayerName(m.whiteFirstName1, m.whiteLastName1)}
                    </p>
                    <p style={{ margin: "4px 0", fontWeight: 500 }}>
                      <span style={{ color: "#333" }}>Kỳ thủ:</span>{" "}
                      {formatPlayerName(m.blackFirstName1, m.blackLastName1)}
                    </p>
                    <p style={{ marginTop: 8 }}>Trạng thái: {formatStatus(m.status)}</p>
                    <div style={{ marginTop: 12 }}>
                      <button
                        className="hpv-btn hpv-btn-primary"
                        onClick={() =>
                          navigate(`/referee/matches/${tournamentId}/match/${m.matchId}`)
                        }
                      >
                        Quản lý trận đấu
                      </button>
                    </div>
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

export default RefereeMatchListPage;
