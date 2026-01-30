import React, { useEffect, useMemo, useState } from "react";
import { Users, Trophy, Gamepad2, XCircle } from "lucide-react";

const API_BASE = "http://localhost:8080";

const StatCard = ({ label, value, icon, tone = "amber", trend = "+0%" }) => {
  const toneMap = {
    amber: { bg: "#FFFBEB", fg: "#D97706" },
    blue: { bg: "#EFF6FF", fg: "#2563EB" },
    emerald: { bg: "#ECFDF5", fg: "#059669" },
    red: { bg: "#FEF2F2", fg: "#DC2626" },
  };

  const t = toneMap[tone] ?? toneMap.amber;
  const isPositive = !String(trend).trim().startsWith("-");

  return (
    <div className="cardStat">
      <div className="cardTop">
        <div className="badgeIcon" style={{ background: t.bg, color: t.fg }}>
          {icon}
        </div>

        <div className="statMeta">
          <div className="statLabel">{label}</div>

          <div className="statValueRow">
            <div className="statValue">{value}</div>
            <div className={`statTrend ${isPositive ? "trendPos" : "trendNeg"}`}>
              {trend}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalTournaments: 0,
    ongoingMatches: 0,
    cancelledTournaments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/api/dashboard/summary`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!ignore) setSummary(data);
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
    const fmt = (n) => (typeof n === "number" ? n.toLocaleString("vi-VN") : String(n));
    return [
      { label: "Tổng người chơi", value: fmt(summary.totalUsers), icon: <Users size={22} />, tone: "amber"},
      { label: "Tổng giải đấu", value: fmt(summary.totalTournaments), icon: <Trophy size={22} />, tone: "blue"},
      { label: "Giải đấu đang diễn ra", value: fmt(summary.ongoingMatches), icon: <Gamepad2 size={22} />, tone: "emerald" },
      { label: "Giải đấu đã hủy", value: fmt(summary.cancelledTournaments), icon: <XCircle size={22} />, tone: "red" },
    ];
  }, [summary]);

  
  const lineData = [110, 160, 220, 240, 320, 380, 310, 270, 440];
  const labels = ["TH10", "TH11", "TH12", "TH1", "TH2", "TH3"];

 
  const donut = [
    { label: "Sắp tới", value: 25, color: "#f59e0b" },
    { label: "Đang diễn ra", value: 19, color: "#3b82f6" },
    { label: "Đã hủy", value: 12, color: "#ef4444" },
    { label: "Đã kết thúc", value: 44, color: "#10b981" },
  ];
  const total = donut.reduce((a, b) => a + b.value, 0);

  // Line chart drawing helpers
  const max = Math.max(...lineData);
  const min = 0;
  const w = 600;
  const h = 240;
  const paddingBottom = 220;
  const heightRange = 180;
  const scaleX = w / (lineData.length - 1);
  const scaleY = (v) => paddingBottom - ((v - min) / (max - min || 1)) * heightRange;

  const points = lineData.map((v, i) => [i * scaleX, scaleY(v)]);

  // Make a smooth path (quadratic)
  const makeSmoothPath = (pts) => {
    if (pts.length < 2) return "";
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
  const areaPath = `${linePath} L ${w} ${paddingBottom} L 0 ${paddingBottom} Z`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {loading && <div className="alert alertWarn">Đang tải dữ liệu dashboard...</div>}
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

            <select className="select">
              <option>Năm qua</option>
              <option>6 tháng gần nhất</option>
              <option>3 tháng gần nhất</option>
            </select>
          </div>

          <div className="lineWrap">
            <svg viewBox="0 0 600 240" width="100%" height="100%">
              {[40, 80, 120, 160, 200].map((y) => (
                <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#E5E7EB" strokeWidth="1" />
              ))}

              <path d={areaPath} fill="#f59e0b" opacity="0.12" />
              <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />

              {points.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="5" fill="#f59e0b" />
              ))}
            </svg>
          </div>

          <div className="lineLabels">
            {labels.map((lb) => (
              <span key={lb}>{lb}</span>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className="cardChart">
          <div className="chartHeader">
            <div>
              <h3>Trạng thái giải đấu</h3>
              <p>Phân bố trạng thái toàn cầu</p>
            </div>
          </div>

          <div className="donutWrap">
            <div
              className="donutRing"
              style={{
                background: `conic-gradient(${donut
                  .map((d, idx) => {
                    const start = donut.slice(0, idx).reduce((a, b) => a + b.value, 0);
                    const end = start + d.value;
                    const a = (start / total) * 360;
                    const b = (end / total) * 360;
                    return `${d.color} ${a}deg ${b}deg`;
                  })
                  .join(",")})`,
              }}
            >
              <div className="donutInner">
                <div className="donutNum">
                  {summary.totalTournaments?.toLocaleString?.() ?? summary.totalTournaments}
                </div>
                <div className="donutCap">GIẢI ĐẤU</div>
              </div>
            </div>

            <div className="legend">
              {donut.map((d) => (
                <div key={d.label} className="legendRow">
                  <span className="legendDot" style={{ background: d.color }} />
                  <span>{d.label}</span>
                  <span className="legendPill">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
