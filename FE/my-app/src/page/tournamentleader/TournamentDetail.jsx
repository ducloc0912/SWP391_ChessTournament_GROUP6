import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../assets/css/tournament-leader.css";
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  Clock,
  LayoutDashboard,
  Users2,
  GitBranch,
  ShieldCheck,
  FileText,
  ChevronRight,
  UserPlus,
  ArrowRight,
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  AlertCircle,
} from "lucide-react";

const Badge = ({ children, variant }) => (
  <span className={`td-badge td-badge-${variant}`}>{children}</span>
);

const StatCard = ({ label, value, icon, accent, onClick }) => (
  <div
    className="td-stat-card"
    onClick={onClick}
    style={{ cursor: onClick ? "pointer" : "default" }}
  >
    <div className={`td-stat-icon ${accent}`}>{icon}</div>
    <div className="td-stat-content">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
);

const TournamentDetail = () => {
  const { id } = useParams(); // lấy tournamentId từ URL
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvedPlayers, setApprovedPlayers] = useState([]);
  const [waitingPlayers, setWaitingPlayers] = useState([]);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/ctms/api/tournaments?id=${id}`,
          {
            withCredentials: true,
          },
        );
        setTournament(res.data);
      } catch (err) {
        console.error("Error loading tournament:", err);
        setTournament(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

  const fetchApprovedPlayers = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/ctms/api/waiting-list?tournamentId=${id}`,
        { withCredentials: true },
      );
      const rows = res.data?.data || [];
      setApprovedPlayers(rows.filter((r) => r.status === "Approved"));
      setWaitingPlayers(
        rows.filter((r) => String(r.status || "").toLowerCase() !== "approved"),
      );
    } catch (err) {
      console.error("Error loading approved players:", err);
      setApprovedPlayers([]);
      setWaitingPlayers([]);
    }
  };

  useEffect(() => {
    fetchApprovedPlayers();
  }, [id]);

  const tabs = [
    { label: "Overview", icon: <LayoutDashboard size={18} /> },
    { label: "Participants", icon: <Users2 size={18} /> },
    { label: "Bracket & Schedule", icon: <GitBranch size={18} /> },
    { label: "Referees", icon: <ShieldCheck size={18} /> },
    { label: "Reports", icon: <FileText size={18} /> },
  ];

  if (loading) {
    return <div className="td-page-wrapper">Loading tournament...</div>;
  }

  if (!tournament) {
    return <div className="td-page-wrapper">Tournament not found</div>;
  }

  return (
    <div className="td-page-wrapper">
      {/* HERO */}
      <section className="td-hero">
        <div className="td-hero-content">
          <div className="td-hero-badges">
            <Badge variant="teal">{tournament.format}</Badge>
            <Badge variant="orange">{tournament.status}</Badge>
          </div>

          <h1 className="td-hero-title">{tournament.tournamentName}</h1>

          <div className="td-hero-meta">
            <div className="td-meta-item">
              <Calendar size={18} />
              <span>
                {tournament.startDate} — {tournament.endDate}
              </span>
            </div>
            <div className="td-meta-item">
              <MapPin size={18} />
              <span>{tournament.location}</span>
            </div>
          </div>
        </div>

        <div className="td-hero-actions">
          <button className="td-btn-primary">
            <Edit2 size={18} />
            Edit Tournament
          </button>
          <button className="td-btn-danger">
            <Trash2 size={20} />
          </button>
        </div>
      </section>

      {/* STATS */}
      <section className="td-stats-row">
        <StatCard
          label="Waiting List"
          value={`${waitingPlayers.length}`}
          icon={<Users />}
          accent="indigo"
          onClick={() => navigate(`/tournaments/${id}/waiting-list`)}
        />
        <StatCard
          label="Total Matches"
          value="256"
          icon={<GitBranch />}
          accent="purple"
        />
        <StatCard
          label="Active Round"
          value="03"
          icon={<Trophy />}
          accent="amber"
        />
      </section>

      {/* Tab Interface */}
      <section className="td-tabs-section">
        <div className="td-tabs-header">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              className={`td-tab-button ${activeTab === idx ? "active" : ""}`}
            >
              <span className="td-tab-icon">{tab.icon}</span>
              <span className="td-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="td-tab-content">
          {activeTab === 0 && <OverviewTab tournament={tournament} />}
          {activeTab === 1 && (
            <ParticipantsTab tournamentId={tournament.tournamentId} />
          )}
          {activeTab === 2 && <BracketTab />}
          {activeTab === 3 && <RefereeTab />}
          {activeTab === 4 && <ReportsTab />}
        </div>
      </section>
    </div>
  );
};

// --- Tab Partial Components ---

const OverviewTab = ({ tournament }) => {
  return (
    <div className="td-overview-tab">
      {/* Top Stats */}
      <div className="td-overview-stats">
        <div className="td-overview-card">
          <span className="td-overview-label">Total Players</span>
          <strong className="td-overview-value">{tournament.maxPlayer}</strong>
        </div>

        <div className="td-overview-card">
          <span className="td-overview-label">Rounds</span>
          <strong className="td-overview-value">7</strong>
        </div>

        <div className="td-overview-card">
          <span className="td-overview-label">Prize Pool</span>
          <strong className="td-overview-value">${tournament.prizePool}</strong>
        </div>

        <div className="td-overview-card highlight">
          <span className="td-overview-label">Status</span>
          <strong className="td-overview-value">{tournament.status}</strong>
        </div>
      </div>

      {/* Tournament Description */}
      <div className="td-overview-section">
        <h3>About Tournament</h3>
        <p>{tournament.description}</p>
      </div>

      {/* Schedule */}
      <div className="td-overview-section">
        <h3>Schedule Overview</h3>

        <ul className="td-schedule-list">
          <li>
            <span>Registration Deadline</span>
            <strong>{tournament.registrationDeadline}</strong>
          </li>
          <li>
            <span>Opening Ceremony</span>
            <strong>15 March 2026</strong>
          </li>
          <li>
            <span>Final Round</span>
            <strong>22 March 2026</strong>
          </li>
        </ul>
      </div>
    </div>
  );
};

const ParticipantsTab = ({ tournamentId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/ctms/api/waiting-list?tournamentId=${tournamentId}`,
        { withCredentials: true },
      );
      setRows(res.data?.data || []);
    } catch (err) {
      console.error("Error loading participants:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [tournamentId]);

  const filteredRows = rows.filter((r) => {
    if (String(r.status || "").toLowerCase() !== "approved") return false;
    const matchesEmail = (r.registrationEmail || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const rank = Number(r.rankAtRegistration ?? 0);
    const matchesRank = (() => {
      if (!rankFilter) return true;
      if (rankFilter === "lt1000") return rank < 1000;
      if (rankFilter === "1000-1199") return rank >= 1000 && rank <= 1199;
      if (rankFilter === "1200-1399") return rank >= 1200 && rank <= 1399;
      if (rankFilter === "1400-1599") return rank >= 1400 && rank <= 1599;
      if (rankFilter === "ge1600") return rank >= 1600;
      return true;
    })();
    return matchesEmail && matchesRank;
  });

  return (
    <div className="td-players-tab">
      <div className="td-players-header">
        <div className="td-players-search">
          <Search className="td-players-search-icon" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm bằng email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="td-players-actions">
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#f1f5f9",
                borderRadius: 12,
                padding: "8px 12px",
              }}
            >
              <Filter size={16} />
              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontWeight: 700,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                <option value="">Tất cả mốc rank</option>
                <option value="lt1000">Dưới 1000</option>
                <option value="1000-1199">1000 - 1199</option>
                <option value="1200-1399">1200 - 1399</option>
                <option value="1400-1599">1400 - 1599</option>
                <option value="ge1600">Từ 1600 trở lên</option>
              </select>
            </div>
            <button
              className="td-btn td-btn-secondary"
              onClick={() => {
                setSearchTerm("");
                setRankFilter("");
              }}
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      <div className="td-players-table-wrapper">
        <table className="td-players-table">
          <thead>
            <tr>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Họ và tên
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Tên in-game
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Email
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                SĐT
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Rank
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Thời điểm đăng ký
              </th>
              <th style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}>
                Trạng thái
              </th>
              <th
                className="text-right"
                style={{ fontWeight: 800, color: "#0f172a", opacity: 1 }}
              >
                Ghi chú
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Loading participants...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8}>No approved participants found.</td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.waitingId}>
                  <td>{row.registrationFullName || "-"}</td>
                  <td>{row.registrationUsername || "-"}</td>
                  <td>{row.registrationEmail || "-"}</td>
                  <td>{row.registrationPhone || "-"}</td>
                  <td>{row.rankAtRegistration ?? "-"}</td>
                  <td>
                    {row.registrationDate
                      ? new Date(row.registrationDate).toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td>{row.status || "-"}</td>
                  <td className="text-right">{row.note || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BracketTab = () => {
  return (
    <div className="td-bracket-grid">
      {/* LEFT – BRACKET */}
      <div className="td-bracket-card">
        <div className="td-bracket-header">
          <h3>Live Bracket Visualization</h3>
          <button className="td-bracket-fullscreen">
            Fullscreen <ArrowRight size={14} />
          </button>
        </div>

        <div className="td-bracket-body">
          <div className="td-bracket-column">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="td-bracket-item">
                <div className="td-line primary"></div>
                <div className="td-line secondary"></div>
              </div>
            ))}
          </div>

          <div className="td-bracket-column mid">
            {[1, 2].map((i) => (
              <div key={i} className="td-bracket-item mid">
                <div className="td-line primary"></div>
                <div className="td-line secondary"></div>
              </div>
            ))}
          </div>

          <div className="td-bracket-winner">
            <div className="td-winner-card">
              <Trophy size={32} />
              <div className="td-line winner"></div>
            </div>
          </div>
        </div>

        {/* HOVER OVERLAY */}
        <div className="td-bracket-overlay">
          <div className="td-overlay-card">
            <GitBranch size={48} />
            <h4>Bracket Interactive</h4>
            <p>
              The bracket is currently view-only. Start Round 4 to enable
              real-time updates.
            </p>
            <button>Enter Management View</button>
          </div>
        </div>
      </div>

      {/* RIGHT – MATCH LIST */}
      <div className="td-match-list">
        <div className="td-match-header">
          <h3>Featured Matchups</h3>
          <Badge variant="blue">3 Live Matches</Badge>
        </div>
      </div>
    </div>
  );
};

const RefereeTab = () => {
  return (
    <div className="td-referee-grid">
      {/* ADD REFEREE */}
      <div className="td-referee-add">
        <div className="td-add-icon">
          <UserPlus size={32} />
        </div>
        <h4>Recruit Referee</h4>
        <p>
          Onboard a certified <br /> arbiter for this event
        </p>
      </div>
    </div>
  );
};

const ReportsTab = () => (
  <div className="td-reports-card">
    {/* Header */}
    <div className="td-reports-header">
      <div>
        <h3>Documentation Center</h3>
        <p>Audit logs, performance reviews and match data.</p>
      </div>

      <button className="td-export-btn">
        <Download size={20} />
        Export Final Ledger
      </button>
    </div>

    {/* Table */}
    <div className="td-reports-table-wrapper">
      <table className="td-reports-table">
        <thead>
          <tr>
            <th>Document Identity</th>
            <th>Authority</th>
            <th>Timestamp</th>
            <th>Validation</th>
            <th className="right">Action</th>
          </tr>
        </thead>

        <tbody></tbody>
      </table>
    </div>

    {/* Footer CTA */}
    <div className="td-reports-footer">
      <div className="td-footer-box">
        <div className="td-footer-icon">
          <AlertCircle size={32} />
        </div>

        <h4>Custom Analytics Engine</h4>
        <p>
          Need deep insights into player performance or fair play metrics? Our
          AI-driven engine can generate a specialized 30-page audit in under 5
          minutes.
        </p>

        <button className="td-audit-btn">
          Run Advanced Audit <ArrowRight size={14} />
        </button>
      </div>
    </div>
  </div>
);

export default TournamentDetail;
