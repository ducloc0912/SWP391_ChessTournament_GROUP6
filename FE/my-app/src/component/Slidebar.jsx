import React from "react";
import logo from "../assets/img/logo.jpg";
import { NAVIGATION_ITEMS, ICONS, BRAND } from "../constants";

export const Slidebar = ({ activeTab, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="sidebarBrand">
        <div className="brandMark">
          <img src={logo} alt="Logo" className="brandLogo" />
        </div>
        <div className="brandName">{BRAND.name}</div>
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

        <button type="button" className="sidebarAction sidebarLogout">
          <span className="navItemIcon">{ICONS.Logout}</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Slidebar;
