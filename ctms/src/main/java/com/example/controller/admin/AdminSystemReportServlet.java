package com.example.controller.admin;

import com.example.model.dto.ReportDTO;
import com.example.model.entity.User;
import com.example.service.common.ReportService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.List;

/**
 * Admin xem system report (TechnicalIssue / Other) — report đã được staff xác thực chuyển lên.
 */
@WebServlet("/api/admin/reports")
public class AdminSystemReportServlet extends HttpServlet {

    private final ReportService reportService = new ReportService();
    private final Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd HH:mm:ss")
            .create();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"message\":\"Unauthorized\"}");
            return;
        }
        String role = (String) session.getAttribute("role");
        if (role == null || !"ADMIN".equalsIgnoreCase(role)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"message\":\"Access denied\"}");
            return;
        }

        String status = request.getParameter("status");
        List<ReportDTO> list = reportService.getSystemReportsForAdmin(status);
        response.getWriter().write(gson.toJson(list));
    }
}
