package com.example.model.id;

import java.io.Serializable;
import java.util.Objects;

public class RolePermissionId implements Serializable {
    private int roleId;
    private int permissionId;

    public RolePermissionId() {}

    public RolePermissionId(int roleId, int permissionId) {
        this.roleId = roleId;
        this.permissionId = permissionId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RolePermissionId)) return false;
        RolePermissionId that = (RolePermissionId) o;
        return roleId == that.roleId && permissionId == that.permissionId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(roleId, permissionId);
    }
}