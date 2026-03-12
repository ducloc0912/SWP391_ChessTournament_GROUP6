package com.example.controller.referee;

import com.example.DAO.RefereeMatchDAO;
import com.example.model.entity.User;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/referee/matches")
public class RefereeMatchServlet extends HttpServlet {

    private RefereeMatchDAO refereeMatchDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        refereeMatchDAO = new RefereeMatchDAO();
        gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd HH:mm:ss")
                .create();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            User user = getAuthenticatedUser(request, response);
            if (user == null) {
                return;
            }

            Integer userId = user.getUserId();
            if (userId == null || userId <= 0) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("[]");
                return;
            }

            List<Map<String, Object>> tournaments = refereeMatchDAO.getAssignedTournaments(userId);
            List<Map<String, Object>> matches = new java.util.ArrayList<>();
            for (Map<String, Object> t : tournaments) {
                Object tidObj = t.get("tournamentId");
                if (tidObj instanceof Number) {
                    int tid = ((Number) tidObj).intValue();
                    matches.addAll(refereeMatchDAO.getMatchesOfTournamentForReferee(tid, userId));
                }
            }
            Map<String, Object> payload = new HashMap<>();
            payload.put("tournaments", tournaments);
            payload.put("matches", matches);
            response.getWriter().write(gson.toJson(payload));
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi tải danh sách trận: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            response.getWriter().write(gson.toJson(err));
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        User user = getAuthenticatedUser(request, response);
        if (user == null) {
            return;
        }
        Integer userId = user.getUserId();
        if (userId == null || userId <= 0) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            writeJson(response, false, "Tài khoản không hợp lệ.");
            return;
        }

        String action = request.getParameter("action");
        if (action == null || action.isBlank()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            writeJson(response, false, "Thiếu action.");
            return;
        }

        String matchIdParam = request.getParameter("matchId");
        int matchId;
        try {
            matchId = Integer.parseInt(matchIdParam);
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            writeJson(response, false, "matchId không hợp lệ.");
            return;
        }

        switch (action) {
            case "start" -> handleStartMatch(response, userId, matchId);
            case "finish" -> handleFinishMatch(request, response, userId, matchId);
            case "attendance" -> handleAttendance(request, response, userId, matchId);
            default -> {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                writeJson(response, false, "Action không hợp lệ.");
            }
        }
    }

    private void handleAttendance(HttpServletRequest request, HttpServletResponse response, int refereeId, int matchId) throws IOException {
        Map<?, ?> body;
        try {
            body = gson.fromJson(request.getReader(), Map.class);
        } catch (Exception e) {
            body = null;
        }
        boolean whitePresent = body != null && Boolean.TRUE.equals(body.get("whitePresent"));
        boolean blackPresent = body != null && Boolean.TRUE.equals(body.get("blackPresent"));
        String whiteStatus = whitePresent ? "Present" : "Absent";
        String blackStatus = blackPresent ? "Present" : "Absent";

        Map<String, Object> match = refereeMatchDAO.getMatchForReferee(matchId, refereeId);
        if (match == null) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            writeJson(response, false, "Bạn không được phân công trận này.");
            return;
        }
        Integer whitePlayerId = match.get("whitePlayerId") != null ? ((Number) match.get("whitePlayerId")).intValue() : null;
        Integer blackPlayerId = match.get("blackPlayerId") != null ? ((Number) match.get("blackPlayerId")).intValue() : null;

        boolean ok = refereeMatchDAO.recordAttendance(matchId, refereeId, whitePlayerId, blackPlayerId, whiteStatus, blackStatus);
        if (!ok) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            writeJson(response, false, "Không thể lưu điểm danh.");
            return;
        }
        writeJson(response, true, "Đã lưu điểm danh.");
    }

    private void handleStartMatch(HttpServletResponse response, int refereeId, int matchId) throws IOException {
        boolean ok = refereeMatchDAO.startMatch(matchId, refereeId);
        if (!ok) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            writeJson(response, false, "Không thể bắt đầu trận. Kiểm tra trạng thái trận hoặc phân công trọng tài.");
            return;
        }
        writeJson(response, true, "Đã bắt đầu trận đấu.");
    }

    private void handleFinishMatch(HttpServletRequest request, HttpServletResponse response, int refereeId, int matchId) throws IOException {
        Map<?, ?> body = gson.fromJson(request.getReader(), Map.class);
        String result = body != null && body.get("result") != null ? String.valueOf(body.get("result")) : null;
        String termination = body != null && body.get("termination") != null ? String.valueOf(body.get("termination")) : null;

        if (result == null || result.isBlank()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            writeJson(response, false, "Thiếu kết quả trận (result).");
            return;
        }

        boolean ok = refereeMatchDAO.finishMatch(matchId, refereeId, result, termination);
        if (!ok) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            writeJson(response, false, "Không thể lưu kết quả trận. Kiểm tra trạng thái trận hoặc phân công trọng tài.");
            return;
        }
        writeJson(response, true, "Đã lưu kết quả và kết thúc trận đấu.");
    }

    private User getAuthenticatedUser(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\": false, \"message\": \"Vui lòng đăng nhập\"}");
            return null;
        }
        return (User) session.getAttribute("user");
    }

    private void writeJson(HttpServletResponse response, boolean success, String message) throws IOException {
        Map<String, Object> payload = new HashMap<>();
        payload.put("success", success);
        payload.put("message", message);
        response.getWriter().write(gson.toJson(payload));
    }
}

