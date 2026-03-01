import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Trophy, Facebook, Twitter, Instagram, Youtube,
  Mail, Clock, Leaf, TrendingUp, Radio, Star,
  Sparkles, Zap, Crown, Calendar, MapPin, Users,
  ChevronDown, ChevronUp, ArrowRight, Award
} from "lucide-react";
import { getSlogan } from "../../component/common/Slogon";
import MainHeader from "../../component/common/MainHeader";
import "../../assets/css/HomePage.css";

/* ── local images ── */
import imgHero from "../../assets/image/952792579ca4f9e0836ceca4cc253c01.jpg";
import imgTournamentsBg from "../../assets/image/08118f77077fd9e6795319a2c6428cbc.jpg";
import imgPlayersBg from "../../assets/image/487c55215d12b2b7275d13526ab0c844.jpg";
import imgBanner from "../../assets/image/96ef486bfb872c9ed5624c7763e55ea4.jpg";
import imgCard1 from "../../assets/image/09ab0a288e7cf90b3e94f8e5f4c8921d.jpg";
import imgCard2 from "../../assets/image/952792579ca4f9e0836ceca4cc253c01.jpg";
import imgCard3 from "../../assets/image/96ef486bfb872c9ed5624c7763e55ea4.jpg";
import imgCard4 from "../../assets/image/08118f77077fd9e6795319a2c6428cbc.jpg";
import imgCard5 from "../../assets/image/487c55215d12b2b7275d13526ab0c844.jpg";

/* ── helpers ── */
function ImageWithFallback({ src, alt = "", className = "", style, fallback = "https://ui-avatars.com/api/?name=Chess&background=fef3c7&color=d97706" }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc || fallback}
      alt={alt}
      className={className}
      style={style}
      onError={() => setImgSrc(fallback)}
    />
  );
}

function formatDateTime(val) {
  if (val == null) return "—";
  const d = typeof val === "string"
    ? new Date(val)
    : Array.isArray(val)
      ? new Date(val[0], (val[1] ?? 1) - 1, val[2] ?? 1, val[3] ?? 0, val[4] ?? 0, val[5] ?? 0)
      : new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

/* tournament card images (cycle through for visual variety) */
const TOURNAMENT_IMAGES = [imgCard1, imgCard2, imgCard3, imgCard4, imgCard5];

const HERO_IMAGE = imgHero;
const BANNER_IMAGE = imgBanner;
const TOURNAMENTS_BG = imgTournamentsBg;
const PLAYERS_BG = imgPlayersBg;

/* ── Simple Modal (light theme) ── */
function SimpleModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="hp-simple-modal-overlay" onClick={onClose}>
      <div className="hp-simple-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="hp-simple-modal-close" onClick={onClose}>✕</button>
        <h2 className="hp-simple-modal-title">{title}</h2>
        <div className="hp-simple-modal-body">{children}</div>
        <button className="hp-btn hp-btn-primary" style={{ marginTop: 20, width: "100%" }} onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ── state ── */
  const [user, setUser] = useState(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [topFeedbacks, setTopFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showAllTournaments, setShowAllTournaments] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  /* close player modal on scroll */
  useEffect(() => {
    const handleScroll = () => { if (selectedPlayer) setSelectedPlayer(null); };
    if (selectedPlayer) {
      window.addEventListener("wheel", handleScroll);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { window.removeEventListener("wheel", handleScroll); document.body.style.overflow = "auto"; };
  }, [selectedPlayer]);

  /* ── fetch data (KEEP BACKEND AS-IS) ── */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { localStorage.removeItem("user"); }
    }
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const res = await axios.get("http://localhost:8080/ctms/api/home");
      if (res.status === 200 && res.data) {
        setUpcomingTournaments(res.data.upcomingTournaments ?? []);
        setTopPlayers(res.data.topPlayers ?? []);
        setTopFeedbacks(res.data.topFeedbacks ?? []);
      }
    } catch (error) {
      console.error("Không thể lấy dữ liệu Home:", error);
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

  /* ── static data ── */
  const benefits = [
    { id: 1, title: "Tiết kiệm thời gian", description: "Quản lý giải đấu tự động, tiết kiệm tới 90% thời gian so với phương pháp thủ công.", icon: Clock, color: "amber" },
    { id: 2, title: "Bảo vệ môi trường", description: "Không cần in ấn biểu mẫu, hoàn toàn số hóa và thân thiện với môi trường.", icon: Leaf, color: "green" },
    { id: 3, title: "ELO tự động", description: "Hệ thống tính điểm ELO chính xác, tự động cập nhật sau mỗi trận đấu.", icon: TrendingUp, color: "cyan" },
    { id: 4, title: "Truyền thông", description: "Công cụ quảng bá giải đấu mạnh mẽ, tiếp cận hàng ngàn kỳ thủ.", icon: Radio, color: "purple" },
  ];

  /* tournaments to display */
  const INITIAL_SHOW = 6;
  const displayedTournaments = showAllTournaments
    ? upcomingTournaments
    : upcomingTournaments.slice(0, INITIAL_SHOW);

  /* ──────────────── RENDER ──────────────── */
  return (
    <div id="home-page">
      {/* ── HEADER ── */}
      <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} />

      {/* ════════════ HERO ════════════ */}
      <section className="hp-hero">
        <div className="hp-hero-bg">
          <img src={HERO_IMAGE} alt="Chess tournament" />
          <div className="hp-hero-overlay" />
        </div>

        <div className="hp-hero-content">
          <div className="hp-hero-badge">
            <Sparkles size={14} />
            <span>PREMIUM CHESS TOURNAMENTS</span>
            <Sparkles size={14} />
          </div>

          <h1 className="hp-hero-title">
            Master The Board.<br />
            <span className="hp-hero-title-accent">Claim The Prize.</span>
          </h1>

          <p className="hp-hero-subtitle">
            Tham gia các giải đấu cờ vua chuyên nghiệp, thể hiện kỹ năng và giành{" "}
            <span className="hp-highlight">giải thưởng hấp dẫn</span>.
          </p>

          <div className="hp-hero-actions">
            <button
              className="hp-btn hp-btn-primary hp-btn-lg"
              onClick={() => navigate(user ? "/tournaments" : "/register")}
            >
              <span>THAM GIA NGAY</span>
              <Zap size={20} fill="currentColor" />
            </button>
            <button className="hp-btn hp-btn-outline hp-btn-lg" onClick={() => {
              document.getElementById("hp-tournaments")?.scrollIntoView({ behavior: "smooth" });
            }}>
              <span>Xem Giải Đấu</span>
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="hp-hero-stats">
            <div className="hp-hero-stat">
              <span className="hp-hero-stat-value hp-accent">{upcomingTournaments.length || "—"}</span>
              <span className="hp-hero-stat-label">Giải đấu</span>
            </div>
            <div className="hp-hero-stat">
              <span className="hp-hero-stat-value">{topPlayers.length || "—"}</span>
              <span className="hp-hero-stat-label">Top Players</span>
            </div>
            <div className="hp-hero-stat">
              <span className="hp-hero-stat-value">{topFeedbacks.length || "—"}</span>
              <span className="hp-hero-stat-label">Đánh giá</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ UPCOMING TOURNAMENTS ════════════ */}
      <section id="hp-tournaments" className="hp-section hp-section-with-bg">
        <div className="hp-section-bg-image">
          <img src={TOURNAMENTS_BG} alt="" />
          <div className="hp-section-bg-overlay" />
        </div>
        <div className="hp-container">
          <div className="hp-section-header">
            <div>
              <div className="hp-section-badge">EVENTS</div>
              <h2 className="hp-section-title">Giải Đấu Sắp Tới</h2>
              <p className="hp-section-subtitle">Đăng ký ngay để không bỏ lỡ các giải đấu hấp dẫn</p>
            </div>
            {upcomingTournaments.length > INITIAL_SHOW && (
              <button
                className="hp-btn hp-btn-ghost"
                onClick={() => setShowAllTournaments(!showAllTournaments)}
              >
                {showAllTournaments ? "Thu gọn" : `Xem tất cả (${upcomingTournaments.length})`}
                {showAllTournaments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>

          <div className="hp-tournaments-grid">
            {loading ? (
              <div className="hp-loading">
                <div className="hp-loading-spinner" />
                <p>Đang tải giải đấu...</p>
              </div>
            ) : displayedTournaments.length > 0 ? (
              displayedTournaments.map((t, index) => (
                <div
                  key={t.tournamentId}
                  className="hp-tournament-card"
                  onClick={() => setSelectedTournament(t)}
                >
                  <div className="hp-tournament-card-img">
                    <ImageWithFallback
                      src={t.tournamentImage || TOURNAMENT_IMAGES[index % TOURNAMENT_IMAGES.length]}
                      alt={t.tournamentName}
                    />
                    <span className="hp-tournament-card-badge">{t.format || "Classic"}</span>
                  </div>
                  <div className="hp-tournament-card-body">
                    <h3 className="hp-tournament-card-title">{t.tournamentName}</h3>
                    <div className="hp-tournament-card-meta">
                      <div className="hp-tournament-meta-item">
                        <Calendar size={14} />
                        <span>{t.startDate ? new Date(t.startDate).toLocaleDateString("vi-VN") : "—"}</span>
                      </div>
                      <div className="hp-tournament-meta-item">
                        <MapPin size={14} />
                        <span>{t.location || "Online"}</span>
                      </div>
                      <div className="hp-tournament-meta-item">
                        <Users size={14} />
                        <span>{t.minPlayer ?? "—"} – {t.maxPlayer ?? "—"} người chơi</span>
                      </div>
                    </div>
                    <div className="hp-tournament-card-footer">
                      <div className="hp-tournament-prize">
                        {t.prizePool != null ? `${Number(t.prizePool).toLocaleString("vi-VN")}₫` : "—"}
                        <small>Giải thưởng</small>
                      </div>
                      <button className="hp-view-details-btn" onClick={(e) => { e.stopPropagation(); setSelectedTournament(t); }}>
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="hp-empty-state">
                <Trophy size={48} style={{ margin: "0 auto 16px", color: "#d97706" }} />
                <p>Chưa có giải đấu nào sắp diễn ra.</p>
              </div>
            )}
          </div>

          {/* Show All button (below grid) */}
          {!loading && upcomingTournaments.length > INITIAL_SHOW && (
            <div className="hp-show-all-wrapper">
              <button
                className="hp-show-all-btn"
                onClick={() => setShowAllTournaments(!showAllTournaments)}
              >
                {showAllTournaments ? (
                  <><span>Thu gọn</span><ChevronUp size={18} /></>
                ) : (
                  <><span>Xem tất cả {upcomingTournaments.length} giải đấu</span><ChevronDown size={18} /></>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Tournament Detail Modal ── */}
      {selectedTournament && (
        <>
          <div className="hp-modal-overlay" onClick={() => setSelectedTournament(null)} />
          <div className="hp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hp-modal-header">
              <h2 className="hp-modal-title">{selectedTournament.tournamentName}</h2>
              <button type="button" className="hp-modal-close" onClick={() => setSelectedTournament(null)}>✕</button>
            </div>
            <div className="hp-modal-body">
              {selectedTournament.description && (
                <p style={{ marginBottom: 16 }}>
                  <strong>Mô tả:</strong><br />{selectedTournament.description}
                </p>
              )}
              <ul>
                <li><strong>Địa điểm:</strong> {selectedTournament.location || "—"}</li>
                <li><strong>Format:</strong> {selectedTournament.format || "—"}</li>
                <li><strong>Hạng mục:</strong> {selectedTournament.categories || "—"}</li>
                <li><strong>Số người chơi:</strong> {selectedTournament.minPlayer ?? "—"} – {selectedTournament.maxPlayer ?? "—"}</li>
                <li><strong>Lệ phí đăng ký:</strong> {selectedTournament.entryFee != null ? `${Number(selectedTournament.entryFee).toLocaleString("vi-VN")} VNĐ` : "—"}</li>
                <li><strong>Giải thưởng:</strong> {selectedTournament.prizePool != null ? `${Number(selectedTournament.prizePool).toLocaleString("vi-VN")} VNĐ` : "—"}</li>
                <li><strong>Trạng thái:</strong> {selectedTournament.status || "—"}</li>
                <li><strong>Hạn đăng ký:</strong> {formatDateTime(selectedTournament.registrationDeadline)}</li>
                <li><strong>Ngày bắt đầu:</strong> {formatDateTime(selectedTournament.startDate)}</li>
                <li><strong>Ngày kết thúc:</strong> {formatDateTime(selectedTournament.endDate)}</li>
              </ul>
              {selectedTournament.notes && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                  <strong>Luật lệ / Ghi chú:</strong>
                  <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{selectedTournament.notes}</p>
                </div>
              )}
            </div>
            <button className="hp-btn hp-btn-primary hp-modal-footer-btn" onClick={() => setSelectedTournament(null)}>
              Đóng
            </button>
          </div>
        </>
      )}

      {/* ════════════ IMAGE BANNER ════════════ */}
      <div className="hp-image-banner">
        <img src={BANNER_IMAGE} alt="Chess pieces" />
        <div className="hp-image-banner-overlay">
          <div className="hp-image-banner-content">
            <h3>Sẵn sàng chinh phục?</h3>
            <p>Hàng trăm kỳ thủ đang chờ bạn trên bàn cờ</p>
            <button className="hp-btn hp-btn-lg" style={{ background: "#fff", color: "#d97706", fontWeight: 800 }}
              onClick={() => navigate(user ? "/tournaments" : "/register")}>
              Đăng ký ngay <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ════════════ TOP PLAYERS ════════════ */}
      <section className="hp-section hp-section-with-bg hp-section-players">
        <div className="hp-section-bg-image">
          <img src={PLAYERS_BG} alt="" />
          <div className="hp-section-bg-overlay hp-section-bg-overlay-dark" />
        </div>
        <div className="hp-container">
          <div className="hp-section-header hp-section-header-center">
            <div className="hp-section-badge hp-section-badge-light">RANKING</div>
            <h2 className="hp-section-title hp-text-white">Top Players</h2>
            <p className="hp-section-subtitle hp-text-white-muted">Những kỳ thủ xuất sắc nhất trên hệ thống</p>
          </div>

          <div className="hp-players-grid">
            {loading ? (
              <div className="hp-loading">
                <div className="hp-loading-spinner" />
                <p>Đang tải danh sách...</p>
              </div>
            ) : topPlayers.length > 0 ? (
              topPlayers.map((player) => (
                <div key={player.userId} className="hp-player-card" onClick={() => setSelectedPlayer(player)}>
                  <div className="hp-player-avatar-wrapper">
                    <ImageWithFallback
                      src={player.avatar}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="hp-player-avatar"
                    />
                    <span className="hp-player-rank-badge">
                      <Award size={12} style={{ marginRight: 3, verticalAlign: "middle" }} />
                      Rank {player.rank}
                    </span>
                  </div>
                  <h3 className="hp-player-name">{player.firstName} {player.lastName}</h3>
                  <p className="hp-player-title">Grandmaster</p>
                </div>
              ))
            ) : (
              <div className="hp-empty-state" style={{ width: "100%" }}>
                <p>Chưa có dữ liệu player.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Player Expanded Modal ── */}
      {selectedPlayer && (
        <>
          <div className="hp-player-modal-overlay" onClick={() => setSelectedPlayer(null)} />
          <div className="hp-player-modal" onClick={(e) => e.stopPropagation()}>
            <ImageWithFallback
              src={selectedPlayer.avatar}
              alt={`${selectedPlayer.firstName} ${selectedPlayer.lastName}`}
              className="hp-player-modal-avatar"
            />
            <div className="hp-player-modal-rank">Rank {selectedPlayer.rank}</div>
            <h3 className="hp-player-modal-name">{selectedPlayer.firstName} {selectedPlayer.lastName}</h3>
            <p className="hp-player-modal-title-text">Grandmaster</p>
            <p className="hp-player-modal-quote">"{getSlogan(selectedPlayer.userId)}"</p>
          </div>
        </>
      )}

      {/* ════════════ BENEFITS ════════════ */}
      <section className="hp-section">
        <div className="hp-container">
          <div className="hp-section-header hp-section-header-center">
            <div className="hp-section-badge">BENEFITS</div>
            <h2 className="hp-section-title">Tại sao chọn Chess Arena?</h2>
            <p className="hp-section-subtitle">Số hóa thể thao là xu hướng phát triển tất yếu!</p>
          </div>

          <div className="hp-benefits-grid">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.id} className="hp-benefit-card">
                  <div className={`hp-benefit-icon hp-benefit-icon-${b.color}`}>
                    <Icon size={28} strokeWidth={2.5} />
                  </div>
                  <h3 className="hp-benefit-title">{b.title}</h3>
                  <p className="hp-benefit-desc">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════ FEEDBACK / TESTIMONIALS ════════════ */}
      <section className="hp-section hp-feedback-section">
        <div className="hp-container">
          <div className="hp-section-header hp-section-header-center">
            <div className="hp-section-badge">TESTIMONIALS</div>
            <h2 className="hp-section-title">
              Cảm nhận từ <span className="hp-title-accent">cộng đồng</span>
            </h2>
            <p className="hp-section-subtitle">Những chia sẻ chân thực từ các kỳ thủ trên Chess Arena</p>
          </div>

          {loading ? (
            <div className="hp-loading">
              <div className="hp-loading-spinner" />
              <p>Đang tải đánh giá...</p>
            </div>
          ) : topFeedbacks.length > 0 ? (
            <div className="hp-testimonials-masonry">
              {topFeedbacks.slice(0, 6).map((fb, index) => (
                <div key={fb.feedbackId} className={`hp-testimonial ${index === 0 ? "hp-testimonial-featured" : ""}`}>
                  <div className="hp-testimonial-quote-icon">"</div>
                  <p className="hp-testimonial-text">{fb.comment}</p>
                  <div className="hp-testimonial-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < (fb.starRating || 0) ? "#d97706" : "none"}
                        color={i < (fb.starRating || 0) ? "#d97706" : "#e2e8f0"}
                      />
                    ))}
                  </div>
                  <div className="hp-testimonial-author">
                    <ImageWithFallback
                      src={fb.avatar}
                      alt={fb.firstName}
                      className="hp-testimonial-avatar"
                    />
                    <div>
                      <div className="hp-testimonial-name">{fb.firstName} {fb.lastName}</div>
                      {fb.tournamentId != null && (
                        <div className="hp-testimonial-meta">Giải đấu #{fb.tournamentId}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>Chưa có đánh giá nào.</p>
          )}
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="hp-footer">
        <div className="hp-footer-glow" />
        <div className="hp-container">
          <div className="hp-footer-grid">
            {/* Brand */}
            <div className="hp-footer-brand">
              <div className="hp-footer-logo">
                <div className="hp-footer-logo-icon">
                  <Crown size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="hp-footer-logo-title">CHESS ARENA</div>
                  <div className="hp-footer-logo-subtitle">TOURNAMENT PLATFORM</div>
                </div>
              </div>
              <p className="hp-footer-description">
                Nền tảng giải đấu cờ vua chuyên nghiệp hàng đầu với giải thưởng lớn và cộng đồng chất lượng.
              </p>
              <div className="hp-footer-social">
                <a href="#"><Facebook size={18} /></a>
                <a href="#"><Twitter size={18} /></a>
                <a href="#"><Instagram size={18} /></a>
                <a href="#"><Youtube size={18} /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="hp-footer-links-group">
              <h3 className="hp-footer-links-title">Liên Kết</h3>
              <ul className="hp-footer-links-list">
                <li><Link to="/home" className="hp-footer-link"><span className="hp-footer-link-dot" />Trang Chủ</Link></li>
                <li><Link to="/tournaments" className="hp-footer-link"><span className="hp-footer-link-dot" />Giải Đấu</Link></li>
                <li><a href="#" className="hp-footer-link"><span className="hp-footer-link-dot" />Bảng Xếp Hạng</a></li>
                <li>
                  <button className="hp-footer-link" onClick={() => setShowGuide(true)}>
                    <span className="hp-footer-link-dot" />Cách Chơi
                  </button>
                </li>
                <li><a href="#" className="hp-footer-link"><span className="hp-footer-link-dot" />Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="hp-footer-links-group">
              <h3 className="hp-footer-links-title">Hỗ Trợ</h3>
              <ul className="hp-footer-links-list">
                <li><a href="#" className="hp-footer-link"><span className="hp-footer-link-dot" />Trung Tâm Trợ Giúp</a></li>
                <li>
                  <button className="hp-footer-link" onClick={() => setShowTerms(true)}>
                    <span className="hp-footer-link-dot" />Điều Khoản Dịch Vụ
                  </button>
                </li>
                <li>
                  <button className="hp-footer-link" onClick={() => setShowPrivacy(true)}>
                    <span className="hp-footer-link-dot" />Chính Sách Bảo Mật
                  </button>
                </li>
                <li>
                  <button className="hp-footer-link" onClick={() => setShowFaq(true)}>
                    <span className="hp-footer-link-dot" />Câu Hỏi Thường Gặp
                  </button>
                </li>
                <li><a href="#" className="hp-footer-link"><span className="hp-footer-link-dot" />Liên Hệ</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="hp-footer-newsletter">
              <h3 className="hp-footer-links-title">Đăng Ký Nhận Tin</h3>
              <p className="hp-footer-newsletter-text">Nhận thông tin giải đấu mới và ưu đãi đặc biệt.</p>
              <div>
                <div className="hp-newsletter-input-wrapper">
                  <Mail size={18} className="hp-newsletter-icon" />
                  <input type="email" placeholder="Email của bạn" className="hp-newsletter-input" />
                </div>
                <button className="hp-newsletter-btn" style={{ marginTop: 10 }}>Đăng Ký</button>
              </div>
            </div>
          </div>

          <div className="hp-footer-bottom">
            <p className="hp-footer-copyright">© 2026 Chess Arena. All rights reserved.</p>
            <div className="hp-footer-bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════ MODALS (Guide, Terms, Privacy, FAQ) ════════════ */}
      <SimpleModal isOpen={showGuide} onClose={() => setShowGuide(false)} title="Cách Chơi">
        <p className="hp-modal-section-title">1. Đăng ký</p>
        <p>Tạo tài khoản để tham gia các giải đấu.</p>
        <p className="hp-modal-section-title">2. Chọn giải</p>
        <p>Tìm kiếm các giải đấu "Live" hoặc sắp tới.</p>
        <p className="hp-modal-section-title">3. Thi đấu</p>
        <p>Tuân thủ luật ELO tự động và thời gian quy định.</p>
        <p className="hp-modal-section-title">4. Nhận thưởng</p>
        <p>Đạt thứ hạng cao để nhận quỹ thưởng hấp dẫn.</p>
      </SimpleModal>

      <SimpleModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Điều Khoản Dịch Vụ">
        <p className="hp-modal-section-title">1. Quy định chung</p>
        <p>Bằng việc sử dụng Chess Arena, bạn đồng ý tuân thủ các quy tắc ứng xử văn minh và không gian lận.</p>
        <p className="hp-modal-section-title">2. Tài khoản người dùng</p>
        <p>Mỗi người dùng chỉ được sở hữu một tài khoản duy nhất. Mọi hành vi tạo nhiều tài khoản để trục lợi giải thưởng sẽ bị khóa vĩnh viễn.</p>
        <p className="hp-modal-section-title">3. Giải đấu và Giải thưởng</p>
        <p>Kết quả giải đấu được hệ thống tự động ghi nhận dựa trên điểm ELO và các trận đấu thực tế. Quyết định của Ban Quản Trị là quyết định cuối cùng.</p>
        <p className="hp-modal-section-title">4. Bảo mật</p>
        <p>Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn và không chia sẻ cho bên thứ ba khi chưa có sự đồng ý.</p>
      </SimpleModal>

      <SimpleModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Chính Sách Bảo Mật">
        <p className="hp-modal-section-title">1. Thu thập thông tin</p>
        <p>Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký (email, tên, ảnh đại diện) và dữ liệu khi tham gia giải đấu để vận hành nền tảng.</p>
        <p className="hp-modal-section-title">2. Sử dụng thông tin</p>
        <p>Thông tin được dùng để quản lý tài khoản, xếp hạng, trao giải và gửi thông báo liên quan đến giải đấu. Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.</p>
        <p className="hp-modal-section-title">3. Bảo mật dữ liệu</p>
        <p>Dữ liệu được mã hóa và lưu trữ an toàn. Chỉ nhân sự được ủy quyền mới có quyền truy cập khi cần hỗ trợ hoặc xử lý sự cố.</p>
        <p className="hp-modal-section-title">4. Quyền của bạn</p>
        <p>Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân. Liên hệ bộ phận hỗ trợ qua email hoặc form Liên hệ trên website.</p>
      </SimpleModal>

      <SimpleModal isOpen={showFaq} onClose={() => setShowFaq(false)} title="Câu Hỏi Thường Gặp">
        <p className="hp-modal-section-title">Làm sao để đăng ký tham gia giải đấu?</p>
        <p>Bạn cần tạo tài khoản, đăng nhập, sau đó vào mục Tournaments để xem danh sách giải và bấm "Đăng ký" tại giải muốn tham gia.</p>
        <p className="hp-modal-section-title">Điểm ELO được tính như thế nào?</p>
        <p>Hệ thống tính ELO dựa trên kết quả các trận đấu: thắng/thua/hòa và rating đối thủ. ELO cập nhật tự động sau mỗi trận.</p>
        <p className="hp-modal-section-title">Làm thế nào để nhận giải thưởng?</p>
        <p>Sau khi giải kết thúc, Ban tổ chức sẽ liên hệ qua email/điện thoại đã đăng ký để xác nhận thông tin và chuyển quà/thưởng.</p>
        <p className="hp-modal-section-title">Tôi quên mật khẩu thì làm sao?</p>
        <p>Trên trang Đăng nhập, bấm "Quên mật khẩu" và nhập email đăng ký. Hệ thống sẽ gửi link đặt lại mật khẩu qua email.</p>
      </SimpleModal>
    </div>
  );
}
