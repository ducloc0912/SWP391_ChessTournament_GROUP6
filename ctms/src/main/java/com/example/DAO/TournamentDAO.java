package com.example.DAO;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

import com.example.model.Tournament;
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
    
    // =========================
    // CREATE TOURNAMENT
    // =========================
    public boolean createTournament(Tournament t) {
        String sql = """
            INSERT INTO Tournaments
            (tournament_name, description, location, format, categories,
             max_player, min_player, entry_fee, prize_pool,
             registration_deadline, start_date, end_date,
             create_by, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, t.getTournamentName());
            ps.setString(2, t.getDescription());
            ps.setString(3, t.getLocation());
            ps.setString(4, t.getFormat());
            ps.setString(5, t.getCategories());
            ps.setInt(6, t.getMaxPlayer());
            ps.setInt(7, t.getMinPlayer());
            ps.setBigDecimal(8, t.getEntryFee());
            ps.setBigDecimal(9, t.getPrizePool());
            ps.setTimestamp(10, t.getRegistrationDeadline());
            ps.setTimestamp(11, t.getStartDate());
            ps.setTimestamp(12, t.getEndDate());
            ps.setInt(13, t.getCreateBy());
            ps.setString(14, t.getNotes());

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // =========================
    // GET TOURNAMENT BY ID
    // =========================
    public Tournament getTournamentById(int id) {
        String sql = "SELECT * FROM Tournaments WHERE tournament_id = ?";

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return mapResultSetToTournament(rs);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // =========================
    // GET ALL TOURNAMENTS
    // =========================
    public List<Tournament> getAllTournaments() {
        List<Tournament> list = new ArrayList<>();
        String sql = "SELECT * FROM Tournaments";

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(mapResultSetToTournament(rs));
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // =========================
    // UPDATE TOURNAMENT
    // =========================
    public boolean updateTournament(Tournament t) {
        String sql = """
            UPDATE Tournaments SET
                tournament_name = ?,
                description = ?,
                location = ?,
                format = ?,
                categories = ?,
                max_player = ?,
                min_player = ?,
                entry_fee = ?,
                prize_pool = ?,
                registration_deadline = ?,
                start_date = ?,
                end_date = ?,
                notes = ?
            WHERE tournament_id = ?
        """;

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, t.getTournamentName());
            ps.setString(2, t.getDescription());
            ps.setString(3, t.getLocation());
            ps.setString(4, t.getFormat());
            ps.setString(5, t.getCategories());
            ps.setInt(6, t.getMaxPlayer());
            ps.setInt(7, t.getMinPlayer());
            ps.setBigDecimal(8, t.getEntryFee());
            ps.setBigDecimal(9, t.getPrizePool());
            ps.setTimestamp(10, t.getRegistrationDeadline());
            ps.setTimestamp(11, t.getStartDate());
            ps.setTimestamp(12, t.getEndDate());
            ps.setString(13, t.getNotes());
            ps.setInt(14, t.getTournamentId());

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // =========================
    // DELETE (SOFT DELETE)
    // Status → Delayed
    // =========================
    public boolean deleteTournament(int tournamentId) {
        String sql = """
            UPDATE Tournaments
            SET status = 'Delayed'
            WHERE tournament_id = ?
        """;

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, tournamentId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // =========================
    // MAPPING METHOD
    // =========================
    private Tournament mapResultSetToTournament(ResultSet rs) throws SQLException {
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

        return t;
    }
}
