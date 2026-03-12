import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import { ArrowLeft } from "lucide-react";
import "../../assets/css/HomePage.css";
import { API_BASE } from "../../config/api";

/** Trang 2: Danh sách các trận được phân công trong một giải. */
const RefereeMatchListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tournamentId } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [resultForm, setResultForm] = useState({ result: "", termination: "" });
  const [attendanceMatch, setAttendanceMatch] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({ whitePresent: true, blackPresent: true });

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
    if (!user || !tournamentId) return;
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/referee/matches`, {
          withCredentials: true,
        });
        const data = res?.data;
        const list = data && typeof data === "object" && Array.isArray(data.matches)
          ? data.matches
          : Array.isArray(data) ? data : [];
        const tid = parseInt(tournamentId, 10);
        setMatches(list.filter((m) => m.tournamentId === tid));
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

  const refreshMatches = async () => {
    if (!tournamentId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/referee/matches`, {
        withCredentials: true,
      });
      const data = res?.data;
      const list = data && typeof data === "object" && Array.isArray(data.matches)
        ? data.matches
        : Array.isArray(data) ? data : [];
      const tid = parseInt(tournamentId, 10);
      setMatches(list.filter((m) => m.tournamentId === tid));
    } catch {
      setMatches([]);
    }
  };

  const handleStartMatch = async (m) => {
    if (!window.confirm("Bắt đầu trận này?")) return;
    setSaving(true);
    try {
      const url = `${API_BASE}/api/referee/matches?action=start&matchId=${m.matchId}`;
      const res = await axios.post(url, null, { withCredentials: true });
      alert(res?.data?.message || "Đã bắt đầu trận đấu.");
      await refreshMatches();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể bắt đầu trận.");
    } finally {
      setSaving(false);
    }
  };

  const openResultModal = (m) => {
    setSelectedMatch(m);
    setResultForm({ result: "", termination: "" });
  };

  const openAttendanceModal = (m) => {
    setAttendanceMatch(m);
    setAttendanceForm({
      whitePresent: m.whiteAttendanceStatus === "Absent" ? false : true,
      blackPresent: m.blackAttendanceStatus === "Absent" ? false : true,
    });
  };

  const handleSubmitAttendance = async () => {
    if (!attendanceMatch) return;
    setSaving(true);
    try {
      const url = `${API_BASE}/api/referee/matches?action=attendance&matchId=${attendanceMatch.matchId}`;
      const payload = {
        whitePresent: attendanceForm.whitePresent,
        blackPresent: attendanceForm.blackPresent,
      };
      const res = await axios.post(url, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      alert(res?.data?.message || "Đã lưu điểm danh.");
      setAttendanceMatch(null);
      await refreshMatches();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể lưu điểm danh.");
    } finally {
      setSaving(false);
    }
  };

  /** Kết thúc trận do 1 bên vắng: tự cập nhật kết quả forfeit (bên có mặt thắng). */
  const handleFinishForfeit = async (m) => {
    const whiteAbsent = m.whiteAttendanceStatus === "Absent";
    const blackAbsent = m.blackAttendanceStatus === "Absent";
    if (!whiteAbsent && !blackAbsent) {
      alert("Chỉ dùng khi có một bên vắng. Đã điểm danh đủ thì dùng Bắt đầu trận.");
      return;
    }
    if (whiteAbsent && blackAbsent) {
      alert("Hai bên đều vắng, không thể tự động kết thúc. Vui lòng nhập kết quả thủ công.");
      return;
    }
    const result = blackAbsent ? "1-0" : "0-1";
    const msg = blackAbsent
      ? "Đen vắng → Trắng thắng (1-0). Kết thúc trận?"
      : "Trắng vắng → Đen thắng (0-1). Kết thúc trận?";
    if (!window.confirm(msg)) return;
    setSaving(true);
    try {
      const url = `${API_BASE}/api/referee/matches?action=finish&matchId=${m.matchId}`;
      const res = await axios.post(
        url,
        { result, termination: "Forfeit" },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      alert(res?.data?.message || "Đã kết thúc trận (forfeit).");
      await refreshMatches();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể kết thúc trận.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;
    if (!resultForm.result) {
      alert("Vui lòng chọn kết quả.");
      return;
    }
    setSaving(true);
    try {
      const url = `${API_BASE}/api/referee/matches?action=finish&matchId=${selectedMatch.matchId}`;
      const payload = {
        result: resultForm.result,
        termination: resultForm.termination || null,
      };
      const res = await axios.post(url, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      alert(res?.data?.message || "Đã lưu kết quả.");
      setSelectedMatch(null);
      await refreshMatches();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể lưu kết quả.");
    } finally {
      setSaving(false);
    }
  };

  const formatPlayerName = (first, last) => {
    const parts = [first, last].filter(Boolean);
    return parts.length ? parts.join(" ") : "—";
  };

  const formatStatus = (s) => {
    if (!s) return "Unknown";
    switch (s) {
      case "Scheduled":
        return "Chưa bắt đầu";
      case "Ongoing":
        return "Đang diễn ra";
      case "Completed":
        return "Đã kết thúc";
      case "Cancelled":
        return "Đã hủy";
      case "Postponed":
        return "Hoãn";
      default:
        return s;
    }
  };

  const formatResultLabel = (result) => {
    if (!result) return "";
    switch (result) {
      case "1-0":
        return "Trắng thắng (1-0)";
      case "0-1":
        return "Đen thắng (0-1)";
      case "1/2-1/2":
        return "Hòa (1/2-1/2)";
      case "forfeit-w":
        return "Trắng thua (forfeit)";
      case "forfeit-b":
        return "Đen thua (forfeit)";
      default:
        return result;
    }
  };

  const formatAttendance = (status) => {
    if (!status) return null;
    if (status === "Present") return "Có mặt";
    if (status === "Absent") return "Vắng";
    return "Chưa điểm danh";
  };

  const formatStartTime = (startTime) => {
    if (!startTime) return "—";
    const d = new Date(startTime);
    if (Number.isNaN(d.getTime())) return String(startTime);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const tournamentName = matches.length > 0 ? matches[0].tournamentName : `Giải #${tournamentId}`;

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
          ) : (() => {
            const myMatches = matches.filter((m) => m.assignedToMe !== false);
            return myMatches.length === 0 ? (
              <div className="hpv-empty-card">Không có trận nào được phân công cho bạn trong giải này.</div>
            ) : (
            <div className="hpv-latest-grid">
              {myMatches.map((m) => (
                <article key={m.matchId} className="hpv-latest-card">
                  <div className="hpv-latest-body">
                    <div className="hpv-meta-line">
                      <span>
                        {m.roundName || (m.roundIndex ? `Round ${m.roundIndex}` : "Round ?")}{" "}
                        {m.boardNumber ? `- Board ${m.boardNumber}` : ""}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>
                      Thời gian bắt đầu: {formatStartTime(m.startTime)}
                    </p>
                    <h3 style={{ marginBottom: 4 }}>Cặp đấu</h3>
                    <p style={{ margin: "4px 0", fontWeight: 500 }}>
                      <span style={{ color: "#555" }}>Trắng:</span>{" "}
                      {formatPlayerName(m.whiteFirstName, m.whiteLastName)}
                    </p>
                    <p style={{ margin: "4px 0", fontWeight: 500 }}>
                      <span style={{ color: "#333" }}>Đen:</span>{" "}
                      {formatPlayerName(m.blackFirstName, m.blackLastName)}
                    </p>
                    <p style={{ marginTop: 8 }}>Trạng thái: {formatStatus(m.status)}</p>
                    {(m.whiteAttendanceStatus || m.blackAttendanceStatus) && (
                      <p style={{ marginTop: 4, fontSize: "0.9rem", color: "#555" }}>
                        Điểm danh: Trắng {formatAttendance(m.whiteAttendanceStatus) ?? "—"} / Đen {formatAttendance(m.blackAttendanceStatus) ?? "—"}
                      </p>
                    )}
                    {m.result && (
                      <p>
                        Kết quả: {formatResultLabel(m.result)}{" "}
                        {m.termination ? ` — ${m.termination}` : ""}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      {m.status === "Scheduled" && (
                        <>
                          {!(m.whiteAttendanceStatus && m.blackAttendanceStatus) ? (
                            <button
                              type="button"
                              className="hpv-btn hpv-btn-primary"
                              disabled={saving}
                              onClick={() => openAttendanceModal(m)}
                            >
                              Điểm danh
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="hpv-btn hpv-btn-secondary"
                                disabled={saving}
                                onClick={() => openAttendanceModal(m)}
                              >
                                Sửa điểm danh
                              </button>
                              {m.whiteAttendanceStatus === "Present" && m.blackAttendanceStatus === "Present" && (
                                <button
                                  className="hpv-btn hpv-btn-primary"
                                  disabled={saving}
                                  onClick={() => handleStartMatch(m)}
                                >
                                  Bắt đầu trận
                                </button>
                              )}
                              {(m.whiteAttendanceStatus === "Absent" || m.blackAttendanceStatus === "Absent") && (
                                <button
                                  type="button"
                                  className="hpv-btn hpv-btn-primary"
                                  disabled={saving}
                                  onClick={() => handleFinishForfeit(m)}
                                >
                                  Kết thúc (1 bên vắng)
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                      {m.status === "Ongoing" && (
                        <button
                          className="hpv-btn hpv-btn-primary"
                          disabled={saving}
                          onClick={() => openResultModal(m)}
                        >
                          Nhập kết quả
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            );
          })()}
        </div>
      </section>

      {attendanceMatch && (
        <div className="modal-overlay" onClick={() => !saving && setAttendanceMatch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Điểm danh người chơi</h3>
            <div style={{ marginBottom: 12, padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <p style={{ margin: "4px 0", fontWeight: 600 }}>
                <span style={{ color: "#666" }}>Trắng:</span>{" "}
                {formatPlayerName(attendanceMatch.whiteFirstName, attendanceMatch.whiteLastName)}
              </p>
              <p style={{ margin: "4px 0", fontWeight: 600 }}>
                <span style={{ color: "#333" }}>Đen:</span>{" "}
                {formatPlayerName(attendanceMatch.blackFirstName, attendanceMatch.blackLastName)}
              </p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={attendanceForm.whitePresent}
                onChange={(e) => setAttendanceForm((prev) => ({ ...prev, whitePresent: e.target.checked }))}
              />
              <span>Trắng có mặt</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={attendanceForm.blackPresent}
                onChange={(e) => setAttendanceForm((prev) => ({ ...prev, blackPresent: e.target.checked }))}
              />
              <span>Đen có mặt</span>
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                className="hpv-btn hpv-btn-secondary"
                disabled={saving}
                onClick={() => setAttendanceMatch(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="hpv-btn hpv-btn-primary"
                disabled={saving}
                onClick={handleSubmitAttendance}
              >
                {saving ? "Đang lưu..." : "Lưu điểm danh"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMatch && (
        <div className="modal-overlay" onClick={() => !saving && setSelectedMatch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nhập kết quả trận</h3>
            <div style={{ marginBottom: 12, padding: "8px 0", borderBottom: "1px solid #eee" }}>
              <p style={{ margin: "4px 0", fontWeight: 600 }}>
                <span style={{ color: "#666" }}>Trắng (quân trắng):</span>{" "}
                {formatPlayerName(selectedMatch.whiteFirstName, selectedMatch.whiteLastName)}
              </p>
              <p style={{ margin: "4px 0", fontWeight: 600 }}>
                <span style={{ color: "#333" }}>Đen (quân đen):</span>{" "}
                {formatPlayerName(selectedMatch.blackFirstName, selectedMatch.blackLastName)}
              </p>
            </div>

            <label className="ui-field">
              <span>Kết quả</span>
              <select
                value={resultForm.result}
                onChange={(e) => setResultForm((prev) => ({ ...prev, result: e.target.value }))}
              >
                <option value="">-- Chọn kết quả --</option>
                <option value="1-0">Trắng thắng (1-0)</option>
                <option value="0-1">Đen thắng (0-1)</option>
                <option value="1/2-1/2">Hòa (1/2-1/2)</option>
                <option value="forfeit-w">Trắng thua (bỏ cuộc / no-show)</option>
                <option value="forfeit-b">Đen thua (bỏ cuộc / no-show)</option>
              </select>
            </label>

            <label className="ui-field">
              <span>Lý do kết thúc (tùy chọn)</span>
              <select
                value={resultForm.termination}
                onChange={(e) =>
                  setResultForm((prev) => ({ ...prev, termination: e.target.value }))
                }
              >
                <option value="">-- Chọn lý do --</option>
                <option value="Checkmate">Checkmate</option>
                <option value="Resignation">Resignation</option>
                <option value="Timeout">Timeout</option>
                <option value="Stalemate">Stalemate</option>
                <option value="Draw">Draw (thỏa thuận)</option>
                <option value="Forfeit">Forfeit</option>
                <option value="Adjudication">Adjudication</option>
              </select>
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                className="hpv-btn hpv-btn-secondary"
                disabled={saving}
                onClick={() => setSelectedMatch(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="hpv-btn hpv-btn-primary"
                disabled={saving}
                onClick={handleSubmitResult}
              >
                {saving ? "Đang lưu..." : "Lưu kết quả"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefereeMatchListPage;
