package com.example.model.id;

import java.io.Serializable;
import java.util.Objects;

public class UserRoleId implements Serializable {
    private int userId;
    private int roleId;

    public UserRoleId() {}

    public UserRoleId(int userId, int roleId) {
        this.userId = userId;
        this.roleId = roleId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserRoleId)) return false;
        UserRoleId that = (UserRoleId) o;
        return userId == that.userId && roleId == that.roleId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, roleId);
    }
}