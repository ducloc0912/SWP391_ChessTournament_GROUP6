package com.example.DAO;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.model.dto.TournamentPlayerDTO;
import com.example.model.entity.Participant;
import com.example.model.enums.ParticipantStatus;
import com.example.util.DBContext;

public class ParticipantDAO extends DBContext {

    // Map ResultSet to Participant
    private Participant mapRow(ResultSet rs) throws SQLException {
        Participant p = new Participant();
        p.setParticipantId(rs.getInt("participant_id"));
        p.setTournamentId(rs.getInt("tournament_id"));
        p.setUserId(rs.getInt("user_id"));
        p.setTitleAtRegistration(rs.getString("title_at_registration"));
        p.setSeed((Integer) rs.getObject("seed"));
        String statusStr = rs.getString("status");
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                p.setStatus(ParticipantStatus.valueOf(statusStr.trim()));
            } catch (Exception ignored) { }
        }
        p.setIsPaid(rs.getBoolean("is_paid"));
        p.setPaymentDate(rs.getTimestamp("payment_date"));
        try {
            p.setPaymentExpiresAt(rs.getTimestamp("payment_expires_at"));
            p.setRemovedAt(rs.getTimestamp("removed_at"));
        } catch (SQLException ignored) {}
        p.setRegistrationDate(rs.getTimestamp("registration_date"));
        p.setNotes(rs.getString("notes"));
        return p;
    }

    // 1) GET by ID
    public Participant getParticipantById(int participantId) {
        String sql = "SELECT * FROM Participants WHERE participant_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, participantId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapRow(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // 2) GET by Tournament ID
    public List<Participant> getParticipantsByTournamentId(int tournamentId) {
        List<Participant> list = new ArrayList<>();
        String sql = "SELECT * FROM Participants WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 3) GET by User ID
    public List<Participant> getParticipantsByUserId(int userId) {
        List<Participant> list = new ArrayList<>();
        String sql = "SELECT * FROM Participants WHERE user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 4) CREATE
    public boolean createParticipant(Participant p) {
        return createParticipantInternal(p, null) != null;
    }

    /** Tạo Participant, trả về participant_id. Hỗ trợ payment_expires_at (giải có phí, thanh toán trong 1h). */
    public Integer createParticipantAndReturnId(Participant p) {
        return createParticipantInternal(p, p.getPaymentExpiresAt());
    }

    private Integer createParticipantInternal(Participant p, Timestamp paymentExpiresAt) {
        Integer id = createParticipantFull(p, paymentExpiresAt);
        if (id != null) return id;
        // Fallback: bảng cũ không có payment_expires_at -> INSERT không có cột đó
        String msg = lastSqlException != null ? lastSqlException.getMessage() : "";
        if (msg != null && (msg.contains("payment_expires_at") || msg.contains("Invalid column name") || msg.contains("removed_at"))) {
            return createParticipantLegacy(p);
        }
        // Fallback: DB chưa chạy migration PendingPayment (CHECK constraint) -> thử với status Active để tránh 500
        if (msg != null && (msg.contains("CHECK") || msg.contains("constraint") || msg.contains("PendingPayment") || msg.contains("CK_") || msg.contains("violation"))) {
            Participant pFallback = new Participant();
            pFallback.setTournamentId(p.getTournamentId());
            pFallback.setUserId(p.getUserId());
            pFallback.setTitleAtRegistration(p.getTitleAtRegistration());
            pFallback.setSeed(p.getSeed());
            pFallback.setStatus(ParticipantStatus.Active);
            pFallback.setIsPaid(p.getIsPaid());
            pFallback.setPaymentDate(p.getPaymentDate());
            pFallback.setNotes(p.getNotes());
            return createParticipantFull(pFallback, paymentExpiresAt);
        }
        return null;
    }

    private SQLException lastSqlException;

    /** INSERT đầy đủ (có payment_expires_at). */
    private Integer createParticipantFull(Participant p, Timestamp paymentExpiresAt) {
        lastSqlException = null;
        String sql = """
            INSERT INTO Participants
            (tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, payment_expires_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, p.getTournamentId());
            ps.setInt(2, p.getUserId());
            ps.setString(3, p.getTitleAtRegistration());
            if (p.getSeed() != null) ps.setInt(4, p.getSeed()); else ps.setNull(4, Types.INTEGER);
            ps.setString(5, p.getStatus() != null ? p.getStatus().name() : "Active");
            ps.setBoolean(6, p.getIsPaid() != null && p.getIsPaid());
            ps.setTimestamp(7, p.getPaymentDate());
            if (paymentExpiresAt != null) ps.setTimestamp(8, paymentExpiresAt); else ps.setNull(8, Types.TIMESTAMP);
            ps.setString(9, p.getNotes());
            if (ps.executeUpdate() <= 0) return null;
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (SQLException e) {
            lastSqlException = e;
            e.printStackTrace();
        }
        return null;
    }

    /** INSERT không có payment_expires_at (schema cũ). */
    private Integer createParticipantLegacy(Participant p) {
        String sql = """
            INSERT INTO Participants
            (tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, p.getTournamentId());
            ps.setInt(2, p.getUserId());
            ps.setString(3, p.getTitleAtRegistration());
            if (p.getSeed() != null) ps.setInt(4, p.getSeed()); else ps.setNull(4, Types.INTEGER);
            ps.setString(5, p.getStatus() != null ? p.getStatus().name() : "Active");
            ps.setBoolean(6, p.getIsPaid() != null && p.getIsPaid());
            ps.setTimestamp(7, p.getPaymentDate());
            ps.setString(8, p.getNotes());
            if (ps.executeUpdate() <= 0) return null;
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /** Hết hạn các Participant chưa thanh toán (payment_expires_at < now) -> status = Withdrawn, removed_at = now */
    public int expireUnpaidParticipants() {
        String sql = """
            UPDATE Participants SET status = 'Withdrawn', removed_at = GETDATE()
            WHERE is_paid = 0 AND payment_expires_at IS NOT NULL AND payment_expires_at < GETDATE()
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    /** User bị khóa 2h do hết hạn thanh toán lần trước hoặc tự hủy (Participant status=Withdrawn, removed_at trong 2h) */
    public boolean isBlockedByUnpaidExpiry(int tournamentId, int userId) {
        String sql = """
            SELECT 1 FROM Participants
            WHERE tournament_id = ? AND user_id = ? AND status = 'Withdrawn'
              AND removed_at IS NOT NULL AND removed_at > DATEADD(hour, -2, GETDATE())
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setInt(2, userId);
            return ps.executeQuery().next();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /** Có Participant đang Active (chưa bị withdraw) */
    public boolean existsActiveByTournamentAndUser(int tournamentId, int userId) {
        String sql = "SELECT 1 FROM Participants WHERE tournament_id = ? AND user_id = ? AND status = 'Active'";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setInt(2, userId);
            return ps.executeQuery().next();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 5) UPDATE
    public boolean updateParticipant(Participant p) {
        String sql = """
            UPDATE Participants SET
                title_at_registration = ?, seed = ?, status = ?, is_paid = ?, payment_date = ?,
                payment_expires_at = ?, removed_at = ?, notes = ?
            WHERE participant_id = ?
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, p.getTitleAtRegistration());
            if (p.getSeed() != null) {
                ps.setInt(2, p.getSeed());
            } else {
                ps.setNull(2, Types.INTEGER);
            }
            ps.setString(3, p.getStatus() != null ? p.getStatus().name() : null);
            ps.setBoolean(4, p.getIsPaid() != null && p.getIsPaid());
            ps.setTimestamp(5, p.getPaymentDate());
            ps.setTimestamp(6, p.getPaymentExpiresAt());
            ps.setTimestamp(7, p.getRemovedAt());
            ps.setString(8, p.getNotes());
            ps.setInt(9, p.getParticipantId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 6) DELETE
    public boolean deleteParticipant(int participantId) {
        String sql = "DELETE FROM Participants WHERE participant_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, participantId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 6b) GET players with user info (JOIN)
    public List<TournamentPlayerDTO> getPlayersWithUserInfo(int tournamentId) {
        List<TournamentPlayerDTO> list = new ArrayList<>();
        String sql = """
            SELECT p.participant_id, p.user_id, u.first_name, u.last_name,
                   u.email, u.avatar, u.rank,
                   p.status, p.registration_date, p.is_paid, p.seed, p.title_at_registration,
                   p.group_id
            FROM Participants p
            JOIN Users u ON p.user_id = u.user_id
            WHERE p.tournament_id = ?
            ORDER BY p.registration_date
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                TournamentPlayerDTO dto = new TournamentPlayerDTO();
                dto.setParticipantId(rs.getInt("participant_id"));
                dto.setUserId(rs.getInt("user_id"));
                dto.setFirstName(rs.getString("first_name"));
                dto.setLastName(rs.getString("last_name"));
                dto.setEmail(rs.getString("email"));
                dto.setAvatar(rs.getString("avatar"));
                dto.setRank((Integer) rs.getObject("rank"));
                dto.setStatus(rs.getString("status"));
                dto.setRegistrationDate(rs.getTimestamp("registration_date"));
                dto.setIsPaid(rs.getBoolean("is_paid"));
                dto.setSeed((Integer) rs.getObject("seed"));
                dto.setTitleAtRegistration(rs.getString("title_at_registration"));
                try { dto.setGroupId((Integer) rs.getObject("group_id")); } catch (SQLException ignored) {}
                list.add(dto);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /** Participants chưa thanh toán (is_paid=0, còn trong hạn payment_expires_at), có thông tin user. */
    public List<TournamentPlayerDTO> getUnpaidPlayersWithUserInfo(int tournamentId) {
        List<TournamentPlayerDTO> list = new ArrayList<>();
        String sql = """
            SELECT p.participant_id, p.user_id, u.first_name, u.last_name,
                   u.email, u.avatar, u.rank,
                   p.status, p.registration_date, p.is_paid, p.seed, p.title_at_registration
            FROM Participants p
            JOIN Users u ON p.user_id = u.user_id
            WHERE p.tournament_id = ? AND p.is_paid = 0 AND (p.status IS NULL OR p.status = 'Active')
              AND (p.payment_expires_at IS NULL OR p.payment_expires_at > GETDATE())
            ORDER BY p.registration_date
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                TournamentPlayerDTO dto = new TournamentPlayerDTO();
                dto.setParticipantId(rs.getInt("participant_id"));
                dto.setUserId(rs.getInt("user_id"));
                dto.setFirstName(rs.getString("first_name"));
                dto.setLastName(rs.getString("last_name"));
                dto.setEmail(rs.getString("email"));
                dto.setAvatar(rs.getString("avatar"));
                dto.setRank((Integer) rs.getObject("rank"));
                dto.setStatus(rs.getString("status"));
                dto.setRegistrationDate(rs.getTimestamp("registration_date"));
                dto.setIsPaid(rs.getBoolean("is_paid"));
                dto.setSeed((Integer) rs.getObject("seed"));
                dto.setTitleAtRegistration(rs.getString("title_at_registration"));
                list.add(dto);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /** Lấy participant theo tournament và user. */
    public Participant getByTournamentAndUser(int tournamentId, int userId) {
        String sql = "SELECT * FROM Participants WHERE tournament_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setInt(2, userId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapRow(rs);
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /** Danh sách Participant chưa thanh toán của một user (để hiển thị "đăng ký chờ thanh toán"). */
    public List<Participant> getUnpaidParticipantsByUserId(int userId) {
        List<Participant> list = new ArrayList<>();
        String sql = """
            SELECT * FROM Participants
            WHERE user_id = ? AND is_paid = 0 AND (status IS NULL OR status = 'Active')
              AND (payment_expires_at IS NULL OR payment_expires_at > GETDATE())
            ORDER BY registration_date DESC
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /** Unpaid participants của user kèm thông tin giải (tournamentName, format, location) cho trang "Đăng ký chờ thanh toán". */
    public List<Map<String, Object>> getUnpaidWithTournamentInfoByUserId(int userId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT p.participant_id, p.tournament_id, p.title_at_registration, p.registration_date, p.is_paid, p.status,
                   t.tournament_name, t.format, t.location
            FROM Participants p
            JOIN Tournaments t ON p.tournament_id = t.tournament_id
            WHERE p.user_id = ? AND p.is_paid = 0 AND (p.status IS NULL OR p.status = 'Active')
              AND (p.payment_expires_at IS NULL OR p.payment_expires_at > GETDATE())
            ORDER BY p.registration_date DESC
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                row.put("participantId", rs.getInt("participant_id"));
                row.put("tournamentId", rs.getInt("tournament_id"));
                row.put("titleAtRegistration", rs.getString("title_at_registration"));
                row.put("registrationDate", rs.getTimestamp("registration_date"));
                row.put("isPaid", rs.getBoolean("is_paid"));
                row.put("status", rs.getString("status"));
                row.put("tournamentName", rs.getString("tournament_name"));
                row.put("format", rs.getString("format"));
                row.put("location", rs.getString("location"));
                list.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Các đăng ký còn hiệu lực của một user (giải chưa kết thúc), kèm thông tin giải.
     * Dùng cho màn "Giải đang đăng ký" của người chơi.
     */
    public List<Map<String, Object>> getActiveWithTournamentInfoByUserId(int userId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT p.participant_id,
                   p.tournament_id,
                   p.title_at_registration,
                   p.registration_date,
                   p.is_paid,
                   p.status,
                   t.tournament_name,
                   t.format,
                   t.location,
                   t.status AS tournament_status,
                   t.entry_fee
            FROM Participants p
            JOIN Tournaments t ON p.tournament_id = t.tournament_id
            WHERE p.user_id = ?
              AND (p.status IS NULL OR p.status = 'Active')
              AND t.status IN ('Pending', 'Upcoming', 'Ongoing')
            ORDER BY p.registration_date DESC
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                row.put("participantId", rs.getInt("participant_id"));
                row.put("tournamentId", rs.getInt("tournament_id"));
                row.put("titleAtRegistration", rs.getString("title_at_registration"));
                row.put("registrationDate", rs.getTimestamp("registration_date"));
                row.put("isPaid", rs.getBoolean("is_paid"));
                row.put("status", rs.getString("status"));
                row.put("tournamentName", rs.getString("tournament_name"));
                row.put("format", rs.getString("format"));
                row.put("location", rs.getString("location"));
                row.put("tournamentStatus", rs.getString("tournament_status"));
                row.put("entryFee", rs.getBigDecimal("entry_fee"));
                list.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /** Tồn tại participant (tournament_id, user_id) */
    public boolean existsByTournamentAndUser(int tournamentId, int userId) {
        String sql = "SELECT 1 FROM Participants WHERE tournament_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ps.setInt(2, userId);
            return ps.executeQuery().next();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Đếm số người tham gia đã xác nhận: giải miễn phí = Active; giải có phí = Active và đã thanh toán (is_paid=1).
     */
    public int countParticipantsByTournament(int tournamentId) {
        String sql = """
            SELECT COUNT(*) AS total FROM Participants p
            INNER JOIN Tournaments t ON p.tournament_id = t.tournament_id
            WHERE p.tournament_id = ? AND (p.status IS NULL OR p.status = 'Active')
            AND (t.entry_fee IS NULL OR t.entry_fee <= 0 OR p.is_paid = 1)
            """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getInt("total");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }
}