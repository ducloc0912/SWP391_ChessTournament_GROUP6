import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Calendar,
  MapPin,
  Trophy,
  Users,
  DollarSign,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import MainHeader from "../../component/common/MainHeader";
import "./PlayerTournamentList.css";

const QUICK_CHIPS = [
  "Upcoming",
  "Ongoing",
  "Free",
  "Paid",
  "My Registered",
  "Nearly Full",
  "High Prize",
];

function fmtDate(dateValue) {
  if (!dateValue) return "N/A";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-GB").replaceAll("-", "/");
}

function getUiStatus(t) {
  if (t.currentPlayers >= t.maxPlayer) return "Full";
  if (t.status === "Ongoing") return "Ongoing";
  if (t.status === "Completed") return "Finished";
  return "Upcoming";
}

function normalizeTournament(raw) {
  return {
    id: raw.tournamentId,
    name: raw.tournamentName,
    image:
      raw.tournamentImage ||
      "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=1200&q=80",
    location: raw.location || "Online",
    format: raw.format || "N/A",
    status: raw.status,
    uiStatus: getUiStatus(raw),
    startDate: raw.startDate,
    registrationDeadline: raw.registrationDeadline,
    entryFee: Number(raw.entryFee || 0),
    prizePool: Number(raw.prizePool || 0),
    maxPlayers: Number(raw.maxPlayer || 0),
    currentPlayers: Number(raw.currentPlayers || 0),
    isRegistered: Boolean(raw.registered),
  };
}

function StatusBadge({ status }) {
  return <span className={`ptl-badge ${status.toLowerCase()}`}>{status}</span>;
}

export default function PlayerTournamentList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeChip, setActiveChip] = useState("Upcoming");

  const [adv, setAdv] = useState({
    format: "",
    status: "",
    entryType: "",
    sort: "newest",
  });

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [formats, setFormats] = useState([]);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const fetchTournaments = async () => {
    setLoading(true);
    setApiError("");
    try {
      const params = {
        q: search.trim() || undefined,
        format: adv.format || undefined,
        status: adv.status || undefined,
        entryType: adv.entryType || undefined,
        sort: adv.sort || "newest",
        userId: user?.userId || undefined,
        registeredOnly: activeChip === "My Registered" ? "true" : undefined,
      };

      const [listRes, filterRes] = await Promise.all([
        axios.get("http://localhost:8080/ctms/api/player/tournaments", {
          params,
          withCredentials: true,
        }),
        axios.get("http://localhost:8080/ctms/api/tournaments?action=filters", {
          withCredentials: true,
        }),
      ]);

      setItems((listRes.data || []).map(normalizeTournament));
      setFormats(filterRes.data?.formats || []);
    } catch (err) {
      console.error("Error loading player tournaments:", err);
      if (err?.response?.status === 401) {
        setApiError("Your session expired. Please login again.");
        navigate("/login");
        return;
      }
      setApiError("Cannot load tournaments from server.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, adv.format, adv.status, adv.entryType, adv.sort, activeChip, user?.userId]);

  const filteredByChip = useMemo(() => {
    return items.filter((t) => {
      switch (activeChip) {
        case "Upcoming":
          return t.uiStatus === "Upcoming";
        case "Ongoing":
          return t.uiStatus === "Ongoing";
        case "Free":
          return t.entryFee === 0;
        case "Paid":
          return t.entryFee > 0;
        case "My Registered":
          return t.isRegistered;
        case "Nearly Full":
          return t.maxPlayers > 0 && t.currentPlayers / t.maxPlayers >= 0.8;
        case "High Prize":
          return t.prizePool > 0;
        default:
          return true;
      }
    });
  }, [items, activeChip]);

  const featuredTournament = useMemo(() => {
    const candidates = filteredByChip.filter((t) => t.uiStatus !== "Finished");
    if (!candidates.length) return null;
    return [...candidates].sort((a, b) => b.prizePool - a.prizePool)[0];
  }, [filteredByChip]);

  const gridItems = useMemo(() => {
    if (!featuredTournament) return filteredByChip;
    return filteredByChip.filter((t) => t.id !== featuredTournament.id);
  }, [filteredByChip, featuredTournament]);

  const onRegister = async (tournament) => {
    if (!user?.userId) {
      alert("Please login to register.");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8080/ctms/api/participants",
        {
          tournamentId: tournament.id,
          userId: user.userId,
          status: "Active",
          isPaid: true,
          titleAtRegistration: "Player",
        },
        { withCredentials: true }
      );
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Register failed");
      }
      await fetchTournaments();
      alert("Registered successfully!");
    } catch (err) {
      console.error("Register failed:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Register failed (maybe already registered).";
      alert(message);
    }
  };

  return (
    <div className="ptl-page">
      <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} />

      <div className="ptl-container">
        <div className="ptl-header">
          <div>
            <h1>Explore Tournaments</h1>
            <p>Find and join chess competitions happening around you.</p>
          </div>
          <div className="ptl-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tournaments by name or location..."
            />
          </div>
        </div>

        <div className="ptl-chips">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={activeChip === chip ? "active" : ""}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="ptl-adv">
          <button onClick={() => setShowAdvanced((v) => !v)} className="ptl-adv-toggle">
            <Filter size={16} />
            Advanced Filters
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showAdvanced && (
            <div className="ptl-adv-panel">
              <div className="ptl-field">
                <label>Format</label>
                <select
                  value={adv.format}
                  onChange={(e) => setAdv((s) => ({ ...s, format: e.target.value }))}
                >
                  <option value="">Any format</option>
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ptl-field">
                <label>Status</label>
                <select
                  value={adv.status}
                  onChange={(e) => setAdv((s) => ({ ...s, status: e.target.value }))}
                >
                  <option value="">Any status</option>
                  <option value="Pending">Pending</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="ptl-field">
                <label>Entry Fee</label>
                <select
                  value={adv.entryType}
                  onChange={(e) => setAdv((s) => ({ ...s, entryType: e.target.value }))}
                >
                  <option value="">Any</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="ptl-field">
                <label>Sort by</label>
                <select
                  value={adv.sort}
                  onChange={(e) => setAdv((s) => ({ ...s, sort: e.target.value }))}
                >
                  <option value="newest">Newest</option>
                  <option value="startDate">Start Date</option>
                  <option value="prizePool">Prize Pool</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="ptl-skeleton-wrap">
            <div className="ptl-skeleton-featured" />
            <div className="ptl-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="ptl-skeleton-card" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {featuredTournament && (
              <div className="ptl-featured">
                <img src={featuredTournament.image} alt={featuredTournament.name} />
                <div className="overlay" />
                <div className="content">
                  <div className="tags">
                    <span className="tag">Featured</span>
                    {featuredTournament.prizePool > 0 && (
                      <span className="tag yellow">High Prize</span>
                    )}
                  </div>
                  <h2>{featuredTournament.name}</h2>
                  <div className="meta">
                    <span>
                      <Calendar size={16} />
                      {fmtDate(featuredTournament.startDate)}
                    </span>
                    <span>
                      <MapPin size={16} />
                      {featuredTournament.location}
                    </span>
                    <span>
                      <Trophy size={16} />
                      ${featuredTournament.prizePool.toLocaleString()}
                    </span>
                  </div>
                  <button onClick={() => navigate(`/tournaments/${featuredTournament.id}`)}>
                    View Details
                  </button>
                </div>
              </div>
            )}

            {gridItems.length > 0 ? (
              <div className="ptl-grid">
                {gridItems.map((t) => {
                  const isFull = t.currentPlayers >= t.maxPlayers && t.maxPlayers > 0;
                  const progress = t.maxPlayers > 0 ? (t.currentPlayers / t.maxPlayers) * 100 : 0;

                  return (
                    <div className="ptl-card" key={t.id}>
                      <div className="banner">
                        <img src={t.image} alt={t.name} />
                        <div className="badges">
                          {t.prizePool > 0 && <span className="mini yellow">High Prize</span>}
                          <StatusBadge status={isFull ? "Full" : t.uiStatus} />
                        </div>
                      </div>

                      <div className="body">
                        <h3>{t.name}</h3>

                        <div className="lines">
                          <p>
                            <Trophy size={15} /> {t.format}
                          </p>
                          <p>
                            <MapPin size={15} /> {t.location}
                          </p>
                          <p>
                            <Calendar size={15} /> {fmtDate(t.startDate)}
                          </p>
                          <p>
                            <DollarSign size={15} />{" "}
                            {t.entryFee === 0 ? "Free Entry" : `$${t.entryFee.toLocaleString()}`}
                          </p>
                        </div>

                        <div className="progress">
                          <div className="txt">
                            <span>
                              <Users size={13} /> {t.currentPlayers} / {t.maxPlayers} Players
                            </span>
                            <strong>{Math.round(progress)}%</strong>
                          </div>
                          <div className="bar">
                            <div
                              className={isFull ? "fill full" : "fill"}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>

                        {t.isRegistered ? (
                          <button className="action secondary" onClick={() => navigate(`/tournaments/${t.id}`)}>
                            View Details
                          </button>
                        ) : isFull ? (
                          <button className="action ghost" disabled>
                            Full
                          </button>
                        ) : (
                          <button className="action primary" onClick={() => onRegister(t)}>
                            Register Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : apiError ? (
              <div className="ptl-empty">
                <div className="icon">
                  <Search size={30} />
                </div>
                <h3>Unable to load tournaments</h3>
                <p>{apiError}</p>
                <button onClick={fetchTournaments}>Retry</button>
              </div>
            ) : (
              <div className="ptl-empty">
                <div className="icon">
                  <Search size={30} />
                </div>
                <h3>No tournaments found</h3>
                <p>Try changing your search text or filter options.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setAdv({ format: "", status: "", entryType: "", sort: "newest" });
                    setActiveChip("Upcoming");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
