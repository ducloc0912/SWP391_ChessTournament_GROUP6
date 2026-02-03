import React, { useMemo, useState } from "react";
import Dashboard from "../../component/admin/Dashboard";
import Slidebar from "../../component/admin/Slidebar";
import Header from "../../component/admin/Header";
import { NAVIGATION_ITEMS } from "../../constants";
import AccountListScreen from "../../component/admin/Accounlist";
import UserProfile from "../../component/admin/UserProfile"; // ✅ thêm

export const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // ✅ lưu userId khi bấm View
  const [selectedUserId, setSelectedUserId] = useState(null);

  const activeLabel = useMemo(() => {
    // nếu đang ở user_profile thì set title riêng
    if (activeTab === "user_profile") return "Thông tin tài khoản";

    const item = NAVIGATION_ITEMS.find((x) => x.id === activeTab);
    return item?.label || "Bảng điều khiển";
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;

      case "accounts":
        return (
          <AccountListScreen
            onViewAccount={(userId) => {
              setSelectedUserId(userId);
              setActiveTab("user_profile");
            }}
          />
        );

      case "user_profile":
        return (
          <UserProfile
            userId={selectedUserId}
            onBack={() => setActiveTab("accounts")}
          />
        );

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
