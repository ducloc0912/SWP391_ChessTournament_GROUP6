import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Bell, ChevronDown, Trophy, Facebook, Twitter, Instagram, Youtube,
  Mail, Clock, Leaf, TrendingUp, Radio, Star, ThumbsUp, Share2,
  Sparkles, Zap, Crown, LogOut
} from "lucide-react";


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

// --- MAIN COMPONENT ---
export default function HomePage() {
  const navigate = useNavigate();

  // 1. STATE QUẢN LÝ DỮ LIỆU
  const [user, setUser] = useState(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      if (res.status === 200) {
        setUpcomingTournaments(res.data.upcomingTournaments || []);
        setTopPlayers(res.data.topPlayers || []);
      }
    } catch (error) {
      console.error("Không thể lấy dữ liệu Home:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    // Xóa cả cookie nếu cần (gọi API logout backend nếu có)
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

  const testimonials = [
    { id: 1, name: "Lang Thang", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", rating: 5, comment: "Hệ thống chuyên nghiệp...", platform: "Facebook" },
  ];

  return (
    <div id="home-page">
      {/* --- HEADER --- */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            {/* Logo */}
            <div className="logo-wrapper" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              <div className="logo-icon"><Crown size={28} strokeWidth={2.5} /></div>
              <div className="logo-text">
                <span className="logo-title">CHESS ARENA</span>
                <span className="logo-subtitle">TOURNAMENT PLATFORM</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="nav">
              <Link to="/" className="nav-link nav-link-active">Home</Link>
              <Link to="/tournaments" className="nav-link">Tournaments</Link>
              <Link to="/blog" className="nav-link">Blog</Link>
            </nav>

            {/* Right Section: CHECK USER LOGIN */}
            <div className="header-actions">
              {user ? (
                // ĐÃ LOGIN
                <>
                  <button className="icon-btn">
                    <Bell size={20} />
                    <span className="notification-dot"></span>
                  </button>
                  
                  <div className="user-dropdown" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>
                      Hi, {user.firstName}
                    </span>
                    <button className="user-btn" onClick={() => navigate("/profile")}>
                      {/* Avatar User */}
                      <ImageWithFallback 
                        src={user.avatar} 
                        className="user-avatar-img" 
                        style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "2px solid #00d4ff" }}
                      />
                    </button>
                    <button className="icon-btn" onClick={handleLogout} title="Logout">
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              ) : (
                // CHƯA LOGIN
                <div style={{ display: "flex", gap: "10px" }}>
                  <Button size="sm" onClick={() => navigate("/login")}>Login</Button>
                  <Button size="sm" className="btn-primary" onClick={() => navigate("/register")}>Register</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

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
              <Button size="lg" className="btn-primary" onClick={() => navigate(user ? "/tournaments" : "/register")}>
                <span>JOIN TOURNAMENT NOW</span>
                <Zap size={20} fill="currentColor" />
              </Button>
            </div>
            
            {/* Stats */}
            <div className="hero-stats">
              <div className="stat-item"><div className="stat-value">50K+</div><div className="stat-label">Players</div></div>
              <div className="stat-item stat-item-highlight"><div className="stat-value">₫50M+</div><div className="stat-label">Prizes</div></div>
              <div className="stat-item stat-item-cyan"><div className="stat-value">100+</div><div className="stat-label">Events</div></div>
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
                  <Button size="sm" className="btn-primary" style={{ width: "100%", marginTop: "15px" }}>
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

      {/* --- DYNAMIC SECTION: TOP PLAYERS (TỪ API) --- */}
      <section className="benefits">
        <div className="benefits-bg-orbs"><div className="benefits-orb benefits-orb-1"></div></div>
        
        <div className="container">
          <div className="section-header">
            <div className="section-badge section-badge-amber">RANKING</div>
            <h2 className="section-title">
              <span className="text-white">Top </span>
              <span className="text-gradient">Players</span>
            </h2>
          </div>

          {/* Grid hiển thị Player */}
          <div className="benefits-grid" style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
            {topPlayers.map((player) => (
              <div key={player.userId} className="benefit-card" style={{ width: "220px", textAlign: "center", padding: "30px 20px" }}>
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
            ))}
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
          <div className="community-grid">
            {/* Testimonials */}
            <div className="testimonials-wrapper">
              <div className="testimonials-header">
                <div className="section-badge section-badge-green">TESTIMONIALS</div>
                <h2 className="section-title-left">
                  <span className="text-white">Cảm nhận </span>
                  <span className="text-gradient-green">người dùng</span>
                </h2>
                <p className="section-subtitle-left">Chia sẻ từ cộng đồng người dùng Chess Arena</p>
              </div>

              <div className="testimonials-list">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="testimonial-card">
                    <div className="testimonial-card-overlay"></div>
                    <div className="testimonial-content">
                      <div className="testimonial-avatar-wrapper">
                        <div className="testimonial-avatar-glow"></div>
                        <ImageWithFallback 
                          src={testimonial.avatar} 
                          alt={testimonial.name} 
                          className="testimonial-avatar"
                        />
                      </div>
                      <div className="testimonial-text">
                        <div className="testimonial-stars">
                          {Array.from({ length: testimonial.rating }).map((_, index) => (
                            <Star key={index} size={16} fill="#fbbf24" color="#fbbf24" />
                          ))}
                        </div>
                        <p className="testimonial-comment">"{testimonial.comment}"</p>
                        <div className="testimonial-author">FB: {testimonial.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share CTA */}
            <div className="share-cta-wrapper">
              <div className="share-cta">
                <div className="share-cta-bg">
                  <div className="share-cta-glow share-cta-glow-1"></div>
                  <div className="share-cta-glow share-cta-glow-2"></div>
                  <div className="share-cta-border"></div>
                </div>

                <div className="share-cta-content">
                  <div className="share-cta-icon">
                    <Share2 size={40} strokeWidth={2.5} />
                  </div>
                  <div className="share-cta-text">
                    <h3 className="share-cta-title">Chia sẻ với bạn bè</h3>
                    <p className="share-cta-description">
                      Giúp bạn bè của bạn khám phá nền tảng tổ chức giải đấu cờ vua chuyên nghiệp hàng đầu Việt Nam
                    </p>
                  </div>

                  <Button className="btn-share">
                    <ThumbsUp size={24} /> 
                    Thích & Chia sẻ
                  </Button>

                  <div className="share-cta-stats">
                    <div className="share-stat">
                      <div className="share-stat-value">1,200+</div>
                      <div className="share-stat-label">Người thích</div>
                    </div>
                    <div className="share-stat">
                      <div className="share-stat-value">350+</div>
                      <div className="share-stat-label">Chia sẻ</div>
                    </div>
                  </div>
                </div>
              </div>
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
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Cách Chơi</a></li>
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="footer-links">
              <h3 className="footer-links-title">Hỗ Trợ</h3>
              <ul className="footer-links-list">
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Trung Tâm Trợ Giúp</a></li>
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Điều Khoản Dịch Vụ</a></li>
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Chính Sách Bảo Mật</a></li>
                <li><a href="#" className="footer-link"><span className="footer-link-dot"></span>Câu Hỏi Thường Gặp</a></li>
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
    </div>
  );
}