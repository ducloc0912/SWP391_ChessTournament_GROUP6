import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock3,
  Globe,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import MainHeader from "./MainHeader";
import "../../assets/css/TournamentDetailPublic.css";

import { API_BASE } from "../../config/api";
import TournamentFeedbackSection from "./TournamentFeedbackSection";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=1200&q=80";

function normalizeStatus(status) {
  const s = String(status || "")
    .trim()
    .toLowerCase();
  if (s === "ongoing") return "ongoing";
  if (["completed", "finished", "cancelled", "rejected"].includes(s))
    return "finished";
  return "registering";
}

function getStatusLabel(status) {
  const key = normalizeStatus(status);
  if (key === "ongoing") return "Đang diễn ra";
  if (key === "finished") return "Kết thúc";
  return "Đang đăng ký";
}

function getFormatLabel(format) {
  const map = {
    RoundRobin: "Vòng tròn",
    KnockOut: "Loại trực tiếp",
    Hybrid: "Kết hợp",
  };
  return map[format] || format || "—";
}

function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function formatDateTime(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
}

function formatMoney(amount) {
  const num = Number(amount);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("vi-VN");
}

function parseResult(str) {
  if (!str || typeof str !== "string") return { white: "—", black: "—" };
  const s = str.trim();
  if (s === "½-½" || s === "0.5-0.5") return { white: "½", black: "½" };
  const m = s.match(/^(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)$/);
  if (m) return { white: m[1], black: m[2] };
  return { white: "—", black: "—" };
}

function resolveImageUrl(rawImage) {
  const src = String(rawImage || "").trim();
  if (!src) return FALLBACK_IMAGE;
  if (/^(https?:)?\/\//i.test(src))
    return src.startsWith("//") ? `${window.location.protocol}${src}` : src;
  if (/^(data:|blob:)/i.test(src)) return src;
  const apiOrigin = (() => {
    try {
      return new URL(API_BASE).origin;
    } catch {
      return window.location.origin;
    }
  })();
  if (src.startsWith("/")) return `${apiOrigin}${src}`;
  return `${apiOrigin}/${src.replace(/^\.?\//, "")}`;
}

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [podium, setPodium] = useState({
    championName: null,
    runnerUpName: null,
  });
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const fetchDetail = React.useCallback(async () => {
    if (!id || id === "all" || isNaN(Number(id))) return;
    setLoading(true);
    setError("");
    try {
      const detailRes = await axios.get(
        `${API_BASE}/api/public/tournaments?action=detail&id=${id}`,
      );
      const detailData = detailRes?.data || null;
      setTournament(detailData);
      const detailStatus = normalizeStatus(detailData?.status);
      if (detailStatus === "finished") {
        const podiumRes = await axios
          .get(`${API_BASE}/api/public/tournaments?action=podium&id=${id}`)
          .catch(() => null);
        setPodium({
          championName: podiumRes?.data?.championName || null,
          runnerUpName: podiumRes?.data?.runnerUpName || null,
        });
      } else {
        setPodium({ championName: null, runnerUpName: null });
      }

      const matchesRes = await axios
        .get(`${API_BASE}/api/public/tournaments?action=matches&id=${id}`)
        .catch(() => null);
      setUpcomingMatches(
        Array.isArray(matchesRes?.data?.upcomingMatches)
          ? matchesRes.data.upcomingMatches
          : [],
      );
      setCompletedMatches(
        Array.isArray(matchesRes?.data?.completedMatches)
          ? matchesRes.data.completedMatches
          : [],
      );

      const participantsRes = await axios
        .get(`${API_BASE}/api/public/tournaments?action=participants&id=${id}`)
        .catch(() => null);
      const participantList = Array.isArray(participantsRes?.data)
        ? participantsRes.data
        : [];
      setParticipants(participantList);

      // Xác định user đã tham gia giải hay chưa dựa trên danh sách participant của giải hiện tại
      if (detailData?.tournamentId && user?.userId) {
        const joined = participantList.some(
          (p) => Number(p.userId ?? p.user_id) === Number(user.userId),
        );
        setIsJoined(joined);
      } else {
        setIsJoined(false);
      }
    } catch (err) {
      console.error("Load tournament detail failed:", err);
      setError("Không thể tải chi tiết giải đấu.");
    } finally {
      setLoading(false);
    }
  }, [id, user?.userId]);

  useEffect(() => {
    if (!id || id === "all" || isNaN(Number(id))) {
      navigate("/tournaments/public", { replace: true });
      return;
    }
    fetchDetail();
  }, [id, navigate, fetchDetail, user?.userId]);

  useEffect(() => {
    if (!id || id === "all" || isNaN(Number(id))) return;
    const onFocus = () => fetchDetail();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [id, fetchDetail]);

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role") || ""
      : "";

  const statusKey = useMemo(
    () => normalizeStatus(tournament?.status),
    [tournament?.status],
  );
  const showMatches = statusKey === "ongoing" || statusKey === "finished";
  const canRegisterByStatus = statusKey === "registering";

  const statusPillLabel = useMemo(() => {
    const m = {
      registering: "REGISTERING",
      ongoing: "IN PROGRESS",
      finished: "FINISHED",
    };
    return m[statusKey] ?? "";
  }, [statusKey]);

  const [activeTab, setActiveTab] = useState("overview");

  const participantFullName = (p) => {
    const first = p.firstName ?? p.first_name;
    const last = p.lastName ?? p.last_name;
    const full = [first, last].filter(Boolean).join(" ").trim();
    return full || (p.titleAtRegistration ?? p.title_at_registration ?? "—");
  };

  const PARTICIPANTS_PREVIEW_LIMIT = 10;
  const participantsPreview = useMemo(
    () => participants.slice(0, PARTICIPANTS_PREVIEW_LIMIT),
    [participants],
  );
  const hasMoreParticipants = participants.length > PARTICIPANTS_PREVIEW_LIMIT;

  const dateRangeStr = useMemo(() => {
    const s = formatDate(tournament?.startDate);
    const e = formatDate(tournament?.endDate);
    if (!s || s === "—") return "—";
    if (!e || e === "—" || s === e) return s;
    return `${s} - ${e}`;
  }, [tournament?.startDate, tournament?.endDate]);

  const roundsMap = useMemo(() => {
    const all = [...upcomingMatches, ...completedMatches];
    const byRound = {};
    all.forEach((m) => {
      const r = m.roundIndex ?? m.roundName ?? "0";
      if (!byRound[r]) byRound[r] = [];
      byRound[r].push(m);
    });
    return Object.entries(byRound)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([round, matches]) => ({ round, matches }));
  }, [upcomingMatches, completedMatches]);

  const handleRegisterTournament = () => {
    if (!tournament?.tournamentId) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!canRegisterByStatus) {
      alert("Chỉ có thể đăng ký vào giải đang mở đăng ký (Upcoming).");
      return;
    }
    navigate("/payment", {
      state: {
        tournamentId: tournament.tournamentId,
        entryFee: tournament.entryFee != null ? Number(tournament.entryFee) : 0,
        fromPublicDetail: true,
      },
    });
  };

  return (
    <div className="tdp-page">
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
      />

      <div className="tdp-container">
        <button
          type="button"
          className="tdp-back-btn"
          onClick={() => navigate("/tournaments/public")}
        >
          <ArrowLeft size={16} /> Quay lại danh sách giải
        </button>

        {loading ? (
          <div className="tdp-state-card">Đang tải chi tiết giải đấu...</div>
        ) : error ? (
          <div className="tdp-state-card">{error}</div>
        ) : !tournament ? (
          <div className="tdp-state-card">Không tìm thấy giải đấu.</div>
        ) : (
          <>
            <section className="tdp-hero tdp-hero-banner">
              <img
                className="tdp-hero-bg"
                src={resolveImageUrl(tournament.tournamentImage)}
                alt={tournament.tournamentName || "Tournament"}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="tdp-hero-overlay" />
              <div className="tdp-hero-content">
                <h1>{tournament.tournamentName || "Tournament"}</h1>
                <div className="tdp-hero-meta">
                  {statusPillLabel && (
                    <span className={`tdp-status-pill tdp-status-${statusKey}`}>
                      {statusPillLabel}
                    </span>
                  )}
                  <span className="tdp-meta-item">
                    <Calendar size={14} />
                    {dateRangeStr}
                  </span>
                  <span className="tdp-meta-item">
                    <Globe size={14} />
                    {tournament.location || "Online"}
                  </span>
                </div>
                <div className="tdp-register-cta">
                  {canRegisterByStatus && !isJoined && (
                    <button
                      type="button"
                      className="tdp-register-btn"
                      onClick={handleRegisterTournament}
                    >
                      Đăng ký giải
                    </button>
                  )}
                  {canRegisterByStatus && isJoined && (
                    <span className="tdp-register-text-joined">
                      Bạn đã đăng ký giải này
                    </span>
                  )}
                </div>
              </div>
              <div className="tdp-hero-fee">
                {Number(tournament?.entryFee ?? 0) > 0 ? (
                  <>
                    <span className="tdp-hero-fee-label">Phí tham gia</span>
                    <span className="tdp-hero-fee-value">
                      {formatMoney(tournament.entryFee)} VND
                    </span>
                  </>
                ) : (
                  <span className="tdp-hero-fee-free">Miễn phí tham gia</span>
                )}
              </div>
            </section>

            <nav className="tdp-tabs">
              <button
                type="button"
                className={`tdp-tab ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                SEASON, EVENT & TEAMS Overview
              </button>
              <button
                type="button"
                className={`tdp-tab ${activeTab === "participant" ? "active" : ""}`}
                onClick={() => setActiveTab("participant")}
              >
                PARTICIPANT
              </button>
              <button
                type="button"
                className={`tdp-tab ${activeTab === "bracket" ? "active" : ""}`}
                onClick={() => setActiveTab("bracket")}
              >
                BRACKET
              </button>
            </nav>

            {activeTab === "participant" && (
              <section className="tdp-participants-section">
                <div className="tdp-players-tab">
                  <div className="tdp-players-table-wrapper">
                    <table className="tdp-players-table">
                      <thead>
                        <tr>
                          <th>HỌ VÀ TÊN</th>
                          <th>TÊN IN-GAME</th>
                          <th>EMAIL</th>
                          <th>RANK</th>
                          <th>THỜI ĐIỂM ĐĂNG KÝ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.length === 0 ? (
                          <tr>
                            <td colSpan={5}>Chưa có người tham gia.</td>
                          </tr>
                        ) : (
                          participants.map((row) => {
                            const regDate =
                              row.registrationDate ?? row.registration_date;
                            return (
                              <tr
                                key={
                                  row.participantId ??
                                  row.participant_id ??
                                  row.userId ??
                                  row.user_id
                                }
                              >
                                <td>{participantFullName(row)}</td>
                                <td>
                                  {row.titleAtRegistration ??
                                    row.title_at_registration ??
                                    "—"}
                                </td>
                                <td>{row.email ?? "—"}</td>
                                <td>{row.rank ?? "—"}</td>
                                <td>
                                  {regDate
                                    ? new Date(regDate).toLocaleString("vi-VN")
                                    : "—"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "overview" && (
              <section className="tdp-overview">
                <div className="tdp-overview-grid">
                  <div className="tdp-overview-left">
                    <article className="tdp-card tdp-overview-card">
                      <h2>
                        {tournament.tournamentName || "Tournament"} overview
                      </h2>
                      <p className="tdp-desc">
                        {tournament.description ||
                          "Chưa có mô tả cho giải đấu này."}
                      </p>
                      <div className="tdp-placement-rewards">
                        <h4>Giải thưởng theo thứ hạng</h4>
                        <ul>
                          <li>
                            <span className="tdp-medal tdp-medal-gold" />
                            <div>
                              <strong>1st Place</strong>
                              <span>
                                {statusKey === "finished" && podium.championName
                                  ? podium.championName
                                  : "—"}{" "}
                                ·{" "}
                                {formatMoney(
                                  tournament.prizePool
                                    ? Math.round(tournament.prizePool * 0.5)
                                    : 0,
                                )}{" "}
                                VND
                              </span>
                            </div>
                          </li>
                          <li>
                            <span className="tdp-medal tdp-medal-silver" />
                            <div>
                              <strong>2nd Place</strong>
                              <span>
                                {statusKey === "finished" && podium.runnerUpName
                                  ? podium.runnerUpName
                                  : "—"}{" "}
                                ·{" "}
                                {formatMoney(
                                  tournament.prizePool
                                    ? Math.round(tournament.prizePool * 0.3)
                                    : 0,
                                )}{" "}
                                VND
                              </span>
                            </div>
                          </li>
                          <li>
                            <span className="tdp-medal tdp-medal-bronze" />
                            <div>
                              <strong>3rd Place</strong>
                              <span>
                                {formatMoney(
                                  tournament.prizePool
                                    ? Math.round(tournament.prizePool * 0.2)
                                    : 0,
                                )}{" "}
                                VND
                              </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </article>

                    <article className="tdp-card tdp-event-phases">
                      <h3>Event Phases</h3>
                      <p>
                        {tournament.rules || "Chưa có thông tin luật thi đấu."}
                      </p>
                      <div className="tdp-phase-block">
                        <h4>Giai đoạn thi đấu</h4>
                        <p>
                          {tournament.format === "RoundRobin"
                            ? "Thi đấu vòng tròn tính điểm. Mỗi người chơi đấu với tất cả người chơi khác."
                            : tournament.format === "KnockOut"
                              ? "Thi đấu loại trực tiếp. Thua một trận sẽ bị loại khỏi giải."
                              : "Thi đấu kết hợp: vòng tròn để chọn top, sau đó loại trực tiếp cho vòng chung kết."}
                        </p>
                      </div>
                      {tournament.notes && (
                        <div className="tdp-phase-block">
                          <h4>Ghi chú</h4>
                          <p>{tournament.notes}</p>
                        </div>
                      )}
                    </article>

                    <article className="tdp-card tdp-feedback-wrapper">
                      <div className="tdp-feedback-header-inline">
                        <h3>Feedback &amp; Reviews</h3>
                      </div>
                      <TournamentFeedbackSection
                        tournamentId={tournament.tournamentId}
                        user={user}
                        role={role}
                        isParticipant={isJoined}
                      />
                    </article>
                  </div>

                  <div className="tdp-overview-right">
                    <article className="tdp-card tdp-participants-card">
                      <h3>Người tham gia</h3>
                      <p className="tdp-participants-intro">
                        {Number(
                          tournament.currentPlayers ??
                            tournament.current_players ??
                            0,
                        )}
                        /
                        {Number(
                          tournament.maxPlayer ?? tournament.max_player ?? 0,
                        )}{" "}
                        người đã đăng ký
                      </p>
                      <ul className="tdp-participants-list">
                        {participantsPreview.length === 0 ? (
                          <li
                            key="empty"
                            className="tdp-participant-item tdp-participant-empty"
                          >
                            Chưa có người tham gia.
                          </li>
                        ) : (
                          participantsPreview.map((p, index) => (
                            <li
                              key={
                                p.participantId ??
                                p.participant_id ??
                                p.userId ??
                                p.user_id ??
                                `p-${index}`
                              }
                              className="tdp-participant-item"
                            >
                              <span className="tdp-player-avatar" />
                              <span>{participantFullName(p)}</span>
                            </li>
                          ))
                        )}
                        {hasMoreParticipants && (
                          <li
                            key="show-all"
                            className="tdp-participant-item tdp-participants-show-all-wrap"
                          >
                            <button
                              type="button"
                              className="tdp-participants-show-all"
                              onClick={() => setActiveTab("participant")}
                            >
                              Xem tất cả ({participants.length} người)
                            </button>
                          </li>
                        )}
                      </ul>
                      <div className="tdp-participants-info">
                        <p>
                          <MapPin size={14} /> {tournament.location || "Online"}
                        </p>
                        <p>
                          <Calendar size={14} /> {dateRangeStr}
                        </p>
                        {canRegisterByStatus && (
                          <p>
                            <Clock3 size={14} /> Hạn đăng ký:{" "}
                            {formatDateTime(tournament.registrationDeadline)}
                          </p>
                        )}
                        <p>
                          <Trophy size={14} /> Quỹ thưởng:{" "}
                          {formatMoney(tournament.prizePool)} VND
                        </p>
                      </div>
                    </article>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "bracket" && (
              <section className="tdp-bracket">
                <div className="tdp-bracket-main">
                  <div className="tdp-rounds">
                    {roundsMap.length === 0 ? (
                      <div className="tdp-empty-bracket">
                        {showMatches
                          ? "Chưa có trận đấu nào."
                          : "Bracket sẽ hiển thị khi giải bắt đầu."}
                      </div>
                    ) : (
                      roundsMap.map(({ round, matches }) => (
                        <div key={round} className="tdp-round-col">
                          <div className="tdp-round-header">ROUND {round}</div>
                          <div className="tdp-round-matches">
                            {matches.map((m) => {
                              const scores = m.result
                                ? parseResult(m.result)
                                : { white: "—", black: "—" };
                              return (
                                <div
                                  key={m.matchId}
                                  className="tdp-match-card-item"
                                >
                                  <div className="tdp-match-row">
                                    <span className="tdp-player-avatar" />
                                    <span className="tdp-player-name">
                                      {m.whitePlayerName || "TBD"}
                                    </span>
                                    <span className="tdp-score">
                                      {scores.white}
                                    </span>
                                  </div>
                                  <div className="tdp-match-divider" />
                                  <div className="tdp-match-row">
                                    <span className="tdp-player-avatar" />
                                    <span className="tdp-player-name">
                                      {m.blackPlayerName || "TBD"}
                                    </span>
                                    <span className="tdp-score">
                                      {scores.black}
                                    </span>
                                  </div>
                                  <p className="tdp-match-meta">
                                    Bàn {m.boardNumber ?? "—"} ·{" "}
                                    {formatDateTime(m.startTime)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <aside className="tdp-bracket-side">
                    <div className="tdp-side-panel tdp-advances">
                      <h4>ADVANCES</h4>
                      <div className="tdp-side-list">
                        {statusKey === "finished" && podium.championName ? (
                          <div className="tdp-side-item">
                            <span className="tdp-player-avatar" />
                            <span>{podium.championName}</span>
                          </div>
                        ) : (
                          <div className="tdp-side-item tbd">
                            <span className="tdp-player-avatar" />
                            <span>TBD</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="tdp-side-panel tdp-eliminated">
                      <h4>ELIMINATED</h4>
                      <div className="tdp-side-list">
                        <div className="tdp-side-item tbd">
                          <span className="tdp-player-avatar" />
                          <span>TBD</span>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </section>
            )}


          </>
        )}
      </div>
    </div>
  );
}
