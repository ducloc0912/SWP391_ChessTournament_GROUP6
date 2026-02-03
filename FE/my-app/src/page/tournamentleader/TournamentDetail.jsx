import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
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
} from 'lucide-react';

const Badge = ({ children, variant }) => (
  <span className={`badge badge-${variant}`}>
    {children}
  </span>
);

const StatCard = ({ label, value, icon, accent }) => (
  <div className="stat-card">
    <div className={`stat-icon ${accent}`}>
      {icon}
    </div>
    <div className="stat-content">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
);

const TournamentDetail = () => {
  const { id } = useParams(); // lấy tournamentId từ URL
  const [activeTab, setActiveTab] = useState(0);

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/ctms/api/tournaments?id=${id}`);
        setTournament(res.data);
      } catch (err) {
        console.error('Error loading tournament:', err);
        setTournament(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

  const tabs = [
    { label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { label: 'Players', icon: <Users2 size={18} /> },
    { label: 'Bracket & Schedule', icon: <GitBranch size={18} /> },
    { label: 'Referees', icon: <ShieldCheck size={18} /> },
    { label: 'Reports', icon: <FileText size={18} /> },
  ];

  if (loading) {
  return <div className="page-wrapper">Loading tournament...</div>;
  }

  if (!tournament) {
    return <div className="page-wrapper">Tournament not found</div>;
  }

  return (
    <div className="page-wrapper">

      {/* HERO */}
      <section className="tournament-hero">
        <div className="hero-content">
          <div className="hero-badges">
            <Badge variant="teal">{tournament.format}</Badge>
            <Badge variant="orange">{tournament.status}</Badge>
          </div>

          <h1 className="hero-title">
            {tournament.tournamentName}
          </h1>

          <div className="hero-meta">
            <div className="meta-item">
              <Calendar size={18} />
              <span>
                {tournament.startDate} — {tournament.endDate}
              </span>
            </div>
            <div className="meta-item">
              <MapPin size={18} />
              <span>
                {tournament.location}
              </span>
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <button className="btn-primary">
            <Edit2 size={18} />
            Edit Tournament
</button>
          <button className="btn-danger">
            <Trash2 size={20} />
          </button>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-row">
        <StatCard
            label="Participants"
            value={`${tournament.currentPlayers}/${tournament.maxPlayer}`}
            icon={<Users />}
            accent="indigo"
          />
        <StatCard label="Total Matches" value="256" icon={<GitBranch />} accent="purple" />
        <StatCard label="Active Round" value="03" icon={<Trophy />} accent="amber" />
      </section>

        {/* Tab Interface */}
      <section className="tabs-section">
        <div className="tabs-header">
            {tabs.map((tab, idx) => (
            <button
                key={tab.label}
                onClick={() => setActiveTab(idx)}
                className={`tab-button ${activeTab === idx ? 'active' : ''}`}
            >
                <span className="tab-icon">
                {tab.icon}
                </span>
                <span className="tab-label">{tab.label}</span>
            </button>
            ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
            {activeTab === 0 && <OverviewTab tournament={tournament} />}
            {activeTab === 1 && <PlayersTab tournamentId={tournament.tournamentId} />}
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
    <div className="overview-tab">

      {/* Top Stats */}
      <div className="overview-stats">
        <div className="stat-card">
          <span className="stat-label">Total Players</span>
          <strong className="stat-value">{tournament.maxPlayer}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Rounds</span>
          <strong className="stat-value">7</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Prize Pool</span>
          <strong className="stat-value">${tournament.prizePool}</strong>
        </div>

        <div className="stat-card highlight">
          <span className="stat-label">Status</span>
          <strong className="stat-value">{tournament.status}</strong>
        </div>
      </div>

      {/* Tournament Description */}
      <div className="overview-section">
        <h3>About Tournament</h3>
        <p>
          {tournament.description}
        </p>
      </div>

      {/* Schedule */}
      <div className="overview-section">
        <h3>Schedule Overview</h3>

        <ul className="schedule-list">
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

const PlayersTab = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="players-tab">
      <div className="players-tab__header">
        <div className="players-search">
          <Search className="players-search__icon" size={18} />
          <input
            type="text"
            placeholder="Search players by name or rating..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="players-actions">
          <button className="btn btn-secondary">
            <Filter size={16} /> Filter
          </button>
          <button className="btn btn-primary">
            <Plus size={18} /> Add New Player
          </button>
        </div>
      </div>

      <div className="players-table-wrapper">
        <table className="players-table">
          <thead>
            <tr>
              <th>Player Identity</th>
              <th>FIDE Rating</th>
              <th>Registration</th>
              <th>Check-In</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          
        </table>
      </div>
    </div>
  );
};

const BracketTab = () => {
  return (
    <div className="bracket-grid">
      
      {/* LEFT – BRACKET */}
      <div className="bracket-card">
        <div className="bracket-header">
          <h3>Live Bracket Visualization</h3>
          <button className="bracket-fullscreen">
            Fullscreen <ArrowRight size={14} />
          </button>
        </div>

        <div className="bracket-body">
          
          <div className="bracket-column">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bracket-item">
                <div className="line primary"></div>
                <div className="line secondary"></div>
              </div>
            ))}
          </div>

          <div className="bracket-column mid">
            {[1, 2].map(i => (
              <div key={i} className="bracket-item mid">
                <div className="line primary"></div>
                <div className="line secondary"></div>
              </div>
            ))}
          </div>

          <div className="bracket-winner">
            <div className="winner-card">
              <Trophy size={32} />
              <div className="line winner"></div>
            </div>
          </div>

        </div>

        {/* HOVER OVERLAY */}
        <div className="bracket-overlay">
          <div className="overlay-card">
            <GitBranch size={48} />
            <h4>Bracket Interactive</h4>
            <p>
              The bracket is currently view-only. Start Round 4 to enable real-time updates.
            </p>
<button>Enter Management View</button>
          </div>
        </div>
      </div>

      {/* RIGHT – MATCH LIST */}
      <div className="match-list">
        <div className="match-header">
          <h3>Featured Matchups</h3>
          <Badge color="blue">3 Live Matches</Badge>
        </div>

      </div>

    </div>
  );
};

const RefereeTab = () => {
  return (
    <div className="referee-grid">
      

      {/* ADD REFEREE */}
      <div className="referee-add">
        <div className="add-icon">
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
  <div className="reports-card">
    {/* Header */}
    <div className="reports-header">
      <div>
        <h3>Documentation Center</h3>
        <p>Audit logs, performance reviews and match data.</p>
      </div>

      <button className="export-btn">
        <Download size={20} />
        Export Final Ledger
      </button>
    </div>

    {/* Table */}
    <div className="reports-table-wrapper">
      <table className="reports-table">
        <thead>
          <tr>
            <th>Document Identity</th>
            <th>Authority</th>
            <th>Timestamp</th>
            <th>Validation</th>
            <th className="right">Action</th>
          </tr>
        </thead>

        <tbody>
          
        </tbody>
      </table>
    </div>

    {/* Footer CTA */}
    <div className="reports-footer">
      <div className="footer-box">
        <div className="footer-icon">
          <AlertCircle size={32} />
        </div>

        <h4>Custom Analytics Engine</h4>
        <p>
          Need deep insights into player performance or fair play metrics?
          Our AI-driven engine can generate a specialized 30-page audit
          in under 5 minutes.
        </p>

        <button className="audit-btn">
          Run Advanced Audit <ArrowRight size={14} />
        </button>
      </div>
    </div>
  </div>
);

export default TournamentDetail;
