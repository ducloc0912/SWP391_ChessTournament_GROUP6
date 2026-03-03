package com.example.controller.leader;

import com.example.model.dto.TournamentDTO;
import com.example.model.dto.TournamentManualSetupRequestDTO;
import com.example.model.dto.TournamentPlayerDTO;
import com.example.model.dto.TournamentSetupMatchDTO;
import com.example.model.dto.TournamentRefereeDTO;
import com.example.model.dto.TournamentReportDTO;
import com.example.model.entity.User;
import com.example.model.enums.TournamentFormat;
import com.example.model.enums.TournamentStatus;
import com.example.service.leader.TournamentService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@WebServlet("/api/tournaments")
public class TournamentController extends HttpServlet {

    private static final List<String> ALLOWED_IMAGE_EXT = List.of("jpg", "jpeg", "png", "gif", "webp");

    private TournamentService tournamentService;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        tournamentService = new TournamentService();

        gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd HH:mm:ss")
                .create();
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    // =======================
    // GET: ALL / BY ID
    // =======================
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");
        if ("filters".equals(action)) {
            Map<String, Object> data = new HashMap<>();
            data.put("statuses", Arrays.stream(TournamentStatus.values()).map(Enum::name).toList());
            data.put("formats", Arrays.stream(TournamentFormat.values()).map(Enum::name).toList());
            response.getWriter().write(gson.toJson(data));
            return;
        }

        if ("players".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(tid);
                List<TournamentPlayerDTO> players = tournamentService.getPlayersByTournament(tournamentId);
                response.getWriter().write(gson.toJson(players));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        if ("allReferees".equals(action)) {
            List<TournamentRefereeDTO> all = tournamentService.getAllRefereeUsers();
            response.getWriter().write(gson.toJson(all));
            return;
        }

        if ("referees".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(tid);
                List<TournamentRefereeDTO> referees = tournamentService.getRefereesByTournament(tournamentId);
                response.getWriter().write(gson.toJson(referees));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        if ("refereeInvitations".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(tid);
                List<Map<String, Object>> list = tournamentService.getRefereeInvitations(tournamentId);
                response.getWriter().write(gson.toJson(list));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        if ("reports".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(tid);
                List<TournamentReportDTO> reports = tournamentService.getReportsByTournament(tournamentId);
                response.getWriter().write(gson.toJson(reports));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        String idParam = request.getParameter("id");

        if (idParam == null) {
            List<TournamentDTO> list = tournamentService.getAllTournamentsWithCurrentPlayers();
            response.getWriter().write(gson.toJson(list));
        } else {
            try {
                int id = Integer.parseInt(idParam);
                TournamentDTO t = tournamentService.getTournamentByIdWithCurrentPlayers(id);

                if (t == null) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write("{\"message\":\"Tournament not found\"}");
                } else {
                    response.getWriter().write(gson.toJson(t));
                }
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
        }
    }

    // =======================
    // POST: CREATE
    // =======================
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");
        if ("uploadImageFile".equals(action)) {
            try {
                Part filePart;
                try {
                    filePart = request.getPart("file");
                } catch (Exception e) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write("{\"success\": false, \"message\": \"Missing uploaded file\"}");
                    return;
                }

                String imageUrl = saveTournamentImageFile(request, filePart);
                if (imageUrl == null) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write("{\"success\": false, \"message\": \"Invalid image file or upload failed\"}");
                    return;
                }

                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("imageUrl", imageUrl);
                response.getWriter().write(gson.toJson(result));
            } catch (Exception e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"success\": false, \"message\": \"Upload failed: " + (e.getMessage() != null ? e.getMessage().replace("\"", "'") : "Unknown error") + "\"}");
            }
            return;
        }

        if ("uploadImage".equals(action)) {
            String tid = request.getParameter("id");
            String type = request.getParameter("type");
            if (tid == null || type == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing id or type\"}");
                return;
            }

            int tournamentId;
            try {
                tournamentId = Integer.parseInt(tid);
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid tournament id\"}");
                return;
            }

            Part filePart;
            try {
                filePart = request.getPart("file");
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing uploaded file\"}");
                return;
            }

            String imageUrl = saveTournamentImageFile(request, filePart);
            if (imageUrl == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid image file\"}");
                return;
            }

            boolean success;
            if ("cover".equalsIgnoreCase(type)) {
                success = tournamentService.updateTournamentCoverImage(tournamentId, imageUrl);
            } else if ("detail".equalsIgnoreCase(type)) {
                success = tournamentService.addTournamentDetailImage(tournamentId, imageUrl);
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid image type\"}");
                return;
            }

            if (!success) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Save image metadata failed\"}");
                return;
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("imageUrl", imageUrl);
            response.getWriter().write(gson.toJson(result));
            return;
        }

        if ("createReferee".equals(action)) {
            Map<?, ?> body = gson.fromJson(request.getReader(), Map.class);
            String firstName = body == null || body.get("firstName") == null ? null : String.valueOf(body.get("firstName"));
            String lastName = body == null || body.get("lastName") == null ? null : String.valueOf(body.get("lastName"));
            String email = body == null || body.get("email") == null ? null : String.valueOf(body.get("email"));
            String phoneNumber = body == null || body.get("phoneNumber") == null ? null : String.valueOf(body.get("phoneNumber"));
            String address = body == null || body.get("address") == null ? null : String.valueOf(body.get("address"));

            TournamentRefereeDTO created = tournamentService.createRefereeUser(
                    firstName, lastName, email, phoneNumber, address
            );
            if (created == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Create referee failed (duplicate email/phone or invalid data)\"}");
                return;
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("referee", created);
            response.getWriter().write(gson.toJson(result));
            return;
        }

        if ("assignReferee".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing tournament id\"}");
                return;
            }

            int tournamentId;
            try {
                tournamentId = Integer.parseInt(tid);
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid tournament id\"}");
                return;
            }

            Map<?, ?> body = gson.fromJson(request.getReader(), Map.class);
            if (body == null || body.get("refereeId") == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing refereeId\"}");
                return;
            }

            int refereeId;
            try {
                refereeId = ((Number) body.get("refereeId")).intValue();
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid refereeId\"}");
                return;
            }

            String refereeRole = body.get("refereeRole") == null ? "Assistant" : String.valueOf(body.get("refereeRole"));
            String note = body.get("note") == null ? null : String.valueOf(body.get("note"));

            HttpSession session = request.getSession(false);
            Integer assignedBy = null;
            if (session != null) {
                Object userObj = session.getAttribute("user");
                if (userObj instanceof User user && user.getUserId() != null) {
                    assignedBy = user.getUserId();
                }
            }

            boolean success = tournamentService.assignRefereeToTournament(
                    tournamentId, refereeId, refereeRole, assignedBy, note
            );
            response.getWriter().write("{\"success\": " + success + "}");
            return;
        }

        if ("inviteReferee".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing tournament id\"}");
                return;
            }
            int tournamentId;
            try {
                tournamentId = Integer.parseInt(tid);
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid tournament id\"}");
                return;
            }
            Map<?, ?> body = gson.fromJson(request.getReader(), Map.class);
            String email = body != null && body.get("email") != null ? String.valueOf(body.get("email")).trim() : null;
            String refereeRole = body != null && body.get("refereeRole") != null ? String.valueOf(body.get("refereeRole")) : "Assistant";
            if (email == null || email.isBlank()) {
                response.getWriter().write("{\"success\": false, \"message\": \"Email không được để trống\"}");
                return;
            }
            HttpSession session = request.getSession(false);
            Integer invitedBy = null;
            if (session != null) {
                Object userObj = session.getAttribute("user");
                if (userObj instanceof User user && user.getUserId() != null) {
                    invitedBy = user.getUserId();
                }
            }
            if (invitedBy == null) {
                response.getWriter().write("{\"success\": false, \"message\": \"Vui lòng đăng nhập\"}");
                return;
            }
            int invId = tournamentService.inviteRefereeByEmail(tournamentId, email, refereeRole, invitedBy);
            if (invId > 0) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("invitationId", invId);
                result.put("message", "Đã gửi lời mời đến " + email);
                response.getWriter().write(gson.toJson(result));
            } else if (invId == -1) {
                response.getWriter().write("{\"success\": false, \"message\": \"Email này đã có lời mời đang chờ\"}");
            } else {
                response.getWriter().write("{\"success\": false, \"message\": \"Gửi lời mời thất bại\"}");
            }
            return;
        }

        if ("resendInvite".equals(action)) {
            String invIdParam = request.getParameter("invitationId");
            if (invIdParam == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing invitationId\"}");
                return;
            }
            int invitationId;
            try {
                invitationId = Integer.parseInt(invIdParam);
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid invitationId\"}");
                return;
            }
            HttpSession session = request.getSession(false);
            Integer invitedBy = null;
            if (session != null) {
                Object userObj = session.getAttribute("user");
                if (userObj instanceof User user && user.getUserId() != null) {
                    invitedBy = user.getUserId();
                }
            }
            boolean success = tournamentService.resendRefereeInvite(invitationId, invitedBy != null ? invitedBy : 0);
            response.getWriter().write("{\"success\": " + success + "}");
            return;
        }

        if ("replaceInvite".equals(action)) {
            String invIdParam = request.getParameter("invitationId");
            if (invIdParam == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing invitationId\"}");
                return;
            }
            int invitationId;
            try {
                invitationId = Integer.parseInt(invIdParam);
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid invitationId\"}");
                return;
            }
            Map<?, ?> body = gson.fromJson(request.getReader(), Map.class);
            String newEmail = body != null && body.get("email") != null ? String.valueOf(body.get("email")).trim() : null;
            String refereeRole = body != null && body.get("refereeRole") != null ? String.valueOf(body.get("refereeRole")) : "Assistant";
            if (newEmail == null || newEmail.isBlank()) {
                response.getWriter().write("{\"success\": false, \"message\": \"Email không được để trống\"}");
                return;
            }
            HttpSession session = request.getSession(false);
            Integer invitedBy = null;
            if (session != null) {
                Object userObj = session.getAttribute("user");
                if (userObj instanceof User user && user.getUserId() != null) {
                    invitedBy = user.getUserId();
                }
            }
            boolean success = tournamentService.replaceRefereeInvite(invitationId, newEmail, refereeRole, invitedBy != null ? invitedBy : 0);
            response.getWriter().write("{\"success\": " + success + "}");
            return;
        }

        if ("manualSetup".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing tournament id\"}");
                return;
            }

            int tournamentId;
            try {
                tournamentId = Integer.parseInt(tid);
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid tournament id\"}");
                return;
            }

            TournamentManualSetupRequestDTO body = gson.fromJson(request.getReader(), TournamentManualSetupRequestDTO.class);
            TournamentService.SetupValidationResult result = tournamentService.saveManualSetup(tournamentId, body);
            if (!result.isValid()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }
            Map<String, Object> payload = new HashMap<>();
            payload.put("success", result.isValid());
            payload.put("message", result.getMessage());
            response.getWriter().write(gson.toJson(payload));
            return;
        }

        if ("saveRefereeAssignments".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing tournament id\"}");
                return;
            }
            int tournamentId;
            try {
                tournamentId = Integer.parseInt(tid);
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid tournament id\"}");
                return;
            }
            TournamentManualSetupRequestDTO body = gson.fromJson(request.getReader(), TournamentManualSetupRequestDTO.class);
            List<TournamentSetupMatchDTO> matches = body != null && body.getMatches() != null ? body.getMatches() : List.of();
            TournamentService.SetupValidationResult result = tournamentService.saveRefereeAssignments(tournamentId, matches);
            if (!result.isValid()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }
            Map<String, Object> payload = new HashMap<>();
            payload.put("success", result.isValid());
            payload.put("message", result.getMessage());
            response.getWriter().write(gson.toJson(payload));
            return;
        }

        if ("setupStep".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing tournament id\"}");
                return;
            }
            int tournamentId;
            try {
                tournamentId = Integer.parseInt(tid);
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid tournament id\"}");
                return;
            }

            TournamentManualSetupRequestDTO body = gson.fromJson(request.getReader(), TournamentManualSetupRequestDTO.class);
            TournamentService.SetupValidationResult result = tournamentService.advanceSetupStep(tournamentId, body);
            if (!result.isValid()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }
            Map<String, Object> payload = new HashMap<>();
            payload.put("success", result.isValid());
            payload.put("message", result.getMessage());
            response.getWriter().write(gson.toJson(payload));
            return;
        }

        TournamentDTO tournament =
                gson.fromJson(request.getReader(), TournamentDTO.class);

        boolean success = tournamentService.createTournament(tournament);

        response.getWriter().write("{\"success\": " + success + "}");
    }

    // =======================
    // PUT: UPDATE
    // =======================
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String idParam = request.getParameter("id");
        if (idParam == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"success\": false, \"message\": \"Missing tournament id\"}");
            return;
        }

        int id;
        try {
            id = Integer.parseInt(idParam);
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"success\": false, \"message\": \"Invalid tournament id\"}");
            return;
        }

        TournamentDTO tournament =
                gson.fromJson(request.getReader(), TournamentDTO.class);

        tournament.setTournamentId(id);

        boolean success = tournamentService.updateTournament(tournament);

        response.getWriter().write("{\"success\": " + success + "}");
    }

    // =======================
    // DELETE: CANCEL or HARD DELETE
    // ?id=1&reason=xxx  → cancel (soft delete)
    // ?id=1&hard=true   → hard delete
    // =======================
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");
        if ("removeReferee".equals(action)) {
            String tid = request.getParameter("id");
            String rid = request.getParameter("refereeId");
            if (tid == null || rid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing id or refereeId\"}");
                return;
            }

            int tournamentId;
            int refereeId;
            try {
                tournamentId = Integer.parseInt(tid);
                refereeId = Integer.parseInt(rid);
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid id or refereeId\"}");
                return;
            }

            boolean success = tournamentService.removeRefereeFromTournament(tournamentId, refereeId);
            response.getWriter().write("{\"success\": " + success + "}");
            return;
        }

        if ("removePendingInvite".equals(action)) {
            String invIdParam = request.getParameter("invitationId");
            if (invIdParam == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing invitationId\"}");
                return;
            }
            int invitationId;
            try {
                invitationId = Integer.parseInt(invIdParam);
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Invalid invitationId\"}");
                return;
            }
            boolean success = tournamentService.removePendingInvitation(invitationId);
            response.getWriter().write("{\"success\": " + success + "}");
            return;
        }

        String idParam = request.getParameter("id");
        if (idParam == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"success\": false, \"message\": \"Missing id\"}");
            return;
        }

        int id;
        try {
            id = Integer.parseInt(idParam);
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"success\": false, \"message\": \"Invalid id\"}");
            return;
        }

        boolean hard = "true".equals(request.getParameter("hard"));

        if (hard) {
        boolean success = tournamentService.deleteTournament(id);
            response.getWriter().write("{\"success\": " + success + "}");
        } else {
            String reason = request.getParameter("reason");
            if (reason == null || reason.isBlank()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"success\": false, \"message\": \"Missing reason\"}");
                return;
            }
            boolean success = tournamentService.cancelTournament(id, reason);
        response.getWriter().write("{\"success\": " + success + "}");
        }
    }

    private String saveTournamentImageFile(HttpServletRequest request, Part filePart) {
        if (filePart == null || filePart.getSize() <= 0) return null;
        String submitted = filePart.getSubmittedFileName();
        if (submitted == null || submitted.isBlank()) return null;

        String ext = "";
        int dot = submitted.lastIndexOf('.');
        if (dot >= 0 && dot < submitted.length() - 1) {
            ext = submitted.substring(dot + 1).toLowerCase();
        }
        if (!ALLOWED_IMAGE_EXT.contains(ext)) return null;

        String fileName = UUID.randomUUID() + "." + ext;
        for (Path uploadDir : List.of(getPersistentUploadDir(), getLegacyUploadDir(), getTempUploadDir())) {
            try {
                Files.createDirectories(uploadDir);
                Path target = uploadDir.resolve(fileName);
                try (InputStream in = filePart.getInputStream()) {
                    Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                }
                return buildAbsoluteFileUrl(request, "/api/tournaments?action=uploadedImage&file=" + fileName);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return null;
    }

    private String buildAbsoluteFileUrl(HttpServletRequest request, String path) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        String context = request.getContextPath();
        return scheme + "://" + host + ":" + port + context + path;
    }

    private void deleteUploadedTournamentImageIfLocal(HttpServletRequest request, String imageUrl) {
        if (imageUrl == null) return;
        String marker = "action=uploadedImage&file=";
        int idx = imageUrl.indexOf(marker);
        if (idx < 0) return;
        String fileName = imageUrl.substring(idx + marker.length());
        int amp = fileName.indexOf('&');
        if (amp >= 0) {
            fileName = fileName.substring(0, amp);
        }
        fileName = URLDecoder.decode(fileName, StandardCharsets.UTF_8);
        if (fileName.isBlank() || fileName.contains("/") || fileName.contains("\\")) return;

        for (Path dir : List.of(getPersistentUploadDir(), getLegacyUploadDir(), getVeryOldUploadDir(), getTempUploadDir())) {
            try {
                Files.deleteIfExists(dir.resolve(fileName));
            } catch (IOException ignored) {
            }
        }
    }

    private Path getPersistentUploadDir() {
        // Local demo mode: team commit/copy duoc folder FE/my-app/src/assets/image.
        String projectDir = System.getProperty("user.dir");
        return Paths.get(projectDir, "..", "FE", "my-app", "src", "assets", "image").normalize();
    }

    private Path getLegacyUploadDir() {
        String projectDir = System.getProperty("user.dir");
        return Paths.get(projectDir, "uploads", "tournaments");
    }

    private Path getVeryOldUploadDir() {
        String home = System.getProperty("user.home");
        return Paths.get(home, "ctms-uploads", "tournaments");
    }

    private Path getTempUploadDir() {
        return Paths.get(System.getProperty("java.io.tmpdir"), "ctms-uploads");
    }

    private Path findExistingUploadFile(String fileName) {
        for (Path dir : List.of(getPersistentUploadDir(), getLegacyUploadDir(), getVeryOldUploadDir(), getTempUploadDir())) {
            Path candidate = dir.resolve(fileName);
            if (Files.exists(candidate)) {
                return candidate;
            }
        }
        return null;
    }
}
