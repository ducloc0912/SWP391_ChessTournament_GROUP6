import React, { useEffect, useMemo, useState } from "react";
import { Users, Trophy, Gamepad2, XCircle } from "lucide-react";

import { API_BASE } from "../../config/api";

const StatCard = ({ label, value, icon, tone = "amber", valueColor }) => {
  const toneMap = {
    amber: { bg: "#FFFBEB", fg: "#D97706" },
    blue: { bg: "#EFF6FF", fg: "#2563EB" },
    emerald: { bg: "#ECFDF5", fg: "#059669" },
    red: { bg: "#FEF2F2", fg: "#DC2626" },
  };
  const t = toneMap[tone] ?? toneMap.amber;

  return (
    <div className="cardStat">
      <div className="cardTop">
        <div className="badgeIcon" style={{ background: t.bg, color: t.fg }}>
          {icon}
        </div>
        <div className="statMeta">
          <div className="statLabel">{label}</div>
          <div className="statValueRow">
            <div className="statValue" style={{ color: valueColor }}>{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const [data, setData] = useState({
    totalUsers: 0,
    totalTournaments: 0,
    ongoingMatches: 0,
    cancelledTournaments: 0,
    registrations: [],
    tournamentStatus: [],
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/api/dashboard/summary`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (!ignore) setData(json);
      } catch (e) {
        if (!ignore) setErr(e?.message || String(e));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const cards = useMemo(() => {
    const fmt = (n) =>
      typeof n === "number" ? n.toLocaleString("vi-VN") : String(n);
    return [
      {
        label: "Tổng người chơi",
        value: fmt(data.totalUsers),
        icon: <Users size={22} />,
        tone: "amber",
        valueColor: "#000000",
      },
      {
        label: "Tổng giải đấu",
        value: fmt(data.totalTournaments),
        icon: <Trophy size={22} />,
        tone: "blue",
        valueColor: "#000000",
      },
      {
        label: "Trận đang diễn ra",
        value: fmt(data.ongoingMatches),
        icon: <Gamepad2 size={22} />,
        tone: "emerald",
        valueColor: "#000000",
      },
      {
        label: "Giải đấu đã hủy",
        value: fmt(data.cancelledTournaments),
        icon: <XCircle size={22} />,
        tone: "red",
        valueColor: "#000000",
      },
    ];
  }, [data]);

  // ===== Line chart from DB =====
  const lineData = useMemo(
    () => (data.registrations || []).map((x) => Number(x.total) || 0),
    [data.registrations],
  );
  const labels = useMemo(
    () => (data.registrations || []).map((x) => `T${x.label}`),
    [data.registrations],
  );

  const safeLineData = lineData.length ? lineData : [0];
  const max = Math.max(...safeLineData);
  const w = 600;
  const paddingBottom = 220;
  const heightRange = 180;
  const scaleX = safeLineData.length > 1 ? w / (safeLineData.length - 1) : w;
  const scaleY = (v) => paddingBottom - (v / (max || 1)) * heightRange;
  const points = safeLineData.map((v, i) => [i * scaleX, scaleY(v)]);

  const makeSmoothPath = (pts) => {
    // defensive: handle empty or single-point arrays
    if (!pts || pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      const [px, py] = pts[i - 1];
      const cx = (px + x) / 2;
      d += ` Q ${cx} ${py} ${x} ${y}`;
    }
    return d;
  };

  const linePath = makeSmoothPath(points);
  const areaPath = linePath ? `${linePath} L ${w} ${paddingBottom} L 0 ${paddingBottom} Z` : "";

  const donut = useMemo(() => {
    const colorByStatus = {
      Open: "#3b82f6",
      Ongoing: "#10b981",
      Finished: "#6b7280",
      Cancelled: "#ef4444",
    };

    return (data.tournamentStatus || []).map((x) => ({
      label: x.status ?? "Unknown",
      value: Number(x.total) || 0,
      color: colorByStatus[x.status] || "#f59e0b",
    }));
  }, [data.tournamentStatus]);

  const totalDonut = donut.reduce((a, b) => a + b.value, 0);
  const donutBg = (() => {
    if (totalDonut === 0) return "#f8fafc";
    return `conic-gradient(${donut
      .map((d, idx) => {
        const start = donut.slice(0, idx).reduce((a, b) => a + b.value, 0);
        const end = start + d.value;
        const a = (start / totalDonut) * 360;
        const b = (end / totalDonut) * 360;
        return `${d.color} ${a}deg ${b}deg`;
      })
      .join(",")})`;
  })();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {loading && (
        <div className="alert alertWarn">Đang tải dữ liệu dashboard...</div>
      )}
      {err && <div className="alert alertErr">Lỗi tải dữ liệu: {err}</div>}

      <div className="gridCards">
        {cards.map((c, i) => (
          <StatCard key={i} {...c} />
        ))}
      </div>

      <div className="gridCharts">
        {/* Line chart */}
        <div className="cardChart">
          <div className="chartHeader">
            <div>
              <h3>Đăng ký người chơi</h3>
              <p>Tổng quan lượt đăng ký theo tháng</p>
            </div>
          </div>

          <div className="lineWrap">
            <svg viewBox="0 0 600 240" width="100%" height="100%">
              {[40, 80, 120, 160, 200].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="600"
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}
              {linePath && <path d={areaPath} fill="#f59e0b" opacity="0.12" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )}
              {points.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="5" fill="#f59e0b" />
              ))}
            </svg>
          </div>

          <div className="lineLabels">
            {labels.map((lb, i) => (
              <span key={`${lb}-${i}`}>{lb}</span>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className="cardChart">
          <div className="chartHeader">
            <div>
              <h3 style={{ color: "#000000" }}>Trạng thái giải đấu</h3>
              
            </div>
          </div>

          <div className="donutWrap">
            <div
              className="donutRing"
              style={{
                background: donutBg,
              }}
            >
              <div className="donutInner">
                <div className="donutNum" style={{color: "#000000"}}>
                  {data.totalTournaments?.toLocaleString?.() ??
                    data.totalTournaments}
                </div>
                <div className="donutCap">GIẢI ĐẤU</div>
              </div>
            </div>

            <div className="legend">
              {donut.map((d) => {
                const pct = totalDonut ? Math.round((d.value / totalDonut) * 100) : 0;
                return (
                  <div key={d.label} className="legendRow">
                    <span
                      className="legendDot"
                      style={{ background: d.color }}
                    />
                    <span>{d.label}</span>
                    <span className="legendPill">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;