package com.example.DAO;

import com.example.Model.User;
import com.example.Utils.DBContext;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

public class UserDAO extends DBContext {

    // Map ResultSet -> User
    private User mapRow(ResultSet rs) throws SQLException {
        User u = new User();
        u.setUserId(rs.getInt("user_id"));
        u.setFirstName(rs.getString("first_name"));
        u.setLastName(rs.getString("last_name"));
        u.setEmail(rs.getString("email"));
        u.setPhoneNumber(rs.getString("phone_number"));
        u.setAddress(rs.getString("address"));

        // Model dùng java.sql.Timestamp => lấy trực tiếp
        u.setLastLogin(rs.getTimestamp("last_login"));
        u.setCreateAt(rs.getTimestamp("create_at"));

        u.setActive(rs.getBoolean("is_active"));
        u.setPassword(rs.getString("password"));

        // DB column name: avarta (typo)
        u.setAvatar(rs.getString("avarta"));

        u.setBalance(rs.getBigDecimal("balance"));

        u.setRank((Integer) rs.getObject("rank"));
        return u;
    }

    // 1) GET by ID
    public User getUserById(int userId) {
        String sql = "SELECT user_id, first_name, last_name, email, phone_number, address, " +
                "last_login, create_at, is_active, password, avarta, balance, rank " +
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

    // 2) GET by Email
    public User getUserByEmail(String email) {
        String sql = "SELECT user_id, first_name, last_name, email, phone_number, address, " +
                "last_login, create_at, is_active, password, avarta, balance, rank " +
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

    // 3) GET all
    public List<User> getAllUsers() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT user_id, first_name, last_name, email, phone_number, address, " +
                "last_login, create_at, is_active, password, avarta, balance, rank " +
                "FROM Users";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 4) INSERT user
    public boolean insertUser(User u) {
        String sql = "INSERT INTO Users " +
                "(user_id, first_name, last_name, email, phone_number, address, last_login, create_at, is_active, password, avarta, balance, rank) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, u.getUserId());
            ps.setString(2, u.getFirstName());
            ps.setString(3, u.getLastName());
            ps.setString(4, u.getEmail());
            ps.setString(5, u.getPhoneNumber());
            ps.setString(6, u.getAddress());

            ps.setTimestamp(7, u.getLastLogin());

            // nếu createAt null thì lấy thời gian hiện tại
            Timestamp created = (u.getCreateAt() != null)
                    ? u.getCreateAt()
                    : new Timestamp(System.currentTimeMillis());
            ps.setTimestamp(8, created);

            ps.setBoolean(9, u.isActive());
            ps.setString(10, u.getPassword());
            ps.setString(11, u.getAvatar());

            // balance: nếu null thì set 0 cho chắc
            BigDecimal bal = (u.getBalance() != null) ? u.getBalance() : BigDecimal.ZERO;
            ps.setBigDecimal(12, bal);

            if (u.getRank() == null) ps.setNull(13, Types.INTEGER);
            else ps.setInt(13, u.getRank());

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 5) UPDATE user
    public boolean updateUser(User u) {
        String sql = "UPDATE Users SET first_name=?, last_name=?, email=?, phone_number=?, address=?, " +
                "last_login=?, is_active=?, password=?, avarta=?, balance=?, rank=? " +
                "WHERE user_id=?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, u.getFirstName());
            ps.setString(2, u.getLastName());
            ps.setString(3, u.getEmail());
            ps.setString(4, u.getPhoneNumber());
            ps.setString(5, u.getAddress());

            // đúng chuẩn: setTimestamp
            ps.setTimestamp(6, u.getLastLogin());

            ps.setBoolean(7, u.isActive());
            ps.setString(8, u.getPassword());
            ps.setString(9, u.getAvatar());

            BigDecimal bal = (u.getBalance() != null) ? u.getBalance() : BigDecimal.ZERO;
            ps.setBigDecimal(10, bal);

            if (u.getRank() == null) ps.setNull(11, Types.INTEGER);
            else ps.setInt(11, u.getRank());

            ps.setInt(12, u.getUserId());

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 6) UPDATE last_login
    public boolean updateLastLogin(int userId, Timestamp lastLogin) {
        String sql = "UPDATE Users SET last_login=? WHERE user_id=?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setTimestamp(1, lastLogin);
            ps.setInt(2, userId);

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 7) UPDATE balance
    public boolean updateBalance(int userId, BigDecimal newBalance) {
        String sql = "UPDATE Users SET balance=? WHERE user_id=?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            BigDecimal bal = (newBalance != null) ? newBalance : BigDecimal.ZERO;
            ps.setBigDecimal(1, bal);
            ps.setInt(2, userId);

            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 8) DELETE user
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
    } catch (SQLException e) { e.printStackTrace(); }
    return 0;
}

public int countActiveUsers() {
    String sql = "SELECT COUNT(*) AS total FROM Users WHERE is_active = 1";
    try (Connection conn = getConnection();
         PreparedStatement ps = conn.prepareStatement(sql);
         ResultSet rs = ps.executeQuery()) {
        if (rs.next()) return rs.getInt("total");
    } catch (SQLException e) { e.printStackTrace(); }
    return 0;
}
}
