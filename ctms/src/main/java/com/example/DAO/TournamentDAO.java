package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.model.Tournaments;
import com.example.model.entity.*;
import com.example.util.DBContext;
import com.example.util.EncodingUtil;

public class TournamentDAO extends DBContext {

    public int countAllTournaments() {
        String sql = "SELECT COUNT(*) AS total FROM Tournaments";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {
            if (rs.next())
                return rs.getInt("total");
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public int countCancelledTournaments() {
        String sql = "SELECT COUNT(*) AS total FROM Tournaments WHERE status = 'Cancelled'";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {
            if (rs.next())
                return rs.getInt("total");
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    // donut data: [{status:'Open', total:1}, ...]
    public List<Map<String, Object>> countByStatus() {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT status, COUNT(*) AS total FROM Tournaments GROUP BY status";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                row.put("status", rs.getString("status"));
                row.put("total", rs.getInt("total"));
                list.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return list;
    }

    // Dung

    // =========================
    // CREATE TOURNAMENT
    // =========================
    public boolean createTournament(Tournaments t) {
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
    public Tournaments getTournamentById(int id) {
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
    public List<Tournaments> getAllTournaments() {
        List<Tournaments> list = new ArrayList<>();
        String sql = "SELECT * FROM Tournaments ORDER BY created_at DESC";

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
    public boolean updateTournament(Tournaments t) {
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
    // Status → Cancelled with reason
    // =========================
    public boolean deleteTournament(int tournamentId, String reason) {
        String sql = """
                    UPDATE Tournaments
                    SET status = 'Cancelled',
                        notes = ?
                    WHERE tournament_id = ?
                """;

        try (Connection conn = DBContext.getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, reason);
            ps.setInt(2, tournamentId);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // DELETE (SOFT DELETE) - old method for backward compatibility
    public boolean deleteTournament(int tournamentId) {
        return deleteTournament(tournamentId, "Cancelled by admin");
    }

    private Tournaments mapResultSetToTournament(ResultSet rs) throws SQLException {
        Tournaments t = new Tournaments();

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

    // Hien them
    public List<Map<String, Object>> getTournamentHistoryByUser(int userId, String statusFilter) {
        List<Map<String, Object>> list = new ArrayList<>();

        String sql = """
                    SELECT
                        t.tournament_id,
                        t.tournament_name,
                        t.status,
                        t.start_date,
                        t.end_date,
                        CASE
                            WHEN t.status = 'Completed' THEN s.current_rank
                            ELSE NULL
                        END AS ranking
                    FROM Participants p
                    INNER JOIN Tournaments t ON t.tournament_id = p.tournament_id
                    LEFT JOIN Standing s ON s.tournament_id = p.tournament_id AND s.user_id = p.user_id
                    WHERE p.user_id = ?
                      AND ( ? IS NULL OR ? = '' OR t.status = ? )
                    ORDER BY t.start_date DESC, t.tournament_id DESC
                """;

        try (Connection conn = DBContext.getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, userId);

            // dùng 3 lần vì câu SQL có 3 placeholders cho filter
            ps.setString(2, statusFilter);
            ps.setString(3, statusFilter);
            ps.setString(4, statusFilter);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("tournamentId", rs.getInt("tournament_id"));
                    row.put("tournamentName", EncodingUtil.fixUtf8Mojibake(rs.getString("tournament_name")));
                    row.put("status", rs.getString("status"));
                    row.put("startDate", rs.getTimestamp("start_date"));
                    row.put("endDate", rs.getTimestamp("end_date"));
                    row.put("ranking", rs.getObject("ranking")); // Integer hoặc null
                    list.add(row);
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return list;
    }

    public List<Map<String, Object>> getUserTournamentHistory(int userId, String status) {
        List<Map<String, Object>> list = new ArrayList<>();

        String sql = """
                    SELECT
                        t.tournament_id,
                        t.tournament_name,
                        t.status,
                        t.start_date,
                        t.end_date,
                        s.current_rank AS ranking
                    FROM Participants p
                    INNER JOIN Tournaments t ON t.tournament_id = p.tournament_id
                    LEFT JOIN Standing s ON s.tournament_id = t.tournament_id AND s.user_id = p.user_id
                    WHERE p.user_id = ?
                      AND ( ? IS NULL OR ? = '' OR t.status = ? )
                    ORDER BY t.start_date DESC
                """;

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, userId);
            ps.setString(2, status);
            ps.setString(3, status);
            ps.setString(4, status);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("tournamentId", rs.getInt("tournament_id"));
                    row.put("tournamentName", EncodingUtil.fixUtf8Mojibake(rs.getString("tournament_name")));
                    row.put("status", rs.getString("status"));
                    row.put("startDate", rs.getTimestamp("start_date"));
                    row.put("endDate", rs.getTimestamp("end_date"));

                    int ranking = rs.getInt("ranking");
                    row.put("ranking", rs.wasNull() ? null : ranking);

                    list.add(row);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return list;
    }

}
