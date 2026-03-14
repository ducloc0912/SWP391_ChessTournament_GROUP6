package com.example.controller.user;

import com.example.model.dto.FeedbackDTO;
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

@WebServlet("/api/feedback")
public class UserFeedbackServlet extends HttpServlet {

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
            result.put("message", "Vui lòng đăng nhập trước khi gửi feedback.");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        User currentUser = (User) session.getAttribute("user");

        try {
            FeedbackDTO payload = gson.fromJson(request.getReader(), FeedbackDTO.class);
            if (payload == null) {
                throw new IllegalArgumentException("Dữ liệu feedback không hợp lệ.");
            }

            payload.setUserId(currentUser.getUserId());

            boolean ok = feedbackService.addFeedback(payload);

            if (ok) {
                result.put("success", true);
                result.put("message", "Gửi đánh giá thành công.");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                result.put("success", false);
                result.put("message", "Gửi đánh giá thất bại. Vui lòng thử lại sau.");
            }
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            result.put("success", false);
            result.put("message", "Có lỗi xảy ra khi gửi feedback.");
        }

        response.getWriter().write(gson.toJson(result));
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();

        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            result.put("success", false);
            result.put("message", "Vui lòng đăng nhập trước khi chỉnh sửa feedback.");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        User currentUser = (User) session.getAttribute("user");

        try {
            Map<String, Object> body = gson.fromJson(request.getReader(), Map.class);
            if (body == null || !body.containsKey("feedbackId")) {
                throw new IllegalArgumentException("Thiếu feedbackId.");
            }

            int feedbackId = ((Double) body.get("feedbackId")).intValue();
            int starRating = body.get("starRating") == null
                    ? 0
                    : ((Double) body.get("starRating")).intValue();
            String comment = body.get("comment") != null ? body.get("comment").toString() : "";

            boolean ok = feedbackService.updateFeedbackContent(
                    feedbackId,
                    currentUser.getUserId(),
                    starRating,
                    comment
            );

            if (ok) {
                result.put("success", true);
                result.put("message", "Cập nhật feedback thành công.");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                result.put("success", false);
                result.put("message", "Không thể cập nhật feedback.");
            }
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            result.put("success", false);
            result.put("message", "Có lỗi xảy ra khi cập nhật feedback.");
        }

        response.getWriter().write(gson.toJson(result));
    }
}

