package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.model.dto.PlayerTournamentDTO;
import com.example.model.dto.TournamentDTO;
import com.example.util.DBContext;

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
    public boolean createTournament(TournamentDTO t) {
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
    public TournamentDTO getTournamentById(int id) {
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
    public List<TournamentDTO> getAllTournaments() {
        List<TournamentDTO> list = new ArrayList<>();
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
    public boolean updateTournament(TournamentDTO t) {
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

    private TournamentDTO mapResultSetToTournament(ResultSet rs) throws SQLException {
        TournamentDTO t = new TournamentDTO();

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
                    row.put("tournamentName", rs.getString("tournament_name"));
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
                    row.put("tournamentName", rs.getString("tournament_name"));
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

    // =========================
    // PLAYER TOURNAMENT CARDS (HOME / BROWSER)
    // =========================
    public List<PlayerTournamentDTO> getPlayerTournamentCards(
            Integer userId,
            String keyword,
            String format,
            String dbStatus,
            String entryType,
            boolean registeredOnly,
            String sortBy
    ) {
        List<PlayerTournamentDTO> list = new ArrayList<>();

        StringBuilder sql = new StringBuilder();
        sql.append("""
                SELECT
                    t.tournament_id,
                    t.tournament_name,
                    t.tournament_image,
                    t.location,
                    t.format,
                    t.status,
                    t.entry_fee,
                    t.prize_pool,
                    t.start_date,
                    t.registration_deadline,
                    t.max_player,
                    (SELECT COUNT(*) FROM Participants p WHERE p.tournament_id = t.tournament_id) AS current_players,
                    CASE
                        WHEN ? IS NOT NULL AND EXISTS (
                            SELECT 1 FROM Participants p2
                            WHERE p2.tournament_id = t.tournament_id AND p2.user_id = ?
                        )
                        THEN 1 ELSE 0
                    END AS registered
                FROM Tournaments t
                WHERE 1 = 1
                """);

        List<Object> params = new ArrayList<>();
        // for registered flag
        params.add(userId);
        params.add(userId);

        if (keyword != null && !keyword.trim().isEmpty()) {
            sql.append(" AND (t.tournament_name LIKE ? OR t.location LIKE ?) ");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
        }

        if (format != null && !format.trim().isEmpty()) {
            sql.append(" AND t.format = ? ");
            params.add(format.trim());
        }

        if (dbStatus != null && !dbStatus.trim().isEmpty()) {
            sql.append(" AND t.status = ? ");
            params.add(dbStatus.trim());
        }

        if (entryType != null) {
            String et = entryType.trim().toLowerCase();
            if ("free".equals(et)) {
                sql.append(" AND (t.entry_fee IS NULL OR t.entry_fee <= 0) ");
            } else if ("paid".equals(et)) {
                sql.append(" AND t.entry_fee IS NOT NULL AND t.entry_fee > 0 ");
            }
        }

        if (registeredOnly && userId != null) {
            sql.append("""
                    AND EXISTS (
                        SELECT 1 FROM Participants px
                        WHERE px.tournament_id = t.tournament_id AND px.user_id = ?
                    )
                    """);
            params.add(userId);
        }

        if ("latest".equalsIgnoreCase(sortBy)) {
            sql.append(" ORDER BY t.start_date DESC, t.tournament_id DESC ");
        } else if ("feeAsc".equalsIgnoreCase(sortBy)) {
            sql.append(" ORDER BY t.entry_fee ASC, t.start_date ASC ");
        } else if ("feeDesc".equalsIgnoreCase(sortBy)) {
            sql.append(" ORDER BY t.entry_fee DESC, t.start_date ASC ");
        } else {
            sql.append(" ORDER BY t.start_date ASC, t.tournament_id ASC ");
        }

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            int idx = 1;
            for (Object p : params) {
                if (p instanceof Integer) {
                    ps.setInt(idx++, (Integer) p);
                } else if (p instanceof String) {
                    ps.setString(idx++, (String) p);
                } else {
                    ps.setObject(idx++, p);
                }
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    PlayerTournamentDTO dto = new PlayerTournamentDTO();
                    dto.setTournamentId(rs.getInt("tournament_id"));
                    dto.setTournamentName(rs.getString("tournament_name"));
                    dto.setTournamentImage(rs.getString("tournament_image"));
                    dto.setLocation(rs.getString("location"));
                    dto.setFormat(rs.getString("format"));
                    dto.setStatus(rs.getString("status"));
                    dto.setEntryFee(rs.getBigDecimal("entry_fee"));
                    dto.setPrizePool(rs.getBigDecimal("prize_pool"));
                    dto.setStartDate(rs.getTimestamp("start_date"));
                    dto.setRegistrationDeadline(rs.getTimestamp("registration_deadline"));
                    dto.setMaxPlayer((Integer) rs.getObject("max_player"));
                    dto.setCurrentPlayers((Integer) rs.getObject("current_players"));
                    dto.setRegistered(rs.getInt("registered") == 1);
                    list.add(dto);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return list;
    }

    // =========================
    // TOURNAMENT IMAGES
    // =========================

    public List<String> getTournamentImages(int tournamentId) {
        List<String> images = new ArrayList<>();
        String sql = "SELECT image_url FROM Tournament_Images WHERE tournament_id = ? ORDER BY display_order ASC, image_id ASC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    images.add(rs.getString("image_url"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return images;
    }

    public boolean updateTournamentCoverImage(int tournamentId, String imageUrl) {
        String sql = """
                UPDATE Tournaments
                SET tournament_image = ?
                WHERE tournament_id = ?
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, imageUrl);
            ps.setInt(2, tournamentId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean addTournamentDetailImage(int tournamentId, String imageUrl) {
        String sql = """
                INSERT INTO Tournament_Images (tournament_id, image_url, display_order)
                VALUES (?, ?, COALESCE((
                    SELECT MAX(display_order) + 1 FROM Tournament_Images WHERE tournament_id = ?
                ), 1))
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setString(2, imageUrl);
            ps.setInt(3, tournamentId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean deleteTournamentDetailImage(int tournamentId, String imageUrl) {
        String sql = "DELETE FROM Tournament_Images WHERE tournament_id = ? AND image_url = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setString(2, imageUrl);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean saveTournamentImages(int tournamentId, String coverImageUrl, List<String> detailImages) {
        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);

            if (coverImageUrl != null) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE Tournaments SET tournament_image = ? WHERE tournament_id = ?")) {
                    ps.setString(1, coverImageUrl);
                    ps.setInt(2, tournamentId);
                    ps.executeUpdate();
                }
            }

            try (PreparedStatement del = conn.prepareStatement(
                    "DELETE FROM Tournament_Images WHERE tournament_id = ?")) {
                del.setInt(1, tournamentId);
                del.executeUpdate();
            }

            if (detailImages != null && !detailImages.isEmpty()) {
                String insertSql = "INSERT INTO Tournament_Images (tournament_id, image_url, display_order) VALUES (?, ?, ?)";
                try (PreparedStatement ins = conn.prepareStatement(insertSql)) {
                    int order = 1;
                    for (String url : detailImages) {
                        ins.setInt(1, tournamentId);
                        ins.setString(2, url);
                        ins.setInt(3, order++);
                        ins.addBatch();
                    }
                    ins.executeBatch();
                }
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // =========================
    // TOURNAMENT PODIUM (CHAMPION / RUNNER-UP)
    // =========================
    public Map<String, Object> getTournamentPodium(int tournamentId) {
        Map<String, Object> podium = new HashMap<>();
        podium.put("championName", null);
        podium.put("runnerUpName", null);

        String sql = """
                SELECT TOP 2 u.first_name, u.last_name, s.current_rank
                FROM Standing s
                JOIN Users u ON s.user_id = u.user_id
                WHERE s.tournament_id = ?
                ORDER BY s.current_rank ASC
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                String champion = null;
                String runnerUp = null;
                if (rs.next()) {
                    champion = (rs.getString("first_name") + " " + rs.getString("last_name")).trim();
                }
                if (rs.next()) {
                    runnerUp = (rs.getString("first_name") + " " + rs.getString("last_name")).trim();
                }
                podium.put("championName", champion);
                podium.put("runnerUpName", runnerUp);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return podium;
    }

    // =========================
    // CANCEL TOURNAMENT (SOFT)
    // =========================
    public boolean cancelTournament(int tournamentId, String reason) {
        String sql = """
                UPDATE Tournaments
                SET status = 'Cancelled',
                    notes = CASE
                        WHEN notes IS NULL OR notes = '' THEN ?
                        ELSE notes + CHAR(13) + CHAR(10) + ?
                    END
                WHERE tournament_id = ?
                """;
        String note = "Cancelled: " + (reason == null ? "" : reason.trim());
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, note);
            ps.setString(2, note);
            ps.setInt(3, tournamentId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}
