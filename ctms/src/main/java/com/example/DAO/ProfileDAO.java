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
import com.example.util.EncodingUtil;

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

    /**
     * Check if phone_number is already used by another user.
     */
    public boolean isPhoneTaken(String phoneNumber, int excludeUserId) {
        if (phoneNumber == null || phoneNumber.isBlank()) return false;
        String sql = "SELECT 1 FROM Users WHERE phone_number = ? AND user_id <> ?";
        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, phoneNumber.trim());
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
                   address, avatar, is_active, balance, rank, birthday, gender, last_login, create_at
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
                u.put("username", EncodingUtil.fixUtf8Mojibake(rs.getString("username")));
                u.put("firstName", EncodingUtil.fixUtf8Mojibake(rs.getString("first_name")));
                u.put("lastName", EncodingUtil.fixUtf8Mojibake(rs.getString("last_name")));
                u.put("email", EncodingUtil.fixUtf8Mojibake(rs.getString("email")));
                u.put("phoneNumber", rs.getString("phone_number"));
                u.put("address", EncodingUtil.fixUtf8Mojibake(rs.getString("address")));
                u.put("avatar", rs.getString("avatar"));
                u.put("isActive", rs.getBoolean("is_active"));
                u.put("balance", rs.getBigDecimal("balance"));
                u.put("rank", (Integer) rs.getObject("rank"));
                u.put("birthday", rs.getDate("birthday"));
                u.put("gender", EncodingUtil.fixUtf8Mojibake(rs.getString("gender")));
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
        // Stats used by FE: totalTournaments, avgRanking, championCount (số lần hạng 1)
        String sql = """
            SELECT
                (SELECT COUNT(1) FROM Participants p WHERE p.user_id = ?) AS totalTournaments,
                (SELECT AVG(CAST(s.current_rank AS FLOAT))
                   FROM Standing s
                  WHERE s.user_id = ? AND s.current_rank IS NOT NULL) AS avgRanking,
                (SELECT COUNT(1) FROM Standing s WHERE s.user_id = ? AND s.current_rank = 1) AS championCount
        """;

        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, userId);
            ps.setInt(3, userId);

            try (ResultSet rs = ps.executeQuery()) {
                Map<String, Object> m = new HashMap<>();
                if (rs.next()) {
                    m.put("totalTournaments", rs.getInt("totalTournaments"));
                    m.put("avgRanking", rs.getObject("avgRanking") == null ? null : rs.getDouble("avgRanking"));
                    m.put("championCount", rs.getInt("championCount"));
                } else {
                    m.put("totalTournaments", 0);
                    m.put("avgRanking", null);
                    m.put("championCount", 0);
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
                    t.put("tournamentName", EncodingUtil.fixUtf8Mojibake(rs.getString("tournamentName")));
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
        // Leader = user tạo tournament (create_by) + rating từ feedback về giải của họ
        String sql = """
            SELECT
                (SELECT COUNT(DISTINCT t.tournament_id) FROM Tournaments t WHERE t.create_by = ?) AS totalTournaments,
                (SELECT COUNT(p.participant_id) FROM Tournaments t LEFT JOIN Participants p ON p.tournament_id = t.tournament_id WHERE t.create_by = ?) AS totalParticipants,
                (SELECT AVG(CAST(f.star_rating AS FLOAT)) FROM Feedback f
                 INNER JOIN Tournaments t ON t.tournament_id = f.tournament_id AND t.create_by = ?
                 WHERE f.status = 'approved' AND f.star_rating IS NOT NULL) AS averageRating
        """;

        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, userId);
            ps.setInt(3, userId);
            try (ResultSet rs = ps.executeQuery()) {
                Map<String, Object> m = new HashMap<>();
                if (rs.next()) {
                    m.put("totalTournaments", rs.getInt("totalTournaments"));
                    m.put("totalParticipants", rs.getInt("totalParticipants"));
                    Object ar = rs.getObject("averageRating");
                    m.put("averageRating", ar == null ? null : rs.getDouble("averageRating"));
                } else {
                    m.put("totalTournaments", 0);
                    m.put("totalParticipants", 0);
                    m.put("averageRating", null);
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
                t.description     AS description,
                t.location        AS location,
                t.format          AS format,
                t.max_player      AS maxPlayer,
                t.min_player      AS minPlayer,
                t.entry_fee       AS entryFee,
                t.prize_pool      AS prizePool,
                t.status          AS tournamentStatus,
                t.registration_deadline AS registrationDeadline,
                t.start_date      AS startDate,
                t.end_date        AS endDate,
                t.create_at       AS createdAt,
                t.notes           AS notes
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
                    t.put("tournamentName", EncodingUtil.fixUtf8Mojibake(rs.getString("tournamentName")));
                    t.put("description", EncodingUtil.fixUtf8Mojibake(rs.getString("description")));
                    t.put("location", EncodingUtil.fixUtf8Mojibake(rs.getString("location")));
                    t.put("format", rs.getString("format"));
                    t.put("maxPlayer", rs.getObject("maxPlayer"));
                    t.put("minPlayer", rs.getObject("minPlayer"));
                    t.put("entryFee", rs.getObject("entryFee"));
                    t.put("prizePool", rs.getObject("prizePool"));
                    t.put("tournamentStatus", rs.getString("tournamentStatus"));
                    t.put("registrationDeadline", rs.getTimestamp("registrationDeadline"));
                    t.put("startDate", rs.getTimestamp("startDate"));
                    t.put("endDate", rs.getTimestamp("endDate"));
                    t.put("createdAt", rs.getTimestamp("createdAt"));
                    t.put("notes", EncodingUtil.fixUtf8Mojibake(rs.getString("notes")));
                    list.add(t);
                }
            }
            return list;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public Map<String, Object> getRefereeStats(int userId) {
        // Số trận đã trọng tài + rating trung bình từ feedback của các trận đó
        String sql = """
            SELECT
                (SELECT COUNT(1) FROM Match_Referee mr WHERE mr.referee_id = ?) AS assignedMatches,
                (SELECT AVG(CAST(f.star_rating AS FLOAT)) FROM Feedback f
                 INNER JOIN Match_Referee mr ON mr.match_id = f.match_id AND mr.referee_id = ?
                 WHERE f.status = 'approved' AND f.star_rating IS NOT NULL) AS averageRating
        """;

        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                Map<String, Object> m = new HashMap<>();
                if (rs.next()) {
                    m.put("assignedMatches", rs.getInt("assignedMatches"));
                    Object ar = rs.getObject("averageRating");
                    m.put("averageRating", ar == null ? null : rs.getDouble("averageRating"));
                } else {
                    m.put("assignedMatches", 0);
                    m.put("averageRating", null);
                }
                return m;
            }
        } catch (SQLException e) {
            Map<String, Object> m = new HashMap<>();
            m.put("assignedMatches", 0);
            m.put("averageRating", null);
            return m;
        }
    }

    public List<Map<String, Object>> getRefereeTournaments(int userId) {
        String sql = """
            SELECT
                t.tournament_id   AS tournamentId,
                t.tournament_name AS tournamentName,
                t.status          AS tournamentStatus,
                t.start_date      AS startDate,
                tr.assigned_at    AS assignedAt
            FROM Tournament_Referee tr
            INNER JOIN Tournaments t ON t.tournament_id = tr.tournament_id
            WHERE tr.referee_id = ?
            ORDER BY tr.assigned_at DESC
        """;

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> t = new HashMap<>();
                    t.put("tournamentId", rs.getInt("tournamentId"));
                    t.put("tournamentName", EncodingUtil.fixUtf8Mojibake(rs.getString("tournamentName")));
                    t.put("tournamentStatus", rs.getString("tournamentStatus"));
                    t.put("startDate", rs.getTimestamp("startDate"));
                    t.put("assignedAt", rs.getTimestamp("assignedAt"));
                    list.add(t);
                }
            }
            return list;
        } catch (SQLException e) {
            return new ArrayList<>();
        }
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
