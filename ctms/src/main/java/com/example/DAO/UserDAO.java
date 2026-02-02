package com.example.DAO;

import com.example.model.User;
import com.example.util.DBContext;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class UserDAO {

    public boolean insert(User user) {

    String sql = """
        INSERT INTO Users
        (first_name, last_name, user_name, phone_number, email, address, password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """;

    try (Connection con = DBContext.getConnection();
         PreparedStatement ps = con.prepareStatement(sql)) {

        ps.setString(1, user.getFirstName());
        ps.setString(2, user.getLastName());
        ps.setString(3, user.getUsername());
        ps.setString(4, user.getPhone());
        ps.setString(5, user.getEmail());
        ps.setString(6, user.getAddress());
        ps.setString(7, user.getPassword());

        return ps.executeUpdate() > 0;

    } catch (Exception e) {
        e.printStackTrace();
    }

    return false;
}


public boolean isEmailExists(String email) {
    String sql = "SELECT 1 FROM Users WHERE email = ?";
    try (Connection conn = DBContext.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {

        ps.setString(1, email.trim()); // 🔥 QUAN TRỌNG
        ResultSet rs = ps.executeQuery();
        return rs.next();

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
        ResultSet rs = ps.executeQuery();
        return rs.next();

    } catch (Exception e) {
        e.printStackTrace();
    }
    return false;
}

public boolean isUsernameExists(String username) {
    String sql = "SELECT 1 FROM Users WHERE user_name = ?";
    try (Connection conn = DBContext.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {

        ps.setString(1, username);
        ResultSet rs = ps.executeQuery();
        return rs.next();

    } catch (Exception e) {
        e.printStackTrace();
    }
    return false;
}

public User findByEmail(String email) {

    String sql = """
        SELECT u.user_id, u.first_name, u.last_name, u.user_name,
               u.phone_number, u.email, u.address, u.password,
               u.is_active, ur.role_id
        FROM Users u
        LEFT JOIN User_Role ur ON u.user_id = ur.user_id
        WHERE u.email = ?
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
            user.setUsername(rs.getString("user_name"));
            user.setPhone(rs.getString("phone_number"));
            user.setEmail(rs.getString("email"));
            user.setAddress(rs.getString("address"));
            user.setPassword(rs.getString("password"));
            user.setActive(rs.getBoolean("is_active"));
            user.setRoleId(rs.getInt("role_id"));
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

        try (
            Connection conn = DBContext.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)
        ) {
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

    try (
        Connection conn = DBContext.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql)
    ) {
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

    try (
        Connection conn = DBContext.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql)
    ) {
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

    try (
        Connection conn = DBContext.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql)
    ) {
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


}
