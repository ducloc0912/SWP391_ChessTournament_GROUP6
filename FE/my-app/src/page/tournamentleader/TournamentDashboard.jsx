import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileWarning,
  FolderKanban,
  Plus,
  Trophy,
  Users,
  ArrowRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/ctms";
const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_TEXT = {
  Pending: "Chờ duyệt",
  Upcoming: "Sắp diễn ra",
  Ongoing: "Đang diễn ra",
  Completed: "Đã hoàn thành",
  Finished: "Đã kết thúc",
  Rejected: "Bị từ chối",
  Cancelled: "Đã hủy",
  Delayed: "Hoãn",
};

const container = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const panel = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
};

const sectionTitle = { margin: 0, fontSize: 18, fontWeight: 900, color: "#0f172a" };
const muted = { color: "#64748b", margin: 0 };

const cardGrid = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const toDateSafe = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const dt = toDateSafe(value);
  if (!dt) return "--/--/----";
  return dt.toLocaleDateString("vi-VN");
};

const daysLeft = (dateValue) => {
  const dt = toDateSafe(dateValue);
  if (!dt) return null;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  return Math.round((target - startToday) / DAY_MS);
};

const ActionButton = ({ label, icon, onClick, primary = false }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      height: 40,
      borderRadius: 12,
      padding: "0 14px",
      border: primary ? "none" : "1px solid #e2e8f0",
      background: primary ? "#f59e0b" : "#ffffff",
      color: primary ? "#ffffff" : "#334155",
      fontWeight: 800,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      cursor: "pointer",
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default function TournamentDashboard() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/tournaments`, {
        withCredentials: true,
      });
      setTournaments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch tournaments failed:", err);
      setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại.");
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summary = useMemo(() => {
    const total = tournaments.length;
    const pending = tournaments.filter((t) => t.status === "Pending" || t.status === "Upcoming").length;
    const ongoing = tournaments.filter((t) => t.status === "Ongoing").length;
    const finished = tournaments.filter((t) => t.status === "Completed" || t.status === "Finished").length;
    const cancelled = tournaments.filter((t) => t.status === "Cancelled" || t.status === "Rejected").length;
    const totalPlayers = tournaments.reduce((acc, t) => acc + (Number(t.currentPlayers) || 0), 0);
    const totalSlots = tournaments.reduce((acc, t) => acc + (Number(t.maxPlayer) || 0), 0);
    const occupancy = totalSlots > 0 ? Math.round((totalPlayers / totalSlots) * 100) : 0;
    return { total, pending, ongoing, finished, cancelled, totalPlayers, occupancy };
  }, [tournaments]);

  const statusDist = useMemo(() => {
    const statusMap = tournaments.reduce((acc, t) => {
      const key = t.status || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusMap)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status, count, pct: summary.total ? Math.round((count / summary.total) * 100) : 0 }));
  }, [tournaments, summary.total]);

  const upcoming = useMemo(() => {
    return tournaments
      .filter((t) => {
        const d = toDateSafe(t.startDate);
        return d && d.getTime() >= Date.now() && t.status !== "Cancelled" && t.status !== "Rejected";
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5);
  }, [tournaments]);

  const alerts = useMemo(() => {
    return tournaments
      .filter((t) => ["Pending", "Upcoming"].includes(t.status))
      .map((t) => {
        const left = daysLeft(t.registrationDeadline);
        return { ...t, dayLeft: left };
      })
      .filter((t) => t.dayLeft !== null && t.dayLeft <= 3)
      .sort((a, b) => a.dayLeft - b.dayLeft)
      .slice(0, 5);
  }, [tournaments]);

  return (
    <div style={container}>
      <div style={{ ...panel, paddingBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ ...sectionTitle, fontSize: 24 }}>Tournament Leader Dashboard</h2>
            <p style={{ ...muted, marginTop: 6 }}>
              Tổng quan nhanh các giải đấu, tiến độ đăng ký và các đầu việc cần xử lý.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ActionButton
              label="Tạo giải đấu"
              icon={<Plus size={16} />}
              onClick={() => navigate("/tournaments/create")}
              primary
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ ...panel, borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div style={cardGrid}>
        <div style={panel}>
          <p style={{ ...muted, fontSize: 13 }}>Tổng giải đấu</p>
          <h3 style={{ margin: "6px 0 0", fontSize: 32 }}>{summary.total}</h3>
        </div>
        <div style={panel}>
          <p style={{ ...muted, fontSize: 13 }}>Đang diễn ra</p>
          <h3 style={{ margin: "6px 0 0", fontSize: 32, color: "#059669" }}>{summary.ongoing}</h3>
        </div>
        <div style={panel}>
          <p style={{ ...muted, fontSize: 13 }}>Chờ duyệt / sắp diễn ra</p>
          <h3 style={{ margin: "6px 0 0", fontSize: 32, color: "#d97706" }}>{summary.pending}</h3>
        </div>
        <div style={panel}>
          <p style={{ ...muted, fontSize: 13 }}>Đã hoàn thành</p>
          <h3 style={{ margin: "6px 0 0", fontSize: 32, color: "#2563eb" }}>{summary.finished}</h3>
        </div>
        <div style={panel}>
          <p style={{ ...muted, fontSize: 13 }}>Đã hủy / bị từ chối</p>
          <h3 style={{ margin: "6px 0 0", fontSize: 32, color: "#dc2626" }}>{summary.cancelled}</h3>
        </div>
        <div style={panel}>
          <p style={{ ...muted, fontSize: 13 }}>Lấp đầy slot người chơi</p>
          <h3 style={{ margin: "6px 0 2px", fontSize: 32 }}>{summary.occupancy}%</h3>
          <div style={{ height: 8, borderRadius: 999, overflow: "hidden", background: "#e2e8f0" }}>
            <div
              style={{
                height: "100%",
                width: `${summary.occupancy}%`,
                background: "linear-gradient(90deg, #f59e0b, #f97316)",
              }}
            />
          </div>
          <p style={{ ...muted, marginTop: 8, fontSize: 12 }}>
            {summary.totalPlayers} / {tournaments.reduce((acc, t) => acc + (Number(t.maxPlayer) || 0), 0)} người
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1fr)" }}>
        <div style={panel}>
          <h3 style={sectionTitle}>Phân bổ trạng thái giải đấu</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            {loading ? (
              <p style={muted}>Đang tải dữ liệu...</p>
            ) : statusDist.length === 0 ? (
              <p style={muted}>Chưa có dữ liệu để hiển thị.</p>
            ) : (
              statusDist.map((item) => (
                <div key={item.status}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#334155", fontSize: 13 }}>
                      {STATUS_TEXT[item.status] || item.status}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${item.pct}%`,
                        background: "#0ea5e9",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={panel}>
          <h3 style={sectionTitle}>Công việc cần chú ý</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            {alerts.length === 0 ? (
              <p style={muted}>Không có deadline gấp trong 3 ngày tới.</p>
            ) : (
              alerts.map((t) => (
                <button
                  key={t.tournamentId}
                  type="button"
                  onClick={() => navigate(`/tournaments/${t.tournamentId}`)}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 12,
                    background: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.tournamentName}</div>
                    <div style={{ marginTop: 3, fontSize: 12, color: "#64748b" }}>
                      Hạn đăng ký: {formatDate(t.registrationDeadline)}
                    </div>
                  </div>
                  <div style={{ color: t.dayLeft <= 0 ? "#dc2626" : "#d97706", fontSize: 12, fontWeight: 800 }}>
                    {t.dayLeft <= 0 ? "Hết hạn" : `Còn ${t.dayLeft} ngày`}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <h3 style={sectionTitle}>Lịch giải đấu sắp diễn ra</h3>
          <button
            type="button"
            onClick={() => navigate("/tournaments?tab=tournament-list")}
            style={{
              border: "none",
              background: "transparent",
              color: "#2563eb",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Xem tất cả <ArrowRight size={15} />
          </button>
        </div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <p style={muted}>Đang tải dữ liệu...</p>
          ) : upcoming.length === 0 ? (
            <p style={muted}>Không có giải sắp diễn ra.</p>
          ) : (
            upcoming.map((t) => (
              <div
                key={t.tournamentId}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.tournamentName}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>{t.location || "Địa điểm chưa cập nhật"}</p>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#334155", fontSize: 13 }}>
                  <CalendarClock size={14} /> {formatDate(t.startDate)}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#334155", fontSize: 13 }}>
                  <Users size={14} /> {t.currentPlayers || 0}/{t.maxPlayer || 0}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/tournaments/${t.tournamentId}`)}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "8px 10px",
                    background: "#fff",
                    color: "#334155",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Chi tiết
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ ...panel, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <FolderKanban size={18} color="#0ea5e9" />
          <p style={{ ...muted, margin: 0 }}>Quản lý toàn bộ danh sách giải đấu theo từng trạng thái.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Clock3 size={18} color="#d97706" />
          <p style={{ ...muted, margin: 0 }}>Theo dõi deadline đăng ký để xử lý kịp thời.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <CheckCircle2 size={18} color="#16a34a" />
          <p style={{ ...muted, margin: 0 }}>Giám sát tỷ lệ lấp đầy giúp tối ưu hiệu quả tổ chức.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <FileWarning size={18} color="#dc2626" />
          <p style={{ ...muted, margin: 0 }}>Phát hiện sớm các giải có rủi ro hoặc quá hạn xử lý.</p>
        </div>
      </div>
    </div>
  );
}
