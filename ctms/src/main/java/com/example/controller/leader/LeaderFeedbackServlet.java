package com.example.controller.leader;

import com.example.model.entity.User;
import com.example.service.user.FeedbackService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/leader/feedback")
public class LeaderFeedbackServlet extends HttpServlet {

    private final FeedbackService feedbackService = new FeedbackService();
    private final Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd HH:mm:ss")
            .create();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();

        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            result.put("success", false);
            result.put("message", "Vui lòng đăng nhập.");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        String role = (String) session.getAttribute("role");
        if (role == null || !"TOURNAMENTLEADER".equalsIgnoreCase(role)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            result.put("success", false);
            result.put("message", "Chỉ tournament leader mới được phản hồi feedback.");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        try {
            Map<String, Object> body = gson.fromJson(request.getReader(), Map.class);
            if (body == null || !body.containsKey("feedbackId")) {
                throw new IllegalArgumentException("Thiếu feedbackId.");
            }
            int feedbackId = ((Double) body.get("feedbackId")).intValue();
            String reply = body.get("reply") != null ? body.get("reply").toString() : "";

            boolean ok = feedbackService.updateFeedbackReply(feedbackId, reply);
            if (ok) {
                result.put("success", true);
                result.put("message", "Cập nhật phản hồi thành công.");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                result.put("success", false);
                result.put("message", "Không thể cập nhật phản hồi.");
            }
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            result.put("success", false);
            result.put("message", "Có lỗi xảy ra khi cập nhật phản hồi.");
        }

        response.getWriter().write(gson.toJson(result));
    }
}

