package com.example.DAO;

import com.example.model.entity.WaitingList;
import com.example.util.DBContext;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class WaitingListDAO extends DBContext {
    public static final String APPROVE_OK = "OK";
    public static final String APPROVE_NOT_FOUND = "NOT_FOUND";
    public static final String APPROVE_ALREADY_APPROVED = "ALREADY_APPROVED";

    public boolean hasWaitingListTable() {
        try (Connection conn = getConnection()) {
            if (conn == null) return false;
            List<String> cols = getTableColumns(conn, "Waiting_List");
            return !cols.isEmpty();
        } catch (Exception ex) {
            return false;
        }
    }
    public static final String APPROVE_FAILED = "FAILED";

    private WaitingList mapRow(ResultSet rs) throws SQLException {
        Set<String> cols = getResultSetColumns(rs);
        WaitingList e = new WaitingList();
        e.setWaitingId(getIntNullable(rs, cols, "waiting_id"));
        e.setTournamentId(getIntNullable(rs, cols, "tournament_id"));
        e.setUserId(getIntNullable(rs, cols, "user_id"));
        e.setRankAtRegistration(getIntNullableByNames(rs, cols, "rank_at_registration", "rank"));
        e.setStatus(getStringNullable(rs, cols, "status"));
        e.setNote(getStringNullable(rs, cols, "note"));
        e.setApprovedBy(getIntNullable(rs, cols, "approved_by"));
        e.setApprovedAt(getTimestampNullable(rs, cols, "approved_at"));
        e.setRegistrationDate(getTimestampNullable(rs, cols, "registration_date"));
        e.setRegistrationFullName(getStringNullableByNames(rs, cols, "registration_full_name", "full_name"));
        e.setRegistrationUsername(getStringNullableByNames(rs, cols, "registration_username", "username"));
        e.setRegistrationEmail(getStringNullableByNames(rs, cols, "registration_email", "email"));
        e.setRegistrationPhone(getStringNullableByNames(rs, cols, "registration_phone", "phone"));
        return e;
    }

    public List<WaitingList> getByTournamentId(int tournamentId) {
        List<WaitingList> list = new ArrayList<>();
        String sql = "SELECT * FROM Waiting_List WHERE tournament_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tournamentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Map<String, Object>> getPendingByUserId(int userId) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = """
            SELECT wl.waiting_id,
                   wl.tournament_id,
                   wl.rank_at_registration,
                   wl.status,
                   wl.note,
                   wl.registration_date,
                   t.tournament_name,
                   t.format,
                   t.location
            FROM Waiting_List wl
            INNER JOIN Tournaments t ON t.tournament_id = wl.tournament_id
            WHERE wl.user_id = ?
              AND LOWER(ISNULL(wl.status, '')) = 'pending'
            ORDER BY wl.registration_date DESC
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                row.put("waitingId", rs.getInt("waiting_id"));
                row.put("tournamentId", rs.getInt("tournament_id"));
                row.put("tournamentName", rs.getString("tournament_name"));
                row.put("format", rs.getString("format"));
                row.put("location", rs.getString("location"));
                row.put("registrationDate", rs.getTimestamp("registration_date"));
                row.put("rankAtRegistration", rs.getObject("rank_at_registration"));
                row.put("status", rs.getString("status"));
                row.put("note", rs.getString("note"));
                list.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public WaitingList getById(int waitingId) {
        String sql = "SELECT * FROM Waiting_List WHERE waiting_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, waitingId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapRow(rs);
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean exists(int tournamentId, int userId) {
        String sql = "SELECT 1 FROM Waiting_List WHERE tournament_id = ? AND user_id = ?";
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

    public boolean create(WaitingList e) {
        try (Connection conn = getConnection()) {
            List<String> availableColumns = getTableColumns(conn, "Waiting_List");
            if (availableColumns.isEmpty()) {
                return false;
            }

            List<String> insertColumns = new ArrayList<>();
            List<Object> values = new ArrayList<>();

            // Required keys for all known schemas
            if (hasColumn(availableColumns, "tournament_id")) {
                insertColumns.add("tournament_id");
                values.add(e.getTournamentId());
            }
            if (hasColumn(availableColumns, "user_id")) {
                insertColumns.add("user_id");
                values.add(e.getUserId());
            }

            // Backward/forward compatible optional fields
            if (hasColumn(availableColumns, "rank_at_registration")) {
                insertColumns.add("rank_at_registration");
                values.add(e.getRankAtRegistration());
            } else if (hasColumn(availableColumns, "rank")) {
                insertColumns.add("rank");
                values.add(e.getRankAtRegistration());
            }
            if (hasColumn(availableColumns, "status")) {
                insertColumns.add("status");
                values.add(e.getStatus() == null ? "Pending" : e.getStatus());
            }
            if (hasColumn(availableColumns, "note")) {
                insertColumns.add("note");
                values.add(e.getNote());
            } else if (hasColumn(availableColumns, "notes")) {
                insertColumns.add("notes");
                values.add(e.getNote());
            }
            if (hasColumn(availableColumns, "registration_full_name")) {
                insertColumns.add("registration_full_name");
                values.add(e.getRegistrationFullName());
            }
            if (hasColumn(availableColumns, "registration_username")) {
                insertColumns.add("registration_username");
                values.add(e.getRegistrationUsername());
            }
            if (hasColumn(availableColumns, "registration_email")) {
                insertColumns.add("registration_email");
                values.add(e.getRegistrationEmail());
            }
            if (hasColumn(availableColumns, "registration_phone")) {
                insertColumns.add("registration_phone");
                values.add(e.getRegistrationPhone());
            }
            // Legacy schema support
            if (hasColumn(availableColumns, "full_name")) {
                insertColumns.add("full_name");
                values.add(e.getRegistrationFullName());
            }
            if (hasColumn(availableColumns, "username")) {
                insertColumns.add("username");
                values.add(e.getRegistrationUsername());
            }
            if (hasColumn(availableColumns, "email")) {
                insertColumns.add("email");
                values.add(e.getRegistrationEmail());
            }
            if (hasColumn(availableColumns, "phone")) {
                insertColumns.add("phone");
                values.add(e.getRegistrationPhone());
            }

            if (insertColumns.size() < 2) {
                return false;
            }

            StringBuilder sql = new StringBuilder("INSERT INTO Waiting_List (");
            sql.append(String.join(", ", insertColumns));
            sql.append(") VALUES (");
            for (int i = 0; i < insertColumns.size(); i++) {
                if (i > 0) sql.append(", ");
                sql.append("?");
            }
            sql.append(")");

            try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                for (int i = 0; i < values.size(); i++) {
                    Object value = values.get(i);
                    if (value == null) {
                        ps.setObject(i + 1, null);
                    } else if (value instanceof Integer v) {
                        ps.setInt(i + 1, v);
                    } else {
                        ps.setObject(i + 1, value);
                    }
                }
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    private boolean hasColumn(List<String> columns, String target) {
        for (String c : columns) {
            if (target.equalsIgnoreCase(c)) return true;
        }
        return false;
    }

    private List<String> getTableColumns(Connection conn, String tableName) throws SQLException {
        List<String> columns = new ArrayList<>();
        String sql = """
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = ?
        """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, tableName);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    columns.add(rs.getString("COLUMN_NAME"));
                }
            }
        }
        return columns;
    }

    private Set<String> getResultSetColumns(ResultSet rs) throws SQLException {
        Set<String> cols = new HashSet<>();
        ResultSetMetaData md = rs.getMetaData();
        for (int i = 1; i <= md.getColumnCount(); i++) {
            cols.add(md.getColumnLabel(i).toLowerCase());
        }
        return cols;
    }

    private Integer getIntNullable(ResultSet rs, Set<String> cols, String col) throws SQLException {
        if (!cols.contains(col.toLowerCase())) return null;
        Object value = rs.getObject(col);
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ex) {
            return null;
        }
    }

    private Integer getIntNullableByNames(ResultSet rs, Set<String> cols, String... names) throws SQLException {
        for (String n : names) {
            Integer v = getIntNullable(rs, cols, n);
            if (v != null) return v;
        }
        return null;
    }

    private String getStringNullable(ResultSet rs, Set<String> cols, String col) throws SQLException {
        if (!cols.contains(col.toLowerCase())) return null;
        return rs.getString(col);
    }

    private String getStringNullableByNames(ResultSet rs, Set<String> cols, String... names) throws SQLException {
        for (String n : names) {
            String v = getStringNullable(rs, cols, n);
            if (v != null) return v;
        }
        return null;
    }

    private Timestamp getTimestampNullable(ResultSet rs, Set<String> cols, String col) throws SQLException {
        if (!cols.contains(col.toLowerCase())) return null;
        return rs.getTimestamp(col);
    }

    // only owner can update own row
    public boolean updateOwnRegistration(WaitingList e, int currentUserId) {
        String sql = """
            UPDATE Waiting_List
            SET registration_full_name = ?,
                registration_username = ?,
                registration_email = ?,
                registration_phone = ?,
                rank_at_registration = ?,
                note = ?
            WHERE waiting_id = ? AND user_id = ?
        """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, e.getRegistrationFullName());
            ps.setString(2, e.getRegistrationUsername());
            ps.setString(3, e.getRegistrationEmail());
            ps.setString(4, e.getRegistrationPhone());
            if (e.getRankAtRegistration() == null) {
                ps.setNull(5, Types.INTEGER);
            } else {
                ps.setInt(5, e.getRankAtRegistration());
            }
            ps.setString(6, e.getNote());
            ps.setInt(7, e.getWaitingId());
            ps.setInt(8, currentUserId);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    public boolean deleteOwnRegistration(int waitingId, int currentUserId) {
        String sql = "DELETE FROM Waiting_List WHERE waiting_id = ? AND user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, waitingId);
            ps.setInt(2, currentUserId);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    public boolean deleteById(int waitingId) {
        String sql = "DELETE FROM Waiting_List WHERE waiting_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, waitingId);
            return ps.executeUpdate() > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    public String approveAndAddParticipant(int waitingId, int approvedByUserId) {
        String getWaitingSql = """
            SELECT waiting_id, tournament_id, user_id, status, note
            FROM Waiting_List
            WHERE waiting_id = ?
        """;
        String existsParticipantSql = """
            SELECT 1 FROM Participants
            WHERE tournament_id = ? AND user_id = ?
        """;
        String insertParticipantSql = """
            INSERT INTO Participants
            (tournament_id, user_id, title_at_registration, seed, status, is_paid, payment_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """;
        String approveWaitingSql = """
            UPDATE Waiting_List
            SET status = 'Approved',
                approved_by = ?,
                approved_at = GETDATE()
            WHERE waiting_id = ?
        """;

        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);
            try {
                int tournamentId;
                int userId;
                String waitingStatus;
                String note;

                try (PreparedStatement ps = conn.prepareStatement(getWaitingSql)) {
                    ps.setInt(1, waitingId);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) {
                        conn.rollback();
                        return APPROVE_NOT_FOUND;
                    }
                    tournamentId = rs.getInt("tournament_id");
                    userId = rs.getInt("user_id");
                    waitingStatus = rs.getString("status");
                    note = rs.getString("note");
                }

                if ("Approved".equalsIgnoreCase(waitingStatus)) {
                    conn.rollback();
                    return APPROVE_ALREADY_APPROVED;
                }

                boolean participantExists;
                try (PreparedStatement ps = conn.prepareStatement(existsParticipantSql)) {
                    ps.setInt(1, tournamentId);
                    ps.setInt(2, userId);
                    participantExists = ps.executeQuery().next();
                }

                if (!participantExists) {
                    try (PreparedStatement ps = conn.prepareStatement(insertParticipantSql)) {
                        ps.setInt(1, tournamentId);
                        ps.setInt(2, userId);
                        ps.setNull(3, Types.NVARCHAR); // title_at_registration
                        ps.setNull(4, Types.INTEGER);  // seed
                        ps.setString(5, "Active");
                        ps.setBoolean(6, false);
                        ps.setNull(7, Types.TIMESTAMP); // payment_date
                        ps.setString(8, note);
                        if (ps.executeUpdate() <= 0) {
                            conn.rollback();
                            return APPROVE_FAILED;
                        }
                    }
                }

                try (PreparedStatement ps = conn.prepareStatement(approveWaitingSql)) {
                    ps.setInt(1, approvedByUserId);
                    ps.setInt(2, waitingId);
                    if (ps.executeUpdate() <= 0) {
                        conn.rollback();
                        return APPROVE_FAILED;
                    }
                }

                conn.commit();
                return APPROVE_OK;
            } catch (SQLException ex) {
                conn.rollback();
                ex.printStackTrace();
                return APPROVE_FAILED;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException ex) {
            ex.printStackTrace();
            return APPROVE_FAILED;
        }
    }

}