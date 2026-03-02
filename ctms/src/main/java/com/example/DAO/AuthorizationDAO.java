package com.example.DAO;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashSet;
import java.util.Set;

import com.example.util.DBContext;

public class AuthorizationDAO {

    public Set<String> getPermissionCodesByUser(int userId) {
        Set<String> permissions = new HashSet<>();

        String sql = """
            SELECT DISTINCT p.permission_code
            FROM User_Role ur
            JOIN Role_Permission rp ON ur.role_id = rp.role_id
            JOIN Permission p ON rp.permission_id = p.permission_id
            WHERE ur.user_id = ?
        """;

        try (Connection c = DBContext.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {

            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                permissions.add(rs.getString("permission_code"));
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return permissions;
    }
}