import React, { useMemo, useState } from "react";
import MainHeader from "../../component/common/MainHeader";
import { useNavigate } from "react-router-dom";
import Dashboard from "../../component/admin/Dashboard";
import AccountListScreen from "../../component/admin/Accounlist";
import UserProfile from "../../component/admin/UserProfile";
import EditProfile from "../../component/admin/EditProfile";
import EditRole from "../../component/admin/EditRole";
import AdminSystemReports from "../../component/admin/AdminSystemReports";
import CreateAccount from "../../component/admin/CreateAccount";

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const activeLabel = useMemo(() => {
    if (activeTab === "user_profile") return "Thông tin tài khoản";
    if (activeTab === "edit_user") return "Sửa hồ sơ người dùng";
    if (activeTab === "edit_role") return "Phân quyền người dùng";
    if (activeTab === "reports") return "System Reports";
    if (activeTab === "create_account") return "Tạo người dùng";
    if (activeTab === "accounts") return "Quản lý tài khoản";
    return "Admin Dashboard";
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

  // Custom menu items với sectionId để trigger scroll/action
  const menuItems = [
    { to: "/home", label: "Home" },
    { sectionId: "accounts", label: "Accounts" },
    { sectionId: "create_account", label: "Create Account" },
    { sectionId: "reports", label: "Reports" },
  ];

  // Listen to section clicks
  React.useEffect(() => {
    const handleSectionClick = (sectionId) => {
      if (["accounts", "create_account", "reports"].includes(sectionId)) {
        setActiveTab(sectionId);
      }
    };

    // Override the scroll behavior for our sections
    const originalGetElementById = document.getElementById.bind(document);
    document.getElementById = (id) => {
      if (["accounts", "create_account", "reports"].includes(id)) {
        handleSectionClick(id);
        return null; // Prevent actual scroll
      }
      return originalGetElementById(id);
    };

    return () => {
      document.getElementById = originalGetElementById;
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath="/admin"
        menuItems={menuItems}
      />

      <div style={{ padding: "24px 32px" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid rgba(15,23,42,0.12)",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: 600 }}
          >
            {activeLabel}
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            {activeTab === "dashboard" && "Tổng quan hệ thống và thống kê"}
            {activeTab === "accounts" && "Quản lý người dùng trong hệ thống"}
            {activeTab === "create_account" && "Tạo tài khoản người dùng mới"}
            {activeTab === "reports"}
            {activeTab === "user_profile" &&
              "Xem thông tin chi tiết người dùng"}
            {activeTab === "edit_user" && "Chỉnh sửa thông tin người dùng"}
            {activeTab === "edit_role" && "Phân quyền và quản lý vai trò"}
          </p>
        </div>

        <div>{renderContent()}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
