package com.example.DAO;

import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DAO chuyên cho các thao tác điều hành trận đấu của trọng tài.
 * Sử dụng bảng Matches + Match_Referee, không thay đổi schema hiện tại.
 */
public class RefereeMatchDAO extends DBContext {

    public List<Map<String, Object>> getAssignedMatches(int refereeId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
                SELECT
                    m.match_id,
                    m.tournament_id,
                    t.tournament_name,
                    t.status AS tournament_status,
                    m.round_id,
                    r.round_index,
                    r.name AS round_name,
                    m.group_id,
                    g.name AS group_name,
                    m.board_number,
                    m.white_player_id,
                    m.black_player_id,
                    uw.first_name AS white_first_name,
                    uw.last_name AS white_last_name,
                    ub.first_name AS black_first_name,
                    ub.last_name AS black_last_name,
                    m.result,
                    m.termination,
                    m.status,
                    m.start_time,
                    m.end_time,
                    ma_white.status AS white_attendance_status,
                    ma_black.status AS black_attendance_status
                FROM Match_Referee mr
                LEFT JOIN Match_Attendance ma_white ON ma_white.match_id = m.match_id AND ma_white.user_id = m.white_player_id
                LEFT JOIN Match_Attendance ma_black ON ma_black.match_id = m.match_id AND ma_black.user_id = m.black_player_id
                JOIN Matches m ON m.match_id = mr.match_id
                JOIN Tournaments t ON t.tournament_id = m.tournament_id
                LEFT JOIN Round r ON r.round_id = m.round_id
                LEFT JOIN Tournament_Group g ON g.group_id = m.group_id
                LEFT JOIN Users uw ON uw.user_id = m.white_player_id
                LEFT JOIN Users ub ON ub.user_id = m.black_player_id
                WHERE mr.referee_id = ?
                ORDER BY
                    t.tournament_name,
                    ISNULL(r.round_index, 9999),
                    ISNULL(m.board_number, 9999),
                    m.match_id
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, refereeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("matchId", rs.getInt("match_id"));
                    row.put("tournamentId", rs.getInt("tournament_id"));
                    row.put("tournamentName", rs.getString("tournament_name"));
                    String tournamentStatus = null;
                    try {
                        tournamentStatus = rs.getString("tournament_status");
                    } catch (SQLException ignored) { /* column may be missing in older schema */ }
                    row.put("tournamentStatus", tournamentStatus);
                    row.put("roundId", rs.getObject("round_id"));
                    row.put("roundIndex", rs.getObject("round_index"));
                    row.put("roundName", rs.getString("round_name"));
                    row.put("groupId", rs.getObject("group_id"));
                    row.put("groupName", rs.getString("group_name"));
                    row.put("boardNumber", rs.getObject("board_number"));
                    row.put("whitePlayerId", rs.getObject("white_player_id"));
                    row.put("blackPlayerId", rs.getObject("black_player_id"));
                    row.put("whiteFirstName", rs.getString("white_first_name"));
                    row.put("whiteLastName", rs.getString("white_last_name"));
                    row.put("blackFirstName", rs.getString("black_first_name"));
                    row.put("blackLastName", rs.getString("black_last_name"));
                    row.put("result", rs.getString("result"));
                    row.put("termination", rs.getString("termination"));
                    row.put("status", rs.getString("status"));
                    row.put("startTime", rs.getTimestamp("start_time"));
                    row.put("endTime", rs.getTimestamp("end_time"));
                    String whiteAtt = null;
                    String blackAtt = null;
                    try {
                        whiteAtt = rs.getString("white_attendance_status");
                        blackAtt = rs.getString("black_attendance_status");
                    } catch (SQLException ignored) { }
                    row.put("whiteAttendanceStatus", whiteAtt);
                    row.put("blackAttendanceStatus", blackAtt);
                    list.add(row);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Lấy danh sách giải mà trọng tài được phân công (bảng Tournament_Referee).
     * Dùng cho trang "Danh sách giải" — hiển thị cả khi chưa có trận nào được gán (Match_Referee).
     */
    public List<Map<String, Object>> getAssignedTournaments(int refereeId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
                SELECT
                    t.tournament_id,
                    t.tournament_name,
                    t.status AS tournament_status,
                    tr.referee_role
                FROM Tournament_Referee tr
                JOIN Tournaments t ON t.tournament_id = tr.tournament_id
                WHERE tr.referee_id = ?
                ORDER BY
                    CASE WHEN t.status = 'Ongoing' THEN 1 WHEN t.status = 'Upcoming' THEN 2 ELSE 3 END,
                    t.tournament_name
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, refereeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("tournamentId", rs.getInt("tournament_id"));
                    row.put("tournamentName", rs.getString("tournament_name"));
                    row.put("tournamentStatus", rs.getString("tournament_status"));
                    row.put("refereeRole", rs.getString("referee_role"));
                    list.add(row);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Lấy tất cả trận của một giải mà trọng tài được phân công (Tournament_Referee).
     * Chỉ trả về dữ liệu nếu trọng tài có trong Tournament_Referee của giải này.
     * Mỗi trận có thêm assignedToMe = true nếu trọng tài cũng có trong Match_Referee (được gán trực tiếp trận đó).
     */
    public List<Map<String, Object>> getMatchesOfTournamentForReferee(int tournamentId, int refereeId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
                SELECT
                    m.match_id,
                    m.tournament_id,
                    t.tournament_name,
                    t.status AS tournament_status,
                    m.round_id,
                    r.round_index,
                    r.name AS round_name,
                    m.group_id,
                    g.name AS group_name,
                    m.board_number,
                    m.white_player_id,
                    m.black_player_id,
                    uw.first_name AS white_first_name,
                    uw.last_name AS white_last_name,
                    ub.first_name AS black_first_name,
                    ub.last_name AS black_last_name,
                    m.result,
                    m.termination,
                    m.status,
                    m.start_time,
                    m.end_time,
                    ma_white.status AS white_attendance_status,
                    ma_black.status AS black_attendance_status,
                    CASE WHEN mr.referee_id IS NOT NULL THEN 1 ELSE 0 END AS assigned_to_me
                FROM Matches m
                JOIN Tournaments t ON t.tournament_id = m.tournament_id
                INNER JOIN Tournament_Referee tr ON tr.tournament_id = m.tournament_id AND tr.referee_id = ?
                LEFT JOIN Match_Referee mr ON mr.match_id = m.match_id AND mr.referee_id = ?
                LEFT JOIN Match_Attendance ma_white ON ma_white.match_id = m.match_id AND ma_white.user_id = m.white_player_id
                LEFT JOIN Match_Attendance ma_black ON ma_black.match_id = m.match_id AND ma_black.user_id = m.black_player_id
                LEFT JOIN Round r ON r.round_id = m.round_id
                LEFT JOIN Tournament_Group g ON g.group_id = m.group_id
                LEFT JOIN Users uw ON uw.user_id = m.white_player_id
                LEFT JOIN Users ub ON ub.user_id = m.black_player_id
                WHERE m.tournament_id = ?
                ORDER BY ISNULL(r.round_index, 9999), ISNULL(m.board_number, 9999), m.match_id
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, refereeId);
            ps.setInt(2, refereeId);
            ps.setInt(3, tournamentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("matchId", rs.getInt("match_id"));
                    row.put("tournamentId", rs.getInt("tournament_id"));
                    row.put("tournamentName", rs.getString("tournament_name"));
                    String tournamentStatus = null;
                    try { tournamentStatus = rs.getString("tournament_status"); } catch (SQLException ignored) { }
                    row.put("tournamentStatus", tournamentStatus);
                    row.put("roundId", rs.getObject("round_id"));
                    row.put("roundIndex", rs.getObject("round_index"));
                    row.put("roundName", rs.getString("round_name"));
                    row.put("groupId", rs.getObject("group_id"));
                    row.put("groupName", rs.getString("group_name"));
                    row.put("boardNumber", rs.getObject("board_number"));
                    row.put("whitePlayerId", rs.getObject("white_player_id"));
                    row.put("blackPlayerId", rs.getObject("black_player_id"));
                    row.put("whiteFirstName", rs.getString("white_first_name"));
                    row.put("whiteLastName", rs.getString("white_last_name"));
                    row.put("blackFirstName", rs.getString("black_first_name"));
                    row.put("blackLastName", rs.getString("black_last_name"));
                    row.put("result", rs.getString("result"));
                    row.put("termination", rs.getString("termination"));
                    row.put("status", rs.getString("status"));
                    row.put("startTime", rs.getTimestamp("start_time"));
                    row.put("endTime", rs.getTimestamp("end_time"));
                    String whiteAtt = null, blackAtt = null;
                    try {
                        whiteAtt = rs.getString("white_attendance_status");
                        blackAtt = rs.getString("black_attendance_status");
                    } catch (SQLException ignored) { }
                    row.put("whiteAttendanceStatus", whiteAtt);
                    row.put("blackAttendanceStatus", blackAtt);
                    try {
                        row.put("assignedToMe", rs.getInt("assigned_to_me") == 1);
                    } catch (SQLException ignored) {
                        row.put("assignedToMe", false);
                    }
                    list.add(row);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Đánh dấu bắt đầu trận: chỉ cho phép nếu trọng tài được phân công và trạng thái hiện tại là Scheduled.
     * Nếu start_time đang null thì set bằng now, ngược lại giữ nguyên.
     */
    public boolean startMatch(int matchId, int refereeId) {
        String sql = """
                UPDATE Matches
                SET status = 'Ongoing',
                    start_time = COALESCE(start_time, ?)
                WHERE match_id = ?
                  AND status = 'Scheduled'
                  AND EXISTS (
                      SELECT 1 FROM Match_Referee mr
                      WHERE mr.match_id = Matches.match_id
                        AND mr.referee_id = ?
                  )
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setTimestamp(1, new Timestamp(System.currentTimeMillis()));
            ps.setInt(2, matchId);
            ps.setInt(3, refereeId);
            int updated = ps.executeUpdate();
            return updated > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Kết thúc trận và lưu kết quả. Chỉ cho phép nếu trọng tài được phân công và status hiện tại là Ongoing hoặc Scheduled.
     * Sau khi cập nhật Matches, ghi thêm/ cập nhật Match_PGN (duration_seconds từ start_time, end_time).
     */
    public boolean finishMatch(
            int matchId,
            int refereeId,
            String result,
            String termination
    ) {
        String sql = """
                UPDATE Matches
                SET status = 'Completed',
                    result = ?,
                    termination = ?,
                    end_time = COALESCE(end_time, ?)
                WHERE match_id = ?
                  AND status IN ('Ongoing', 'Scheduled')
                  AND EXISTS (
                      SELECT 1 FROM Match_Referee mr
                      WHERE mr.match_id = Matches.match_id
                        AND mr.referee_id = ?
                  )
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, result);
            ps.setString(2, termination);
            ps.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
            ps.setInt(4, matchId);
            ps.setInt(5, refereeId);
            int updated = ps.executeUpdate();
            if (updated > 0) {
                upsertMatchPGNDuration(matchId);
            }
            return updated > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Ghi hoặc cập nhật Match_PGN: tính duration_seconds từ start_time, end_time của Matches.
     * pgn_text, fen_final, total_moves để null (có thể bổ sung sau nếu có nhập PGN).
     */
    private void upsertMatchPGNDuration(int matchId) {
        String selectSql = "SELECT start_time, end_time FROM Matches WHERE match_id = ?";
        String updateSql = "UPDATE Match_PGN SET duration_seconds = ? WHERE match_id = ?";
        String insertSql = "INSERT INTO Match_PGN (match_id, duration_seconds) VALUES (?, ?)";
        try (Connection conn = getConnection()) {
            if (conn == null) return;
            Integer durationSeconds = null;
            try (PreparedStatement ps = conn.prepareStatement(selectSql)) {
                ps.setInt(1, matchId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        java.sql.Timestamp start = rs.getTimestamp("start_time");
                        java.sql.Timestamp end = rs.getTimestamp("end_time");
                        if (start != null && end != null) {
                            long secs = (end.getTime() - start.getTime()) / 1000;
                            durationSeconds = secs >= 0 && secs <= Integer.MAX_VALUE ? (int) secs : null;
                        }
                    }
                }
            }
            if (durationSeconds == null) return;
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setInt(1, durationSeconds);
                ps.setInt(2, matchId);
                int updated = ps.executeUpdate();
                if (updated == 0) {
                    try (PreparedStatement ins = conn.prepareStatement(insertSql)) {
                        ins.setInt(1, matchId);
                        ins.setInt(2, durationSeconds);
                        ins.executeUpdate();
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    /**
     * Lấy thông tin trận (white/black player id) nếu trọng tài được phân công trận này.
     */
    public Map<String, Object> getMatchForReferee(int matchId, int refereeId) {
        String sql = """
                SELECT m.match_id, m.white_player_id, m.black_player_id
                FROM Matches m
                JOIN Match_Referee mr ON mr.match_id = m.match_id AND mr.referee_id = ?
                WHERE m.match_id = ?
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, refereeId);
            ps.setInt(2, matchId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("matchId", rs.getInt("match_id"));
                    row.put("whitePlayerId", rs.getObject("white_player_id"));
                    row.put("blackPlayerId", rs.getObject("black_player_id"));
                    return row;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Ghi điểm danh cho trận: cập nhật hoặc thêm 2 bản ghi Match_Attendance (trắng, đen).
     * Chỉ cho phép khi trọng tài được phân công trận này.
     * status: Present | Absent | Pending.
     */
    public boolean recordAttendance(
            int matchId,
            int refereeId,
            Integer whitePlayerId,
            Integer blackPlayerId,
            String whiteStatus,
            String blackStatus
    ) {
        Map<String, Object> match = getMatchForReferee(matchId, refereeId);
        if (match == null) return false;
        String[] valid = { "Present", "Absent", "Pending" };
        if (whiteStatus == null || !java.util.Arrays.asList(valid).contains(whiteStatus)) whiteStatus = "Pending";
        if (blackStatus == null || !java.util.Arrays.asList(valid).contains(blackStatus)) blackStatus = "Pending";
        try (Connection conn = getConnection()) {
            if (conn == null) return false;
            if (whitePlayerId != null) {
                upsertOneAttendance(conn, matchId, whitePlayerId, whiteStatus, refereeId);
            }
            if (blackPlayerId != null) {
                upsertOneAttendance(conn, matchId, blackPlayerId, blackStatus, refereeId);
            }
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    private void upsertOneAttendance(Connection conn, int matchId, int userId, String status, int recordedBy) throws SQLException {
        String updateSql = "UPDATE Match_Attendance SET status = ?, recorded_at = GETDATE(), recorded_by = ? WHERE match_id = ? AND user_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
            ps.setString(1, status);
            ps.setInt(2, recordedBy);
            ps.setInt(3, matchId);
            ps.setInt(4, userId);
            if (ps.executeUpdate() > 0) return;
        }
        String insertSql = "INSERT INTO Match_Attendance (match_id, user_id, status, recorded_by) VALUES (?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
            ps.setInt(1, matchId);
            ps.setInt(2, userId);
            ps.setString(3, status);
            ps.setInt(4, recordedBy);
            ps.executeUpdate();
        }
    }
}

