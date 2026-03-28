package com.example.DAO;

import com.example.model.entity.PaymentTransaction;
import com.example.util.DBContext;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PaymentDAO extends DBContext {

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
    public List<Integer> getPaidUserIdsByTournament(int tournamentId) {
        List<Integer> userIds = new ArrayList<>();
        String sql = "SELECT user_id FROM Participants WHERE tournament_id = ? AND is_paid = 1 AND (status IS NULL OR status = 'Active')";
        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    userIds.add(rs.getInt("user_id"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return userIds;
    }

    public List<Map<String, Object>> getWithdrawalsByUserId(int userId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT * FROM Withdrawal WHERE user_id = ? ORDER BY create_at DESC";
        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> w = new HashMap<>();
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

    /**
     * Chia lợi nhuận cho Leader khi giải đấu hoàn thành.
     */
    public boolean payoutLeaderProfit(int tournamentId, int leaderId) {
        String sumSql = "SELECT SUM(ABS(amount)) FROM Payment_Transaction WHERE tournament_id = ? AND type = 'EntryFee'";
        String updateBalanceSql = "UPDATE Users SET balance = balance + ? WHERE user_id = ?";
        String insertTxSql = """
            INSERT INTO Payment_Transaction (user_id, tournament_id, type, amount, balance_after, description, create_at)
            VALUES (?, ?, 'Prize', ?, (SELECT balance FROM Users WHERE user_id = ?), ?, GETDATE())
        """;

        Connection conn = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false);

            // 1. Tính tổng tiền đã thu
            BigDecimal totalProfit = BigDecimal.ZERO;
            try (PreparedStatement ps = conn.prepareStatement(sumSql)) {
                ps.setInt(1, tournamentId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && rs.getBigDecimal(1) != null) {
                        totalProfit = rs.getBigDecimal(1);
                    }
                }
            }

            if (totalProfit.compareTo(BigDecimal.ZERO) <= 0) {
                // Không có lợi nhuận để chia, vẫn trả về true để cho phép hoàn thành giải
                conn.rollback();
                return true; 
            }

            // 2. Cộng tiền cho Leader
            try (PreparedStatement ps = conn.prepareStatement(updateBalanceSql)) {
                ps.setBigDecimal(1, totalProfit);
                ps.setInt(2, leaderId);
                ps.executeUpdate();
            }

            // 3. Ghi log transaction (Loại 'Prize' hoặc bạn có thể dùng 'ProfitShare')
            try (PreparedStatement ps = conn.prepareStatement(insertTxSql)) {
                ps.setInt(1, leaderId);
                ps.setInt(2, tournamentId);
                ps.setBigDecimal(3, totalProfit);
                ps.setInt(4, leaderId);
                ps.setString(5, "Lợi nhuận từ giải đấu #" + tournamentId + " (Tổng phí tham gia)");
                ps.executeUpdate();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            e.printStackTrace();
            return false;
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
    }

    /**
     * Hoàn phí tham gia cho người chơi khi họ tự hủy đăng ký trước khi giải diễn ra.
     * @return true nếu hoàn tiền thành công, false nếu lỗi.
     */
    public boolean refundPlayerWithdrawal(int tournamentId, int userId, java.math.BigDecimal entryFee) {
        if (entryFee == null || entryFee.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return true;
        }

        String addBalanceSql = "UPDATE Users SET balance = ISNULL(balance, 0) + ? WHERE user_id = ?";
        String getBalanceSql = "SELECT balance FROM Users WHERE user_id = ?";
        String insertTxSql = "INSERT INTO Payment_Transaction (user_id, tournament_id, type, amount, balance_after, description, create_at) "
                + "VALUES (?, ?, 'Refund', ?, ?, ?, GETDATE())";

        Connection conn = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement ps = conn.prepareStatement(addBalanceSql)) {
                ps.setBigDecimal(1, entryFee);
                ps.setInt(2, userId);
                ps.executeUpdate();
            }

            java.math.BigDecimal balanceAfter = java.math.BigDecimal.ZERO;
            try (PreparedStatement ps = conn.prepareStatement(getBalanceSql)) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) balanceAfter = rs.getBigDecimal("balance");
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(insertTxSql)) {
                ps.setInt(1, userId);
                ps.setInt(2, tournamentId);
                ps.setBigDecimal(3, entryFee);
                ps.setBigDecimal(4, balanceAfter);
                ps.setString(5, "Hoàn phí tham gia do người chơi hủy đăng ký giải đấu #" + tournamentId);
                ps.executeUpdate();
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
     * Hoàn tiền Prize Pool cho leader khi giải đấu bị staff từ chối duyệt.
     * Giải đang ở trạng thái Pending nên chưa có người chơi nào đăng ký/thanh toán.
     */
    public boolean refundLeaderForRejection(int tournamentId, int leaderId, java.math.BigDecimal prizePool) {
        if (prizePool == null || prizePool.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return true; // Không có gì để hoàn
        }

        String addBalanceSql = "UPDATE Users SET balance = ISNULL(balance, 0) + ? WHERE user_id = ?";
        String getBalanceSql = "SELECT balance FROM Users WHERE user_id = ?";
        String insertTxSql = "INSERT INTO Payment_Transaction (user_id, tournament_id, type, amount, balance_after, description, create_at) "
                + "VALUES (?, ?, 'Refund', ?, ?, ?, GETDATE())";

        Connection conn = null;
        try {
            conn = DBContext.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement ps = conn.prepareStatement(addBalanceSql)) {
                ps.setBigDecimal(1, prizePool);
                ps.setInt(2, leaderId);
                ps.executeUpdate();
            }

            java.math.BigDecimal balanceAfter = java.math.BigDecimal.ZERO;
            try (PreparedStatement ps = conn.prepareStatement(getBalanceSql)) {
                ps.setInt(1, leaderId);
                try (java.sql.ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) balanceAfter = rs.getBigDecimal("balance");
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(insertTxSql)) {
                ps.setInt(1, leaderId);
                ps.setInt(2, tournamentId);
                ps.setBigDecimal(3, prizePool);
                ps.setBigDecimal(4, balanceAfter);
                ps.setString(5, "Hoàn tiền Prize Pool do giải đấu bị từ chối duyệt");
                ps.executeUpdate();
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
     * Kiểm tra giải thưởng của giải đã được chia hay chưa.
     */
    public boolean isPrizesAlreadyDistributed(int tournamentId) {
        String sql = "SELECT COUNT(*) FROM Prize_Distribution WHERE tournament_id = ? AND is_distributed = 1";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Tự động chia giải thưởng cho người chơi khi giải kết thúc.
     * Dựa vào Prize_Template (fixed_amount theo hạng) + Standing (bảng xếp hạng).
     * Ghi vào Prize_Distribution, Payment_Transaction, và cộng balance cho từng người chơi.
     */
    public boolean distributePrizes(int tournamentId, BigDecimal prizePool) {
        if (prizePool == null || prizePool.compareTo(BigDecimal.ZERO) <= 0) {
            return true; // Không có giải thưởng để chia
        }

        // Lấy Prize_Template kèm user_id từ Standing theo rank.
        // Dùng LEFT JOIN để vẫn lấy được template dù Standing chưa có đủ.
        // Ưu tiên fixed_amount; nếu = 0 thì fallback sang percentage * prizePool / 100.
        String querySql = """
            SELECT pt.rank_position, pt.fixed_amount, pt.percentage, pt.label, s.user_id
            FROM Prize_Template pt
            LEFT JOIN (
                SELECT tournament_id, user_id, current_rank,
                       ROW_NUMBER() OVER (PARTITION BY tournament_id, current_rank ORDER BY point DESC, tie_break DESC) AS rn
                FROM Standing
                WHERE tournament_id = ?
            ) s ON s.tournament_id = pt.tournament_id AND s.current_rank = pt.rank_position AND s.rn = 1
            WHERE pt.tournament_id = ?
            ORDER BY pt.rank_position ASC
        """;

        String updateBalanceSql = "UPDATE Users SET balance = balance + ? WHERE user_id = ?";

        String insertTxSql = """
            INSERT INTO Payment_Transaction (user_id, tournament_id, type, amount, balance_after, description, create_at)
            VALUES (?, ?, 'Prize', ?, (SELECT balance FROM Users WHERE user_id = ?), ?, GETDATE())
        """;

        String insertDistSql = """
            INSERT INTO Prize_Distribution (tournament_id, user_id, rank_position, prize_amount, is_distributed, distributed_at, note)
            VALUES (?, ?, ?, ?, 1, GETDATE(), ?)
        """;

        Connection conn = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false);

            // 1. Lấy danh sách người chơi được nhận thưởng
            List<Map<String, Object>> winners = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(querySql)) {
                ps.setInt(1, tournamentId);
                ps.setInt(2, tournamentId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        int userId = rs.getInt("user_id");
                        if (rs.wasNull() || userId == 0) continue; // Chưa có standing cho rank này
                        Map<String, Object> winner = new HashMap<>();
                        winner.put("rankPosition", rs.getInt("rank_position"));
                        winner.put("fixedAmount",  rs.getBigDecimal("fixed_amount"));
                        winner.put("percentage",   rs.getBigDecimal("percentage"));
                        winner.put("label",        rs.getString("label"));
                        winner.put("userId",       userId);
                        winners.add(winner);
                    }
                }
            }

            if (winners.isEmpty()) {
                conn.rollback();
                return true;
            }

            // 2. Tính tiền và chia thưởng cho từng người
            for (Map<String, Object> winner : winners) {
                int userId = (int) winner.get("userId");
                BigDecimal fixedAmount = (BigDecimal) winner.get("fixedAmount");
                BigDecimal percentage  = (BigDecimal) winner.get("percentage");
                int rankPosition = (int) winner.get("rankPosition");
                String label = (String) winner.get("label");

                // Ưu tiên fixed_amount; fallback sang percentage nếu fixed_amount = 0
                BigDecimal prizeAmount;
                if (fixedAmount != null && fixedAmount.compareTo(BigDecimal.ZERO) > 0) {
                    prizeAmount = fixedAmount;
                } else if (percentage != null && percentage.compareTo(BigDecimal.ZERO) > 0) {
                    prizeAmount = prizePool.multiply(percentage)
                            .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                } else {
                    continue; // Không có giá trị nào hợp lệ
                }

                if (prizeAmount.compareTo(BigDecimal.ZERO) <= 0) continue;

                // 2a. Cộng tiền vào ví người chơi
                try (PreparedStatement ps = conn.prepareStatement(updateBalanceSql)) {
                    ps.setBigDecimal(1, prizeAmount);
                    ps.setInt(2, userId);
                    ps.executeUpdate();
                }

                // 2b. Ghi Payment_Transaction
                String description = "Giai thuong hang " + rankPosition + " (" + label + ") - Giai #" + tournamentId;
                try (PreparedStatement ps = conn.prepareStatement(insertTxSql)) {
                    ps.setInt(1, userId);
                    ps.setInt(2, tournamentId);
                    ps.setBigDecimal(3, prizeAmount);
                    ps.setInt(4, userId);
                    ps.setString(5, description);
                    ps.executeUpdate();
                }

                // 2c. Ghi Prize_Distribution
                try (PreparedStatement ps = conn.prepareStatement(insertDistSql)) {
                    ps.setInt(1, tournamentId);
                    ps.setInt(2, userId);
                    ps.setInt(3, rankPosition);
                    ps.setBigDecimal(4, prizeAmount);
                    ps.setString(5, label + " - " + prizeAmount.toPlainString() + " VND");
                    ps.executeUpdate();
                }
            }

            conn.commit();
            System.out.println("[INFO] Da chia giai thuong cho " + winners.size() + " nguoi choi, giai #" + tournamentId);
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            e.printStackTrace();
            return false;
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
    }
}
