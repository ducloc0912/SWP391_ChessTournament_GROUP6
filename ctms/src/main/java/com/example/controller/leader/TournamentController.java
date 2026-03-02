package com.example.controller.leader;

import com.example.model.dto.TournamentDTO;
import com.example.model.dto.TournamentManualSetupRequestDTO;
import com.example.model.dto.TournamentPlayerDTO;
import com.example.model.dto.TournamentRefereeDTO;
import com.example.model.dto.TournamentReportDTO;
import com.example.model.dto.TournamentSetupMatchDTO;
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
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/tournaments")
public class TournamentController extends HttpServlet {

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

        if ("setupParticipants".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(tid);
                response.getWriter().write(gson.toJson(tournamentService.getSetupParticipants(tournamentId)));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        if ("schedule".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(tid);
                List<TournamentSetupMatchDTO> matches = tournamentService.getManualSetupMatches(tournamentId);
                response.getWriter().write(gson.toJson(matches));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        if ("setupState".equals(action)) {
            String tid = request.getParameter("id");
            if (tid == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(tid);
                Map<String, Object> payload = new HashMap<>();
                payload.put("step", tournamentService.getCurrentSetupStep(tournamentId));
                response.getWriter().write(gson.toJson(payload));
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
}
