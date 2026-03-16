package com.example.DAO;

import com.example.model.entity.Notification;
import com.example.util.DBContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class NotificationDAO extends DBContext {

    public int createNotification(Notification notification) throws SQLException {
        String sql = """
                INSERT INTO Notification (title, message, type, action_url, is_read, create_at, user_id)
                VALUES (?, ?, ?, ?, 0, GETDATE(), ?)
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, notification.getTitle());
            ps.setString(2, notification.getMessage());
            ps.setString(3, notification.getType());
            ps.setString(4, notification.getActionUrl());
            if (notification.getUserId() != null) {
                ps.setInt(5, notification.getUserId());
            } else {
                ps.setNull(5, java.sql.Types.INTEGER);
            }
            int affected = ps.executeUpdate();
            if (affected <= 0) {
                return -1;
            }
            try (var rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
            return -1;
        }
    }

    public List<Notification> getNotificationsForUser(Integer userId, boolean onlyUnread) throws SQLException {
        List<Notification> list = new ArrayList<>();
        String sql = """
                SELECT notification_id, title, message, type, action_url, is_read, create_at, user_id
                FROM Notification
                WHERE (user_id = ? OR user_id IS NULL)
                  AND (? = 0 OR is_read = 0)
                ORDER BY create_at DESC
                """;
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            if (userId != null) {
                ps.setInt(1, userId);
            } else {
                ps.setNull(1, java.sql.Types.INTEGER);
            }
            ps.setInt(2, onlyUnread ? 1 : 0);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Notification n = new Notification();
                    n.setNotificationId(rs.getInt("notification_id"));
                    n.setTitle(rs.getString("title"));
                    n.setMessage(rs.getString("message"));
                    n.setType(rs.getString("type"));
                    n.setActionUrl(rs.getString("action_url"));
                    n.setIsRead(rs.getBoolean("is_read"));
                    n.setCreatedAt(rs.getTimestamp("create_at"));
                    n.setUserId((Integer) rs.getObject("user_id"));
                    list.add(n);
                }
            }
        }
        return list;
    }

    public boolean markAsRead(int notificationId) {
        String sql = "UPDATE Notification SET is_read=1 WHERE notification_id=?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, notificationId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean markAllAsRead(int userId) {
        String sql = "UPDATE Notification SET is_read=1 WHERE user_id=? AND is_read=0";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public void bulkCreateNotifications(List<Integer> userIds, Notification template) throws SQLException {
        if (userIds == null || userIds.isEmpty()) return;
        String sql = """
                INSERT INTO Notification (title, message, type, action_url, is_read, create_at, user_id)
                VALUES (?, ?, ?, ?, 0, GETDATE(), ?)
                """;
        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                for (Integer userId : userIds) {
                    ps.setString(1, template.getTitle());
                    ps.setString(2, template.getMessage());
                    ps.setString(3, template.getType());
                    ps.setString(4, template.getActionUrl());
                    if (userId != null) {
                        ps.setInt(5, userId);
                    } else {
                        ps.setNull(5, java.sql.Types.INTEGER);
                    }
                    ps.addBatch();
                }
                ps.executeBatch();
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }
}

