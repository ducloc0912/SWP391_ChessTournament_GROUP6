package com.example.DAO;

import com.example.util.DBContext;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class RefereeInvitationDAO extends DBContext {

    private static final int EXPIRE_DAYS = 7;
    private static final int REMINDER_24H_HOURS = 24;
    private static final int REMINDER_48H_HOURS = 48;

    public List<Map<String, Object>> getPendingByTournament(int tournamentId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT ri.invitation_id, ri.invited_email, ri.referee_role, ri.invited_at, ri.expires_at,
                   ri.status, ri.last_reminder_at, u.first_name AS inviter_first, u.last_name AS inviter_last
            FROM Referee_Invitation ri
            LEFT JOIN Users u ON ri.invited_by = u.user_id
            WHERE ri.tournament_id = ? AND ri.status = 'Pending'
            ORDER BY ri.invited_at DESC
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> m = new HashMap<>();
                m.put("invitationId", rs.getInt("invitation_id"));
                m.put("invitedEmail", rs.getString("invited_email"));
                m.put("refereeRole", rs.getString("referee_role"));
                m.put("invitedAt", rs.getTimestamp("invited_at"));
                m.put("expiresAt", rs.getTimestamp("expires_at"));
                m.put("status", rs.getString("status"));
                m.put("lastReminderAt", rs.getTimestamp("last_reminder_at"));
                m.put("inviterName", (rs.getString("inviter_first") + " " + rs.getString("inviter_last")).trim());
                list.add(m);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public int createInvitation(int tournamentId, String email, String refereeRole, int invitedBy) {
        String sql = """
            INSERT INTO Referee_Invitation (tournament_id, invited_email, referee_role, invited_by, status, expires_at, token)
            VALUES (?, ?, ?, ?, 'Pending', DATEADD(day, ?, GETDATE()), ?)
            """;
        String token = UUID.randomUUID().toString().replace("-", "");
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, tournamentId);
            ps.setString(2, email.trim().toLowerCase());
            ps.setString(3, refereeRole == null || refereeRole.isBlank() ? "Assistant" : refereeRole);
            ps.setInt(4, invitedBy);
            ps.setInt(5, EXPIRE_DAYS);
            ps.setString(6, token);
            if (ps.executeUpdate() > 0) {
                ResultSet rs = ps.getGeneratedKeys();
                if (rs.next()) return rs.getInt(1);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public boolean resendInvite(int invitationId, int invitedBy) {
        String sql = """
            UPDATE Referee_Invitation
            SET invited_at = GETDATE(), expires_at = DATEADD(day, ?, GETDATE()),
                token = ?, last_reminder_at = NULL
            WHERE invitation_id = ? AND status = 'Pending'
            """;
        String token = UUID.randomUUID().toString().replace("-", "");
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, EXPIRE_DAYS);
            ps.setString(2, token);
            ps.setInt(3, invitationId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean replaceInvite(int invitationId, String newEmail, String refereeRole, int invitedBy) {
        String sql = """
            UPDATE Referee_Invitation
            SET invited_email = ?, referee_role = ?, invited_at = GETDATE(),
                expires_at = DATEADD(day, ?, GETDATE()), token = ?, last_reminder_at = NULL
            WHERE invitation_id = ? AND status = 'Pending'
            """;
        String token = UUID.randomUUID().toString().replace("-", "");
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newEmail.trim().toLowerCase());
            ps.setString(2, refereeRole == null || refereeRole.isBlank() ? "Assistant" : refereeRole);
            ps.setInt(3, EXPIRE_DAYS);
            ps.setString(4, token);
            ps.setInt(5, invitationId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean removePending(int invitationId) {
        String sql = "DELETE FROM Referee_Invitation WHERE invitation_id = ? AND status = 'Pending'";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, invitationId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /** Chỉ kiểm tra pending cho cùng một giải; trọng tài có pending từ giải khác vẫn được TL khác mời. */
    public boolean hasPendingForEmail(int tournamentId, String email) {
        String sql = "SELECT 1 FROM Referee_Invitation WHERE tournament_id = ? AND LOWER(invited_email) = LOWER(?) AND status = 'Pending'";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setString(2, email.trim());
            return ps.executeQuery().next();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public void expireOldInvitations() {
        String sql = "UPDATE Referee_Invitation SET status = 'Expired' WHERE status = 'Pending' AND expires_at < GETDATE()";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    /** Invitations needing 24h reminder: invited_at >= 24h ago, last_reminder_at is null */
    public List<Map<String, Object>> getPendingNeeding24hReminder() {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT ri.invitation_id, ri.tournament_id, ri.invited_email, ri.referee_role, ri.invited_at,
                   t.tournament_name, u.first_name AS inviter_first, u.last_name AS inviter_last
            FROM Referee_Invitation ri
            JOIN Tournaments t ON t.tournament_id = ri.tournament_id
            LEFT JOIN Users u ON ri.invited_by = u.user_id
            WHERE ri.status = 'Pending' AND ri.last_reminder_at IS NULL
              AND ri.invited_at <= DATEADD(hour, -?, GETDATE())
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, REMINDER_24H_HOURS);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> m = new HashMap<>();
                m.put("invitationId", rs.getInt("invitation_id"));
                m.put("tournamentId", rs.getInt("tournament_id"));
                m.put("invitedEmail", rs.getString("invited_email"));
                m.put("refereeRole", rs.getString("referee_role"));
                m.put("invitedAt", rs.getTimestamp("invited_at"));
                m.put("tournamentName", rs.getString("tournament_name"));
                m.put("inviterName", (rs.getString("inviter_first") + " " + rs.getString("inviter_last")).trim());
                list.add(m);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /** Invitations needing 48h reminder: last_reminder_at was set 24h+ ago */
    public List<Map<String, Object>> getPendingNeeding48hReminder() {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT ri.invitation_id, ri.tournament_id, ri.invited_email, ri.referee_role, ri.invited_at,
                   t.tournament_name, u.first_name AS inviter_first, u.last_name AS inviter_last
            FROM Referee_Invitation ri
            JOIN Tournaments t ON t.tournament_id = ri.tournament_id
            LEFT JOIN Users u ON ri.invited_by = u.user_id
            WHERE ri.status = 'Pending' AND ri.last_reminder_at IS NOT NULL
              AND ri.last_reminder_at <= DATEADD(hour, -?, GETDATE())
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, REMINDER_24H_HOURS);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> m = new HashMap<>();
                m.put("invitationId", rs.getInt("invitation_id"));
                m.put("tournamentId", rs.getInt("tournament_id"));
                m.put("invitedEmail", rs.getString("invited_email"));
                m.put("refereeRole", rs.getString("referee_role"));
                m.put("invitedAt", rs.getTimestamp("invited_at"));
                m.put("tournamentName", rs.getString("tournament_name"));
                m.put("inviterName", (rs.getString("inviter_first") + " " + rs.getString("inviter_last")).trim());
                list.add(m);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean updateLastReminderAt(int invitationId) {
        String sql = "UPDATE Referee_Invitation SET last_reminder_at = GETDATE() WHERE invitation_id = ? AND status = 'Pending'";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, invitationId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public Map<String, Object> findPendingById(int invitationId) {
        String sql = """
            SELECT ri.invitation_id, ri.tournament_id, ri.invited_email, ri.referee_role,
                   ri.status, ri.expires_at, ri.token, ri.referee_id
            FROM Referee_Invitation ri
            WHERE ri.invitation_id = ? AND ri.status = 'Pending' AND ri.expires_at > GETDATE()
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, invitationId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("invitationId", rs.getInt("invitation_id"));
                    m.put("tournamentId", rs.getInt("tournament_id"));
                    m.put("invitedEmail", rs.getString("invited_email"));
                    m.put("refereeRole", rs.getString("referee_role"));
                    m.put("status", rs.getString("status"));
                    m.put("expiresAt", rs.getTimestamp("expires_at"));
                    m.put("token", rs.getString("token"));
                    m.put("refereeId", rs.getObject("referee_id"));
                    return m;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<Map<String, Object>> getPendingForEmail(String email) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (email == null || email.isBlank()) return list;
        String sql = """
            SELECT ri.invitation_id, ri.tournament_id, ri.invited_email, ri.referee_role,
                   ri.status, ri.invited_at, ri.expires_at,
                   t.tournament_name
            FROM Referee_Invitation ri
            JOIN Tournaments t ON t.tournament_id = ri.tournament_id
            WHERE ri.status = 'Pending'
              AND LOWER(ri.invited_email) = LOWER(?)
              AND ri.expires_at > GETDATE()
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("invitationId", rs.getInt("invitation_id"));
                    m.put("tournamentId", rs.getInt("tournament_id"));
                    m.put("invitedEmail", rs.getString("invited_email"));
                    m.put("refereeRole", rs.getString("referee_role"));
                    m.put("status", rs.getString("status"));
                    m.put("invitedAt", rs.getTimestamp("invited_at"));
                    m.put("expiresAt", rs.getTimestamp("expires_at"));
                    m.put("tournamentName", rs.getString("tournament_name"));
                    list.add(m);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean markAccepted(int invitationId, int refereeId) {
        String sql = """
            UPDATE Referee_Invitation
            SET status = 'Accepted', accepted_at = GETDATE(), referee_id = ?
            WHERE invitation_id = ? AND status = 'Pending'
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, refereeId);
            ps.setInt(2, invitationId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean markRejected(int invitationId) {
        String sql = """
            UPDATE Referee_Invitation
            SET status = 'Rejected'
            WHERE invitation_id = ? AND status = 'Pending'
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, invitationId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}
