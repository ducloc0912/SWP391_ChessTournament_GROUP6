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
  const [resultForm, setResultForm] = useState({ result: "" });
  const [attendanceMatch, setAttendanceMatch] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({ whitePresent: true, blackPresent: true });
  const [attendanceGameNumber, setAttendanceGameNumber] = useState(1);

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
        // Backend trả { tournaments, matches }; nếu lỗi có thể trả { success: false, message }
        const list = data && typeof data === "object" && Array.isArray(data.matches)
          ? data.matches
          : Array.isArray(data) ? data : [];
        const tid = parseInt(tournamentId, 10);
        if (Number.isNaN(tid)) {
          setMatches([]);
          return;
        }
        // So sánh cả number và string (API có thể trả tournamentId là number)
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
      const forThisTournament = Number.isNaN(tid) ? [] : list.filter((m) => {
        const mid = m.tournamentId ?? m.tournament_id;
        return mid != null && Number(mid) === tid;
      });
      setMatches(forThisTournament);
    } catch {
      setMatches([]);
    }
  };

 const handleStartMatch = async (m) => {
    if (!window.confirm("Bắt đầu ván tiếp theo của trận này?")) return;

    let gameNumber = null;

    if (m.game1Status === "Scheduled") {
      gameNumber = m.game1Number;
    } else if (m.game1Status === "Completed" && m.game2Status === "Scheduled") {
      gameNumber = m.game2Number;
    } else if (m.tiebreakStatus === "Scheduled") {
      gameNumber = m.tiebreakNumber;
    }

    if (!gameNumber) {
      alert("Không xác định được ván cần bắt đầu.");
      return;
    }

    setSaving(true);

    try {
      const url = `${API_BASE}/api/referee/matches?action=start&matchId=${m.matchId}&gameNumber=${gameNumber}`;

      const res = await axios.post(url, null, { withCredentials: true });

      alert(res?.data?.message || "Đã bắt đầu ván đấu.");

      await refreshMatches();

    } catch (err) {
      alert(err?.response?.data?.message || "Không thể bắt đầu trận.");
    } finally {
      setSaving(false);
    }
  };

  const openResultModal = (m) => {
    let gameNumber = 1;
    if (m.game1Status === "Ongoing") gameNumber = m.game1Number;
    else if (m.game2Status === "Ongoing") gameNumber = m.game2Number;
    else if (m.tiebreakStatus === "Ongoing") gameNumber = m.tiebreakNumber;
    setSelectedMatch({ ...m, gameNumber });
    setResultForm({ result: "" });
  };

  const openAttendanceModal = (m, gameNumber) => {
    setAttendanceMatch(m);
    setAttendanceGameNumber(gameNumber);
    const isGame2 = gameNumber === 2;
    const whiteStatus = isGame2 ? m.whiteAttendanceStatus2 : m.whiteAttendanceStatus;
    const blackStatus = isGame2 ? m.blackAttendanceStatus2 : m.blackAttendanceStatus;
    setAttendanceForm({
      whitePresent: whiteStatus === "Absent" ? false : true,
      blackPresent: blackStatus === "Absent" ? false : true,
    });
  };

  const openEditAttendance = (match, gameNumber) => {

    setAttendanceMatch(match);
    setAttendanceGameNumber(gameNumber);

    const isGame2 = gameNumber === 2;

    const whiteStatus = isGame2
      ? match.whiteAttendanceStatus2
      : match.whiteAttendanceStatus;

    const blackStatus = isGame2
      ? match.blackAttendanceStatus2
      : match.blackAttendanceStatus;

    setAttendanceForm({
      whitePresent: whiteStatus === "Absent" ? false : true,
      blackPresent: blackStatus === "Absent" ? false : true
    });

  };

  const handleSubmitAttendance = async () => {
    if (!attendanceMatch) return;
    setSaving(true);
    try {
      const url = `${API_BASE}/api/referee/matches?action=attendance&matchId=${attendanceMatch.matchId}&gameNumber=${attendanceGameNumber}`;
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

  const handleSubmitResult = async () => {
  if (!selectedMatch) return;

  setSaving(true);

  try {
    const url = `${API_BASE}/api/referee/matches?action=finishGame&matchId=${selectedMatch.matchId}&gameNumber=${selectedMatch.gameNumber}`;

    const payload = {
      result: resultForm.result,
    };

    const res = await axios.post(url, payload, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    alert(res?.data?.message || "Đã lưu kết quả ván.");

    setSelectedMatch(null);

    await refreshMatches();
  } catch (err) {
    alert(err?.response?.data?.message || "Không thể lưu kết quả ván.");
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
    const winner = blackAbsent ? "white" : "black";
    const msg = blackAbsent
      ? "Đen vắng → Trắng thắng. Kết thúc trận?"
      : "Trắng vắng → Đen thắng. Kết thúc trận?";
    if (!window.confirm(msg)) return;
    setSaving(true);
    try {
      const url = `${API_BASE}/api/referee/matches?action=finish&matchId=${m.matchId}`;
      const res = await axios.post(
        url,
        { winner },
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

  const handleCreateTiebreak = async (m) => {
    if (!window.confirm("Tạo ván tiebreak?")) return;
    setSaving(true);
    try {
      const url = `${API_BASE}/api/referee/matches?action=createTiebreak&matchId=${m.matchId}`;
      const res = await axios.post(url, null, { withCredentials: true });
      alert(res?.data?.message || "Đã tạo ván tiebreak.");
      await refreshMatches();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể tạo.");
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

  const formatResultLabel = (match) => {
    const { result, whiteFirstName, whiteLastName, blackFirstName, blackLastName } = match || {};
    if (!result) return "";
    const whiteName = formatPlayerName(whiteFirstName, whiteLastName);
    const blackName = formatPlayerName(blackFirstName, blackLastName);
    if (result === "player1") return `${whiteName} thắng`;
    if (result === "player2") return `${blackName} thắng`;
    if (result === "draw") return "Hòa";
    if (result === "pending") return "Chưa có kết quả";
    if (result === "none") {
      return "2 thí sinh không thi đấu";
    }
    return String(result);
  };

  const formatGameResult = (result, match, gameNumber) => {
  if (!result) return "—";

  const whiteName = formatPlayerName(match.whiteFirstName, match.whiteLastName);
  const blackName = formatPlayerName(match.blackFirstName, match.blackLastName);

  if (result === "*") {
    
    if (gameNumber === 1 && match.game1Status === "Completed") {
      return "Không thi đấu";
    }

    if (gameNumber === 2 && match.game2Status === "Completed") {
      return "Không thi đấu";
    }

    return "Chưa có kết quả";
  }
  if (result === "1-0") return `${whiteName} thắng`;
  if (result === "0-1") return `${blackName} thắng`;
  if (result === "1/2-1/2") return "Hòa";

  return result;
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
            // Chỉ hiển thị trận được gán trực tiếp cho trọng tài này (assignedToMe / assigned_to_me)
            const myMatches = matches.filter((m) => {
              const a = m.assignedToMe ?? m.assigned_to_me;
              return a === true || a === 1;
            });
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
                    <p style={{ marginTop: 8 }}>
                      Trạng thái: {
                        m.game1Status === "Ongoing"
                          ? "Đang diễn ra - ván 1"
                          : m.game2Status === "Ongoing"
                          ? "Đang diễn ra - ván 2"
                          : m.tiebreakStatus === "Ongoing"
                          ? "Đang diễn ra - tiebreak"
                          : m.game1Status === "Completed" && m.game2Status === "Scheduled"
                          ? "Nghỉ giữa trận"
                          : formatStatus(m.status)
                      }
                    </p>
                    <p style={{ marginTop: 4, fontSize: "0.9rem", color: "#555" }}>
                      Điểm danh ván 1: Trắng {formatAttendance(m.whiteAttendanceStatus) || "—"} / Đen {formatAttendance(m.blackAttendanceStatus) || "—"}
                      {!(m.whiteAttendanceStatus || m.blackAttendanceStatus) && " (Chưa điểm danh)"}
                    </p>
                    <p style={{ marginTop: 2, fontSize: "0.9rem", color: "#555" }}>
                      Điểm danh ván 2: Trắng {formatAttendance(m.whiteAttendanceStatus2) || "—"} / Đen {formatAttendance(m.blackAttendanceStatus2) || "—"}
                      {!(m.whiteAttendanceStatus2 || m.blackAttendanceStatus2) && " (Chưa điểm danh)"}
                    </p>
                    <p style={{ marginTop: 4, fontSize: "0.9rem", color: "#444" }}>
                      Kết quả ván 1: {formatGameResult(m.game1Result, m, 1)}
                    </p>

                    <p style={{ marginTop: 2, fontSize: "0.9rem", color: "#444" }}>
                      Kết quả ván 2: {formatGameResult(m.game2Result, m, 2)}
                    </p>
                    {m.tiebreakStatus && (
                      <p style={{ marginTop: 2, fontSize: "0.9rem", color: "#444" }}>
                        Kết quả tie-break: {formatGameResult(m.tiebreakResult, m, 3)}
                      </p>
                    )}

                    {m.game1Status === "Completed" &&
                      m.game2Status === "Completed" &&
                      m.result &&
                      m.result !== "pending" && (
                        <p>
                          Kết quả trận đấu: {formatResultLabel(m)}
                        </p>
                      )}
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {m.status !== "Completed" && (
                      <>
                        {/* Game 1 attendance */}
                        {!m.whiteAttendanceStatus && !m.blackAttendanceStatus && (
                          <button
                            className="hpv-btn hpv-btn-primary"
                            disabled={saving}
                            onClick={() => openAttendanceModal(m, 1)}
                          >
                            Điểm danh ván 1
                          </button>
                        )}

                        {/* Start game 1 */}
                        {m.game1Status === "Scheduled" &&
                          m.whiteAttendanceStatus &&
                          m.blackAttendanceStatus && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                className="hpv-btn hpv-btn-primary"
                                onClick={() => openEditAttendance(m,1)}
                              >
                                Sửa điểm danh ván 1
                              </button>

                              <button
                                className="hpv-btn hpv-btn-primary"
                                disabled={saving}
                                onClick={() => handleStartMatch(m)}
                              >
                                Bắt đầu ván 1
                              </button>
                            </div>
                          )}

                        {/* Attendance game 2 only after game1 completed */}
                        {m.game1Status === "Completed" &&
                          m.game2Status === "Scheduled" &&
                          !m.whiteAttendanceStatus2 &&
                          !m.blackAttendanceStatus2 && (
                            <button
                              className="hpv-btn hpv-btn-primary"
                              disabled={saving}
                              onClick={() => openAttendanceModal(m, 2)}
                            >
                              Điểm danh ván 2
                            </button>
                          )}

                        {/* Start game 2 */}
                        {m.game1Status === "Completed" &&
                          m.game2Status === "Scheduled" &&
                          m.whiteAttendanceStatus2 &&
                          m.blackAttendanceStatus2 && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                className="hpv-btn hpv-btn-primary"
                                onClick={() => openEditAttendance(m,2)}
                              >
                                Sửa điểm danh ván 2
                              </button>
                            <button
                              className="hpv-btn hpv-btn-primary"
                              disabled={saving}
                              onClick={() => handleStartMatch(m)}
                            >
                              Bắt đầu ván 2
                            </button>
                            </div>
                          )}
                      </>
                    )}
                      {(m.game1Status === "Ongoing" ||
                        m.game2Status === "Ongoing" ||
                        m.tiebreakStatus === "Ongoing") && (
                        <button
                          className="hpv-btn hpv-btn-primary"
                          disabled={saving}
                          onClick={() => openResultModal(m)}
                        >
                          Nhập kết quả
                        </button>
                      )}
                      {m.status === "Ongoing" && 
                      m.game1Status == "Completed" && 
                      m.game2Status == "Completed" && 
                      m.result === "pending" && 
                      m.tournamentFormat?.toLowerCase() === "knockout" &&
                      !m.tiebreakNumber && (
                        <button
                          className="hpv-btn hpv-btn-primary"
                          disabled={saving}
                          onClick={() => handleCreateTiebreak(m)}
                        >
                          Tạo ván tiebreak
                        </button>
                      )}
                      {m.tiebreakStatus === "Scheduled" && (
                        <button
                          className="hpv-btn hpv-btn-primary"
                          disabled={saving}
                          onClick={() => handleStartMatch(m)}
                        >
                          Bắt đầu ván tiebreak
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
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: 12 }}>
            Áp dụng cho ván hiện tại.
            </p>
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
            <h3>Nhập kết quả ván</h3>
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
              <span>Kết quả ván</span>
              <select
                value={resultForm.result}
                onChange={(e) => setResultForm((prev) => ({ ...prev, result: e.target.value }))}
              >
                <option value="">-- Chọn kết quả ván --</option>
                <option value="1-0">Trắng thắng (1-0)</option>
                <option value="0-1">Đen thắng (0-1)</option>
                {resultForm.gameNumber == selectedMatch.tiebreakNumber && (
                  <option value="1/2-1/2">Hòa (1/2-1/2)</option>
                )}
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
                disabled={saving || !resultForm.result}
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
