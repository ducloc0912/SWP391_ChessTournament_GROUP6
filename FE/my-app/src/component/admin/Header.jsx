import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, MessageSquare } from "lucide-react";
import chessLogin from "../../assets/img/avartaAdmin.jpg";
import { API_BASE } from "../../config/api";

const REPORT_SEEN_KEY = "admin_reports_last_seen_at";

function getAuthUserFromLocalStorage() {
  try {
    const raw = localStorage.getItem("auth_data");
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed?.user) return parsed.user;
    return parsed;
  } catch {
    return null;
  }
}

function buildDisplayName(user) {
  if (!user) return "Người dùng";

  const firstName = String(user.firstName || "").trim();
  const lastName = String(user.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) return fullName;
  if (user.username) return user.username;
  if (user.email) return user.email;

  return "Người dùng";
}

function buildRoleName(user) {
  const rawRole =
    user?.roleName ||
    user?.role ||
    localStorage.getItem("role") ||
    "";

  const normalized = String(rawRole).trim().toLowerCase();

  if (normalized === "admin") return "QUẢN TRỊ VIÊN";
  if (normalized === "staff") return "NHÂN VIÊN";
  if (normalized === "tournamentleader") return "TRƯỞNG GIẢI";
  if (normalized === "referee") return "TRỌNG TÀI";
  if (normalized === "player") return "NGƯỜI CHƠI";

  return "QUẢN LÝ HỆ THỐNG";
}

function shortenText(text, max = 70) {
  const raw = String(text || "").trim();
  if (!raw) return "Có report mới cần xem.";
  return raw.length > max ? `${raw.slice(0, max)}…` : raw;
}

function typeLabel(type) {
  if (type === "TechnicalIssue") return "Lỗi kỹ thuật";
  if (type === "Other") return "Khác";
  return type || "Report";
}

function toMillis(value) {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getLastSeenTime() {
  try {
    const raw = localStorage.getItem(REPORT_SEEN_KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function setLastSeenTime(value) {
  try {
    localStorage.setItem(REPORT_SEEN_KEY, String(value || 0));
  } catch {
    // ignore
  }
}

export const Header = ({ title, user: userProp, onOpenReports }) => {
  const currentUser = useMemo(() => {
    return userProp || getAuthUserFromLocalStorage();
  }, [userProp]);

  const displayName = useMemo(() => buildDisplayName(currentUser), [currentUser]);
  const displayRole = useMemo(() => buildRoleName(currentUser), [currentUser]);
  const avatarSrc = currentUser?.avatar || chessLogin;

  const [reportNotifications, setReportNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState(getLastSeenTime());

  const notifRef = useRef(null);

  const latestReportTime = useMemo(() => {
    return reportNotifications.reduce((max, item) => {
      const t = toMillis(item?.createAt);
      return t > max ? t : max;
    }, 0);
  }, [reportNotifications]);

  const hasUnreadNotifications =
    reportNotifications.length > 0 && latestReportTime > lastSeenAt;

  const loadReportNotifications = async () => {
    try {
      setLoadingNotif(true);

      const res = await fetch(`${API_BASE}/api/admin/reports`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setReportNotifications([]);
        return;
      }

      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : [];

      const sorted = [...list].sort((a, b) => {
        const aTime = toMillis(a?.createAt);
        const bTime = toMillis(b?.createAt);
        return bTime - aTime;
      });

      setReportNotifications(sorted.slice(0, 6));
    } catch {
      setReportNotifications([]);
    } finally {
      setLoadingNotif(false);
    }
  };

  useEffect(() => {
    loadReportNotifications();
  }, []);

  useEffect(() => {
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

  const markNotificationsAsSeen = () => {
    if (latestReportTime > 0) {
      setLastSeenTime(latestReportTime);
      setLastSeenAt(latestReportTime);
    }
  };

  const handleToggleNotifications = async () => {
    const nextOpen = !notifOpen;
    setNotifOpen(nextOpen);

    if (nextOpen) {
      await loadReportNotifications();
      markNotificationsAsSeen();
    }
  };

  const handleClickNotificationItem = () => {
    markNotificationsAsSeen();
    setNotifOpen(false);

    if (typeof onOpenReports === "function") {
      onOpenReports();
    }
  };

  return (
    <>
      <style>{`
        .headerBarModern {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          min-height: 92px;
          padding: 18px 24px;
          margin-bottom: 18px;
          border-radius: 22px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.97),
            rgba(248, 250, 252, 0.94)
          );
          box-shadow:
            0 14px 32px rgba(15, 23, 42, 0.06),
            0 4px 12px rgba(15, 23, 42, 0.04);
          backdrop-filter: blur(12px);
        }

        .headerLeft {
          display: flex;
          align-items: center;
          min-width: 0;
          flex: 1;
        }

        .headerTitleBlock {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .headerMainTitle {
          margin: 0;
          color: #0f172a;
          font-size: 28px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .headerSubTitle {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.4;
        }

        .headerRight {
          margin-left: auto;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
          flex-shrink: 0;
        }

        .headerQuickActions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modernIconBtn {
          position: relative;
          width: 44px;
          height: 44px;
          border: none;
          outline: none;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.95);
          color: #0f172a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .modernIconBtn:hover {
          transform: translateY(-1px);
          background: #ffffff;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
        }

        .headerNotifyDot {
          position: absolute;
          top: 9px;
          right: 9px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 2px #ffffff;
        }

        .headerDivider {
          width: 1px;
          height: 36px;
          background: rgba(15, 23, 42, 0.08);
        }

        .modernProfileBtn {
          margin-left: auto;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          min-width: 250px;
          padding: 8px 10px 8px 14px;
          border: none;
          outline: none;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .modernProfileBtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
        }

        .profileText {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          gap: 3px;
          text-align: right;
          min-width: 0;
          flex: 1;
        }

        .profileName {
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profileRole {
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .modernAvatarWrap {
          position: relative;
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: block;
          object-fit: cover;
          border: 2px solid #ffffff;
        }

        .avatarOnline {
          position: absolute;
          right: 2px;
          bottom: 2px;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid #ffffff;
        }

        .headerNotifWrap {
          position: relative;
        }

        .headerNotifDropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 320px;
          max-height: 340px;
          overflow-y: auto;
          border-radius: 16px;
          background: rgba(255,255,255,0.98);
          box-shadow:
            0 20px 40px rgba(15,23,42,0.12),
            0 8px 18px rgba(15,23,42,0.08);
          padding: 10px;
          z-index: 100;
        }

        .headerNotifTitle {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          padding: 6px 8px 10px;
        }

        .headerNotifEmpty {
          font-size: 13px;
          color: #64748b;
          padding: 8px;
        }

        .headerNotifItem {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          text-align: left;
          padding: 10px 10px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .headerNotifItem:hover {
          background: rgba(59,130,246,0.08);
        }

        .headerNotifItemTitle {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .headerNotifItemDesc {
          font-size: 12px;
          color: #475569;
          line-height: 1.4;
        }

        .headerNotifItemTime {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        @media (max-width: 992px) {
          .headerBarModern {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .headerLeft {
            width: 100%;
          }

          .headerRight {
            width: 100%;
            justify-content: space-between;
            margin-left: 0;
          }

          .modernProfileBtn {
            margin-left: 0;
          }
        }

        @media (max-width: 640px) {
          .headerBarModern {
            padding: 16px;
            border-radius: 18px;
          }

          .headerMainTitle {
            font-size: 22px;
          }

          .headerSubTitle {
            font-size: 13px;
          }

          .headerRight {
            gap: 10px;
          }

          .headerDivider {
            display: none;
          }

          .modernProfileBtn {
            min-width: auto;
            padding: 6px;
            border-radius: 999px;
          }

          .profileText {
            display: none;
          }

          .modernAvatarWrap {
            width: 44px;
            height: 44px;
            min-width: 44px;
          }

          .headerNotifDropdown {
            width: 270px;
            right: -20px;
          }
        }
      `}</style>

      <header className="headerBar headerBarModern">
        <div className="headerLeft">
          <div className="headerTitleBlock">
            <h2 className="headerMainTitle">{title}</h2>
            <p className="headerSubTitle">Quản lý hệ thống Chess Tournament</p>
          </div>
        </div>

        <div className="headerRight">
          <div className="headerQuickActions">
            <button
              type="button"
              className="iconBtn modernIconBtn"
              aria-label="Messages"
            >
              <MessageSquare size={18} />
            </button>

            <div className="headerNotifWrap" ref={notifRef}>
              <button
                type="button"
                className="iconBtn modernIconBtn"
                aria-label="Notifications"
                onClick={handleToggleNotifications}
              >
                <Bell size={18} />
                {hasUnreadNotifications && <span className="headerNotifyDot" />}
              </button>

              {notifOpen && (
                <div className="headerNotifDropdown">
                  <div className="headerNotifTitle">Thông báo report</div>

                  {loadingNotif ? (
                    <div className="headerNotifEmpty">Đang tải thông báo...</div>
                  ) : reportNotifications.length === 0 ? (
                    <div className="headerNotifEmpty">Chưa có thông báo mới.</div>
                  ) : (
                    reportNotifications.map((item) => (
                      <button
                        key={item.reportId}
                        type="button"
                        className="headerNotifItem"
                        onClick={handleClickNotificationItem}
                      >
                        <div className="headerNotifItemTitle">
                          Report #{item.reportId} • {typeLabel(item.type)}
                        </div>
                        <div className="headerNotifItemDesc">
                          {shortenText(item.description)}
                        </div>
                        <div className="headerNotifItemTime">
                          {item.createAt
                            ? new Date(item.createAt).toLocaleString("vi-VN")
                            : ""}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="headerDivider" />

          <button type="button" className="profileBtn modernProfileBtn">
            <div className="profileText">
              <div className="profileName">{displayName}</div>
              <div className="profileRole">{displayRole}</div>
            </div>

            <div className="avatarWrap modernAvatarWrap">
              <img
                src={avatarSrc}
                alt="Avatar Admin"
                className="avatar"
                onError={(e) => {
                  e.currentTarget.src = chessLogin;
                }}
              />
              <span className="avatarOnline" />
            </div>
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;