import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bell, Crown, LogOut } from "lucide-react";
import "./MainHeader.css";

function ImageWithFallback({ src, alt = "", className = "", fallback = "https://ui-avatars.com/api/?name=User&background=random" }) {
  const [imgSrc, setImgSrc] = React.useState(src);
  return (
    <img
      src={imgSrc || fallback}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback)}
    />
  );
}

/**
 * Header dùng chung cho tất cả các trang (Home, Tournaments, Blog, Profile...).
 * - Logo bên trái, nav giữa, user actions bên phải.
 * - Icon profile: hình tròn, nhỏ (32px).
 */
export default function MainHeader({ user, onLogout, currentPath = "/" }) {
  const navigate = useNavigate();

  const navLinks = [
    { to: "/home", label: "Home" },
    { to: "/tournaments", label: "Tournaments" },
    { to: "/blog", label: "Blog" },
  ];

  const isActive = (path) => {
    if (path === "/home") return currentPath === "/" || currentPath === "/home";
    return currentPath.startsWith(path);
  };

  const initials = user
    ? [user.firstName, user.lastName].filter(Boolean).map((s) => (s || "").charAt(0)).join("").toUpperCase() || "US"
    : "US";

  const avatarUrl = user?.avatar;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=64`;

  return (
    <header className="header main-header">
      <div className="container">
        <div className="header-content">
          <div className="logo-wrapper" onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>
            <div className="logo-icon"><Crown size={16} strokeWidth={2.5} /></div>
            <div className="logo-text">
              <span className="logo-title">CHESS ARENA</span>
              <span className="logo-subtitle">TOURNAMENT PLATFORM</span>
            </div>
          </div>

          <nav className="nav">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link ${isActive(to) ? "nav-link-active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                <button type="button" className="icon-btn" aria-label="Thông báo">
                  <Bell size={18} />
                  <span className="notification-dot" />
                </button>
                <div className="user-dropdown" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>
                    Hi, {user.firstName}
                  </span>
                  <button
                    type="button"
                    className="user-btn user-btn--circle"
                    onClick={() => navigate("/profile")}
                    aria-label="Mở trang cá nhân"
                  >
                    <ImageWithFallback
                      src={avatarUrl}
                      alt={user.firstName}
                      className="user-avatar-img"
                      fallback={fallbackAvatar}
                    />
                  </button>
                  <button type="button" className="icon-btn" onClick={onLogout} title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate("/register")}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
