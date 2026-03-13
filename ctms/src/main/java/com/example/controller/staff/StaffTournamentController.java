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
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@WebServlet("/api/staff/tournaments")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,
        maxFileSize = 10L * 1024 * 1024,
        maxRequestSize = 12L * 1024 * 1024
)
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
                return;
            }
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        if ("pending".equals(action)) {
            resp.getWriter().write(gson.toJson(service.getPendingTournaments()));
            return;
        }

        if ("transactionsSummary".equals(action)) {
            resp.getWriter().write(gson.toJson(service.getTransactionSummary()));
            return;
        }

        if ("transactions".equals(action)) {
            int tournamentId = parseInt(req.getParameter("tournamentId"));
            resp.getWriter().write(gson.toJson(service.getTransactionsByTournament(tournamentId)));
            return;
        }

        if ("withdrawals".equals(action)) {
            resp.getWriter().write(gson.toJson(service.getWithdrawals()));
            return;
        }

        List<Tournament> list = service.getAllTournaments();
        resp.getWriter().write(gson.toJson(list));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Map<String, Object> responseMap = new HashMap<>();

        try {
            if ("updateStatus".equals(action)) {
                Map<String, Object> body = gson.fromJson(req.getReader(), Map.class);
                int tournamentId = ((Double) body.get("tournamentId")).intValue();
                int staffId = ((Double) body.get("staffId")).intValue();
                String note = (String) body.get("note");
                String statusStr = (String) body.get("status");
                String actionStr = (String) body.get("approvalAction");

                TournamentStatus status = TournamentStatus.fromValue(statusStr);
                ApprovalAction approvalAction = ApprovalAction.valueOf(actionStr);

                boolean success = service.updateTournamentStatus(tournamentId, staffId, status, approvalAction, note);
                responseMap.put("success", success);
            } else if ("assign".equals(action)) {
                TournamentStaff assignment = gson.fromJson(req.getReader(), TournamentStaff.class);
                boolean success = service.assignStaff(assignment);
                responseMap.put("success", success);
            } else if ("completeWithdrawal".equals(action)) {
                int withdrawalId = parseInt(req.getParameter("withdrawalId"));
                int staffId = parseInt(req.getParameter("staffId"));
                Part proofPart = req.getPart("proofImage");
                String proofUrl = savePaymentProofFile(req, proofPart);
                boolean success = service.markWithdrawalCompleted(withdrawalId, staffId, proofUrl);
                responseMap.put("success", success);
                responseMap.put("proofUrl", proofUrl);
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

    private int parseInt(String value) {
        if (value == null || value.isBlank()) return 0;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String savePaymentProofFile(HttpServletRequest request, Part filePart) throws IOException {
        if (filePart == null || filePart.getSize() <= 0) return null;
        String submitted = filePart.getSubmittedFileName();
        if (submitted == null || submitted.isBlank()) return null;

        String ext = "";
        int dot = submitted.lastIndexOf('.');
        if (dot >= 0 && dot < submitted.length() - 1) {
            ext = submitted.substring(dot + 1).toLowerCase();
        }
        if (!List.of("png", "jpg", "jpeg", "webp").contains(ext)) return null;

        String fileName = UUID.randomUUID() + "." + ext;
        Path uploadDir = getPaymentProofDir();
        Files.createDirectories(uploadDir);
        Path target = uploadDir.resolve(fileName);
        try (InputStream in = filePart.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        return buildAbsoluteFileUrl(request, "/uploads/payment-proofs/" + fileName);
    }

    private Path getPaymentProofDir() {
        String projectDir = System.getProperty("user.dir");
        return Path.of(projectDir, "uploads", "payment-proofs").normalize();
    }

    private String buildAbsoluteFileUrl(HttpServletRequest request, String path) {
        return request.getScheme()
                + "://"
                + request.getServerName()
                + ":"
                + request.getServerPort()
                + request.getContextPath()
                + path;
    }
}
