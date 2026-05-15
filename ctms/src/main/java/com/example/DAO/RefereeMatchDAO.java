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
                    t.format AS tournament_format,
                    m.round_id,
                    r.round_index,
                    r.name AS round_name,
                    m.group_id,
                    g.name AS group_name,
                    m.board_number,
                    COALESCE(mm1.white_player_id, m.player1_id) AS white_player_id,
                    COALESCE(mm1.black_player_id, m.player2_id) AS black_player_id,
                    mm1.game_number AS game1_number,
                    mm2.game_number AS game2_number,
                    mm1.mini_match_id AS mini_match_id_1,
                    mm2.mini_match_id AS mini_match_id_2,
                    mm1.status AS game1_status,
                    mm2.status AS game2_status,
                    mm1.result AS game1_result,
                    mm2.result AS game2_result,
                    mm_tb.status AS tiebreak_status,
                    mm_tb.game_number AS tiebreak_number,
                    mm_tb.result AS tiebreak_result,
                    uw1.first_name AS white_first_name_1,
                    uw1.last_name AS white_last_name_1,
                    ub1.first_name AS black_first_name_1,
                    ub1.last_name AS black_last_name_1,
                    uw2.first_name AS white_first_name_2,
                    uw2.last_name AS white_last_name_2,
                    ub2.first_name AS black_first_name_2,
                    ub2.last_name AS black_last_name_2,
                    m.result,
                    m.status,
                    m.start_time,
                    m.end_time,
                    ma_white1.status AS white_attendance_status_1,
                    ma_black1.status AS black_attendance_status_1,
                    ma_white2.status AS white_attendance_status_2,
                    ma_black2.status AS black_attendance_status_2,
                    CASE WHEN mr.referee_id IS NOT NULL THEN 1 ELSE 0 END AS assigned_to_me
                FROM Matches m
                JOIN Tournaments t ON t.tournament_id = m.tournament_id
                INNER JOIN Tournament_Referee tr ON tr.tournament_id = m.tournament_id AND tr.referee_id = ?
                LEFT JOIN Match_Referee mr ON mr.match_id = m.match_id AND mr.referee_id = ?
                LEFT JOIN (
                    SELECT match_id, mini_match_id, game_number, white_player_id, black_player_id, status, result
                    FROM Mini_matches
                    WHERE game_number = 1 AND is_tiebreak = 0
                ) mm1 ON mm1.match_id = m.match_id

                LEFT JOIN (
                    SELECT match_id, mini_match_id, game_number, white_player_id, black_player_id, status, result
                    FROM Mini_matches
                    WHERE game_number = 2 AND is_tiebreak = 0
                ) mm2 ON mm2.match_id = m.match_id

                LEFT JOIN Match_Attendance ma_white1 
                ON ma_white1.mini_match_id = mm1.mini_match_id 
                AND ma_white1.user_id = mm1.white_player_id

                LEFT JOIN Match_Attendance ma_black1 
                ON ma_black1.mini_match_id = mm1.mini_match_id 
                AND ma_black1.user_id = mm1.black_player_id

                LEFT JOIN Match_Attendance ma_white2 
                ON ma_white2.mini_match_id = mm2.mini_match_id 
                AND ma_white2.user_id = mm2.white_player_id

                LEFT JOIN Match_Attendance ma_black2 
                ON ma_black2.mini_match_id = mm2.mini_match_id 
                AND ma_black2.user_id = mm2.black_player_id

                LEFT JOIN (
                    SELECT match_id, game_number, status, result
                    FROM Mini_matches
                    WHERE is_tiebreak = 1
                ) mm_tb ON mm_tb.match_id = m.match_id

                LEFT JOIN Round r ON r.round_id = m.round_id
                LEFT JOIN Tournament_Group g ON g.group_id = m.group_id 
                LEFT JOIN Users uw1 ON uw1.user_id = COALESCE(mm1.white_player_id, m.player1_id)
                LEFT JOIN Users ub1 ON ub1.user_id = COALESCE(mm1.black_player_id, m.player2_id)
                LEFT JOIN Users uw2 ON uw2.user_id = COALESCE(mm2.white_player_id, m.player2_id)
                LEFT JOIN Users ub2 ON ub2.user_id = COALESCE(mm2.black_player_id, m.player1_id)
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
                    row.put("tournamentFormat", rs.getString("tournament_format"));
                    row.put("roundId", rs.getObject("round_id"));
                    row.put("roundIndex", rs.getObject("round_index"));
                    row.put("roundName", rs.getString("round_name"));
                    row.put("game1Number", rs.getObject("game1_number"));
                    row.put("game2Number", rs.getObject("game2_number"));
                    row.put("tiebreakNumber", rs.getObject("tiebreak_number"));
                    row.put("miniMatchId1", rs.getObject("mini_match_id_1"));
                    row.put("miniMatchId2", rs.getObject("mini_match_id_2"));
                    row.put("groupId", rs.getObject("group_id"));
                    row.put("groupName", rs.getString("group_name"));
                    row.put("boardNumber", rs.getObject("board_number"));
                    row.put("whitePlayerId", rs.getObject("white_player_id"));
                    row.put("blackPlayerId", rs.getObject("black_player_id"));
                    // Game 1
                    row.put("whiteFirstName1", rs.getString("white_first_name_1"));
                    row.put("whiteLastName1", rs.getString("white_last_name_1"));
                    row.put("blackFirstName1", rs.getString("black_first_name_1"));
                    row.put("blackLastName1", rs.getString("black_last_name_1"));
                    // Game 2
                    row.put("whiteFirstName2", rs.getString("white_first_name_2"));
                    row.put("whiteLastName2", rs.getString("white_last_name_2"));
                    row.put("blackFirstName2", rs.getString("black_first_name_2"));
                    row.put("blackLastName2", rs.getString("black_last_name_2"));
                    row.put("result", rs.getString("result"));
                    // Matches theo schema mới không còn termination; nếu cần có thể suy ra từ Mini_matches sau này.
                    row.put("termination", null);
                    row.put("status", rs.getString("status"));
                    row.put("game1Status", rs.getString("game1_status"));
                    row.put("game2Status", rs.getString("game2_status"));
                    row.put("game1Result", rs.getString("game1_result"));
                    row.put("game2Result", rs.getString("game2_result"));
                    row.put("tiebreakResult", rs.getString("tiebreak_result"));
                    row.put("startTime", rs.getTimestamp("start_time"));
                    row.put("endTime", rs.getTimestamp("end_time"));
                    String whiteAtt1 = null, blackAtt1 = null;
                    String whiteAtt2 = null, blackAtt2 = null;
                    try {
                        whiteAtt1 = rs.getString("white_attendance_status_1");
                        blackAtt1 = rs.getString("black_attendance_status_1");
                        whiteAtt2 = rs.getString("white_attendance_status_2");
                        blackAtt2 = rs.getString("black_attendance_status_2");
                    } catch (SQLException ignored) { }
                    row.put("whiteAttendanceStatus", whiteAtt1);
                    row.put("blackAttendanceStatus", blackAtt1);
                    row.put("whiteAttendanceStatus2", whiteAtt2);
                    row.put("blackAttendanceStatus2", blackAtt2);
                    row.put("tiebreakStatus", rs.getString("tiebreak_status"));
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
     * Bắt đầu ván tiếp theo (Mini_match) của trận: chọn ván có status = 'Scheduled' nhỏ nhất theo game_number / is_tiebreak.
     * Đồng thời set Matches.status = 'Ongoing' nếu đang Scheduled.
     */

    public boolean startGame(int matchId, int gameNumber, int refereeId) {

        if (getMatchForReferee(matchId, refereeId) == null) return false;

        String findGame = """
            SELECT mini_match_id, status
            FROM Mini_matches
            WHERE match_id = ?
            AND game_number = ?
        """;

        String updateGame = """
            UPDATE Mini_matches
            SET status = 'Ongoing',
                start_time = GETDATE()
            WHERE mini_match_id = ?
        """;

        String updateMatch = """
            UPDATE Matches
            SET status = 'Ongoing',
                start_time = COALESCE(start_time, GETDATE())
            WHERE match_id = ?
        """;

        try (Connection conn = getConnection()) {

            // Tự động tạo mini_matches nếu chưa có
            ensureMiniMatchesExist(conn, matchId);

            PreparedStatement ps = conn.prepareStatement(findGame);
            ps.setInt(1, matchId);
            ps.setInt(2, gameNumber);

            ResultSet rs = ps.executeQuery();

            if (!rs.next()) return false;

            int miniId = rs.getInt("mini_match_id");
            String status = rs.getString("status");

            if (!"Scheduled".equals(status)) {
                return false;
            }

            PreparedStatement ps2 = conn.prepareStatement(updateGame);
            ps2.setInt(1, miniId);
            ps2.executeUpdate();

            PreparedStatement ps3 = conn.prepareStatement(updateMatch);
            ps3.setInt(1, matchId);
            ps3.executeUpdate();

            // check điểm danh để xét thắng thua nếu có người vắng mặt

            String checkAttendance = """
            SELECT
                ma_white.status AS white_status,
                ma_black.status AS black_status
            FROM Mini_matches mm
            LEFT JOIN Match_Attendance ma_white
                ON ma_white.mini_match_id = mm.mini_match_id
                AND ma_white.user_id = mm.white_player_id
            LEFT JOIN Match_Attendance ma_black
                ON ma_black.mini_match_id = mm.mini_match_id
                AND ma_black.user_id = mm.black_player_id
            WHERE mm.mini_match_id = ?
            """;

            PreparedStatement psCheck = conn.prepareStatement(checkAttendance);
            psCheck.setInt(1, miniId);

            ResultSet rsCheck = psCheck.executeQuery();

            if (rsCheck.next()) {

                String whiteStatus = rsCheck.getString("white_status");
                String blackStatus = rsCheck.getString("black_status");

                if ("Absent".equals(whiteStatus) && "Present".equals(blackStatus)) {
                    finishGame(matchId, gameNumber, refereeId, "0-1");
                    return true;
                }

                if ("Absent".equals(blackStatus) && "Present".equals(whiteStatus)) {
                    finishGame(matchId, gameNumber, refereeId, "1-0");
                    return true;
                }

                if ("Absent".equals(whiteStatus) && "Absent".equals(blackStatus)) {
                    finishGame(matchId, gameNumber, refereeId, "*");
                    return true;
                }
            }

            return true;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }
    
    /**
     * Kết thúc MỘT ván (Mini_match): cập nhật result, status, end_time, rồi tổng hợp lại kết quả trận (Matches).
     * gameResult: '1-0' | '0-1' | '1/2-1/2'.
     */
    public boolean finishGame(int matchId, int gameNumber, int refereeId, String result) {

        if (getMatchForReferee(matchId, refereeId) == null) return false;

        String findGame = """
            SELECT mini_match_id, status, is_tiebreak
            FROM Mini_matches
            WHERE match_id = ?
            AND game_number = ?
        """;
    
        String updateGame = """
            UPDATE Mini_matches
            SET status = 'Completed',
                result = ?,
                end_time = GETDATE()
            WHERE mini_match_id = ?
        """;
    
        try (Connection conn = getConnection()) {
    
            PreparedStatement ps = conn.prepareStatement(findGame);
            ps.setInt(1, matchId);
            ps.setInt(2, gameNumber);
    
            ResultSet rs = ps.executeQuery();   
    
            if (!rs.next()) {
                return false;
            }
    
            int miniId = rs.getInt("mini_match_id");
            String status = rs.getString("status");
            boolean isTiebreak = rs.getBoolean("is_tiebreak");
    
            if (!"Ongoing".equals(status)) {
                return false;
            }
            if(isTiebreak && "1/2-1/2".equals(result)) {
                return false;
            }
    
            PreparedStatement ps2 = conn.prepareStatement(updateGame);

            if (!List.of("1-0","0-1","1/2-1/2","*").contains(result)) {
                return false;
            }
            
            ps2.setString(1, result);
            ps2.setInt(2, miniId);
    
            ps2.executeUpdate();
    
            aggregateMatchResult(matchId);
    
            return true;
    
        } catch (Exception e) {
            e.printStackTrace();
        }
    
        return false;
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
     * Tổng hợp tất cả Mini_matches của một trận để cập nhật player1_score, player2_score, result, winner_id, status cho Matches.
     */
    public void aggregateMatchResult(int matchId) {
        String matchSql = """
                SELECT m.player1_id, m.player2_id, m.result, m.status, t.format,
                       m.round_id, m.board_number, m.tournament_id
                FROM Matches m
                JOIN Tournaments t ON t.tournament_id = m.tournament_id
                WHERE m.match_id = ?
                """;
        String miniSql = """
                SELECT is_tiebreak, result, status, white_player_id
                FROM Mini_matches
                WHERE match_id = ?
                """;
        String updateSql = """
                UPDATE Matches
                SET player1_score = ?,
                    player2_score = ?,
                    result = ?,
                    winner_id = ?,
                    status = ?
                WHERE match_id = ?
                """;
        try (Connection conn = getConnection()) {
            if (conn == null) return;
            Integer player1Id;
            Integer player2Id;
            String curResult;
            String curStatus;
            String format;
            int roundId;
            int boardNumber;
            int tournamentId;
            try (PreparedStatement ps = conn.prepareStatement(matchSql)) {
                ps.setInt(1, matchId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) return;
                    player1Id = (Integer) rs.getObject("player1_id");
                    player2Id = (Integer) rs.getObject("player2_id");
                    curResult = rs.getString("result");
                    curStatus = rs.getString("status");
                    format = rs.getString("format");
                    roundId = rs.getInt("round_id");
                    boardNumber = rs.getInt("board_number");
                    tournamentId = rs.getInt("tournament_id");
                }
            }

            double p1 = 0.0;
            double p2 = 0.0;
            boolean mainGamesCompleted = false;
            boolean tiebreakCompleted = false;
            int mainCompletedCount = 0;
            int starCount = 0; // đếm số ván main có kết quả là "*"
            try (PreparedStatement ps = conn.prepareStatement(miniSql)) {
                ps.setInt(1, matchId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {

                        boolean isTiebreak = rs.getBoolean("is_tiebreak");
                        String res = rs.getString("result");
                        String st = rs.getString("status");
                        int whitePlayerId = rs.getInt("white_player_id");

                        // Xác định chiều điểm: nếu trắng của ván này là player1 thì "1-0" → p1++
                        // Nếu trắng là player2 (ván đổi màu) thì "1-0" → p2++
                        boolean whiteIsPlayer1 = (player1Id != null && whitePlayerId == player1Id);

                        if ("Completed".equals(st)) {

                            if (isTiebreak) {
                                tiebreakCompleted = true;
                            }

                            if (!isTiebreak) {
                                mainCompletedCount++;

                                if ("*".equals(res)) {
                                    starCount++;
                                }
                            }

                            if ("1-0".equals(res)) {
                                if (whiteIsPlayer1) p1 += 1.0; else p2 += 1.0;
                            }
                            else if ("0-1".equals(res)) {
                                if (whiteIsPlayer1) p2 += 1.0; else p1 += 1.0;
                            }
                            else if ("1/2-1/2".equals(res)) {
                                p1 += 0.5;
                                p2 += 0.5;
                            }
                        }
                    }
                }
            }
            mainGamesCompleted = mainCompletedCount >= 2;

            if (mainGamesCompleted && starCount == 2) {

                String sql = """
                    UPDATE Matches
                    SET player1_score = 0,
                        player2_score = 0,
                        result = 'none',
                        winner_id = NULL,
                        status = 'Completed'
                    WHERE match_id = ?
                """;

                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, matchId);
                    ps.executeUpdate();
                }

                // For KO: check if next round can be auto-completed as bye
                String fmt = format != null ? format : "";
                if (fmt.equalsIgnoreCase("KnockOut")) {
                    checkByeInNextRound(conn, roundId, boardNumber);
                }

                return;
            }

            String newResult = curResult != null ? curResult : "pending";
            String newStatus = curStatus != null ? curStatus : "Scheduled";
            Integer winnerId = null;

            String fmt = format != null ? format : "";
            boolean isRoundRobin = fmt.equalsIgnoreCase("RoundRobin");
            boolean isKnockout = fmt.equalsIgnoreCase("KnockOut");

            if (isRoundRobin) {
                if (mainGamesCompleted) {
                    if (p1 > p2) {
                        newResult = "player1";
                        winnerId = player1Id;
                        newStatus = "Completed";
                    } else if (p2 > p1) {
                        newResult = "player2";
                        winnerId = player2Id;
                        newStatus = "Completed";
                    } else {
                        newResult = "draw";
                        winnerId = null;
                        newStatus = "Completed";
                    }
                } else {
                    newResult = "pending";
                    newStatus = curStatus;
                }
            } else if (isKnockout) {
                if (tiebreakCompleted) {
                    if (p1 > p2) {
                        newResult = "player1";
                        winnerId = player1Id;
                        newStatus = "Completed";
                    } else if (p2 > p1) {
                        newResult = "player2";
                        winnerId = player2Id;
                        newStatus = "Completed";
                    } else {
                        newResult = "pending";
                        winnerId = null;
                        newStatus = "Ongoing";
                    }
                } else if (mainGamesCompleted) {
                    if (p1 > p2) {
                        newResult = "player1";
                        winnerId = player1Id;
                        newStatus = "Completed";
                    } else if (p2 > p1) {
                        newResult = "player2";
                        winnerId = player2Id;
                        newStatus = "Completed";
                    } else {
                        newResult = "pending";
                        winnerId = null;
                        newStatus = "Ongoing";
                    }
                } else {
                    newResult = "pending";
                    newStatus = curStatus;
                }
            } else {
                if (mainGamesCompleted) {
                    if (p1 > p2) {
                        newResult = "player1";
                        winnerId = player1Id;
                        newStatus = "Completed";
                    } else if (p2 > p1) {
                        newResult = "player2";
                        winnerId = player2Id;
                        newStatus = "Completed";
                    } else {
                        newResult = "draw";
                        winnerId = null;
                        newStatus = "Completed";
                    }
                } else {
                    newResult = "pending";
                    newStatus = curStatus   ;
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setDouble(1, p1);
                ps.setDouble(2, p2);
                ps.setString(3, newResult);
                if (winnerId == null) {
                    ps.setNull(4, java.sql.Types.INTEGER);
                } else {
                    ps.setInt(4, winnerId);
                }
                ps.setString(5, newStatus);
                ps.setInt(6, matchId);
                ps.executeUpdate();
            }

            if (isKnockout && winnerId != null && "Completed".equals(newStatus)) {
                propagateKoWinner(conn, roundId, boardNumber, winnerId);
                // Also check if next round now has a bye (other feeder both-absent)
                checkByeInNextRound(conn, roundId, boardNumber);
            }

            if (isRoundRobin && "Completed".equals(newStatus)) {
                new StandingDAO().updateStandingsForTournament(conn, tournamentId);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    /**
     * After a KO match completes, place the winner into the correct slot of the next round's match.
     * Board B in round R → board ceil(B/2) in round R+1.
     * Odd B → player1_id slot; even B → player2_id slot.
     */
    private void propagateKoWinner(Connection conn, int roundId, int boardNumber, int winnerId) throws SQLException {
        // Get current round's round_index and tournament_id
        String roundSql = """
                SELECT r.round_index, r.tournament_id
                FROM Round r
                WHERE r.round_id = ?
                """;
        int currentRoundIndex;
        int tournamentId;
        try (PreparedStatement ps = conn.prepareStatement(roundSql)) {
            ps.setInt(1, roundId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return;
                currentRoundIndex = rs.getInt("round_index");
                tournamentId = rs.getInt("tournament_id");
            }
        }

        // Find the next round (round_index + 1) in the same tournament
        String nextRoundSql = """
                SELECT r.round_id
                FROM Round r
                WHERE r.tournament_id = ? AND r.round_index = ?
                """;
        int nextRoundId;
        try (PreparedStatement ps = conn.prepareStatement(nextRoundSql)) {
            ps.setInt(1, tournamentId);
            ps.setInt(2, currentRoundIndex + 1);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return; // no next round (this was the final)
                nextRoundId = rs.getInt("round_id");
            }
        }

        int nextBoard = (int) Math.ceil(boardNumber / 2.0);
        boolean isOddBoard = (boardNumber % 2 != 0);
        String slotColumn = isOddBoard ? "player1_id" : "player2_id";

        String updateSlotSql = "UPDATE Matches SET " + slotColumn + " = ? WHERE round_id = ? AND board_number = ?";
        try (PreparedStatement ps = conn.prepareStatement(updateSlotSql)) {
            ps.setInt(1, winnerId);
            ps.setInt(2, nextRoundId);
            ps.setInt(3, nextBoard);
            ps.executeUpdate();
        }
    }

    /**
     * After any KO match completes, check if the next round match is now a bye.
     * A bye occurs when one feeder match has a winner and the other feeder match
     * completed with result="none" (both players absent).
     * Also handles cascading: if both feeders are absent, marks next match as absent too.
     */
    private void checkByeInNextRound(Connection conn, int roundId, int boardNumber) throws SQLException {
        // Get current round info
        String roundSql = """
                SELECT r.round_index, r.tournament_id
                FROM Round r
                WHERE r.round_id = ?
                """;
        int currentRoundIndex, tournamentId;
        try (PreparedStatement ps = conn.prepareStatement(roundSql)) {
            ps.setInt(1, roundId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return;
                currentRoundIndex = rs.getInt("round_index");
                tournamentId = rs.getInt("tournament_id");
            }
        }

        // Find next round
        String nextRoundSql = """
                SELECT r.round_id
                FROM Round r
                WHERE r.tournament_id = ? AND r.round_index = ?
                """;
        int nextRoundId;
        try (PreparedStatement ps = conn.prepareStatement(nextRoundSql)) {
            ps.setInt(1, tournamentId);
            ps.setInt(2, currentRoundIndex + 1);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return; // final round
                nextRoundId = rs.getInt("round_id");
            }
        }

        int nextBoard = (int) Math.ceil(boardNumber / 2.0);
        int feederBoard1 = (nextBoard * 2) - 1; // odd feeder → player1 slot
        int feederBoard2 = nextBoard * 2;        // even feeder → player2 slot

        // Check status of both feeder boards
        String feederSql = """
                SELECT m.board_number, m.status, m.winner_id
                FROM Matches m
                WHERE m.round_id = ? AND m.board_number IN (?, ?)
                """;
        boolean feeder1Done = false, feeder2Done = false;
        Integer feeder1Winner = null, feeder2Winner = null;
        try (PreparedStatement ps = conn.prepareStatement(feederSql)) {
            ps.setInt(1, roundId);
            ps.setInt(2, feederBoard1);
            ps.setInt(3, feederBoard2);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int bn = rs.getInt("board_number");
                    boolean done = "Completed".equals(rs.getString("status"));
                    Integer winner = (Integer) rs.getObject("winner_id");
                    if (bn == feederBoard1) {
                        feeder1Done = done;
                        feeder1Winner = winner;
                    } else {
                        feeder2Done = done;
                        feeder2Winner = winner;
                    }
                }
            }
        }

        // Both feeders must be done before we can decide
        if (!feeder1Done || !feeder2Done) return;

        // Get the next round match
        String nextMatchSql = """
                SELECT m.match_id, m.status
                FROM Matches m
                WHERE m.round_id = ? AND m.board_number = ?
                """;
        int nextMatchId;
        try (PreparedStatement ps = conn.prepareStatement(nextMatchSql)) {
            ps.setInt(1, nextRoundId);
            ps.setInt(2, nextBoard);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return;
                nextMatchId = rs.getInt("match_id");
                if ("Completed".equals(rs.getString("status"))) return;
            }
        }

        if (feeder1Winner == null && feeder2Winner == null) {
            // Both feeders had both-absent → cascade absence to next round
            String updateSql = """
                    UPDATE Matches SET player1_score = 0, player2_score = 0,
                        result = 'none', winner_id = NULL, status = 'Completed'
                    WHERE match_id = ?
                    """;
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setInt(1, nextMatchId);
                ps.executeUpdate();
            }
            // Recurse in case further rounds are also affected
            checkByeInNextRound(conn, nextRoundId, nextBoard);

        } else if (feeder1Winner != null && feeder2Winner == null) {
            // Feeder1 winner advances by bye into player1 slot
            String updateSql = """
                    UPDATE Matches SET player1_id = ?,
                        player1_score = 1, player2_score = 0,
                        result = 'player1', winner_id = ?, status = 'Completed'
                    WHERE match_id = ?
                    """;
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setInt(1, feeder1Winner);
                ps.setInt(2, feeder1Winner);
                ps.setInt(3, nextMatchId);
                ps.executeUpdate();
            }
            propagateKoWinner(conn, nextRoundId, nextBoard, feeder1Winner);
            checkByeInNextRound(conn, nextRoundId, nextBoard);

        } else if (feeder1Winner == null && feeder2Winner != null) {
            // Feeder2 winner advances by bye into player2 slot
            String updateSql = """
                    UPDATE Matches SET player2_id = ?,
                        player1_score = 0, player2_score = 1,
                        result = 'player2', winner_id = ?, status = 'Completed'
                    WHERE match_id = ?
                    """;
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setInt(1, feeder2Winner);
                ps.setInt(2, feeder2Winner);
                ps.setInt(3, nextMatchId);
                ps.executeUpdate();
            }
            propagateKoWinner(conn, nextRoundId, nextBoard, feeder2Winner);
            checkByeInNextRound(conn, nextRoundId, nextBoard);
        }
        // else: both have winners → normal match, no auto-complete needed
    }

    /**
     * Kiểm tra trọng tài có được phân công trận này không (dùng cho authorize).
     */
    public Map<String, Object> getMatchForReferee(int matchId, int refereeId) {
        String sql = """
                SELECT m.match_id
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
                    return row;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Ghi điểm danh cho MỘT ván cụ thể (theo game_number, không phải toàn bộ trận).
     * Mỗi ván có 2 bản ghi Match_Attendance (trắng, đen).
     * Chỉ cho phép khi trọng tài được phân công trận này.
     * status: Present | Absent | Pending.
     */
    public boolean recordAttendanceForGame(
            int matchId,
            int gameNumber,
            int refereeId,
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

            // Tự động tạo mini_matches nếu chưa có
            ensureMiniMatchesExist(conn, matchId);

            Map<String, Object> miniInfo = getMiniMatchByMatchAndGame(matchId, gameNumber);
            if (miniInfo == null) return false;
            Integer miniMatchId = (Integer) miniInfo.get("miniMatchId");
            Integer whitePlayerId = (Integer) miniInfo.get("whitePlayerId");
            Integer blackPlayerId = (Integer) miniInfo.get("blackPlayerId");
            if (miniMatchId == null || whitePlayerId == null || blackPlayerId == null) return false;

            upsertOneAttendance(conn, miniMatchId, whitePlayerId, whiteStatus, refereeId);
            upsertOneAttendance(conn, miniMatchId, blackPlayerId, blackStatus, refereeId);
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    private Map<String, Object> getMiniMatchByMatchAndGame(int matchId, int gameNumber) {
        String sql = "SELECT mini_match_id, white_player_id, black_player_id FROM Mini_matches WHERE match_id = ? AND game_number = ? AND is_tiebreak = 0";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, matchId);
            ps.setInt(2, gameNumber);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("miniMatchId", rs.getObject("mini_match_id", Integer.class));
                    map.put("whitePlayerId", rs.getObject("white_player_id", Integer.class));
                    map.put("blackPlayerId", rs.getObject("black_player_id", Integer.class));
                    return map;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Tự động tạo Mini_matches (game 1 và game 2) cho trận nếu chưa có.
     * Game 1: white = player1_id, black = player2_id
     * Game 2: white = player2_id, black = player1_id (đổi màu)
     * Trả về false nếu không thể tạo (player IDs chưa được điền).
     */
    private boolean ensureMiniMatchesExist(Connection conn, int matchId) throws SQLException {
        String getPlayersSql = "SELECT player1_id, player2_id FROM Matches WHERE match_id = ?";
        Integer p1 = null, p2 = null;
        try (PreparedStatement ps = conn.prepareStatement(getPlayersSql)) {
            ps.setInt(1, matchId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    p1 = rs.getObject("player1_id", Integer.class);
                    p2 = rs.getObject("player2_id", Integer.class);
                }
            }
        }
        if (p1 == null || p2 == null) return false;

        String checkSql = "SELECT COUNT(*) FROM Mini_matches WHERE match_id = ? AND game_number = ? AND is_tiebreak = 0";
        String insertSql = "INSERT INTO Mini_matches (match_id, game_number, is_tiebreak, white_player_id, black_player_id, result, status) VALUES (?, ?, 0, ?, ?, '*', 'Scheduled')";

        for (int gameNum = 1; gameNum <= 2; gameNum++) {
            try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
                ps.setInt(1, matchId);
                ps.setInt(2, gameNum);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) continue; // đã tồn tại
                }
            }
            int white = (gameNum == 1) ? p1 : p2;
            int black = (gameNum == 1) ? p2 : p1;
            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                ps.setInt(1, matchId);
                ps.setInt(2, gameNum);
                ps.setInt(3, white);
                ps.setInt(4, black);
                ps.executeUpdate();
            }
        }
        return true;
    }

    private void upsertOneAttendance(Connection conn, int miniMatchId, int userId, String status, int recordedBy) throws SQLException {
        String updateSql = "UPDATE Match_Attendance SET status = ?, recorded_at = GETDATE(), recorded_by = ? WHERE mini_match_id = ? AND user_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
            ps.setString(1, status);
            ps.setInt(2, recordedBy);
            ps.setInt(3, miniMatchId);
            ps.setInt(4, userId);
            if (ps.executeUpdate() > 0) return;
        }
        String insertSql = "INSERT INTO Match_Attendance (mini_match_id, user_id, status, recorded_by) VALUES (?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
            ps.setInt(1, miniMatchId);
            ps.setInt(2, userId);
            ps.setString(3, status);
            ps.setInt(4, recordedBy);
            ps.executeUpdate();
        }
    }

    public boolean createTiebreakGame(int matchId, int refereeId) {
        Map<String, Object> match = getMatchForReferee(matchId, refereeId);
        if (match == null) return false;
        String checkSql = "SELECT COUNT(*) FROM Mini_matches WHERE match_id = ? AND is_tiebreak = 1";
        try (Connection conn = getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
                ps.setInt(1, matchId);
                ResultSet rs = ps.executeQuery();
                if (rs.next() && rs.getInt(1) > 0) return false; // already have
            }
            String playerSql = "SELECT white_player_id, black_player_id FROM Mini_matches WHERE match_id = ? AND game_number = 1 AND is_tiebreak = 0";
            Integer whiteId = null, blackId = null;
            try (PreparedStatement ps = conn.prepareStatement(playerSql)) {
                ps.setInt(1, matchId);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    whiteId = rs.getInt("white_player_id");
                    blackId = rs.getInt("black_player_id");
                }
            }
            if (whiteId == null || blackId == null) return false;
            String insertSql = "INSERT INTO Mini_matches (match_id, game_number, white_player_id, black_player_id, status, is_tiebreak) VALUES (?, 3, ?, ?, 'Scheduled', 1)";
            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                ps.setInt(1, matchId);
                ps.setInt(2, whiteId);
                ps.setInt(3, blackId);
                ps.executeUpdate();
            }
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}

