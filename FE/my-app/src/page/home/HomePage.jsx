import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ChevronDown, Trophy, Facebook, Twitter, Instagram, Youtube,
  Mail, Clock, Leaf, TrendingUp, Radio, Star,
  Sparkles, Zap, Crown
} from "lucide-react";
import { getSlogan } from "../../component/common/Slogon";
import MainHeader from "../../component/common/MainHeader";


// --- COMPONENTS CON ---
function Button({ children, size = "md", className = "", ...props }) {
  return (
    <button {...props} className={`btn btn-${size} ${className}`.trim()}>
      {children}
    </button>
  );
}

function ImageWithFallback({ src, alt = "", className = "", fallback = "https://ui-avatars.com/api/?name=User&background=random" }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc || fallback}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback)}
    />
  );
}

function formatDateTime(val) {
  if (val == null) return "—";
  const d = typeof val === "string" ? new Date(val) : Array.isArray(val) ? new Date(val[0], (val[1] ?? 1) - 1, val[2] ?? 1, val[3] ?? 0, val[4] ?? 0, val[5] ?? 0) : new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function SimpleModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10005,
        backdropFilter: "blur(8px)",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#121212",
          border: "1px solid #fbbf24",
          borderRadius: "20px",
          padding: "30px",
          maxWidth: "550px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 0 40px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{ position: "absolute", top: "15px", right: "20px", color: "#71717a", fontSize: "22px", background: "none", border: "none", cursor: "pointer" }}
        >
          ✕
        </button>
        <h2 className="text-gradient" style={{ marginBottom: "20px", fontSize: "24px" }}>{title}</h2>
        <div style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: "1.7", overflowY: "auto", paddingRight: "10px", flex: 1 }}>
          {children}
        </div>
        <Button className="btn-primary" style={{ marginTop: "25px", width: "100%" }} onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function HomePage() {
  const navigate = useNavigate();

  // 1. STATE QUẢN LÝ DỮ LIỆU
  const [user, setUser] = useState(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [topFeedbacks, setTopFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  // Đóng thẻ player phóng to khi scroll
  useEffect(() => {
    const handleScroll = () => {
      if (selectedPlayer) setSelectedPlayer(null);
    };
    if (selectedPlayer) {
      window.addEventListener("wheel", handleScroll);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      window.removeEventListener("wheel", handleScroll);
      document.body.style.overflow = "auto";
    };
  }, [selectedPlayer]);

  // 2. USE EFFECT: CHẠY KHI LOAD TRANG
  useEffect(() => {
    // Check đăng nhập
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Lỗi parse user:", e);
        localStorage.removeItem("user");
      }
    }

    // Gọi API lấy dữ liệu Home
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

  // 3. DỮ LIỆU TĨNH (Benefits, Testimonials - Giữ nguyên của bạn)
  const benefits = [
    { id: 1, title: "Tiết kiệm thời gian", description: "Tiết kiệm tới 90% thời gian...", icon: Clock, color: "amber", position: "top-left" },
    { id: 2, title: "Tài nguyên giấy", description: "Không in ấn, bảo vệ môi trường...", icon: Leaf, color: "green", position: "top-right" },
    { id: 3, title: "ELO tự động", description: "Hệ thống tự động tính điểm ELO...", icon: TrendingUp, color: "cyan", position: "bottom-left" },
    { id: 4, title: "Truyền thông", description: "Công cụ quảng bá giải đấu...", icon: Radio, color: "purple", position: "bottom-right" },
  ];

  const location = useLocation();

  return (
    <div id="home-page">
      {/* --- HEADER (dùng chung mọi trang) --- */}
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
      />

      {/* --- HERO SECTION --- */}
      <section className="hero">
        <div className="hero-bg">
          <img src="https://media.craiyon.com/2025-04-18/CGw-7cdIS6mlv69r_y_aEQ.webp" alt="Chess" className="hero-bg-image" />
          <div className="hero-overlay"></div>
        </div>
        
        {/* Decor Orbs */}
        <div className="hero-orbs"><div className="hero-orb hero-orb-1"></div><div className="hero-orb hero-orb-2"></div></div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} /><span>PREMIUM CHESS TOURNAMENTS</span><Sparkles size={16} />
            </div>
            <h1 className="hero-title">
              <div className="hero-title-line">MASTER</div>
              <div className="hero-title-line">THE BOARD.</div>
              <div className="hero-title-line hero-title-gradient">CLAIM THE PRIZE.</div>
            </h1>
            <p className="hero-subtitle">
              Compete with the best players, showcase your skills, and win <span className="text-highlight">massive prize pools</span>.
            </p>
            <div className="hero-cta">
              <Button
                size="lg"
                className="btn-primary"
                onClick={() => {
                  if (!user) {
                    navigate("/register");
                    return;
                  }
                  const role = (localStorage.getItem("role") || "").toLowerCase();
                  navigate(role.includes("leader") ? "/tournaments" : "/player/tournaments");
                }}
              >
                <span>JOIN TOURNAMENT NOW</span>
                <Zap size={20} fill="currentColor" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --- DYNAMIC SECTION: GIẢI ĐẤU SẮP TỚI (TỪ API) --- */}
      <section className="how-it-works" style={{ paddingTop: "4rem" }}>
        <div className="container">
          <div className="section-header">
            <div className="section-badge">EVENTS</div>
            <h2 className="section-title">
              <span className="text-white">Giải Đấu </span>
              <span className="text-gradient">Sắp Tới</span>
            </h2>
          </div>

          <div className="steps-grid">
            {loading ? (
              <p style={{ color: "white", textAlign: "center" }}>Loading tournaments...</p>
            ) : upcomingTournaments.length > 0 ? (
              upcomingTournaments.map((t, index) => (
                <div key={t.tournamentId} className={`step-card step-card-${index === 0 ? 'amber' : index === 1 ? 'cyan' : 'green'}`}>
                  <div className="step-number">0{index + 1}</div>
                  <div className={`step-icon step-icon-${index === 0 ? 'amber' : index === 1 ? 'cyan' : 'green'}`}>
                    <Trophy size={32} />
                  </div>
                  <h3 className="step-title">{t.tournamentName}</h3>
                  <ul className="step-list">
                    <li><span className="step-dot"></span> Format: <strong>{t.format}</strong></li>
                    <li><span className="step-dot"></span> Start: {new Date(t.startDate).toLocaleDateString()}</li>
                    <li><span className="step-dot"></span> Prize: <strong>{t.prizePool?.toLocaleString()} VNĐ</strong></li>
                  </ul>
                  <Button size="sm" className="btn-primary" style={{ width: "100%", marginTop: "15px" }} onClick={() => setSelectedTournament(t)}>
                    View Details
                  </Button>
                </div>
              ))
            ) : (
              <p style={{ color: "#aaa", textAlign: "center", width: "100%" }}>Chưa có giải đấu nào sắp diễn ra.</p>
            )}
          </div>
        </div>
      </section>

      {/* Modal chi tiết giải đấu */}
      {selectedTournament && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.85)",
              zIndex: 10004,
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setSelectedTournament(null)}
          />
          <div
            className="tournament-detail-modal"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(90vw, 560px)",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "linear-gradient(135deg, #18181b, #09090b)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              zIndex: 10005,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <h2 className="text-gradient" style={{ fontSize: "22px", margin: 0 }}>
                {selectedTournament.tournamentName}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedTournament(null)}
                style={{ background: "none", border: "none", color: "#71717a", fontSize: "22px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: "1.7", overflowY: "auto", paddingRight: "8px", flex: 1 }}>
              {selectedTournament.description && (
                <p style={{ marginBottom: "16px" }}><strong style={{ color: "#e4e4e7" }}>Mô tả:</strong><br />{selectedTournament.description}</p>
              )}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ marginBottom: "10px" }}><strong style={{ color: "#e4e4e7" }}>Địa điểm:</strong> {selectedTournament.location || "—"}</li>
                <li style={{ marginBottom: "10px" }}><strong style={{ color: "#e4e4e7" }}>Format:</strong> {selectedTournament.format || "—"}</li>
                <li style={{ marginBottom: "10px" }}><strong style={{ color: "#e4e4e7" }}>Hạng mục:</strong> {selectedTournament.categories || "—"}</li>
                <li style={{ marginBottom: "10px" }}><strong style={{ color: "#e4e4e7" }}>Số người chơi:</strong> {selectedTournament.minPlayer ?? "—"} – {selectedTournament.maxPlayer ?? "—"}</li>
                <li style={{ marginBottom: "10px" }}><strong style={{ color: "#e4e4e7" }}>Lệ phí đăng ký:</strong> {selectedTournament.entryFee != null ? `${Number(selectedTournament.entryFee).toLocaleString("vi-VN")} VNĐ` : "—"}</li>
                <li style={{ marginBottom: "10px" }}><strong style={{ color: "#e4e4e7" }}>Giải thưởng:</strong> {selectedTournament.prizePool != null ? `${Number(selectedTournament.prizePool).toLocaleString("vi-VN")} VNĐ` : "—"}</li>
                <li style={{ marginBottom: "10px" }}><strong style={{ color: "#e4e4e7" }}>Trạng thái:</strong> {selectedTournament.status || "—"}</li>
                <li style={{ marginBottom: "10px" }}><strong style={{ color: "#e4e4e7" }}>Hạn đăng ký:</strong> {formatDateTime(selectedTournament.registrationDeadline)}</li>
                <li style={{ marginBottom: "10px" }}><strong style={{ color: "#e4e4e7" }}>Ngày bắt đầu:</strong> {formatDateTime(selectedTournament.startDate)}</li>
                <li style={{ marginBottom: "10px" }}><strong style={{ color: "#e4e4e7" }}>Ngày kết thúc:</strong> {formatDateTime(selectedTournament.endDate)}</li>
              </ul>
              {selectedTournament.notes && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #27272a" }}>
                  <strong style={{ color: "#e4e4e7" }}>Luật lệ / Ghi chú:</strong>
                  <p style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>{selectedTournament.notes}</p>
                </div>
              )}
            </div>
            <Button className="btn-primary" style={{ marginTop: "20px", width: "100%" }} onClick={() => setSelectedTournament(null)}>
              Đóng
            </Button>
          </div>
        </>
      )}

      {/* --- DYNAMIC SECTION: TOP PLAYERS (TỪ API) --- */}
      <section className="benefits">
        <div className="benefits-bg-orbs"><div className="benefits-orb benefits-orb-1"></div></div>

        {selectedPlayer && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              zIndex: 9998,
              backdropFilter: "blur(5px)",
            }}
            onClick={() => setSelectedPlayer(null)}
          />
        )}

        {selectedPlayer && (
          <div
            className="player-expanded-card"
            style={{
              position: "fixed",
              top: "max(72px, 10vh)",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(50vw, 480px)",
              maxHeight: "min(50vh, calc(100vh - 140px))",
              zIndex: 9999,
              background: "linear-gradient(135deg, #18181b, #09090b)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              overflow: "hidden",
              pointerEvents: "auto",
              transition: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid #fbbf24",
                }}
              >
                <ImageWithFallback
                  src={selectedPlayer.avatar}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "-8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#fbbf24",
                  color: "black",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                Rank {selectedPlayer.rank}
              </div>
            </div>
            <h3 className="benefit-title" style={{ fontSize: "1.5rem", marginBottom: "6px", color: "#fff" }}>
              {selectedPlayer.firstName} {selectedPlayer.lastName}
            </h3>
            <p className="benefit-description" style={{ fontSize: "1rem", color: "#a1a1aa", marginBottom: "16px" }}>
              Grandmaster
            </p>
            <div style={{ marginTop: "auto", borderTop: "1px solid #333", paddingTop: "16px", width: "100%" }}>
              <p style={{ color: "#fbbf24", fontStyle: "italic", fontSize: "1rem", margin: 0 }}>
                "{getSlogan(selectedPlayer.userId)}"
              </p>
            </div>
          </div>
        )}

        <div className="container">
          <div className="section-header">
            <div className="section-badge section-badge-amber">RANKING</div>
            <h2 className="section-title">
              <span className="text-white">Top </span>
              <span className="text-gradient">Players</span>
            </h2>
          </div>

          <div className="benefits-grid" style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
            {loading ? (
              <p style={{ color: "white", textAlign: "center", width: "100%" }}>Đang tải danh sách player...</p>
            ) : topPlayers.length > 0 ? (
              topPlayers.map((player) => (
                <div
                  key={player.userId}
                  className="benefit-card"
                  style={{
                    width: "220px",
                    textAlign: "center",
                    padding: "30px 20px",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="benefit-card-overlay"></div>
                  <div className="benefit-card-content" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ position: "relative", marginBottom: "15px" }}>
                      <div className="benefit-icon benefit-icon-amber" style={{ width: "80px", height: "80px", padding: 0, overflow: "hidden" }}>
                        <ImageWithFallback src={player.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ position: "absolute", bottom: "-10px", left: "50%", transform: "translateX(-50%)", background: "#fbbf24", color: "black", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}>
                        Rank {player.rank}
                      </div>
                    </div>
                    <h3 className="benefit-title" style={{ fontSize: "1.2rem", marginBottom: "5px" }}>
                      {player.firstName} {player.lastName}
                    </h3>
                    <p className="benefit-description" style={{ fontSize: "0.9rem" }}>
                      Grandmaster
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#aaa", textAlign: "center", width: "100%" }}>Chưa có dữ liệu player.</p>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="benefits-bg-orbs">
          <div className="benefits-orb benefits-orb-1"></div>
          <div className="benefits-orb benefits-orb-2"></div>
          <div className="benefits-orb benefits-orb-3"></div>
        </div>

        <div className="container">
          <div className="section-header">
            <div className="section-badge section-badge-amber">BENEFITS</div>
            <h2 className="section-title">
              <span className="text-white">Lợi ích </span>
              <span className="text-gradient">Chess Arena</span>
            </h2>
            <p className="section-subtitle-highlight">
              Số hóa thể thao là xu hướng phát triển tất yếu!
            </p>
          </div>

          {/* Desktop Circular Layout */}
          <div className="benefits-circular">
            <div className="benefits-center">
              <div className="benefits-center-glow"></div>
              <div className="benefits-center-icon">
                <Trophy size={64} strokeWidth={2} />
              </div>
              <div className="benefits-center-ring"></div>
            </div>

            <div className="benefits-grid">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.id} className={`benefit-card benefit-card-${benefit.color} benefit-card-${benefit.position}`}>
                    <div className="benefit-card-overlay"></div>
                    <div className="benefit-card-content">
                      <div className={`benefit-icon benefit-icon-${benefit.color}`}>
                        <Icon size={28} strokeWidth={2.5} />
                      </div>
                      <h3 className="benefit-title">{benefit.title}</h3>
                      <p className="benefit-description">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="benefits-mobile">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.id} className={`benefit-card-mobile benefit-card-mobile-${benefit.color}`}>
                  <div className="benefit-card-overlay"></div>
                  <div className="benefit-card-mobile-content">
                    <div className={`benefit-icon benefit-icon-${benefit.color}`}>
                      <Icon size={28} strokeWidth={2.5} />
                    </div>
                    <div className="benefit-text">
                      <h3 className="benefit-title">{benefit.title}</h3>
                      <p className="benefit-description">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="community">
        <div className="community-bg-orbs">
          <div className="community-orb community-orb-1"></div>
          <div className="community-orb community-orb-2"></div>
        </div>

        <div className="container">
          <div className="community-grid community-grid--feedback-layout">
            {/* Trái: thanh feedback (danh sách đánh giá) */}
            <div className="feedback-bar">
              <div className="testimonials-list testimonials-list--cards">
                {loading ? (
                  <p style={{ color: "#fff" }}>Đang tải đánh giá...</p>
                ) : topFeedbacks.length > 0 ? (
                  (topFeedbacks.slice(0, 5)).map((fb) => (
                    <div key={fb.feedbackId} className="testimonial-card">
                      <div className="testimonial-card-overlay"></div>
                      <div className="testimonial-content">
                        <div className="testimonial-avatar-wrapper">
                          <div className="testimonial-avatar-glow"></div>
                          <ImageWithFallback
                            src={fb.avatar}
                            alt={fb.firstName}
                            className="testimonial-avatar"
                          />
                        </div>
                        <div className="testimonial-text">
                          <div className="testimonial-stars">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                size={16}
                                fill={index < (fb.starRating || 0) ? "#fbbf24" : "none"}
                                color={index < (fb.starRating || 0) ? "#fbbf24" : "#4b5563"}
                              />
                            ))}
                          </div>
                          <p className="testimonial-comment">"{fb.comment}"</p>
                          <div className="testimonial-author">
                            {fb.firstName} {fb.lastName}
                            {fb.tournamentId != null && (
                              <span style={{ display: "block", fontSize: "0.75rem", color: "#aaa", marginTop: "4px" }}>
                                Giải đấu #{fb.tournamentId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#9ca3af", fontStyle: "italic" }}>Chưa có đánh giá nào.</p>
                )}
              </div>
            </div>

            {/* Phải: Cảm nhận người dùng (sau có thể thêm chia sẻ / like bên dưới) */}
            <div className="feedback-side">
              <div className="feedback-side__header">
                <h2 className="feedback-side__title">
                  <span className="text-white">Cảm nhận </span>
                  <span className="text-gradient-green">người dùng</span>
                </h2>
                <p className="feedback-side__subtitle">Chia sẻ từ cộng đồng người dùng Chess Arena</p>
              </div>
              {/* Chỗ để sau thêm nút Chia sẻ / Like */}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-glow"></div>

        <div className="container">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <Crown size={28} strokeWidth={2.5} />
                </div>
                <div className="footer-logo-text">
                  <span className="footer-logo-title">CHESS ARENA</span>
                  <span className="footer-logo-subtitle">TOURNAMENT PLATFORM</span>
                </div>
              </div>
              <p className="footer-description">
                Nền tảng giải đấu cờ vua chuyên nghiệp hàng đầu với giải thưởng lớn và cộng đồng chất lượng.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link"><Facebook size={20} /></a>
                <a href="#" className="social-link"><Twitter size={20} /></a>
                <a href="#" className="social-link"><Instagram size={20} /></a>
                <a href="#" className="social-link"><Youtube size={20} /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-links">
              <h3 className="footer-links-title">Liên Kết</h3>
              <ul className="footer-links-list">
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Trang Chủ</a></li>
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Giải Đấu</a></li>
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Bảng Xếp Hạng</a></li>
                <li>
                  <a href="#!" className="footer-link" onClick={(e) => { e.preventDefault(); setShowGuide(true); }}>
                    <span className="footer-link-dot"></span>Cách Chơi
                  </a>
                </li>
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="footer-links">
              <h3 className="footer-links-title">Hỗ Trợ</h3>
              <ul className="footer-links-list">
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Trung Tâm Trợ Giúp</a></li>
                <li>
                  <a href="#!" className="footer-link" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>
                    <span className="footer-link-dot"></span>Điều Khoản Dịch Vụ
                  </a>
                </li>
                <li>
                  <a href="#!" className="footer-link" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}>
                    <span className="footer-link-dot"></span>Chính Sách Bảo Mật
                  </a>
                </li>
                <li>
                  <a href="#!" className="footer-link" onClick={(e) => { e.preventDefault(); setShowFaq(true); }}>
                    <span className="footer-link-dot"></span>Câu Hỏi Thường Gặp
                  </a>
                </li>
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Liên Hệ</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="footer-newsletter">
              <h3 className="footer-links-title">Đăng Ký Nhận Tin</h3>
              <p className="footer-newsletter-text">Nhận thông tin giải đấu mới và ưu đãi đặc biệt.</p>
              <div className="newsletter-form">
                <div className="newsletter-input-wrapper">
                  <Mail size={20} className="newsletter-icon" />
                  <input type="email" placeholder="Email của bạn" className="newsletter-input" />
                </div>
                <Button className="btn-newsletter">Đăng Ký</Button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom">
            <p className="footer-copyright">© 2026 Chess Arena. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#" className="footer-bottom-link">Privacy</a>
              <a href="#" className="footer-bottom-link">Terms</a>
              <a href="#" className="footer-bottom-link">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <SimpleModal isOpen={showGuide} onClose={() => setShowGuide(false)} title="Cách Chơi">
        <p style={{ marginBottom: "10px", color: "#fff", fontWeight: "bold" }}>1. Đăng ký</p>
        <p>Tạo tài khoản để tham gia các giải đấu.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>2. Chọn giải</p>
        <p>Tìm kiếm các giải đấu "Live" hoặc sắp tới.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>3. Thi đấu</p>
        <p>Tuân thủ luật ELO tự động và thời gian quy định.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>4. Nhận thưởng</p>
        <p>Đạt thứ hạng cao để nhận quỹ thưởng hấp dẫn.</p>
      </SimpleModal>

      <SimpleModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Điều Khoản Dịch Vụ">
        <p style={{ marginBottom: "10px", color: "#fff", fontWeight: "bold" }}>1. Quy định chung</p>
        <p>Bằng việc sử dụng Chess Arena, bạn đồng ý tuân thủ các quy tắc ứng xử văn minh và không gian lận.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>2. Tài khoản người dùng</p>
        <p>Mỗi người dùng chỉ được sở hữu một tài khoản duy nhất. Mọi hành vi tạo nhiều tài khoản để trục lợi giải thưởng sẽ bị khóa vĩnh viễn.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>3. Giải đấu và Giải thưởng</p>
        <p>Kết quả giải đấu được hệ thống tự động ghi nhận dựa trên điểm ELO và các trận đấu thực tế. Quyết định của Ban Quản Trị là quyết định cuối cùng.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>4. Bảo mật</p>
        <p>Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn và không chia sẻ cho bên thứ ba khi chưa có sự đồng ý.</p>
      </SimpleModal>

      <SimpleModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Chính Sách Bảo Mật">
        <p style={{ marginBottom: "10px", color: "#fff", fontWeight: "bold" }}>1. Thu thập thông tin</p>
        <p>Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký (email, tên, ảnh đại diện) và dữ liệu khi tham gia giải đấu để vận hành nền tảng.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>2. Sử dụng thông tin</p>
        <p>Thông tin được dùng để quản lý tài khoản, xếp hạng, trao giải và gửi thông báo liên quan đến giải đấu. Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>3. Bảo mật dữ liệu</p>
        <p>Dữ liệu được mã hóa và lưu trữ an toàn. Chỉ nhân sự được ủy quyền mới có quyền truy cập khi cần hỗ trợ hoặc xử lý sự cố.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>4. Quyền của bạn</p>
        <p>Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân. Liên hệ bộ phận hỗ trợ qua email hoặc form Liên hệ trên website.</p>
      </SimpleModal>

      <SimpleModal isOpen={showFaq} onClose={() => setShowFaq(false)} title="Câu Hỏi Thường Gặp">
        <p style={{ marginBottom: "10px", color: "#fff", fontWeight: "bold" }}>Làm sao để đăng ký tham gia giải đấu?</p>
        <p>Bạn cần tạo tài khoản, đăng nhập, sau đó vào mục Tournaments để xem danh sách giải và bấm "Đăng ký" tại giải muốn tham gia.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>Điểm ELO được tính như thế nào?</p>
        <p>Hệ thống tính ELO dựa trên kết quả các trận đấu: thắng/thua/hòa và rating đối thủ. ELO cập nhật tự động sau mỗi trận.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>Làm thế nào để nhận giải thưởng?</p>
        <p>Sau khi giải kết thúc, Ban tổ chức sẽ liên hệ qua email/điện thoại đã đăng ký để xác nhận thông tin và chuyển quà/thưởng.</p>
        <p style={{ margin: "15px 0 10px", color: "#fff", fontWeight: "bold" }}>Tôi quên mật khẩu thì làm sao?</p>
        <p>Trên trang Đăng nhập, bấm "Quên mật khẩu" và nhập email đăng ký. Hệ thống sẽ gửi link đặt lại mật khẩu qua email.</p>
      </SimpleModal>
    </div>
  );
}