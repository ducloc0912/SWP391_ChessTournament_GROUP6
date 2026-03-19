import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Swords,
  Trophy,
} from "lucide-react";
import MainHeader from "../../component/common/MainHeader";
import { API_BASE } from "../../config/api";

/* ─────────────────────── helpers ─────────────────────── */
function formatDate(raw) {
  if (!raw) return "–";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETED" || s === "FINISHED") {
    return { text: "Đã kết thúc", color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" };
  }
  if (s === "CANCELLED" || s === "CANCELED") {
    return { text: "Đã kết thúc", color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" };
  }
  return { text: "Sắp diễn ra", color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" };
}

function resultLabel(result, playerSide) {
  if (!result || result === "*") return { text: "–", color: "#9ca3af" };
  const r = String(result).toLowerCase().trim();
  if (r === "½-½" || r.includes("draw") || r === "0.5-0.5")
    return { text: "Hòa", color: "#d97706", fw: 700 };
  if (r === "1-0")
    return playerSide === 1
      ? { text: "Thắng", color: "#16a34a", fw: 800 }
      : { text: "Thua", color: "#dc2626", fw: 700 };
  if (r === "0-1")
    return playerSide === 2
      ? { text: "Thắng", color: "#16a34a", fw: 800 }
      : { text: "Thua", color: "#dc2626", fw: 700 };
  return { text: result, color: "#6b7280", fw: 600 };
}

function isUpcoming(m) {
  const s = String(m.status || "").toUpperCase();
  return s !== "COMPLETED" && s !== "FINISHED" && s !== "CANCELLED" && s !== "CANCELED";
}

const PAGE_SIZE = 10;

/* ─────────────────────── component ─────────────────────── */
export default function Matches() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try { setUser(JSON.parse(raw)); }
    catch { localStorage.removeItem("user"); }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/api/player/matches`, {
          withCredentials: true,
        });
        setMatches(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.error("Load player matches failed:", err);
        setError("Không thể tải lịch thi đấu. Vui lòng thử lại sau.");
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  /* filtering + sorting */
  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = matches.filter((m) => {
      const tournament = String(m.tournamentName || "").toLowerCase();
      const opp = String(m.opponentName || m.player1Name || m.player2Name || "").toLowerCase();
      const loc = String(m.location || "").toLowerCase();
      const matchesQ = !q || tournament.includes(q) || opp.includes(q) || loc.includes(q);

      const upcoming = isUpcoming(m);
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "UPCOMING" && upcoming) ||
        (filterStatus === "DONE" && !upcoming);

      return matchesQ && matchesStatus;
    });

    const now = Date.now();
    return list.sort((a, b) => {
      const ta = new Date(a.startTime).getTime() || 0;
      const tb = new Date(b.startTime).getTime() || 0;
      const futA = ta >= now;
      const futB = tb >= now;
      if (futA && futB) return ta - tb;
      if (!futA && !futB) return tb - ta;
      return futA ? -1 : 1;
    });
  }, [matches, searchText, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchText, filterStatus]);

  /* stats */
  const total = matches.length;
  const won = matches.filter((m) => {
    const r = String(m.result || "").toLowerCase();
    const side = m.playerSide ?? 1;
    return (r === "1-0" && side === 1) || (r === "0-1" && side === 2);
  }).length;
  const lost = matches.filter((m) => {
    const r = String(m.result || "").toLowerCase();
    const side = m.playerSide ?? 1;
    return (r === "0-1" && side === 1) || (r === "1-0" && side === 2);
  }).length;
  const drawn = matches.filter((m) => {
    const r = String(m.result || "").toLowerCase();
    return r === "½-½" || r.includes("draw") || r === "0.5-0.5";
  }).length;
  const upcomingCount = matches.filter(isUpcoming).length;

  const S = {
    page: {
      minHeight: "100vh",
      background: "#ece8e1",
      color: "#1f2937",
      fontFamily: "Inter, 'Segoe UI', sans-serif",
    },
    hero: {
      background: "#ece8e1",
      paddingTop: 72,
      paddingBottom: 32,
    },
    heroInner: {
      maxWidth: 1260,
      margin: "0 auto",
      padding: "32px 24px 0",
    },
    heroTitle: {
      margin: 0,
      fontSize: "clamp(28px,3.5vw,46px)",
      fontWeight: 900,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      gap: 14,
    },
    heroIcon: {
      width: 42,
      height: 42,
      borderRadius: 10,
      background: "linear-gradient(135deg, #ff5661, #ff3342)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      flexShrink: 0,
    },
    heroSub: {
      marginTop: 10,
      marginBottom: 0,
      fontSize: 15,
      color: "#6b7280",
    },
    statsBar: {
      display: "flex",
      gap: 0,
      marginTop: 28,
      borderTop: "1px solid rgba(15,23,42,0.10)",
      paddingTop: 20,
      flexWrap: "wrap",
    },
    statItem: {
      flex: "1 1 100px",
      padding: "0 20px 0 0",
    },
    statValue: (color) => ({
      display: "block",
      fontSize: 28,
      fontWeight: 900,
      color,
      lineHeight: 1,
      marginBottom: 4,
    }),
    statLabel: {
      display: "block",
      fontSize: 11,
      color: "#9ca3af",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontWeight: 600,
    },
    container: {
      maxWidth: 1260,
      margin: "0 auto",
      padding: "28px 24px 64px",
    },
    controlsRow: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      marginBottom: 18,
    },
    searchBox: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: "10px 14px",
      flex: "1 1 240px",
      minWidth: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    searchInput: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      color: "#111827",
      fontSize: 14,
    },
    filterSelect: {
      border: "1px solid #e5e7eb",
      background: "#fff",
      color: "#374151",
      borderRadius: 10,
      padding: "10px 14px",
      outline: "none",
      fontSize: 14,
      cursor: "pointer",
      flexShrink: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    stateCard: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      padding: "48px 18px",
      textAlign: "center",
      color: "#9ca3af",
      fontSize: 15,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    },
    tableWrap: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    },
    tableScroll: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: 820 },
    th: {
      padding: "12px 14px",
      textAlign: "left",
      background: "#f9fafb",
      color: "#6b7280",
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.09em",
      borderBottom: "1px solid #f3f4f6",
      whiteSpace: "nowrap",
    },
    td: (last) => ({
      padding: "13px 14px",
      color: "#374151",
      fontSize: 14,
      borderBottom: last ? "none" : "1px solid #f3f4f6",
      verticalAlign: "middle",
    }),
    badge: (color, bg, border) => ({
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      color,
      background: bg,
      border: `1px solid ${border}`,
      whiteSpace: "nowrap",
    }),
    resultBadge: (color, fw) => ({
      fontWeight: fw || 700,
      fontSize: 13,
      color,
    }),
    vsCell: { display: "flex", flexDirection: "column", gap: 2 },
    vsName: { fontWeight: 700, color: "#111827" },
    vsMeta: { fontSize: 12, color: "#9ca3af" },
    dateCell: { display: "flex", flexDirection: "column", gap: 3 },
    datePrimary: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      color: "#374151",
      fontSize: 13,
    },
    dateSec: { fontSize: 12, color: "#9ca3af" },
    locCell: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      color: "#6b7280",
      fontSize: 13,
    },
    roundChip: {
      background: "#f0f9ff",
      color: "#0369a1",
      border: "1px solid #bae6fd",
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 12,
      fontWeight: 700,
      display: "inline-block",
    },
    tournamentName: { fontWeight: 600, color: "#1d4ed8", fontSize: 13 },
    rowNum: { color: "#d1d5db", fontWeight: 600, fontSize: 13 },
    pagination: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 20,
    },
    pageBtn: (active, disabled) => ({
      minWidth: 36,
      height: 36,
      borderRadius: 8,
      border: active ? "1.5px solid #ff4655" : "1px solid #e5e7eb",
      background: active ? "#fff1f2" : "#fff",
      color: active ? "#ff4655" : disabled ? "#d1d5db" : "#374151",
      cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      fontWeight: 700,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    }),
    countLabel: {
      textAlign: "center",
      color: "#9ca3af",
      fontSize: 13,
      marginTop: 10,
    },
  };

  return (
    <div style={S.page}>
      <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} />

      <div style={S.hero}>
        <div style={S.heroInner}>
          <h1 style={S.heroTitle}>
            <span style={S.heroIcon}>
              <Swords size={20} strokeWidth={2.5} />
            </span>
            Lịch Thi Đấu Của Tôi
          </h1>
          <p style={S.heroSub}>Theo dõi toàn bộ lịch thi đấu và kết quả của bạn</p>

          {!loading && !error && (
            <div style={S.statsBar}>
              {[
                { label: "Tổng trận", value: total, color: "#0f172a" },
                { label: "Thắng", value: won, color: "#16a34a" },
                { label: "Thua", value: lost, color: "#dc2626" },
                { label: "Hòa", value: drawn, color: "#d97706" },
                { label: "Sắp tới", value: upcomingCount, color: "#1d4ed8" },
              ].map(({ label, value, color }) => (
                <div key={label} style={S.statItem}>
                  <span style={S.statValue(color)}>{value}</span>
                  <span style={S.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={S.container}>
        <div style={S.controlsRow}>
          <div style={S.searchBox}>
            <Search size={16} color="#9ca3af" />
            <input
              style={S.searchInput}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm theo giải đấu, đối thủ, địa điểm..."
            />
          </div>
          <select
            style={S.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="UPCOMING">Sắp diễn ra</option>
            <option value="DONE">Đã kết thúc</option>
          </select>
        </div>

        {loading ? (
          <div style={S.stateCard}>
            <Trophy size={36} color="#d1d5db" style={{ display: "block", margin: "0 auto 14px" }} />
            <p style={{ margin: 0 }}>Đang tải lịch thi đấu...</p>
          </div>
        ) : error ? (
          <div style={{ ...S.stateCard, borderColor: "#fecaca", color: "#dc2626" }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.stateCard}>
            <Swords size={40} color="#d1d5db" style={{ display: "block", margin: "0 auto 14px" }} />
            <p style={{ margin: 0, fontWeight: 600, color: "#6b7280" }}>
              {searchText || filterStatus !== "ALL"
                ? "Không tìm thấy trận đấu phù hợp."
                : "Bạn chưa có trận đấu nào."}
            </p>
          </div>
        ) : (
          <>
            <div style={S.tableWrap}>
              <div style={S.tableScroll}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>#</th>
                      <th style={S.th}>Giải Đấu</th>
                      <th style={S.th}>Vòng</th>
                      <th style={S.th}>Đối thủ</th>
                      <th style={S.th}>Địa Điểm</th>
                      <th style={S.th}>Thời gian</th>
                      <th style={S.th}>Trạng thái</th>
                      <th style={{ ...S.th, textAlign: "center" }}>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((m, idx) => {
                      const { text: stText, color: stColor, bg: stBg, border: stBorder } =
                        statusLabel(m.status);
                      const playerSide = m.playerSide ?? 1;
                      const opponent =
                        m.opponentName ||
                        (playerSide === 1 ? m.player2Name : m.player1Name) ||
                        "TBD";
                      const { text: rText, color: rColor, fw: rFw } = resultLabel(
                        m.result,
                        playerSide,
                      );
                      const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                      const isLast = idx === paged.length - 1;

                      return (
                        <tr
                          key={m.matchId ?? idx}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          style={{ transition: "background 0.12s" }}
                        >
                          <td style={S.td(isLast)}>
                            <span style={S.rowNum}>{rowNum}</span>
                          </td>
                          <td style={S.td(isLast)}>
                            <span style={S.tournamentName}>{m.tournamentName || "–"}</span>
                          </td>
                          <td style={S.td(isLast)}>
                            {m.roundIndex != null ? (
                              <span style={S.roundChip}>Vòng {m.roundIndex}</span>
                            ) : m.roundName ? (
                              <span style={S.roundChip}>{m.roundName}</span>
                            ) : (
                              <span style={{ color: "#d1d5db" }}>–</span>
                            )}
                          </td>
                          <td style={S.td(isLast)}>
                            <div style={S.vsCell}>
                              <span style={S.vsName}>{opponent}</span>
                              {m.opponentRating != null && (
                                <span style={S.vsMeta}>Rank {m.opponentRating}</span>
                              )}
                            </div>
                          </td>
                          <td style={S.td(isLast)}>
                            <div style={S.locCell}>
                              <MapPin size={13} />
                              {m.location || "Online"}
                            </div>
                          </td>
                          <td style={S.td(isLast)}>
                            <div style={S.dateCell}>
                              <span style={S.datePrimary}>
                                <Calendar size={13} />
                                {formatDate(m.startTime)}
                              </span>
                              {formatTime(m.startTime) && (
                                <span style={S.dateSec}>{formatTime(m.startTime)}</span>
                              )}
                            </div>
                          </td>
                          <td style={S.td(isLast)}>
                            <span style={S.badge(stColor, stBg, stBorder)}>{stText}</span>
                          </td>
                          <td style={{ ...S.td(isLast), textAlign: "center" }}>
                            <span style={S.resultBadge(rColor, rFw)}>{rText}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div style={S.pagination}>
                <button
                  type="button"
                  style={S.pageBtn(false, currentPage === 1)}
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push(null);
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === null ? (
                      <span key={`ell-${i}`} style={{ color: "#d1d5db", padding: "0 4px" }}>…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        style={S.pageBtn(p === currentPage, false)}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    ),
                  )}

                <button
                  type="button"
                  style={S.pageBtn(false, currentPage === totalPages)}
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <p style={S.countLabel}>
              Hiển thị {paged.length} / {filtered.length} trận đấu
            </p>
          </>
        )}
      </div>
    </div>
  );
}
