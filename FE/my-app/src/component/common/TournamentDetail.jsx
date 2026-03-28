import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock3,
  Globe,
  MapPin,
  Search,
  Trophy,
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
  const s = str.trim().toLowerCase();
  if (s === "player1") return { white: "W", black: "L" };
  if (s === "player2") return { white: "L", black: "W" };
  if (s === "draw") return { white: "½", black: "½" };
  if (s === "pending" || s === "none" || s === "*") return { white: "—", black: "—" };
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
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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

      // Fetch standings for Round Robin tournaments that are ongoing
      if (detailData?.format === "RoundRobin" && normalizeStatus(detailData?.status) === "ongoing") {
        const standingsRes = await axios
          .get(`${API_BASE}/api/public/tournaments?action=standing&id=${id}`)
          .catch(() => null);
        setStandings(Array.isArray(standingsRes?.data) ? standingsRes.data : []);
      } else {
        setStandings([]);
      }

      // Xác định user đã tham gia giải hay chưa dựa trên danh sách participant của giải hiện tại
      if (detailData?.tournamentId && user?.userId) {
        const joined = participantList.some(
          (p) => Number(p.userId ?? p.user_id) === Number(user.userId),
        );
        setIsJoined(joined);
      } else {
        setIsJoined(false);
      }
      // Check follow status
      if (user?.userId && id) {
        axios.get(`${API_BASE}/api/user/follow?action=status&tournamentId=${id}`, { withCredentials: true })
          .then(res => setIsFollowing(res.data?.isFollowing))
          .catch(err => console.error("Check follow status failed:", err));
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
  const bracketPublished = Boolean(tournament?.bracketPublished);
  const showMatches = bracketPublished;
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

  const handleFollowToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setFollowLoading(true);
    try {
      const action = isFollowing ? "unfollow" : "follow";
      const res = await axios.post(`${API_BASE}/api/user/follow?action=${action}`, {
        tournamentId: id
      }, { withCredentials: true });

      if (res.data?.success || res.status === 200) {
        setIsFollowing(!isFollowing);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setFollowLoading(false);
    }
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
                <div className="tdp-follow-cta" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                  {user && (
                    <button
                      type="button"
                      className={`tdp-follow-btn-detail ${isFollowing ? 'following' : ''}`}
                      disabled={followLoading}
                      onClick={handleFollowToggle}
                      style={{
                        backgroundColor: isFollowing ? 'transparent' : '#ff4655',
                        border: isFollowing ? '2px solid #ff4655' : 'none',
                        color: 'white',
                        padding: '10px 20px',

                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        fontSize: '0.9rem'
                      }}
                    >
                      <Search size={18} />
                      {isFollowing ? "Đã theo dõi" : "Theo dõi giải"}
                    </button>
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
              {statusKey === "ongoing" && tournament?.format === "RoundRobin" && (
                <button
                  type="button"
                  className={`tdp-tab ${activeTab === "standing" ? "active" : ""}`}
                  onClick={() => setActiveTab("standing")}
                >
                  STANDING
                </button>
              )}
              {bracketPublished && (
                <button
                  type="button"
                  className={`tdp-tab ${activeTab === "bracket" ? "active" : ""}`}
                  onClick={() => setActiveTab("bracket")}
                >
                  BRACKET
                </button>
              )}
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
                        {Array.isArray(tournament.prizeTiers) && tournament.prizeTiers.length > 0 ? (
                          <ul>
                            {tournament.prizeTiers.map((tier, idx) => {
                              const medalClass =
                                idx === 0 ? "tdp-medal-gold"
                                : idx === 1 ? "tdp-medal-silver"
                                : "tdp-medal-bronze";
                              return (
                                <li key={idx}>
                                  <span className={`tdp-medal ${medalClass}`} />
                                  <div>
                                    <strong>{tier.label || `Hạng ${tier.rankPosition ?? idx + 1}`}</strong>
                                    <span>{formatMoney(tier.fixedAmount ?? 0)} VND</span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <ul>
                            <li>
                              <span className="tdp-medal tdp-medal-gold" />
                              <div>
                                <strong>Champion</strong>
                                <span>{formatMoney(0)} VND</span>
                              </div>
                            </li>
                            <li>
                              <span className="tdp-medal tdp-medal-silver" />
                              <div>
                                <strong>Runner-up</strong>
                                <span>{formatMoney(0)} VND</span>
                              </div>
                            </li>
                            <li>
                              <span className="tdp-medal tdp-medal-bronze" />
                              <div>
                                <strong>3rd</strong>
                                <span>{formatMoney(0)} VND</span>
                              </div>
                            </li>
                          </ul>
                        )}
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
                      <div className="tdp-participants-info">
                        <p>
                          <MapPin size={14} /> {tournament.location || "Online"}
                        </p>
                        <p>
                          <Calendar size={14} /> {dateRangeStr}
                        </p>
                        <p>
                          <Clock3 size={14} /> Hạn đăng ký:{" "}
                          {formatDateTime(tournament.registrationDeadline)}
                        </p>
                        <p>
                          <Trophy size={14} /> Quỹ thưởng:{" "}
                          {formatMoney(tournament.prizePool)} VND
                        </p>
                      </div>
                      <div className="tdp-reg-progress-wrap">
                        <div className="td-reg-progress-bar">
                          <div
                            className="td-reg-progress-fill"
                            style={{
                              width: `${
                                (tournament.maxPlayer ?? tournament.max_player ?? 0) > 0
                                  ? Math.round(
                                      ((tournament.currentPlayers ?? tournament.current_players ?? 0) /
                                        (tournament.maxPlayer ?? tournament.max_player)) *
                                        100,
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <p className="td-reg-progress-footer">
                          <strong>
                            {Number(tournament.currentPlayers ?? tournament.current_players ?? 0)}
                          </strong>{" "}
                          / {Number(tournament.maxPlayer ?? tournament.max_player ?? 0)} người chơi
                        </p>
                      </div>
                      <div className="tdp-timeline-wrap">
                        <h4>Timeline</h4>
                        {[
                          { label: "Mở đăng ký", date: formatDate(tournament.createAt ?? tournament.create_at) },
                          { label: "Đóng đăng ký", date: formatDate(tournament.registrationDeadline) },
                          { label: "Bắt đầu giải", date: formatDate(tournament.startDate) },
                          { label: "Kết thúc giải", date: formatDate(tournament.endDate) },
                        ].map((item, idx) => (
                          <div key={idx} className="td-timeline-item">
                            <span>{item.label}</span>
                            <span>{item.date}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "standing" && (
              <section className="tdp-standing-section">
                <div className="tdp-players-tab">
                  <div className="tdp-players-table-wrapper">
                    <table className="tdp-players-table tdp-standing-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>NGƯỜI CHƠI</th>
                          <th>SỐ TRẬN</th>
                          <th>THẮNG</th>
                          <th>HÒA</th>
                          <th>THUA</th>
                          <th>ĐIỂM</th>
                          <th>TIEBREAK (SB)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: "center", color: "#6b7280" }}>
                              Chưa có kết quả xếp hạng. Bảng xếp hạng sẽ cập nhật sau mỗi trận đấu hoàn thành.
                            </td>
                          </tr>
                        ) : (
                          standings.map((row, idx) => {
                            const rank = row.currentRank ?? idx + 1;
                            const medalClass =
                              rank === 1 ? "tdp-standing-rank--gold"
                              : rank === 2 ? "tdp-standing-rank--silver"
                              : rank === 3 ? "tdp-standing-rank--bronze"
                              : "";
                            return (
                              <tr key={row.userId} className={rank <= 3 ? "tdp-standing-top" : ""}>
                                <td>
                                  <span className={`tdp-standing-rank ${medalClass}`}>{rank}</span>
                                </td>
                                <td className="tdp-standing-name">{row.playerName || "—"}</td>
                                <td>{row.matchesPlayed ?? 0}</td>
                                <td className="tdp-standing-won">{row.won ?? 0}</td>
                                <td>{row.drawn ?? 0}</td>
                                <td className="tdp-standing-lost">{row.lost ?? 0}</td>
                                <td className="tdp-standing-pts">{Number(row.point ?? 0).toFixed(1)}</td>
                                <td>{Number(row.tieBreak ?? 0).toFixed(2)}</td>
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

            {activeTab === "bracket" && (
              <section className="tdp-bracket">
                <div className="tdp-bracket-main">
                  <div className="tdp-rounds">
                    {roundsMap.length === 0 ? (
                      <div className="tdp-empty-bracket">
                        {showMatches
                          ? "Chưa có trận đấu nào."
                          : bracketPublished
                            ? "Bracket chưa có trận đấu khả dụng."
                            : "Bracket sẽ hiển thị sau khi Tournament Leader publish."}
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
                                      {m.player1Name || "TBD"}
                                    </span>
                                    <span className="tdp-score">
                                      {scores.white}
                                    </span>
                                  </div>
                                  <div className="tdp-match-divider" />
                                  <div className="tdp-match-row">
                                    <span className="tdp-player-avatar" />
                                    <span className="tdp-player-name">
                                      {m.player2Name || "TBD"}
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

                </div>
              </section>
            )}


          </>
        )}
      </div>
    </div>
  );
}
