package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import com.example.model.Tournament;
import com.example.util.DBContext;

public class TournamentDAO {

    public List<Tournament> getAllTournaments() {
        List<Tournament> list = new ArrayList<>();
        String sql = "SELECT * FROM Tournaments ORDER BY create_at DESC";
        try (Connection con = DBContext.getConnection();
                PreparedStatement ps = con.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Tournament t = new Tournament();
                t.setTournamentId(rs.getInt("tournament_id"));
                t.setTournamentName(rs.getString("tournament_name"));
                t.setDescription(rs.getString("description"));
                t.setLocation(rs.getString("location"));
                t.setFormat(rs.getString("format"));
                t.setCategories(rs.getString("categories"));
                t.setMaxPlayer(rs.getInt("max_player"));
                t.setMinPlayer(rs.getInt("min_player"));
                t.setEntryFee(rs.getBigDecimal("entry_fee"));
                t.setPrizePool(rs.getBigDecimal("prize_pool"));
                t.setStatus(rs.getString("status"));
                t.setRegistrationDeadline(rs.getTimestamp("registration_deadline"));
                t.setStartDate(rs.getTimestamp("start_date"));
                t.setEndDate(rs.getTimestamp("end_date"));
                t.setCreateBy(rs.getInt("create_by"));
                t.setCreateAt(rs.getTimestamp("create_at"));
                t.setNotes(rs.getString("notes"));
                list.add(t);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean updateStatus(int id, String status, String notes) {
        String sql = "UPDATE Tournaments SET status = ?, notes = ? WHERE tournament_id = ?";
        try (Connection con = DBContext.getConnection();
                PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, notes);
            ps.setInt(3, id);
            int rowsAffected = ps.executeUpdate();
            return rowsAffected > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}
