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
        // Reserved for future: mark-as-read, etc.
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "Chức năng cập nhật thông báo chưa được hỗ trợ.");
        response.getWriter().write(gson.toJson(result));
    }
}

