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
import java.util.List;

public class TournamentStaffDAO extends DBContext {

    // =========================================================================
    // TOURNAMENT OPERATIONS FOR STAFF
    // =========================================================================

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

    // =========================================================================
    // APPROVAL LOG & STATUS UPDATE
    // =========================================================================

    /**
     * Updates tournament status and logs the action in Tournament_Approval_Log.
     * Use transaction to ensure consistency.
     */
    public boolean updateTournamentStatusAndLog(int tournamentId, int staffId,
                                                 TournamentStatus oldStatus, TournamentStatus newStatus,
                                                 ApprovalAction action, String note) {
        String updateSql = "UPDATE Tournaments SET status = ? WHERE tournament_id = ?";
        String logSql = """
            INSERT INTO Tournament_Approval_Log (tournament_id, staff_id, action, from_status, to_status, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, GETDATE())
        """;

        Connection conn = null;
        PreparedStatement psUpdate = null;
        PreparedStatement psLog = null;

        try {
            conn = getConnection();
            conn.setAutoCommit(false); // Start transaction

            // 1. Update Tournament Status
            psUpdate = conn.prepareStatement(updateSql);
            psUpdate.setString(1, newStatus.name());
            psUpdate.setInt(2, tournamentId);
            int rowsUpdated = psUpdate.executeUpdate();
            if (rowsUpdated == 0) {
                conn.rollback();
                return false;
            }

            // 2. Insert into Approval Log
            psLog = conn.prepareStatement(logSql);
            psLog.setInt(1, tournamentId);
            psLog.setInt(2, staffId);
            psLog.setString(3, action.name());
            psLog.setString(4, oldStatus.name());
            psLog.setString(5, newStatus.name());
            psLog.setString(6, note);
            psLog.executeUpdate();

            conn.commit(); // Commit transaction
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
        String sql = "SELECT * FROM Tournament_Approval_Log WHERE tournament_id = ? ORDER BY created_at DESC";
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

    // =========================================================================
    // STAFF ASSIGNMENT
    // =========================================================================

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

    // =========================================================================
    // MAPPERS
    // =========================================================================

    private Tournament mapResultSetToTournament(ResultSet rs) throws SQLException {
        Tournament t = new Tournament();
        t.setTournamentId(rs.getInt("tournament_id"));
        t.setTournamentName(rs.getString("tournament_name"));
        t.setDescription(rs.getString("description"));
        t.setLocation(rs.getString("location"));
        t.setFormat(parseFormat(rs.getString("format")));
        t.setCategories(rs.getString("categories"));
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
        log.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return log;
    }

    // =========================================================================
    // HELPER METHODS - Case-insensitive enum parsing
    // =========================================================================

    private TournamentStatus parseStatus(String value) {
        if (value == null) return null;
        for (TournamentStatus status : TournamentStatus.values()) {
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        return TournamentStatus.valueOf(value); // fallback, will throw if not found
    }

    private TournamentFormat parseFormat(String value) {
        if (value == null) return null;
        for (TournamentFormat format : TournamentFormat.values()) {
            if (format.name().equalsIgnoreCase(value)) {
                return format;
            }
        }
        return TournamentFormat.valueOf(value); // fallback
    }

    private ApprovalAction parseAction(String value) {
        if (value == null) return null;
        for (ApprovalAction action : ApprovalAction.values()) {
            if (action.name().equalsIgnoreCase(value)) {
                return action;
            }
        }
        return ApprovalAction.valueOf(value); // fallback
    }

    private TournamentStaffRole parseStaffRole(String value) {
        if (value == null) return null;
        for (TournamentStaffRole role : TournamentStaffRole.values()) {
            if (role.name().equalsIgnoreCase(value)) {
                return role;
            }
        }
        return TournamentStaffRole.valueOf(value); // fallback
    }
}
