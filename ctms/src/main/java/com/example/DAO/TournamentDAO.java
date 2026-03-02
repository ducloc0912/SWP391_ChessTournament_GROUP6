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
        // Use tournament_id for broad schema compatibility (some DBs miss create_at).
        String sql = "SELECT * FROM Tournaments ORDER BY tournament_id DESC";

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

        // Tolerate old DB schemas where some columns are not available yet.
        t.setTournamentId(getIntOrDefault(rs, "tournament_id", 0));
        t.setTournamentName(getStringOrNull(rs, "tournament_name"));
        t.setDescription(getStringOrNull(rs, "description"));
        t.setTournamentImage(getStringOrNull(rs, "tournament_image"));
        t.setRules(getStringOrNull(rs, "rules"));
        t.setLocation(getStringOrNull(rs, "location"));
        t.setFormat(getStringOrNull(rs, "format"));
        t.setCategories(getStringOrNull(rs, "categories"));
        t.setMaxPlayer(getIntOrDefault(rs, "max_player", 0));
        t.setMinPlayer(getIntOrDefault(rs, "min_player", 0));
        t.setEntryFee(getBigDecimalOrNull(rs, "entry_fee"));
        t.setPrizePool(getBigDecimalOrNull(rs, "prize_pool"));
        t.setStatus(getStringOrNull(rs, "status"));

        t.setRegistrationDeadline(getTimestampOrNull(rs, "registration_deadline"));
        t.setStartDate(getTimestampOrNull(rs, "start_date"));
        t.setEndDate(getTimestampOrNull(rs, "end_date"));
        t.setCreateBy(getIntegerOrNull(rs, "create_by"));
        t.setCreateAt(getTimestampOrNull(rs, "create_at"));
        t.setNotes(getStringOrNull(rs, "notes"));

        return t;
    }

    private boolean hasColumn(ResultSet rs, String column) {
        try {
            rs.findColumn(column);
            return true;
        } catch (SQLException e) {
            return false;
        }
    }

    private String getStringOrNull(ResultSet rs, String column) throws SQLException {
        if (!hasColumn(rs, column)) return null;
        return rs.getString(column);
    }

    private java.math.BigDecimal getBigDecimalOrNull(ResultSet rs, String column) throws SQLException {
        if (!hasColumn(rs, column)) return null;
        return rs.getBigDecimal(column);
    }

    private java.sql.Timestamp getTimestampOrNull(ResultSet rs, String column) throws SQLException {
        if (!hasColumn(rs, column)) return null;
        return rs.getTimestamp(column);
    }

    private Integer getIntegerOrNull(ResultSet rs, String column) throws SQLException {
        if (!hasColumn(rs, column)) return null;
        Object value = rs.getObject(column);
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        return null;
    }

    private int getIntOrDefault(ResultSet rs, String column, int defaultValue) throws SQLException {
        if (!hasColumn(rs, column)) return defaultValue;
        int value = rs.getInt(column);
        return rs.wasNull() ? defaultValue : value;
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

    public Map<String, Object> getTournamentPodium(int tournamentId) {
        Map<String, Object> podium = new HashMap<>();
        podium.put("championName", null);
        podium.put("runnerUpName", null);

        String sql = """
                SELECT s.current_rank, u.first_name, u.last_name
                FROM Standing s
                INNER JOIN Users u ON u.user_id = s.user_id
                WHERE s.tournament_id = ?
                  AND s.current_rank IN (1, 2)
                ORDER BY s.current_rank ASC
                """;

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int rank = rs.getInt("current_rank");
                    String fullName = EncodingUtil.fixUtf8Mojibake(
                            (rs.getString("first_name") == null ? "" : rs.getString("first_name")) + " "
                                    + (rs.getString("last_name") == null ? "" : rs.getString("last_name"))
                    ).trim();
                    if (fullName.isBlank()) fullName = "N/A";

                    if (rank == 1) {
                        podium.put("championName", fullName);
                    } else if (rank == 2) {
                        podium.put("runnerUpName", fullName);
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return podium;
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
