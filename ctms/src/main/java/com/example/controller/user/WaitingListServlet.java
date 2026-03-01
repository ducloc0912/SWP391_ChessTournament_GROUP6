package com.example.controller.user;

import com.example.DAO.WaitingListDAO;
import com.example.DAO.TournamentDAO;
import com.example.model.dto.TournamentDTO;
import com.example.model.entity.User;
import com.example.model.entity.WaitingList;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/waiting-list")
public class WaitingListServlet extends HttpServlet {
    private final WaitingListDAO dao = new WaitingListDAO();
    private final TournamentDAO tournamentDAO = new TournamentDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        String idParam = req.getParameter("id");
        String tournamentIdParam = req.getParameter("tournamentId");

        if (idParam != null) {
            WaitingList row = dao.getById(Integer.parseInt(idParam));
            if (row == null) {
                write(resp, HttpServletResponse.SC_NOT_FOUND, false, "Not found", null);
                return;
            }
            write(resp, HttpServletResponse.SC_OK, true, null, row);
            return;
        }

        if (tournamentIdParam == null) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Missing tournamentId", null);
            return;
        }

        List<WaitingList> list = dao.getByTournamentId(Integer.parseInt(tournamentIdParam));
        write(resp, HttpServletResponse.SC_OK, true, null, list);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

         HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            write(resp, HttpServletResponse.SC_UNAUTHORIZED, false, "Not logged in", null);
            return;
        }

         User currentUser = (User) session.getAttribute("user");
         JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);

        if (body == null || !body.has("tournamentId") || body.get("tournamentId").isJsonNull()) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Thiếu tournamentId", null);
            return;
        }

        int tournamentId = body.get("tournamentId").getAsInt();

        TournamentDTO tournament = tournamentDAO.getTournamentById(tournamentId);
        if (tournament == null) {
            write(resp, HttpServletResponse.SC_NOT_FOUND, false, "Không tìm thấy giải đấu", null);
            return;
        }

        Timestamp registrationDeadline = tournament.getRegistrationDeadline();
        if (registrationDeadline != null && registrationDeadline.before(new Timestamp(System.currentTimeMillis()))) {
            write(resp, HttpServletResponse.SC_CONFLICT, false, "Đã quá hạn đăng ký", null);
            return;
        }

        if (dao.exists(tournamentId, currentUser.getUserId())) {
            write(resp, HttpServletResponse.SC_CONFLICT, false, "Bạn đã đăng ký giải này rồi", null);
            return;
        }

        String fullName = getString(body, "fullName");
        String username = getString(body, "username");
        String email = getString(body, "email");
        String phone = getString(body, "phone");
        Integer rankAtRegistration = firstInteger(body, "rankAtRegistration", "rank");
        String note = getString(body, "note");

        String fallbackFullName = ((currentUser.getFirstName() == null ? "" : currentUser.getFirstName()) + " "
                + (currentUser.getLastName() == null ? "" : currentUser.getLastName())).trim();

        WaitingList e = new WaitingList();
        e.setTournamentId(tournamentId);
        e.setUserId(currentUser.getUserId());
        e.setRankAtRegistration(rankAtRegistration != null ? rankAtRegistration : currentUser.getRank());
        e.setStatus("Pending");
        e.setNote(note);
        e.setRegistrationFullName(isBlank(fullName) ? fallbackFullName : fullName);
        e.setRegistrationUsername(isBlank(username) ? currentUser.getUsername() : username);
        e.setRegistrationEmail(isBlank(email) ? currentUser.getEmail() : email);
        e.setRegistrationPhone(isBlank(phone) ? currentUser.getPhoneNumber() : phone);

        boolean ok = dao.create(e);
        if (!ok) {
            write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Đăng ký thất bại", null);
            return;
        }

        write(resp, HttpServletResponse.SC_OK, true, "Đăng ký thành công", null);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            write(resp, HttpServletResponse.SC_UNAUTHORIZED, false, "Not logged in", null);
            return;
        }

        String idParam = req.getParameter("id");
        if (idParam == null) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Missing id", null);
            return;
        }

        User currentUser = (User) session.getAttribute("user");
        String action = req.getParameter("action");

        if ("approve".equalsIgnoreCase(action)) {
            String role = String.valueOf(session.getAttribute("role"));
            if (!canApproveWaitingList(role)) {
                write(resp, HttpServletResponse.SC_FORBIDDEN, false, "Bạn không có quyền duyệt bản ghi này", null);
                return;
            }

            String approveResult = dao.approveAndAddParticipant(Integer.parseInt(idParam), currentUser.getUserId());
            if (WaitingListDAO.APPROVE_NOT_FOUND.equals(approveResult)) {
                write(resp, HttpServletResponse.SC_NOT_FOUND, false, "Không tìm thấy bản ghi chờ", null);
                return;
            }
            if (WaitingListDAO.APPROVE_ALREADY_APPROVED.equals(approveResult)) {
                write(resp, HttpServletResponse.SC_CONFLICT, false, "Người chơi đã được duyệt trước đó", null);
                return;
            }
            if (!WaitingListDAO.APPROVE_OK.equals(approveResult)) {
                write(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, false, "Duyệt thất bại", null);
                return;
            }

            write(resp, HttpServletResponse.SC_OK, true, "Duyệt thành công", null);
            return;
        }

        JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);

        WaitingList update = new WaitingList();
        update.setWaitingId(Integer.parseInt(idParam));
        update.setRegistrationFullName(getString(body, "fullName"));
        update.setRegistrationUsername(getString(body, "username"));
        update.setRegistrationEmail(getString(body, "email"));
        update.setRegistrationPhone(getString(body, "phone"));
        update.setRankAtRegistration(firstInteger(body, "rankAtRegistration", "rank"));
        update.setNote(getString(body, "note"));

        boolean ok = dao.updateOwnRegistration(update, currentUser.getUserId());
        if (!ok) {
            write(resp, HttpServletResponse.SC_FORBIDDEN, false, "Bạn không có quyền sửa bản ghi này", null);
            return;
        }

        write(resp, HttpServletResponse.SC_OK, true, "Cập nhật thành công", null);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            write(resp, HttpServletResponse.SC_UNAUTHORIZED, false, "Not logged in", null);
            return;
        }

        String idParam = req.getParameter("id");
        if (idParam == null) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Missing id", null);
            return;
        }

        User currentUser = (User) session.getAttribute("user");
        String role = String.valueOf(session.getAttribute("role"));
        boolean canManageAll = canApproveWaitingList(role);
        boolean ok = canManageAll
                ? dao.deleteById(Integer.parseInt(idParam))
                : dao.deleteOwnRegistration(Integer.parseInt(idParam), currentUser.getUserId());
        if (!ok) {
            write(resp, HttpServletResponse.SC_FORBIDDEN, false, "Bạn không có quyền xóa bản ghi này", null);
            return;
        }

        write(resp, HttpServletResponse.SC_OK, true, "Xóa thành công", null);
    }

    private void write(HttpServletResponse resp, int status, boolean success, String message, Object data) throws IOException {
        resp.setStatus(status);
        Map<String, Object> res = new HashMap<>();
        res.put("success", success);
        if (message != null) res.put("message", message);
        if (data != null) res.put("data", data);
        resp.getWriter().write(gson.toJson(res));
    }

    private String getString(JsonObject obj, String key) {
        if (obj == null || !obj.has(key) || obj.get(key).isJsonNull()) return null;
        return obj.get(key).getAsString();
    }

    private Integer getInteger(JsonObject obj, String key) {
        if (obj == null || !obj.has(key) || obj.get(key).isJsonNull()) return null;
        try {
            return obj.get(key).getAsInt();
        } catch (Exception ex) {
            return null;
        }
    }

    private Integer firstInteger(JsonObject obj, String... keys) {
        if (keys == null) return null;
        for (String key : keys) {
            Integer value = getInteger(obj, key);
            if (value != null) return value;
        }
        return null;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private boolean canApproveWaitingList(String role) {
        if (role == null) return false;
        String normalized = role.trim().toLowerCase();
        return "admin".equals(normalized)
                || "staff".equals(normalized)
                || "tournamentleader".equals(normalized);
    }

}