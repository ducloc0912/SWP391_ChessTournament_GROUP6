package com.example.DAO;

import com.example.model.entity.Tournament;
import com.example.model.entity.TournamentApprovalLog;
import com.example.model.entity.TournamentStaff;
import com.example.model.enums.ApprovalAction;
import com.example.model.enums.TournamentFormat;
import com.example.model.enums.TournamentStaffRole;
import com.example.model.enums.TournamentStatus;
import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class TournamentStaffDAO extends DBContext {

    public List<Tournament> getAllTournamentsForStaff() {
        List<Tournament> list = new ArrayList<>();
        String sql = "SELECT * FROM Tournaments ORDER BY create_at DESC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToTournament(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Tournament> getPendingTournamentsForStaff() {
        List<Tournament> list = new ArrayList<>();
        String sql = "SELECT * FROM Tournaments WHERE status = 'Pending' ORDER BY create_at DESC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToTournament(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Tournament> getNonPendingTournamentsForStaff() {
        List<Tournament> list = new ArrayList<>();
        String sql = "SELECT * FROM Tournaments WHERE status != 'Pending' ORDER BY create_at DESC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToTournament(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public Tournament getTournamentById(int id) {
        String sql = "SELECT * FROM Tournaments WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToTournament(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean updateTournamentStatusAndLog(int tournamentId, int staffId,
                                                TournamentStatus oldStatus, TournamentStatus newStatus,
                                                ApprovalAction action, String note) {
        String updateSql = "UPDATE Tournaments SET status = ? WHERE tournament_id = ?";
        String logSql = """
            INSERT INTO Tournament_Approval_Log (tournament_id, staff_id, action, from_status, to_status, note, create_at)
            VALUES (?, ?, ?, ?, ?, ?, GETDATE())
        """;

        Connection conn = null;
        PreparedStatement psUpdate = null;
        PreparedStatement psLog = null;

        try {
            conn = getConnection();
            conn.setAutoCommit(false);

            psUpdate = conn.prepareStatement(updateSql);
            psUpdate.setString(1, newStatus.name());
            psUpdate.setInt(2, tournamentId);
            int rowsUpdated = psUpdate.executeUpdate();
            if (rowsUpdated == 0) {
                conn.rollback();
                return false;
            }

            psLog = conn.prepareStatement(logSql);
            psLog.setInt(1, tournamentId);
            psLog.setInt(2, staffId);
            psLog.setString(3, action.name());
            psLog.setString(4, oldStatus.name());
            psLog.setString(5, newStatus.name());
            psLog.setString(6, note);
            psLog.executeUpdate();

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException ex) {
                    ex.printStackTrace();
                }
            }
            e.printStackTrace();
            return false;
        } finally {
            try {
                if (psUpdate != null) psUpdate.close();
                if (psLog != null) psLog.close();
                if (conn != null) {
                    conn.setAutoCommit(true);
                    conn.close();
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    public List<TournamentApprovalLog> getApprovalLogsByTournament(int tournamentId) {
        List<TournamentApprovalLog> list = new ArrayList<>();
        String sql = "SELECT * FROM Tournament_Approval_Log WHERE tournament_id = ? ORDER BY create_at DESC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToLog(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean assignStaffToTournament(TournamentStaff assignments) {
        String sql = """
            INSERT INTO Tournament_Staff (tournament_id, staff_id, staff_role, assigned_by, assigned_at, note)
            VALUES (?, ?, ?, ?, GETDATE(), ?)
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, assignments.getTournamentId());
            ps.setInt(2, assignments.getStaffId());
            ps.setString(3, assignments.getStaffRole().name());
            ps.setInt(4, assignments.getAssignedBy());
            ps.setString(5, assignments.getNote());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public List<TournamentStaff> getStaffByTournament(int tournamentId) {
        List<TournamentStaff> list = new ArrayList<>();
        String sql = "SELECT * FROM Tournament_Staff WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    TournamentStaff ts = new TournamentStaff();
                    ts.setTournamentId(rs.getInt("tournament_id"));
                    ts.setStaffId(rs.getInt("staff_id"));
                    ts.setStaffRole(parseStaffRole(rs.getString("staff_role")));
                    ts.setAssignedBy(rs.getInt("assigned_by"));
                    ts.setAssignedAt(rs.getTimestamp("assigned_at"));
                    ts.setNote(rs.getString("note"));
                    list.add(ts);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Map<String, Object>> getTournamentTransactionSummary() {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT t.tournament_id,
                   t.tournament_name,
                   t.location,
                   t.format,
                   t.status,
                   COUNT(pt.transaction_id) AS transaction_count,
                   COALESCE(SUM(CASE WHEN pt.type = 'EntryFee' THEN pt.amount ELSE 0 END), 0) AS total_entry_fee,
                   COALESCE(SUM(CASE WHEN pt.type = 'Refund' THEN ABS(pt.amount) ELSE 0 END), 0) AS total_refund,
                   COALESCE(SUM(pt.amount), 0) AS net_amount
            FROM Tournaments t
            LEFT JOIN Payment_Transaction pt ON pt.tournament_id = t.tournament_id
            GROUP BY t.tournament_id, t.tournament_name, t.location, t.format, t.status
            ORDER BY t.create_at DESC
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("tournamentId", rs.getInt("tournament_id"));
                row.put("tournamentName", rs.getString("tournament_name"));
                row.put("location", rs.getString("location"));
                row.put("format", rs.getString("format"));
                row.put("status", rs.getString("status"));
                row.put("transactionCount", rs.getInt("transaction_count"));
                row.put("totalEntryFee", rs.getBigDecimal("total_entry_fee"));
                row.put("totalRefund", rs.getBigDecimal("total_refund"));
                row.put("netAmount", rs.getBigDecimal("net_amount"));
                list.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Map<String, Object>> getTransactionsByTournament(int tournamentId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT pt.transaction_id,
                   pt.user_id,
                   u.username,
                   u.first_name,
                   u.last_name,
                   pt.tournament_id,
                   pt.type,
                   pt.amount,
                   pt.balance_after,
                   pt.description,
                   pt.reference_id,
                   pt.create_at
            FROM Payment_Transaction pt
            INNER JOIN Users u ON u.user_id = pt.user_id
            WHERE pt.tournament_id = ?
            ORDER BY pt.create_at DESC
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("transactionId", rs.getInt("transaction_id"));
                    row.put("userId", rs.getInt("user_id"));
                    row.put("username", rs.getString("username"));
                    row.put("firstName", rs.getString("first_name"));
                    row.put("lastName", rs.getString("last_name"));
                    row.put("tournamentId", rs.getInt("tournament_id"));
                    row.put("type", rs.getString("type"));
                    row.put("amount", rs.getBigDecimal("amount"));
                    row.put("balanceAfter", rs.getBigDecimal("balance_after"));
                    row.put("description", rs.getString("description"));
                    row.put("referenceId", rs.getObject("reference_id"));
                    row.put("createAt", rs.getTimestamp("create_at") != null
                            ? rs.getTimestamp("create_at").toLocalDateTime()
                            : null);
                    list.add(row);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Map<String, Object>> getAllWithdrawals() {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT w.withdrawal_id,
                   w.user_id,
                   u.username,
                   u.first_name,
                   u.last_name,
                   u.email,
                   u.phone_number,
                   w.amount,
                   w.bank_name,
                   w.bank_account_number,
                   w.bank_account_name,
                   w.status,
                   w.rejection_reason,
                   w.approved_by,
                   w.approved_at,
                   w.bank_transfer_ref,
                   w.create_at
            FROM Withdrawal w
            INNER JOIN Users u ON u.user_id = w.user_id
            ORDER BY CASE WHEN w.status = 'Pending' THEN 0
                          WHEN w.status = 'Approved' THEN 1
                          WHEN w.status = 'Rejected' THEN 2
                          ELSE 3 END,
                     w.create_at DESC
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("withdrawalId", rs.getInt("withdrawal_id"));
                row.put("userId", rs.getInt("user_id"));
                row.put("username", rs.getString("username"));
                row.put("firstName", rs.getString("first_name"));
                row.put("lastName", rs.getString("last_name"));
                row.put("email", rs.getString("email"));
                row.put("phoneNumber", rs.getString("phone_number"));
                row.put("amount", rs.getBigDecimal("amount"));
                row.put("bankName", rs.getString("bank_name"));
                row.put("bankAccountNumber", rs.getString("bank_account_number"));
                row.put("bankAccountName", rs.getString("bank_account_name"));
                row.put("status", rs.getString("status"));
                row.put("rejectionReason", rs.getString("rejection_reason"));
                row.put("approvedBy", rs.getObject("approved_by"));
                row.put("approvedAt", rs.getTimestamp("approved_at") != null
                        ? rs.getTimestamp("approved_at").toLocalDateTime()
                        : null);
                row.put("bankTransferRef", rs.getString("bank_transfer_ref"));
                row.put("createAt", rs.getTimestamp("create_at") != null
                        ? rs.getTimestamp("create_at").toLocalDateTime()
                        : null);
                list.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean markWithdrawalCompleted(int withdrawalId, int staffId, String transferRef) {
        String sql = """
            UPDATE Withdrawal
            SET status = 'Completed',
                approved_by = ?,
                approved_at = GETDATE(),
                bank_transfer_ref = ?
            WHERE withdrawal_id = ?
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, staffId);
            ps.setString(2, transferRef);
            ps.setInt(3, withdrawalId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean rejectWithdrawal(int withdrawalId, int staffId, String reason) {
        String queryWithdrawal = "SELECT user_id, amount FROM Withdrawal WHERE withdrawal_id = ? AND status = 'Pending'";
        String updateWithdrawal = "UPDATE Withdrawal SET status = 'Rejected', approved_by = ?, approved_at = GETDATE(), rejection_reason = ? WHERE withdrawal_id = ?";
        String updateUser = "UPDATE Users SET balance = balance + ? WHERE user_id = ?";
        String insertTx = "INSERT INTO Payment_Transaction (user_id, type, amount, description, create_at) VALUES (?, 'Refund', ?, ?, GETDATE())";

        Connection conn = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false);

            int userId = -1;
            java.math.BigDecimal amount = java.math.BigDecimal.ZERO;

            try (PreparedStatement psQ = conn.prepareStatement(queryWithdrawal)) {
                psQ.setInt(1, withdrawalId);
                try (ResultSet rs = psQ.executeQuery()) {
                    if (rs.next()) {
                        userId = rs.getInt("user_id");
                        amount = rs.getBigDecimal("amount");
                    } else {
                        conn.rollback();
                        return false;
                    }
                }
            }

            try (PreparedStatement psU1 = conn.prepareStatement(updateWithdrawal)) {
                psU1.setInt(1, staffId);
                psU1.setString(2, reason);
                psU1.setInt(3, withdrawalId);
                if (psU1.executeUpdate() == 0) {
                    conn.rollback();
                    return false;
                }
            }

            try (PreparedStatement psU2 = conn.prepareStatement(updateUser)) {
                psU2.setBigDecimal(1, amount);
                psU2.setInt(2, userId);
                psU2.executeUpdate();
            }

            try (PreparedStatement psI = conn.prepareStatement(insertTx)) {
                psI.setInt(1, userId);
                psI.setBigDecimal(2, amount);
                psI.setString(3, "Hoàn tiền từ chối rút: " + reason);
                psI.executeUpdate();
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

    private Tournament mapResultSetToTournament(ResultSet rs) throws SQLException {
        Tournament t = new Tournament();
        t.setTournamentId(rs.getInt("tournament_id"));
        t.setTournamentName(rs.getString("tournament_name"));
        t.setDescription(rs.getString("description"));
        t.setTournamentImage(rs.getString("tournament_image"));
        t.setRules(rs.getString("rules"));
        t.setLocation(rs.getString("location"));
        t.setFormat(parseFormat(rs.getString("format")));
        t.setMaxPlayer(rs.getInt("max_player"));
        t.setMinPlayer(rs.getInt("min_player"));
        t.setEntryFee(rs.getBigDecimal("entry_fee"));
        t.setPrizePool(rs.getBigDecimal("prize_pool"));
        t.setStatus(parseStatus(rs.getString("status")));
        t.setRegistrationDeadline(rs.getTimestamp("registration_deadline") != null
                ? rs.getTimestamp("registration_deadline").toLocalDateTime() : null);
        t.setStartDate(rs.getTimestamp("start_date") != null
                ? rs.getTimestamp("start_date").toLocalDateTime() : null);
        t.setEndDate(rs.getTimestamp("end_date") != null
                ? rs.getTimestamp("end_date").toLocalDateTime() : null);
        t.setCreateBy(rs.getInt("create_by"));
        t.setCreateAt(rs.getTimestamp("create_at") != null
                ? rs.getTimestamp("create_at").toLocalDateTime() : null);
        t.setNotes(rs.getString("notes"));
        return t;
    }

    private TournamentApprovalLog mapResultSetToLog(ResultSet rs) throws SQLException {
        TournamentApprovalLog log = new TournamentApprovalLog();
        log.setApprovalId(rs.getInt("approval_id"));
        log.setTournamentId(rs.getInt("tournament_id"));
        log.setStaffId(rs.getInt("staff_id"));
        log.setAction(parseAction(rs.getString("action")));
        log.setFromStatus(rs.getString("from_status") != null ? parseStatus(rs.getString("from_status")) : null);
        log.setToStatus(rs.getString("to_status") != null ? parseStatus(rs.getString("to_status")) : null);
        log.setNote(rs.getString("note"));
        log.setCreatedAt(rs.getTimestamp("create_at").toLocalDateTime());
        return log;
    }

    private TournamentStatus parseStatus(String value) {
        return TournamentStatus.fromValue(value);
    }

    private TournamentFormat parseFormat(String value) {
        if (value == null) return null;
        for (TournamentFormat format : TournamentFormat.values()) {
            if (format.name().equalsIgnoreCase(value)) {
                return format;
            }
        }
        return TournamentFormat.valueOf(value);
    }

    private ApprovalAction parseAction(String value) {
        if (value == null) return null;
        for (ApprovalAction action : ApprovalAction.values()) {
            if (action.name().equalsIgnoreCase(value)) {
                return action;
            }
        }
        return ApprovalAction.valueOf(value);
    }

    private TournamentStaffRole parseStaffRole(String value) {
        if (value == null) return null;
        for (TournamentStaffRole role : TournamentStaffRole.values()) {
            if (role.name().equalsIgnoreCase(value)) {
                return role;
            }
        }
        return TournamentStaffRole.valueOf(value);
    }
}

