import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Eye,
  Edit2,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trophy
} from "lucide-react";

/* ===== Helpers ===== */
const statusClass = (status) => {
  switch (status) {
    case "Pending":
      return "tl-status upcoming";
    case "Ongoing":
      return "tl-status ongoing";
    case "Delayed":
      return "tl-status delayed";
    case "Rejected":
      return "tl-status rejected";
    default:
      return "tl-status";
  }
};

const typeClass = (type) => {
  switch (type) {
    case "ROUND_ROBIN":
      return "tl-type round";
    case "KNOCKOUT":
      return "tl-type knockout";
    case "HYBRID":
      return "tl-type hybrid";
    default:
      return "tl-type";
  }
};

const TournamentTable = ({ tournaments = [] }) => {
  const navigate = useNavigate();
  if (!Array.isArray(tournaments) || tournaments.length === 0) {
    return (
      <div className="tl-empty">
        <div className="tl-empty-icon">
          <Trophy size={40} />
        </div>
        <h3>No tournaments found</h3>
        <p>You haven't created any tournaments yet.</p>
        <button>Create Tournament</button>
      </div>
    );
  }

  return (
    <div className="tl-table-card">
      <div className="tl-table-scroll">
        <table className="tl-table">
          <thead>
            <tr>
              <th>Tournament</th>
              <th>Dates</th>
              <th>Location</th>
              <th className="center">Players</th>
              <th className="center">Type</th>
              <th className="center">Status</th>
              <th className="right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {tournaments.map((t) => (
              <tr key={t.tournamentId}>
                <td className="name">{t.tournamentName}</td>

                <td>
                  <Calendar size={14} />
                  {t.startDate} → {t.endDate}
                </td>

                <td>
                  <MapPin size={14} />
                  {t.location}
                </td>

                <td className="center">
                  <Users size={14} />
                  {t.minPlayer} - {t.maxPlayer}
                </td>

                <td className="center">
                  <span className={typeClass(t.format)}>{t.format}</span>
                </td>

                <td className="center">
                  <span className={statusClass(t.status)}>{t.status}</span>
                </td>

                <td className="right actions">
                  <Eye
                      size={16}
                      className="action-icon"
                      onClick={() => navigate(`/tournaments/${t.tournamentId}`)}
                    />
                  <Edit2 size={16} />
                  <Trash2 size={16} />
                  <MoreHorizontal size={16} className="mobile" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tl-pagination">
        <span>Showing 1 → {tournaments.length}</span>
        <div className="pager">
          <ChevronLeft />
          <ChevronRight />
        </div>
      </div>
    </div>
  );
};

export default TournamentTable;
