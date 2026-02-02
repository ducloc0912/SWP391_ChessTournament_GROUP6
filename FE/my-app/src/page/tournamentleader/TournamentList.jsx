import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import HeaderTournament from "../../component/HeaderTournament";
import SlidebarTournament from "../../component/SlideBarTournament";
import FilterSection from "../../component/FilterSection";
import TournamentTable from "../../component/TournamentTable";

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // 👉 GỌI BE
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8080/ctms/api/tournaments"
        );

        // ✅ CHỐT CHẶN: đảm bảo luôn là array
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
      <SlidebarTournament />

      <div className="tl-main">
        <HeaderTournament />

        <main className="tl-content">
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

            <TournamentTable tournaments={filteredTournaments} />
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
