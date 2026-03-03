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

public class TournamentSetupDAO extends DBContext {

    private static final String COL_BRACKET = "bracket_status";
    private static final String COL_PLAYERS = "players_status";
    private static final String COL_SCHEDULE = "schedule_status";
    private static final String COL_REFEREES = "referees_status";

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

    public boolean upsertSetupStep(int tournamentId, String step) {
        String updateSql = "UPDATE Tournament_Setup_State SET current_step = ?, updated_at = GETDATE() WHERE tournament_id = ?";
        String insertSql = "INSERT INTO Tournament_Setup_State (tournament_id, current_step, updated_at) VALUES (?, ?, GETDATE())";
        try (Connection conn = getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setString(1, step);
                ps.setInt(2, tournamentId);
                int updated = ps.executeUpdate();
                if (updated > 0) {
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

    /**
     * Full state for wizard: current_step + per-step status (DRAFT/FINALIZED). If row missing or migration not run, returns defaults.
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
            if (e.getMessage() != null && (e.getMessage().contains("bracket_status") || e.getMessage().contains("Invalid column"))) {
                return getSetupStateFullLegacy(tournamentId);
            }
            e.printStackTrace();
        }
        return defaultSetupState(tournamentId);
    }

    private TournamentSetupStateDTO getSetupStateFullLegacy(int tournamentId) {
        String sql = "SELECT tournament_id, current_step, updated_at FROM Tournament_Setup_State WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    TournamentSetupStateDTO dto = new TournamentSetupStateDTO();
                    dto.setTournamentId(rs.getInt("tournament_id"));
                    dto.setCurrentStep(normalizeStepFromDb(rs.getString("current_step")));
                    dto.setUpdatedAt(rs.getTimestamp("updated_at"));
                    dto.setStepStatuses(Map.of("BRACKET", "DRAFT", "PLAYERS", "DRAFT", "SCHEDULE", "DRAFT", "REFEREES", "DRAFT"));
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
            return (v != null && ("DRAFT".equalsIgnoreCase(v) || "FINALIZED".equalsIgnoreCase(v))) ? v : "DRAFT";
        } catch (SQLException e) {
            return "DRAFT";
        }
    }

    private String normalizeStepFromDb(String dbStep) {
        if (dbStep == null) return "BRACKET";
        String s = dbStep.trim().toUpperCase();
        if ("STRUCTURE".equals(s)) return "BRACKET";
        if ("REFEREE".equals(s)) return "REFEREES";
        return s;
    }

    /** Ensure row exists with default DRAFT statuses (for new tournaments). If migration not run, fallback insert without new columns. */
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
        String insExtended = """
            INSERT INTO Tournament_Setup_State (tournament_id, current_step, updated_at, bracket_status, players_status, schedule_status, referees_status, updated_by)
            VALUES (?, 'STRUCTURE', GETDATE(), 'DRAFT', 'DRAFT', 'DRAFT', 'DRAFT', NULL)
            """;
        String insLegacy = "INSERT INTO Tournament_Setup_State (tournament_id, current_step, updated_at) VALUES (?, 'STRUCTURE', GETDATE())";
        try (Connection conn = getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(insExtended)) {
                ps.setInt(1, tournamentId);
                ps.executeUpdate();
                return;
            } catch (SQLException e) {
                if (e.getMessage() != null && (e.getMessage().contains("bracket_status") || e.getMessage().contains("Invalid column"))) {
                    try (PreparedStatement ps = conn.prepareStatement(insLegacy)) {
                        ps.setInt(1, tournamentId);
                        ps.executeUpdate();
                    } catch (SQLException e2) {
                        e2.printStackTrace();
                    }
                } else {
                    e.printStackTrace();
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    /** Finalize one step: set its status to FINALIZED and advance current_step to next. */
    public boolean finalizeStep(int tournamentId, SetupStep step, Integer userId) {
        String statusCol = statusColumn(step);
        if (statusCol == null) return false;
        SetupStep next = step.next();
        String nextDb = next != null ? next.toDbValue() : "COMPLETED";
        String sql = "UPDATE Tournament_Setup_State SET current_step = ?, updated_at = GETDATE(), " + statusCol + " = 'FINALIZED', updated_by = ? WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, nextDb);
            ps.setObject(2, userId);
            ps.setInt(3, tournamentId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /** Unlock step K: set step K and all later steps to DRAFT, current_step to step K. */
    public boolean unlockStep(int tournamentId, SetupStep step, Integer userId) {
        String stepDb = step.toDbValue();
        String sql = """
            UPDATE Tournament_Setup_State SET
            current_step = ?,
            updated_at = GETDATE(),
            updated_by = ?,
            bracket_status = CASE WHEN ? <= 1 THEN 'DRAFT' ELSE bracket_status END,
            players_status = CASE WHEN ? <= 2 THEN 'DRAFT' ELSE players_status END,
            schedule_status = CASE WHEN ? <= 3 THEN 'DRAFT' ELSE schedule_status END,
            referees_status = CASE WHEN ? <= 4 THEN 'DRAFT' ELSE referees_status END
            WHERE tournament_id = ?
            """;
        int order = step.order();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, stepDb);
            ps.setObject(2, userId);
            ps.setInt(3, order);
            ps.setInt(4, order);
            ps.setInt(5, order);
            ps.setInt(6, order);
            ps.setInt(7, tournamentId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
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

    public List<TournamentSetupMatchDTO> getManualSetupMatches(int tournamentId) {
        List<TournamentSetupMatchDTO> list = new ArrayList<>();
        String sql = """
                SELECT
                    m.match_id,
                    m.board_number,
                    m.white_player_id,
                    m.black_player_id,
                    m.start_time,
                    r.name AS round_name,
                    r.round_index,
                    b.type AS bracket_type,
                    LTRIM(RTRIM(COALESCE(uw.first_name, '') + ' ' + COALESCE(uw.last_name, ''))) AS white_name,
                    LTRIM(RTRIM(COALESCE(ub.first_name, '') + ' ' + COALESCE(ub.last_name, ''))) AS black_name,
                    (SELECT TOP 1 mr.referee_id FROM Match_Referee mr WHERE mr.match_id = m.match_id) AS referee_id
                FROM Matches m
                LEFT JOIN Round r ON r.round_id = m.round_id
                LEFT JOIN Bracket b ON b.bracket_id = r.bracket_id
                LEFT JOIN Users uw ON uw.user_id = m.white_player_id
                LEFT JOIN Users ub ON ub.user_id = m.black_player_id
                WHERE m.tournament_id = ?
                ORDER BY
                    CASE b.type WHEN 'RoundRobin' THEN 1 WHEN 'KnockOut' THEN 2 ELSE 3 END,
                    ISNULL(r.round_index, 9999),
                    ISNULL(m.board_number, 9999),
                    m.match_id
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    TournamentSetupMatchDTO dto = new TournamentSetupMatchDTO();
                    dto.setMatchId(rs.getInt("match_id"));
                    dto.setBoardNumber((Integer) rs.getObject("board_number"));
                    dto.setWhitePlayerId((Integer) rs.getObject("white_player_id"));
                    dto.setBlackPlayerId((Integer) rs.getObject("black_player_id"));
                    dto.setStartTime(rs.getTimestamp("start_time"));
                    dto.setRoundName(rs.getString("round_name"));
                    dto.setRoundIndex((Integer) rs.getObject("round_index"));
                    dto.setStage(rs.getString("bracket_type"));
                    dto.setWhitePlayerName(rs.getString("white_name"));
                    dto.setBlackPlayerName(rs.getString("black_name"));
                    Object refObj = rs.getObject("referee_id");
                    if (refObj != null) dto.setRefereeId(((Number) refObj).intValue());
                    list.add(dto);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean replaceManualSetup(
            int tournamentId,
            String format,
            List<TournamentSetupMatchDTO> matches
    ) {
        String deleteMatchesSql = "DELETE FROM Matches WHERE tournament_id = ?";
        String deleteRoundsSql = "DELETE FROM Round WHERE tournament_id = ?";
        String deleteBracketsSql = "DELETE FROM Bracket WHERE tournament_id = ?";
        String insertBracketSql = """
                INSERT INTO Bracket (bracket_name, tournament_id, type, status)
                VALUES (?, ?, ?, 'Pending')
                """;
        String insertRoundSql = """
                INSERT INTO Round (bracket_id, tournament_id, name, round_index, is_completed)
                VALUES (?, ?, ?, ?, 0)
                """;
        String insertMatchSql = """
                INSERT INTO Matches
                (tournament_id, round_id, board_number, white_player_id, black_player_id, status, start_time)
                VALUES (?, ?, ?, ?, ?, 'Scheduled', ?)
                """;

        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);
            try {
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
                        if (match.getBoardNumber() == null) {
                            ps.setNull(3, java.sql.Types.INTEGER);
                        } else {
                            ps.setInt(3, match.getBoardNumber());
                        }
                        if (match.getWhitePlayerId() == null) {
                            ps.setNull(4, java.sql.Types.INTEGER);
                        } else {
                            ps.setInt(4, match.getWhitePlayerId());
                        }
                        if (match.getBlackPlayerId() == null) {
                            ps.setNull(5, java.sql.Types.INTEGER);
                        } else {
                            ps.setInt(5, match.getBlackPlayerId());
                        }
                        if (match.getStartTime() == null) {
                            ps.setNull(6, java.sql.Types.TIMESTAMP);
                        } else {
                            ps.setTimestamp(6, match.getStartTime());
                        }
                        ps.executeUpdate();
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
