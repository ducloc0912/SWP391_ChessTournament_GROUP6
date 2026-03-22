import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import { ArrowLeft } from "lucide-react";
import "../../assets/css/HomePage.css";
import { API_BASE } from "../../config/api";

const RefereeMatchDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tournamentId, matchId } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [saving, setSaving] = useState(false);

  const [attendanceMatch, setAttendanceMatch] = useState(null);
  const [attendanceGameNumber, setAttendanceGameNumber] = useState(1);
  const [attendanceForm, setAttendanceForm] = useState({ whitePresent: true, blackPresent: true });

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [resultForm, setResultForm] = useState({ result: "" });

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
    if (!matchId) return;
    fetchMatch();
  }, [matchId, navigate]);

  const fetchMatch = async () => {
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
      const found = list.find((m) => Number(m.matchId) === Number(matchId));
      setMatch(found || null);
    } catch (err) {
      console.error("Load match error:", err);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

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

  const formatAttendance = (status) => {
    if (!status) return null;
    if (status === "Present") return "Có mặt";
    if (status === "Absent") return "Vắng";
    return "Chưa điểm danh";
  };

  const formatGameResult = (result, m, gameNumber) => {
    if (!result) return "—";
    const whiteName = gameNumber === 2
      ? formatPlayerName(m.whiteFirstName2, m.whiteLastName2)
      : formatPlayerName(m.whiteFirstName1, m.whiteLastName1);
    const blackName = gameNumber === 2
      ? formatPlayerName(m.blackFirstName2, m.blackLastName2)
      : formatPlayerName(m.blackFirstName1, m.blackLastName1);
    if (result === "*") {
      if (gameNumber === 1 && m.game1Status === "Completed") return "Không thi đấu";
      if (gameNumber === 2 && m.game2Status === "Completed") return "Không thi đấu";
      return "Chưa có kết quả";
    }
    if (result === "1-0") return `${whiteName} thắng`;
    if (result === "0-1") return `${blackName} thắng`;
    if (result === "1/2-1/2") return "Hòa";
    return result;
  };

  const formatResultLabel = (m) => {
    if (!m?.result) return "";
    const whiteName = formatPlayerName(m.whiteFirstName1, m.whiteLastName1);
    const blackName = formatPlayerName(m.blackFirstName1, m.blackLastName1);
    if (m.result === "player1") return `${whiteName} thắng`;
    if (m.result === "player2") return `${blackName} thắng`;
    if (m.result === "draw") return "Hòa";
    if (m.result === "pending") return "Chưa có kết quả";
    if (m.result === "none") return "2 thí sinh không thi đấu";
    return String(m.result);
  };

  const formatStartTime = (startTime) => {
    if (!startTime) return "—";
    const d = new Date(startTime);
    if (Number.isNaN(d.getTime())) return String(startTime);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openAttendanceModal = (m, gameNumber) => {
    setAttendanceMatch(m);
    setAttendanceGameNumber(gameNumber);
    const isGame2 = gameNumber === 2;
    const whiteStatus = isGame2 ? m.whiteAttendanceStatus2 : m.whiteAttendanceStatus;
    const blackStatus = isGame2 ? m.blackAttendanceStatus2 : m.blackAttendanceStatus;
    setAttendanceForm({
      whitePresent: whiteStatus !== "Absent",
      blackPresent: blackStatus !== "Absent",
    });
  };

  const openResultModal = (m) => {
    let gameNumber = 1;
    if (m.game1Status === "Ongoing") gameNumber = m.game1Number;
    else if (m.game2Status === "Ongoing") gameNumber = m.game2Number;
    else if (m.tiebreakStatus === "Ongoing") gameNumber = m.tiebreakNumber;
    setSelectedMatch({ ...m, gameNumber });
    setResultForm({ result: "" });
  };

  const handleSubmitAttendance = async () => {
    if (!attendanceMatch) return;
    setSaving(true);
    try {
      const url = `${API_BASE}/api/referee/matches?action=attendance&matchId=${attendanceMatch.matchId}&gameNumber=${attendanceGameNumber}`;
      const res = await axios.post(url, attendanceForm, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      alert(res?.data?.message || "Đã lưu điểm danh.");
      setAttendanceMatch(null);
      await fetchMatch();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể lưu điểm danh.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartMatch = async (m, gameNumber) => {
    if (!window.confirm("Bắt đầu ván này?")) return;
    setSaving(true);
    try {
      const url = `${API_BASE}/api/referee/matches?action=start&matchId=${m.matchId}&gameNumber=${gameNumber}`;
      const res = await axios.post(url, null, { withCredentials: true });
      alert(res?.data?.message || "Đã bắt đầu ván đấu.");
      await fetchMatch();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể bắt đầu trận.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;
    setSaving(true);
    try {
      const url = `${API_BASE}/api/referee/matches?action=finishGame&matchId=${selectedMatch.matchId}&gameNumber=${selectedMatch.gameNumber}`;
      const res = await axios.post(url, { result: resultForm.result }, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      alert(res?.data?.message || "Đã lưu kết quả ván.");
      setSelectedMatch(null);
      await fetchMatch();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể lưu kết quả ván.");
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
      await fetchMatch();
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể tạo.");
    } finally {
      setSaving(false);
    }
  };

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
            onClick={() => navigate(`/referee/matches/${tournamentId}`)}
          >
            <ArrowLeft size={18} />
            Quay lại danh sách trận
          </button>

          {loading ? (
            <div className="hpv-empty-card">Đang tải thông tin trận...</div>
          ) : !match ? (
            <div className="hpv-empty-card">Không tìm thấy trận đấu.</div>
          ) : (
            <>
              <div className="hpv-section-head">
                <h2>QUẢN LÝ TRẬN ĐẤU</h2>
                <p>{match.tournamentName}</p>
              </div>

              <article className="hpv-latest-card" style={{ maxWidth: 640, margin: "0 auto" }}>
                <div className="hpv-latest-body">
                  <div className="hpv-meta-line">
                    <span>
                      {match.roundName || `Round ${match.roundIndex || "?"}`}
                      {match.boardNumber ? ` - Board ${match.boardNumber}` : ""}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>
                    Thời gian bắt đầu: {formatStartTime(match.startTime)}
                  </p>

                  <p style={{ margin: "12px 0 4px", fontWeight: 600, fontSize: "1.1rem", textAlign: "center" }}>
                    {formatPlayerName(match.whiteFirstName1, match.whiteLastName1)}
                    {" "}
                    <span style={{ color: "#c0392b" }}>
                      {(() => {
                        // p1 = người chơi trắng ở ván 1, p2 = người chơi đen ở ván 1
                        let p1 = 0, p2 = 0;
                        const addScore = (result, p1IsWhite) => {
                          if (result === "1-0") { if (p1IsWhite) p1 += 1; else p2 += 1; }
                          else if (result === "0-1") { if (p1IsWhite) p2 += 1; else p1 += 1; }
                          else if (result === "1/2-1/2") { p1 += 0.5; p2 += 0.5; }
                        };
                        // Ván 1: p1 là trắng
                        addScore(match.game1Result, true);
                        // Ván 2: kiểm tra ai là trắng (so sánh với ván 1)
                        const game2SameOrientation =
                          match.whiteFirstName2 === match.whiteFirstName1 &&
                          match.whiteLastName2 === match.whiteLastName1;
                        addScore(match.game2Result, game2SameOrientation);
                        // Tiebreak: thường giữ nguyên màu ván 1
                        addScore(match.tiebreakResult, true);
                        const fmt = (n) => n % 1 === 0 ? String(n) : n.toFixed(1);
                        return `${fmt(p1)} - ${fmt(p2)}`;
                      })()}
                    </span>
                    {" "}
                    {formatPlayerName(match.blackFirstName1, match.blackLastName1)}
                  </p>
                  <p style={{ marginTop: 8 }}>Trạng thái trận: {formatStatus(match.status)}</p>

                  {/* VÁN 1 */}
                  <div style={{ marginTop: 16, padding: 12, background: "#f8f8f8", borderRadius: 8 }}>
                    <h4 style={{ margin: "0 0 8px" }}>Ván 1 — {formatStatus(match.game1Status)}</h4>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#444" }}>
                      Quân trắng: <strong>{formatPlayerName(match.whiteFirstName1, match.whiteLastName1)}</strong>
                      {" / "}
                      Quân đen: <strong>{formatPlayerName(match.blackFirstName1, match.blackLastName1)}</strong>
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                      Điểm danh:{" "}
                      {formatPlayerName(match.whiteFirstName1, match.whiteLastName1)} ({formatAttendance(match.whiteAttendanceStatus) || "—"})
                      {" / "}
                      {formatPlayerName(match.blackFirstName1, match.blackLastName1)} ({formatAttendance(match.blackAttendanceStatus) || "—"})
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                      Kết quả: {formatGameResult(match.game1Result, match, 1)}
                    </p>
                    {match.status !== "Completed" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        {!match.whiteAttendanceStatus && !match.blackAttendanceStatus && (
                          <button className="hpv-btn hpv-btn-primary" disabled={saving} onClick={() => openAttendanceModal(match, 1)}>
                            Điểm danh ván 1
                          </button>
                        )}
                        {match.game1Status === "Scheduled" && match.whiteAttendanceStatus && match.blackAttendanceStatus && (
                          <>
                            <button className="hpv-btn hpv-btn-secondary" disabled={saving} onClick={() => openAttendanceModal(match, 1)}>
                              Sửa điểm danh
                            </button>
                            <button className="hpv-btn hpv-btn-primary" disabled={saving} onClick={() => handleStartMatch(match, match.game1Number || 1)}>
                              Bắt đầu ván 1
                            </button>
                          </>
                        )}
                        {match.game1Status === "Ongoing" && (
                          <button className="hpv-btn hpv-btn-primary" disabled={saving} onClick={() => openResultModal(match)}>
                            Nhập kết quả ván 1
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* VÁN 2 */}
                  <div style={{ marginTop: 12, padding: 12, background: "#f8f8f8", borderRadius: 8 }}>
                    <h4 style={{ margin: "0 0 8px" }}>Ván 2 — {formatStatus(match.game2Status)}</h4>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#444" }}>
                      Quân trắng: <strong>{formatPlayerName(match.whiteFirstName2, match.whiteLastName2)}</strong>
                      {" / "}
                      Quân đen: <strong>{formatPlayerName(match.blackFirstName2, match.blackLastName2)}</strong>
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                      Điểm danh:{" "}
                      {formatPlayerName(match.whiteFirstName2, match.whiteLastName2)} ({formatAttendance(match.whiteAttendanceStatus2) || "—"})
                      {" / "}
                      {formatPlayerName(match.blackFirstName2, match.blackLastName2)} ({formatAttendance(match.blackAttendanceStatus2) || "—"})
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                      Kết quả: {formatGameResult(match.game2Result, match, 2)}
                    </p>
                    {match.status !== "Completed" && match.game1Status === "Completed" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        {!match.whiteAttendanceStatus2 && !match.blackAttendanceStatus2 && (
                          <button className="hpv-btn hpv-btn-primary" disabled={saving} onClick={() => openAttendanceModal(match, 2)}>
                            Điểm danh ván 2
                          </button>
                        )}
                        {match.game2Status === "Scheduled" && match.whiteAttendanceStatus2 && match.blackAttendanceStatus2 && (
                          <>
                            <button className="hpv-btn hpv-btn-secondary" disabled={saving} onClick={() => openAttendanceModal(match, 2)}>
                              Sửa điểm danh
                            </button>
                            <button className="hpv-btn hpv-btn-primary" disabled={saving} onClick={() => handleStartMatch(match, match.game2Number || 2)}>
                              Bắt đầu ván 2
                            </button>
                          </>
                        )}
                        {match.game2Status === "Ongoing" && (
                          <button className="hpv-btn hpv-btn-primary" disabled={saving} onClick={() => openResultModal(match)}>
                            Nhập kết quả ván 2
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TIEBREAK */}
                  {match.tiebreakStatus && (
                    <div style={{ marginTop: 12, padding: 12, background: "#f8f8f8", borderRadius: 8 }}>
                      <h4 style={{ margin: "0 0 8px" }}>Tiebreak — {formatStatus(match.tiebreakStatus)}</h4>
                      <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                        Kết quả: {formatGameResult(match.tiebreakResult, match, 3)}
                      </p>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        {match.tiebreakStatus === "Scheduled" && (
                          <button className="hpv-btn hpv-btn-primary" disabled={saving} onClick={() => handleStartMatch(match, match.tiebreakNumber)}>
                            Bắt đầu ván tiebreak
                          </button>
                        )}
                        {match.tiebreakStatus === "Ongoing" && (
                          <button className="hpv-btn hpv-btn-primary" disabled={saving} onClick={() => openResultModal(match)}>
                            Nhập kết quả tiebreak
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TẠO TIEBREAK / HÒA / KẾT QUẢ TRẬN */}
                  {match.game1Status === "Completed" && match.game2Status === "Completed" && (
                    <>
                      {/* Hòa 2 ván chính trong knockout → tạo tiebreak */}
                      {match.result === "pending" &&
                        match.tournamentFormat?.toLowerCase() === "knockout" &&
                        !match.tiebreakNumber && (
                          <div style={{ marginTop: 16, padding: 12, background: "#fff3cd", borderRadius: 8 }}>
                            <p style={{ fontWeight: 600, margin: "0 0 8px" }}>Hòa điểm — cần ván tiebreak</p>
                            <button className="hpv-btn hpv-btn-primary" disabled={saving} onClick={() => handleCreateTiebreak(match)}>
                              Tạo ván tiebreak
                            </button>
                          </div>
                        )}

                      {/* Có kết quả rõ ràng */}
                      {match.result && match.result !== "pending" && (
                        <div style={{ marginTop: 16, padding: 12, background: "#e8f5e9", borderRadius: 8 }}>
                          <p style={{ fontWeight: 600, margin: 0 }}>
                            Kết quả trận đấu: {formatResultLabel(match)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </article>
            </>
          )}
        </div>
      </section>

      {/* Modal Điểm danh */}
      {attendanceMatch && (
        <div className="modal-overlay" onClick={() => !saving && setAttendanceMatch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Điểm danh người chơi — Ván {attendanceGameNumber}</h3>
            
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ whiteSpace: "nowrap" }}>
                {attendanceGameNumber === 2
                  ? formatPlayerName(attendanceMatch.whiteFirstName2, attendanceMatch.whiteLastName2)
                  : formatPlayerName(attendanceMatch.whiteFirstName1, attendanceMatch.whiteLastName1)}
              </span>
              <input
                type="checkbox"
                checked={attendanceForm.whitePresent}
                onChange={(e) => setAttendanceForm((prev) => ({ ...prev, whitePresent: e.target.checked }))}
                style={{ width: 13, height: 13, marginRight: 10, flexShrink: 0 }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ whiteSpace: "nowrap" }}>
                {attendanceGameNumber === 2
                  ? formatPlayerName(attendanceMatch.blackFirstName2, attendanceMatch.blackLastName2)
                  : formatPlayerName(attendanceMatch.blackFirstName1, attendanceMatch.blackLastName1)}
              </span>
              <input
                type="checkbox"
                checked={attendanceForm.blackPresent}
                onChange={(e) => setAttendanceForm((prev) => ({ ...prev, blackPresent: e.target.checked }))}
                style={{ width: 13, height: 13, marginRight: 10, flexShrink: 0 }}
              />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="hpv-btn hpv-btn-secondary" disabled={saving} onClick={() => setAttendanceMatch(null)}>
                Hủy
              </button>
              <button type="button" className="hpv-btn hpv-btn-primary" disabled={saving} onClick={handleSubmitAttendance}>
                {saving ? "Đang lưu..." : "Lưu điểm danh"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kết quả */}
      {selectedMatch && (
        <div className="modal-overlay" onClick={() => !saving && setSelectedMatch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nhập kết quả ván</h3>
            <label className="ui-field">
              <span>Kết quả ván</span>
              <select
                value={resultForm.result}
                onChange={(e) => setResultForm((prev) => ({ ...prev, result: e.target.value }))}
              >
                <option value="">-- Chọn kết quả ván --</option>
                <option value="1-0">
                  {selectedMatch.gameNumber === (selectedMatch.game2Number || 2)
                    ? formatPlayerName(selectedMatch.whiteFirstName2, selectedMatch.whiteLastName2)
                    : formatPlayerName(selectedMatch.whiteFirstName1, selectedMatch.whiteLastName1)} thắng
                </option>
                <option value="0-1">
                  {selectedMatch.gameNumber === (selectedMatch.game2Number || 2)
                    ? formatPlayerName(selectedMatch.blackFirstName2, selectedMatch.blackLastName2)
                    : formatPlayerName(selectedMatch.blackFirstName1, selectedMatch.blackLastName1)} thắng
                </option>
                {selectedMatch.gameNumber !== selectedMatch.tiebreakNumber && (
                  <option value="1/2-1/2">Hòa</option>
                )}
              </select>
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button type="button" className="hpv-btn hpv-btn-secondary" disabled={saving} onClick={() => setSelectedMatch(null)}>
                Hủy
              </button>
              <button type="button" className="hpv-btn hpv-btn-primary" disabled={saving || !resultForm.result} onClick={handleSubmitResult}>
                {saving ? "Đang lưu..." : "Lưu kết quả"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefereeMatchDetailPage;
