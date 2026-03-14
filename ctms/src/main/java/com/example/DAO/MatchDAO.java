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
        return queryMatchesByTournament(tournamentId, "Scheduled");
    }

    public List<Map<String, Object>> getCompletedMatchesByTournament(int tournamentId) {
        return queryMatchesByTournament(tournamentId, "Completed");
    }

    public List<Map<String, Object>> getAllPublicMatches() {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT m.match_id, m.tournament_id, m.round_id, m.board_number,
                   m.white_player_id, m.black_player_id, m.result, m.status,
                   m.start_time, m.end_time, t.tournament_name
            FROM Matches m
            JOIN Tournaments t ON t.tournament_id = m.tournament_id
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
                   m.white_player_id, m.black_player_id, m.result, m.status,
                   m.start_time, m.end_time,
                   r.round_index, r.name AS round_name
            FROM Matches m
            LEFT JOIN Round r ON r.round_id = m.round_id
            WHERE m.tournament_id = ? AND m.status = ?
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

    private Map<String, Object> mapMatchRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new HashMap<>();
        row.put("matchId", rs.getInt("match_id"));
        row.put("tournamentId", rs.getInt("tournament_id"));
        row.put("roundId", rs.getObject("round_id"));
        row.put("boardNumber", rs.getObject("board_number"));
        row.put("whitePlayerId", rs.getObject("white_player_id"));
        row.put("blackPlayerId", rs.getObject("black_player_id"));
        row.put("result", rs.getString("result"));
        row.put("status", rs.getString("status"));
        row.put("startTime", rs.getTimestamp("start_time"));
        row.put("endTime", rs.getTimestamp("end_time"));
        try { row.put("tournamentName", rs.getString("tournament_name")); } catch (Exception ignored) {}
        try { row.put("roundIndex", rs.getObject("round_index")); } catch (Exception ignored) {}
        try { row.put("roundName", rs.getString("round_name")); } catch (Exception ignored) {}
        return row;
    }
}