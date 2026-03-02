import React, { useState } from "react";
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

const EDITABLE_STATUSES = ["Pending", "Rejected", "Delayed", "Cancelled"];
const CANCELLED_ABLE = ["Pending", "Ongoing", "Delayed"];

const TournamentTable = ({ tournaments = [], refresh }) => {
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const handleOpenConfirm = (tournament) => {
    setSelectedTournament(tournament);
    setCancelReason("");
    setShowConfirm(true);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setSelectedTournament(null);
  };

  const handleConfirmDelete = async () => {
    if (!cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy giải!");
      return;
    }
    try {
      await axios.delete(
        `http://localhost:8080/ctms/api/tournaments`,
        {
          params: {
            id: selectedTournament.tournamentId,
            reason: cancelReason
          },
          withCredentials: true
        }
      );

      setShowConfirm(false);
      setSelectedTournament(null);
      setCancelReason("");

      alert("Hủy giải thành công!");
      if (refresh) refresh();
    } catch (err) {
      console.error(err);
      alert("Hủy giải thất bại!");
    }
  };

  if (!Array.isArray(tournaments) || tournaments.length === 0) {
    return (
      <div className="tl-empty">
        <div className="tl-empty-icon">
          <Trophy size={40} />
        </div>
        <h3>No tournaments found</h3>
        <p>You haven't created any tournaments yet.</p>
        <button onClick={() => navigate("/tournaments/create")}>
          Create Tournament
        </button>
      </div>
    );
  }

  return (
    <>
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
                    {t.currentPlayers} / {t.maxPlayer}
                  </td>

                  <td className="center">
                    <span className="tl-type">{t.format}</span>
                  </td>

                  <td className="center">
                    <span className={`tl-status ${t.status?.toLowerCase()}`}>
                      {t.status}
                    </span>
                  </td>

                  <td className="right actions">
                    <Eye
                      size={16}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate(`/tournaments/${t.tournamentId}`)
                      }
                    />

                    {EDITABLE_STATUSES.includes(t.status) && (
                      <Edit2
                        size={16}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(`/tournaments/edit/${t.tournamentId}`)
                        }
                      />
                    )}

                    {CANCELLED_ABLE.includes(t.status) && (
                      <Trash2
                        size={16}
                        style={{ cursor: "pointer", color: "#ef4444" }}
                        onClick={() => handleOpenConfirm(t)}
                      />
                    )}

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

      {/* ===== Confirm Popup ===== */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Hủy giải đấu</h3>
            <p>
              Bạn chắc chắn muốn hủy giải{" "}
              <strong>{selectedTournament?.tournamentName}</strong>?
            </p>

            <label className="modal-label">Lý do hủy giải</label>
            <textarea
              className="modal-textarea"
              rows={4}
              placeholder="Nhập lý do hủy giải..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />

            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCancel}>
                Hủy
              </button>
              <button className="btn-confirm" onClick={handleConfirmDelete}>
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TournamentTable;
