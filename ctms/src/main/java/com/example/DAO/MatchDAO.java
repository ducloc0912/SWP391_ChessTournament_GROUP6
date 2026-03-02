package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
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
        String sql = """
                SELECT
                    m.match_id,
                    m.tournament_id,
                    m.round_id,
                    m.board_number,
                    m.status,
                    m.result,
                    m.start_time,
                    m.end_time,
                    r.name AS round_name,
                    r.round_index,
                    LTRIM(RTRIM(CONCAT(COALESCE(w.first_name, ''), ' ', COALESCE(w.last_name, '')))) AS white_player_name,
                    LTRIM(RTRIM(CONCAT(COALESCE(b.first_name, ''), ' ', COALESCE(b.last_name, '')))) AS black_player_name
                FROM Matches m
                LEFT JOIN [Round] r ON r.round_id = m.round_id
                LEFT JOIN Users w ON w.user_id = m.white_player_id
                LEFT JOIN Users b ON b.user_id = m.black_player_id
                WHERE m.tournament_id = ?
                  AND (m.status = 'Scheduled' OR m.status = 'Ongoing')
                ORDER BY m.start_time ASC, m.match_id ASC
                """;
        return queryMatches(sql, tournamentId);
    }

    public List<Map<String, Object>> getCompletedMatchesByTournament(int tournamentId) {
        String sql = """
                SELECT
                    m.match_id,
                    m.tournament_id,
                    m.round_id,
                    m.board_number,
                    m.status,
                    m.result,
                    m.start_time,
                    m.end_time,
                    r.name AS round_name,
                    r.round_index,
                    LTRIM(RTRIM(CONCAT(COALESCE(w.first_name, ''), ' ', COALESCE(w.last_name, '')))) AS white_player_name,
                    LTRIM(RTRIM(CONCAT(COALESCE(b.first_name, ''), ' ', COALESCE(b.last_name, '')))) AS black_player_name
                FROM Matches m
                LEFT JOIN [Round] r ON r.round_id = m.round_id
                LEFT JOIN Users w ON w.user_id = m.white_player_id
                LEFT JOIN Users b ON b.user_id = m.black_player_id
                WHERE m.tournament_id = ?
                  AND (m.status = 'Completed' OR (m.result IS NOT NULL AND m.result <> '*'))
                ORDER BY m.end_time DESC, m.start_time DESC, m.match_id DESC
                """;
        return queryMatches(sql, tournamentId);
    }

    public List<Map<String, Object>> getAllPublicMatches() {
        String sql = """
                SELECT
                    m.match_id,
                    m.tournament_id,
                    m.round_id,
                    m.board_number,
                    m.status,
                    m.result,
                    m.start_time,
                    m.end_time,
                    t.tournament_name,
                    t.location,
                    t.prize_pool,
                    t.entry_fee,
                    r.name AS round_name,
                    r.round_index,
                    LTRIM(RTRIM(CONCAT(COALESCE(w.first_name, ''), ' ', COALESCE(w.last_name, '')))) AS white_player_name,
                    LTRIM(RTRIM(CONCAT(COALESCE(b.first_name, ''), ' ', COALESCE(b.last_name, '')))) AS black_player_name
                FROM Matches m
                INNER JOIN Tournaments t ON t.tournament_id = m.tournament_id
                LEFT JOIN [Round] r ON r.round_id = m.round_id
                LEFT JOIN Users w ON w.user_id = m.white_player_id
                LEFT JOIN Users b ON b.user_id = m.black_player_id
                ORDER BY m.start_time DESC, m.match_id DESC
                """;
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> row = mapMatchRow(rs);
                row.put("tournamentName", rs.getString("tournament_name"));
                row.put("location", rs.getString("location"));
                row.put("prizePool", rs.getBigDecimal("prize_pool"));
                row.put("entryFee", rs.getBigDecimal("entry_fee"));
                list.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    private List<Map<String, Object>> queryMatches(String sql, int tournamentId) {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = mapMatchRow(rs);
                    list.add(row);
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
        row.put("roundName", rs.getString("round_name"));
        row.put("roundIndex", rs.getObject("round_index"));
        row.put("boardNumber", rs.getObject("board_number"));
        row.put("status", rs.getString("status"));
        row.put("result", rs.getString("result"));

        Timestamp startTime = rs.getTimestamp("start_time");
        Timestamp endTime = rs.getTimestamp("end_time");
        row.put("startTime", startTime);
        row.put("endTime", endTime);

        String whiteName = rs.getString("white_player_name");
        String blackName = rs.getString("black_player_name");
        row.put("whitePlayerName", (whiteName == null || whiteName.isBlank()) ? "TBD" : whiteName);
        row.put("blackPlayerName", (blackName == null || blackName.isBlank()) ? "TBD" : blackName);
        return row;
    }
}