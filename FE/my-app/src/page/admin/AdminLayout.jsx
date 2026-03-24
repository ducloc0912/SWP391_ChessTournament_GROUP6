import React, { useMemo, useState } from "react";
import "../../assets/css/admin.css";
import Dashboard from "../../component/admin/Dashboard";
import Slidebar from "../../component/admin/Slidebar";
import Header from "../../component/admin/Header";
import { NAVIGATION_ITEMS } from "../../constants";
import AccountListScreen from "../../component/admin/Accounlist";
import UserProfile from "../../component/admin/UserProfile";
import EditProfile from "../../component/admin/EditProfile";
import EditRole from "../../component/admin/EditRole";
import AdminSystemReports from "../../component/admin/AdminSystemReports";
import CreateAccount from "../../component/admin/CreateAccount";

export const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const activeLabel = useMemo(() => {
    if (activeTab === "user_profile") return "Thông tin tài khoản";
    if (activeTab === "edit_user") return "Sửa hồ sơ người dùng";
    if (activeTab === "edit_role") return "Phân quyền người dùng";
    if (activeTab === "reports") return "System report (Admin)";
    if (activeTab === "create_account") return "Tạo người dùng";

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
            onEditAccount={(userId) => {
              setSelectedUserId(userId);
              setActiveTab("edit_user");
            }}
            onEditRole={(userId) => {
              setSelectedUserId(userId);
              setActiveTab("edit_role");
            }}
          />
        );

      case "create_account":
        return <CreateAccount onBack={() => setActiveTab("dashboard")} />;

      case "user_profile":
        return (
          <UserProfile
            userId={selectedUserId}
            onBack={() => setActiveTab("accounts")}
          />
        );

      case "edit_user":
        return (
          <EditProfile
            userId={selectedUserId}
            onBack={() => setActiveTab("accounts")}
          />
        );

      case "edit_role":
        return (
          <EditRole
            userId={selectedUserId}
            onBack={() => setActiveTab("accounts")}
          />
        );

      case "reports":
        return <AdminSystemReports />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="adminShell">
      <Slidebar activeTab={activeTab} onNavigate={setActiveTab} />

      <div className="mainCol">
        <Header
          title={activeLabel}
          onOpenReports={() => setActiveTab("reports")}
        />
        <main className="mainContent">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminLayout;