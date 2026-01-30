import React from "react";

import {
  LayoutDashboard,
  Users,
  UserPlus2,
  BarChart3,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
  Search,
} from "lucide-react";

export const BRAND = {
  name: "Chess Tournament Champion",
};

export const ICONS = {
  Dashboard: <LayoutDashboard size={18} />,
  Accounts: <Users size={18} />,
  Create: <UserPlus2 size={18} />,
  Results: <BarChart3 size={18} />,
  Reports: <ClipboardList size={18} />,
  Notif: <Bell size={18} />,
  Settings: <Settings size={18} />,
  Logout: <LogOut size={18} />,
  Search: <Search size={18} />,
};

export const NAVIGATION_ITEMS = [
  { id: "dashboard", label: "Bảng điều khiển", icon: ICONS.Dashboard },
  { id: "accounts", label: "Danh sách tài khoản", icon: ICONS.Accounts },
  { id: "create-user", label: "Tạo người dùng", icon: ICONS.Create },
  { id: "results", label: "Kết quả & Xếp hạng", icon: ICONS.Results },
  { id: "reports", label: "Báo cáo", icon: ICONS.Reports },
  { id: "notif", label: "Tin tức & Thông báo", icon: ICONS.Notif },
];
