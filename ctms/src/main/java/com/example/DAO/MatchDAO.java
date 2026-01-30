package com.example.DAO;

import java.sql.*;
import com.example.util.DBContext;

public class MatchDAO extends DBContext {
    public int countOngoingMatches() {
       
        String sql = "SELECT COUNT(*) AS total FROM Matches WHERE status IS NULL OR status <> 'Finished'";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getInt("total");
        } catch (SQLException e) { e.printStackTrace(); }
        return 0;
    }
}
