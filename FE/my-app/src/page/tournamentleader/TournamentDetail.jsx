import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../assets/css/tokens.css";
import "../../assets/css/components/card.css";
import "../../assets/css/components/button.css";
import "../../assets/css/tournament-leader.css";
import "../../assets/css/tournament-leader/TournamentSetupTab.css";
import {
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
  MoreVertical,
  AlertCircle,
  Eye,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/ctms";

const Badge = ({ children, variant }) => (
  <span className={`td-badge td-badge-${variant}`}>{children}</span>
);

const TournamentDetail = () => {
  const { id } = useParams(); // lấy tournamentId từ URL
  const [activeTab, setActiveTab] = useState(0);

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [approvedPlayers, setApprovedPlayers] = useState([]);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [approvedSearch, setApprovedSearch] = useState("");

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

  const fetchParticipants = async () => {
    setLoadingApproved(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/tournaments?action=setupParticipants&id=${id}`,
        { withCredentials: true },
      );
      const rows = Array.isArray(res.data) ? res.data : [];
      setApprovedPlayers(rows);
    } catch (err) {
      console.error("Error loading participants:", err);
      setApprovedPlayers([]);
    } finally {
      setLoadingApproved(false);
    }
  };

  const openApprovedModal = async () => {
    setShowApprovedModal(true);
    await fetchParticipants();
  };

  useEffect(() => {
    fetchParticipants();
  }, [id]);

  const filteredApprovedPlayers = approvedPlayers.filter((p) => {
    const keyword = approvedSearch.trim().toLowerCase();
    if (!keyword) return true;
    const name = String(p.fullName || p.registrationFullName || "").toLowerCase();
    const email = String(p.email || p.registrationEmail || "").toLowerCase();
    const userId = String(p.userId ?? p.user_id ?? "");
    return (
      name.includes(keyword) ||
      email.includes(keyword) ||
      userId.includes(keyword)
    );
  });

  const tabs = [
    { label: "Overview", icon: <LayoutDashboard size={18} /> },
    { label: "Waiting List", icon: <Users2 size={18} /> },
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

  const resolveMediaUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (
      raw.startsWith("http://") ||
      raw.startsWith("https://") ||
      raw.startsWith("data:") ||
      raw.startsWith("blob:")
    ) {
      return raw;
    }
    if (raw.startsWith("/")) return `${API_BASE}${raw}`;
    return `${API_BASE}/${raw}`;
  };

  const heroBannerUrl = resolveMediaUrl(
    tournament.tournamentImage || tournament.tournament_image,
  );

  return (
    <div className="td-page-wrapper">
      {/* HERO */}
      <section
        className={`td-hero ${heroBannerUrl ? "has-image" : ""}`}
        style={
          heroBannerUrl
            ? {
                backgroundImage: `linear-gradient(90deg, rgba(8, 13, 20, 0.82) 0%, rgba(8, 13, 20, 0.56) 44%, rgba(8, 13, 20, 0.32) 100%), url("${heroBannerUrl}")`,
              }
            : undefined
        }
      >
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
          <button className="td-btn-primary ui-btn ui-btn-primary">
            <Edit2 size={18} />
            Edit Tournament
          </button>
          <button className="td-btn-danger ui-btn ui-btn-danger ui-btn-icon">
            <Trash2 size={20} />
          </button>
        </div>

        <button className="td-hero-participants" onClick={openApprovedModal}>
          <Users2 size={16} />
          <span>{approvedPlayers.length}/{tournament.maxPlayer}</span>
          <small>Participants</small>
        </button>
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
            <WaitingListTab
              tournamentId={tournament.tournamentId}
              onApprovedChanged={fetchParticipants}
            />
          )}
          {activeTab === 2 && (
            <BracketTab
              tournamentId={tournament.tournamentId}
              tournamentFormat={tournament.format}
              approvedPlayers={approvedPlayers}
            />
          )}
          {activeTab === 3 && <RefereeTab />}
          {activeTab === 4 && <ReportsTab />}
        </div>
      </section>

      {showApprovedModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowApprovedModal(false)}
        >
          <div
            className="modal td-modal-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Danh sách Participants</h3>

            <div className="td-modal-toolbar">
              <input
                type="text"
                placeholder="Tìm theo tên, email, user id..."
                className="td-modal-input"
                value={approvedSearch}
                onChange={(e) => setApprovedSearch(e.target.value)}
              />
              <button
                className="btn-cancel ui-btn ui-btn-secondary td-btn-strong td-btn-nowrap"
                onClick={() => {
                  setApprovedSearch("");
                }}
              >
                Xóa lọc
              </button>
            </div>

            <div className="td-modal-table-wrap">
              <table className="td-players-table">
                <thead>
                  <tr>
                    <th className="td-table-head-strong">STT</th>
                    <th className="td-table-head-strong">Họ và tên</th>
                    <th className="td-table-head-strong">User ID</th>
                    <th className="td-table-head-strong">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingApproved ? (
                    <tr>
                      <td colSpan={4}>Đang tải...</td>
                    </tr>
                  ) : filteredApprovedPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={4}>Chưa có participant nào.</td>
                    </tr>
                  ) : (
                    filteredApprovedPlayers.map((p, idx) => (
                      <tr key={`participant-${p.userId ?? p.user_id ?? idx}`}>
                        <td>{idx + 1}</td>
                        <td>{p.fullName || p.registrationFullName || "-"}</td>
                        <td>{p.userId ?? p.user_id ?? "-"}</td>
                        <td>{p.email || p.registrationEmail || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel ui-btn ui-btn-secondary td-btn-strong"
                onClick={() => setShowApprovedModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Tab Partial Components ---

const OverviewTab = ({ tournament }) => {
  return (
    <div className="td-overview-tab">
      {/* Top Stats */}
      <div className="td-overview-stats">
        <div className="td-overview-card ui-card ui-card-flat">
          <span className="td-overview-label">Total Players</span>
          <strong className="td-overview-value">{tournament.maxPlayer}</strong>
        </div>

        <div className="td-overview-card ui-card ui-card-flat">
          <span className="td-overview-label">Rounds</span>
          <strong className="td-overview-value">7</strong>
        </div>

        <div className="td-overview-card ui-card ui-card-flat">
          <span className="td-overview-label">Prize Pool</span>
          <strong className="td-overview-value">${tournament.prizePool}</strong>
        </div>

        <div className="td-overview-card highlight ui-card ui-card-flat">
          <span className="td-overview-label">Status</span>
          <div className="td-overview-status-chip">{tournament.status}</div>
        </div>
      </div>

      {/* Tournament Description */}
      <div className="td-overview-section ui-card ui-card-flat">
        <h3>About Tournament</h3>
        <p>{tournament.description}</p>
      </div>

      {/* Schedule */}
      <div className="td-overview-section ui-card ui-card-flat">
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

const WaitingListTab = ({ tournamentId, onApprovedChanged }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTarget, setViewTarget] = useState(null);
  const [banner, setBanner] = useState(null);

  const fetchWaitingList = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/ctms/api/waiting-list?tournamentId=${tournamentId}`,
        { withCredentials: true },
      );
      setRows(res.data?.data || []);
    } catch (err) {
      console.error("Error loading waiting list:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingList();
  }, [tournamentId]);

  const filteredRows = rows.filter((r) => {
    if (String(r.status || "").toLowerCase() === "approved") return false;
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

  const handleView = (row) => {
    setViewTarget(row);
  };

  const handleApprove = async (row) => {
    try {
      const res = await axios.put(
        `http://localhost:8080/ctms/api/waiting-list?id=${row.waitingId}&action=approve`,
        {},
        { withCredentials: true },
      );
      setBanner({
        type: "success",
        text: res?.data?.message || "Duyệt thành công",
      });
      await fetchWaitingList();
      if (typeof onApprovedChanged === "function") {
        await onApprovedChanged();
      }
    } catch (err) {
      setBanner({
        type: "error",
        text: err?.response?.data?.message || "Duyệt thất bại",
      });
    }
  };

  const handleDelete = async (row) => {
    try {
      const res = await axios.delete(
        `http://localhost:8080/ctms/api/waiting-list?id=${row.waitingId}`,
        { withCredentials: true },
      );
      setBanner({
        type: "success",
        text: res?.data?.message || "Xóa thành công",
      });
      await fetchWaitingList();
      if (typeof onApprovedChanged === "function") {
        await onApprovedChanged();
      }
    } catch (err) {
      setBanner({
        type: "error",
        text: err?.response?.data?.message || "Xóa thất bại",
      });
    }
  };

  return (
    <div className="td-players-tab ui-card ui-card-flat">
      {banner && (
        <div className={`td-banner ${banner.type === "success" ? "ok" : "error"}`}>
          {banner.text}
        </div>
      )}
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
          <div className="td-inline-row">
            <div className="td-filter-chip">
              <Filter size={16} />
              <select
                className="td-filter-chip-select"
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
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
              className="td-btn td-btn-secondary ui-btn ui-btn-secondary td-btn-strong"
              onClick={() => {
                setSearchTerm("");
                setRankFilter("");
              }}
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
                    <th className="td-table-head-strong">Họ và tên</th>
                    <th className="td-table-head-strong">Tên in-game</th>
                    <th className="td-table-head-strong">Email</th>
                    <th className="td-table-head-strong">SĐT</th>
                    <th className="td-table-head-strong">Rank</th>
                    <th className="td-table-head-strong">Thời điểm đăng ký</th>
                    <th className="td-table-head-strong">Trạng thái</th>
                    <th className="text-right td-table-head-strong">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Loading waiting list...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8}>No waiting players found.</td>
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
                  <td className="text-right">
                    <div className="td-inline-actions">
                      <button
                        className="td-icon-ghost-btn"
                        onClick={() => handleView(row)}
                        title="Xem"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="td-icon-ghost-btn"
                        onClick={() => handleDelete(row)}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="td-icon-ghost-btn"
                        onClick={() => handleApprove(row)}
                        title="Duyệt"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewTarget && (
        <div className="modal-overlay" onClick={() => setViewTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Thông tin người chơi</h3>
            <p>
              <strong className="td-view-label">Họ và tên:</strong>{" "}
              <span className="td-view-value">
                {viewTarget.registrationFullName || "-"}
              </span>
            </p>
            <p>
              <strong className="td-view-label">Tên in-game:</strong>{" "}
              <span className="td-view-value">
                {viewTarget.registrationUsername || "-"}
              </span>
            </p>
            <p>
              <strong className="td-view-label">Email:</strong>{" "}
              <span className="td-view-value">
                {viewTarget.registrationEmail || "-"}
              </span>
            </p>
            <p>
              <strong className="td-view-label">SĐT:</strong>{" "}
              <span className="td-view-value">
                {viewTarget.registrationPhone || "-"}
              </span>
            </p>
            <p>
              <strong className="td-view-label">Rank:</strong>{" "}
              <span className="td-view-value">
                {viewTarget.rankAtRegistration ?? "-"}
              </span>
            </p>
            <p>
              <strong className="td-view-label">Thời điểm đăng ký:</strong>{" "}
              <span className="td-view-value">
                {viewTarget.registrationDate
                  ? new Date(viewTarget.registrationDate).toLocaleString("vi-VN")
                  : "-"}
              </span>
            </p>
            <p>
              <strong className="td-view-label">Trạng thái:</strong>{" "}
              <span className="td-view-value">
                {viewTarget.status || "-"}
              </span>
            </p>

            <div className="modal-actions">
              <button
                className="btn-cancel ui-btn ui-btn-secondary td-btn-strong"
                onClick={() => setViewTarget(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BracketTab = ({ tournamentId, tournamentFormat, approvedPlayers = [] }) => {
  const normalizeFormat = (value) => {
    const raw = String(value || "").trim().toLowerCase().replace(/[\s_]/g, "");
    if (raw === "roundrobin") return "RoundRobin";
    if (raw === "knockout") return "KnockOut";
    if (raw === "hybrid") return "Hybrid";
    return "RoundRobin";
  };

  const effectiveFormat = normalizeFormat(tournamentFormat);
  const stageOptions =
    effectiveFormat === "Hybrid"
      ? ["RoundRobin", "KnockOut"]
      : [effectiveFormat];

  const toDateTimeLocal = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const toSqlDateTime = (value) => {
    if (!value) return null;
    const normalized = value.replace("T", " ");
    return normalized.length === 16 ? `${normalized}:00` : normalized;
  };

  const availablePlayers = useMemo(() => {
    const seen = new Set();
    return approvedPlayers
      .map((p) => ({
        userId: Number(p.userId ?? p.user_id),
        fullName:
          p.fullName ||
          p.registrationFullName ||
          `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
          p.email ||
          p.registrationEmail ||
          "Unknown",
        email: p.email || p.registrationEmail || "",
        rank: Number(p.rankAtRegistration ?? p.eloRating ?? 0),
      }))
      .filter((p) => Number.isInteger(p.userId) && p.userId > 0)
      .filter((p) => {
        if (seen.has(p.userId)) return false;
        seen.add(p.userId);
        return true;
      });
  }, [approvedPlayers]);

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupMode, setSetupMode] = useState(null);
  const [laneStep, setLaneStep] = useState("structure");
  const [serverSetupStep, setServerSetupStep] = useState("STRUCTURE");
  const [serverBanner, setServerBanner] = useState(null);
  const [rowErrors, setRowErrors] = useState({});

  useEffect(() => {
    let mounted = true;
    const loadSchedule = async () => {
      try {
        setLoadingRows(true);
        const [res, stateRes] = await Promise.all([
          axios.get(
            `${API_BASE}/api/tournaments?action=schedule&id=${tournamentId}`,
            { withCredentials: true },
          ),
          axios.get(
            `${API_BASE}/api/tournaments?action=setupState&id=${tournamentId}`,
            { withCredentials: true },
          ),
        ]);
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const step = String(stateRes?.data?.step || "STRUCTURE").toUpperCase();
        setServerSetupStep(step);
        if (step === "PLAYERS") setLaneStep("players");
        if (step === "SCHEDULE" || step === "COMPLETED") setLaneStep("schedule");
        setRows(
          list.map((m, idx) => ({
            id: `sv-${m.matchId || idx + 1}`,
            stage: m.stage || stageOptions[0] || "RoundRobin",
            roundName: m.roundName || "",
            roundIndex: Number(m.roundIndex || 1),
            boardNumber: Number(m.boardNumber || idx + 1),
            whitePlayerId: String(m.whitePlayerId ?? ""),
            blackPlayerId: String(m.blackPlayerId ?? ""),
            startTime: toDateTimeLocal(m.startTime),
          })),
        );
      } catch (err) {
        console.error("Load schedule error:", err);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoadingRows(false);
      }
    };
    if (tournamentId) {
      loadSchedule();
    }
    return () => {
      mounted = false;
    };
  }, [tournamentId]);

  const makeRow = ({
    stage,
    roundIndex,
    boardNumber,
    whitePlayerId = "",
    blackPlayerId = "",
    roundName = "",
    startTime = "",
  }) => ({
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stage: stage || stageOptions[0] || "RoundRobin",
    roundName,
    roundIndex: Number(roundIndex || 1),
    boardNumber: Number(boardNumber || 1),
    whitePlayerId: String(whitePlayerId || ""),
    blackPlayerId: String(blackPlayerId || ""),
    startTime,
  });

  const sortRows = (list = []) =>
    [...list].sort((a, b) => {
      const byRound = Number(a.roundIndex || 0) - Number(b.roundIndex || 0);
      if (byRound !== 0) return byRound;
      return Number(a.boardNumber || 0) - Number(b.boardNumber || 0);
    });

  const groupRowsByRound = (list = []) => {
    const grouped = list.reduce((acc, row) => {
      const key = Number(row.roundIndex || 1);
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([roundIndex, matches]) => ({
        roundIndex: Number(roundIndex),
        matches: sortRows(matches),
      }))
      .sort((a, b) => a.roundIndex - b.roundIndex);
  };

  const stageRows = useMemo(() => {
    const rrRows = sortRows(rows.filter((r) => r.stage === "RoundRobin"));
    const koRows = sortRows(rows.filter((r) => r.stage === "KnockOut"));
    const nativeRows = sortRows(
      rows.filter((r) => stageOptions.includes(r.stage || effectiveFormat)),
    );
    return {
      roundRobinRounds: groupRowsByRound(rrRows),
      knockOutRounds: groupRowsByRound(koRows),
      nativeRounds: groupRowsByRound(nativeRows),
    };
  }, [rows, effectiveFormat]);

  const validateStructureRows = () => {
    const errors = [];
    if (rows.length === 0) {
      errors.push("Bạn chưa tạo structure bracket nào.");
      return errors;
    }
    rows.forEach((row, idx) => {
      const stage = row.stage || stageOptions[0];
      const roundIndex = Number(row.roundIndex || 1);
      const boardNumber = Number(row.boardNumber || 1);
      if (!stageOptions.includes(stage)) {
        errors.push(`Dòng ${idx + 1}: Stage không hợp lệ với thể thức hiện tại.`);
      }
      if (roundIndex <= 0) {
        errors.push(`Dòng ${idx + 1}: Round index phải >= 1.`);
      }
      if (boardNumber <= 0) {
        errors.push(`Dòng ${idx + 1}: Board number phải >= 1.`);
      }
    });
    return errors;
  };

  const validateRows = () => {
    const errors = [];
    const count = availablePlayers.length;
    const playerSet = new Set(availablePlayers.map((p) => p.userId));

    if (effectiveFormat === "RoundRobin" && (count < 4 || count > 10)) {
      errors.push("Round Robin yêu cầu từ 4 đến 10 người chơi đã được duyệt.");
    }
    if (effectiveFormat === "KnockOut" && (count < 8 || count > 32)) {
      errors.push("Knock Out yêu cầu từ 8 đến 32 người chơi đã được duyệt.");
    }
    if (effectiveFormat === "Hybrid" && (count < 8 || count > 32)) {
      errors.push("Hybrid yêu cầu từ 8 đến 32 người chơi đã được duyệt.");
    }
    if (rows.length === 0) {
      errors.push("Bạn chưa xếp cặp đấu nào.");
      return errors;
    }

    let hasRr = false;
    let hasKo = false;
    const rrPairs = new Set();
    const koRoundSlots = new Set();

    rows.forEach((row, idx) => {
      const stage = row.stage || stageOptions[0];
      const white = Number(row.whitePlayerId);
      const black = Number(row.blackPlayerId);
      const roundIndex = Number(row.roundIndex || 1);

      if (!stageOptions.includes(stage)) {
        errors.push(`Dòng ${idx + 1}: Stage không hợp lệ với thể thức hiện tại.`);
      }
      const hasWhite = Number.isInteger(white) && white > 0;
      const hasBlack = Number.isInteger(black) && black > 0;
      if (stage === "RoundRobin") {
        if (!hasWhite || !hasBlack) {
          errors.push(`Dòng ${idx + 1}: Thiếu người chơi trắng/đen.`);
          return;
        }
      } else if (stage === "KnockOut") {
        // KO round sau có thể chưa biết người thắng nên được phép để trống cả 2.
        if ((hasWhite && !hasBlack) || (!hasWhite && hasBlack)) {
          errors.push(`Dòng ${idx + 1}: Knock Out phải để trống cả 2 hoặc điền đủ cả 2 người chơi.`);
          return;
        }
        if (!hasWhite && !hasBlack && roundIndex <= 1) {
          errors.push(`Dòng ${idx + 1}: Round 1 của Knock Out cần có đủ 2 người chơi.`);
          return;
        }
      }
      if (hasWhite && hasBlack && white === black) {
        errors.push(`Dòng ${idx + 1}: Một trận không thể để cùng 1 người chơi ở 2 bên.`);
      }
      if ((hasWhite && !playerSet.has(white)) || (hasBlack && !playerSet.has(black))) {
        errors.push(`Dòng ${idx + 1}: Có người chơi không thuộc danh sách đã duyệt.`);
      }
      if (roundIndex <= 0) {
        errors.push(`Dòng ${idx + 1}: Round index phải >= 1.`);
      }

      if (stage === "RoundRobin") {
        hasRr = true;
        const key = white < black ? `${white}-${black}` : `${black}-${white}`;
        if (rrPairs.has(key)) {
          errors.push(`Dòng ${idx + 1}: Cặp đấu Round Robin bị trùng.`);
        } else {
          rrPairs.add(key);
        }
      }

      if (stage === "KnockOut") {
        hasKo = true;
        if (hasWhite) {
          const wKey = `${roundIndex}-${white}`;
          if (koRoundSlots.has(wKey)) {
            errors.push(
              `Dòng ${idx + 1}: Người chơi đang bị xếp 2 trận trong cùng round Knock Out.`,
            );
          } else {
            koRoundSlots.add(wKey);
          }
        }
        if (hasBlack) {
          const bKey = `${roundIndex}-${black}`;
          if (koRoundSlots.has(bKey)) {
            errors.push(
              `Dòng ${idx + 1}: Người chơi đang bị xếp 2 trận trong cùng round Knock Out.`,
            );
          } else {
            koRoundSlots.add(bKey);
          }
        }
      }
    });

    if (effectiveFormat === "Hybrid") {
      if (!hasRr || !hasKo) {
        errors.push("Hybrid bắt buộc có cả 2 stage: Round Robin trước, rồi Knock Out.");
      } else {
        const firstKo = rows.findIndex((r) => r.stage === "KnockOut");
        const lastRr = rows
          .map((r, i) => ({ stage: r.stage, i }))
          .filter((x) => x.stage === "RoundRobin")
          .map((x) => x.i)
          .pop();
        if (firstKo !== -1 && lastRr !== undefined && firstKo < lastRr) {
          errors.push("Hybrid phải xếp Round Robin trước rồi mới Knock Out.");
        }
      }
    }
    return errors;
  };

  const structureErrors = validateStructureRows();
  const errors = validateRows();

  const labelForPlayer = (id) => {
    const p = availablePlayers.find((x) => x.userId === Number(id));
    if (!p) return "-";
    return `${p.fullName}${p.email ? ` (${p.email})` : ""}`;
  };

  const applyRowErrors = (errorList = []) => {
    const next = {};
    const linePattern = /^Dòng\s+(\d+):\s*(.+)$/i;
    errorList.forEach((msg) => {
      const text = String(msg || "");
      const matched = text.match(linePattern);
      if (!matched) return;
      const rowIndex = Number(matched[1]) - 1;
      const row = rows[rowIndex];
      if (row?.id && !next[row.id]) {
        next[row.id] = matched[2] || text;
      }
    });
    setRowErrors(next);
  };

  const handleDeleteRow = (id) => {
    setRowErrors((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setRows((prev) => {
      const target = prev.find((r) => r.id === id);
      if (
        laneStep === "structure" &&
        target &&
        (target.whitePlayerId || target.blackPlayerId || target.startTime)
      ) {
        setServerBanner({
          type: "error",
          text: "Bạn vừa xóa một match đã có player/schedule. Các dữ liệu liên quan đã bị loại bỏ.",
        });
      }
      return prev.filter((r) => r.id !== id);
    });
  };

  const handleRowFieldChange = (id, field, value) => {
    const structureFields = new Set(["stage", "roundName", "roundIndex", "boardNumber"]);
    setRowErrors((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? (() => {
              const nextValue =
                field === "roundIndex" || field === "boardNumber"
                  ? Number(value || 1)
                  : value;
              const nextRow = { ...row, [field]: nextValue };
              if (
                laneStep === "structure" &&
                structureFields.has(field) &&
                (row.whitePlayerId || row.blackPlayerId || row.startTime)
              ) {
                nextRow.whitePlayerId = "";
                nextRow.blackPlayerId = "";
                nextRow.startTime = "";
                setServerBanner({
                  type: "error",
                  text: "Bạn đã đổi structure, hệ thống reset player/schedule của match này để tránh lệch dữ liệu.",
                });
              }
              return nextRow;
            })()
          : row,
      ),
    );
  };

  const addInlineMatch = ({ stage, roundIndex }) => {
    setRows((prev) => [...prev, makeRow({ stage, roundIndex, boardNumber: 1 })]);
    setServerBanner(null);
    setRowErrors({});
  };

  const addInlineRound = (stage) => {
    const targetRows = rows.filter((r) => r.stage === stage);
    const maxRound = targetRows.reduce(
      (max, r) => Math.max(max, Number(r.roundIndex || 1)),
      0,
    );
    addInlineMatch({ stage, roundIndex: maxRound + 1 });
  };

  const createRoundRobinRows = (players, stage) => {
    const ids = players.map((p) => p.userId);
    if (ids.length < 2) return [];
    const list = [...ids];
    if (list.length % 2 !== 0) list.push(null);
    const n = list.length;
    const rounds = n - 1;
    const generated = [];

    for (let r = 0; r < rounds; r += 1) {
      let board = 1;
      for (let i = 0; i < n / 2; i += 1) {
        const p1 = list[i];
        const p2 = list[n - 1 - i];
        if (p1 && p2) {
          const flip = (r + i) % 2 === 0;
          generated.push(
            makeRow({
              stage,
              roundIndex: r + 1,
              roundName: `Round ${r + 1}`,
              boardNumber: board,
              whitePlayerId: flip ? p1 : p2,
              blackPlayerId: flip ? p2 : p1,
            }),
          );
          board += 1;
        }
      }
      const fixed = list[0];
      const rest = list.slice(1);
      rest.unshift(rest.pop());
      list.splice(0, list.length, fixed, ...rest);
    }
    return generated;
  };

  const nextPowerOfTwo = (n) => {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  };

  const generateSeedOrder = (size) => {
    let order = [1];
    while (order.length < size) {
      const nextMax = order.length * 2 + 1;
      order = order.flatMap((seed) => [seed, nextMax - seed]);
    }
    return order;
  };

  const createKnockoutBracketRows = (players, stage) => {
    const warnings = [];
    const generated = [];
    if (players.length < 2) return { generated, warnings };

    const bracketSize = nextPowerOfTwo(players.length);
    const roundCount = Math.log2(bracketSize);
    const order = generateSeedOrder(bracketSize);
    const slotPlayers = order.map((seed) =>
      seed <= players.length ? players[seed - 1].userId : null,
    );

    for (let round = 1; round <= roundCount; round += 1) {
      const matchesInRound = bracketSize / 2 ** round;
      for (let i = 0; i < matchesInRound; i += 1) {
        let white = null;
        let black = null;
        if (round === 1) {
          white = slotPlayers[i * 2];
          black = slotPlayers[i * 2 + 1];
        }
        generated.push(
          makeRow({
            stage,
            roundIndex: round,
            roundName: `Round ${round}`,
            boardNumber: i + 1,
            whitePlayerId: white,
            blackPlayerId: black,
          }),
        );
      }
    }

    if (players.length !== bracketSize) {
      warnings.push(
        `Auto tạo bracket ${bracketSize} slots theo seeding chuẩn, có ${bracketSize - players.length} BYE slot.`,
      );
    }
    return { generated, warnings };
  };

  const runAutoSetup = async () => {
    if (availablePlayers.length === 0) {
      setServerBanner({
        type: "error",
        text: "Chưa có người chơi đã duyệt để auto setup.",
      });
      return;
    }

    const seededPlayers = [...availablePlayers].sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.userId - b.userId;
    });

    let generatedRows = [];
    const warnings = [];

    if (effectiveFormat === "RoundRobin") {
      generatedRows = createRoundRobinRows(seededPlayers, "RoundRobin");
    } else if (effectiveFormat === "KnockOut") {
      const result = createKnockoutBracketRows(seededPlayers, "KnockOut");
      generatedRows = result.generated;
      warnings.push(...result.warnings);
    } else {
      const rr = createRoundRobinRows(seededPlayers, "RoundRobin");
      const ko = createKnockoutBracketRows(seededPlayers, "KnockOut");
      generatedRows = [...rr, ...ko.generated];
      warnings.push(...ko.warnings);
    }

    if (generatedRows.length === 0) {
      setServerBanner({
        type: "error",
        text: "Auto setup chưa tạo được trận phù hợp. Vui lòng dùng manual.",
      });
      return;
    }

    const structurePayload = {
      format: effectiveFormat,
      setupStep: "STRUCTURE",
      matches: generatedRows.map((r) => ({
        stage: r.stage,
        roundName: r.roundName || `Round ${Number(r.roundIndex || 1)}`,
        roundIndex: Number(r.roundIndex || 1),
        boardNumber: Number(r.boardNumber || 1),
        whitePlayerId: r.whitePlayerId ? Number(r.whitePlayerId) : null,
        blackPlayerId: r.blackPlayerId ? Number(r.blackPlayerId) : null,
        startTime: toSqlDateTime(r.startTime),
      })),
    };

    try {
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=setupStep&id=${tournamentId}`,
        structurePayload,
        { withCredentials: true },
      );
      setRows(generatedRows);
      setSetupMode("auto");
      setServerSetupStep("PLAYERS");
      setLaneStep("players");
      setRowErrors({});
      setServerBanner({
        type: "success",
        text:
          res?.data?.message ||
          `Auto setup đã tạo ${generatedRows.length} trận và hoàn tất Structure.${warnings.length ? ` ${warnings.join(" ")}` : ""}`,
      });
    } catch (err) {
      setRows(generatedRows);
      setSetupMode("auto");
      setLaneStep("structure");
      setServerBanner({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Auto setup đã tạo bracket nhưng không thể finalize Structure trên server.",
      });
    }
  };

  const handleSave = async () => {
    if (laneStep !== "schedule") {
      setServerBanner({
        type: "error",
        text: "Hãy hoàn tất bước trước và vào Schedule để lưu.",
      });
      return;
    }
    if (errors.length > 0) {
      applyRowErrors(errors);
      setServerBanner({
        type: "error",
        text: errors[0],
      });
      return;
    }

    const payload = {
      format: effectiveFormat,
      setupStep: "SCHEDULE",
      matches: rows.map((r) => ({
        stage: r.stage,
        roundName: r.roundName || `Round ${Number(r.roundIndex || 1)}`,
        roundIndex: Number(r.roundIndex || 1),
        boardNumber: Number(r.boardNumber || 1),
        whitePlayerId: r.whitePlayerId ? Number(r.whitePlayerId) : null,
        blackPlayerId: r.blackPlayerId ? Number(r.blackPlayerId) : null,
        startTime: toSqlDateTime(r.startTime),
      })),
    };

    try {
      setSaving(true);
      const res = await axios.post(
        `${API_BASE}/api/tournaments?action=manualSetup&id=${tournamentId}`,
        payload,
        { withCredentials: true },
      );
      setServerBanner({
        type: "success",
        text: res?.data?.message || "Lưu setup thành công.",
      });
      setRowErrors({});
    } catch (err) {
      setServerBanner({
        type: "error",
        text: err?.response?.data?.message || "Lưu setup thất bại.",
      });
    } finally {
      setSaving(false);
    }
  };

  const resolveRoundLabel = (matches = [], roundIndex) => {
    const named = matches.find((m) => String(m.roundName || "").trim());
    return named?.roundName || `Round ${roundIndex}`;
  };

  const getKoWinnerRefs = (match) => {
    const round = Number(match.roundIndex || 1);
    const board = Number(match.boardNumber || 1);
    const prevRound = Math.max(1, round - 1);
    return {
      whiteRef: `W(R${prevRound}-B${board * 2 - 1})`,
      blackRef: `W(R${prevRound}-B${board * 2})`,
    };
  };

  const getKoPlayersForSelect = (match, slot) => {
    const round = Number(match.roundIndex || 1);
    const taken = new Set();

    rows.forEach((r) => {
      if (r.stage !== "KnockOut") return;
      if (Number(r.roundIndex || 1) !== round) return;
      if (r.id === match.id) return;
      const w = Number(r.whitePlayerId);
      const b = Number(r.blackPlayerId);
      if (Number.isInteger(w) && w > 0) taken.add(w);
      if (Number.isInteger(b) && b > 0) taken.add(b);
    });

    const oppositeId = Number(slot === "white" ? match.blackPlayerId : match.whitePlayerId);
    if (Number.isInteger(oppositeId) && oppositeId > 0) {
      taken.add(oppositeId);
    }

    const currentId = Number(slot === "white" ? match.whitePlayerId : match.blackPlayerId);
    return availablePlayers.filter(
      (p) => p.userId === currentId || !taken.has(p.userId),
    );
  };

  const autoFillPlayersIntoStructure = () => {
    if (rows.length === 0) {
      setServerBanner({
        type: "error",
        text: "Chưa có structure bracket để auto add players.",
      });
      return;
    }
    if (availablePlayers.length < 2) {
      setServerBanner({
        type: "error",
        text: "Cần ít nhất 2 players đã duyệt để auto add players.",
      });
      return;
    }

    const seeded = [...availablePlayers].sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.userId - b.userId;
    });
    const ids = seeded.map((p) => p.userId);
    const sorted = sortRows(rows);
    const rrRows = sortRows(sorted.filter((r) => r.stage === "RoundRobin"));
    const koRows = sortRows(sorted.filter((r) => r.stage === "KnockOut"));
    const rrGenerated = createRoundRobinRows(seeded, "RoundRobin");
    const rrGeneratedByRound = groupRowsByRound(rrGenerated);
    const rrGeneratedCount = rrGeneratedByRound.length;

    // Use true round-robin pairing per round to avoid duplicated round-1 pairs.
    const rrFilledById = {};
    if (rrRows.length > 0 && rrGeneratedCount > 0) {
      const rrStructureRounds = groupRowsByRound(rrRows);
      rrStructureRounds.forEach((round) => {
        const sourceRound =
          rrGeneratedByRound[(Math.max(1, round.roundIndex) - 1) % rrGeneratedCount];
        const sourceMatches = sourceRound?.matches || [];
        round.matches.forEach((match, idx) => {
          const pick = sourceMatches[idx % Math.max(1, sourceMatches.length)];
          if (!pick) return;
          rrFilledById[match.id] = {
            whitePlayerId: String(pick.whitePlayerId || ""),
            blackPlayerId: String(pick.blackPlayerId || ""),
          };
        });
      });
    }

    const koFilledById = {};
    const koRoundOneRows = koRows.filter((r) => Number(r.roundIndex || 1) === 1);
    koRoundOneRows.forEach((row, idx) => {
      const white = ids[(idx * 2) % ids.length];
      let black = ids[(idx * 2 + 1) % ids.length];
      if (black === white) {
        black = ids[(idx * 2 + 2) % ids.length];
      }
      koFilledById[row.id] = {
        whitePlayerId: String(white),
        blackPlayerId: String(black),
      };
    });

    const filled = sorted.map((row) => {
      const fromRr = rrFilledById[row.id];
      const fromKo = koFilledById[row.id];
      if (fromRr) return { ...row, ...fromRr };
      if (fromKo) return { ...row, ...fromKo };
      if (row.stage === "KnockOut" && Number(row.roundIndex || 1) > 1) {
        return { ...row, whitePlayerId: "", blackPlayerId: "" };
      }
      return row;
    });
    setRows(filled);
    setRowErrors({});
    setServerBanner({
      type: "success",
      text: "Auto add players đã áp dụng vào structure hiện tại. Bạn có thể chỉnh tay trước khi qua bước Schedule.",
    });
  };

  const handleFinalizeCurrentStep = async () => {
    if (laneStep === "structure") {
      if (structureErrors.length > 0) {
        applyRowErrors(structureErrors);
        setServerBanner({ type: "error", text: structureErrors[0] });
        return;
      }
      try {
        const payload = {
          format: effectiveFormat,
          setupStep: "STRUCTURE",
          matches: rows.map((r) => ({
            stage: r.stage,
            roundName: r.roundName || `Round ${Number(r.roundIndex || 1)}`,
            roundIndex: Number(r.roundIndex || 1),
            boardNumber: Number(r.boardNumber || 1),
            whitePlayerId: r.whitePlayerId ? Number(r.whitePlayerId) : null,
            blackPlayerId: r.blackPlayerId ? Number(r.blackPlayerId) : null,
            startTime: toSqlDateTime(r.startTime),
          })),
        };
        const res = await axios.post(
          `${API_BASE}/api/tournaments?action=setupStep&id=${tournamentId}`,
          payload,
          { withCredentials: true },
        );
        setServerSetupStep("PLAYERS");
        setLaneStep("players");
        setServerBanner({
          type: "success",
          text: res?.data?.message || "Hoàn tất Structure.",
        });
        setRowErrors({});
      } catch (err) {
        setServerBanner({
          type: "error",
          text: err?.response?.data?.message || "Không thể hoàn tất bước Structure.",
        });
      }
      return;
    }

    if (laneStep === "players") {
      if (errors.length > 0) {
        applyRowErrors(errors);
        setServerBanner({ type: "error", text: errors[0] });
        return;
      }
      try {
        const payload = {
          format: effectiveFormat,
          setupStep: "PLAYERS",
          matches: rows.map((r) => ({
            stage: r.stage,
            roundName: r.roundName || `Round ${Number(r.roundIndex || 1)}`,
            roundIndex: Number(r.roundIndex || 1),
            boardNumber: Number(r.boardNumber || 1),
            whitePlayerId: r.whitePlayerId ? Number(r.whitePlayerId) : null,
            blackPlayerId: r.blackPlayerId ? Number(r.blackPlayerId) : null,
            startTime: toSqlDateTime(r.startTime),
          })),
        };
        const res = await axios.post(
          `${API_BASE}/api/tournaments?action=setupStep&id=${tournamentId}`,
          payload,
          { withCredentials: true },
        );
        setServerSetupStep("SCHEDULE");
        setLaneStep("schedule");
        setServerBanner({
          type: "success",
          text: res?.data?.message || "Hoàn tất Add Players.",
        });
        setRowErrors({});
      } catch (err) {
        setServerBanner({
          type: "error",
          text: err?.response?.data?.message || "Không thể hoàn tất bước Add Players.",
        });
      }
    }
  };

  const renderRoundCard = (match) => (
    <div key={match.id} className="tsu-preview-match">
      {laneStep === "structure" ? (
        <div className="tsu-preview-topline">
          <div className="tsu-preview-small-grid">
            <input
              type="text"
              className="tsu-mini-input"
              placeholder="Round name"
              value={match.roundName || ""}
              onChange={(e) =>
                handleRowFieldChange(match.id, "roundName", e.target.value)
              }
            />
            <input
              type="number"
              className="tsu-mini-input"
              min={1}
              value={Number(match.boardNumber || 1)}
              onChange={(e) =>
                handleRowFieldChange(match.id, "boardNumber", e.target.value)
              }
            />
          </div>
          <button
            className="tsu-icon-btn"
            onClick={() => handleDeleteRow(match.id)}
            title="Xóa trận"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div className="tsu-preview-meta-head">
          {match.roundName || `Round ${match.roundIndex}`} - Board {match.boardNumber}
        </div>
      )}

      {laneStep !== "structure" && (
        <>
          <div className="tsu-preview-player white">
            <span className="tsu-preview-seat">W</span>
            {laneStep === "players" ? (
              <select
                className="tsu-mini-select"
                value={match.whitePlayerId || ""}
                onChange={(e) =>
                  handleRowFieldChange(match.id, "whitePlayerId", e.target.value)
                }
              >
                <option value="">-- White --</option>
                {availablePlayers.map((p) => (
                  <option key={`inline-w-${match.id}-${p.userId}`} value={p.userId}>
                    {labelForPlayer(p.userId)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="tsu-readonly-value">{labelForPlayer(match.whitePlayerId)}</span>
            )}
          </div>

          <div className="tsu-preview-player black">
            <span className="tsu-preview-seat">B</span>
            {laneStep === "players" ? (
              <select
                className="tsu-mini-select"
                value={match.blackPlayerId || ""}
                onChange={(e) =>
                  handleRowFieldChange(match.id, "blackPlayerId", e.target.value)
                }
              >
                <option value="">-- Black --</option>
                {availablePlayers.map((p) => (
                  <option key={`inline-b-${match.id}-${p.userId}`} value={p.userId}>
                    {labelForPlayer(p.userId)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="tsu-readonly-value">{labelForPlayer(match.blackPlayerId)}</span>
            )}
          </div>
        </>
      )}

      {laneStep === "schedule" && (
        <div className="tsu-preview-meta">
          <span>Round #{Number(match.roundIndex || 1)}</span>
          <input
            type="datetime-local"
            className="tsu-mini-input"
            value={match.startTime || ""}
            onChange={(e) => handleRowFieldChange(match.id, "startTime", e.target.value)}
          />
        </div>
      )}
      {rowErrors[match.id] && <p className="tsu-inline-error">{rowErrors[match.id]}</p>}
    </div>
  );

  const renderRoundRobinPreview = (rounds, title) => (
    <div className="tsu-preview-block">
      <h4>{title}</h4>
      {rounds.length === 0 ? (
        <p className="tsu-preview-empty">Chưa có trận nào cho phần này.</p>
      ) : (
        <div className="tsu-rr-rounds">
          {rounds.map((round) => (
            <div key={`rr-${round.roundIndex}`} className="tsu-rr-round-card">
              <div className="tsu-rr-round-head">
                <strong>{resolveRoundLabel(round.matches, round.roundIndex)}</strong>
                <div className="tsu-round-actions">
                  <span>{round.matches.length} trận</span>
                  <button
                    className="tsu-mini-btn"
                    hidden={laneStep !== "structure"}
                    onClick={() =>
                      addInlineMatch({
                        stage: "RoundRobin",
                        roundIndex: round.roundIndex,
                      })
                    }
                  >
                    + Match
                  </button>
                </div>
              </div>
              <div className="tsu-rr-round-list">
                {round.matches.map((match) => renderRoundCard(match))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderKnockoutPreview = (rounds, title) => (
    <div className="tsu-preview-block">
      <h4>{title}</h4>
      {rounds.length === 0 ? (
        <p className="tsu-preview-empty">Chưa có trận nào cho phần này.</p>
      ) : (
        <div className="tsu-ko-scroll">
          <div className="tsu-ko-grid">
            {rounds.map((round) => (
              <div
                key={`ko-${round.roundIndex}`}
                className="tsu-ko-column"
                style={{
                  "--tsu-connector-len": `${Math.max(
                    12,
                    Math.round(18 - (Number(round.roundIndex || 1) - 1) * 2),
                  )}px`,
                  "--tsu-connector-stroke": `${Math.max(
                    1,
                    2 - (Number(round.roundIndex || 1) - 1) * 0.3,
                  )}px`,
                }}
              >
                <div className="tsu-ko-column-head">
                  <strong>{resolveRoundLabel(round.matches, round.roundIndex)}</strong>
                  <span>Round #{round.roundIndex}</span>
                </div>
                <div
                  className="tsu-ko-column-list"
                  style={{
                    "--tsu-ko-level-gap": `${14 * Math.max(
                      1,
                      2 ** (Number(round.roundIndex || 1) - 1),
                    )}px`,
                    "--tsu-ko-level-top": `${Math.round(
                      22 * (Math.max(1, 2 ** (Number(round.roundIndex || 1) - 1)) - 1),
                    )}px`,
                  }}
                >
                  {round.matches.map((match) => (
                    <div key={match.id} className="tsu-ko-match-card">
                      {Number(round.roundIndex || 1) > 1 && (
                        <span
                          className="tsu-ko-in-branch"
                          style={{
                            "--tsu-branch-span": `${Math.max(
                              30,
                              Math.round(
                                60 * Math.max(1, 2 ** (Number(round.roundIndex || 1) - 2)),
                              ),
                            )}px`,
                          }}
                        />
                      )}
                      {laneStep === "structure" ? (
                        <div className="tsu-preview-topline">
                          <div className="tsu-preview-small-grid">
                            <input
                              type="text"
                              className="tsu-mini-input"
                              placeholder="Round name"
                              value={match.roundName || ""}
                              onChange={(e) =>
                                handleRowFieldChange(
                                  match.id,
                                  "roundName",
                                  e.target.value,
                                )
                              }
                            />
                            <input
                              type="number"
                              className="tsu-mini-input"
                              min={1}
                              value={Number(match.boardNumber || 1)}
                              onChange={(e) =>
                                handleRowFieldChange(
                                  match.id,
                                  "boardNumber",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <button
                            className="tsu-icon-btn"
                            onClick={() => handleDeleteRow(match.id)}
                            title="Xóa trận"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="tsu-preview-meta-head">
                          {match.roundName || `Round ${match.roundIndex}`} - Board{" "}
                          {match.boardNumber}
                        </div>
                      )}
                      {laneStep !== "structure" && (
                        <>
                          <div className="tsu-ko-player-row">
                            <span className="tsu-ko-seat">W</span>
                            {laneStep === "players" &&
                            Number(match.roundIndex || 1) > 1 ? (
                              <span className="tsu-readonly-value">
                                {getKoWinnerRefs(match).whiteRef}
                              </span>
                            ) : laneStep === "players" ? (
                              <select
                                className="tsu-mini-select"
                                value={match.whitePlayerId || ""}
                                onChange={(e) =>
                                  handleRowFieldChange(
                                    match.id,
                                    "whitePlayerId",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">-- White --</option>
                                {getKoPlayersForSelect(match, "white").map((p) => (
                                  <option
                                    key={`ko-w-${match.id}-${p.userId}`}
                                    value={p.userId}
                                  >
                                    {labelForPlayer(p.userId)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="tsu-readonly-value">
                                {Number(match.roundIndex || 1) > 1 &&
                                !match.whitePlayerId
                                  ? getKoWinnerRefs(match).whiteRef
                                  : labelForPlayer(match.whitePlayerId)}
                              </span>
                            )}
                          </div>
                          <div className="tsu-ko-player-row">
                            <span className="tsu-ko-seat">B</span>
                            {laneStep === "players" &&
                            Number(match.roundIndex || 1) > 1 ? (
                              <span className="tsu-readonly-value">
                                {getKoWinnerRefs(match).blackRef}
                              </span>
                            ) : laneStep === "players" ? (
                              <select
                                className="tsu-mini-select"
                                value={match.blackPlayerId || ""}
                                onChange={(e) =>
                                  handleRowFieldChange(
                                    match.id,
                                    "blackPlayerId",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">-- Black --</option>
                                {getKoPlayersForSelect(match, "black").map((p) => (
                                  <option
                                    key={`ko-b-${match.id}-${p.userId}`}
                                    value={p.userId}
                                  >
                                    {labelForPlayer(p.userId)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="tsu-readonly-value">
                                {Number(match.roundIndex || 1) > 1 &&
                                !match.blackPlayerId
                                  ? getKoWinnerRefs(match).blackRef
                                  : labelForPlayer(match.blackPlayerId)}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                      {laneStep === "schedule" && (
                        <div className="tsu-ko-meta">
                          <span>Round #{Number(match.roundIndex || 1)}</span>
                          <input
                            type="datetime-local"
                            className="tsu-mini-input"
                            value={match.startTime || ""}
                            onChange={(e) =>
                              handleRowFieldChange(match.id, "startTime", e.target.value)
                            }
                          />
                        </div>
                      )}
                      {rowErrors[match.id] && (
                        <p className="tsu-inline-error">{rowErrors[match.id]}</p>
                      )}
                    </div>
                  ))}
                  <button
                    className="tsu-round-add-btn"
                    hidden={laneStep !== "structure"}
                    onClick={() =>
                      addInlineMatch({
                        stage: "KnockOut",
                        roundIndex: round.roundIndex,
                      })
                    }
                  >
                    + Thêm match round này
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="tsu-shell ui-card ui-card-flat">
      <div className="tsu-top">
        <div>
          <h3>Schedule Setup - {effectiveFormat}</h3>
          <p>Flow: Structure Bracket -> Add Players -> Schedule.</p>
        </div>
        <Badge variant="blue">{availablePlayers.length} players approved</Badge>
      </div>

      {serverBanner && (
        <div
          className={`tsu-banner ${serverBanner.type === "success" ? "ok" : "error"}`}
        >
          {serverBanner.text}
        </div>
      )}

      {loadingRows ? (
        <div className="tsu-mode-loading">Đang tải lịch đã setup...</div>
      ) : setupMode == null ? (
        <div className="tsu-mode-chooser">
          <h4>Chọn kiểu setup</h4>
          <p>
            {rows.length > 0
              ? `Đã có sẵn ${rows.length} trận trong DB. Bạn có thể vào Manual để chỉnh, hoặc Auto để tạo lại từ đầu.`
              : "Chưa có dữ liệu schedule. Hãy chọn 1 mode để bắt đầu."}
          </p>
          <div className="tsu-mode-actions">
            <button
              className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
              onClick={() => {
                setSetupMode("manual");
                if (serverSetupStep === "PLAYERS") setLaneStep("players");
                else if (serverSetupStep === "SCHEDULE" || serverSetupStep === "COMPLETED")
                  setLaneStep("schedule");
                else setLaneStep("structure");
              }}
            >
              Manual Setup
            </button>
            <button className="tsu-btn tsu-btn-primary ui-btn ui-btn-primary" onClick={runAutoSetup}>
              Auto Setup
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="tsu-stepper">
            <button
              className={`tsu-step-btn ${laneStep === "structure" ? "active" : ""}`}
              type="button"
              disabled
            >
              1. Structure
            </button>
            <button
              className={`tsu-step-btn ${laneStep === "players" ? "active" : ""}`}
              type="button"
              disabled
            >
              2. Add Players
            </button>
            <button
              className={`tsu-step-btn ${laneStep === "schedule" ? "active" : ""}`}
              type="button"
              disabled
            >
              3. Schedule
            </button>
          </div>

          <div className="tsu-actions">
            <button
              className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
              onClick={() => {
                setSetupMode(null);
                setServerBanner(null);
                if (serverSetupStep === "PLAYERS") setLaneStep("players");
                else if (serverSetupStep === "SCHEDULE" || serverSetupStep === "COMPLETED")
                  setLaneStep("schedule");
                else setLaneStep("structure");
              }}
            >
              Chọn lại mode
            </button>
            {laneStep === "players" && (
              <button className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary" onClick={autoFillPlayersIntoStructure}>
                Auto Add Players
              </button>
            )}
            {laneStep !== "schedule" && (
              <button
                className="tsu-btn tsu-btn-outline ui-btn ui-btn-secondary"
                onClick={handleFinalizeCurrentStep}
              >
                {laneStep === "structure" ? "Finalize Structure" : "Finalize Players"}
              </button>
            )}
            <button
              className="tsu-btn tsu-btn-primary ui-btn ui-btn-primary"
              onClick={handleSave}
              disabled={saving || laneStep !== "schedule"}
            >
              {saving ? "Đang lưu..." : "Lưu setup"}
            </button>
          </div>

          <div className="tsu-preview-wrap">
            <div className="tsu-preview-head">
              <div>
                <h3>Schedule Preview</h3>
                <p>
                  {laneStep === "structure" &&
                    "Bước Structure: chỉ dựng bracket (round, board, số match)."}
                  {laneStep === "players" &&
                    "Bước Add Players: dùng structure đã dựng để gán player vào từng match."}
                  {laneStep === "schedule" &&
                    "Bước Schedule: thêm thời gian thi đấu cho từng match."}
                </p>
              </div>
              {laneStep === "structure" && (
                <div className="tsu-preview-head-actions">
                  {(effectiveFormat === "RoundRobin" || effectiveFormat === "Hybrid") && (
                    <button
                      className="tsu-round-add-btn"
                      onClick={() => addInlineRound("RoundRobin")}
                    >
                      + Thêm round RoundRobin
                    </button>
                  )}
                  {(effectiveFormat === "KnockOut" || effectiveFormat === "Hybrid") && (
                    <button
                      className="tsu-round-add-btn"
                      onClick={() => addInlineRound("KnockOut")}
                    >
                      + Thêm round KnockOut
                    </button>
                  )}
                </div>
              )}
            </div>

            {effectiveFormat === "RoundRobin" &&
              renderRoundRobinPreview(stageRows.nativeRounds, "Round Robin rounds")}

            {effectiveFormat === "KnockOut" &&
              renderKnockoutPreview(stageRows.nativeRounds, "Knock Out bracket")}

            {effectiveFormat === "Hybrid" && (
              <>
                {renderRoundRobinPreview(
                  stageRows.roundRobinRounds,
                  "Stage 1 - Round Robin",
                )}
                {renderKnockoutPreview(
                  stageRows.knockOutRounds,
                  "Stage 2 - Knock Out bracket",
                )}
              </>
            )}
          </div>
        </>
      )}
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
  <div className="td-reports-card ui-card ui-card-flat">
    {/* Header */}
    <div className="td-reports-header">
      <div>
        <h3>Documentation Center</h3>
        <p>Audit logs, performance reviews and match data.</p>
      </div>

      <button className="td-export-btn ui-btn ui-btn-primary">
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

        <button className="td-audit-btn ui-btn ui-btn-secondary">
          Run Advanced Audit <ArrowRight size={14} />
        </button>
      </div>
    </div>
  </div>
);

export default TournamentDetail;
