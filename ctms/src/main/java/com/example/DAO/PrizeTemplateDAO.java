package com.example.DAO;

import com.example.model.entity.PrizeTemplate;
import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;

/**
 * DAO for Prize_Template - prize per rank when creating a tournament.
 */
public class PrizeTemplateDAO extends DBContext {

    private static final String INSERT_SQL = """
        INSERT INTO Prize_Template (tournament_id, rank_position, percentage, fixed_amount, label)
        VALUES (?, ?, ?, ?, ?)
        """;

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
