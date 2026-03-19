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

public class MatchDAO extends DBContext {

    public int countOngoingMatches() {
        String sql = "SELECT COUNT(*) AS total FROM Matches WHERE status = 'Ongoing'";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getInt("total");
        } catch (SQLException e) { e.printStackTrace(); }
        return 0;
    }

    public List<Map<String, Object>> getUpcomingMatchesByTournament(int tournamentId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT m.match_id, m.tournament_id, m.round_id, m.board_number,
                   m.player1_id, m.player2_id, m.result, m.status,
                   m.start_time, m.end_time,
                   r.round_index, r.name AS round_name,
                   COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(u1.first_name,'') + ' ' + COALESCE(u1.last_name,''))), ''), u1.username) AS player1_name,
                   COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(u2.first_name,'') + ' ' + COALESCE(u2.last_name,''))), ''), u2.username) AS player2_name
            FROM Matches m
            LEFT JOIN Round r ON r.round_id = m.round_id
            LEFT JOIN Bracket b ON b.bracket_id = r.bracket_id
            LEFT JOIN Users u1 ON u1.user_id = m.player1_id
            LEFT JOIN Users u2 ON u2.user_id = m.player2_id
            WHERE m.tournament_id = ? AND m.status IN ('Scheduled', 'Ongoing') AND b.status = 'Published'
            ORDER BY ISNULL(r.round_index, 9999), m.start_time
            """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) { list.add(mapMatchRow(rs)); }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<Map<String, Object>> getCompletedMatchesByTournament(int tournamentId) {
        return queryMatchesByTournament(tournamentId, "Completed");
    }

    public List<Map<String, Object>> getAllPublicMatches() {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT m.match_id, m.tournament_id, m.round_id, m.board_number,
                   m.player1_id, m.player2_id, m.result, m.status,
                   m.start_time, m.end_time, t.tournament_name
            FROM Matches m
            JOIN Round r ON r.round_id = m.round_id
            JOIN Bracket b ON b.bracket_id = r.bracket_id
            JOIN Tournaments t ON t.tournament_id = m.tournament_id
            WHERE b.status = 'Published'
            ORDER BY m.start_time
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapMatchRow(rs));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    private List<Map<String, Object>> queryMatchesByTournament(int tournamentId, String status) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT m.match_id, m.tournament_id, m.round_id, m.board_number,
                   m.player1_id, m.player2_id, m.result, m.status,
                   m.start_time, m.end_time,
                   r.round_index, r.name AS round_name,
                   COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(u1.first_name,'') + ' ' + COALESCE(u1.last_name,''))), ''), u1.username) AS player1_name,
                   COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(u2.first_name,'') + ' ' + COALESCE(u2.last_name,''))), ''), u2.username) AS player2_name
            FROM Matches m
            LEFT JOIN Round r ON r.round_id = m.round_id
            LEFT JOIN Bracket b ON b.bracket_id = r.bracket_id
            LEFT JOIN Users u1 ON u1.user_id = m.player1_id
            LEFT JOIN Users u2 ON u2.user_id = m.player2_id
            WHERE m.tournament_id = ? AND m.status = ? AND b.status = 'Published'
            ORDER BY ISNULL(r.round_index, 9999), m.start_time
            """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setString(2, status);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapMatchRow(rs));
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<Map<String, Object>> getMatchesByPlayer(int playerId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT
                m.match_id, m.tournament_id, m.round_id, m.board_number,
                m.player1_id, m.player2_id, m.result, m.status,
                m.start_time, m.end_time,
                r.round_index, r.name AS round_name,
                t.tournament_name, t.location,
                CASE WHEN m.player1_id = ? THEN 1 ELSE 2 END AS player_side,
                CASE
                    WHEN m.player1_id = ?
                    THEN COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(u2.first_name,'') + ' ' + COALESCE(u2.last_name,''))), ''), u2.username)
                    ELSE COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(u1.first_name,'') + ' ' + COALESCE(u1.last_name,''))), ''), u1.username)
                END AS opponent_name,
                CASE WHEN m.player1_id = ? THEN u2.rank ELSE u1.rank END AS opponent_rating
            FROM Matches m
            LEFT JOIN Round r ON r.round_id = m.round_id
            LEFT JOIN Bracket b ON b.bracket_id = r.bracket_id
            LEFT JOIN Tournaments t ON t.tournament_id = m.tournament_id
            LEFT JOIN Users u1 ON u1.user_id = m.player1_id
            LEFT JOIN Users u2 ON u2.user_id = m.player2_id
            WHERE (m.player1_id = ? OR m.player2_id = ?)
              AND b.status = 'Published'
            ORDER BY m.start_time DESC
            """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, playerId);
            ps.setInt(2, playerId);
            ps.setInt(3, playerId);
            ps.setInt(4, playerId);
            ps.setInt(5, playerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = mapMatchRow(rs);
                    try { row.put("tournamentName", rs.getString("tournament_name")); } catch (Exception ignored) {}
                    try { row.put("location", rs.getString("location")); } catch (Exception ignored) {}
                    try { row.put("playerSide", rs.getInt("player_side")); } catch (Exception ignored) {}
                    try { row.put("opponentName", rs.getString("opponent_name")); } catch (Exception ignored) {}
                    try { row.put("opponentRating", rs.getObject("opponent_rating")); } catch (Exception ignored) {}
                    list.add(row);
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    private Map<String, Object> mapMatchRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new HashMap<>();
        row.put("matchId", rs.getInt("match_id"));
        row.put("tournamentId", rs.getInt("tournament_id"));
        row.put("roundId", rs.getObject("round_id"));
        row.put("boardNumber", rs.getObject("board_number"));
        row.put("player1Id", rs.getObject("player1_id"));
        row.put("player2Id", rs.getObject("player2_id"));
        row.put("result", rs.getString("result"));
        row.put("status", rs.getString("status"));
        row.put("startTime", rs.getTimestamp("start_time"));
        row.put("endTime", rs.getTimestamp("end_time"));
        try { row.put("tournamentName", rs.getString("tournament_name")); } catch (Exception ignored) {}
        try { row.put("roundIndex", rs.getObject("round_index")); } catch (Exception ignored) {}
        try { row.put("roundName", rs.getString("round_name")); } catch (Exception ignored) {}
        try {
            String p1 = rs.getString("player1_name");
            if (p1 != null && !p1.isBlank()) row.put("player1Name", p1);
        } catch (Exception ignored) {}
        try {
            String p2 = rs.getString("player2_name");
            if (p2 != null && !p2.isBlank()) row.put("player2Name", p2);
        } catch (Exception ignored) {}
        return row;
    }
}
