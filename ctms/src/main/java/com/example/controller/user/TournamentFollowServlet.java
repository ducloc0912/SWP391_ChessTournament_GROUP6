package com.example.controller.user;

import com.example.DAO.TournamentFollowDAO;
import com.example.model.dto.TournamentDTO;
import com.example.model.entity.User;
import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/user/follow")
public class TournamentFollowServlet extends HttpServlet {

    private final TournamentFollowDAO followDAO = new TournamentFollowDAO();
    private final Gson gson = new Gson();

    private Integer getLoggedInUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        Object u = session.getAttribute("user");
        if (u instanceof User) return ((User) u).getUserId();
        return null;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\":false,\"message\":\"Bạn cần đăng nhập.\"}");
            return;
        }
        String action = request.getParameter("action");
        if ("status".equalsIgnoreCase(action)) {
            // Check follow status for a specific tournament
            String tidStr = request.getParameter("tournamentId");
            if (tidStr == null) { response.setStatus(400); response.getWriter().write("{\"following\":false}"); return; }
            try {
                int tId = Integer.parseInt(tidStr);
                boolean following = followDAO.isFollowing(userId, tId);
                response.getWriter().write("{\"following\":" + following + "}");
            } catch (NumberFormatException e) {
                response.setStatus(400); response.getWriter().write("{\"following\":false}");
            }
        } else {
            // Default: list all followed tournaments
            List<TournamentDTO> list = followDAO.getFollowedTournaments(userId);
            response.getWriter().write(gson.toJson(list));
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        Integer userId = getLoggedInUserId(request);
        if (userId == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\":false,\"message\":\"Bạn cần đăng nhập.\"}");
            return;
        }
        String action = request.getParameter("action");
        String tidStr = request.getParameter("tournamentId");
        if (tidStr == null) {
            try {
                com.google.gson.JsonObject body = gson.fromJson(request.getReader(), com.google.gson.JsonObject.class);
                if (body != null && body.has("tournamentId")) tidStr = body.get("tournamentId").getAsString();
            } catch (Exception ignored) {}
        }
        if (tidStr == null) { response.setStatus(400); response.getWriter().write("{\"success\":false,\"message\":\"Thiếu tournamentId.\"}"); return; }
        int tournamentId;
        try { tournamentId = Integer.parseInt(tidStr); } catch (NumberFormatException e) {
            response.setStatus(400); response.getWriter().write("{\"success\":false,\"message\":\"tournamentId không hợp lệ.\"}"); return;
        }
        Map<String, Object> result = new HashMap<>();
        if ("unfollow".equalsIgnoreCase(action)) {
            boolean ok = followDAO.unfollow(userId, tournamentId);
            result.put("success", ok);
            result.put("message", ok ? "Đã hủy theo dõi giải đấu." : "Hủy theo dõi thất bại.");
        } else {
            // Default: follow
            boolean ok = followDAO.follow(userId, tournamentId);
            result.put("success", ok);
            result.put("message", ok ? "Đã theo dõi giải đấu." : "Theo dõi thất bại.");
            result.put("following", ok);
        }
        response.getWriter().write(gson.toJson(result));
    }
}
