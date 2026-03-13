package com.example.controller.user;

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

@WebServlet("/api/reports")
public class UserReportServlet extends HttpServlet {

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
        User currentUser = (User) session.getAttribute("user");
        List<ReportDTO> list = reportService.getReportsByReporter(currentUser.getUserId());
        response.getWriter().write(gson.toJson(list));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();

        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            result.put("success", false);
            result.put("message", "Vui lòng đăng nhập trước khi gửi report.");
            response.getWriter().write(gson.toJson(result));
            return;
        }

        User currentUser = (User) session.getAttribute("user");

        try {
            Map<String, Object> body = gson.fromJson(request.getReader(), Map.class);
            if (body == null) {
                throw new IllegalArgumentException("Dữ liệu report không hợp lệ.");
            }

            String type = body.get("type") != null ? body.get("type").toString() : null;
            String description = body.get("description") != null ? body.get("description").toString() : null;
            String evidenceUrl = body.get("evidenceUrl") != null ? body.get("evidenceUrl").toString() : null;

            Integer accusedId = null;
            if (body.get("accusedId") != null) {
                accusedId = ((Double) body.get("accusedId")).intValue();
            }
            Integer matchId = null;
            if (body.get("matchId") != null) {
                matchId = ((Double) body.get("matchId")).intValue();
            }

            ReportDTO dto = new ReportDTO();
            dto.setReporterId(currentUser.getUserId());
            dto.setAccusedId(accusedId);
            dto.setMatchId(matchId);
            dto.setDescription(description);
            dto.setEvidenceUrl(evidenceUrl);
            dto.setType(type);

            int id = reportService.createReport(dto);
            if (id > 0) {
                result.put("success", true);
                result.put("reportId", id);
                result.put("message", "Gửi report thành công.");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                result.put("success", false);
                result.put("message", "Gửi report thất bại. Vui lòng thử lại sau.");
            }
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            result.put("success", false);
            result.put("message", "Có lỗi xảy ra khi gửi report.");
        }

        response.getWriter().write(gson.toJson(result));
    }
}

