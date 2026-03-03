package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import com.example.model.entity.*;
import com.example.util.DBContext;

public class HomeDAO extends DBContext {

    // 1. Lấy 3 giải đấu sắp tới (Ngày bắt đầu > Hiện tại)
    public List<Tournament> getUpcomingTournaments() {
        List<Tournament> list = new ArrayList<>();
        // SQL Server syntax: TOP 3
        String sql = "SELECT TOP 3 * FROM Tournaments " +
                     "WHERE start_date > GETDATE() " +
                     "ORDER BY start_date ASC";
        
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            
            while (rs.next()) {
                Tournament t = new Tournament();
                t.setTournamentId(rs.getInt("tournament_id"));
                t.setTournamentName(rs.getString("tournament_name"));
                t.setDescription(rs.getString("description"));
                t.setLocation(rs.getString("location"));
                t.setFormat(null);(rs.getString("format"));
                t.setCategories(rs.getString("categories"));
                t.setMaxPlayer(rs.getInt("max_player"));
                t.setMinPlayer(rs.getInt("min_player"));
                
                // BigDecimal
                t.setEntryFee(rs.getBigDecimal("entry_fee"));
                t.setPrizePool(rs.getBigDecimal("prize_pool"));
                
                t.setStatus(rs.getString("status"));
                t.setRegistrationDeadline(rs.getTimestamp("registration_dealine")); // Chú ý: trong DB bạn viết sai chính tả 'dealine'
                t.setStartDate(rs.getTimestamp("start_date"));
                t.setEndDate(rs.getTimestamp("end_date"));
                t.setCreateBy(rs.getInt("create_by"));
                t.setCreateAt(rs.getTimestamp("create_at"));
                
                list.add(t);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 2. Lấy Top 5 người chơi có Rank cao nhất
    public List<User> getTopPlayers() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT TOP 5 user_id, first_name, last_name, avarta, rank FROM Users ORDER BY rank DESC";
        
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            
            while (rs.next()) {
                User u = new User();
                u.setUserId(rs.getInt("user_id"));
                u.setFirstName(rs.getString("first_name"));
                u.setLastName(rs.getString("last_name"));
                // Chú ý: avarta trong DB
                u.setAvatar(rs.getString("avarta"));
                // Chú ý: rank object
                u.setRank((Integer) rs.getObject("rank"));
                
                list.add(u);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}