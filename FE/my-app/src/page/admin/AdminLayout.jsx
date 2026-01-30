import React, { useMemo, useState } from "react";
import Dashboard from "../../component/Dashboard";
import Slidebar from "../../component/Slidebar";
import Header from "../../component/Header";
import { NAVIGATION_ITEMS } from "../../constants";

export const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const activeLabel = useMemo(() => {
    const item = NAVIGATION_ITEMS.find((x) => x.id === activeTab);
    return item?.label || "Bảng điều khiển";
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="adminShell">
      <Slidebar activeTab={activeTab} onNavigate={setActiveTab} />

      <div className="mainCol">
        <Header title={activeLabel} />
        <main className="mainContent">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
