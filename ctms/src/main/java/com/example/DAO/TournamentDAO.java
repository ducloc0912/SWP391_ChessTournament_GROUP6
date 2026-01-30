package com.example.DAO;

import java.sql.*;
import com.example.util.DBContext;

public class TournamentDAO extends DBContext {
    public int countAllTournaments() {
        String sql = "SELECT COUNT(*) AS total FROM Tournaments";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getInt("total");
        } catch (SQLException e) { e.printStackTrace(); }
        return 0;
    }

    public int countCancelledTournaments() {
       
        String sql = "SELECT COUNT(*) AS total FROM Tournaments WHERE status = 'Cancelled'";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getInt("total");
        } catch (SQLException e) { e.printStackTrace(); }
        return 0;
    }
}
