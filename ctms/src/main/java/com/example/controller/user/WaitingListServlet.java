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
import java.util.regex.Pattern;

@WebServlet("/api/waiting-list")
public class WaitingListServlet extends HttpServlet {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9+\\s()\\-]{8,15}$");

    private final WaitingListDAO dao = new WaitingListDAO();
    private final TournamentDAO tournamentDAO = new TournamentDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        String idParam = req.getParameter("id");
        String tournamentIdParam = req.getParameter("tournamentId");
        String userIdParam = req.getParameter("userId");

        if (idParam != null) {
            Integer waitingId = parseIntOrNull(idParam);
            if (waitingId == null) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Invalid id", null);
                return;
            }
            WaitingList row = dao.getById(waitingId);
            if (row == null) {
                write(resp, HttpServletResponse.SC_NOT_FOUND, false, "Not found", null);
                return;
            }
            write(resp, HttpServletResponse.SC_OK, true, null, row);
            return;
        }

        if (userIdParam != null) {
            HttpSession session = req.getSession(false);
            if (session == null || session.getAttribute("user") == null) {
                write(resp, HttpServletResponse.SC_UNAUTHORIZED, false, "Not logged in", null);
                return;
            }
            User currentUser = (User) session.getAttribute("user");
            String role = String.valueOf(session.getAttribute("role"));
            Integer requestedUserId = parseIntOrNull(userIdParam);
            if (requestedUserId == null) {
                write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Invalid userId", null);
                return;
            }
            boolean canManageAll = canApproveWaitingList(role);
            if (!canManageAll && currentUser.getUserId() != requestedUserId.intValue()) {
                write(resp, HttpServletResponse.SC_FORBIDDEN, false, "Bạn không có quyền xem dữ liệu này", null);
                return;
            }
            List<Map<String, Object>> list = dao.getPendingByUserId(requestedUserId);
            write(resp, HttpServletResponse.SC_OK, true, null, list);
            return;
        }

        if (tournamentIdParam == null) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Missing tournamentId", null);
            return;
        }

        Integer tournamentId = parseIntOrNull(tournamentIdParam);
        if (tournamentId == null) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Invalid tournamentId", null);
            return;
        }

        List<WaitingList> list = dao.getByTournamentId(tournamentId);
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

        Integer tournamentIdObj = firstInteger(body, "tournamentId");
        if (tournamentIdObj == null) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "tournamentId không hợp lệ", null);
            return;
        }
        int tournamentId = tournamentIdObj;

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

        String resolvedFullName = isBlank(fullName) ? fallbackFullName : fullName.trim();
        String resolvedUsername = isBlank(username) ? currentUser.getUsername() : username.trim();
        String resolvedEmail = isBlank(email) ? currentUser.getEmail() : email.trim();
        String resolvedPhone = isBlank(phone) ? currentUser.getPhoneNumber() : phone.trim();
        Integer resolvedRank = rankAtRegistration != null ? rankAtRegistration : currentUser.getRank();

        String validationError = validateRegistrationInput(
                resolvedFullName,
                resolvedUsername,
                resolvedEmail,
                resolvedPhone,
                resolvedRank
        );
        if (validationError != null) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, validationError, null);
            return;
        }

        WaitingList e = new WaitingList();
        e.setTournamentId(tournamentId);
        e.setUserId(currentUser.getUserId());
        e.setRankAtRegistration(resolvedRank);
        e.setStatus("Pending");
        e.setNote(note);
        e.setRegistrationFullName(resolvedFullName);
        e.setRegistrationUsername(resolvedUsername);
        e.setRegistrationEmail(resolvedEmail);
        e.setRegistrationPhone(resolvedPhone);

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
        Integer waitingId = parseIntOrNull(idParam);
        if (waitingId == null) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Invalid id", null);
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

            String approveResult = dao.approveAndAddParticipant(waitingId, currentUser.getUserId());
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
        String fullName = getString(body, "fullName");
        String username = getString(body, "username");
        String email = getString(body, "email");
        String phone = getString(body, "phone");
        Integer rankAtRegistration = firstInteger(body, "rankAtRegistration", "rank");
        String validationError = validateRegistrationInput(
                fullName == null ? null : fullName.trim(),
                username == null ? null : username.trim(),
                email == null ? null : email.trim(),
                phone == null ? null : phone.trim(),
                rankAtRegistration
        );
        if (validationError != null) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, validationError, null);
            return;
        }

        update.setWaitingId(waitingId);
        update.setRegistrationFullName(fullName == null ? null : fullName.trim());
        update.setRegistrationUsername(username == null ? null : username.trim());
        update.setRegistrationEmail(email == null ? null : email.trim());
        update.setRegistrationPhone(phone == null ? null : phone.trim());
        update.setRankAtRegistration(rankAtRegistration);
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
        Integer waitingId = parseIntOrNull(idParam);
        if (waitingId == null) {
            write(resp, HttpServletResponse.SC_BAD_REQUEST, false, "Invalid id", null);
            return;
        }

        User currentUser = (User) session.getAttribute("user");
        String role = String.valueOf(session.getAttribute("role"));
        boolean canManageAll = canApproveWaitingList(role);
        boolean ok = canManageAll
                ? dao.deleteById(waitingId)
                : dao.deleteOwnRegistration(waitingId, currentUser.getUserId());
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

    private Integer parseIntOrNull(String raw) {
        if (raw == null) return null;
        try {
            return Integer.parseInt(raw.trim());
        } catch (Exception ex) {
            return null;
        }
    }

    private String validateRegistrationInput(
            String fullName,
            String username,
            String email,
            String phone,
            Integer rankAtRegistration
    ) {
        if (isBlank(fullName)) return "Họ và tên không được để trống.";
        if (isBlank(username)) return "Tên in-game không được để trống.";
        if (isBlank(email)) return "Email không được để trống.";
        if (isBlank(phone)) return "SĐT không được để trống.";
        if (rankAtRegistration == null) return "Bậc rank không được để trống.";
        if (!EMAIL_PATTERN.matcher(email).matches()) return "Email không đúng định dạng.";
        if (!PHONE_PATTERN.matcher(phone).matches()) return "SĐT không hợp lệ.";
        if (rankAtRegistration < 0) return "Bậc rank phải là số nguyên >= 0.";
        return null;
    }

    private boolean canApproveWaitingList(String role) {
        if (role == null) return false;
        String normalized = role.trim().toLowerCase();
        return "admin".equals(normalized)
                || "staff".equals(normalized)
                || "tournamentleader".equals(normalized);
    }

}