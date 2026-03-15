import React, { useEffect, useMemo, useState } from "react";
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

  const [kind, setKind] = useState("VIOLATION");
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

  const normalizedRole = (role || "")
    .toString()
    .toUpperCase()
    .replace(/[\s_]/g, "");
  const isPlayer = !normalizedRole || normalizedRole === "PLAYER";

  useEffect(() => {
    if (!isPlayer && kind !== "SYSTEM") {
      setKind("SYSTEM");
    }
  }, [isPlayer, kind]);

  const getErrorMessage = (err, fallback) => {
    const backend = err?.response?.data?.message;
    if (backend) return backend;
    const status = err?.response?.status;
    if (status) return `${fallback} (HTTP ${status})`;
    return err?.message ? `${fallback}: ${err.message}` : fallback;
  };

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
    if (user) loadReports();
  }, [user]);

  useEffect(() => {
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

  const violationTournaments = useMemo(() => {
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

  const matchesInSelectedTournament = useMemo(() => {
    if (!selectedTournamentId) return [];
    const tid = Number(selectedTournamentId);
    return matches.filter((m) => Number(m.tournamentId) === tid);
  }, [matches, selectedTournamentId]);

  const selectedMatch = useMemo(
    () => matchesInSelectedTournament.find((m) => Number(m.matchId) === Number(selectedMatchId)),
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
      setSubmitError("Vui long nhap mo ta.");
      return;
    }

    if (kind === "VIOLATION") {
      if (!selectedTournamentId) {
        setSubmitError("Vui long chon giai dau.");
        return;
      }
      if (!selectedMatchId) {
        setSubmitError("Vui long chon tran dau.");
        return;
      }
      if (!selectedAccusedId) {
        setSubmitError("Vui long chon nguoi choi bi to cao.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        description: description.trim(),
        evidenceUrl: evidenceUrl.trim() || "",
      };

      if (kind === "VIOLATION") {
        payload.type = violationType;
        payload.matchId = Number(selectedMatchId);
        payload.accusedId = Number(selectedAccusedId);
      } else {
        payload.type = "TechnicalIssue";
      }

      const res = await axios.post(`${API_BASE}/api/reports`, payload, {
        withCredentials: true,
      });

      if (res?.data?.success) {
        setSubmitSuccess("Gui report thanh cong.");
        setDescription("");
        setEvidenceUrl("");
        setSelectedTournamentId("");
        setSelectedMatchId("");
        setSelectedAccusedId("");
        await loadReports();
      } else {
        setSubmitError(res?.data?.message || "Gui report that bai.");
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Gui report that bai"));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (v) => {
    if (!v) return "-";
    try {
      return new Date(v).toLocaleString("vi-VN");
    } catch {
      return String(v);
    }
  };

  const typeLabel = (t) => {
    switch (t) {
      case "Cheating":
        return "Gian lan";
      case "Misconduct":
        return "Hanh vi xau";
      case "TechnicalIssue":
        return "Loi he thong";
      default:
        return t || "Khac";
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
        <div style={{ border: "1px solid rgba(15,23,42,0.12)", padding: 20, background: "#fff", marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>Gui Report</h2>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Loai report</label>
              {isPlayer ? (
                <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ padding: 8, width: "100%" }}>
                  <option value="VIOLATION">Violation</option>
                  <option value="SYSTEM">System</option>
                </select>
              ) : (
                <div style={{ padding: 8, width: "100%", background: "#f9fafb", borderRadius: 4, fontSize: 13, color: "#374151" }}>
                  System
                </div>
              )}
            </div>

            {kind === "VIOLATION" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Loai vi pham</label>
                  <select value={violationType} onChange={(e) => setViolationType(e.target.value)} style={{ padding: 8, width: "100%" }}>
                    <option value="Cheating">Cheating</option>
                    <option value="Misconduct">Misconduct</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Giai dau</label>
                  <select
                    value={selectedTournamentId}
                    onChange={(e) => {
                      setSelectedTournamentId(e.target.value);
                      setSelectedMatchId("");
                      setSelectedAccusedId("");
                    }}
                    style={{ padding: 8, width: "100%" }}
                  >
                    <option value="">-- Chon giai dau --</option>
                    {violationTournaments.map((t) => (
                      <option key={t.tournamentId} value={t.tournamentId}>{t.tournamentName}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tran dau</label>
                    <select
                      value={selectedMatchId}
                      onChange={(e) => {
                        setSelectedMatchId(e.target.value);
                        setSelectedAccusedId("");
                      }}
                      style={{ padding: 8, width: "100%" }}
                      disabled={!selectedTournamentId}
                    >
                      <option value="">-- Chon tran dau --</option>
                      {matchesInSelectedTournament.map((m) => (
                        <option key={m.matchId} value={m.matchId}>
                          Match #{m.matchId} (Board {m.boardNumber ?? "?"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Nguoi choi bi to cao</label>
                    <select
                      value={selectedAccusedId}
                      onChange={(e) => setSelectedAccusedId(e.target.value)}
                      style={{ padding: 8, width: "100%" }}
                      disabled={!selectedMatch}
                    >
                      <option value="">-- Chon nguoi choi --</option>
                      {selectedMatch?.player1Id && (
                        <option value={selectedMatch.player1Id}>
                          {selectedMatch.player1Name || "Player 1"} (ID: {selectedMatch.player1Id})
                        </option>
                      )}
                      {selectedMatch?.player2Id && (
                        <option value={selectedMatch.player2Id}>
                          {selectedMatch.player2Name || "Player 2"} (ID: {selectedMatch.player2Id})
                        </option>
                      )}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Mo ta</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Duong dan minh chung (neu co)</label>
              <input
                type="text"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              />
            </div>

            {submitError && <div style={{ color: "#b91c1c", fontSize: 13 }}>{submitError}</div>}
            {submitSuccess && <div style={{ color: "#15803d", fontSize: 13 }}>{submitSuccess}</div>}

            <div>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                {submitting ? "Dang gui..." : "Gui report"}
              </button>
            </div>
          </form>
        </div>

        <div style={{ border: "1px solid rgba(15,23,42,0.12)", padding: 20, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Lich su report cua ban</h3>
          {loadingList ? (
            <div>Dang tai...</div>
          ) : reports.length === 0 ? (
            <div>Ban chua gui report nao.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8 }}>ID</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Loai</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Accused</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Match</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Mo ta</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Status</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Phan hoi</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Tao luc</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.reportId}>
                      <td style={{ padding: 8 }}>{r.reportId}</td>
                      <td style={{ padding: 8 }}>{typeLabel(r.type)}</td>
                      <td style={{ padding: 8 }}>{r.accusedId ?? "-"}</td>
                      <td style={{ padding: 8 }}>{r.matchId ?? "-"}</td>
                      <td style={{ padding: 8 }}>{r.description?.length > 60 ? `${r.description.slice(0, 60)}...` : r.description}</td>
                      <td style={{ padding: 8 }}>{r.status}</td>
                      <td style={{ padding: 8 }}>{r.note || "-"}</td>
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
