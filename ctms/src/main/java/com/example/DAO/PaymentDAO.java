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

    public boolean insertDepositTransaction(PaymentTransaction tx) {
        String sqlTx = "INSERT INTO Payment_Transaction (user_id, type, amount, balance_after, description, reference_id, create_at) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sqlTx)) {

            ps.setInt(1, tx.getUserId());
            ps.setString(2, tx.getType());
            ps.setBigDecimal(3, tx.getAmount());

            if (tx.getBalanceAfter() != null) {
                ps.setBigDecimal(4, tx.getBalanceAfter());
            } else {
                ps.setNull(4, java.sql.Types.DECIMAL);
            }
            ps.setString(5, tx.getDescription());

            if (tx.getReferenceId() != null) {
                ps.setInt(6, tx.getReferenceId());
            } else {
                ps.setNull(6, java.sql.Types.INTEGER);
            }
            Timestamp now = new Timestamp(System.currentTimeMillis());
            ps.setTimestamp(7, now);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public java.util.List<PaymentTransaction> getTransactionsByUserId(int userId) {
        java.util.List<PaymentTransaction> list = new java.util.ArrayList<>();
        String sql = "SELECT * FROM Payment_Transaction WHERE user_id = ? ORDER BY create_at DESC";
        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (java.sql.ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    PaymentTransaction tx = new PaymentTransaction();
                    tx.setTransactionId(rs.getInt("transaction_id"));
                    tx.setUserId(rs.getInt("user_id"));
                    tx.setTournamentId(rs.getInt("tournament_id"));
                    if (rs.wasNull()) tx.setTournamentId(null);
                    tx.setType(rs.getString("type"));
                    tx.setAmount(rs.getBigDecimal("amount"));
                    tx.setBalanceAfter(rs.getBigDecimal("balance_after"));
                    tx.setDescription(rs.getString("description"));
                    tx.setReferenceId(rs.getInt("reference_id"));
                    if (rs.wasNull()) tx.setReferenceId(null);
                    tx.setCreateAt(rs.getTimestamp("create_at"));
                    list.add(tx);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean createWithdrawalRequest(int userId, java.math.BigDecimal amount, String bankName, String bankAccountNumber, String bankAccountName) {
        String updateBalanceSql = "UPDATE Users SET balance = balance - ? WHERE user_id = ? AND balance >= ?";
        String insertWithdrawalSql = "INSERT INTO Withdrawal (user_id, amount, bank_name, bank_account_number, bank_account_name, status, create_at) VALUES (?, ?, ?, ?, ?, 'Pending', GETDATE())";
        String insertTxSql = "INSERT INTO Payment_Transaction (user_id, type, amount, description, create_at) VALUES (?, 'Withdrawal', ?, ?, GETDATE())";

        Connection conn = null;
        try {
            conn = DBContext.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement psUpdate = conn.prepareStatement(updateBalanceSql)) {
                psUpdate.setBigDecimal(1, amount);
                psUpdate.setInt(2, userId);
                psUpdate.setBigDecimal(3, amount);
                int rows = psUpdate.executeUpdate();
                if (rows == 0) {
                    conn.rollback();
                    return false;
                }
            }

            try (PreparedStatement psInsert = conn.prepareStatement(insertWithdrawalSql)) {
                psInsert.setInt(1, userId);
                psInsert.setBigDecimal(2, amount);
                psInsert.setString(3, bankName);
                psInsert.setString(4, bankAccountNumber);
                psInsert.setString(5, bankAccountName);
                psInsert.executeUpdate();
            }

            try (PreparedStatement psTx = conn.prepareStatement(insertTxSql)) {
                psTx.setInt(1, userId);
                psTx.setBigDecimal(2, amount.negate());
                psTx.setString(3, "Yêu cầu rút tiền về " + bankName + " (" + bankAccountNumber + ")");
                psTx.executeUpdate();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            e.printStackTrace();
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return false;
    }

    /**
     * Trừ tiền leader khi tạo giải đấu.
     * Atomic: kiểm tra balance >= prizePool, trừ balance, ghi Payment_Transaction.
     * @return true nếu trừ thành công, false nếu không đủ tiền hoặc lỗi.
     */
    public boolean deductBalanceForTournamentCreation(int userId, int tournamentId, java.math.BigDecimal prizePool) {
        if (prizePool == null || prizePool.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return true; // Không cần trừ nếu prizePool = 0
        }

        String updateBalanceSql = "UPDATE Users SET balance = balance - ? WHERE user_id = ? AND balance >= ?";
        String getBalanceSql = "SELECT balance FROM Users WHERE user_id = ?";
        String insertTxSql = "INSERT INTO Payment_Transaction (user_id, tournament_id, type, amount, balance_after, description, create_at) "
                + "VALUES (?, ?, 'TournamentCreation', ?, ?, ?, GETDATE())";

        Connection conn = null;
        try {
            conn = DBContext.getConnection();
            conn.setAutoCommit(false);

            // 1. Trừ balance (nếu đủ)
            try (PreparedStatement psUpdate = conn.prepareStatement(updateBalanceSql)) {
                psUpdate.setBigDecimal(1, prizePool);
                psUpdate.setInt(2, userId);
                psUpdate.setBigDecimal(3, prizePool);
                int rows = psUpdate.executeUpdate();
                if (rows == 0) {
                    conn.rollback();
                    return false; // Không đủ tiền
                }
            }

            // 2. Lấy balance sau khi trừ
            java.math.BigDecimal balanceAfter = java.math.BigDecimal.ZERO;
            try (PreparedStatement psBalance = conn.prepareStatement(getBalanceSql)) {
                psBalance.setInt(1, userId);
                try (java.sql.ResultSet rs = psBalance.executeQuery()) {
                    if (rs.next()) {
                        balanceAfter = rs.getBigDecimal("balance");
                    }
                }
            }

            // 3. Ghi transaction
            try (PreparedStatement psTx = conn.prepareStatement(insertTxSql)) {
                psTx.setInt(1, userId);
                psTx.setInt(2, tournamentId);
                psTx.setBigDecimal(3, prizePool.negate()); // Số tiền âm (trừ)
                psTx.setBigDecimal(4, balanceAfter);
                psTx.setString(5, "Trừ tiền tạo giải đấu (Prize Pool)");
                psTx.executeUpdate();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            e.printStackTrace();
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return false;
    }

    /**
     * Hoàn tiền khi giải đấu bị hủy.
     * Hoàn prizePool cho leader (nếu > 0) và hoàn entryFee cho tất cả người chơi đã thanh toán.
     * @return true nếu hoàn tiền thành công, false nếu lỗi.
     */
    public boolean refundTournamentCancellation(int tournamentId, int leaderId,
            java.math.BigDecimal prizePool, java.math.BigDecimal entryFee,
            java.util.List<Integer> paidUserIds) {

        String addBalanceSql = "UPDATE Users SET balance = ISNULL(balance, 0) + ? WHERE user_id = ?";
        String getBalanceSql = "SELECT balance FROM Users WHERE user_id = ?";
        String insertTxSql = "INSERT INTO Payment_Transaction (user_id, tournament_id, type, amount, balance_after, description, create_at) "
                + "VALUES (?, ?, 'Refund', ?, ?, ?, GETDATE())";

        Connection conn = null;
        try {
            conn = DBContext.getConnection();
            conn.setAutoCommit(false);

            // 1. Hoàn prizePool cho leader
            if (prizePool != null && prizePool.compareTo(java.math.BigDecimal.ZERO) > 0) {
                try (PreparedStatement ps = conn.prepareStatement(addBalanceSql)) {
                    ps.setBigDecimal(1, prizePool);
                    ps.setInt(2, leaderId);
                    ps.executeUpdate();
                }

                java.math.BigDecimal leaderBalanceAfter = java.math.BigDecimal.ZERO;
                try (PreparedStatement ps = conn.prepareStatement(getBalanceSql)) {
                    ps.setInt(1, leaderId);
                    try (java.sql.ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) leaderBalanceAfter = rs.getBigDecimal("balance");
                    }
                }

                try (PreparedStatement ps = conn.prepareStatement(insertTxSql)) {
                    ps.setInt(1, leaderId);
                    ps.setInt(2, tournamentId);
                    ps.setBigDecimal(3, prizePool); // Số tiền dương (hoàn)
                    ps.setBigDecimal(4, leaderBalanceAfter);
                    ps.setString(5, "Hoàn tiền Prize Pool do giải đấu bị hủy");
                    ps.executeUpdate();
                }
            }

            // 2. Hoàn entryFee cho các người chơi đã thanh toán
            if (entryFee != null && entryFee.compareTo(java.math.BigDecimal.ZERO) > 0
                    && paidUserIds != null && !paidUserIds.isEmpty()) {

                for (int playerId : paidUserIds) {
                    try (PreparedStatement ps = conn.prepareStatement(addBalanceSql)) {
                        ps.setBigDecimal(1, entryFee);
                        ps.setInt(2, playerId);
                        ps.executeUpdate();
                    }

                    java.math.BigDecimal playerBalanceAfter = java.math.BigDecimal.ZERO;
                    try (PreparedStatement ps = conn.prepareStatement(getBalanceSql)) {
                        ps.setInt(1, playerId);
                        try (java.sql.ResultSet rs = ps.executeQuery()) {
                            if (rs.next()) playerBalanceAfter = rs.getBigDecimal("balance");
                        }
                    }

                    try (PreparedStatement ps = conn.prepareStatement(insertTxSql)) {
                        ps.setInt(1, playerId);
                        ps.setInt(2, tournamentId);
                        ps.setBigDecimal(3, entryFee); // Số tiền dương (hoàn)
                        ps.setBigDecimal(4, playerBalanceAfter);
                        ps.setString(5, "Hoàn phí tham gia do giải đấu bị hủy");
                        ps.executeUpdate();
                    }
                }
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            e.printStackTrace();
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return false;
    }

    /**
     * Lấy danh sách user_id đã thanh toán (is_paid = 1) cho một giải đấu.
     */
    public java.util.List<Integer> getPaidUserIdsByTournament(int tournamentId) {
        java.util.List<Integer> userIds = new java.util.ArrayList<>();
        String sql = "SELECT user_id FROM Participants WHERE tournament_id = ? AND is_paid = 1 AND (status IS NULL OR status = 'Active')";
        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (java.sql.ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    userIds.add(rs.getInt("user_id"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return userIds;
    }

    public java.util.List<java.util.Map<String, Object>> getWithdrawalsByUserId(int userId) {
        java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
        String sql = "SELECT * FROM Withdrawal WHERE user_id = ? ORDER BY create_at DESC";
        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (java.sql.ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> w = new java.util.HashMap<>();
                    w.put("withdrawalId", rs.getInt("withdrawal_id"));
                    w.put("amount", rs.getBigDecimal("amount"));
                    w.put("bankName", rs.getString("bank_name"));
                    w.put("bankAccountNumber", rs.getString("bank_account_number"));
                    w.put("bankAccountName", rs.getString("bank_account_name"));
                    w.put("status", rs.getString("status"));
                    w.put("createAt", rs.getTimestamp("create_at"));
                    w.put("bankTransferRef", rs.getString("bank_transfer_ref"));
                    w.put("rejectionReason", rs.getString("rejection_reason"));
                    list.add(w);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}

