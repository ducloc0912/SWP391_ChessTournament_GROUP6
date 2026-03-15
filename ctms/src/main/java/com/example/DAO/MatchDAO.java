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
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public List<Map<String, Object>> getUpcomingMatchesByTournament(int tournamentId) {
        return queryMatchesByTournament(tournamentId, "Scheduled");
    }

    public List<Map<String, Object>> getCompletedMatchesByTournament(int tournamentId) {
        return queryMatchesByTournament(tournamentId, "Completed");
    }

    public List<Map<String, Object>> getAllPublicMatches() {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT m.match_id, m.tournament_id, m.round_id, m.board_number,
                   m.player1_id, m.player2_id,
                   m.player1_score, m.player2_score,
                   m.result, m.status, m.start_time, m.end_time,
                   t.tournament_name, t.location, t.prize_pool, t.entry_fee,
                   LTRIM(RTRIM(COALESCE(u1.first_name, '') + ' ' + COALESCE(u1.last_name, ''))) AS player1_name,
                   LTRIM(RTRIM(COALESCE(u2.first_name, '') + ' ' + COALESCE(u2.last_name, ''))) AS player2_name
            FROM Matches m
            JOIN Tournaments t ON t.tournament_id = m.tournament_id
            LEFT JOIN Users u1 ON u1.user_id = m.player1_id
            LEFT JOIN Users u2 ON u2.user_id = m.player2_id
            ORDER BY m.start_time
            """;

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapMatchRow(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    private List<Map<String, Object>> queryMatchesByTournament(int tournamentId, String status) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT m.match_id, m.tournament_id, m.round_id, m.board_number,
                   m.player1_id, m.player2_id,
                   m.player1_score, m.player2_score,
                   m.result, m.status, m.start_time, m.end_time,
                   r.round_index, r.name AS round_name,
                   LTRIM(RTRIM(COALESCE(u1.first_name, '') + ' ' + COALESCE(u1.last_name, ''))) AS player1_name,
                   LTRIM(RTRIM(COALESCE(u2.first_name, '') + ' ' + COALESCE(u2.last_name, ''))) AS player2_name
            FROM Matches m
            LEFT JOIN Round r ON r.round_id = m.round_id
            LEFT JOIN Users u1 ON u1.user_id = m.player1_id
            LEFT JOIN Users u2 ON u2.user_id = m.player2_id
            WHERE m.tournament_id = ? AND m.status = ?
            ORDER BY ISNULL(r.round_index, 9999), m.start_time
            """;

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setString(2, status);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapMatchRow(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    private Map<String, Object> mapMatchRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new HashMap<>();
        row.put("matchId", rs.getInt("match_id"));
        row.put("tournamentId", rs.getInt("tournament_id"));
        row.put("roundId", rs.getObject("round_id"));
        row.put("boardNumber", rs.getObject("board_number"));

        Object player1Id = rs.getObject("player1_id");
        Object player2Id = rs.getObject("player2_id");
        row.put("player1Id", player1Id);
        row.put("player2Id", player2Id);

        String player1Name = rs.getString("player1_name");
        String player2Name = rs.getString("player2_name");
        row.put("player1Name", player1Name);
        row.put("player2Name", player2Name);

        row.put("player1Score", rs.getObject("player1_score"));
        row.put("player2Score", rs.getObject("player2_score"));
        row.put("result", rs.getString("result"));
        row.put("status", rs.getString("status"));
        row.put("startTime", rs.getTimestamp("start_time"));
        row.put("endTime", rs.getTimestamp("end_time"));

        try { row.put("tournamentName", rs.getString("tournament_name")); } catch (Exception ignored) {}
        try { row.put("roundIndex", rs.getObject("round_index")); } catch (Exception ignored) {}
        try { row.put("roundName", rs.getString("round_name")); } catch (Exception ignored) {}
        try { row.put("location", rs.getString("location")); } catch (Exception ignored) {}
        try { row.put("prizePool", rs.getObject("prize_pool")); } catch (Exception ignored) {}
        try { row.put("entryFee", rs.getObject("entry_fee")); } catch (Exception ignored) {}

        return row;
    }
}
