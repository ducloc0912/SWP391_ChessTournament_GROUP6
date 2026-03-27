package com.example.DAO;

import com.example.model.entity.PrizeTemplate;
import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO for Prize_Template - prize per rank when creating a tournament.
 */
public class PrizeTemplateDAO extends DBContext {

    private static final String INSERT_SQL = """
        INSERT INTO Prize_Template (tournament_id, rank_position, percentage, fixed_amount, label)
        VALUES (?, ?, ?, ?, ?)
        """;

    public List<PrizeTemplate> getByTournamentId(int tournamentId) {
        List<PrizeTemplate> list = new ArrayList<>();
        String sql = "SELECT id, rank_position, fixed_amount, label FROM Prize_Template WHERE tournament_id = ? ORDER BY rank_position";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                PrizeTemplate pt = new PrizeTemplate();
                pt.setId(rs.getInt("id"));
                pt.setTournamentId(tournamentId);
                pt.setRankPosition(rs.getInt("rank_position"));
                pt.setFixedAmount(rs.getBigDecimal("fixed_amount"));
                pt.setLabel(rs.getString("label"));
                list.add(pt);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean deleteByTournamentId(int tournamentId) {
        String sql = "DELETE FROM Prize_Template WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean insertAll(int tournamentId, List<PrizeTemplate> templates) {
        if (templates == null || templates.isEmpty()) return true;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {
            for (PrizeTemplate t : templates) {
                ps.setInt(1, tournamentId);
                ps.setInt(2, t.getRankPosition());
                ps.setBigDecimal(3, t.getPercentage() != null ? t.getPercentage() : java.math.BigDecimal.ZERO);
                ps.setBigDecimal(4, t.getFixedAmount() != null ? t.getFixedAmount() : java.math.BigDecimal.ZERO);
                ps.setString(5, t.getLabel());
                ps.addBatch();
            }
            ps.executeBatch();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}
