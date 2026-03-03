package com.example.DAO;

import com.example.model.entity.PaymentTransaction;
import com.example.util.DBContext;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;

public class PaymentDAO {

    public boolean insertTransactionAndUpdateParticipant(PaymentTransaction tx, int participantId) {
        String sqlTx = "INSERT INTO Payment_Transaction (user_id, tournament_id, type, amount, balance_after, description, reference_id, create_at) "
                +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        // Cập nhật is_paid và status Active cho Participant (từ PendingPayment → thành viên chính thức)
        String sqlPart = "UPDATE Participants SET is_paid = 1, payment_date = ?, status = 'Active' WHERE participant_id = ?";

        try (Connection conn = DBContext.getConnection()) {
            conn.setAutoCommit(false); // Bắt đầu transaction

            try (PreparedStatement ps1 = conn.prepareStatement(sqlTx);
                    PreparedStatement ps2 = conn.prepareStatement(sqlPart)) {

                // 1. Thêm Payment Transaction
                ps1.setInt(1, tx.getUserId());
                if (tx.getTournamentId() != null && tx.getTournamentId() > 0) {
                    ps1.setInt(2, tx.getTournamentId());
                } else {
                    ps1.setNull(2, java.sql.Types.INTEGER);
                }
                ps1.setString(3, tx.getType());
                ps1.setBigDecimal(4, tx.getAmount());

                if (tx.getBalanceAfter() != null) {
                    ps1.setBigDecimal(5, tx.getBalanceAfter());
                } else {
                    ps1.setNull(5, java.sql.Types.DECIMAL);
                }

                ps1.setString(6, tx.getDescription());

                if (tx.getReferenceId() != null) {
                    ps1.setInt(7, tx.getReferenceId());
                } else {
                    ps1.setNull(7, java.sql.Types.INTEGER);
                }

                Timestamp now = new Timestamp(System.currentTimeMillis());
                ps1.setTimestamp(8, now);
                ps1.executeUpdate();

                // 2. Cập nhật is_paid cho Participant (chỉ khi có tham gia giải)
                if (participantId > 0 && tx.getTournamentId() != null) {
                    ps2.setTimestamp(1, now);
                    ps2.setInt(2, participantId);
                    int updatedRows = ps2.executeUpdate();
                    if (updatedRows == 0) {
                        // Rollback nếu không tìm thấy participant_id hợp lệ
                        conn.rollback();
                        return false;
                    }
                }

                conn.commit();
                return true;
            } catch (SQLException e) {
                conn.rollback();
                e.printStackTrace();
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}
