package com.example.controller.common;

import com.example.DAO.NotificationDAO;
import com.example.model.entity.Notification;
import com.example.model.entity.User;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/notifications")
public class UserNotificationServlet extends HttpServlet {

    private final NotificationDAO notificationDAO = new NotificationDAO();
    private final Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd HH:mm:ss")
            .create();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"message\":\"Unauthorized\"}");
            return;
        }
        User currentUser = (User) session.getAttribute("user");

        boolean onlyUnread = "true".equalsIgnoreCase(request.getParameter("onlyUnread"));

        try {
            List<Notification> list = notificationDAO.getNotificationsForUser(currentUser.getUserId(), onlyUnread);
            response.getWriter().write(gson.toJson(list));
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"message\":\"Không thể tải thông báo.\"}");
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\"}");
            return;
        }
        User currentUser = (User) session.getAttribute("user");
        String action = request.getParameter("action");
        Map<String, Object> result = new HashMap<>();
        if ("markAllRead".equalsIgnoreCase(action)) {
            boolean ok = notificationDAO.markAllAsRead(currentUser.getUserId());
            result.put("success", ok);
            result.put("message", ok ? "Đã đánh dấu tất cả là đã đọc." : "Thất bại.");
        } else {
            // markRead by notificationId
            String idStr = request.getParameter("notificationId");
            if (idStr == null) { result.put("success", false); result.put("message", "Thiếu notificationId."); }
            else {
                try {
                    int nid = Integer.parseInt(idStr);
                    boolean ok = notificationDAO.markAsRead(nid);
                    result.put("success", ok);
                    result.put("message", ok ? "Đã đánh dấu đã đọc." : "Không tìm thấy thông báo.");
                } catch (NumberFormatException e) {
                    result.put("success", false);
                    result.put("message", "notificationId không hợp lệ.");
                }
            }
        }
        response.getWriter().write(gson.toJson(result));
    }
}


