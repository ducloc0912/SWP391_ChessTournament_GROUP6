import React, { useEffect, useState } from "react";
import axios from "axios";
import MainHeader from "../../component/common/MainHeader";
import { API_BASE } from "../../config/api";

export default function UserReportPage() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [kind, setKind] = useState("VIOLATION"); // VIOLATION | SYSTEM
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedAccusedId, setSelectedAccusedId] = useState("");
  const [violationType, setViolationType] = useState("Cheating");

  const [matches, setMatches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [loadingList, setLoadingList] = useState(false);
  const [reports, setReports] = useState([]);
  const [role, setRole] = useState(() => {
    try {
      return localStorage.getItem("role") || "";
    } catch {
      return "";
    }
  });

  const loadReports = async () => {
    try {
      setLoadingList(true);
      const res = await axios
        .get(`${API_BASE}/api/reports`, { withCredentials: true })
        .catch(() => null);
      setReports(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setReports([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  useEffect(() => {
    // Load all public matches for violation report dropdowns
    const loadMatches = async () => {
      try {
        const res = await axios
          .get(`${API_BASE}/api/public/tournaments?action=allMatches`)
          .catch(() => null);
        setMatches(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setMatches([]);
      }
    };
    loadMatches();
  }, []);

  const violationTournaments = React.useMemo(() => {
    const map = new Map();
    matches.forEach((m) => {
      if (!m.tournamentId) return;
      if (!map.has(m.tournamentId)) {
        map.set(m.tournamentId, {
          tournamentId: m.tournamentId,
          tournamentName: m.tournamentName || `Tournament ${m.tournamentId}`,
        });
      }
    });
    return Array.from(map.values());
  }, [matches]);

  const matchesInSelectedTournament = React.useMemo(() => {
    if (!selectedTournamentId) return [];
    const tid = Number(selectedTournamentId);
    return matches.filter((m) => Number(m.tournamentId) === tid);
  }, [matches, selectedTournamentId]);

  const selectedMatch = React.useMemo(
    () =>
      matchesInSelectedTournament.find(
        (m) => Number(m.matchId) === Number(selectedMatchId),
      ),
    [matchesInSelectedTournament, selectedMatchId],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setSubmitError("");
    setSubmitSuccess("");

    if (!description.trim()) {
      setSubmitError("Vui lòng nhập mô tả.");
      return;
    }

    if (kind === "VIOLATION") {
      if (!selectedTournamentId) {
        setSubmitError("Vui lòng chọn giải đấu.");
        return;
      }
      if (!selectedMatchId) {
        setSubmitError("Vui lòng chọn trận đấu.");
        return;
      }
      if (!selectedAccusedId) {
        setSubmitError("Vui lòng chọn người chơi để tố cáo.");
        return;
      }
    }
    try {
      setSubmitting(true);
      const payload = {
        description: description.trim(),
      };

      if (kind === "VIOLATION") {
        payload.type = violationType; // Cheating hoặc Misconduct
        payload.matchId = Number(selectedMatchId);
        payload.accusedId = Number(selectedAccusedId);
      } else {
        payload.type = "TechnicalIssue"; // map system UI -> TechnicalIssue in DB
        if (evidenceUrl.trim()) {
          payload.evidenceUrl = evidenceUrl.trim();
        } else {
          payload.evidenceUrl = "";
        }
      }

      if (kind === "VIOLATION") {
        // evidence link không bắt buộc, nhưng nếu có thì gửi
        if (evidenceUrl.trim()) {
          payload.evidenceUrl = evidenceUrl.trim();
        } else {
          payload.evidenceUrl = "";
        }
      }

      const res = await axios.post(`${API_BASE}/api/reports`, payload, {
        withCredentials: true,
      });
      if (res?.data?.success) {
        setSubmitSuccess("Gửi report thành công.");
        setDescription("");
        setEvidenceUrl("");
        setSelectedTournamentId("");
        setSelectedMatchId("");
        setSelectedAccusedId("");
        await loadReports();
      } else {
        setSubmitError(
          res?.data?.message || "Gửi report thất bại. Vui lòng thử lại.",
        );
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Gửi report thất bại. Vui lòng thử lại.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (v) => {
    if (!v) return "—";
    try {
      return new Date(v).toLocaleString("vi-VN");
    } catch {
      return String(v);
    }
  };

  const typeLabel = (t) => {
    switch (t) {
      case "Cheating":
        return "Gian lận";
      case "Misconduct":
        return "Hành vi xấu";
      case "TechnicalIssue":
        return "Lỗi hệ thống";
      default:
        return t || "Khác";
    }
  };

  return (
    <div className="tdp-page">
      <MainHeader
        user={user}
        onLogout={() => {
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          setUser(null);
          setRole("");
          window.location.href = "/login";
        }}
        currentPath="/user/reports"
      />

      <div className="tdp-container" style={{ maxWidth: 960, marginTop: 24 }}>
        <div
          style={{
            border: "1px solid rgba(15,23,42,0.12)",
            padding: 20,
            background: "#fff",
            marginBottom: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Gửi Report</h2>
          <p style={{ color: "#6b7280", fontSize: 13 }}>
            Chọn loại report và cung cấp thông tin tương ứng. Với violation, hãy
            chọn giải, trận và người chơi liên quan. Với system, chỉ cần mô tả lỗi
            và đính kèm link nếu có.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Loại report
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                style={{ padding: 8, width: "100%" }}
              >
                {(() => {
                  const normalizedRole = (role || "")
                    .toString()
                    .toUpperCase()
                    .replace(/[\s_]/g, "");
                  const isPlayer =
                    !normalizedRole || normalizedRole === "PLAYER";
                  if (isPlayer) {
                    return (
                      <>
                        <option value="VIOLATION">
                          Violation (tố cáo người chơi)
                        </option>
                        <option value="SYSTEM">
                          System (lỗi hệ thống)
                        </option>
                      </>
                    );
                  }
                  // Các role khác chỉ được gửi system report
                  if (kind !== "SYSTEM") {
                    setKind("SYSTEM");
                  }
                  return (
                    <option value="SYSTEM">
                      System (lỗi hệ thống)
                    </option>
                  );
                })()}
              </select>
            </div>

            {kind === "VIOLATION" && (
              <>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Loại vi phạm
                  </label>
                  <select
                    value={violationType}
                    onChange={(e) => setViolationType(e.target.value)}
                    style={{ padding: 8, width: "100%" }}
                  >
                    <option value="Cheating">Gian lận (Cheating)</option>
                    <option value="Misconduct">Hành vi xấu (Misconduct)</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Giải đấu
                  </label>
                  <select
                    value={selectedTournamentId}
                    onChange={(e) => {
                      setSelectedTournamentId(e.target.value);
                      setSelectedMatchId("");
                      setSelectedAccusedId("");
                    }}
                    style={{ padding: 8, width: "100%" }}
                  >
                    <option value="">-- Chọn giải đấu --</option>
                    {violationTournaments.map((t) => (
                      <option key={t.tournamentId} value={t.tournamentId}>
                        {t.tournamentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Trận đấu
                    </label>
                    <select
                      value={selectedMatchId}
                      onChange={(e) => {
                        setSelectedMatchId(e.target.value);
                        setSelectedAccusedId("");
                      }}
                      style={{ padding: 8, width: "100%" }}
                      disabled={!selectedTournamentId}
                    >
                      <option value="">-- Chọn trận đấu --</option>
                      {matchesInSelectedTournament.map((m) => (
                        <option key={m.matchId} value={m.matchId}>
                          Match #{m.matchId} (Board {m.boardNumber ?? "?"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Người chơi bị tố cáo
                    </label>
                    <select
                      value={selectedAccusedId}
                      onChange={(e) => setSelectedAccusedId(e.target.value)}
                      style={{ padding: 8, width: "100%" }}
                      disabled={!selectedMatch}
                    >
                      <option value="">-- Chọn người chơi --</option>
                      {selectedMatch && (
                        <>
                          {selectedMatch.whitePlayerId && (
                            <option value={selectedMatch.whitePlayerId}>
                              White player (ID: {selectedMatch.whitePlayerId})
                            </option>
                          )}
                          {selectedMatch.blackPlayerId && (
                            <option value={selectedMatch.blackPlayerId}>
                              Black player (ID: {selectedMatch.blackPlayerId})
                            </option>
                          )}
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Mô tả
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                placeholder="Mô tả chi tiết sự việc..."
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
                >
                  Đường dẫn minh chứng {kind === "VIOLATION" ? "(không bắt buộc)" : "(nếu có)"}
                </label>
                <input
                  type="text"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                  placeholder="Ví dụ: link ảnh/video trên drive, imgur..."
                />
            </div>

            {submitError && (
              <div style={{ color: "#b91c1c", fontSize: 13 }}>{submitError}</div>
            )}
            {submitSuccess && (
              <div style={{ color: "#15803d", fontSize: 13 }}>{submitSuccess}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "8px 18px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {submitting ? "Đang gửi..." : "Gửi report"}
              </button>
            </div>
          </form>
        </div>

        <div
          style={{
            border: "1px solid rgba(15,23,42,0.12)",
            padding: 20,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Lịch sử report của bạn</h3>
          {loadingList ? (
            <div>Đang tải...</div>
          ) : reports.length === 0 ? (
            <div>Bạn chưa gửi report nào.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8 }}>ID</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Loại</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Accused</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Match</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Mô tả</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Status</th>
                    <th style={{ textAlign: "left", padding: 8 }}>
                      Phản hồi
                    </th>
                    <th style={{ textAlign: "left", padding: 8 }}>Tạo lúc</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.reportId}>
                      <td style={{ padding: 8 }}>{r.reportId}</td>
                      <td style={{ padding: 8 }}>{typeLabel(r.type)}</td>
                      <td style={{ padding: 8 }}>{r.accusedId ?? "—"}</td>
                      <td style={{ padding: 8 }}>{r.matchId ?? "—"}</td>
                      <td style={{ padding: 8 }}>
                        {r.description?.length > 60
                          ? `${r.description.slice(0, 60)}…`
                          : r.description}
                      </td>
                      <td style={{ padding: 8 }}>{r.status}</td>
                      <td style={{ padding: 8 }}>{r.note || "—"}</td>
                      <td style={{ padding: 8 }}>{formatTime(r.createAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

