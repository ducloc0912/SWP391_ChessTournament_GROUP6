import React from "react";
import { Bell, ChevronDown, Search } from "lucide-react";

const HeaderTournament = () => {
  return (
    <header className="tl-header">
      {/* Logo */}
      <div className="tl-header-logo">
        <div className="tl-logo-icon">
          <span>CT</span>
        </div>
        <div>
          <h1 className="tl-logo-title">CTMS</h1>
          <p className="tl-logo-sub">Tournament Leader</p>
        </div>
      </div>

      {/* Center title */}
      <div className="tl-header-title">
        <span className="tl-divider"></span>
        <h2>Tournament Dashboard</h2>
      </div>

      {/* Actions */}
      <div className="tl-header-actions">
        {/* Search */}
        <div className="tl-search-box">
          <Search size={18} />
          <input type="text" placeholder="Quick search..." />
        </div>

        {/* Notification */}
        <button className="tl-notification-btn">
          <Bell size={22} />
          <span className="tl-dot"></span>
        </button>

        {/* Profile */}
        <div className="tl-profile">
          <div className="tl-profile-text">
            <p className="tl-profile-name">Alex Kasparov</p>
            <p className="tl-profile-role">Senior Organizer</p>
          </div>

          <div className="tl-avatar">
            <img src="https://picsum.photos/100/100" alt="User" />
          </div>

          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
};

export default HeaderTournament;
