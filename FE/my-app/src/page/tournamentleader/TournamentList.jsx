import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import MainHeader from "../../component/common/MainHeader";
import SlidebarTournament from "../../component/tournament/SlideBarTournament";
import FilterSection from "../../component/tournament/FilterSection";
import TournamentTable from "../../component/tournament/TournamentTable";
import "../../assets/css/tournament-leader.css";

const TournamentList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tournaments, setTournaments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // User state for MainHeader
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:8080/ctms/api/tournaments",
        { withCredentials: true }
      );
      if (Array.isArray(res.data)) {
        setTournaments(res.data);
      } else {
        console.error("API does not return array:", res.data);
        setTournaments([]);
      }
    } catch (err) {
      console.error(err);
      alert("Cannot load tournaments");
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  // 👉 FILTER
  const filteredTournaments = useMemo(() => {
    // ✅ CHỐT CHẶN LẦN 2 (rất quan trọng)
    if (!Array.isArray(tournaments)) return [];

    return tournaments.filter((t) => {
      const matchesSearch =
        t.tournamentName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        t.location
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter ? t.status === statusFilter : true;
      const matchesType = typeFilter ? t.format === typeFilter : true;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tournaments, searchQuery, statusFilter, typeFilter]);

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
    setTypeFilter("");
  };

  if (loading) return <p>Loading tournaments...</p>;

  return (
    <div className="tl-layout">
      <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} />
      <SlidebarTournament />

      <div className="tl-main">
        <main className="tl-content" style={{ marginTop: "60px" }}>
          <div className="tl-container">
            <div className="tl-page-header">
              <h1>Tournament List</h1>
              <p>Manage and track your chess tournaments</p>
            </div>

            <FilterSection
              onSearchChange={setSearchQuery}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
              onReset={handleReset}
            />

            <TournamentTable 
              tournaments={filteredTournaments} 
              refresh={fetchTournaments}
            />
          </div>

          <footer className="tl-footer">
            © 2024 Chess Tournament Management System
          </footer>
        </main>
</div>
    </div>
  );
};

export default TournamentList;