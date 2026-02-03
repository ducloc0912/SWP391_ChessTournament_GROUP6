package com.example.controller.admin;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.DAO.UserDAO;
import com.example.model.UserRole;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet({"/api/admin/users", "/api/admin/users/*"})
public class UserServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();

    private final Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX")
            .create();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // CORSFilter đã xử lý OPTIONS
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String q = req.getParameter("q");
        String role = req.getParameter("role");

        List<UserRole> users = userDAO.getUsersForAdmin(q, role);
        resp.getWriter().print(gson.toJson(users));
    }

    /**
     * POST /api/admin/users/{id}/toggle-active
     * ✅ Update DB thật, trả về isActive mới đọc từ DB
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

        String[] parts = pathInfo.split("/");
        // ["", "12", "toggle-active"]
        if (parts.length >= 3 && "toggle-active".equalsIgnoreCase(parts[2])) {

            int userId;
            try {
                userId = Integer.parseInt(parts[1]);
            } catch (NumberFormatException ex) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().print("{\"message\":\"Invalid userId\"}");
                return;
            }

            // ✅ toggle và lấy trạng thái mới từ DB
            Boolean active = userDAO.toggleUserActiveAndReturnStatus(userId);

            if (active == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().print("{\"message\":\"User not found\"}");
                return;
            }

            Map<String, Object> out = new HashMap<>();
            out.put("userId", userId);
            out.put("isActive", active);
resp.getWriter().print(gson.toJson(out));
            return;
        }

        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
        resp.getWriter().print("{\"message\":\"Not found\"}");
    }
}