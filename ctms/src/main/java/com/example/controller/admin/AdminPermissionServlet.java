package com.example.controller.admin;
import java.io.IOException;
import java.util.List;

import com.example.DAO.RbacDAO;
import com.example.model.entity.Permission;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/admin/permissions")
public class AdminPermissionServlet extends HttpServlet {

    private final RbacDAO dao = new RbacDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        List<Permission> permissions = dao.findAllPer();

        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < permissions.size(); i++) {
            Permission p = permissions.get(i);
            sb.append("{")
              .append("\"permissionId\":").append(p.getPermissionId()).append(",")
              .append("\"permissionName\":\"").append(escape(p.getPermissionName())).append("\",")
              .append("\"permissionCode\":\"").append(escape(p.getPermissionCode())).append("\",")
              .append("\"module\":\"").append(escape(p.getModule())).append("\"")
              .append("}");
            if (i < permissions.size() - 1) sb.append(",");
        }
        sb.append("]");

        resp.getWriter().write(sb.toString());
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}