package com.example.controller.leader;

import com.example.model.dto.TournamentDTO;
import com.example.model.enums.TournamentFormat;
import com.example.model.enums.TournamentStatus;
import com.example.service.leader.TournamentService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/public/tournaments")
public class PublicTournamentController extends HttpServlet {

    private TournamentService tournamentService;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        tournamentService = new TournamentService();
        gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd HH:mm:ss")
                .create();
    }

    private void addCors(HttpServletRequest req, HttpServletResponse resp) {
        String origin = req.getHeader("Origin");

        if (origin == null || origin.isBlank()) {
            resp.setHeader("Access-Control-Allow-Origin", "*");
        } else {
            resp.setHeader("Access-Control-Allow-Origin", origin);
            resp.setHeader("Vary", "Origin");
        }

        resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        resp.setHeader("Access-Control-Max-Age", "3600");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(req, resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        addCors(request, response);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");

        // GET /api/public/tournaments?action=filters
        if ("filters".equals(action)) {
            Map<String, Object> data = new HashMap<>();
            data.put("statuses", Arrays.stream(TournamentStatus.values()).map(Enum::name).toList());
            data.put("formats", Arrays.stream(TournamentFormat.values()).map(Enum::name).toList());
            response.getWriter().write(gson.toJson(data));
            return;
        }

        if ("detail".equals(action)) {
            String idParam = request.getParameter("id");
            if (idParam == null || idParam.isBlank()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(idParam);
                TournamentDTO t = tournamentService.getTournamentByIdWithCurrentPlayers(tournamentId);
                if (t == null) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write("{\"message\":\"Tournament not found\"}");
                    return;
                }
                response.getWriter().write(gson.toJson(t));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        if ("matches".equals(action)) {
            String idParam = request.getParameter("id");
            if (idParam == null || idParam.isBlank()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(idParam);
                Map<String, Object> data = new HashMap<>();
                data.put("upcomingMatches", tournamentService.getUpcomingMatchesByTournament(tournamentId));
                data.put("completedMatches", tournamentService.getCompletedMatchesByTournament(tournamentId));
                response.getWriter().write(gson.toJson(data));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        if ("podium".equals(action)) {
            String idParam = request.getParameter("id");
            if (idParam == null || idParam.isBlank()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(idParam);
                response.getWriter().write(gson.toJson(tournamentService.getTournamentPodium(tournamentId)));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        if ("allMatches".equals(action)) {
            response.getWriter().write(gson.toJson(tournamentService.getAllPublicMatches()));
            return;
        }

        // GET /api/public/tournaments
        List<TournamentDTO> list = tournamentService.getAllTournamentsWithCurrentPlayers();
        response.getWriter().write(gson.toJson(list));
    }
}