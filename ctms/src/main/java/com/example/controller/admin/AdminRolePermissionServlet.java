package com.example.controller.admin;

import java.io.IOException;
import java.util.List;
import java.util.Set;

import com.example.DAO.RbacDAO;
import com.example.DAO.RolePermissionDAO;
import com.example.model.entity.Role;
import com.example.service.user.AuthorizationService;
import com.example.util.BodyUtil;
import com.example.util.JsonMiniUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/admin/roles/*")
public class AdminRolePermissionServlet extends HttpServlet {
    private final RolePermissionDAO dao = new RolePermissionDAO();
    private final AuthorizationService authzService = new AuthorizationService();
    private final RbacDAO rbacDao = new RbacDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo(); // null, "/" hoặc "/{id}/permissions"

        // GET /api/admin/roles  -> list roles
        if (pathInfo == null || "/".equals(pathInfo)) {
            List<Role> roles = rbacDao.findAllRole();
            resp.getWriter().write(convertRolesToJson(roles));
            return;
        }

        // GET /api/admin/roles/{id}/permissions
        String[] parts = pathInfo.split("/");
        // ["", "{id}", "permissions"]
        if (parts.length == 3 && "permissions".equals(parts[2])) {
            int roleId = Integer.parseInt(parts[1]);
            Set<Integer> ids = rbacDao.getPermissionIdsByRole(roleId);
            resp.getWriter().write(permissionIdsJson(roleId, ids));
            return;
        }

        resp.setStatus(404);
        resp.getWriter().write("{\"error\":\"Not found\"}");
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // PUT /api/admin/roles/{id}/permissions
        String pathInfo = req.getPathInfo(); // "/{id}/permissions"
        if (pathInfo == null) {
            resp.setStatus(404);
            return;
        }
        String[] parts = pathInfo.split("/");
        if (parts.length != 3 || !"permissions".equals(parts[2])) {
            resp.setStatus(404);
            return;
        }

        int roleId = Integer.parseInt(parts[1]);
        String body = BodyUtil.readBody(req);
        List<Integer> permissionIds = JsonMiniUtil.getIntList(body, "permissionIds");

        dao.replaceRolePermissions(roleId, permissionIds);

        // quyền thay đổi -> xóa cache permission trong session hiện tại (admin)
        authzService.invalidatePermissionCache(req.getSession());

        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write("{\"message\":\"updated\"}");
    }

    private String permissionIdsJson(int roleId, Set<Integer> ids) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"roleId\":").append(roleId).append(",\"permissionIds\":[");
        int i = 0;
        for (Integer x : ids) {
            if (i++ > 0) sb.append(",");
            sb.append(x);
        }
        sb.append("]}");
        return sb.toString();
    }

    private String convertRolesToJson(List<Role> roles) {
        if (roles == null || roles.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < roles.size(); i++) {
            Role r = roles.get(i);
            sb.append("{")
              .append("\"roleId\":").append(r.getRoleId()).append(",")
              .append("\"roleName\":\"").append(escape(r.getRoleName())).append("\",")
              .append("\"description\":\"").append(escape(nullToEmpty(r.getDescription()))).append("\"")
              .append("}");
            if (i < roles.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    private String nullToEmpty(String s) { return s == null ? "" : s; }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}