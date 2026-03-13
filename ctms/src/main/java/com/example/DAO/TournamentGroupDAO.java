package com.example.DAO;

import com.example.model.entity.TournamentGroup;
import com.example.util.DBContext;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO cho Tournament_Group - quản lý các bảng trong Group Stage.
 */
public class TournamentGroupDAO extends DBContext {

    public List<TournamentGroup> findByTournamentId(int tournamentId) {
        String sql = "SELECT group_id, tournament_id, bracket_id, name, sort_order, max_players FROM Tournament_Group WHERE tournament_id = ? ORDER BY sort_order, name";
        List<TournamentGroup> list = new ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    TournamentGroup g = new TournamentGroup();
                    g.setGroupId(rs.getInt("group_id"));
                    g.setTournamentId(rs.getInt("tournament_id"));
                    g.setBracketId((Integer) rs.getObject("bracket_id"));
                    g.setName(rs.getString("name"));
                    g.setSortOrder((Integer) rs.getObject("sort_order"));
                    g.setMaxPlayers((Integer) rs.getObject("max_players"));
                    list.add(g);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public int insert(TournamentGroup g) {
        String sql = "INSERT INTO Tournament_Group (tournament_id, bracket_id, name, sort_order, max_players) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, g.getTournamentId());
            ps.setObject(2, g.getBracketId());
            ps.setString(3, g.getName());
            ps.setObject(4, g.getSortOrder());
            ps.setObject(5, g.getMaxPlayers());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }

    public boolean deleteByTournamentId(int tournamentId) {
        String sql = "DELETE FROM Tournament_Group WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            return ps.executeUpdate() >= 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateParticipantGroup(int participantId, Integer groupId) {
        String sql = "UPDATE Participants SET group_id = ? WHERE participant_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, groupId);
            ps.setInt(2, participantId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}
