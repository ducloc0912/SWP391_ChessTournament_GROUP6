import React, { useState } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import TournamentSlideBar from "./TournamentSlideBar";
import TournamentList from "./TournamentList";
import TournamentDashboard from "./TournamentDashboard";
import "../../assets/css/admin.css";

const TAB_CONTENT_STYLE = {
  paddingTop: 72,
  minHeight: "100vh",
  background: "#f8fafc",
};

const SHELL_STYLE = {
  display: "flex",
  minHeight: "calc(100vh - 72px)",
};

const SIDEBAR_WRAP_STYLE = {
  position: "sticky",
  top: 72,
  alignSelf: "flex-start",
};

const MAIN_STYLE = {
  flex: 1,
  minWidth: 0,
  padding: "24px 28px",
};

const CARD_STYLE = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 24,
};

export default function TournamentLeaderLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

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

  const handleSidebarNavigate = (tabId) => {
    if (tabId === "create-tournament") {
      navigate("/tournaments/create");
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
          <div style={CARD_STYLE}>
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
    <div style={TAB_CONTENT_STYLE}>
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath="/"
        menuItems={[
          { to: "/home", label: "Home" },
          { to: "/blog", label: "Blog" },
        ]}
      />

      <div style={SHELL_STYLE}>
        <div style={SIDEBAR_WRAP_STYLE}>
          <TournamentSlideBar
            activeTab={activeTab}
            onNavigate={handleSidebarNavigate}
          />
        </div>
        <main style={MAIN_STYLE}>{renderContent()}</main>
      </div>
    </div>
  );
}
