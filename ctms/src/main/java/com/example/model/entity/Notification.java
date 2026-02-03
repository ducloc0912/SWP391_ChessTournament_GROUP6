package com.example.model.entity;
import java.sql.Timestamp;

public class Notification {
    private Integer notificationId;
    private String title;
    private String message;
    private String type;
    public Integer getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Integer notificationId) {
        this.notificationId = notificationId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    private String actionUrl;
    private Boolean isRead;
    private Timestamp createdAt;
    private Integer userId;

    public Notification() {}

    public Notification(Integer notificationId, String title, String message, String type,
                        String actionUrl, Boolean isRead, Timestamp createdAt, Integer userId) {
        this.notificationId = notificationId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.actionUrl = actionUrl;
        this.isRead = isRead;
        this.createdAt = createdAt;
        this.userId = userId;
    }
}
