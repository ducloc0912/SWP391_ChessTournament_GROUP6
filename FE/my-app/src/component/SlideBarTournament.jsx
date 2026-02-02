import React from "react";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Scale,
  GitBranch,
  FileBarChart,
  List,
  PlusCircle,
  ChevronRight
} from "lucide-react";

/* ICON MAP */
const ICONS = {
  LayoutDashboard,
  Trophy,
  Users,
  Scale,
  GitBranch,
  FileBarChart,
  List,
  PlusCircle
};

/* NAV DATA */
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    isActive: true
  },
  {
    id: "tournaments",
    label: "Tournaments",
    icon: "Trophy",
    subItems: [
      { id: "list", label: "Tournament List", icon: "List" },
      { id: "create", label: "Create Tournament", icon: "PlusCircle" }
    ]
  },
  { id: "players", label: "Players", icon: "Users" },
  { id: "rules", label: "Rules", icon: "Scale" },
  { id: "pairing", label: "Pairings", icon: "GitBranch" },
  { id: "reports", label: "Reports", icon: "FileBarChart" }
];

const SlideBarTournament = () => {
  const renderNavItem = (item, isSub = false) => {
    const Icon = ICONS[item.icon];

    return (
      <div key={item.id}>
        <div
          className={
            "tl-nav-item " +
            (item.isActive ? "active " : "") +
            (isSub ? "sub " : "")
          }
        >
          {item.isActive && <span className="tl-active-bar" />}
          {Icon && <Icon size={isSub ? 18 : 20} />}
          <span>{item.label}</span>
          {item.subItems && <ChevronRight size={16} />}
        </div>

        {item.subItems && (
          <div className="tl-sub-menu">
            {item.subItems.map(sub => renderNavItem(sub, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="tl-sidebar">
      <div className="tl-sidebar-spacer" />

      <div className="tl-sidebar-content">
        <p className="tl-menu-title">Main Menu</p>
        <nav>{NAV_ITEMS.map(renderNavItem)}</nav>
      </div>

      <div className="tl-upgrade-box">
        <h4>Premium Plan</h4>
        <p>Unlock advanced analytics for tournaments</p>
        <button>Upgrade Now</button>
      </div>
    </aside>
  );
};

export default SlideBarTournament;
