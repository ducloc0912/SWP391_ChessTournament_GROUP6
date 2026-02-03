package com.example.model;

import java.sql.Timestamp;

public class UserRole {
    private int userId;
    private String username;
    private String email;
    private Timestamp lastLogin;

    
    private boolean isActive;

    private String avatar;
    private String roleName;

    public UserRole() {}

    public UserRole(int userId, String username, String email, Timestamp lastLogin,
                    boolean isActive, String avatar, String roleName) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.lastLogin = lastLogin;
        this.isActive = isActive;
        this.avatar = avatar;
        this.roleName = roleName;
    }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Timestamp getLastLogin() { return lastLogin; }
    public void setLastLogin(Timestamp lastLogin) { this.lastLogin = lastLogin; }

    
    public boolean isActive() { return isActive; }
    public void setIsActive(boolean isActive) { this.isActive = isActive; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
}
