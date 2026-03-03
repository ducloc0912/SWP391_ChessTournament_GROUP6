import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Search } from "lucide-react";
import MainHeader from "./MainHeader";
import "../../assets/css/MatchesPublic.css";

import { API_BASE } from "../../config/api";

function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function formatMoney(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("vi-VN");
}

export default function MatchesPublic() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");

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
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/api/public/tournaments?action=allMatches`);
        setMatches(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.error("Load all matches failed:", err);
        setError("Không thể tải danh sách trận đấu.");
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return matches.filter((m) => {
      const tournamentName = String(m.tournamentName || "").toLowerCase();
      const locationName = String(m.location || "").toLowerCase();
      return !q || tournamentName.includes(q) || locationName.includes(q);
    });
  }, [searchText, matches]);

  return (
    <div className="mp-page">
      <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} />

      <div className="mp-container">
        <div className="mp-top-row">
          <button type="button" className="mp-back-btn" onClick={() => navigate("/tournaments/public")}>
            <ArrowLeft size={16} /> Quay lại danh sách giải
          </button>
          <h1>Tất cả các trận đấu</h1>
        </div>

        <div className="mp-search-box">
          <Search size={17} />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm theo tên giải hoặc địa điểm..."
          />
        </div>

        {loading ? (
          <div className="mp-state-card">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="mp-state-card">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="mp-state-card">Không có trận đấu nào.</div>
        ) : (
          <div className="mp-table-wrap">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Trận đấu</th>
                  <th>Tỉ số</th>
                  <th>Tên giải</th>
                  <th>Địa điểm</th>
                  <th>Giải thưởng</th>
                  <th>Phí tham gia</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.matchId}>
                    <td>
                      {m.whitePlayerName || "TBD"} vs {m.blackPlayerName || "TBD"}
                    </td>
                    <td>{m.result || "*"}</td>
                    <td>{m.tournamentName || "Tournament"}</td>
                    <td>
                      <MapPin size={14} /> {m.location || "Online"}
                    </td>
                    <td>{formatMoney(m.prizePool)} VND</td>
                    <td>{formatMoney(m.entryFee)} VND</td>
                    <td>{m.status || "—"}</td>
                    <td>
                      <Calendar size={14} /> {formatDate(m.startTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
