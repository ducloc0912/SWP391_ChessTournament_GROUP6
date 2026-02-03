package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.util.DBContext;

public class ProfileDAO { 

    /**
     * Check if username is already used by another user.
     */
    public boolean isUsernameTaken(String username, int excludeUserId) {
        if (username == null || username.isBlank()) return false;
        String sql = "SELECT 1 FROM Users WHERE username = ? AND user_id <> ?";
        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, username.trim());
            ps.setInt(2, excludeUserId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public Map<String, Object> getUserBasic(int userId) {
        String sql = """
            SELECT user_id, username, first_name, last_name, email, phone_number,
                   address, avatar, is_active, balance, rank, birthday, last_login, create_at
            FROM Users
            WHERE user_id = ?
        """;

        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                Map<String, Object> u = new HashMap<>();
                u.put("userId", rs.getInt("user_id"));
                u.put("username", rs.getString("username"));
                u.put("firstName", rs.getString("first_name"));
                u.put("lastName", rs.getString("last_name"));
                u.put("email", rs.getString("email"));
                u.put("phoneNumber", rs.getString("phone_number"));
                u.put("address", rs.getString("address"));
                u.put("avatar", rs.getString("avatar"));
                u.put("isActive", rs.getBoolean("is_active"));
                u.put("balance", rs.getBigDecimal("balance"));
                u.put("rank", (Integer) rs.getObject("rank"));
                u.put("birthday", rs.getDate("birthday"));
                u.put("lastLogin", rs.getTimestamp("last_login"));
                u.put("createAt", rs.getTimestamp("create_at"));
                return u;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
   public boolean updateUserBasic(
            int userId,
            String username,
            String firstName,
            String lastName,
            String phoneNumber,
            String address,
            java.sql.Date birthday,
            String avatar
    ) {
        String sql = """
            UPDATE Users
            SET
                username     = COALESCE(?, username),
                first_name   = COALESCE(?, first_name),
                last_name    = COALESCE(?, last_name),
                phone_number = COALESCE(?, phone_number),
                address      = COALESCE(?, address),
                birthday     = COALESCE(?, birthday),
                avatar       = COALESCE(?, avatar)
            WHERE user_id = ?
        """;

        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setString(2, firstName);
            ps.setString(3, lastName);
            ps.setString(4, phoneNumber);
            ps.setString(5, address);
            ps.setDate(6, birthday);
            ps.setString(7, avatar);
            ps.setInt(8, userId);

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public boolean updateAvatar(int userId, String avatarUrl) {
        String sql = "UPDATE Users SET avatar = ? WHERE user_id = ?";
        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, avatarUrl);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
    public Map<String, Object> getPlayerStats(int userId) {
        // Stats used by FE: totalTournaments, avgRanking
        String sql = """
            SELECT
                (SELECT COUNT(1) FROM Participants p WHERE p.user_id = ?) AS totalTournaments,
                (SELECT AVG(CAST(s.current_rank AS FLOAT))
                   FROM Standing s
                  WHERE s.user_id = ? AND s.current_rank IS NOT NULL) AS avgRanking
        """;

        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, userId);

            try (ResultSet rs = ps.executeQuery()) {
                Map<String, Object> m = new HashMap<>();
                if (rs.next()) {
                    m.put("totalTournaments", rs.getInt("totalTournaments"));
                    m.put("avgRanking", rs.getObject("avgRanking") == null ? null : rs.getDouble("avgRanking"));
                } else {
                    m.put("totalTournaments", 0);
                    m.put("avgRanking", null);
                }
                return m;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public List<Map<String, Object>> getPlayerTournaments(int userId) {
        String sql = """
            SELECT
                t.tournament_id   AS tournamentId,
                t.tournament_name AS tournamentName,
                t.status          AS tournamentStatus,
                t.start_date      AS startDate,
                p.registration_date AS joinedDate,
                p.status          AS participantStatus,
                s.current_rank    AS ranking
            FROM Participants p
            INNER JOIN Tournaments t
                ON t.tournament_id = p.tournament_id
            LEFT JOIN Standing s
                ON s.tournament_id = p.tournament_id AND s.user_id = p.user_id
            WHERE p.user_id = ?
            ORDER BY p.registration_date DESC
        """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> t = new HashMap<>();
                    t.put("tournamentId", rs.getInt("tournamentId"));
                    t.put("tournamentName", rs.getString("tournamentName"));
                    t.put("tournamentStatus", rs.getString("tournamentStatus"));
                    t.put("startDate", rs.getTimestamp("startDate"));
                    t.put("joinedDate", rs.getTimestamp("joinedDate"));
                    t.put("participantStatus", rs.getString("participantStatus"));
                    t.put("ranking", (Integer) rs.getObject("ranking"));
                    list.add(t);
                }
            }
            return list;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public Map<String, Object> getLeaderStats(int userId) {
        // Leader = user tạo tournament (create_by)
        String sql = """
            SELECT
                COUNT(DISTINCT t.tournament_id) AS totalTournaments,
                COUNT(p.participant_id)         AS totalParticipants
            FROM Tournaments t
            LEFT JOIN Participants p
                ON p.tournament_id = t.tournament_id
            WHERE t.create_by = ?
        """;

        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                Map<String, Object> m = new HashMap<>();
                if (rs.next()) {
                    m.put("totalTournaments", rs.getInt("totalTournaments"));
                    m.put("totalParticipants", rs.getInt("totalParticipants"));
                } else {
                    m.put("totalTournaments", 0);
                    m.put("totalParticipants", 0);
                }
                return m;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public List<Map<String, Object>> getLeaderTournaments(int userId) {
        String sql = """
            SELECT
                t.tournament_id   AS tournamentId,
                t.tournament_name AS tournamentName,
                t.status          AS tournamentStatus,
                t.start_date      AS startDate,
                t.create_at       AS createdAt
            FROM Tournaments t
            WHERE t.create_by = ?
            ORDER BY t.create_at DESC
        """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> t = new HashMap<>();
                    t.put("tournamentId", rs.getInt("tournamentId"));
                    t.put("tournamentName", rs.getString("tournamentName"));
                    t.put("tournamentStatus", rs.getString("tournamentStatus"));
                    t.put("startDate", rs.getTimestamp("startDate"));
                    t.put("createdAt", rs.getTimestamp("createdAt"));
                    list.add(t);
                }
            }
            return list;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public Map<String, Object> getRefereeStats(int userId) {
        Map<String, Object> m = new HashMap<>();
        m.put("assignedMatches", 0);
        return m;
    }

    public List<Map<String, Object>> getRefereeTournaments(int userId) {
        return new ArrayList<>();
    }

    public Map<String, Object> getStaffStats(int userId) {
        Map<String, Object> m = new HashMap<>();
        m.put("tasks", 0);
        return m;
    }

    public List<Map<String, Object>> getStaffTournaments(int userId) {
        return new ArrayList<>();
    }
}
