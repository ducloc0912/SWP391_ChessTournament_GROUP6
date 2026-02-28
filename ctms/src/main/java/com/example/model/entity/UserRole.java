package com.example.model.entity;

import java.sql.Timestamp;

public class UserRole {
    private Integer userId;
    private Integer roleId;
    private String username;
    private String email;
    private Timestamp lastLogin;
    private Boolean isActive;
    private String avatar;
    private String roleName;

    public UserRole() {}

    public UserRole(Integer userId, Integer roleId) {
        this.userId = userId;
        this.roleId = roleId;
    }

    /** Constructor for login/join result: (userId, username, email, lastLogin, isActive, avatar, roleName) */
    public UserRole(int userId, String username, String email, Timestamp lastLogin, boolean isActive, String avatar, String roleName) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.lastLogin = lastLogin;
        this.isActive = isActive;
        this.avatar = avatar;
        this.roleName = roleName;
    }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public Integer getRoleId() { return roleId; }
    public void setRoleId(Integer roleId) { this.roleId = roleId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Timestamp getLastLogin() { return lastLogin; }
    public void setLastLogin(Timestamp lastLogin) { this.lastLogin = lastLogin; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
}