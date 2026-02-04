package com.example.DAO;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.model.User;
import com.example.model.UserRole;
import com.example.util.DBContext;

public class UserDAO extends DBContext {

    public boolean insert(User user) {

        String sql = """
            INSERT INTO Users
            (first_name, last_name, username, phone_number, email, address, password)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """;

        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, user.getFirstName());
            ps.setString(2, user.getLastName());
            ps.setString(3, user.getUsername());
            ps.setString(4, user.getPhoneNumber());
            ps.setString(5, user.getEmail());
            ps.setString(6, user.getAddress());
            ps.setString(7, user.getPassword());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    /* =========================
       CHECK EXISTS
       ========================= */
    public boolean isEmailExists(String email) {
        String sql = "SELECT 1 FROM Users WHERE email = ?";
        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email.trim());
            return ps.executeQuery().next();

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean isPhoneExists(String phone) {
        String sql = "SELECT 1 FROM Users WHERE phone_number = ?";
        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, phone);
            return ps.executeQuery().next();

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean isUsernameExists(String username) {
        String sql = "SELECT 1 FROM Users WHERE username = ?";
        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, username);
            return ps.executeQuery().next();

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public User findByEmail(String email) {

        String sql = """
            SELECT user_id, first_name, last_name, username,
                   phone_number, email, address, password, is_active
            FROM Users
            WHERE email = ?
        """;

        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                User user = new User();

                user.setUserId(rs.getInt("user_id"));
                user.setFirstName(rs.getString("first_name"));
                user.setLastName(rs.getString("last_name"));
                user.setUsername(rs.getString("username"));
                user.setPhoneNumber(rs.getString("phone_number"));
                user.setEmail(rs.getString("email"));
                user.setAddress(rs.getString("address"));
                user.setPassword(rs.getString("password"));
                user.setActive(rs.getBoolean("is_active"));

                return user;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean updatePassword(String email, String hashedPassword) {

        String sql = """
            UPDATE Users
            SET password = ?
            WHERE email = ? AND is_active = 1
        """;

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, hashedPassword);
            ps.setString(2, email);
            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public int getUserIdByEmail(String email) {

        String sql = "SELECT user_id FROM Users WHERE email = ?";

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt("user_id");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1;
    }

    public boolean assignRole(int userId, int roleId) {

        String sql = """
            INSERT INTO User_Role (user_id, role_id)
            VALUES (?, ?)
        """;

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, userId);
            ps.setInt(2, roleId);
            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public int getRoleIdByName(String roleName) {

        String sql = "SELECT role_id FROM Roles WHERE role_name = ?";

        try (Connection conn = DBContext.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, roleName);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt("role_id");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1;
    }
public UserRole findUserWithRole(String email, String password) {
    String sql = """
        SELECT u.user_id,
               u.username,
               u.email,
               u.last_login,
               u.is_active,
               u.avatar,
               r.role_name
        FROM Users u
        JOIN User_Role ur ON u.user_id = ur.user_id
        JOIN Roles r ON ur.role_id = r.role_id
        WHERE u.email = ? AND u.password = ?
    """;

    try (Connection con = DBContext.getConnection();
         PreparedStatement ps = con.prepareStatement(sql)) {

        ps.setString(1, email);
        ps.setString(2, password);

        ResultSet rs = ps.executeQuery();
        if (rs.next()) {
            return new UserRole(
                rs.getInt("user_id"),
                rs.getString("username"),
                rs.getString("email"),
                rs.getTimestamp("last_login"),
                rs.getBoolean("is_active"),
                rs.getString("avatar"),
                rs.getString("role_name")
            );
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
    return null;
}

// Hàm của Hien
private User mapRow(ResultSet rs) throws SQLException {
        User u = new User();

        u.setUserId(rs.getInt("user_id"));

        // birthday (DATE) -> java.util.Date
        java.sql.Date bd = rs.getDate("birthday");
        u.setBirthday(bd != null ? new java.util.Date(bd.getTime()) : null);

        u.setUsername(rs.getString("username"));
        u.setFirstName(rs.getString("first_name"));
        u.setLastName(rs.getString("last_name"));
        u.setEmail(rs.getString("email"));
        u.setPhoneNumber(rs.getString("phone_number"));
        u.setAddress(rs.getString("address"));

        // last_login (DATETIME) -> java.util.Date
        Timestamp lastLoginTs = rs.getTimestamp("last_login");
        u.setLastLogin(lastLoginTs != null ? new java.util.Date(lastLoginTs.getTime()) : null);

        // create_at (DATETIME) -> java.util.Date
        Timestamp createdAtTs = rs.getTimestamp("create_at");
        u.setCreatedAt(createdAtTs != null ? new java.util.Date(createdAtTs.getTime()) : null);

        u.setActive(rs.getBoolean("is_active"));
        u.setPassword(rs.getString("password"));
        u.setAvatar(rs.getString("avatar"));

        BigDecimal bal = rs.getBigDecimal("balance");
        u.setBalance(bal != null ? bal : BigDecimal.ZERO);

        Object rankObj = rs.getObject("rank");
        if (rankObj == null) u.setRank(null);
        else if (rankObj instanceof Number) u.setRank(((Number) rankObj).intValue());
        else {
            try {
                u.setRank(Integer.parseInt(rankObj.toString()));
            } catch (NumberFormatException ex) {
                u.setRank(null);
            }
        }
        return u;
    }

    public User getUserById(int userId) {
        String sql =
                "SELECT birthday, username, user_id, first_name, last_name, email, phone_number, address, " +
                "       last_login, create_at, is_active, password, avatar, balance, rank " +
                "FROM Users WHERE user_id = ?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public User getUserByEmail(String email) {
        String sql =
                "SELECT birthday, username, user_id, first_name, last_name, email, phone_number, address, " +
                "       last_login, create_at, is_active, password, avatar, balance, rank " +
                "FROM Users WHERE email = ?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        } catch (SQLException e) {
e.printStackTrace();
        }
        return null;
    }

    public User getUserByUsername(String username) {
        String sql =
                "SELECT birthday, username, user_id, first_name, last_name, email, phone_number, address, " +
                "       last_login, create_at, is_active, password, avatar, balance, rank " +
                "FROM Users WHERE username = ?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
    public List<UserRole> getUsersForAdmin(String q, String roleKeyOrName) {
        List<UserRole> list = new ArrayList<>();

        String qVal = (q == null) ? "" : q.trim();
        String roleVal = normalizeRoleName(roleKeyOrName);

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT u.user_id, u.username, u.email, u.last_login, u.is_active, u.avatar, ");
        sql.append("       r.role_name ");
        sql.append("FROM Users u ");
        sql.append("LEFT JOIN User_Role ur ON u.user_id = ur.user_id ");
        sql.append("LEFT JOIN Roles r ON ur.role_id = r.role_id ");
        sql.append("WHERE 1=1 ");

        List<Object> params = new ArrayList<>();

        if (!qVal.isEmpty()) {
            sql.append(" AND (u.username LIKE ? OR u.email LIKE ?) ");
            String like = "%" + qVal + "%";
            params.add(like);
            params.add(like);
        }

        if (roleVal != null && !roleVal.equalsIgnoreCase("all")) {
            sql.append(" AND LOWER(r.role_name) = LOWER(?) ");
            params.add(roleVal);
        }

        sql.append("ORDER BY u.user_id DESC");

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    UserRole urObj = new UserRole();
urObj.setUserId(rs.getInt("user_id"));
                    urObj.setUsername(rs.getString("username"));
                    urObj.setEmail(rs.getString("email"));

                    // last_login -> Timestamp (giữ nguyên như bạn đang dùng)
                    urObj.setLastLogin(rs.getTimestamp("last_login"));

                    // ✅ JSON key isActive (tuỳ theo UserRole của bạn)
                    urObj.setIsActive(rs.getBoolean("is_active"));

                    urObj.setAvatar(rs.getString("avatar"));
                    urObj.setRoleName(rs.getString("role_name"));
                    list.add(urObj);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return list;
    }

    private String normalizeRoleName(String roleKeyOrName) {
        if (roleKeyOrName == null) return "all";
        String k = roleKeyOrName.trim();
        if (k.isEmpty() || k.equalsIgnoreCase("all")) return "all";

        switch (k.toLowerCase()) {
            case "admin":
                return "Admin";
            case "staff":
                return "Staff";
            case "tournamentleader":
            case "tournament_leader":
            case "leader":
                return "TournamentLeader";
            case "referee":
                return "Referee";
            case "player":
                return "Player";
            default:
                return k;
        }
    }

    public boolean insertUser(User u) {
        String sql =
                "INSERT INTO Users " +
                "(birthday, username, user_id, first_name, last_name, email, phone_number, address, " +
                " last_login, create_at, is_active, password, avatar, balance, rank) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            // birthday: java.util.Date -> java.sql.Date
            if (u.getBirthday() != null) ps.setDate(1, new java.sql.Date(u.getBirthday().getTime()));
            else ps.setNull(1, Types.DATE);

            ps.setString(2, u.getUsername());
            ps.setInt(3, u.getUserId());

            ps.setString(4, u.getFirstName());
            ps.setString(5, u.getLastName());
            ps.setString(6, u.getEmail());
            ps.setString(7, u.getPhoneNumber());
            ps.setString(8, u.getAddress());

            // last_login: java.util.Date -> Timestamp
            if (u.getLastLogin() != null) ps.setTimestamp(9, new Timestamp(u.getLastLogin().getTime()));
            else ps.setNull(9, Types.TIMESTAMP);

            // create_at: nếu null thì lấy now
            java.util.Date createdAt = (u.getCreatedAt() != null) ? u.getCreatedAt() : new java.util.Date();
            ps.setTimestamp(10, new Timestamp(createdAt.getTime()));

            ps.setBoolean(11, u.isActive());
            ps.setString(12, u.getPassword());
ps.setString(13, u.getAvatar());

            BigDecimal bal = (u.getBalance() != null) ? u.getBalance() : BigDecimal.ZERO;
            ps.setBigDecimal(14, bal);

            if (u.getRank() == null) ps.setNull(15, Types.INTEGER);
            else ps.setInt(15, u.getRank());

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateUser(User u) {
        String sql =
                "UPDATE Users SET " +
                "birthday=?, username=?, first_name=?, last_name=?, email=?, phone_number=?, address=?, " +
                "last_login=?, is_active=?, password=?, avatar=?, balance=?, rank=? " +
                "WHERE user_id=?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            if (u.getBirthday() != null) ps.setDate(1, new java.sql.Date(u.getBirthday().getTime()));
            else ps.setNull(1, Types.DATE);

            ps.setString(2, u.getUsername());
            ps.setString(3, u.getFirstName());
            ps.setString(4, u.getLastName());
            ps.setString(5, u.getEmail());
            ps.setString(6, u.getPhoneNumber());
            ps.setString(7, u.getAddress());

            if (u.getLastLogin() != null) ps.setTimestamp(8, new Timestamp(u.getLastLogin().getTime()));
            else ps.setNull(8, Types.TIMESTAMP);

            ps.setBoolean(9, u.isActive());
            ps.setString(10, u.getPassword());
            ps.setString(11, u.getAvatar());

            BigDecimal bal = (u.getBalance() != null) ? u.getBalance() : BigDecimal.ZERO;
            ps.setBigDecimal(12, bal);

            if (u.getRank() == null) ps.setNull(13, Types.INTEGER);
            else ps.setInt(13, u.getRank());

            ps.setInt(14, u.getUserId());

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return false;
    }

    public boolean deleteUser(int userId) {
        String sql = "DELETE FROM Users WHERE user_id=?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public int countAllUsers() {
        String sql = "SELECT COUNT(*) AS total FROM Users";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getInt("total");
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public int countActiveUsers() {
        String sql = "SELECT COUNT(*) AS total FROM Users WHERE is_active = 1";
try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getInt("total");
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public List<Map<String, Object>> countUserRegistrationsLastNMonths(int months) {
        List<Map<String, Object>> out = new ArrayList<>();

        String sql = "WITH m AS ( " +
                "  SELECT CAST(DATEFROMPARTS(YEAR(DATEADD(MONTH, -(?-1), GETDATE())), " +
                "                              MONTH(DATEADD(MONTH, -(?-1), GETDATE())), 1) AS DATE) AS month_start " +
                "  UNION ALL " +
                "  SELECT DATEADD(MONTH, 1, month_start) FROM m " +
                "  WHERE month_start < CAST(DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AS DATE) " +
                ") " +
                "SELECT FORMAT(m.month_start, 'MM/yyyy') AS label, " +
                "       COUNT(u.user_id) AS total " +
                "FROM m " +
                "LEFT JOIN Users u " +
                "  ON u.create_at >= m.month_start " +
                " AND u.create_at < DATEADD(MONTH, 1, m.month_start) " +
                "GROUP BY m.month_start " +
                "ORDER BY m.month_start " +
                "OPTION (MAXRECURSION 1000);";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, months);
            ps.setInt(2, months);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("label", rs.getString("label"));
                    row.put("total", rs.getInt("total"));
                    out.add(row);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return out;
    }

    public Boolean getUserActiveStatus(int userId) {
        String sql = "SELECT is_active FROM Users WHERE user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getBoolean("is_active");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public Boolean toggleUserActiveAndReturnStatus(int userId) {
        String sql = "UPDATE Users " +
                "SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END " +
                "WHERE user_id = ?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, userId);
            int updated = ps.executeUpdate();
            if (updated == 0) return null;
return getUserActiveStatus(userId);

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
}