package com.example.service.staff;

import com.example.DAO.TournamentStaffDAO;
import com.example.DAO.PaymentDAO;
import com.example.model.entity.Tournament;
import com.example.model.entity.TournamentApprovalLog;
import com.example.model.entity.TournamentStaff;
import com.example.model.enums.ApprovalAction;
import com.example.model.enums.TournamentStatus;
import com.example.model.dto.TournamentSetupStateDTO;
import com.example.service.leader.TournamentSetupService;
import com.example.service.leader.TournamentNotificationService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class TournamentStaffService {
    private final TournamentStaffDAO tournamentStaffDAO = new TournamentStaffDAO();
    private final PaymentDAO paymentDAO = new PaymentDAO();
    private final TournamentNotificationService notificationService = new TournamentNotificationService();

    public List<Tournament> getAllTournaments() {
        return tournamentStaffDAO.getAllTournamentsForStaff();
    }

    public List<Tournament> getPendingTournaments() {
        return tournamentStaffDAO.getPendingTournamentsForStaff();
    }

    public List<Tournament> getNonPendingTournaments() {
        return tournamentStaffDAO.getNonPendingTournamentsForStaff();
    }

    public Tournament getTournamentById(int id) {
        return tournamentStaffDAO.getTournamentById(id);
    }

    public boolean approveTournament(int tournamentId, int staffId, String note) {
        boolean ok = updateTournamentStatus(tournamentId, staffId, TournamentStatus.Upcoming, ApprovalAction.Approve, note);
        if (ok) {
            notificationService.notifyFollowers(tournamentId, "Tournament Approved", 
                "The tournament has been approved and is now Upcoming.", "INFO", "/tournaments/public");
        }
        return ok;
    }

    public boolean rejectTournament(int tournamentId, int staffId, String note) {
        Tournament t = tournamentStaffDAO.getTournamentById(tournamentId);
        if (t == null) return false;
        boolean ok = tournamentStaffDAO.updateTournamentStatusAndLog(
                tournamentId, staffId, t.getStatus(), TournamentStatus.Rejected, ApprovalAction.Reject, note);
        if (ok) {
            notificationService.notifyFollowers(tournamentId, "Tournament Rejected", 
                "The tournament you followed has been rejected by staff.", "WARNING", "/tournaments/public");
        }
        return ok;
    }

    public boolean updateTournamentStatus(int tournamentId, int staffId, TournamentStatus newStatus,
                                          ApprovalAction action, String note) {
        Tournament t = tournamentStaffDAO.getTournamentById(tournamentId);
        if (t == null) return false;

        boolean success = tournamentStaffDAO.updateTournamentStatusAndLog(
                tournamentId, staffId, t.getStatus(), newStatus, action, note);

        // Nếu chuyển sang trạng thái Completed:
        // 1. Chia lợi nhuận (entry fee đã thu) cho Leader
        // 2. Chia giải thưởng (prize_pool) cho người chơi theo bảng xếp hạng
        if (success && newStatus == TournamentStatus.Completed) {
            paymentDAO.payoutLeaderProfit(tournamentId, t.getCreateBy());
            paymentDAO.distributePrizes(tournamentId, t.getPrizePool());
        }

        return success;
    }

    /**
     * Hủy giải đấu kèm hoàn tiền (prizePool cho leader, entryFee cho player đã thanh toán).
     */
    public boolean cancelTournamentWithRefund(int tournamentId, int staffId, String note) {
        Tournament t = tournamentStaffDAO.getTournamentById(tournamentId);
        if (t == null) return false;

        // Cập nhật status -> Cancelled và ghi log
        boolean cancelled = tournamentStaffDAO.updateTournamentStatusAndLog(
                tournamentId, staffId, t.getStatus(), TournamentStatus.Cancelled, ApprovalAction.Cancel, note);
        if (!cancelled) return false;

        // Hoàn tiền nếu giải có phí
        BigDecimal prizePool = t.getPrizePool();
        BigDecimal entryFee = t.getEntryFee();
        int leaderId = t.getCreateBy();

        boolean needRefundPrize = prizePool != null && prizePool.compareTo(BigDecimal.ZERO) > 0;
        boolean needRefundEntry = entryFee != null && entryFee.compareTo(BigDecimal.ZERO) > 0;

        if (needRefundPrize || needRefundEntry) {
            List<Integer> paidUserIds = needRefundEntry
                    ? paymentDAO.getPaidUserIdsByTournament(tournamentId)
                    : List.of();

            boolean refunded = paymentDAO.refundTournamentCancellation(
                    tournamentId, leaderId, prizePool, entryFee, paidUserIds);

            if (!refunded) {
                System.err.println("[WARNING] Giải đấu #" + tournamentId + " đã bị hủy bởi staff nhưng hoàn tiền thất bại!");
            }
        }

        if (cancelled) {
            notificationService.notifyFollowers(tournamentId, "Tournament Cancelled", 
                "The tournament has been cancelled. Refunds are being processed if applicable.", "ERROR", "/tournaments/public");
        }

        return true;
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

    public boolean rejectWithdrawal(int withdrawalId, int staffId, String reason) {
        return tournamentStaffDAO.rejectWithdrawal(withdrawalId, staffId, reason);
    }
}

