import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Trophy, PlusCircle, FileText } from "lucide-react";
import "../../assets/css/admin.css";
import { ICONS } from "../../constants";
import { useAuth } from "../../component/common/AuthContext";

import { API_BASE } from "../../config/api";

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  {
    id: "tournament-list",
    label: "Danh sách giải đấu",
    icon: <Trophy size={18} />,
    path: "/tournaments",
  },
  {
    id: "create-tournament",
    label: "Tạo giải đấu",
    icon: <PlusCircle size={18} />,
    path: "/tournaments/create",
  },
  { id: "reports", label: "Báo cáo", icon: <FileText size={18} /> },
];

const getTabFromPath = (pathname) => {
  if (pathname === "/tournaments/create") return "create-tournament";
  if (pathname.startsWith("/tournaments")) return "tournament-list";
  return "dashboard";
};

const TournamentSlideBar = ({ activeTab, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const currentTab = useMemo(
    () => activeTab || getTabFromPath(location.pathname),
    [activeTab, location.pathname]
  );

  const handleMenuClick = (item) => {
    if (typeof onNavigate === "function") {
      onNavigate(item.id);
    }

    if (item.path && location.pathname !== item.path) {
      navigate(item.path);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      if (typeof auth?.logout === "function") {
        auth.logout();
      } else {
        localStorage.removeItem("auth_data");
      }
      navigate("/home", { replace: true });
    }
  };

  return (
    <aside className="sidebar tll-sidebar">
      <div className="sidebarSection">Menu chính</div>

      <nav className="sidebarNav">
        {MENU_ITEMS.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleMenuClick(item)}
              className={`navItem ${isActive ? "navItemActive" : ""}`}
            >
              <span className="navItemIcon">{item.icon}</span>
              <span className="navItemLabel">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebarBottom">
        <button
          type="button"
          className="sidebarAction sidebarLogout"
          onClick={handleLogout}
        >
          <span className="navItemIcon">{ICONS.Logout}</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default TournamentSlideBar;
