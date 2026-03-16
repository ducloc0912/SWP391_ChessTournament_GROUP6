package com.example.service.staff;

import com.example.DAO.NotificationDAO;
import com.example.DAO.ParticipantDAO;
import com.example.DAO.PaymentDAO;
import com.example.DAO.TournamentStaffDAO;
import com.example.model.entity.Notification;
import com.example.model.entity.Participant;
import com.example.model.entity.Tournament;
import com.example.model.entity.TournamentApprovalLog;
import com.example.model.entity.TournamentStaff;
import com.example.model.enums.ApprovalAction;
import com.example.model.enums.ParticipantStatus;
import com.example.model.enums.TournamentStatus;
import com.example.service.leader.TournamentNotificationService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class TournamentStaffService {
    private final TournamentStaffDAO tournamentStaffDAO = new TournamentStaffDAO();
    private final NotificationDAO notificationDAO = new NotificationDAO();
    private final ParticipantDAO participantDAO = new ParticipantDAO();
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
        return updateTournamentStatus(tournamentId, staffId, TournamentStatus.Upcoming, ApprovalAction.Approve, note);
    }

    public boolean rejectTournament(int tournamentId, int staffId, String note) {
        return updateTournamentStatus(tournamentId, staffId, TournamentStatus.Rejected, ApprovalAction.Reject, note);
    }

    public boolean cancelTournamentWithRefund(int tournamentId, int staffId, String note) {
        Tournament t = tournamentStaffDAO.getTournamentById(tournamentId);
        if (t == null) return false;

        // Hoàn tiền cho các người chơi đã thanh toán (status = Active)
        List<Integer> paidUserIds = participantDAO.getParticipantsByTournamentId(tournamentId)
                .stream()
                .filter(p -> p.getStatus() == ParticipantStatus.Active)
                .map(Participant::getUserId)
                .collect(Collectors.toList());

        BigDecimal entryFee = t.getEntryFee();
        if (entryFee != null && entryFee.compareTo(BigDecimal.ZERO) > 0 && !paidUserIds.isEmpty()) {
            paymentDAO.refundTournamentCancellation(tournamentId, t.getCreateBy(), t.getPrizePool(), entryFee, paidUserIds);
        }

        // Cập nhật trạng thái và ghi log
        boolean ok = tournamentStaffDAO.updateTournamentStatusAndLog(
                tournamentId, staffId, t.getStatus(), TournamentStatus.Cancelled, ApprovalAction.Cancel, note);

        if (ok) {
            try {
                // Thông báo cho người theo dõi giải đấu
                notificationService.notifyFollowers(
                        tournamentId,
                        "Giải đấu đã bị hủy",
                        "Giải đấu '" + t.getTournamentName() + "' đã bị hủy bởi staff."
                                + (note != null && !note.isBlank() ? " Lý do: " + note : ""),
                        "Tournament",
                        "/tournaments"
                );
                // Thông báo cho leader tạo giải
                if (t.getCreateBy() != null) {
                    Notification n = new Notification();
                    n.setTitle("Giải đấu của bạn đã bị hủy");
                    n.setMessage("Giải đấu '" + t.getTournamentName() + "' đã bị staff hủy."
                            + (note != null && !note.isBlank() ? " Lý do: " + note : ""));
                    n.setType("Tournament");
                    n.setActionUrl("/leader/tournaments");
                    n.setUserId(t.getCreateBy());
                    notificationDAO.createNotification(n);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return ok;
    }

    public boolean updateTournamentStatus(int tournamentId, int staffId, TournamentStatus newStatus,
                                          ApprovalAction action, String note) {
        Tournament t = tournamentStaffDAO.getTournamentById(tournamentId);
        if (t == null) return false;
        boolean ok = tournamentStaffDAO.updateTournamentStatusAndLog(
                tournamentId, staffId, t.getStatus(), newStatus, action, note);
        if (ok && t.getCreateBy() != null) {
            try {
                boolean approved = (action == ApprovalAction.Approve);
                Notification n = new Notification();
                n.setTitle(approved ? "Giải đấu của bạn đã được duyệt" : "Giải đấu của bạn không được duyệt");
                n.setMessage(approved
                        ? "Giải đấu '" + t.getTournamentName() + "' đã được staff chấp thuận. Giải đấu sẵn sàng mở đăng ký."
                        : "Giải đấu '" + t.getTournamentName() + "' chưa được chấp thuận."
                            + (note != null && !note.isBlank() ? " Lý do: " + note : ""));
                n.setType("Tournament");
                n.setActionUrl("/leader/tournaments");
                n.setUserId(t.getCreateBy());
                notificationDAO.createNotification(n);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return ok;
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

