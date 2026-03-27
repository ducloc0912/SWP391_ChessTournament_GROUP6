package com.example.service.leader;

import com.example.DAO.NotificationDAO;
import com.example.DAO.TournamentFollowDAO;
import com.example.model.entity.Notification;

import java.sql.SQLException;
import java.util.List;

/**
 * Service to manage notifications for tournament followers.
 */
public class TournamentNotificationService {

    private final NotificationDAO notificationDAO = new NotificationDAO();
    private final TournamentFollowDAO followDAO = new TournamentFollowDAO();

    /**
     * Notify all followers of a tournament about an update.
     */
    public void notifyFollowers(int tournamentId, String title, String message, String type, String actionUrl) {
        List<Integer> followerIds = followDAO.getFollowerUserIds(tournamentId);
        if (followerIds.isEmpty()) return;

        Notification template = new Notification();
        template.setTitle(title);
        template.setMessage(message);
        template.setType(type);
        template.setActionUrl(actionUrl);

        try {
            notificationDAO.bulkCreateNotifications(followerIds, template);
        } catch (SQLException e) {
            System.err.println("[TournamentNotificationService] Error notifying followers for tournament " + tournamentId);
            e.printStackTrace();
        }
    }
}
