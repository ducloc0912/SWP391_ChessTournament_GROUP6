package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.model.dto.PlayerTournamentDTO;
import com.example.model.dto.TournamentDTO;
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
    public boolean createTournament(TournamentDTO t) {
        String sql = """
                    INSERT INTO Tournaments
                    (tournament_name, description, tournament_image, rules,
                     location, format, categories,
                     max_player, min_player, entry_fee, prize_pool,
                     registration_deadline, start_date, end_date,
                     create_by, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = DBContext.getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, t.getTournamentName());
            ps.setString(2, t.getDescription());
            ps.setString(3, t.getTournamentImage());
            ps.setString(4, t.getRules());
            ps.setString(5, t.getLocation());
            ps.setString(6, t.getFormat());
            ps.setString(7, t.getCategories());
            ps.setInt(8, t.getMaxPlayer());
            ps.setInt(9, t.getMinPlayer());
            ps.setBigDecimal(10, t.getEntryFee());
            ps.setBigDecimal(11, t.getPrizePool());
            ps.setTimestamp(12, t.getRegistrationDeadline());
            ps.setTimestamp(13, t.getStartDate());
            ps.setTimestamp(14, t.getEndDate());
            ps.setInt(15, t.getCreateBy());
            ps.setString(16, t.getNotes());

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
        String sql = "SELECT * FROM Tournaments ORDER BY create_at DESC";

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
                        tournament_image = ?,
                        rules = ?,
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
            ps.setString(3, t.getTournamentImage());
            ps.setString(4, t.getRules());
            ps.setString(5, t.getLocation());
            ps.setString(6, t.getFormat());
            ps.setString(7, t.getCategories());
            ps.setInt(8, t.getMaxPlayer());
            ps.setInt(9, t.getMinPlayer());
            ps.setBigDecimal(10, t.getEntryFee());
            ps.setBigDecimal(11, t.getPrizePool());
            ps.setTimestamp(12, t.getRegistrationDeadline());
            ps.setTimestamp(13, t.getStartDate());
            ps.setTimestamp(14, t.getEndDate());
            ps.setString(15, t.getNotes());
            ps.setInt(16, t.getTournamentId());

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // =========================
    // CANCEL (SOFT DELETE)
    // Status → Cancelled with reason
    // =========================
    public boolean cancelTournament(int tournamentId, String reason) {
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

    // =========================
    // DELETE (HARD DELETE)
    // =========================
    public boolean deleteTournament(int tournamentId) {
        String sql = "DELETE FROM Tournaments WHERE tournament_id = ?";

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
        t.setTournamentImage(rs.getString("tournament_image"));
        t.setRules(rs.getString("rules"));
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

    public List<String> getTournamentImages(int tournamentId) {
        List<String> images = new ArrayList<>();
        String sql = """
                SELECT image_url
                FROM Tournament_Images
                WHERE tournament_id = ?
                ORDER BY display_order ASC, image_id ASC
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String url = rs.getString("image_url");
                    if (url != null && !url.isBlank()) {
                        images.add(url);
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return images;
    }

    public boolean updateTournamentCoverImage(int tournamentId, String imageUrl) {
        String sql = "UPDATE Tournaments SET tournament_image = ? WHERE tournament_id = ?";
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
                VALUES (?, ?, (
                    SELECT ISNULL(MAX(display_order), 0) + 1
                    FROM Tournament_Images
                    WHERE tournament_id = ?
                ))
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
        String updateCoverSql = "UPDATE Tournaments SET tournament_image = ? WHERE tournament_id = ?";
        String deleteDetailSql = "DELETE FROM Tournament_Images WHERE tournament_id = ?";
        String insertDetailSql = """
                INSERT INTO Tournament_Images (tournament_id, image_url, display_order)
                VALUES (?, ?, ?)
                """;

        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement(updateCoverSql)) {
                    ps.setString(1, coverImageUrl);
                    ps.setInt(2, tournamentId);
                    if (ps.executeUpdate() == 0) {
                        conn.rollback();
                        return false;
                    }
                }

                try (PreparedStatement ps = conn.prepareStatement(deleteDetailSql)) {
                    ps.setInt(1, tournamentId);
                    ps.executeUpdate();
                }

                if (detailImages != null && !detailImages.isEmpty()) {
                    try (PreparedStatement ps = conn.prepareStatement(insertDetailSql)) {
                        int order = 1;
                        for (String imageUrl : detailImages) {
                            if (imageUrl == null || imageUrl.isBlank()) continue;
                            ps.setInt(1, tournamentId);
                            ps.setString(2, imageUrl.trim());
                            ps.setInt(3, order++);
                            ps.addBatch();
                        }
                        ps.executeBatch();
                    }
                }

                conn.commit();
                return true;
            } catch (SQLException e) {
                conn.rollback();
                e.printStackTrace();
                return false;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

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

        StringBuilder sql = new StringBuilder("""
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
                    COUNT(p.participant_id) AS current_players,
                    CASE
                        WHEN ? IS NOT NULL AND EXISTS (
                            SELECT 1
                            FROM Participants p2
                            WHERE p2.tournament_id = t.tournament_id
                              AND p2.user_id = ?
                        ) THEN 1
                        ELSE 0
                    END AS is_registered
                FROM Tournaments t
                LEFT JOIN Participants p ON p.tournament_id = t.tournament_id
                WHERE t.status <> 'Cancelled'
                  AND t.status <> 'Rejected'
                """);

        List<Object> params = new ArrayList<>();
        params.add(userId);
        params.add(userId);

        if (keyword != null && !keyword.isBlank()) {
            sql.append(" AND (t.tournament_name LIKE ? OR t.location LIKE ?) ");
            String q = "%" + keyword.trim() + "%";
            params.add(q);
            params.add(q);
        }

        if (format != null && !format.isBlank()) {
            sql.append(" AND t.format = ? ");
            params.add(format.trim());
        }

        if (dbStatus != null && !dbStatus.isBlank()) {
            sql.append(" AND t.status = ? ");
            params.add(dbStatus.trim());
        }

        if ("free".equalsIgnoreCase(entryType)) {
            sql.append(" AND ISNULL(t.entry_fee, 0) = 0 ");
        } else if ("paid".equalsIgnoreCase(entryType)) {
            sql.append(" AND ISNULL(t.entry_fee, 0) > 0 ");
        }

        if (registeredOnly && userId != null) {
            sql.append("""
                     AND EXISTS (
                        SELECT 1
                        FROM Participants p3
                        WHERE p3.tournament_id = t.tournament_id
                          AND p3.user_id = ?
                    )
                    """);
            params.add(userId);
        }

        sql.append("""
                GROUP BY
                    t.tournament_id, t.tournament_name, t.tournament_image, t.location,
                    t.format, t.status, t.entry_fee, t.prize_pool, t.start_date,
                    t.registration_deadline, t.max_player
                """);

        if ("startDate".equalsIgnoreCase(sortBy)) {
            sql.append(" ORDER BY t.start_date ASC ");
        } else if ("prizePool".equalsIgnoreCase(sortBy)) {
            sql.append(" ORDER BY t.prize_pool DESC, t.start_date ASC ");
        } else {
            sql.append(" ORDER BY MAX(t.create_at) DESC ");
        }

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                Object val = params.get(i);
                int idx = i + 1;
                if (val == null) {
                    ps.setObject(idx, null);
                } else if (val instanceof Integer) {
                    ps.setInt(idx, (Integer) val);
                } else {
                    ps.setString(idx, String.valueOf(val));
                }
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    PlayerTournamentDTO dto = new PlayerTournamentDTO();
                    dto.setTournamentId(rs.getInt("tournament_id"));
                    dto.setTournamentName(EncodingUtil.fixUtf8Mojibake(rs.getString("tournament_name")));
                    dto.setTournamentImage(rs.getString("tournament_image"));
                    dto.setLocation(rs.getString("location"));
                    dto.setFormat(rs.getString("format"));
                    dto.setStatus(rs.getString("status"));
                    dto.setEntryFee(rs.getBigDecimal("entry_fee"));
                    dto.setPrizePool(rs.getBigDecimal("prize_pool"));
                    dto.setStartDate(rs.getTimestamp("start_date"));
                    dto.setRegistrationDeadline(rs.getTimestamp("registration_deadline"));
                    dto.setMaxPlayer(rs.getInt("max_player"));
                    dto.setCurrentPlayers(rs.getInt("current_players"));
                    dto.setRegistered(rs.getInt("is_registered") == 1);
                    list.add(dto);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return list;
    }

}
