import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bell, Crown, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import axios from "axios";
import "./MainHeader.css";
import { API_BASE } from "../../config/api";

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
export default function MainHeader({
  user,
  onLogout,
  currentPath = "/",
  menuItems = null,
  onSidebarToggle,
  sidebarOpen = true,
}) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [notifOpen, setNotifOpen] = React.useState(false);

  const defaultMenuItems = [
    { to: "/home", label: "Home" },
    { to: "/tournaments", label: "Tournaments" },
    { to: "/blog", label: "Blog" },
  ];
  const navItems = menuItems && menuItems.length > 0 ? menuItems : defaultMenuItems;

  const isActive = (path) => {
    if (path === "/home") return currentPath === "/" || currentPath === "/home";
    return currentPath.startsWith(path);
  };

  const initials = user
    ? [user.firstName, user.lastName].filter(Boolean).map((s) => (s || "").charAt(0)).join("").toUpperCase() || "US"
    : "US";

  const avatarUrl = user?.avatar;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=64`;

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => n && n.isRead === false).length,
    [notifications],
  );

  React.useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      if (!user) {
        setNotifications([]);
        return;
      }
      try {
        const res = await axios
          .get(`${API_BASE}/api/notifications?onlyUnread=false`, {
            withCredentials: true,
          })
          .catch(() => null);
        if (!cancelled) {
          setNotifications(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) {
          setNotifications([]);
        }
      }
    };
    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleMenuAction = (item) => {
    if (item.to) {
      navigate(item.to);
      setMobileOpen(false);
      return;
    }
    if (item.sectionId) {
      const el = document.getElementById(item.sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileOpen(false);
    }
  };

  let extraItems = [];
  try {
    const rawRole = localStorage.getItem("role");
    const normalizedRole = (rawRole || "").toString().toUpperCase().replace(/[\s_]/g, "");

    // Link riêng cho referee
    if (normalizedRole === "REFEREE") {
      extraItems.push({ to: "/referee/invitations", label: "Invitations" });
    }

    // Nút Report trên header:
    // - STAFF: dẫn tới trang xử lý system report
    // - Các role còn lại: dẫn tới trang user gửi/lịch sử report
    if (normalizedRole === "STAFF") {
      extraItems.push({ to: "/staff/reports", label: "Report" });
    } else {
      extraItems.push({ to: "/user/reports", label: "Report" });
    }
  } catch {
    extraItems = [{ to: "/user/reports", label: "Report" }];
  }

  const fullNavItems = React.useMemo(() => {
    const seen = new Set();
    const add = (list, acc) => {
      list.forEach((item) => {
        const key = item.to || item.sectionId || item.label;
        if (!key || seen.has(key)) return;
        seen.add(key);
        acc.push(item);
      });
    };
    const merged = [];
    add(navItems, merged);
    add(extraItems, merged);
    return merged;
  }, [navItems, extraItems]);

  return (
    <header className="header main-header">
      <div className="container">
        <div className="header-content">
          {typeof onSidebarToggle === "function" && (
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={onSidebarToggle}
              aria-label={sidebarOpen ? "Ẩn menu" : "Hiện menu"}
            >
              {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
          )}
          <div className="logo-wrapper" onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>
            <div className="logo-icon"><Crown size={16} strokeWidth={2.5} /></div>
            <div className="logo-text">
              <span className="logo-title">CHESS ARENA</span>
              <span className="logo-subtitle">TOURNAMENT PLATFORM</span>
            </div>
          </div>

          <nav className="nav">
            {fullNavItems.map((item, idx) => {
              const key = item.to || item.sectionId || `${item.label}-${idx}`;
              if (item.to) {
                return (
                  <Link
                    key={key}
                    to={item.to}
                    className={`nav-link ${isActive(item.to) ? "nav-link-active" : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  className="nav-link nav-link-button"
                  onClick={() => handleMenuAction(item)}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                {(() => {
                  // Đọc role lưu trong localStorage để hiện nút Dashboard cho các role có trang dashboard
                  let rawRole = null;
                  try {
                    rawRole = localStorage.getItem("role");
                  } catch {
                    rawRole = null;
                  }
                  const normalizedRole = (rawRole || "").toString().toUpperCase().replace(/[\s_]/g, "");
                  let dashboardPath = null;
                  if (normalizedRole === "ADMIN") dashboardPath = "/admin/dashboard";
                  if (normalizedRole === "STAFF") dashboardPath = "/staff/dashboard";
                  if (normalizedRole === "TOURNAMENTLEADER") dashboardPath = "/tournaments";
                  if (normalizedRole === "REFEREE") dashboardPath = "/home"; // TODO: nếu có dashboard riêng cho referee, đổi path tại đây

                  return dashboardPath ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ marginRight: 8 }}
                      onClick={() => navigate(dashboardPath)}
                    >
                      Dashboard
                    </button>
                  ) : null;
                })()}
                <div className="notification-wrapper">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Thông báo"
                    onClick={() => setNotifOpen((prev) => !prev)}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && <span className="notification-dot" />}
                  </button>
                  {notifOpen && (
                    <div className="notification-dropdown">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">Không có thông báo.</div>
                      ) : (
                        <ul className="notification-list">
                          {notifications.slice(0, 6).map((n) => (
                            <li
                              key={n.notificationId}
                              className={`notification-item ${n.isRead ? "read" : "unread"}`}
                              onClick={() => {
                                if (n.actionUrl) {
                                  navigate(n.actionUrl);
                                  setNotifOpen(false);
                                }
                              }}
                            >
                              <div className="notification-title">{n.title}</div>
                              {n.message && (
                                <div className="notification-message">
                                  {n.message.length > 80 ? `${n.message.slice(0, 80)}…` : n.message}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
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
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate("/register")}
                >
                  Play Now
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="mobile-nav">
            {fullNavItems.map((item, idx) => {
              const key = item.to || item.sectionId || `${item.label}-${idx}`;
              if (item.to) {
                return (
                  <Link
                    key={key}
                    to={item.to}
                    className={`mobile-nav-link ${isActive(item.to) ? "active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  className="mobile-nav-link"
                  onClick={() => handleMenuAction(item)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
