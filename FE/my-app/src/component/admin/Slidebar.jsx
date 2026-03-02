import React from "react";
import { useNavigate } from "react-router-dom";
import chessForgot from "../../assets/img/logo.jpg";
import { NAVIGATION_ITEMS, ICONS, BRAND } from "../../constants";
import { useAuth } from "../common/AuthContext"; // đúng theo cây thư mục của bạn

const API_BASE = "http://localhost:8080/ctms";

export const Slidebar = ({ activeTab, onNavigate }) => {
  const navigate = useNavigate();

  // ✅ FIX: useAuth() có thể null nếu Slidebar chưa được bọc bởi <AuthProvider>
  const auth = useAuth();
  const logoutLocal = auth?.logout; // có thể undefined

  const handleLogout = async () => {
    try {
      // ✅ gọi BE để invalidate session
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // AuthServlet đọc body => gửi {} cho chắc
      });
    } catch (e) {
      console.error("Logout request failed:", e);
    } finally {
      // ✅ logout FE (nếu có AuthProvider)
      if (typeof logoutLocal === "function") {
        logoutLocal();
      } else {
        // ✅ fallback nếu không có Provider: tự clear localStorage
        localStorage.removeItem("auth_data");
      }

      // ✅ về homepage
      navigate("/home", { replace: true });
    }
  };

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
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`navItem ${isActive ? "navItemActive" : ""}`}
            >
              <span className="navItemIcon">{item.icon}</span>
              <span className="navItemLabel">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebarBottom">
        <button type="button" className="sidebarAction">
          <span className="navItemIcon">{ICONS.Settings}</span>
          <span>Cài đặt</span>
        </button>

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
