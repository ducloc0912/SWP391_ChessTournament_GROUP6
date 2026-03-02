import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Mail, Calendar } from "lucide-react";

const API_BASE = "http://localhost:8080/ctms";

const ROLES = {
  PLAYER: "Player",
  STAFF: "Staff",
  REFEREE: "Referee",
  TOURNAMENT_LEADER: "TournamentLeader",
  ADMIN: "Admin",
};

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

function formatDateOnly(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toLocaleDateString("vi-VN");
  if (typeof v === "object" && v.time) {
    const d2 = new Date(v.time);
    return isNaN(d2.getTime()) ? "-" : d2.toLocaleDateString("vi-VN");
  }
  return String(v);
}

function resolveAvatarUrl(avatar) {
  if (!avatar) return "";
  const s = String(avatar);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `http://localhost:8080${s}`;
  return s;
}

function statusLabel(status) {
  const s = String(status || "").trim();
  if (s === "Completed") return "Đã kết thúc";
  if (s === "Ongoing") return "Đang diễn ra";
  if (s === "Pending") return "Chờ duyệt";
  if (s === "Rejected") return "Bị từ chối";
  if (s === "Delayed") return "Tạm hoãn";
  if (s === "Cancelled") return "Đã hủy";
  return s || "-";
}

function statusTone(status) {
  const s = String(status || "").trim();
  if (s === "Completed") return "done";
  if (s === "Ongoing") return "live";
  if (s === "Cancelled" || s === "Rejected") return "bad";
  if (s === "Delayed") return "warn";
  return "neutral";
}

const UserProfile = ({ userId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(ROLES.PLAYER);
  const [stats, setStats] = useState(null);

  // tournament history
  const [hisLoading, setHisLoading] = useState(false);
  const [hisError, setHisError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("ALL"); // ALL | Ongoing | Completed

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    const fetchUser = async () => {
      try {
        setLoading(true);
        setError("");

        const json = await apiFetch(`/api/admin/users/${userId}`, {
          method: "GET",
          signal: controller.signal,
        });

        // BE trả { success:true, data:{ user, role, stats } }
        const u = json?.data?.user ?? json?.user ?? null;
        if (!u) throw new Error("Không có dữ liệu user");

        setUser(u);
        setRole(json?.data?.role ?? json?.role ?? ROLES.PLAYER);
        setStats(json?.data?.stats ?? json?.stats ?? null);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    return () => controller.abort();
  }, [userId]);

  // fetch tournament history whenever userId/filter changes
  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    const fetchHistory = async () => {
      try {
        setHisLoading(true);
        setHisError("");

        const statusParam =
          historyFilter === "ALL" ? "" : encodeURIComponent(historyFilter);

        const qs = statusParam ? `?status=${statusParam}` : "";
        const json = await apiFetch(
          `/api/admin/users/${userId}/tournament-history${qs}`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );

        // BE trả { success:true, data:{ items:[...] } }
        const items = json?.data?.items ?? json?.items ?? json?.data ?? [];
        setHistory(Array.isArray(items) ? items : []);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setHisError(e?.message || String(e));
        setHistory([]);
      } finally {
        setHisLoading(false);
      }
    };

    fetchHistory();
    return () => controller.abort();
  }, [userId, historyFilter]);

  const displayName = useMemo(() => {
    if (!user) return "";
    const fn = user.firstName ?? "";
    const ln = user.lastName ?? "";
    const full = `${fn} ${ln}`.trim();
    return full || user.username || "User";
  }, [user]);

  const badgeText = useMemo(() => {
    const r = String(role || "").trim();
    if (r === ROLES.PLAYER) return "PRO PLAYER";
    if (r === ROLES.TOURNAMENT_LEADER) return "TOURNAMENT LEADER";
    if (r === ROLES.ADMIN) return "ADMIN";
    if (r === ROLES.STAFF) return "STAFF";
    return "REFEREE";
  }, [role]);

  const badgeTone = useMemo(() => {
    const r = String(role || "").trim();
    if (r === ROLES.PLAYER) return "player";
    if (r === ROLES.TOURNAMENT_LEADER) return "leader";
    if (r === ROLES.ADMIN) return "admin";
    if (r === ROLES.STAFF) return "staff";
    return "referee";
  }, [role]);

  const avatarSrc = useMemo(() => {
    if (!user) return "";
    const resolved = resolveAvatarUrl(user.avatar);
    if (resolved) return resolved;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.username || "User"
    )}`;
  }, [user]);

  if (!userId) return <div className="up-text">Chưa chọn user.</div>;
  if (loading) return <div className="up-text">Đang tải hồ sơ...</div>;
  if (error) return <div className="up-error">Lỗi: {error}</div>;
  if (!user) return null;

  const isPlayer = String(role).trim() === ROLES.PLAYER;

  const totalJoined = isPlayer ? Number(stats?.totalTournaments ?? 0) : 0;
  const avgRank =
    stats?.avgRanking === null || stats?.avgRanking === undefined
      ? "-"
      : `#${Number(stats.avgRanking).toFixed(1)}`;

  return (
    <div className="up-page">
      <style>{`
        .up-page{
          color:#0b0f1a;
          min-height: 100%;
          padding: 14px;
          background: radial-gradient(1200px 500px at 10% 0%, rgba(59,130,246,0.14), transparent 60%),
                      radial-gradient(1200px 500px at 90% 0%, rgba(249,115,22,0.12), transparent 55%),
                      linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
        }

        .up-wrap{
          display:flex;
          flex-direction:column;
          gap:12px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .up-text{ color:#0b0f1a; font-weight: 650; padding: 10px 2px; }
        .up-error{
          color:#b91c1c;
          font-weight: 650;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          padding: 10px 12px;
          border-radius: 12px;
        }

        .up-backBtn{
          width: fit-content;
          color:#0b0f1a;
          display:inline-flex;
          align-items:center;
          gap:8px;
          border-radius: 12px;
          padding: 8px 12px;
        }

        .up-card{
          position:relative;
          padding: 20px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          background: rgba(255,255,255,0.88);
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(6px);
          overflow: hidden;
        }

        .up-card .profile-bg-decor{
          opacity: .55;
          pointer-events: none;
        }

        .up-badge{
          position:absolute;
          top: 16px;
          left: 16px;
          font-weight: 950;
          letter-spacing: .08em;
          font-size: 11px;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
          color: #0b0f1a;
        }
        .up-badge.player{ background: rgba(59,130,246,0.12); }
        .up-badge.leader{ background: rgba(168,85,247,0.12); }
        .up-badge.admin{ background: rgba(245,158,11,0.14); }
        .up-badge.staff{ background: rgba(16,185,129,0.12); }
        .up-badge.referee{ background: rgba(100,116,139,0.12); }

        .up-content{
          display:grid;
          grid-template-columns: 320px 1fr;
          gap: 18px;
          align-items: start;
          margin-top: 24px;
        }

        .up-left{
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
          padding: 18px 14px;
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(15,23,42,0.03), rgba(15,23,42,0.01));
          border: 1px solid rgba(15,23,42,0.06);
        }

        .up-avatarWrap{
          width: 104px;
          height: 104px;
          border-radius: 999px;
          overflow:hidden;
          background: #fff;
          border: 4px solid rgba(255,255,255,0.9);
          box-shadow: 0 14px 30px rgba(15,23,42,0.18);
        }
        .up-avatar{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .up-name{
          margin-top: 12px;
          font-size: 22px;
          font-weight: 950;
          color:#0b0f1a;
          line-height: 1.2;
        }
        .up-username{
          color:#0b0f1a;
          opacity: 0.72;
          margin: 6px 0 0;
          font-weight: 650;
        }

        .up-right{
          display:flex;
          flex-direction:column;
          gap: 14px;
        }

        .up-sectionTitle{
          font-weight: 950;
          font-size: 14px;
          letter-spacing: .02em;
          color:#0b0f1a;
          margin: 2px 0 0;
        }

        .up-details{
          display:flex;
          flex-direction:column;
          gap: 10px;
          margin-top: 8px;
        }

        .up-row{
          display:flex;
          align-items:center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: #fff;
          border: 1px solid rgba(15,23,42,0.07);
          box-shadow: 0 10px 24px rgba(15,23,42,0.05);
        }
        .up-row:hover{
          border-color: rgba(15,23,42,0.12);
          box-shadow: 0 14px 28px rgba(15,23,42,0.08);
        }

        .up-row svg{
          width: 16px;
          height: 16px;
          color:#0b0f1a;
          opacity: .85;
          flex: 0 0 16px;
        }

        .up-label{
          font-weight: 950;
          color:#0b0f1a;
          margin-right: 6px;
        }
        .up-value{
          color:#0b0f1a;
          font-weight: 650;
        }

        .up-multiline{
          display:-webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow:hidden;
        }

        .up-stats{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 6px;
        }

        .up-statBox{
          border-radius: 16px;
          padding: 14px 14px;
          border: 1px solid rgba(15,23,42,0.07);
          box-shadow: 0 12px 26px rgba(15,23,42,0.06);
          background: #fff;
        }
        .up-statBox.blue{
          background: linear-gradient(180deg, rgba(59,130,246,0.12), rgba(255,255,255,0.92));
        }
        .up-statBox.orange{
          background: linear-gradient(180deg, rgba(249,115,22,0.12), rgba(255,255,255,0.92));
        }

        .up-statLabel{
          font-size: 12px;
          font-weight: 950;
          opacity: .78;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        .up-statValue{
          font-size: 26px;
          font-weight: 980;
          margin-top: 8px;
        }
        /* ✅ đổi màu số tại đây */
        .up-statBox.blue .up-statValue{ color: #1d4ed8; }     /* Total Joined */
        .up-statBox.orange .up-statValue{ color: #c2410c; }   /* Avg Rank */

        .up-statSub{
          font-size: 12px;
          opacity: .72;
          margin-top: 4px;
          font-weight: 650;
        }

        /* ===== Tournament History ===== */
        .up-historyCard{
          margin-top: 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(15,23,42,0.07);
          box-shadow: 0 14px 34px rgba(15,23,42,0.06);
          overflow: hidden;
        }

        .up-historyHeader{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 10px;
          padding: 14px 14px;
          border-bottom: 1px solid rgba(15,23,42,0.07);
          background: linear-gradient(180deg, rgba(15,23,42,0.03), rgba(255,255,255,0.9));
        }

        .up-historyTitle{
          font-weight: 950;
          font-size: 14px;
          color:#0b0f1a;
        }

        .up-filter{
          display:flex;
          align-items:center;
          gap: 8px;
        }

        .up-select{
          border: 1px solid rgba(15,23,42,0.12);
          background: #fff;
          border-radius: 12px;
          padding: 8px 10px;
          font-weight: 650;
          color:#0b0f1a;
          outline: none;
        }

        .up-tableWrap{ overflow:auto; }
        .up-table{
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        .up-table th, .up-table td{
          padding: 12px 12px;
          text-align: left;
          border-bottom: 1px solid rgba(15,23,42,0.07);
          color:#0b0f1a;
          font-weight: 650;
          vertical-align: middle;
        }

        .up-table th{
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .05em;
          background: rgba(15,23,42,0.02);
        }

        .up-muted{ opacity: .72; font-weight: 650; }

        .up-statusBadge{
          display:inline-flex;
          align-items:center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(15,23,42,0.03);
        }
        .up-statusBadge.live{ background: rgba(16,185,129,0.14); }
        .up-statusBadge.done{ background: rgba(59,130,246,0.14); }
        .up-statusBadge.warn{ background: rgba(245,158,11,0.18); }
        .up-statusBadge.bad{ background: rgba(239,68,68,0.14); }

        .up-rank{
          font-weight: 950;
        }

        @media (max-width: 860px){
          .up-content{ grid-template-columns: 1fr; }
        }
        @media (max-width: 520px){
          .up-card{ padding: 16px; }
          .up-stats{ grid-template-columns: 1fr; }
          .up-badge{ top: 12px; left: 12px; }
          .up-historyHeader{ flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="up-wrap">
        <button onClick={onBack} className="btnGhost up-backBtn">
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="card profile-card up-card">
          <div className="profile-bg-decor"></div>

          <div className={`pro-badge up-badge ${badgeTone}`}>{badgeText}</div>

          <div className="up-content">
            {/* Left */}
            <div className="up-left">
              <div className="avatar-wrapper up-avatarWrap">
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="avatar-img up-avatar"
                />
              </div>

              <h2 className="up-name">{displayName}</h2>
              <p className="profile-id up-username">@{user.username || "-"}</p>
            </div>

            {/* Right */}
            <div className="up-right">
              <div>
                <div className="up-sectionTitle">Thông tin cá nhân</div>

                <div className="profile-details up-details">
                  <div className="detail-row up-row">
                    <Mail />
                    <span className="up-value">{user.email || "-"}</span>
                  </div>

                  <div className="detail-row up-row">
                    <Calendar />
                    <span className="up-value">
                      Birthday: {formatDateOnly(user.birthday)}
                    </span>
                  </div>

                  <div
                    className="detail-row up-row"
                    style={{ alignItems: "flex-start" }}
                  >
                    <MapPin style={{ marginTop: 2 }} />
                    <span className="up-value up-multiline">
                      {user.address || "-"}
                    </span>
                  </div>

                  <div className="detail-row up-row">
                    <span className="up-label">Role:</span>
                    <span className="up-value">{role || "-"}</span>
                  </div>

                  <div className="detail-row up-row">
                    <span className="up-label">Status:</span>
                    <span className="up-value">
                      {user.isActive ? "Đang hoạt động" : "Tạm khóa"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="up-sectionTitle">Thống kê</div>

                <div className="profile-stats-grid up-stats">
                  <div className="stat-box blue up-statBox blue">
                    <span className="stat-label up-statLabel">Total Joined</span>
                    <span className="stat-value up-statValue">
                      {isPlayer ? totalJoined : "-"}
                    </span>
                    <span className="stat-sub up-statSub">Tournaments</span>
                  </div>

                  {isPlayer && (
                    <div className="stat-box orange up-statBox orange">
                      <span className="stat-label up-statLabel">Avg Rank</span>
                      <span className="stat-value up-statValue">{avgRank}</span>
                      <span className="stat-sub up-statSub">Top Player</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===== LỊCH SỬ GIẢI ĐẤU ===== */}
          <div className="up-historyCard">
            <div className="up-historyHeader">
              <div className="up-historyTitle">Lịch sử giải đấu</div>

              <div className="up-filter">
                <span className="up-muted">Lọc:</span>
                <select
                  className="up-select"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả</option>
                  <option value="Ongoing">Đang diễn ra</option>
                  <option value="Completed">Đã kết thúc</option>
                </select>
              </div>
            </div>

            {hisError ? (
              <div className="up-error" style={{ margin: 14 }}>
                Lỗi lịch sử: {hisError}
              </div>
            ) : null}

            <div className="up-tableWrap">
              <table className="up-table">
                <thead>
                  <tr>
                    <th>Tên giải đấu</th>
                    <th>Trạng thái</th>
                    <th>Thứ hạng</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                  </tr>
                </thead>

                <tbody>
                  {hisLoading ? (
                    <tr>
                      <td colSpan={5} className="up-muted">
                        Đang tải lịch sử...
                      </td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="up-muted">
                        Chưa có lịch sử tham gia giải đấu.
                      </td>
                    </tr>
                  ) : (
                    history.map((it, idx) => {
                      const st = String(it?.status || "").trim();
                      const showRank = st === "Completed";
                      const rankVal =
                        it?.ranking === null || it?.ranking === undefined
                          ? "-"
                          : `#${it.ranking}`;

                      return (
                        <tr key={it?.tournamentId ?? idx}>
                          <td style={{ fontWeight: 900 }}>
                            {it?.tournamentName || "-"}
                          </td>

                          <td>
                            <span className={`up-statusBadge ${statusTone(st)}`}>
                              {statusLabel(st)}
                            </span>
                          </td>

                          <td className="up-rank">{showRank ? rankVal : "-"}</td>

                          <td>{formatDateOnly(it?.startDate)}</td>
                          <td>{formatDateOnly(it?.endDate)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* ===== END HISTORY ===== */}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
