package com.example.DAO;

import com.example.model.entity.WaitingList;
import com.example.util.DBContext;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class WaitingListDAO extends DBContext {
    public static final String APPROVE_OK = "OK";
    public static final String APPROVE_NOT_FOUND = "NOT_FOUND";
    public static final String APPROVE_ALREADY_APPROVED = "ALREADY_APPROVED";
    public static final String APPROVE_FAILED = "FAILED";

    private WaitingList mapRow(ResultSet rs) throws SQLException {
        WaitingList e = new WaitingList();
        e.setWaitingId(rs.getInt("waiting_id"));
        e.setTournamentId(rs.getInt("tournament_id"));
        e.setUserId(rs.getInt("user_id"));
        e.setRankAtRegistration((Integer) rs.getObject("rank_at_registration"));
        e.setStatus(rs.getString("status"));
        e.setNote(rs.getString("note"));
        e.setApprovedBy((Integer) rs.getObject("approved_by"));
        e.setApprovedAt(rs.getTimestamp("approved_at"));
        e.setRegistrationDate(rs.getTimestamp("registration_date"));
        e.setRegistrationFullName(rs.getString("registration_full_name"));
        e.setRegistrationUsername(rs.getString("registration_username"));
        e.setRegistrationEmail(rs.getString("registration_email"));
        e.setRegistrationPhone(rs.getString("registration_phone"));
        return e;
    }

    public List<WaitingList> getByTournamentId(int tournamentId) {
        List<WaitingList> list = new ArrayList<>();
        String sql = """
            SELECT waiting_id, tournament_id, user_id, rank_at_registration, status, note,
                   approved_by, approved_at, registration_date,
                   registration_full_name, registration_username, registration_email, registration_phone
            FROM Waiting_List
            WHERE tournament_id = ?
            ORDER BY registration_date ASC
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public WaitingList getById(int waitingId) {
        String sql = """
            SELECT waiting_id, tournament_id, user_id, rank_at_registration, status, note,
                   approved_by, approved_at, registration_date,
                   registration_full_name, registration_username, registration_email, registration_phone
            FROM Waiting_List
            WHERE waiting_id = ?
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, waitingId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapRow(rs);
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean exists(int tournamentId, int userId) {
        String sql = "SELECT 1 FROM Waiting_List WHERE tournament_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setInt(2, userId);
            return ps.executeQuery().next();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean create(WaitingList e) {
        String sql = """
            INSERT INTO Waiting_List
            (tournament_id, user_id, rank_at_registration, status, note,
             registration_full_name, registration_username, registration_email, registration_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, e.getTournamentId());
            ps.setInt(2, e.getUserId());
            if (e.getRankAtRegistration() == null) ps.setNull(3, Types.INTEGER); else ps.setInt(3, e.getRankAtRegistration());
            ps.setString(4, e.getStatus() == null ? "Pending" : e.getStatus());
            ps.setString(5, e.getNote());
            ps.setString(6, e.getRegistrationFullName());
            ps.setString(7, e.getRegistrationUsername());
            ps.setString(8, e.getRegistrationEmail());
            ps.setString(9, e.getRegistrationPhone());
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    // only owner can update own row
    public boolean updateOwnRegistration(WaitingList e, int currentUserId) {
        String sql = """
            UPDATE Waiting_List
            SET registration_full_name = ?,
                registration_username = ?,
                registration_email = ?,
                registration_phone = ?,
                rank_at_registration = ?,
                note = ?
            WHERE waiting_id = ? AND user_id = ?
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, e.getRegistrationFullName());
            ps.setString(2, e.getRegistrationUsername());
            ps.setString(3, e.getRegistrationEmail());
            ps.setString(4, e.getRegistrationPhone());
            if (e.getRankAtRegistration() == null) {
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(5, e.getRankAtRegistration());
            }
            ps.setString(6, e.getNote());
            ps.setInt(7, e.getWaitingId());
            ps.setInt(8, currentUserId);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    public boolean deleteOwnRegistration(int waitingId, int currentUserId) {
        String sql = "DELETE FROM Waiting_List WHERE waiting_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, waitingId);
            ps.setInt(2, currentUserId);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    public boolean deleteById(int waitingId) {
        String sql = "DELETE FROM Waiting_List WHERE waiting_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, waitingId);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    public String approveAndAddParticipant(int waitingId, int approvedByUserId) {
        String getWaitingSql = """
            SELECT waiting_id, tournament_id, user_id, status, note
            FROM Waiting_List
            WHERE waiting_id = ?
        """;
        String existsParticipantSql = """
            SELECT 1 FROM Participants
            WHERE tournament_id = ? AND user_id = ?
        """;
        String insertParticipantSql = """
            INSERT INTO Participants
            (tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """;
        String approveWaitingSql = """
            UPDATE Waiting_List
            SET status = 'Approved',
                approved_by = ?,
                approved_at = GETDATE()
            WHERE waiting_id = ?
        """;

        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);
            try {
                int tournamentId;
                int userId;
                String waitingStatus;
                String note;

                try (PreparedStatement ps = conn.prepareStatement(getWaitingSql)) {
                    ps.setInt(1, waitingId);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) {
                        conn.rollback();
                        return APPROVE_NOT_FOUND;
                    }
                    tournamentId = rs.getInt("tournament_id");
                    userId = rs.getInt("user_id");
                    waitingStatus = rs.getString("status");
                    note = rs.getString("note");
                }

                if ("Approved".equalsIgnoreCase(waitingStatus)) {
                    conn.rollback();
                    return APPROVE_ALREADY_APPROVED;
                }

                boolean participantExists;
                try (PreparedStatement ps = conn.prepareStatement(existsParticipantSql)) {
                    ps.setInt(1, tournamentId);
                    ps.setInt(2, userId);
                    participantExists = ps.executeQuery().next();
                }

                if (!participantExists) {
                    try (PreparedStatement ps = conn.prepareStatement(insertParticipantSql)) {
                        ps.setInt(1, tournamentId);
                        ps.setInt(2, userId);
                        ps.setNull(3, Types.NVARCHAR); // title_at_registration
                        ps.setNull(4, Types.INTEGER);  // seed
                        ps.setString(5, "Active");
                        ps.setBoolean(6, false);
                        ps.setNull(7, Types.TIMESTAMP); // payment_date
                        ps.setString(8, note);
                        if (ps.executeUpdate() <= 0) {
                            conn.rollback();
                            return APPROVE_FAILED;
                        }
                    }
                }

                try (PreparedStatement ps = conn.prepareStatement(approveWaitingSql)) {
                    ps.setInt(1, approvedByUserId);
                    ps.setInt(2, waitingId);
                    if (ps.executeUpdate() <= 0) {
                        conn.rollback();
                        return APPROVE_FAILED;
                    }
                }

                conn.commit();
                return APPROVE_OK;
            } catch (SQLException ex) {
                conn.rollback();
                ex.printStackTrace();
                return APPROVE_FAILED;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException ex) {
            ex.printStackTrace();
            return APPROVE_FAILED;
        }
    }
}