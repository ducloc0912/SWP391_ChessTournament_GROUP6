package com.example.controller.leader;

import com.example.DAO.ParticipantDAO;
import com.example.DAO.TournamentDAO;
import com.example.model.dto.TournamentDTO;
import com.example.model.entity.Participant;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;

@WebServlet("/api/participants")
public class ParticipantServlet extends HttpServlet {

    private ParticipantDAO dao = new ParticipantDAO();
    private TournamentDAO tournamentDAO = new TournamentDAO();
    private Gson gson;

    @Override
    public void init() {
        gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd HH:mm:ss")
                .create();
    }

    // ===== GET =====
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String id = req.getParameter("id");
        String tournamentId = req.getParameter("tournamentId");
        String userId = req.getParameter("userId");

        if (id != null) {
            Participant p = dao.getParticipantById(Integer.parseInt(id));
            resp.getWriter().write(p != null ? gson.toJson(p) : "{}");
            return;
        }

        if (tournamentId != null) {
            List<Participant> list =
                    dao.getParticipantsByTournamentId(Integer.parseInt(tournamentId));
            resp.getWriter().write(gson.toJson(list));
            return;
        }

        if (userId != null) {
            List<Participant> list =
                    dao.getParticipantsByUserId(Integer.parseInt(userId));
            resp.getWriter().write(gson.toJson(list));
            return;
        }

        resp.getWriter().write("[]");
    }

    // ===== POST =====
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Participant p = gson.fromJson(req.getReader(), Participant.class);
        if (p == null || p.getTournamentId() == null || p.getUserId() == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"success\": false, \"message\": \"Missing tournamentId or userId\"}");
            return;
        }

        TournamentDTO tournament = tournamentDAO.getTournamentById(p.getTournamentId());
        if (tournament == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"success\": false, \"message\": \"Tournament not found\"}");
            return;
        }

        if (!"Ongoing".equalsIgnoreCase(tournament.getStatus())) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"success\": false, \"message\": \"Only Ongoing tournaments can be registered\"}");
            return;
        }

        if (tournament.getRegistrationDeadline() != null
                && System.currentTimeMillis() > tournament.getRegistrationDeadline().getTime()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"success\": false, \"message\": \"Registration deadline has passed\"}");
            return;
        }

        Integer maxPlayer = tournament.getMaxPlayer();
        if (maxPlayer != null && maxPlayer > 0) {
            int currentPlayers = dao.countParticipantsByTournament(p.getTournamentId());
            if (currentPlayers >= maxPlayer) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"success\": false, \"message\": \"Tournament is full\"}");
                return;
            }
        }

        boolean ok = dao.createParticipant(p);
        if (!ok) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"success\": false, \"message\": \"Register failed (maybe already registered)\"}");
            return;
        }

        resp.getWriter().write("{\"success\": " + ok + "}");
    }

    // ===== PUT =====
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String participantIdParam = req.getParameter("participantId");
        if (participantIdParam == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"success\": false, \"message\": \"Missing participantId\"}");
            return;
        }

        Participant p = gson.fromJson(req.getReader(), Participant.class);
        p.setParticipantId(Integer.parseInt(participantIdParam));

        boolean ok = dao.updateParticipant(p);

        resp.getWriter().write("{\"success\": " + ok + "}");
    }

    // ===== DELETE =====
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String idParam = req.getParameter("id");
        if (idParam == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"success\": false, \"message\": \"Missing id\"}");
            return;
        }

        int id = Integer.parseInt(idParam);
        boolean ok = dao.deleteParticipant(id);

        resp.getWriter().write("{\"success\": " + ok + "}");
    }
}
