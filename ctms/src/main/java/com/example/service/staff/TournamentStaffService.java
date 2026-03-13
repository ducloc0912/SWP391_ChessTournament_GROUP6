package com.example.service.staff;

import com.example.DAO.TournamentStaffDAO;
import com.example.model.entity.Tournament;
import com.example.model.entity.TournamentApprovalLog;
import com.example.model.entity.TournamentStaff;
import com.example.model.enums.ApprovalAction;
import com.example.model.enums.TournamentStatus;

import java.util.List;
import java.util.Map;

public class TournamentStaffService {
    private final TournamentStaffDAO tournamentStaffDAO = new TournamentStaffDAO();

    public List<Tournament> getAllTournaments() {
        return tournamentStaffDAO.getAllTournamentsForStaff();
    }

    public List<Tournament> getPendingTournaments() {
        return tournamentStaffDAO.getPendingTournamentsForStaff();
    }

    public Tournament getTournamentById(int id) {
        return tournamentStaffDAO.getTournamentById(id);
    }

    public boolean approveTournament(int tournamentId, int staffId, String note) {
        Tournament t = tournamentStaffDAO.getTournamentById(tournamentId);
        if (t == null) return false;
        return tournamentStaffDAO.updateTournamentStatusAndLog(
                tournamentId, staffId, t.getStatus(), TournamentStatus.Upcoming, ApprovalAction.Approve, note);
    }

    public boolean rejectTournament(int tournamentId, int staffId, String note) {
        Tournament t = tournamentStaffDAO.getTournamentById(tournamentId);
        if (t == null) return false;
        return tournamentStaffDAO.updateTournamentStatusAndLog(
                tournamentId, staffId, t.getStatus(), TournamentStatus.Rejected, ApprovalAction.Reject, note);
    }

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

    public List<Map<String, Object>> getTransactionSummary() {
        return tournamentStaffDAO.getTournamentTransactionSummary();
    }

    public List<Map<String, Object>> getTransactionsByTournament(int tournamentId) {
        return tournamentStaffDAO.getTransactionsByTournament(tournamentId);
    }

    public List<Map<String, Object>> getWithdrawals() {
        return tournamentStaffDAO.getAllWithdrawals();
    }

    public boolean markWithdrawalCompleted(int withdrawalId, int staffId, String transferRef) {
        return tournamentStaffDAO.markWithdrawalCompleted(withdrawalId, staffId, transferRef);
    }
}
