import React from "react";
import { useNavigate } from "react-router-dom";
import chessForgot from "../../assets/img/logo.jpg";
import { NAVIGATION_ITEMS, ICONS, BRAND } from "../../constants";
import { useAuth } from "../common/AuthContext";
import { API_BASE } from "../../config/api";

export const Slidebar = ({ activeTab, onNavigate }) => {
  const navigate = useNavigate();

  const auth = useAuth();
  const logoutLocal = auth?.logout;

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (e) {
      console.error("Logout request failed:", e);
    } finally {
      if (typeof logoutLocal === "function") {
        logoutLocal();
      } else {
        localStorage.removeItem("auth_data");
      }

      navigate("/home", { replace: true });
    }
  };

  const isCreateUserMenu = (item) => {
    const id = String(item?.id || "")
      .trim()
      .toLowerCase();
    const label = String(item?.label || "")
      .trim()
      .toLowerCase();

    return (
      id === "create-user" ||
      id === "create_account" ||
      id === "create-account" ||
      id === "createaccount" ||
      label === "tạo người dùng" ||
      label === "tạo tài khoản"
    );
  };

  const isHiddenMenu = (item) => {
    const id = String(item?.id || "")
      .trim()
      .toLowerCase();
    const label = String(item?.label || "")
      .trim()
      .toLowerCase();

    return (
      label === "kết quả & xếp hạng" ||
      label === "tin tức & thông báo" ||
      id === "results" ||
      id === "rankings" ||
      id === "results-rankings" ||
      id === "result_rank" ||
      id === "news" ||
      id === "notifications" ||
      id === "news-notifications" ||
      id === "news_notification"
    );
  };

  const handleMenuClick = (item) => {
    if (isCreateUserMenu(item)) {
      if (typeof onNavigate === "function") {
        onNavigate("create_account");
      }
      return;
    }

    if (typeof onNavigate === "function") {
      onNavigate(item.id);
    }
  };

  const visibleNavigationItems = NAVIGATION_ITEMS.filter(
    (item) => !isHiddenMenu(item),
  );

  return (
    <aside className="sidebar">
      <div className="sidebarBrand">
        <div className="brandMark">
          <img src={chessForgot} alt="chessForgot" className="brandLogo" />
        </div>
        <div className="brandName" style={{ color: "#000000" }}>
          {BRAND.name}
        </div>
      </div>

      <div className="sidebarSection">Menu chính</div>

      <nav className="sidebarNav">
        {visibleNavigationItems.map((item) => {
          const isActive =
            activeTab === item.id ||
            (activeTab === "create_account" && isCreateUserMenu(item));

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

export default Slidebar;