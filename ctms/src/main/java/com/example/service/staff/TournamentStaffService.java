package com.example.service.staff;

import com.example.DAO.TournamentStaffDAO;
import com.example.model.entity.Tournament;
import com.example.model.entity.TournamentApprovalLog;
import com.example.model.entity.TournamentStaff;
import com.example.model.enums.ApprovalAction;
import com.example.model.enums.TournamentStatus;

import java.util.List;

public class TournamentStaffService {
    private final TournamentStaffDAO tournamentStaffDAO = new TournamentStaffDAO();

    // =========================
    // TOURNAMENT MANAGEMENT
    // =========================

    public List<Tournament> getAllTournaments() {
        return tournamentStaffDAO.getAllTournamentsForStaff();
    }

    public Tournament getTournamentById(int id) {
        return tournamentStaffDAO.getTournamentById(id);
    }

    public boolean approveTournament(int tournamentId, int staffId, String note) {
        Tournament t = tournamentStaffDAO.getTournamentById(tournamentId);
        if (t == null) return false;
        return tournamentStaffDAO.updateTournamentStatusAndLog(
                tournamentId, staffId, t.getStatus(), TournamentStatus.Ongoing, ApprovalAction.Approve, note);
    }

    public boolean rejectTournament(int tournamentId, int staffId, String note) {
        Tournament t = tournamentStaffDAO.getTournamentById(tournamentId);
        if (t == null) return false;
        return tournamentStaffDAO.updateTournamentStatusAndLog(
                tournamentId, staffId, t.getStatus(), TournamentStatus.Rejected, ApprovalAction.Reject, note);
    }

    // Generic status update
    public boolean updateTournamentStatus(int tournamentId, int staffId, TournamentStatus newStatus,
                                          ApprovalAction action, String note) {
        Tournament t = tournamentStaffDAO.getTournamentById(tournamentId);
        if (t == null) return false;
        return tournamentStaffDAO.updateTournamentStatusAndLog(
                tournamentId, staffId, t.getStatus(), newStatus, action, note);
    }

    public List<TournamentApprovalLog> getTournamentLogs(int tournamentId) {
        return tournamentStaffDAO.getApprovalLogsByTournament(tournamentId);
    }

    public boolean assignStaff(TournamentStaff assignment) {
        return tournamentStaffDAO.assignStaffToTournament(assignment);
    }
}
