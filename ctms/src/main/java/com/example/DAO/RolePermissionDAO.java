package com.example.DAO;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.List;

import com.example.util.DBContext;

public class RolePermissionDAO {

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
}