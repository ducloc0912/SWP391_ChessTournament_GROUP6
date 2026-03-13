package com.example.controller.staff;

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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/staff/reports")
public class StaffSystemReportServlet extends HttpServlet {

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
        if (role == null || !"STAFF".equalsIgnoreCase(role)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"message\":\"Access denied\"}");
            return;
        }

        String status = request.getParameter("status");
        List<ReportDTO> list = reportService.getSystemReportsForStaff(status);
        response.getWriter().write(gson.toJson(list));
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();

        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            result.put("success", false);
            result.put("message", "Unauthorized");
            response.getWriter().write(gson.toJson(result));
            return;
        }
        String role = (String) session.getAttribute("role");
        if (role == null || !"STAFF".equalsIgnoreCase(role)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            result.put("success", false);
            result.put("message", "Access denied");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        User staff = (User) session.getAttribute("user");

        try {
            Map<String, Object> body = gson.fromJson(request.getReader(), Map.class);
            if (body == null || !body.containsKey("reportId")) {
                throw new IllegalArgumentException("Thiếu reportId.");
            }
            int reportId = ((Double) body.get("reportId")).intValue();
            boolean valid = body.get("valid") != null && Boolean.TRUE.equals(body.get("valid"));
            String note = body.get("note") != null ? body.get("note").toString() : "";

            boolean ok = reportService.decideSystemReport(reportId, valid, note, staff.getUserId());
            if (ok) {
                result.put("success", true);
                result.put("message", "Cập nhật report thành công.");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                result.put("success", false);
                result.put("message", "Không thể cập nhật report.");
            }
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            result.put("success", false);
            result.put("message", "Có lỗi xảy ra khi cập nhật report.");
        }

        response.getWriter().write(gson.toJson(result));
    }
}

