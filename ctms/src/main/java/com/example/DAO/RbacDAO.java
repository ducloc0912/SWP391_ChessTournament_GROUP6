package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.example.model.entity.Permission;
import com.example.model.entity.Role;
import com.example.util.DBContext;

public class RbacDAO {

    /*
     * =========================
     * 1) PERMISSIONS OF USER
     * =========================
     */
    public List<Permission> findAllPer() {
        String sql = """
                    SELECT permission_id, permission_name, permission_code, module
                    FROM Permission
                    ORDER BY module, permission_name
                """;
        List<Permission> out = new ArrayList<>();

        try (Connection c = DBContext.getConnection();
                PreparedStatement ps = c.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                out.add(new Permission(
                        rs.getInt("permission_id"),
                        rs.getString("permission_name"),
                        rs.getString("permission_code"),
                        rs.getString("module")));
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return out;
    }

    public Set<String> getPermissionCodesByUser(int userId) {
        String sql = """
                    SELECT DISTINCT p.permission_code
                    FROM User_Role ur
                    JOIN Role_Permission rp ON ur.role_id = rp.role_id
                    JOIN Permission p ON rp.permission_id = p.permission_id
                    WHERE ur.user_id = ?
                """;

        Set<String> out = new HashSet<>();
        try (Connection c = DBContext.getConnection();
                PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next())
                    out.add(rs.getString("permission_code"));
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return out;
    }

    /*
     * =========================
     * 2) ADMIN: ROLE -> PERMISSIONS (tick)
     * Replace toàn bộ permission của role
     * =========================
     */
    public void replaceRolePermissions(int roleId, List<Integer> permissionIds) {
        String delSql = "DELETE FROM Role_Permission WHERE role_id = ?";
        String insSql = "INSERT INTO Role_Permission(role_id, permission_id) VALUES (?, ?)";

        try (Connection c = DBContext.getConnection()) {
            c.setAutoCommit(false);

            try (PreparedStatement del = c.prepareStatement(delSql)) {
                del.setInt(1, roleId);
                del.executeUpdate();
            }

            if (permissionIds != null && !permissionIds.isEmpty()) {
                try (PreparedStatement ins = c.prepareStatement(insSql)) {
                    for (Integer pid : permissionIds) {
                        ins.setInt(1, roleId);
                        ins.setInt(2, pid);
                        ins.addBatch();
                    }
                    ins.executeBatch();
                }
            }

            c.commit();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /*
     * =========================
     * 3) ADMIN: USER -> ROLES
     * Replace toàn bộ role của user
     * =========================
     */
    public void replaceUserRoles(int userId, List<Integer> roleIds) {
        String delSql = "DELETE FROM User_Role WHERE user_id = ?";
        String insSql = "INSERT INTO User_Role(user_id, role_id) VALUES (?, ?)";

        try (Connection c = DBContext.getConnection()) {
            c.setAutoCommit(false);

            try (PreparedStatement del = c.prepareStatement(delSql)) {
                del.setInt(1, userId);
                del.executeUpdate();
            }

            if (roleIds != null && !roleIds.isEmpty()) {
                try (PreparedStatement ins = c.prepareStatement(insSql)) {
                    for (Integer rid : roleIds) {
                        ins.setInt(1, userId);
                        ins.setInt(2, rid);
                        ins.addBatch();
                    }
                    ins.executeBatch();
                }
            }

            c.commit();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /*
     * =========================
     * (OPTIONAL nhưng rất nên có)
     * 4) Get permissionIds by roleId (để FE tick sẵn)
     * =========================
     */
    public Set<Integer> getPermissionIdsByRole(int roleId) {
        String sql = "SELECT permission_id FROM Role_Permission WHERE role_id = ?";
        Set<Integer> ids = new HashSet<>();
        try (Connection c = DBContext.getConnection();
                PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, roleId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next())
                    ids.add(rs.getInt("permission_id"));
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ids;
    }

    /*
     * =========================
     * (OPTIONAL)
     * 5) Get roleIds by userId (để FE tick sẵn)
     * =========================
     */
    public Set<Integer> getRoleIdsByUser(int userId) {
        String sql = "SELECT role_id FROM User_Role WHERE user_id = ?";
        Set<Integer> ids = new HashSet<>();
        try (Connection c = DBContext.getConnection();
                PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next())
                    ids.add(rs.getInt("role_id"));
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return ids;
    }

    public List<Role> findAllRole() {
        String sql = "SELECT role_id, role_name, description FROM Roles ORDER BY role_name";
        List<Role> roles = new ArrayList<>();
        try (Connection c = DBContext.getConnection();
                PreparedStatement ps = c.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                roles.add(new Role(
                        rs.getInt("role_id"),
                        rs.getString("role_name"),
                        rs.getString("description")));
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return roles;
    }
}