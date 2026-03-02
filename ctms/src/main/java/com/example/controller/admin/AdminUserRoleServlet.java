/*package com.example.controller.admin;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.example.DAO.RbacDAO;
import com.example.model.entity.Role;
import com.example.util.BodyUtil;
import com.example.util.JsonMiniUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/admin/users/*")
public class AdminUserRoleServlet extends HttpServlet {
    
    private final RbacDAO dao = new RbacDAO();

    // Pattern để kiểm tra URL dạng: /123/roles
    private final Pattern userRolePattern = Pattern.compile("/(\\d+)/roles");

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        setupResponse(resp);
        String pathInfo = req.getPathInfo(); // Ví dụ: /5/roles

        if (pathInfo == null) {
            sendError(resp, 400, "Invalid path");
            return;
        }

        // Kiểm tra xem URL có khớp format /{id}/roles không
        Matcher matcher = userRolePattern.matcher(pathInfo);
        
        if (!matcher.matches()) {
            sendError(resp, 404, "Invalid path for role update");
            return;
        }

        try {
            // Lấy ID từ nhóm regex đầu tiên (\\d+)
            int userId = Integer.parseInt(matcher.group(1)); 
            
            String body = BodyUtil.readBody(req);
            List<Integer> roleIds = JsonMiniUtil.getIntList(body, "roleIds");
            
            dao.replaceUserRoles(userId, roleIds);
            
            resp.getWriter().write("{\"message\":\"User roles updated successfully\"}");

        } catch (NumberFormatException e) {
            sendError(resp, 400, "Invalid User ID format");
        } catch (Exception e) {
            e.printStackTrace();
            sendError(resp, 500, "Internal Server Error");
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        setupResponse(resp);
        String pathInfo = req.getPathInfo();

        // ---------------------------------------------------------
        // TRƯỜNG HỢP 1: Lấy danh sách roles của 1 user cụ thể
        // URL: /api/admin/users/{id}/roles
        // ---------------------------------------------------------
        if (pathInfo != null) {
            Matcher matcher = userRolePattern.matcher(pathInfo);
            if (matcher.matches()) {
                try {
                    int userId = Integer.parseInt(matcher.group(1));
                    Set<Integer> roleIds = dao.getRoleIdsByUser(userId);
                    StringBuilder sb = new StringBuilder();
                    sb.append("{\"userId\":").append(userId).append(",\"roleIds\":[");
                    int i = 0;
                    for (Integer roleId : roleIds) {
                        if (i++ > 0) sb.append(",");
                        sb.append(roleId);
                    }
                    sb.append("]}");
                    
                    resp.getWriter().write(sb.toString());
                    return; // Kết thúc hàm tại đây
                } catch (Exception e) {
                    sendError(resp, 500, "Error getting user roles");
                    return;
                }
            }
        }

        // ---------------------------------------------------------
        // TRƯỜNG HỢP 2: Lấy danh sách TẤT CẢ roles (Metadata)
        // URL: /api/admin/users/all-roles (hoặc logic cũ của bạn)
        // ---------------------------------------------------------
        if ("/all-roles".equals(pathInfo)) {
            List<Role> roles = dao.findAllRole(); // Giả sử DAO có hàm này
            String jsonResult = convertRolesToJson(roles);
            resp.getWriter().write(jsonResult);
            return;
        }

        // Nếu không khớp trường hợp nào
        sendError(resp, 404, "Endpoint not found");
    }

    // --- Helper Methods ---

    private void setupResponse(HttpServletResponse resp) {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");
    }

    private void sendError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        resp.getWriter().write("{\"error\":\"" + message + "\"}");
    }

    private String convertRolesToJson(List<Role> roles) {
        if (roles == null || roles.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < roles.size(); i++) {
            Role r = roles.get(i);
            sb.append("{")
              .append("\"roleId\":").append(r.getRoleId()).append(",")
              .append("\"roleName\":\"").append(escape(r.getRoleName())).append("\",")
              .append("\"description\":\"").append(escape(nullToEmpty(r.getDescription())))
              .append("\"}");
            if (i < roles.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}*/