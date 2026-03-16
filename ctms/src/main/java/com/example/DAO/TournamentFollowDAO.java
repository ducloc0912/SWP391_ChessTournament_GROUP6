package com.example.DAO;

import com.example.model.dto.TournamentDTO;
import com.example.util.DBContext;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TournamentFollowDAO extends DBContext {

    /** Follow a tournament. Ignores duplicate (idempotent). */
    public boolean follow(int userId, int tournamentId) {
        String sql = """
                IF NOT EXISTS (SELECT 1 FROM Tournament_Follow WHERE user_id=? AND tournament_id=?)
                    INSERT INTO Tournament_Follow (user_id, tournament_id) VALUES (?,?)
                """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, tournamentId);
            ps.setInt(3, userId);
            ps.setInt(4, tournamentId);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /** Unfollow a tournament. */
    public boolean unfollow(int userId, int tournamentId) {
        String sql = "DELETE FROM Tournament_Follow WHERE user_id=? AND tournament_id=?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, tournamentId);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /** Check if a user is following a tournament. */
    public boolean isFollowing(int userId, int tournamentId) {
        String sql = "SELECT 1 FROM Tournament_Follow WHERE user_id=? AND tournament_id=?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /** Get all tournaments a user is following, with basic tournament data. */
    public List<TournamentDTO> getFollowedTournaments(int userId) {
        String sql = """
                SELECT t.tournament_id, t.tournament_name, t.status, t.format,
                       t.start_date, t.end_date, t.location, t.prize_pool, t.entry_fee,
                       t.max_player, t.min_player, t.tournament_image
                FROM Tournament_Follow tf
                JOIN Tournaments t ON t.tournament_id = tf.tournament_id
                WHERE tf.user_id = ?
                ORDER BY tf.create_at DESC
                """;
        List<TournamentDTO> list = new ArrayList<>();
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    TournamentDTO dto = new TournamentDTO();
                    dto.setTournamentId(rs.getInt("tournament_id"));
                    dto.setTournamentName(rs.getString("tournament_name"));
                    dto.setStatus(rs.getString("status"));
                    dto.setFormat(rs.getString("format"));
                    dto.setStartDate(rs.getTimestamp("start_date"));
                    dto.setEndDate(rs.getTimestamp("end_date"));

                    dto.setLocation(rs.getString("location"));
                    dto.setPrizePool(rs.getBigDecimal("prize_pool"));
                    dto.setEntryFee(rs.getBigDecimal("entry_fee"));
                    dto.setMaxPlayer(rs.getObject("max_player") != null ? rs.getInt("max_player") : null);
                    dto.setMinPlayer(rs.getObject("min_player") != null ? rs.getInt("min_player") : null);
                    dto.setTournamentImage(rs.getString("tournament_image"));
                    list.add(dto);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /** Get all user IDs following a tournament (for bulk notifications). */
    public List<Integer> getFollowerUserIds(int tournamentId) {
        String sql = "SELECT user_id FROM Tournament_Follow WHERE tournament_id=?";
        List<Integer> ids = new ArrayList<>();
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) ids.add(rs.getInt("user_id"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return ids;
    }
}
