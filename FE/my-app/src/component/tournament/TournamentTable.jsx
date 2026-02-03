import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
                  {t.currentPlayers} - {t.maxPlayer}
                </td>

                <td className="center">
                  <span className="tl-type">{t.format}</span>
                </td>

                <td className="center">
                  <span className="tl-status">{t.status}</span>
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
