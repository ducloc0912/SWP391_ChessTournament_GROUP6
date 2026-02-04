package com.example.controller.leader;

import com.example.DAO.ParticipantDAO;
import com.example.model.entity.Participant;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.Timestamp;
import java.util.List;

@WebServlet("/api/participants")
public class ParticipantServlet extends HttpServlet {

    private ParticipantDAO dao = new ParticipantDAO();

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
            resp.getWriter().write(p != null ? toJson(p) : "{}");
            return;
        }

        if (tournamentId != null) {
            List<Participant> list =
                    dao.getParticipantsByTournamentId(Integer.parseInt(tournamentId));
            resp.getWriter().write(toJsonArray(list));
            return;
        }

        if (userId != null) {
            List<Participant> list =
                    dao.getParticipantsByUserId(Integer.parseInt(userId));
            resp.getWriter().write(toJsonArray(list));
            return;
        }

        resp.getWriter().write("[]");
    }

    // ===== POST =====
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        Participant p = readParticipant(req);
        boolean ok = dao.createParticipant(p);

        resp.setContentType("application/json");
        resp.getWriter().write("{\"success\": " + ok + "}");
    }

    // ===== PUT =====
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        Participant p = readParticipant(req);
        p.setParticipantId(Integer.parseInt(req.getParameter("participantId")));

        boolean ok = dao.updateParticipant(p);

        resp.setContentType("application/json");
        resp.getWriter().write("{\"success\": " + ok + "}");
    }

    // ===== DELETE =====
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        int id = Integer.parseInt(req.getParameter("id"));
        boolean ok = dao.deleteParticipant(id);

        resp.setContentType("application/json");
        resp.getWriter().write("{\"success\": " + ok + "}");
    }

    // ===== Helpers =====

    private Participant readParticipant(HttpServletRequest req) {
        Participant p = new Participant();
        p.setTournamentId(Integer.parseInt(req.getParameter("tournamentId")));
        p.setUserId(Integer.parseInt(req.getParameter("userId")));
        p.setTitleAtRegistration(req.getParameter("title"));
        p.setStatus(req.getParameter("status"));
        p.setPaid(Boolean.parseBoolean(req.getParameter("paid")));
        p.setNotes(req.getParameter("notes"));

        String seed = req.getParameter("seed");
        if (seed != null && !seed.isEmpty()) {
            p.setSeed(Integer.parseInt(seed));
        }

        String paymentDate = req.getParameter("paymentDate");
        if (paymentDate != null && !paymentDate.isEmpty()) {
            p.setPaymentDate(Timestamp.valueOf(paymentDate));
        }

        return p;
    }

    private String toJson(Participant p) {
        return """
        {
          "participantId": %d,
          "tournamentId": %d,
          "userId": %d,
          "titleAtRegistration": "%s",
          "seed": %s,
          "status": "%s",
          "paid": %b,
          "paymentDate": "%s",
          "registrationDate": "%s",
          "notes": "%s"
        }
        """.formatted(
                p.getParticipantId(),
                p.getTournamentId(),
                p.getUserId(),
                safe(p.getTitleAtRegistration()),
                p.getSeed() != null ? p.getSeed() : "null",
                safe(p.getStatus()),
                p.isPaid(),
                p.getPaymentDate(),
                p.getRegistrationDate(),
                safe(p.getNotes())
        );
    }

    private String toJsonArray(List<Participant> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            sb.append(toJson(list.get(i)));
            if (i < list.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    private String safe(String s) {
        return s == null ? "" : s.replace("\"", "\\\"");
    }
}
