import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../assets/css/tournament-leader.css';
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
  <span className={`td-badge td-badge-${variant}`}>
    {children}
  </span>
);

const StatCard = ({ label, value, icon, accent }) => (
  <div className="td-stat-card">
    <div className={`td-stat-icon ${accent}`}>
      {icon}
    </div>
    <div className="td-stat-content">
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
        const res = await axios.get(`http://localhost:8080/ctms/api/tournaments?id=${id}`, {
          withCredentials: true
        });
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

          <h1 className="td-hero-title">
            {tournament.tournamentName}
          </h1>

          <div className="td-hero-meta">
            <div className="td-meta-item">
              <Calendar size={18} />
              <span>
                {tournament.startDate} — {tournament.endDate}
              </span>
            </div>
            <div className="td-meta-item">
              <MapPin size={18} />
              <span>
                {tournament.location}
              </span>
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
            label="Participants"
            value={`${tournament.currentPlayers}/${tournament.maxPlayer}`}
            icon={<Users />}
            accent="indigo"
          />
        <StatCard label="Total Matches" value="256" icon={<GitBranch />} accent="purple" />
        <StatCard label="Active Round" value="03" icon={<Trophy />} accent="amber" />
      </section>

        {/* Tab Interface */}
      <section className="td-tabs-section">
        <div className="td-tabs-header">
            {tabs.map((tab, idx) => (
            <button
                key={tab.label}
                onClick={() => setActiveTab(idx)}
                className={`td-tab-button ${activeTab === idx ? 'active' : ''}`}
            >
                <span className="td-tab-icon">
                {tab.icon}
                </span>
                <span className="td-tab-label">{tab.label}</span>
            </button>
            ))}
        </div>

        {/* Tab Content */}
        <div className="td-tab-content">
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
        <p>
          {tournament.description}
        </p>
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

const PlayersTab = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="td-players-tab">
      <div className="td-players-header">
        <div className="td-players-search">
          <Search className="td-players-search-icon" size={18} />
          <input
            type="text"
            placeholder="Search players by name or rating..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="td-players-actions">
          <button className="td-btn td-btn-secondary">
            <Filter size={16} /> Filter
          </button>
          <button className="td-btn td-btn-primary">
            <Plus size={18} /> Add New Player
          </button>
        </div>
      </div>

      <div className="td-players-table-wrapper">
        <table className="td-players-table">
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
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="td-bracket-item">
                <div className="td-line primary"></div>
                <div className="td-line secondary"></div>
              </div>
            ))}
          </div>

          <div className="td-bracket-column mid">
            {[1, 2].map(i => (
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
              The bracket is currently view-only. Start Round 4 to enable real-time updates.
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

        <tbody>
          
        </tbody>
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
          Need deep insights into player performance or fair play metrics?
          Our AI-driven engine can generate a specialized 30-page audit
          in under 5 minutes.
        </p>

        <button className="td-audit-btn">
          Run Advanced Audit <ArrowRight size={14} />
        </button>
      </div>
    </div>
  </div>
);

export default TournamentDetail;
