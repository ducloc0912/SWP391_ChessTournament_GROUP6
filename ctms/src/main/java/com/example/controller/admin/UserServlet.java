package com.example.controller.admin;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

import com.example.DAO.ProfileDAO;
import com.example.DAO.RbacDAO;
import com.example.DAO.TournamentDAO;
import com.example.DAO.UserDAO;
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

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // ✅ Quan trọng: trả 200/204 để preflight qua được
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo(); // null | "" | "/12" | "/12/tournament-history"

        // 1) List: /api/admin/users
        if (pathInfo == null || pathInfo.isBlank() || "/".equals(pathInfo)) {
            String q = req.getParameter("q");
            String role = req.getParameter("role");

            List<UserRole> users = userDAO.getUsersForAdmin(q, role);
            resp.getWriter().print(gson.toJson(users));
            return;
        }

        String[] parts = pathInfo.split("/"); // ["", "12", "tournament-history"]
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

        // 2) User roles: GET /api/admin/users/{id}/roles
        if (parts.length == 3 && "roles".equalsIgnoreCase(parts[2])) {
            Set<Integer> roleIds = rbacDAO.getRoleIdsByUser(userId);
            Map<String, Object> out = new HashMap<>();
            out.put("userId", userId);
            out.put("roleIds", new ArrayList<>(roleIds));
            resp.getWriter().print(gson.toJson(out));
            return;
        }

        // 3) Tournament history: /api/admin/users/{id}/tournament-history
        if (parts.length >= 3 && "tournament-history".equalsIgnoreCase(parts[2])) {
            String status = req.getParameter("status"); // Ongoing | Completed | null

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

        // 4) Detail: /api/admin/users/{id}
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

    /**
     * PUT /api/admin/users/{id}/roles — body: { "roleIds": [1, 2] }
     */
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

    /**
     * POST /api/admin/users/{id}/toggle-active
     */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo(); // "/12/toggle-active"
        if (pathInfo == null || pathInfo.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().print("{\"message\":\"Not found\"}");
            return;
        }

        String[] parts = pathInfo.split("/"); // ["", "12", "toggle-active"]
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
