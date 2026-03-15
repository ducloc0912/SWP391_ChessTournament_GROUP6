package com.example.DAO;

import com.example.model.dto.TournamentSetupMatchDTO;
import com.example.model.dto.TournamentSetupStateDTO;
import com.example.model.enums.SetupStep;
import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * DAO cho Tournament Setup Wizard.
 * Quản lý trạng thái setup (Tournament_Setup_State) và dữ liệu bracket/schedule (Bracket, Round, Matches, Match_Referee).
 * Luồng: Structure (BRACKET) → Players → Schedule → Referee → COMPLETED.
 */
public class TournamentSetupDAO extends DBContext {

    private static final String COL_BRACKET = "bracket_status";
    private static final String COL_PLAYERS = "players_status";
    private static final String COL_SCHEDULE = "schedule_status";
    private static final String COL_REFEREES = "referees_status";
    private String lastReplaceManualSetupError;

    public String getLastReplaceManualSetupError() {
        return lastReplaceManualSetupError;
    }

    private void setLastReplaceManualSetupError(String message) {
        lastReplaceManualSetupError = message;
    }

    // ==================== SETUP STATE ====================

    /**
     * Lấy current_step hiện tại của giải (giá trị DB: STRUCTURE, PLAYERS, SCHEDULE, REFEREE, COMPLETED).
     */
    public String getSetupStep(int tournamentId) {
        String sql = "SELECT current_step FROM Tournament_Setup_State WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("current_step");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Cập nhật hoặc chèn current_step. Khi chuyển sang REFEREE thì cập nhật schedule_status = FINALIZED.
     */
    public boolean upsertSetupStep(int tournamentId, String step) {
        String updateSql = "UPDATE Tournament_Setup_State SET current_step = ?, updated_at = GETDATE() WHERE tournament_id = ?";
        String insertSql = "INSERT INTO Tournament_Setup_State (tournament_id, current_step, updated_at) VALUES (?, ?, GETDATE())";
        try (Connection conn = getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setString(1, step);
                ps.setInt(2, tournamentId);
                int updated = ps.executeUpdate();
                if (updated > 0) {
                    if ("REFEREE".equalsIgnoreCase(step)) {
                        updateScheduleStatusToFinalized(conn, tournamentId);
                    }
                    return true;
                }
            }
            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                ps.setInt(1, tournamentId);
                ps.setString(2, step);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /** Cập nhật schedule_status = FINALIZED khi chuyển sang bước REFEREE (schema có cột status). */
    private void updateScheduleStatusToFinalized(Connection conn, int tournamentId) {
        if (conn == null) return;
        try {
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE Tournament_Setup_State SET schedule_status = 'FINALIZED', updated_at = GETDATE() WHERE tournament_id = ?")) {
                ps.setInt(1, tournamentId);
                ps.executeUpdate();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    /**
     * Lấy toàn bộ trạng thái setup: current_step + status từng bước (DRAFT/DIRTY/FINALIZED).
     * Trả về chuẩn hóa: BRACKET, PLAYERS, SCHEDULE, REFEREES, COMPLETED.
     */
    public TournamentSetupStateDTO getSetupStateFull(int tournamentId) {
        String sql = """
            SELECT tournament_id, current_step, updated_at, updated_by,
                   bracket_status, players_status, schedule_status, referees_status
            FROM Tournament_Setup_State WHERE tournament_id = ?
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    TournamentSetupStateDTO dto = new TournamentSetupStateDTO();
                    dto.setTournamentId(rs.getInt("tournament_id"));
                    dto.setCurrentStep(normalizeStepFromDb(rs.getString("current_step")));
                    dto.setUpdatedAt(rs.getTimestamp("updated_at"));
                    Object ub = rs.getObject("updated_by");
                    dto.setUpdatedBy(ub != null ? ((Number) ub).intValue() : null);
                    Map<String, String> statuses = new HashMap<>();
                    statuses.put("BRACKET", safeStatus(rs, COL_BRACKET));
                    statuses.put("PLAYERS", safeStatus(rs, COL_PLAYERS));
                    statuses.put("SCHEDULE", safeStatus(rs, COL_SCHEDULE));
                    statuses.put("REFEREES", safeStatus(rs, COL_REFEREES));
                    dto.setStepStatuses(statuses);
                    return dto;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return defaultSetupState(tournamentId);
    }
    private TournamentSetupStateDTO defaultSetupState(int tournamentId) {
        TournamentSetupStateDTO dto = new TournamentSetupStateDTO();
        dto.setTournamentId(tournamentId);
        dto.setCurrentStep("BRACKET");
        dto.setStepStatuses(Map.of("BRACKET", "DRAFT", "PLAYERS", "DRAFT", "SCHEDULE", "DRAFT", "REFEREES", "DRAFT"));
        return dto;
    }

    private String safeStatus(ResultSet rs, String column) throws SQLException {
        try {
            String v = rs.getString(column);
            return (v != null
                    && ("DRAFT".equalsIgnoreCase(v)
                    || "DIRTY".equalsIgnoreCase(v)
                    || "FINALIZED".equalsIgnoreCase(v)))
                    ? v
                    : "DRAFT";
        } catch (SQLException e) {
            return "DRAFT";
        }
    }

    /** Chuẩn hóa step từ DB: STRUCTURE→BRACKET, REFEREE→REFEREES. */
    private String normalizeStepFromDb(String dbStep) {
        if (dbStep == null) return "BRACKET";
        String s = dbStep.trim().toUpperCase();
        if ("STRUCTURE".equals(s)) return "BRACKET";
        if ("REFEREE".equals(s)) return "REFEREES";
        return s;
    }

    /**
     * Đảm bảo có dòng Tournament_Setup_State cho giải (mặc định DRAFT).
     */
    public void ensureSetupStateRow(int tournamentId) {
        String sel = "SELECT 1 FROM Tournament_Setup_State WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sel)) {
            ps.setInt(1, tournamentId);
            if (ps.executeQuery().next()) return;
        } catch (SQLException e) {
            e.printStackTrace();
            return;
        }

        String ins = """
            INSERT INTO Tournament_Setup_State (tournament_id, current_step, updated_at, bracket_status, players_status, schedule_status, referees_status, updated_by)
            VALUES (?, 'STRUCTURE', GETDATE(), 'DRAFT', 'DRAFT', 'DRAFT', 'DRAFT', NULL)
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(ins)) {
            ps.setInt(1, tournamentId);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    /**
     * Finalize bước: set status bước đó = FINALIZED, current_step = bước tiếp theo.
     */
    public boolean finalizeStep(int tournamentId, SetupStep step, Integer userId) {
        String statusCol = statusColumn(step);
        if (statusCol == null) return false;
        SetupStep next = step.next();
        String nextDb = next != null ? next.toDbValue() : "COMPLETED";

        try (Connection conn = getConnection()) {
            if (conn == null) return false;
            ensureSetupStateRowOnConnection(conn, tournamentId);
            String sql = "UPDATE Tournament_Setup_State SET current_step = ?, updated_at = GETDATE(), " + statusCol + " = 'FINALIZED', updated_by = ? WHERE tournament_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, nextDb);
                ps.setObject(2, userId);
                ps.setInt(3, tournamentId);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    private void ensureSetupStateRowOnConnection(Connection conn, int tournamentId) {
        if (conn == null) return;
        try {
            try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM Tournament_Setup_State WHERE tournament_id = ?")) {
                ps.setInt(1, tournamentId);
                if (ps.executeQuery().next()) return;
            }
            String ins = "INSERT INTO Tournament_Setup_State (tournament_id, current_step, updated_at, bracket_status, players_status, schedule_status, referees_status, updated_by) VALUES (?, 'STRUCTURE', GETDATE(), 'DRAFT', 'DRAFT', 'DRAFT', 'DRAFT', NULL)";
            try (PreparedStatement ps = conn.prepareStatement(ins)) {
                ps.setInt(1, tournamentId);
                ps.executeUpdate();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private String statusColumn(SetupStep step) {
        switch (step) {
            case BRACKET: return COL_BRACKET;
            case PLAYERS: return COL_PLAYERS;
            case SCHEDULE: return COL_SCHEDULE;
            case REFEREES: return COL_REFEREES;
            default: return null;
        }
    }

    /** Ghi audit log setup step. */
    public void insertAuditLog(int tournamentId, String step, String action, String beforeJson, String afterJson, Integer createdBy) {
        String sql = "INSERT INTO Setup_Audit_Log (tournament_id, step, action, before_json, after_json, created_by) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setString(2, step);
            ps.setString(3, action);
            ps.setString(4, beforeJson);
            ps.setString(5, afterJson);
            ps.setObject(6, createdBy);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // ==================== PARTICIPANTS ====================

    /** Lấy danh sách user_id của participants (để validate player assignment). */
    public Set<Integer> getParticipantUserIds(int tournamentId) {
        Set<Integer> ids = new HashSet<>();
        String sql = "SELECT user_id FROM Participants WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getInt("user_id"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return ids;
    }

    /** Lấy danh sách user_id, email, full_name của participants (cho setup wizard). */
    public List<Map<String, Object>> getParticipantUsers(int tournamentId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
                SELECT
                    p.user_id,
                    u.email,
                    LTRIM(RTRIM(COALESCE(u.first_name, '') + ' ' + COALESCE(u.last_name, ''))) AS full_name
                FROM Participants p
                JOIN Users u ON u.user_id = p.user_id
                WHERE p.tournament_id = ?
                ORDER BY p.registration_date ASC, p.participant_id ASC
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("userId", rs.getInt("user_id"));
                    row.put("email", rs.getString("email"));
                    row.put("fullName", rs.getString("full_name"));
                    list.add(row);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // ==================== SCHEDULE (BRACKET, ROUND, MATCHES) ====================

    /**
     * Lấy lịch đấu (matches) cho schedule tab: round, board, players, start_time, referee.
     */
    public List<TournamentSetupMatchDTO> getManualSetupMatches(int tournamentId) {
        List<TournamentSetupMatchDTO> list = new ArrayList<>();
        try (Connection conn = getConnection()) {
            MatchPlayerColumns columns = resolveMatchPlayerColumns(conn);
            String sql = String.format("""
                    SELECT
                        m.match_id,
                        m.board_number,
                        m.%s AS player1_id,
                        m.%s AS player2_id,
                        m.start_time,
                        r.name AS round_name,
                        r.round_index,
                        b.type AS bracket_type,
                        LTRIM(RTRIM(COALESCE(u1.first_name, '') + ' ' + COALESCE(u1.last_name, ''))) AS player1_name,
                        LTRIM(RTRIM(COALESCE(u2.first_name, '') + ' ' + COALESCE(u2.last_name, ''))) AS player2_name,
                        (SELECT TOP 1 mr.referee_id FROM Match_Referee mr WHERE mr.match_id = m.match_id) AS referee_id
                    FROM Matches m
                    LEFT JOIN Round r ON r.round_id = m.round_id
                    LEFT JOIN Bracket b ON b.bracket_id = r.bracket_id
                    LEFT JOIN Users u1 ON u1.user_id = m.%s
                    LEFT JOIN Users u2 ON u2.user_id = m.%s
                    WHERE m.tournament_id = ?
                    ORDER BY
                        CASE b.type WHEN 'RoundRobin' THEN 1 WHEN 'KnockOut' THEN 2 ELSE 3 END,
                        ISNULL(r.round_index, 9999),
                        ISNULL(m.board_number, 9999),
                        m.match_id
                    """, columns.player1Column(), columns.player2Column(), columns.player1Column(), columns.player2Column());
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    TournamentSetupMatchDTO dto = new TournamentSetupMatchDTO();
                    dto.setMatchId(rs.getInt("match_id"));
                    dto.setBoardNumber((Integer) rs.getObject("board_number"));
                    dto.setPlayer1Id((Integer) rs.getObject("player1_id"));
                    dto.setPlayer2Id((Integer) rs.getObject("player2_id"));
                    dto.setStartTime(rs.getTimestamp("start_time"));
                    dto.setRoundName(rs.getString("round_name"));
                    dto.setRoundIndex((Integer) rs.getObject("round_index"));
                    dto.setStage(rs.getString("bracket_type"));
                    dto.setPlayer1Name(rs.getString("player1_name"));
                    dto.setPlayer2Name(rs.getString("player2_name"));
                    Object refObj = rs.getObject("referee_id");
                    if (refObj != null) dto.setRefereeId(((Number) refObj).intValue());
                    list.add(dto);
                }
            }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Thay thế toàn bộ bracket/schedule: xóa Bracket, Round, Matches cũ; tạo mới từ danh sách matches.
     */
    public boolean replaceManualSetup(
            int tournamentId,
            String format,
            List<TournamentSetupMatchDTO> matches
    ) {
        setLastReplaceManualSetupError(null);
        String deleteMatchesSql = "DELETE FROM Matches WHERE tournament_id = ?";
        String deleteRoundsSql = "DELETE FROM Round WHERE tournament_id = ?";
        String deleteBracketsSql = "DELETE FROM Bracket WHERE tournament_id = ?";
        String insertBracketSql = """
                INSERT INTO Bracket (bracket_name, tournament_id, type, status)
                VALUES (?, ?, ?, 'Pending')
                """;
        String insertRoundSql = """
                INSERT INTO Round (bracket_id, tournament_id, group_id, name, round_index, is_completed)
                VALUES (?, ?, NULL, ?, ?, 0)
                """;
        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);
            try {
                MatchPlayerColumns columns = resolveMatchPlayerColumns(conn);
                String insertMatchSql = String.format("""
                        INSERT INTO Matches
                        (tournament_id, round_id, group_id, board_number, %s, %s, status, start_time)
                        VALUES (?, ?, NULL, ?, ?, ?, 'Scheduled', ?)
                        """, columns.player1Column(), columns.player2Column());
                try (PreparedStatement ps = conn.prepareStatement(deleteMatchesSql)) {
                    ps.setInt(1, tournamentId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement(deleteRoundsSql)) {
                    ps.setInt(1, tournamentId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement(deleteBracketsSql)) {
                    ps.setInt(1, tournamentId);
                    ps.executeUpdate();
                }

                if (matches == null || matches.isEmpty()) {
                    conn.commit();
                    return true;
                }

                Map<String, Integer> bracketByStage = new HashMap<>();
                for (String stage : collectDistinctStages(format, matches)) {
                    int bracketId;
                    try (PreparedStatement ps = conn.prepareStatement(insertBracketSql, PreparedStatement.RETURN_GENERATED_KEYS)) {
                        ps.setString(1, stage + " Bracket");
                        ps.setInt(2, tournamentId);
                        ps.setString(3, stage);
                        ps.executeUpdate();
                        try (ResultSet keys = ps.getGeneratedKeys()) {
                            if (!keys.next()) {
                                conn.rollback();
                                return false;
                            }
                            bracketId = keys.getInt(1);
                        }
                    }
                    bracketByStage.put(stage, bracketId);
                }

                Map<String, Integer> roundByKey = new LinkedHashMap<>();
                for (TournamentSetupMatchDTO match : matches) {
                    String stage = normalizeStage(match.getStage(), format);
                    int bracketId = bracketByStage.get(stage);
                    Integer roundIndex = match.getRoundIndex() == null ? 1 : match.getRoundIndex();
                    String roundName = (match.getRoundName() == null || match.getRoundName().isBlank())
                            ? "Round " + roundIndex
                            : match.getRoundName().trim();
                    String roundKey = stage + "::" + roundIndex + "::" + roundName;

                    Integer roundId = roundByKey.get(roundKey);
                    if (roundId == null) {
                        try (PreparedStatement ps = conn.prepareStatement(insertRoundSql, PreparedStatement.RETURN_GENERATED_KEYS)) {
                            ps.setInt(1, bracketId);
                            ps.setInt(2, tournamentId);
                            ps.setString(3, roundName);
                            ps.setInt(4, roundIndex);
                            ps.executeUpdate();
                            try (ResultSet keys = ps.getGeneratedKeys()) {
                                if (!keys.next()) {
                                    conn.rollback();
                                    return false;
                                }
                                roundId = keys.getInt(1);
                                roundByKey.put(roundKey, roundId);
                            }
                        }
                    }

                    try (PreparedStatement ps = conn.prepareStatement(insertMatchSql)) {
                        ps.setInt(1, tournamentId);
                        ps.setInt(2, roundId);
                        if (match.getBoardNumber() == null) ps.setNull(3, java.sql.Types.INTEGER);
                        else ps.setInt(3, match.getBoardNumber());
                        if (match.getPlayer1Id() == null) {
                            if (columns.playerColumnsNullable()) ps.setNull(4, java.sql.Types.INTEGER);
                            else {
                                setLastReplaceManualSetupError(
                                        "Schema mismatch: cột Matches.player1_id đang NOT NULL, nhưng step hiện tại có match chưa gán player1. " +
                                        "Flow business Structure -> Players yêu cầu chỉ lưu structure ở bước BRACKET, và chỉ ghi Matches khi đã gán players."
                                );
                                conn.rollback();
                                return false;
                            }
                        } else ps.setInt(4, match.getPlayer1Id());
                        if (match.getPlayer2Id() == null) {
                            if (columns.playerColumnsNullable()) ps.setNull(5, java.sql.Types.INTEGER);
                            else {
                                setLastReplaceManualSetupError(
                                        "Schema mismatch: cột Matches.player2_id đang NOT NULL, nhưng step hiện tại có match chưa gán player2. " +
                                        "Flow business Structure -> Players yêu cầu chỉ lưu structure ở bước BRACKET, và chỉ ghi Matches khi đã gán players."
                                );
                                conn.rollback();
                                return false;
                            }
                        } else ps.setInt(5, match.getPlayer2Id());
                        if (match.getStartTime() == null) ps.setNull(6, java.sql.Types.TIMESTAMP);
                        else ps.setTimestamp(6, match.getStartTime());
                        ps.executeUpdate();
                    }
                }

                conn.commit();
                return true;
            } catch (SQLException e) {
                setLastReplaceManualSetupError("SQL error khi lưu setup: " + e.getMessage());
                conn.rollback();
                e.printStackTrace();
                return false;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            setLastReplaceManualSetupError("SQL connection error khi lưu setup: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Khi sửa lại 1 bước đã finalize, bước đó và các bước sau sẽ chuyển sang DIRTY.
     */
    public boolean markDirtyFromStep(int tournamentId, SetupStep step, Integer userId) {
        if (step == null || step == SetupStep.COMPLETED) return false;
        String stepDb = step.toDbValue();
        int order = step.order();
        String sql = """
            UPDATE Tournament_Setup_State SET
            current_step = ?,
            updated_at = GETDATE(),
            updated_by = ?,
            bracket_status = CASE
                WHEN ? <= 1 AND bracket_status = 'FINALIZED' THEN 'DIRTY'
                ELSE bracket_status
            END,
            players_status = CASE
                WHEN ? <= 2 AND players_status = 'FINALIZED' THEN 'DIRTY'
                ELSE players_status
            END,
            schedule_status = CASE
                WHEN ? <= 3 AND schedule_status = 'FINALIZED' THEN 'DIRTY'
                ELSE schedule_status
            END,
            referees_status = CASE
                WHEN ? <= 4 AND referees_status = 'FINALIZED' THEN 'DIRTY'
                ELSE referees_status
            END
            WHERE tournament_id = ?
            """;
        try (Connection conn = getConnection()) {
            if (conn == null) return false;
            ensureSetupStateRowOnConnection(conn, tournamentId);
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, stepDb);
                ps.setObject(2, userId);
                ps.setInt(3, order);
                ps.setInt(4, order);
                ps.setInt(5, order);
                ps.setInt(6, order);
                ps.setInt(7, tournamentId);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    private MatchPlayerColumns resolveMatchPlayerColumns(Connection conn) {
        if (conn == null) return new MatchPlayerColumns("player1_id", "player2_id", false);
        try {
            boolean nullable = isColumnNullable(conn, "Matches", "player1_id")
                    && isColumnNullable(conn, "Matches", "player2_id");
            return new MatchPlayerColumns("player1_id", "player2_id", nullable);
        } catch (SQLException e) {
            e.printStackTrace();
            return new MatchPlayerColumns("player1_id", "player2_id", false);
        }
    }

    private boolean hasColumn(Connection conn, String tableName, String columnName) throws SQLException {
        java.sql.DatabaseMetaData meta = conn.getMetaData();
        try (ResultSet rs = meta.getColumns(null, null, tableName, columnName)) {
            return rs.next();
        }
    }

    private boolean isColumnNullable(Connection conn, String tableName, String columnName) throws SQLException {
        java.sql.DatabaseMetaData meta = conn.getMetaData();
        try (ResultSet rs = meta.getColumns(null, null, tableName, columnName)) {
            if (!rs.next()) return true;
            return rs.getInt("NULLABLE") == java.sql.DatabaseMetaData.columnNullable;
        }
    }

    private static class MatchPlayerColumns {
        private final String player1Column;
        private final String player2Column;
        private final boolean playerColumnsNullable;

        private MatchPlayerColumns(String player1Column, String player2Column, boolean playerColumnsNullable) {
            this.player1Column = player1Column;
            this.player2Column = player2Column;
            this.playerColumnsNullable = playerColumnsNullable;
        }

        String player1Column() { return player1Column; }
        String player2Column() { return player2Column; }
        boolean playerColumnsNullable() { return playerColumnsNullable; }
    }

    private List<String> collectDistinctStages(String format, List<TournamentSetupMatchDTO> matches) {
        List<String> stages = new ArrayList<>();
        for (TournamentSetupMatchDTO match : matches) {
            String stage = normalizeStage(match.getStage(), format);
            if (!stages.contains(stage)) {
                stages.add(stage);
            }
        }
        if (stages.isEmpty()) {
            stages.add(normalizeStage(null, format));
        }
        return stages;
    }

    // ==================== REFEREE ASSIGNMENT ====================

    /**
     * Cập nhật trọng tài cho từng trận: xóa Match_Referee cũ, insert mới theo danh sách matches có refereeId.
     */
    public boolean updateMatchReferees(int tournamentId, List<TournamentSetupMatchDTO> matches) {
        if (matches == null || matches.isEmpty()) {
            return true;
        }
        String deleteSql = """
                DELETE FROM Match_Referee
                WHERE match_id IN (SELECT match_id FROM Matches WHERE tournament_id = ?)
                """;
        String insertSql = "INSERT INTO Match_Referee (match_id, referee_id, role) VALUES (?, ?, 'Main')";
        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement(deleteSql)) {
                    ps.setInt(1, tournamentId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                    for (TournamentSetupMatchDTO m : matches) {
                        Integer matchId = m.getMatchId();
                        Integer refereeId = m.getRefereeId();
                        if (matchId == null || matchId <= 0 || refereeId == null || refereeId <= 0) {
                            continue;
                        }
                        ps.setInt(1, matchId);
                        ps.setInt(2, refereeId);
                        ps.addBatch();
                    }
                    ps.executeBatch();
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

    private String normalizeStage(String inputStage, String format) {
        String raw = inputStage == null ? "" : inputStage.trim();
        if ("RoundRobin".equalsIgnoreCase(raw) || "Round Robin".equalsIgnoreCase(raw)) {
            return "RoundRobin";
        }
        if ("KnockOut".equalsIgnoreCase(raw) || "Knock Out".equalsIgnoreCase(raw)) {
            return "KnockOut";
        }
        if ("RoundRobin".equalsIgnoreCase(format)) {
            return "RoundRobin";
        }
        return "KnockOut";
    }
}






