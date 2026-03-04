package com.example.controller.referee;

import com.example.DAO.ParticipantDAO;
import com.example.DAO.RefereeInvitationDAO;
import com.example.DAO.TournamentRefereeDAO;
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
import java.util.Map;

@WebServlet("/api/referee/invitations")
public class RefereeInvitationServlet extends HttpServlet {

    private RefereeInvitationDAO invitationDAO;
    private TournamentRefereeDAO tournamentRefereeDAO;
    private ParticipantDAO participantDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        invitationDAO = new RefereeInvitationDAO();
        tournamentRefereeDAO = new TournamentRefereeDAO();
        participantDAO = new ParticipantDAO();
        gson = new GsonBuilder().setDateFormat("yyyy-MM-dd HH:mm:ss").create();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("[]");
            return;
        }
        User user = (User) session.getAttribute("user");
        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            response.getWriter().write("[]");
            return;
        }
        var list = invitationDAO.getPendingForEmail(email);
        response.getWriter().write(gson.toJson(list));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");
        if (!"accept".equals(action) && !"reject".equals(action)) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"success\": false, \"message\": \"Invalid action\"}");
            return;
        }

        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\": false, \"message\": \"Vui lòng đăng nhập bằng tài khoản trọng tài\"}");
            return;
        }

        User user = (User) session.getAttribute("user");
        Integer userId = user.getUserId();
        if (userId == null || userId <= 0) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\": false, \"message\": \"Tài khoản không hợp lệ\"}");
            return;
        }

        Map<String, Object> result = new HashMap<>();
        String invIdParam = request.getParameter("invitationId");
        int invId;
        try {
            invId = Integer.parseInt(invIdParam);
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            result.put("success", false);
            result.put("message", "Missing or invalid invitationId");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        Map<String, Object> inv = invitationDAO.findPendingById(invId);
        if (inv == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            result.put("success", false);
            result.put("message", "Lời mời không tồn tại hoặc đã hết hạn.");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        int invitationId = (Integer) inv.get("invitationId");
        int tournamentId = (Integer) inv.get("tournamentId");
        String invitedEmail = (String) inv.get("invitedEmail");
        String refereeRole = (String) inv.get("refereeRole");

        // Bảo vệ: email lời mời phải trùng với email user đang đăng nhập (nếu có)
        if (invitedEmail != null && user.getEmail() != null
                && !invitedEmail.trim().equalsIgnoreCase(user.getEmail().trim())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            result.put("success", false);
            result.put("message", "Lời mời này không thuộc về tài khoản hiện tại.");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        if ("reject".equals(action)) {
            boolean rejected = invitationDAO.markRejected(invitationId);
            if (!rejected) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                result.put("success", false);
                result.put("message", "Không thể từ chối lời mời. Có thể lời mời đã được xử lý trước đó.");
            } else {
                result.put("success", true);
                result.put("message", "Bạn đã từ chối lời mời trọng tài.");
            }
            response.getWriter().write(gson.toJson(result));
            return;
        }

        // Nếu user đang là participant active trong cùng giải thì từ chối nhận làm trọng tài
        boolean isPlayerActive = participantDAO.existsActiveByTournamentAndUser(tournamentId, userId);
        if (isPlayerActive) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            result.put("success", false);
            result.put("message", "Bạn đang là người chơi trong giải này, không thể nhận lời mời trọng tài.");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        boolean accepted = invitationDAO.markAccepted(invitationId, userId);
        if (!accepted) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            result.put("success", false);
            result.put("message", "Không thể cập nhật trạng thái lời mời. Có thể lời mời đã được xử lý trước đó.");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        // Gán trọng tài vào bảng Tournament_Referee
        boolean assigned = tournamentRefereeDAO.assignReferee(
                tournamentId,
                userId,
                refereeRole != null && !refereeRole.isBlank() ? refereeRole : "Assistant",
                null,
                "Accepted from invitation"
        );

        result.put("success", assigned);
        result.put("message", assigned
                ? "Bạn đã chấp nhận lời mời và được gán làm trọng tài của giải."
                : "Đã chấp nhận lời mời nhưng không thể gán bạn làm trọng tài. Vui lòng liên hệ ban tổ chức.");
        response.getWriter().write(gson.toJson(result));
    }
}

