package com.example.DAO;

import com.example.util.DBContext;

import java.sql.*;
import java.util.*;

/**
 * DAO for Standing table.
 * Handles recalculation and retrieval of Round Robin tournament standings.
 */
public class StandingDAO extends DBContext {

    /**
     * Recalculates and upserts standings for all participants of a Round Robin tournament.
     * Uses the provided connection (from caller) to stay in the same transaction.
     * Should be called after each match in the tournament completes.
     */
    public void updateStandingsForTournament(Connection conn, int tournamentId) throws SQLException {
        // Step 1: Load all approved participants (initialise with zero stats)
        Map<Integer, double[]> stats = new LinkedHashMap<>(); // userId -> [won, drawn, lost, points]
        String participantSql = """
                SELECT user_id FROM Participants
                WHERE tournament_id = ? AND status = 'Approved'
                """;
        try (PreparedStatement ps = conn.prepareStatement(participantSql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    stats.put(rs.getInt("user_id"), new double[]{0, 0, 0, 0});
                }
            }
        }

        // Step 2: Load all completed matches and accumulate stats
        // matchOutcomes: [p1Id, p2Id, outcome]  outcome: 2=p1 win, 1=draw, 0=p2 win
        List<int[]> matchOutcomes = new ArrayList<>();
        String matchSql = """
                SELECT m.player1_id, m.player2_id, m.result
                FROM Matches m
                WHERE m.tournament_id = ? AND m.status = 'Completed'
                  AND m.result IN ('player1', 'player2', 'draw')
                """;
        try (PreparedStatement ps = conn.prepareStatement(matchSql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Integer p1 = (Integer) rs.getObject("player1_id");
                    Integer p2 = (Integer) rs.getObject("player2_id");
                    String result = rs.getString("result");
                    if (p1 == null || p2 == null || result == null) continue;

                    stats.putIfAbsent(p1, new double[]{0, 0, 0, 0});
                    stats.putIfAbsent(p2, new double[]{0, 0, 0, 0});

                    double[] s1 = stats.get(p1);
                    double[] s2 = stats.get(p2);

                    if ("player1".equals(result)) {
                        s1[0]++; s1[3] += 1.0; // p1: won+1, points+1
                        s2[2]++;                 // p2: lost+1
                        matchOutcomes.add(new int[]{p1, p2, 2});
                    } else if ("player2".equals(result)) {
                        s2[0]++; s2[3] += 1.0;
                        s1[2]++;
                        matchOutcomes.add(new int[]{p1, p2, 0});
                    } else { // draw
                        s1[1]++; s1[3] += 0.5;
                        s2[1]++; s2[3] += 0.5;
                        matchOutcomes.add(new int[]{p1, p2, 1});
                    }
                }
            }
        }

        // Step 3: Compute Sonneborn-Berger tiebreak
        //   Win vs X  → add X's total points to winner's SB
        //   Draw vs X → add X's total points * 0.5 to both players' SB
        Map<Integer, Double> totalPts = new HashMap<>();
        for (Map.Entry<Integer, double[]> e : stats.entrySet()) {
            totalPts.put(e.getKey(), e.getValue()[3]);
        }

        Map<Integer, Double> sb = new HashMap<>();
        for (int uid : stats.keySet()) sb.put(uid, 0.0);

        for (int[] mo : matchOutcomes) {
            int p1 = mo[0], p2 = mo[1], outcome = mo[2];
            double p1Pts = totalPts.getOrDefault(p1, 0.0);
            double p2Pts = totalPts.getOrDefault(p2, 0.0);
            if (outcome == 2) {         // p1 won
                sb.merge(p1, p2Pts, Double::sum);
            } else if (outcome == 0) {  // p2 won
                sb.merge(p2, p1Pts, Double::sum);
            } else {                    // draw
                sb.merge(p1, p2Pts * 0.5, Double::sum);
                sb.merge(p2, p1Pts * 0.5, Double::sum);
            }
        }

        // Step 4: Sort by points DESC, SB DESC → assign ranks (ties share same rank)
        List<Map.Entry<Integer, double[]>> sorted = new ArrayList<>(stats.entrySet());
        sorted.sort((a, b) -> {
            double ptsDiff = b.getValue()[3] - a.getValue()[3];
            if (ptsDiff != 0) return ptsDiff > 0 ? 1 : -1;
            double sbDiff = sb.getOrDefault(b.getKey(), 0.0) - sb.getOrDefault(a.getKey(), 0.0);
            if (sbDiff != 0) return sbDiff > 0 ? 1 : -1;
            return 0;
        });

        // Step 5: UPSERT into Standing (MERGE for SQL Server)
        String upsertSql = """
                MERGE Standing AS target
                USING (SELECT ? AS tournament_id, ? AS user_id) AS source
                    ON target.tournament_id = source.tournament_id
                   AND target.user_id       = source.user_id
                WHEN MATCHED THEN
                    UPDATE SET matches_played = ?, won = ?, drawn = ?, lost = ?,
                               point = ?, tie_break = ?, current_rank = ?
                WHEN NOT MATCHED THEN
                    INSERT (tournament_id, user_id, matches_played, won, drawn, lost,
                            point, tie_break, current_rank)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """;

        int rank = 1;
        for (int i = 0; i < sorted.size(); i++) {
            Map.Entry<Integer, double[]> e = sorted.get(i);
            // Give same rank to tied players
            if (i > 0) {
                Map.Entry<Integer, double[]> prev = sorted.get(i - 1);
                boolean samePts = e.getValue()[3] == prev.getValue()[3];
                boolean sameSb  = sb.getOrDefault(e.getKey(), 0.0)
                                    .equals(sb.getOrDefault(prev.getKey(), 0.0));
                if (!samePts || !sameSb) rank = i + 1;
            }

            int uid = e.getKey();
            double[] s = e.getValue();
            int won  = (int) s[0];
            int drawn = (int) s[1];
            int lost  = (int) s[2];
            int played = won + drawn + lost;
            double pts  = s[3];
            double sbVal = sb.getOrDefault(uid, 0.0);

            try (PreparedStatement ps = conn.prepareStatement(upsertSql)) {
                // USING clause
                ps.setInt(1, tournamentId);
                ps.setInt(2, uid);
                // UPDATE SET
                ps.setInt(3, played);
                ps.setInt(4, won);
                ps.setInt(5, drawn);
                ps.setInt(6, lost);
                ps.setDouble(7, pts);
                ps.setDouble(8, sbVal);
                ps.setInt(9, rank);
                // INSERT VALUES
                ps.setInt(10, tournamentId);
                ps.setInt(11, uid);
                ps.setInt(12, played);
                ps.setInt(13, won);
                ps.setInt(14, drawn);
                ps.setInt(15, lost);
                ps.setDouble(16, pts);
                ps.setDouble(17, sbVal);
                ps.setInt(18, rank);
                ps.executeUpdate();
            }
        }
    }

    /**
     * Returns current standings for a tournament, ordered by rank.
     */
    public List<Map<String, Object>> getStandingsByTournament(int tournamentId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
                SELECT s.user_id, s.matches_played, s.won, s.drawn, s.lost,
                       s.point, s.tie_break, s.current_rank,
                       COALESCE(NULLIF(LTRIM(RTRIM(
                           COALESCE(u.first_name,'') + ' ' + COALESCE(u.last_name,'')
                       )), ''), u.username) AS player_name
                FROM Standing s
                JOIN Users u ON u.user_id = s.user_id
                WHERE s.tournament_id = ?
                ORDER BY s.current_rank ASC, s.point DESC, s.tie_break DESC
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("userId",        rs.getInt("user_id"));
                    row.put("playerName",    rs.getString("player_name"));
                    row.put("matchesPlayed", rs.getInt("matches_played"));
                    row.put("won",           rs.getInt("won"));
                    row.put("drawn",         rs.getInt("drawn"));
                    row.put("lost",          rs.getInt("lost"));
                    row.put("point",         rs.getDouble("point"));
                    row.put("tieBreak",      rs.getDouble("tie_break"));
                    row.put("currentRank",   rs.getObject("current_rank"));
                    list.add(row);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}
