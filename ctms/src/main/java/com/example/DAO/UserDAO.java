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
import java.util.stream.Collectors;

import com.example.model.entity.User;
import com.example.model.entity.UserRole;
import com.example.util.DBContext;
import com.example.util.EncodingUtil;

public class UserDAO extends DBContext {
//Ham cua Hieu
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
                user.setFirstName(EncodingUtil.fixUtf8Mojibake(rs.getString("first_name")));
                user.setLastName(EncodingUtil.fixUtf8Mojibake(rs.getString("last_name")));
                user.setUsername(EncodingUtil.fixUtf8Mojibake(rs.getString("username")));
                user.setPhoneNumber(rs.getString("phone_number"));
                user.setEmail(EncodingUtil.fixUtf8Mojibake(rs.getString("email")));
                user.setAddress(EncodingUtil.fixUtf8Mojibake(rs.getString("address")));
                user.setPassword(rs.getString("password"));
                user.setIsActive(rs.getBoolean("is_active"));

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

    public boolean createStaffAccount(User user) {
        Connection conn = null;
        PreparedStatement psUser = null;
        PreparedStatement psRole = null;
        ResultSet rs = null;

        try {
            conn = getConnection();
            conn.setAutoCommit(false);

            String sqlUser = """
                INSERT INTO Users
                (username, first_name, last_name, email, phone_number, address, birthday, password, is_active, create_at, balance)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, GETDATE(), 0)
            """;

            psUser = conn.prepareStatement(sqlUser, Statement.RETURN_GENERATED_KEYS);
            psUser.setString(1, user.getUsername());
            psUser.setString(2, user.getFirstName());
            psUser.setString(3, user.getLastName());
            psUser.setString(4, user.getEmail());
            psUser.setString(5, user.getPhoneNumber());
            psUser.setString(6, user.getAddress());

            if (user.getBirthday() != null) {
                psUser.setDate(7, new java.sql.Date(user.getBirthday().getTime()));
            } else {
                psUser.setNull(7, Types.DATE);
            }

            psUser.setString(8, user.getPassword());

            int affected = psUser.executeUpdate();
            if (affected == 0) {
                throw new SQLException("Insert staff user failed.");
            }

            rs = psUser.getGeneratedKeys();
            if (!rs.next()) {
                throw new SQLException("No user_id returned.");
            }

            int newUserId = rs.getInt(1);
            int staffRoleId = getRoleIdByName(conn, "Staff");

            if (staffRoleId == 0) {
                throw new SQLException("Role 'Staff' not found in Roles table.");
            }

            String sqlRole = "INSERT INTO User_Role(user_id, role_id) VALUES(?, ?)";
            psRole = conn.prepareStatement(sqlRole);
            psRole.setInt(1, newUserId);
            psRole.setInt(2, staffRoleId);
            psRole.executeUpdate();

            conn.commit();
            return true;

        } catch (Exception e) {
            try {
                if (conn != null) {
                    conn.rollback();
                }
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            e.printStackTrace();
            return false;

        } finally {
            try {
                if (rs != null) {
                    rs.close();
                }
            } catch (SQLException ignored) {
            }
            try {
                if (psUser != null) {
                    psUser.close();
                }
            } catch (SQLException ignored) {
            }
            try {
                if (psRole != null) {
                    psRole.close();
                }
            } catch (SQLException ignored) {
            }
            try {
                if (conn != null) {
                    conn.close();
                }
            } catch (SQLException ignored) {
            }
        }
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
        WHERE u.email = ? AND u.password = ? AND u.is_active = 1
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
    // =========================
    // 1) AUTHENTICATE (LOGIN)
    // =========================
    public Map<String, Object> authenticate(String email) {
        Map<String, Object> data = new HashMap<>();

        String sql = """
                    SELECT u.*, r.role_name
                    FROM Users u
                    LEFT JOIN User_Role ur ON u.user_id = ur.user_id
                    LEFT JOIN Roles r ON ur.role_id = r.role_id
                    WHERE u.email = ?
                """;

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next())
                    return null;

                User user = new User();
                user.setUserId(rs.getInt("user_id"));
                user.setUsername(EncodingUtil.fixUtf8Mojibake(rs.getString("username")));
                user.setFirstName(EncodingUtil.fixUtf8Mojibake(rs.getString("first_name")));
                user.setLastName(EncodingUtil.fixUtf8Mojibake(rs.getString("last_name")));
                user.setEmail(EncodingUtil.fixUtf8Mojibake(rs.getString("email")));
                user.setPhoneNumber(rs.getString("phone_number"));
                user.setAddress(EncodingUtil.fixUtf8Mojibake(rs.getString("address")));
                user.setPassword(rs.getString("password"));
                user.setAvatar(rs.getString("avatar"));
                user.setIsActive(rs.getBoolean("is_active"));
                user.setBalance(rs.getBigDecimal("balance"));
                user.setRank((Integer) rs.getObject("rank"));

                String roleName = rs.getString("role_name");
                if (roleName == null || roleName.isBlank())
                    roleName = "Player";

                data.put("user", user);
                data.put("role", roleName);
                return data;
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // =========================
    // GET USERS BY IDS
    // =========================
    public List<User> getUsersByIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();

        String inSql = ids.stream().map(i -> "?").collect(Collectors.joining(","));
        String sql = "SELECT user_id, username, email, phone_number, avatar, rank FROM Users WHERE user_id IN (" + inSql + ")";

        List<User> list = new ArrayList<>();

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            for (int i = 0; i < ids.size(); i++) {
                ps.setInt(i + 1, ids.get(i));
            }

            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                User u = new User();
                u.setUserId(rs.getInt("user_id"));
                u.setUsername(rs.getString("username"));
                u.setEmail(rs.getString("email"));
                u.setPhoneNumber(rs.getString("phone_number"));
                u.setAvatar(rs.getString("avatar"));
                u.setRank((Integer) rs.getObject("rank"));
                list.add(u);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // =========================
    // 2) REGISTER (TRANSACTION)
    // =========================
    public boolean register(User user) {
        Connection conn = null;
        PreparedStatement psUser = null;
        PreparedStatement psRole = null;
        ResultSet rs = null;

        try {
            conn = getConnection();
            conn.setAutoCommit(false);

            // 1) Insert user
            String sqlUser = """
                        INSERT INTO Users(username, first_name, last_name, email, phone_number, address, password, is_active, create_at, balance)
                        VALUES(?, ?, ?, ?, ?, ?, ?, 1, GETDATE(), 0)
                    """;
            psUser = conn.prepareStatement(sqlUser, Statement.RETURN_GENERATED_KEYS);
            psUser.setString(1, user.getUsername());
            psUser.setString(2, user.getFirstName());
            psUser.setString(3, user.getLastName());
            psUser.setString(4, user.getEmail());
            psUser.setString(5, user.getPhoneNumber());
            psUser.setString(6, user.getAddress());
            psUser.setString(7, user.getPassword());

            int affected = psUser.executeUpdate();
            if (affected == 0)
                throw new SQLException("Insert user failed.");

            // 2) Get new user_id
            rs = psUser.getGeneratedKeys();
            if (!rs.next())
                throw new SQLException("No user_id returned.");
            int newUserId = rs.getInt(1);

            // 3) Get role_id of 'Player' (không hard-code = 1)
            int playerRoleId = getRoleIdByName(conn, "Player");
            if (playerRoleId == 0)
                throw new SQLException("Role 'Player' not found in Roles table.");

            // 4) Insert User_Role
            String sqlRole = "INSERT INTO User_Role(user_id, role_id) VALUES(?, ?)";
            psRole = conn.prepareStatement(sqlRole);
            psRole.setInt(1, newUserId);
            psRole.setInt(2, playerRoleId);
            psRole.executeUpdate();

            conn.commit();
            return true;

        } catch (Exception e) {
            try {
                if (conn != null)
                    conn.rollback();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            e.printStackTrace();
            return false;

        } finally {
            try {
                if (rs != null)
                    rs.close();
            } catch (SQLException ignored) {
            }
            try {
                if (psUser != null)
                    psUser.close();
            } catch (SQLException ignored) {
            }
            try {
                if (psRole != null)
                    psRole.close();
            } catch (SQLException ignored) {
            }
            try {
                if (conn != null)
                    conn.close();
            } catch (SQLException ignored) {
            }
        }
    }

    private int getRoleIdByName(Connection conn, String roleName) throws SQLException {
        String sql = "SELECT role_id FROM Roles WHERE role_name = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, roleName);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next())
                    return rs.getInt("role_id");
            }
        }
        return 0;
    }

    // =========================
    // 3) CHECK EXIST (VALIDATION)
    // =========================
    public boolean checkExist(String column, String value) {
        // whitelist cột hợp lệ để tránh injection qua column
        if (!isAllowedColumn(column)) {
            throw new IllegalArgumentException("Invalid column: " + column);
        }

        String sql = "SELECT 1 FROM Users WHERE " + column + " = ?";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, value);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    private boolean isAllowedColumn(String column) {
        return "email".equalsIgnoreCase(column)
                || "username".equalsIgnoreCase(column)
                || "phone_number".equalsIgnoreCase(column);
    }

    public List<User> getAllUsers() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT user_id, password FROM Users";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                User u = new User();
                u.setUserId(rs.getInt("user_id"));
                u.setPassword(rs.getString("password")); // password hiện tại (sai format)
                list.add(u);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public void updatePassword(int userId, String hashedPassword) {
        String sql = "UPDATE Users SET password = ? WHERE user_id = ?";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, hashedPassword);
            ps.setInt(2, userId);
            ps.executeUpdate();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Hàm của Hien
    private User mapRow(ResultSet rs) throws SQLException {
        User u = new User();

        u.setUserId(rs.getInt("user_id"));

        java.sql.Date bd = rs.getDate("birthday");
        u.setBirthday(bd != null ? new Timestamp(bd.getTime()) : null);

        u.setUsername(EncodingUtil.fixUtf8Mojibake(rs.getString("username")));
        u.setFirstName(EncodingUtil.fixUtf8Mojibake(rs.getString("first_name")));
        u.setLastName(EncodingUtil.fixUtf8Mojibake(rs.getString("last_name")));
        u.setEmail(EncodingUtil.fixUtf8Mojibake(rs.getString("email")));
        u.setPhoneNumber(rs.getString("phone_number"));
        u.setAddress(EncodingUtil.fixUtf8Mojibake(rs.getString("address")));

        Timestamp lastLoginTs = rs.getTimestamp("last_login");
        u.setLastLogin(lastLoginTs);

        Timestamp createdAtTs = rs.getTimestamp("create_at");
        u.setCreatedAt(createdAtTs != null ? new java.util.Date(createdAtTs.getTime()) : null);

        u.setIsActive(rs.getBoolean("is_active"));
        u.setPassword(rs.getString("password"));
        u.setAvatar(rs.getString("avatar"));

        BigDecimal bal = rs.getBigDecimal("balance");
        u.setBalance(bal != null ? bal : BigDecimal.ZERO);

        Object rankObj = rs.getObject("rank");
        if (rankObj == null)
            u.setRank(null);
        else if (rankObj instanceof Number)
            u.setRank(((Number) rankObj).intValue());
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
        String sql = "SELECT birthday, username, user_id, first_name, last_name, email, phone_number, address, " +
                "       last_login, create_at, is_active, password, avatar, balance, rank " +
                "FROM Users WHERE user_id = ?";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next())
                    return mapRow(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public User getUserByEmail(String email) {
        String sql = "SELECT birthday, username, user_id, first_name, last_name, email, phone_number, address, " +
                "       last_login, create_at, is_active, password, avatar, balance, rank " +
                "FROM Users WHERE email = ?";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next())
                    return mapRow(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public User getUserByUsername(String username) {
        String sql = "SELECT birthday, username, user_id, first_name, last_name, email, phone_number, address, " +
                "       last_login, create_at, is_active, password, avatar, balance, rank " +
                "FROM Users WHERE username = ?";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next())
                    return mapRow(rs);
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
        if (roleKeyOrName == null)
            return "all";
        String k = roleKeyOrName.trim();
        if (k.isEmpty() || k.equalsIgnoreCase("all"))
            return "all";

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
        String sql = "INSERT INTO Users " +
                "(birthday, username, user_id, first_name, last_name, email, phone_number, address, " +
                " last_login, create_at, is_active, password, avatar, balance, rank) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            // birthday: java.util.Date -> java.sql.Date
            if (u.getBirthday() != null)
                ps.setDate(1, new java.sql.Date(u.getBirthday().getTime()));
            else
                ps.setNull(1, Types.DATE);

            ps.setString(2, u.getUsername());
            ps.setInt(3, u.getUserId());

            ps.setString(4, u.getFirstName());
            ps.setString(5, u.getLastName());
            ps.setString(6, u.getEmail());
            ps.setString(7, u.getPhoneNumber());
            ps.setString(8, u.getAddress());

            // last_login: java.util.Date -> Timestamp
            if (u.getLastLogin() != null)
                ps.setTimestamp(9, new Timestamp(u.getLastLogin().getTime()));
            else
                ps.setNull(9, Types.TIMESTAMP);

            // create_at: nếu null thì lấy now
            java.util.Date createdAt = (u.getCreatedAt() != null) ? u.getCreatedAt() : new java.util.Date();
            ps.setTimestamp(10, new Timestamp(createdAt.getTime()));

            ps.setBoolean(11, u.isActive());
            ps.setString(12, u.getPassword());
            ps.setString(13, u.getAvatar());

            BigDecimal bal = (u.getBalance() != null) ? u.getBalance() : BigDecimal.ZERO;
            ps.setBigDecimal(14, bal);

            if (u.getRank() == null)
                ps.setNull(15, Types.INTEGER);
            else
                ps.setInt(15, u.getRank());

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateUser(User u) {
        String sql = "UPDATE Users SET " +
                "birthday=?, username=?, first_name=?, last_name=?, email=?, phone_number=?, address=?, " +
                "last_login=?, is_active=?, password=?, avatar=?, balance=?, rank=? " +
                "WHERE user_id=?";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            if (u.getBirthday() != null)
                ps.setDate(1, new java.sql.Date(u.getBirthday().getTime()));
            else
                ps.setNull(1, Types.DATE);

            ps.setString(2, u.getUsername());
            ps.setString(3, u.getFirstName());
            ps.setString(4, u.getLastName());
            ps.setString(5, u.getEmail());
            ps.setString(6, u.getPhoneNumber());
            ps.setString(7, u.getAddress());

            if (u.getLastLogin() != null)
                ps.setTimestamp(8, new Timestamp(u.getLastLogin().getTime()));
            else
                ps.setNull(8, Types.TIMESTAMP);

            ps.setBoolean(9, u.isActive());
            ps.setString(10, u.getPassword());
            ps.setString(11, u.getAvatar());

            BigDecimal bal = (u.getBalance() != null) ? u.getBalance() : BigDecimal.ZERO;
            ps.setBigDecimal(12, bal);

            if (u.getRank() == null)
                ps.setNull(13, Types.INTEGER);
            else
                ps.setInt(13, u.getRank());

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

    public boolean addBalance(int userId, BigDecimal amount) {
        String sql = "UPDATE Users SET balance = ISNULL(balance, 0) + ? WHERE user_id = ?";
        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBigDecimal(1, amount);
            ps.setInt(2, userId);
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
            if (rs.next())
                return rs.getInt("total");
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
            if (rs.next())
                return rs.getInt("total");
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
                if (rs.next())
                    return rs.getBoolean("is_active");
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
            if (updated == 0)
                return null;
            return getUserActiveStatus(userId);

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean updateUserAdminBasic(
            int userId,
            String username,
            String firstName,
            String lastName,
            java.util.Date birthday,
            String address,
            String phoneNumber) {
        String sql = "UPDATE Users SET username=?, first_name=?, last_name=?, birthday=?, address=?, phone_number=? " +
                "WHERE user_id=?";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, username);
            ps.setString(2, firstName);
            ps.setString(3, lastName);

            if (birthday != null)
                ps.setDate(4, new java.sql.Date(birthday.getTime()));
            else
                ps.setNull(4, Types.DATE);

            ps.setString(5, address);
            ps.setString(6, phoneNumber);
            ps.setInt(7, userId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ====== ADD: update role by key (staff/tournament_leader/referee/player)
    // ======
    public boolean updateUserRoleByKey(int userId, String roleKey) {
        String roleName = normalizeRoleName(roleKey); // dùng method đã có trong DAO của bạn
        if (roleName == null || roleName.equalsIgnoreCase("all"))
            return true;

        String getRoleIdSql = "SELECT role_id FROM Roles WHERE LOWER(role_name) = LOWER(?)";
        String deleteOldSql = "DELETE FROM User_Role WHERE user_id = ?";
        String insertNewSql = "INSERT INTO User_Role(user_id, role_id) VALUES(?, ?)";

        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);

            int roleId = 0;
            try (PreparedStatement ps = conn.prepareStatement(getRoleIdSql)) {
                ps.setString(1, roleName);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next())
                        roleId = rs.getInt("role_id");
                }
            }

            if (roleId == 0) {
                conn.rollback();
                return false;
            }

            try (PreparedStatement ps = conn.prepareStatement(deleteOldSql)) {
                ps.setInt(1, userId);
                ps.executeUpdate();
            }

            try (PreparedStatement ps = conn.prepareStatement(insertNewSql)) {
                ps.setInt(1, userId);
                ps.setInt(2, roleId);
                ps.executeUpdate();
            }

            conn.commit();
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ====== ADD: verify current password then change ======
    public boolean changePasswordWithVerify(int userId, String currentPassword, String newPassword) {
        String selectSql = "SELECT password FROM Users WHERE user_id = ?";
        String updateSql = "UPDATE Users SET password = ? WHERE user_id = ?";

        try (Connection conn = getConnection()) {

            String dbPass = null;
            try (PreparedStatement ps = conn.prepareStatement(selectSql)) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next())
                        dbPass = rs.getString("password");
                }
            }

            if (dbPass == null)
                return false;
            if (!dbPass.equals(currentPassword))
                return false;

            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setString(1, newPassword);
                ps.setInt(2, userId);
                return ps.executeUpdate() > 0;
            }

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

public boolean updateUserAvatar(int userId, String avatarDataUri) {
        String sql = "UPDATE Users SET avatar = ? WHERE user_id = ?";

        try (Connection conn = getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, avatarDataUri);
            ps.setInt(2, userId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}