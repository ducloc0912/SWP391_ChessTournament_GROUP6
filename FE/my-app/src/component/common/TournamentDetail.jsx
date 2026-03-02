import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock3, MapPin, Trophy, Users } from "lucide-react";
import MainHeader from "./MainHeader";
import "../../assets/css/TournamentDetailPublic.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/ctms";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=1200&q=80";

function normalizeStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "ongoing") return "ongoing";
  if (["completed", "finished", "cancelled", "rejected"].includes(s)) return "finished";
  return "registering";
}

function getStatusLabel(status) {
  const key = normalizeStatus(status);
  if (key === "ongoing") return "Đang diễn ra";
  if (key === "finished") return "Kết thúc";
  return "Đang đăng ký";
}

function getFormatLabel(format) {
  const map = { RoundRobin: "Vòng tròn", KnockOut: "Loại trực tiếp", Hybrid: "Kết hợp" };
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

function resolveImageUrl(rawImage) {
  const src = String(rawImage || "").trim();
  if (!src) return FALLBACK_IMAGE;
  if (/^(https?:)?\/\//i.test(src)) return src.startsWith("//") ? `${window.location.protocol}${src}` : src;
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
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [podium, setPodium] = useState({ championName: null, runnerUpName: null });
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

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const detailRes = await axios.get(`${API_BASE}/api/public/tournaments?action=detail&id=${id}`);
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
        setUpcomingMatches(Array.isArray(matchesRes?.data?.upcomingMatches) ? matchesRes.data.upcomingMatches : []);
        setCompletedMatches(
          Array.isArray(matchesRes?.data?.completedMatches) ? matchesRes.data.completedMatches : [],
        );
      } catch (err) {
        console.error("Load tournament detail failed:", err);
        setError("Không thể tải chi tiết giải đấu.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const statusKey = useMemo(() => normalizeStatus(tournament?.status), [tournament?.status]);
  const showMatches = statusKey === "ongoing" || statusKey === "finished";
  const handleRegisterTournament = () => {
    if (!tournament?.tournamentId) return;
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/tournaments/${tournament.tournamentId}/waiting-list`, {
      state: { autoRegister: true },
    });
  };

  return (
    <div className="tdp-page">
      <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} />

      <div className="tdp-container">
        <button type="button" className="tdp-back-btn" onClick={() => navigate("/tournaments/public")}>
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
            <section className="tdp-hero">
              <img
                src={resolveImageUrl(tournament.tournamentImage)}
                alt={tournament.tournamentName || "Tournament"}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="tdp-hero-overlay" />
              <div className="tdp-hero-content">
                <div className="tdp-top-tags">
                  <span className="tdp-tag">{getFormatLabel(tournament.format)}</span>
                  <span className={`tdp-status-badge tdp-status-${statusKey}`}>
                    {getStatusLabel(tournament.status)}
                  </span>
                </div>
                <h1>{tournament.tournamentName || "Tournament"}</h1>
                <p>{tournament.description || "Chưa có mô tả cho giải đấu này."}</p>
                {statusKey === "registering" && (
                  <button type="button" className="tdp-register-btn" onClick={handleRegisterTournament}>
                    Đăng ký giải
                  </button>
                )}
              </div>
            </section>

            <section className="tdp-info-grid">
              <article className="tdp-info-card">
                <h3>Thông tin chung</h3>
                <p>
                  <MapPin size={15} /> {tournament.location || "Online"}
                </p>
                <p>
                  <Calendar size={15} /> {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                </p>
                {statusKey === "registering" && (
                  <p>
                    <Clock3 size={15} /> Hạn đăng ký: {formatDateTime(tournament.registrationDeadline)}
                  </p>
                )}
                <p>
                  <Trophy size={15} /> Quỹ thưởng: {formatMoney(tournament.prizePool)} VND
                </p>
                <p>
                  <Users size={15} /> Người chơi: {Number(tournament.currentPlayers || 0)}/
                  {Number(tournament.maxPlayer || 0)}
                </p>
              </article>

              <article className="tdp-info-card">
                <h3>Quy định & ghi chú</h3>
                <p className="tdp-text-title">Luật thi đấu</p>
                <p className="tdp-text-block">{tournament.rules || "Chưa có thông tin luật thi đấu."}</p>
                <p className="tdp-text-title">Ghi chú</p>
                <p className="tdp-text-block">{tournament.notes || "Không có ghi chú thêm."}</p>
                {statusKey === "finished" && (
                  <div className="tdp-podium-box">
                    <p className="tdp-podium-title">Top người chơi</p>
                    <div className="tdp-podium-grid">
                      <div className="tdp-podium-player tdp-podium-champion">
                        <span className="tdp-podium-rank">🏆 Quán quân</span>
                        <strong>{podium.championName || "Chưa cập nhật"}</strong>
                      </div>
                      <div className="tdp-podium-player tdp-podium-runnerup">
                        <span className="tdp-podium-rank">🥈 Á quân</span>
                        <strong>{podium.runnerUpName || "Chưa cập nhật"}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            </section>

            {showMatches && (
              <section className="tdp-matches">
                <div className="tdp-match-columns">
                  <article className="tdp-match-card">
                    <h3>Trận đấu sắp diễn ra</h3>
                    {upcomingMatches.length === 0 ? (
                      <p className="tdp-empty">Chưa có trận đấu sắp diễn ra.</p>
                    ) : (
                      upcomingMatches.map((m) => (
                        <div key={`up-${m.matchId}`} className="tdp-match-item">
                          <div className="tdp-match-head">
                            <strong>Bàn {m.boardNumber ?? "—"}</strong>
                            <span>{m.roundName || `Round ${m.roundIndex ?? "—"}`}</span>
                          </div>
                          <p>{m.whitePlayerName || "TBD"} vs {m.blackPlayerName || "TBD"}</p>
                          <p className="tdp-time">
                            <Clock3 size={14} /> {formatDateTime(m.startTime)}
                          </p>
                        </div>
                      ))
                    )}
                  </article>

                  <article className="tdp-match-card">
                    <h3>Trận đã kết thúc (có kết quả)</h3>
                    {completedMatches.length === 0 ? (
                      <p className="tdp-empty">Chưa có trận đã kết thúc có kết quả.</p>
                    ) : (
                      completedMatches.map((m) => (
                        <div key={`done-${m.matchId}`} className="tdp-match-item">
                          <div className="tdp-match-head">
                            <strong>Bàn {m.boardNumber ?? "—"}</strong>
                            <span>{m.roundName || `Round ${m.roundIndex ?? "—"}`}</span>
                          </div>
                          <p>{m.whitePlayerName || "TBD"} vs {m.blackPlayerName || "TBD"}</p>
                          <p className="tdp-result">Kết quả: {m.result || "—"}</p>
                        </div>
                      ))
                    )}
                  </article>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
