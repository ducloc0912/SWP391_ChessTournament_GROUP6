package com.example.controller.staff;

import com.example.model.entity.Tournament;
import com.example.model.entity.TournamentApprovalLog;
import com.example.model.entity.TournamentStaff;
import com.example.model.enums.ApprovalAction;
import com.example.model.enums.TournamentStatus;
import com.example.service.staff.TournamentStaffService;
import com.example.util.LocalDateTimeAdapter;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/staff/tournaments")
public class StaffTournamentController extends HttpServlet {
    private final TournamentStaffService service = new TournamentStaffService();
    private final Gson gson;

    public StaffTournamentController() {
        this.gson = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
                .create();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        if ("detail".equals(action)) {
            String idStr = req.getParameter("id");
            if (idStr != null) {
                int id = Integer.parseInt(idStr);
                Tournament t = service.getTournamentById(id);
                List<TournamentApprovalLog> logs = service.getTournamentLogs(id);

                Map<String, Object> result = new HashMap<>();
                result.put("tournament", t);
                result.put("logs", logs);
                resp.getWriter().write(gson.toJson(result));
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }
        } else {
            // Default: list all
            List<Tournament> list = service.getAllTournaments();
            resp.getWriter().write(gson.toJson(list));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Map<String, Object> responseMap = new HashMap<>();

        try {
            if ("updateStatus".equals(action)) {
                // Parse body for status update
                Map<String, Object> body = gson.fromJson(req.getReader(), Map.class);
                int tournamentId = ((Double) body.get("tournamentId")).intValue();
                int staffId = ((Double) body.get("staffId")).intValue();
                String note = (String) body.get("note");
                String statusStr = (String) body.get("status"); // The target status
                String actionStr = (String) body.get("approvalAction"); // Approve, Reject, etc.

                TournamentStatus status = TournamentStatus.valueOf(statusStr);
                ApprovalAction approvalAction = ApprovalAction.valueOf(actionStr);

                boolean success = service.updateTournamentStatus(tournamentId, staffId, status, approvalAction, note);
                responseMap.put("success", success);

            } else if ("assign".equals(action)) {
                TournamentStaff assignment = gson.fromJson(req.getReader(), TournamentStaff.class);
                boolean success = service.assignStaff(assignment);
                responseMap.put("success", success);
            } else {
                responseMap.put("success", false);
                responseMap.put("message", "Invalid action");
            }
        } catch (Exception e) {
            e.printStackTrace();
            responseMap.put("success", false);
            responseMap.put("message", e.getMessage());
        }

        resp.getWriter().write(gson.toJson(responseMap));
    }
}
