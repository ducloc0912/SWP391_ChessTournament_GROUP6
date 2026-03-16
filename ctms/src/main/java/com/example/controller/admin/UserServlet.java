package com.example.controller.admin;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.*;

import com.example.DAO.ProfileDAO;
import com.example.DAO.RbacDAO;
import com.example.DAO.TournamentDAO;
import com.example.DAO.UserDAO;
import com.example.model.entity.User;
import com.example.model.entity.UserRole;
import com.example.util.BodyUtil;
import com.example.util.DBContext;
import com.example.util.JsonMiniUtil;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet({"/api/admin/users", "/api/admin/users/*"})
public class UserServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();
    private final ProfileDAO profileDAO = new ProfileDAO();
    private final TournamentDAO tournamentDAO = new TournamentDAO();
    private final RbacDAO rbacDAO = new RbacDAO();

    private final Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX")
            .create();

    private static class CreateStaffRequest {
        String username;
        String email;
        String password;
        String firstName;
        String lastName;
        String phoneNumber;
        String birthday;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo();

        if (pathInfo == null || pathInfo.isBlank() || "/".equals(pathInfo)) {
            String q = req.getParameter("q");
            String role = req.getParameter("role");

            List<UserRole> users = userDAO.getUsersForAdmin(q, role);
            resp.getWriter().print(gson.toJson(users));
            return;
        }

        String[] parts = pathInfo.split("/");
        if (parts.length < 2 || parts[1].isBlank()) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().print("{\"success\":false,\"message\":\"Not found\"}");
            return;
        }

        int userId;
        try {
            userId = Integer.parseInt(parts[1]);
        } catch (NumberFormatException ex) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid userId\"}");
            return;
        }

        if (parts.length == 3 && "roles".equalsIgnoreCase(parts[2])) {
            Set<Integer> roleIds = rbacDAO.getRoleIdsByUser(userId);
            Map<String, Object> out = new HashMap<>();
            out.put("userId", userId);
            out.put("roleIds", new ArrayList<>(roleIds));
            resp.getWriter().print(gson.toJson(out));
            return;
        }

        if (parts.length >= 3 && "tournament-history".equalsIgnoreCase(parts[2])) {
            String status = req.getParameter("status");

            List<Map<String, Object>> items = tournamentDAO.getUserTournamentHistory(userId, status);

            Map<String, Object> data = new HashMap<>();
            data.put("items", items);

            Map<String, Object> out = new HashMap<>();
            out.put("success", true);
            out.put("data", data);

            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().print(gson.toJson(out));
            return;
        }

        if (parts.length == 2) {
            Map<String, Object> user = profileDAO.getUserBasic(userId);
            if (user == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().print("{\"success\":false,\"message\":\"User not found\"}");
                return;
            }

            String roleName = getRoleNameByUserId(userId);
            Map<String, Object> stats = getStatsByRole(userId, roleName);

            Map<String, Object> data = new HashMap<>();
            data.put("user", user);
            data.put("role", roleName);
            data.put("stats", stats);

            Map<String, Object> out = new HashMap<>();
            out.put("success", true);
            out.put("data", data);

            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().print(gson.toJson(out));
            return;
        }

        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
        resp.getWriter().print("{\"success\":false,\"message\":\"Not found\"}");
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().print("{\"success\":false,\"message\":\"Not found\"}");
            return;
        }

        String[] parts = pathInfo.split("/");
        if (parts.length == 3 && "roles".equalsIgnoreCase(parts[2])) {
            int userId;
            try {
                userId = Integer.parseInt(parts[1]);
            } catch (NumberFormatException ex) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().print("{\"success\":false,\"message\":\"Invalid userId\"}");
                return;
            }
            String body = BodyUtil.readBody(req);
            List<Integer> roleIds = JsonMiniUtil.getIntList(body, "roleIds");
            rbacDAO.replaceUserRoles(userId, roleIds);
            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().print("{\"success\":true,\"message\":\"User roles updated\"}");
            return;
        }

        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
        resp.getWriter().print("{\"success\":false,\"message\":\"Not found\"}");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo();

        if ("/create-staff".equalsIgnoreCase(pathInfo)) {
            handleCreateStaff(req, resp);
            return;
        }

        if (pathInfo == null || pathInfo.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().print("{\"message\":\"Not found\"}");
            return;
        }

        String[] parts = pathInfo.split("/");
        if (parts.length >= 3 && "toggle-active".equalsIgnoreCase(parts[2])) {

            int userId;
            try {
                userId = Integer.parseInt(parts[1]);
            } catch (NumberFormatException ex) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().print("{\"message\":\"Invalid userId\"}");
                return;
            }

            Boolean active = userDAO.toggleUserActiveAndReturnStatus(userId);

            if (active == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().print("{\"message\":\"User not found\"}");
                return;
            }

            Map<String, Object> out = new HashMap<>();
            out.put("userId", userId);
            out.put("isActive", active);

            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().print(gson.toJson(out));
            return;
        }

        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
        resp.getWriter().print("{\"message\":\"Not found\"}");
    }

    private void handleCreateStaff(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String body = BodyUtil.readBody(req);
        CreateStaffRequest requestData = gson.fromJson(body, CreateStaffRequest.class);

        if (requestData == null) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Dữ liệu gửi lên không hợp lệ.");
            return;
        }

        String username = safeTrim(requestData.username);
        String email = safeTrim(requestData.email);
        String password = safeTrim(requestData.password);
        String firstName = safeTrim(requestData.firstName);
        String lastName = safeTrim(requestData.lastName);
        String phoneNumber = safeTrim(requestData.phoneNumber);
        String birthdayRaw = safeTrim(requestData.birthday);

        if (username.isEmpty()) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Username không được để trống.");
            return;
        }

        if (email.isEmpty()) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Email không được để trống.");
            return;
        }

        if (password.isEmpty()) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Mật khẩu không được để trống.");
            return;
        }

        if (password.length() < 6) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }

        if (firstName.isEmpty()) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Tên không được để trống.");
            return;
        }

        if (phoneNumber.isEmpty()) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Số điện thoại không được để trống.");
            return;
        }

        if (birthdayRaw.isEmpty()) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Ngày sinh không được để trống.");
            return;
        }

        if (userDAO.isUsernameExists(username)) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Username đã tồn tại.");
            return;
        }

        if (userDAO.isEmailExists(email)) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Email đã tồn tại.");
            return;
        }

        if (userDAO.isPhoneExists(phoneNumber)) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Số điện thoại đã tồn tại.");
            return;
        }

        Date birthdaySql;
        try {
            birthdaySql = Date.valueOf(birthdayRaw);
        } catch (Exception ex) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Ngày sinh không đúng định dạng yyyy-MM-dd.");
            return;
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(hashSha256(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhoneNumber(phoneNumber);
        user.setAddress(null);
        user.setBirthday(new Timestamp(birthdaySql.getTime()));
        user.setIsActive(true);

        boolean created = userDAO.createStaffAccount(user);
        if (!created) {
            writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Tạo tài khoản staff thất bại.");
            return;
        }

        Map<String, Object> out = new HashMap<>();
        out.put("success", true);
        out.put("message", "Tạo tài khoản staff thành công.");

        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().print(gson.toJson(out));
    }

    private void writeError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);

        Map<String, Object> out = new HashMap<>();
        out.put("success", false);
        out.put("message", message);

        resp.getWriter().print(gson.toJson(out));
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private String hashSha256(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashed = md.digest(raw.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder();
            for (byte b : hashed) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Hash password failed", e);
        }
    }

    private String getRoleNameByUserId(int userId) {
        String sql = """
            SELECT TOP 1 r.role_name
            FROM User_Role ur
            INNER JOIN Roles r ON ur.role_id = r.role_id
            WHERE ur.user_id = ?
        """;

        try (Connection con = DBContext.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String role = rs.getString("role_name");
                    if (role != null && !role.isBlank()) return role.trim();
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return "Player";
    }

    private Map<String, Object> getStatsByRole(int userId, String roleName) {
        if (roleName == null) roleName = "Player";
        String key = roleName.trim().toLowerCase();

        try {
            switch (key) {
                case "player":
                    return profileDAO.getPlayerStats(userId);
                case "tournamentleader":
                    return profileDAO.getLeaderStats(userId);
                case "referee":
                    return profileDAO.getRefereeStats(userId);
                case "staff":
                    return profileDAO.getStaffStats(userId);
                default:
                    return new HashMap<>();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new HashMap<>();
        }
    }
}