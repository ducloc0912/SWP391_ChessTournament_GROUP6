import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trophy,
  Users,
  Star,
  ArrowRight,
  Clock3,
} from "lucide-react";
import MainHeader from "../../component/common/MainHeader";
import "../../assets/css/HomePage.css";
import imgHero from "../../assets/image/952792579ca4f9e0836ceca4cc253c01.jpg";
import imgSlide1 from "../../assets/image/08118f77077fd9e6795319a2c6428cbc.jpg";
import imgSlide2 from "../../assets/image/96ef486bfb872c9ed5624c7763e55ea4.jpg";
import imgSlide3 from "../../assets/image/487c55215d12b2b7275d13526ab0c844.jpg";
import imgSlide4 from "../../assets/image/09ab0a288e7cf90b3e94f8e5f4c8921d.jpg";

import { API_BASE } from "../../config/api";
const FALLBACK_BANNERS = [imgSlide1, imgSlide2, imgSlide3, imgSlide4];

const normalizeList = (data) => (Array.isArray(data) ? data : []);

const formatDate = (raw) => {
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

const formatCurrency = (val) => {
  const num = Number(val);
  if (Number.isNaN(num)) return "—";
  return `${num.toLocaleString("vi-VN")}₫`;
};

const buildRegisterFormFromUser = (u) => ({
  fullName: `${u?.firstName || ""} ${u?.lastName || ""}`.trim(),
  username: u?.username || "",
  email: u?.email || "",
  phone: u?.phoneNumber || "",
  rankAtRegistration:
    u?.rank === null || u?.rank === undefined ? "" : String(u.rank),
  note: "",
});

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [topFeedbacks, setTopFeedbacks] = useState([]);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/home`);
        setUpcomingTournaments(normalizeList(res?.data?.upcomingTournaments));
        setTopPlayers(normalizeList(res?.data?.topPlayers));
        setTopFeedbacks(normalizeList(res?.data?.topFeedbacks));
        setLatestBlogs(normalizeList(res?.data?.latestBlogs));
      } catch (error) {
        console.error("Load home data failed:", error);
        setLatestBlogs([]);
      } finally {
        setLoadingHome(false);
      }
    };

    fetchHomeData();
  }, []);

  const seasonSlides = useMemo(() => {
    const fromTournament = upcomingTournaments.map((t, idx) => ({
      id: t.tournamentId || `banner-${idx}`,
      image:
        t.tournamentImage || FALLBACK_BANNERS[idx % FALLBACK_BANNERS.length],
      title: t.tournamentName || "Upcoming Tournament",
      subtitle: `${t.location || "Online"} • ${formatDate(t.startDate)}`,
      format: t.format || "—",
      minPlayer: t.minPlayer,
      maxPlayer: t.maxPlayer,
      prizePool: t.prizePool,
      registrationDeadline: t.registrationDeadline,
      tournamentId: t.tournamentId,
      cta: () => navigate("/tournaments"),
    }));

    while (fromTournament.length < 4) {
      const idx = fromTournament.length;
      fromTournament.push({
        id: `fallback-${idx}`,
        image: FALLBACK_BANNERS[idx % FALLBACK_BANNERS.length],
        title: `Tournament Banner ${idx + 1}`,
        subtitle: "Upload tournament banner from leader dashboard",
        format: "—",
        minPlayer: "—",
        maxPlayer: "—",
        prizePool: null,
        registrationDeadline: null,
        tournamentId: null,
        cta: () => navigate("/tournaments"),
      });
    }
    return fromTournament.slice(0, 4);
  }, [navigate, upcomingTournaments]);

  // Không cho phép tự nhảy banner - chỉ chuyển khi user bấm mũi tên hoặc dot

  const activeSlide = seasonSlides[slideIndex] || seasonSlides[0];

  const handleRegisterFromBanner = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!activeSlide?.tournamentId) {
      navigate("/tournaments/public");
      return;
    }
    navigate(`/tournaments/public/${activeSlide.tournamentId}?openRegister=1`);
  };

  const handleOpenTournamentModal = () => {
    if (!activeSlide?.tournamentId) {
      navigate("/tournaments/public");
      return;
    }
    navigate(`/tournaments/public/${activeSlide.tournamentId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const menuItems = [
    { to: "/home", label: "Home" },
    { sectionId: "hpv-feedback", label: "Feedback" },
    { to: "/tournaments/public", label: "Tournaments" },
  ];

  return (
    <div id="home-page" className="hpv-page">
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
        menuItems={menuItems}
      />

      <section className="hpv-hero">
        <img src={imgHero} alt="Chess hero" className="hpv-hero-bg" />
        <div className="hpv-hero-overlay" />
        <div className="hpv-container hpv-hero-content">
          <p className="hpv-tag">CHESS TOURNAMENT PLATFORM</p>
          <h1>
            MASTER THE BOARD
            <br />
            CLAIM THE PRIZE
          </h1>
          <p>
            Thi đấu chiến thuật, theo dõi lịch đấu thông minh và chinh phục giải
            thưởng lớn.
          </p>
          <div className="hpv-hero-actions">
            <button
              className="hpv-btn hpv-btn-primary"
              onClick={() => navigate("/tournaments/public")}
            >
              Explore Tournaments
            </button>
            <button
              className="hpv-btn hpv-btn-outline"
              onClick={() =>
                document
                  .getElementById("hpv-season")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View Season <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section id="hpv-season" className="hpv-section">
        <div className="hpv-container">
          <div className="hpv-section-head">
            <h2>TOURNAMENT</h2>
            <p>
              Banner giải đấu được tải trực tiếp từ tournament và hiển thị dạng
              slide 4 banner.
            </p>
          </div>

          <div className="hpv-season-slider">
            <img
              src={activeSlide?.image || imgSlide1}
              alt={activeSlide?.title}
              className="hpv-season-image"
            />
            <div className="hpv-season-overlay" />
            <div className="hpv-season-content">
              <h3>{activeSlide?.title}</h3>
              <p>{activeSlide?.subtitle}</p>
              <div className="hpv-season-actions">
                <button
                  className="hpv-btn hpv-btn-primary"
                  onClick={handleOpenTournamentModal}
                >
                  Xem chi tiết giải
                </button>
                <button
                  className="hpv-btn hpv-btn-outline"
                  onClick={handleRegisterFromBanner}
                >
                  Đăng ký giải
                </button>
              </div>
            </div>

            <button
              className="hpv-slider-arrow left"
              onClick={() =>
                setSlideIndex(
                  (prev) =>
                    (prev - 1 + seasonSlides.length) % seasonSlides.length,
                )
              }
              aria-label="Previous banner"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="hpv-slider-arrow right"
              onClick={() =>
                setSlideIndex((prev) => (prev + 1) % seasonSlides.length)
              }
              aria-label="Next banner"
            >
              <ChevronRight size={20} />
            </button>

            <div className="hpv-slider-dots">
              {seasonSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  className={`hpv-dot ${idx === slideIndex ? "active" : ""}`}
                  onClick={() => setSlideIndex(idx)}
                  aria-label={`Go to banner ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="hpv-tournament-detail">
            <div className="hpv-detail-item">
              <span className="label">Thể thức</span>
              <strong>{activeSlide?.format || "—"}</strong>
            </div>
            <div className="hpv-detail-item">
              <span className="label">Số người chơi</span>
              <strong>
                {activeSlide?.minPlayer ?? "—"} -{" "}
                {activeSlide?.maxPlayer ?? "—"}
              </strong>
            </div>
            <div className="hpv-detail-item">
              <span className="label">Quỹ thưởng</span>
              <strong>{formatCurrency(activeSlide?.prizePool)}</strong>
            </div>
            <div className="hpv-detail-item">
              <span className="label">Hạn đăng ký</span>
              <strong>{formatDate(activeSlide?.registrationDeadline)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section id="hpv-latest" className="hpv-section hpv-light">
        <div className="hpv-container">
          <div className="hpv-section-head hpv-row-head">
            <h2>THE LATEST</h2>
            <button className="hpv-link-btn" onClick={() => navigate("/blog")}>
              GO TO BLOG PAGE
            </button>
          </div>

          <div className="hpv-latest-grid">
            {loadingHome ? (
              <div className="hpv-empty-card">Đang tải bài viết mới...</div>
            ) : latestBlogs.length > 0 ? (
              latestBlogs.map((blog, idx) => (
                <article
                  key={blog.blogPostId || `blog-${idx}`}
                  className="hpv-latest-card"
                >
                  <img
                    src={
                      blog.thumbnailUrl ||
                      FALLBACK_BANNERS[idx % FALLBACK_BANNERS.length]
                    }
                    alt={blog.title}
                  />
                  <div className="hpv-latest-body">
                    <div className="hpv-meta-line">
                      <span>{String(blog.categories || "NEWS")}</span>
                      <span>{formatDate(blog.publishAt || blog.createAt)}</span>
                    </div>
                    <h3>{blog.title}</h3>
                    <p>{blog.summary || "No summary provided."}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="hpv-empty-card">Chưa có blog public.</div>
            )}
          </div>
        </div>
      </section>

      <section id="hpv-players" className="hpv-section">
        <div className="hpv-container hpv-split-layout">
          <div>
            <h2>TOP PLAYERS</h2>
            <p>
              Theo dõi những kỳ thủ có thứ hạng cao và hoạt động mạnh nhất trên
              hệ thống. Dữ liệu được đồng bộ realtime từ bảng xếp hạng.
            </p>
            <button
              className="hpv-btn hpv-btn-primary"
              onClick={() => navigate("/player/tournaments")}
            >
              Join Tournament
            </button>
          </div>
          <div className="hpv-player-list">
            {loadingHome ? (
              <div className="hpv-empty-card">Đang tải top player...</div>
            ) : normalizeList(topPlayers).length > 0 ? (
              normalizeList(topPlayers)
                .slice(0, 5)
                .map((p, idx) => (
                  <div key={p.userId || `p-${idx}`} className="hpv-player-item">
                    <span className="hpv-player-rank">#{idx + 1}</span>
                    <div className="hpv-player-avatar">
                      <img
                        src={
                          p.avatar ||
                          FALLBACK_BANNERS[idx % FALLBACK_BANNERS.length]
                        }
                        alt={p.firstName}
                      />
                    </div>
                    <div>
                      <h4>
                        {`${p.firstName || ""} ${p.lastName || ""}`.trim() ||
                          "Unknown player"}
                      </h4>
                      <p>Rank: {p.rank ?? "—"}</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="hpv-empty-note">Chưa có dữ liệu top players.</div>
            )}
          </div>
        </div>
      </section>

      <section id="hpv-feedback" className="hpv-section hpv-dark">
        <div className="hpv-container">
          <div className="hpv-section-head">
            <h2>COMMUNITY FEEDBACK</h2>
            <p>
              Chia sẻ của người chơi về trải nghiệm thi đấu và quản lý giải trên
              nền tảng.
            </p>
          </div>
          <div className="hpv-feedback-grid">
            {normalizeList(topFeedbacks).length > 0 ? (
              normalizeList(topFeedbacks)
                .slice(0, 3)
                .map((fb, idx) => (
                  <div
                    key={fb.feedbackId || `fb-${idx}`}
                    className="hpv-feedback-card"
                  >
                    <div className="hpv-feedback-stars">
                      {Array.from({ length: 5 }).map((_, sIdx) => (
                        <Star
                          key={`${idx}-${sIdx}`}
                          size={14}
                          fill={
                            sIdx < (fb.starRating || 0) ? "#ff4655" : "none"
                          }
                          color={
                            sIdx < (fb.starRating || 0) ? "#ff4655" : "#475569"
                          }
                        />
                      ))}
                    </div>
                    <p>{fb.comment || "Great tournament experience!"}</p>
                    <span>
                      {`${fb.firstName || ""} ${fb.lastName || ""}`.trim() ||
                        "User"}
                    </span>
                  </div>
                ))
            ) : (
              <div className="hpv-empty-note hpv-empty-note-dark">
                Chưa có phản hồi cộng đồng.
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="hpv-footer">
        <div className="hpv-container hpv-footer-inner">
          <div>
            <h4>CHESS ARENA</h4>
            <p>Tournament management platform</p>
          </div>
          <div className="hpv-footer-nav">
            <button onClick={() => navigate("/tournaments")}>
              <Trophy size={14} /> Tournaments
            </button>
            <button onClick={() => navigate("/player/tournaments")}>
              <Users size={14} /> Join
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("hpv-latest")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Clock3 size={14} /> Latest
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("hpv-feedback")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Calendar size={14} /> Feedback
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
