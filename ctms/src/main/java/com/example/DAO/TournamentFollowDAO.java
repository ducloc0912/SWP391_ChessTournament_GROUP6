package com.example.DAO;

import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TournamentFollowDAO extends DBContext {

    public boolean followTournament(int userId, int tournamentId) {
        if (userId <= 0 || tournamentId <= 0) return false;
        String sql = """
                IF NOT EXISTS (
                    SELECT 1
                    FROM Tournament_Follow
                    WHERE user_id = ? AND tournament_id = ?
                )
                BEGIN
                    INSERT INTO Tournament_Follow (user_id, tournament_id)
                    VALUES (?, ?)
                END
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, tournamentId);
            ps.setInt(3, userId);
            ps.setInt(4, tournamentId);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean unfollowTournament(int userId, int tournamentId) {
        if (userId <= 0 || tournamentId <= 0) return false;
        String sql = "DELETE FROM Tournament_Follow WHERE user_id = ? AND tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, tournamentId);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean isFollowing(int userId, int tournamentId) {
        if (userId <= 0 || tournamentId <= 0) return false;
        String sql = "SELECT 1 FROM Tournament_Follow WHERE user_id = ? AND tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public List<Integer> getFollowingTournamentIds(int userId) {
        List<Integer> ids = new ArrayList<>();
        if (userId <= 0) return ids;
        String sql = """
                SELECT tournament_id
                FROM Tournament_Follow
                WHERE user_id = ?
                ORDER BY create_at DESC
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getInt("tournament_id"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return ids;
    }

    public List<Integer> getFollowerUserIds(int tournamentId) {
        List<Integer> ids = new ArrayList<>();
        if (tournamentId <= 0) return ids;
        String sql = "SELECT user_id FROM Tournament_Follow WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getInt("user_id"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return ids;
    }
}
