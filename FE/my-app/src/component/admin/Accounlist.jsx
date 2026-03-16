import React, { useEffect, useMemo, useState } from "react";

import { API_BASE } from "../../config/api";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

/* ====== tiny icons (no deps) ====== */
const IconUsers = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 13c-3.31 0-6 2.24-6 5v2h12v-2c0-2.76-2.69-5-6-5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M16 13c-1.06 0-2.06.23-2.92.64C14.85 14.6 16 16.19 16 18v2h8v-2c0-2.76-2.69-5-6-5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const IconShield = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2 20 6v7c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M9 12l2 2 4-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconUserX = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M2 20v-2c0-2.76 2.69-5 6-5 2.4 0 4.48 1.17 5.5 2.88"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 14.5 22 21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M22 14.5 15.5 21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconSearch = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M21 21l-4.3-4.3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconEdit = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 20h9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const IconEye = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const StatCard = ({ label, value, icon, tone = "amber" }) => {
  const tones = {
    amber: { bg: "#FFFBEB", fg: "#D97706" },
    emerald: { bg: "#ECFDF5", fg: "#059669" },
    red: { bg: "#FEF2F2", fg: "#DC2626" },
  };
  const t = tones[tone] ?? tones.amber;

  return (
    <div className="al-cardStat">
      <div className="al-cardTop">
        <div className="al-iconBubble" style={{ background: t.bg, color: t.fg }}>
          {icon}
        </div>
        <div className="al-statMeta">
          <div className="al-statLabel">{label}</div>
          <div className="al-statValue">{value}</div>
        </div>
      </div>
    </div>
  );
};

const RolePill = ({ role }) => {
  const rRaw = String(role || "").trim();
  const key = rRaw.toLowerCase();

  const map = {
    player: { bg: "#EEF2FF", fg: "#4338CA" },
    staff: { bg: "#E0F2FE", fg: "#0369A1" },
    referee: { bg: "#ECFDF5", fg: "#059669" },
    tournamentleader: { bg: "#F3E8FF", fg: "#7E22CE" },
    admin: { bg: "#FEF3C7", fg: "#B45309" },
  };

  const t = map[key] ?? { bg: "#F1F5F9", fg: "#475569" };

  return (
    <span className="al-pill" style={{ background: t.bg, color: t.fg }}>
      {rRaw || "-"}
    </span>
  );
};

function formatDate(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d.toLocaleString();
  if (typeof ts === "object" && ts.time) {
    const d2 = new Date(ts.time);
    return isNaN(d2.getTime()) ? "-" : d2.toLocaleString();
  }
  return String(ts);
}

const ROLE_OPTIONS = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "tournament_leader", label: "Tournament Leader" },
  { value: "referee", label: "Referee" },
  { value: "player", label: "Player" },
];

export const AccountListScreen = ({
  searchKeyword = "",
  onViewAccount,
  onEditAccount,
  onEditRole,
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState(searchKeyword || "");
  const [role, setRole] = useState("all");

  const [togglingIds, setTogglingIds] = useState(() => new Set());

  const fetchUsers = async ({ q, role }) => {
    setLoading(true);
    setErr("");

    try {
      const params = new URLSearchParams();
      const qTrim = (q ?? "").trim();

      if (qTrim) params.set("q", qTrim);
      if (role && role !== "all") params.set("role", role);

      const path = `/api/admin/users${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const data = await apiFetch(path, { method: "GET" });
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || String(e));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch(searchKeyword || "");
  }, [searchKeyword]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers({ q: search, role });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [search, role]);

  const total = users.length;
  const activeCount = useMemo(
    () => users.filter((u) => u.isActive === true).length,
    [users],
  );
  const lockedCount = total - activeCount;

  const toggleActive = async (userId, currentActive, usernameOrEmail) => {
    const nextLabel = currentActive ? "TẠM KHÓA" : "MỞ KHÓA";
    const who = usernameOrEmail ? ` (${usernameOrEmail})` : "";

    const okConfirm = window.confirm(
      `Bạn có chắc muốn ${nextLabel} tài khoản${who} không?`,
    );
    if (!okConfirm) return;

    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });

    try {
      const path = `/api/admin/users/${userId}/toggle-active`;
      const data = await apiFetch(path, { method: "POST" });

      const newActive = !!data?.isActive;
      await fetchUsers({ q: search, role });

      window.alert(`Cập nhật trạng thái thành công! (isActive=${newActive})`);
    } catch (e) {
      setErr(e?.message || String(e));
      window.alert("Cập nhật trạng thái thất bại!");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleView = (id) => {
    if (typeof onViewAccount === "function") onViewAccount(id);
  };

  const handleEdit = (id) => {
    if (typeof onEditAccount === "function") onEditAccount(id);
  };

  const handleEditRole = (id) => {
    if (typeof onEditRole === "function") onEditRole(id);
  };

  return (
    <div className="al-page">
      <style>{`
        .al-page{
          min-height: 100%;
          padding: 14px;
          background: radial-gradient(1200px 500px at 10% 0%, rgba(59,130,246,0.12), transparent 60%),
                      radial-gradient(1200px 500px at 90% 0%, rgba(249,115,22,0.10), transparent 55%),
                      linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          color:#0b0f1a;
        }

        .al-wrap{
          max-width: 1100px;
          margin: 0 auto;
          display:flex;
          flex-direction:column;
          gap: 14px;
        }

        .al-alert{
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.9);
          box-shadow: 0 10px 24px rgba(15,23,42,0.06);
          font-weight: 750;
        }
        .al-warn{ color: #92400e; background: #fffbeb; border-color:#fcd34d; }
        .al-err{ color: #b91c1c; background: #fff1f2; border-color:#fecdd3; }

        .al-gridCards{
          display:grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 860px){
          .al-gridCards{ grid-template-columns: 1fr; }
        }

        .al-cardStat{
          border-radius: 16px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(15,23,42,0.08);
          box-shadow: 0 14px 34px rgba(15,23,42,0.06);
          padding: 14px 14px;
        }
        .al-cardTop{
          display:flex;
          gap: 12px;
          align-items:center;
        }
        .al-iconBubble{
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display:flex;
          align-items:center;
          justify-content:center;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .al-statMeta{ display:flex; flex-direction:column; gap: 4px; }
        .al-statLabel{
          font-size: 12px;
          font-weight: 950;
          opacity: .8;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        .al-statValue{
          font-size: 26px;
          font-weight: 980;
          line-height: 1.1;
        }

        .al-toolbar{
          display:flex;
          gap: 10px;
          align-items:center;
          flex-wrap: wrap;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(15,23,42,0.08);
          box-shadow: 0 14px 34px rgba(15,23,42,0.06);
        }

        .al-search{
          display:flex;
          align-items:center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(15,23,42,0.12);
          background: #fff;
          min-width: 260px;
          flex: 1 1 260px;
        }
        .al-searchIcon{ opacity: .75; display:flex; }
        .al-input{
          border: none;
          outline: none;
          width: 100%;
          font-weight: 700;
          color:#0b0f1a;
        }

        .al-select{
          border: 1px solid rgba(15,23,42,0.12);
          background: #fff;
          border-radius: 14px;
          padding: 10px 12px;
          font-weight: 800;
          color:#0b0f1a;
          outline: none;
        }

        .al-tableCard{
          border-radius: 16px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(15,23,42,0.08);
          box-shadow: 0 14px 34px rgba(15,23,42,0.06);
          overflow:hidden;
        }
        .al-tableScroll{ overflow:auto; }
        .al-table{
          width:100%;
          border-collapse: collapse;
          min-width: 900px;
        }
        .al-table th, .al-table td{
          padding: 12px 12px;
          border-bottom: 1px solid rgba(15,23,42,0.07);
          text-align:left;
          vertical-align: middle;
          font-weight: 700;
          color:#0b0f1a;
        }
        .al-table th{
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .05em;
          background: rgba(15,23,42,0.02);
        }
        .al-empty{
          padding: 16px;
          opacity: .72;
          font-weight: 800;
        }

        .al-userCell{
          display:flex;
          align-items:center;
          gap: 10px;
        }
        .al-avarta{
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: rgba(59,130,246,0.12);
          border: 1px solid rgba(59,130,246,0.22);
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight: 950;
        }
        .al-username{ font-weight: 950; }
        .al-email{ opacity: .8; }
        .al-muted{ opacity: .72; }

        .al-pill{
          display:inline-flex;
          align-items:center;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 950;
          font-size: 12px;
          border: 1px solid rgba(0,0,0,0.06);
        }

        .al-statusBtn{
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 950;
          border: 1px solid rgba(0,0,0,0.08);
          cursor:pointer;
        }
        .al-statusBtnOk{ background: rgba(16,185,129,0.14); }
        .al-statusBtnBad{ background: rgba(239,68,68,0.12); }
        .al-statusBtn:disabled{ opacity: .65; cursor:not-allowed; }

        .al-thAction{ text-align:right; }
        .al-tdAction{
          text-align:right;
          white-space: nowrap;
        }

        .al-iconBtn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(15,23,42,0.12);
          background: rgba(255,255,255,0.95);
          color:#0b0f1a;
          cursor:pointer;
          box-shadow: 0 10px 24px rgba(15,23,42,0.05);
          margin-left: 8px;
        }
        .al-iconBtn:hover{
          border-color: rgba(15,23,42,0.18);
          box-shadow: 0 14px 28px rgba(15,23,42,0.08);
        }
      `}</style>

      <div className="al-wrap">
        {loading && (
          <div className="al-alert al-warn">Đang tải danh sách tài khoản...</div>
        )}
        {err && <div className="al-alert al-err">Lỗi: {err}</div>}

        <div className="al-gridCards">
          <StatCard
            label="Tổng người dùng"
            value={total}
            icon={<IconUsers />}
            tone="amber"
          />
          <StatCard
            label="Tài khoản hoạt động"
            value={activeCount}
            icon={<IconShield />}
            tone="emerald"
          />
          <StatCard
            label="Tài khoản bị khóa"
            value={lockedCount}
            icon={<IconUserX />}
            tone="red"
          />
        </div>

        <div className="al-toolbar">
          <div className="al-search">
            <span className="al-searchIcon">
              <IconSearch />
            </span>
            <input
              className="al-input"
              placeholder="Nhập username hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="al-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="al-tableCard">
          <div className="al-tableScroll">
            <table className="al-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Đăng nhập lần cuối</th>
                  <th>Trạng thái</th>
                  <th className="al-thAction">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {!loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="al-empty">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const id = u.userId;
                    const username = u.username ?? "";
                    const email = u.email ?? "";
                    const roleText = (u.roleName ?? "").trim();
                    const isActive = u.isActive === true;
                    const lastLogin = u.lastLogin;

                    const initial = (username || email || "?")
                      .slice(0, 1)
                      .toUpperCase();
                    const busy = togglingIds.has(id);

                    return (
                      <tr key={id}>
                        <td>
                          <div
                            className="al-userCell"
                            role="button"
                            tabIndex={0}
                            title="Bấm để xem hồ sơ"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleView(id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleView(id);
                              }
                            }}
                          >
                            <div className="al-avarta" aria-hidden="true">
                              {initial}
                            </div>

                            <div className="al-username">{username || "-"}</div>
                          </div>
                        </td>

                        <td className="al-email">{email || "-"}</td>

                        <td>
                          <RolePill role={roleText} />
                        </td>

                        <td className="al-muted">{formatDate(lastLogin)}</td>

                        <td>
                          <button
                            className={`al-statusBtn ${
                              isActive ? "al-statusBtnOk" : "al-statusBtnBad"
                            }`}
                            disabled={busy}
                            onClick={() =>
                              toggleActive(id, isActive, username || email)
                            }
                            title="Bấm để đổi trạng thái"
                          >
                            {busy
                              ? "Đang cập nhật..."
                              : isActive
                              ? "Đang hoạt động"
                              : "Tạm khóa"}
                          </button>
                        </td>

                        <td className="al-tdAction">
                          <button
                            className="al-iconBtn"
                            title="Xem thông tin tài khoản"
                            onClick={() => handleView(id)}
                          >
                            <IconEye />
                          </button>

                          <button
                            className="al-iconBtn"
                            title="Sửa"
                            onClick={() => handleEdit(id)}
                          >
                            <IconEdit />
                          </button>

                          <button
                            className="al-iconBtn"
                            title="Phân quyền"
                            onClick={() => handleEditRole(id)}
                          >
                            <IconShield />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountListScreen;