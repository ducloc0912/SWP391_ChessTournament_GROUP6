import React from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Bell,
  Crown,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import axios from "axios";
import "./MainHeader.css";
import { API_BASE } from "../../config/api";

function toMillis(value) {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function shortenText(text, max = 80) {
  const raw = String(text || "").trim();
  if (!raw) {
    return "Bạn có một thông báo mới.";
  }
  return raw.length > max ? `${raw.slice(0, max)}…` : raw;
}

function typeLabel(type) {
  switch (type) {
    case "TechnicalIssue":
      return "Lỗi kỹ thuật";
    case "Other":
      return "Khác";
    case "Report":
      return "Thông báo report";
    case "TournamentRequest":
      return "Yêu cầu tạo giải";
    case "TournamentCancel":
      return "Hủy giải đấu";
    case "TournamentApproval":
      return "Duyệt giải đấu";
    case "PlayerRegistered":
      return "Người chơi đăng ký";
    case "PlayerBanned":
      return "Bị loại khỏi giải";
    default:
      return type || "Thông báo";
  }
}

function getNotificationSeenKey(user, role) {
  const userId = user?.userId || user?.id || "guest";
  const normalizedRole = String(role || "").trim().toUpperCase() || "USER";
  return `notifications_last_seen_${normalizedRole}_${userId}`;
}

function getLastSeenTime(user, role) {
  try {
    const key = getNotificationSeenKey(user, role);
    const raw = localStorage.getItem(key);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function setLastSeenTime(user, role, value) {
  try {
    const key = getNotificationSeenKey(user, role);
    localStorage.setItem(key, String(value || 0));
  } catch {
    // ignore
  }
}

function ImageWithFallback({
  src,
  alt = "",
  className = "",
  fallback = "https://ui-avatars.com/api/?name=User&background=random",
}) {
  const [imgSrc, setImgSrc] = React.useState(src);

  React.useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <img
      src={imgSrc || fallback}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback)}
    />
  );
}

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
  const [loadingNotif, setLoadingNotif] = React.useState(false);

  const role = React.useMemo(() => {
    try {
      return localStorage.getItem("role") || "";
    } catch {
      return "";
    }
  }, []);

  const [lastSeenAt, setLastSeenAt] = React.useState(() =>
    getLastSeenTime(user, role),
  );

  React.useEffect(() => {
    setLastSeenAt(getLastSeenTime(user, role));
  }, [user, role]);

  const notifRef = React.useRef(null);

  const defaultMenuItems = [
    { to: "/home", label: "Home" },
    { to: "/tournaments", label: "Tournaments" },
    { to: "/blog", label: "Blog" },
  ];

  const navItems =
    menuItems && menuItems.length > 0 ? menuItems : defaultMenuItems;

  const isActive = (path) => {
    if (path === "/home") {
      return currentPath === "/" || currentPath === "/home";
    }
    return currentPath.startsWith(path);
  };

  const initials = user
    ? [user.firstName, user.lastName]
        .filter(Boolean)
        .map((s) => (s || "").charAt(0))
        .join("")
        .toUpperCase() || "US"
    : "US";

  const avatarUrl = user?.avatar;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials,
  )}&background=6366f1&color=fff&size=64`;

  const normalizedRole = React.useMemo(() => {
    return String(role || "")
      .toUpperCase()
      .replace(/[\s_]/g, "");
  }, [role]);

  const latestNotificationTime = React.useMemo(() => {
    return notifications.reduce((max, item) => {
      const t = toMillis(item?.createdAt);
      return t > max ? t : max;
    }, 0);
  }, [notifications]);

  const hasUnreadNotifications =
    notifications.length > 0 && latestNotificationTime > lastSeenAt;

  const markNotificationsAsSeen = React.useCallback(
    (timeValue) => {
      const seenTime = timeValue || latestNotificationTime;
      if (seenTime > 0) {
        setLastSeenTime(user, role, seenTime);
        setLastSeenAt(seenTime);
      }
    },
    [latestNotificationTime, role, user],
  );

  const loadNotifications = React.useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return [];
    }

    try {
      setLoadingNotif(true);

      let normalized = [];

      if (normalizedRole === "STAFF") {
        const [reportsResult, notifResult] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/staff/reports?status=Pending`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/api/notifications?onlyUnread=false`, {
            withCredentials: true,
          }),
        ]);

        const reports = Array.isArray(reportsResult.value?.data)
          ? reportsResult.value.data
          : [];
        const notifs = Array.isArray(notifResult.value?.data)
          ? notifResult.value.data
          : [];

        const normalizedReports = reports.map((item) => ({
          id: `report-${item.reportId}`,
          title: `Report #${item.reportId} • ${typeLabel(item.type)}`,
          message: item.description || "Có report mới cần xử lý.",
          createdAt: item.createAt,
          actionUrl: "/staff/reports",
        }));

        const normalizedNotifs = notifs.map((item) => ({
          id: item.notificationId || item.id,
          title: item.title || "Thông báo mới",
          message:
            item.message || item.description || "Bạn có một thông báo mới.",
          createdAt: item.createAt || item.createdAt || item.created_date,
          actionUrl: item.actionUrl || "/staff/dashboard",
        }));

        normalized = [...normalizedReports, ...normalizedNotifs];
      } else {
        const res = await axios.get(
          `${API_BASE}/api/notifications?onlyUnread=false`,
          { withCredentials: true },
        );
        const data = Array.isArray(res?.data) ? res.data : [];
        normalized = data.map((item) => ({
          id: item.notificationId || item.id,
          title: item.title || "Thông báo mới",
          message:
            item.message || item.description || "Bạn có một thông báo mới.",
          createdAt: item.createAt || item.createdAt || item.created_date,
          actionUrl: item.actionUrl || null,
        }));
      }

      const sorted = [...normalized].sort((a, b) => {
        return toMillis(b?.createdAt) - toMillis(a?.createdAt);
      });

      const topItems = sorted.slice(0, 6);
      setNotifications(topItems);
      return topItems;
    } catch {
      setNotifications([]);
      return [];
    } finally {
      setLoadingNotif(false);
    }
  }, [normalizedRole, user]);

  React.useEffect(() => {
    loadNotifications();

    if (!user) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadNotifications, user]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleNotifications = async () => {
    if (notifOpen) {
      setNotifOpen(false);
      return;
    }

    const loaded = await loadNotifications();

    const newestTime = loaded.reduce((max, item) => {
      const t = toMillis(item?.createdAt);
      return t > max ? t : max;
    }, 0);

    setNotifOpen(true);
    markNotificationsAsSeen(newestTime);
  };

  const handleClickNotificationItem = (item) => {
    const itemTime = toMillis(item?.createdAt);
    markNotificationsAsSeen(itemTime);
    setNotifOpen(false);

    if (item?.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.post(`${API_BASE}/api/notifications?action=markRead`, {
        notificationId: id
      }, { withCredentials: true });
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Mark as read failed:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(`${API_BASE}/api/notifications?action=markAllRead`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Mark all as read failed:", err);
    }
  };

  const handleMenuAction = (item) => {
    if (item.to) {
      navigate(item.to);
      setMobileOpen(false);
      return;
    }

    if (item.sectionId) {
      const el = document.getElementById(item.sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setMobileOpen(false);
    }
  };

  let extraItems = [];

  try {
    if (normalizedRole === "REFEREE") {
      extraItems.push(
        { to: "/referee/invitations", label: "Invitations" },
        { to: "/referee/matches", label: "Matches" },
      );
    }

    if (normalizedRole === "PLAYER") {
      extraItems.push({ to: "/player/matches", label: "View Matches Schedule" });
    }

    if (normalizedRole === "STAFF") {
      extraItems.push({ to: "/staff/reports", label: "Report" });
    } else if (normalizedRole !== "ADMIN") {
      // Không thêm Report cho Admin vì đã có trong menu riêng
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
  }, [extraItems, navItems]);

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
              {sidebarOpen ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </button>
          )}

          <div
            className="logo-wrapper"
            onClick={() => navigate("/home")}
            style={{ cursor: "pointer" }}
          >
            <div className="logo-icon">
              <Crown size={16} strokeWidth={2.5} />
            </div>
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
                    className={`nav-link ${
                      isActive(item.to) ? "nav-link-active" : ""
                    }`}
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
                  let dashboardPath = null;

                  if (normalizedRole === "ADMIN") {
                    dashboardPath = "/admin/dashboard";
                  }
                  if (normalizedRole === "STAFF") {
                    dashboardPath = "/staff/dashboard";
                  }
                  if (normalizedRole === "TOURNAMENTLEADER") {
                    dashboardPath = "/leader/tournaments";
                  }

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

                <div className="notification-wrapper" ref={notifRef}>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Thông báo"
                    onClick={handleToggleNotifications}
                  >
                    <Bell size={18} />
                    {hasUnreadNotifications && (
                      <span className="notification-dot" />
                    )}
                  </button>

                  {notifOpen && (
                    <div className="notification-dropdown">
                      <div className="notification-dropdown-title">
                        {normalizedRole === "STAFF"
                          ? "Thông báo"
                          : normalizedRole === "TOURNAMENTLEADER"
                            ? "Thông báo giải đấu"
                            : "Thông báo"}
                      </div>

                      {loadingNotif ? (
                        <div className="notification-empty">
                          Đang tải thông báo...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="notification-empty">
                          Không có thông báo.
                        </div>
                      ) : (
                        <ul className="notification-list">
                          {notifications.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                className="notification-item-btn"
                                onClick={() => handleClickNotificationItem(item)}
                              >
                                <div className="notification-title">
                                  {item.title}
                                </div>

                                <div className="notification-message">
                                  {shortenText(item.message, 120)}
                                </div>

                                <div className="notification-time">
                                  {item.createdAt
                                    ? new Date(item.createdAt).toLocaleString(
                                        "vi-VN",
                                      )
                                    : ""}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="notification-footer" style={{ textAlign: 'center', padding: '10px', borderTop: '1px solid #334155' }}>
                         <button type="button" style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }} onClick={() => navigate('/notifications')}>
                           Xem tất cả
                         </button>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className="user-dropdown"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    title="Ví của tôi"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "14px",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                    onClick={() => navigate("/wallet")}
                  >
                    💳 {user.balance ? user.balance.toLocaleString() : "0"}đ
                  </div>

                  <span
                    style={{
                      color: "white",
                      fontWeight: "600",
                      fontSize: "14px",
                      marginLeft: "4px",
                    }}
                  >
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

                  <button
                    type="button"
                    className="icon-btn"
                    onClick={onLogout}
                    title="Logout"
                  >
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
                    className={`mobile-nav-link ${
                      isActive(item.to) ? "active" : ""
                    }`}
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