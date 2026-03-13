import React, { useState } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import TournamentSlideBar from "./TournamentSlidebar";
import TournamentList from "./TournamentList";
import TournamentDashboard from "./TournamentDashboard";
import "../../assets/css/admin.css";
import "../../assets/css/tournament-leader/TournamentLeaderLayout.css";

const CARD_STYLE = {
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.12)",
  padding: 24,
};

export default function TournamentLeaderLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSidebarNavigate = (tabId) => {
    if (tabId === "create-tournament") {
      navigate("/leader/tournaments/create");
      return;
    }
    setActiveTab(tabId);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "tournament-list") {
      setActiveTab("tournament-list");
      return;
    }
    if (tab === "dashboard") {
      setActiveTab("dashboard");
    }
  }, [location.search]);

  const renderContent = () => {
    switch (activeTab) {
      case "tournament-list":
        return <TournamentList hideHeader />;
      case "reports":
        return (
          <div style={CARD_STYLE} className="tll-card">
            <h2 style={{ marginTop: 0 }}>Báo cáo</h2>
            <p style={{ marginBottom: 0, color: "#64748b" }}>
              Chức năng báo cáo sẽ được triển khai ở bước tiếp theo.
            </p>
          </div>
        );
      case "dashboard":
      default:
        return <TournamentDashboard />;
    }
  };

  return (
    <div className="tll-page">
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath="/"
        menuItems={[
          { to: "/home", label: "Home" },
          { to: "/blog", label: "Blog" },
        ]}
        onSidebarToggle={handleSidebarToggle}
        sidebarOpen={sidebarOpen}
      />

      <div className="tll-shell">
        <div
          className={`tll-sidebar-wrap ${!sidebarOpen ? "collapsed" : ""}`}
          style={{ width: sidebarOpen ? 260 : 0 }}
        >
          <TournamentSlideBar
            activeTab={activeTab}
            onNavigate={handleSidebarNavigate}
          />
        </div>
        <main className="tll-main">{renderContent()}</main>
      </div>
    </div>
  );
}
