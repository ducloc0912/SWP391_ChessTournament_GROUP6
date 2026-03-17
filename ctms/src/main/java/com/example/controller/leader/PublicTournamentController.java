package com.example.controller.leader;

import com.example.model.dto.TournamentDTO;
import com.example.model.dto.TournamentPlayerDTO;
import com.example.model.dto.FeedbackDTO;
import com.example.model.enums.TournamentFormat;
import com.example.model.enums.TournamentStatus;
import com.example.service.leader.TournamentService;
import com.example.DAO.FeedbackDAO;
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
    private FeedbackDAO feedbackDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        tournamentService = new TournamentService();
        feedbackDAO = new FeedbackDAO();
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
            data.put("formats", Arrays.stream(TournamentFormat.values()).filter(f -> f != TournamentFormat.Hybrid).map(Enum::name).toList());
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

        if ("participants".equals(action)) {
            String idParam = request.getParameter("id");
            if (idParam == null || idParam.isBlank()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(idParam);
                List<TournamentPlayerDTO> list = tournamentService.getPlayersByTournament(tournamentId);
                response.getWriter().write(gson.toJson(list));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        if ("standing".equals(action)) {
            String idParam = request.getParameter("id");
            if (idParam == null || idParam.isBlank()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(idParam);
                response.getWriter().write(gson.toJson(tournamentService.getStandingsByTournament(tournamentId)));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            }
            return;
        }

        if ("feedback".equals(action)) {
            String idParam = request.getParameter("id");
            if (idParam == null || idParam.isBlank()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Missing tournament id\"}");
                return;
            }
            try {
                int tournamentId = Integer.parseInt(idParam);
                List<FeedbackDTO> items = feedbackDAO.getFeedbacksByTournamentId(tournamentId);

                // Tính toán thống kê
                Map<String, Integer> starCounts = new HashMap<>();
                starCounts.put("1", 0); starCounts.put("2", 0);
                starCounts.put("3", 0); starCounts.put("4", 0); starCounts.put("5", 0);
                double totalRating = 0;
                for (FeedbackDTO fb : items) {
                    if (fb.getStarRating() != null) {
                        totalRating += fb.getStarRating();
                        String key = String.valueOf(fb.getStarRating());
                        starCounts.put(key, starCounts.getOrDefault(key, 0) + 1);
                    }
                }
                double avg = items.isEmpty() ? 0 : totalRating / items.size();

                Map<String, Object> result = new HashMap<>();
                result.put("averageRating", Math.round(avg * 10.0) / 10.0);
                result.put("totalReviews", items.size());
                result.put("starCounts", starCounts);
                result.put("items", items);
                response.getWriter().write(gson.toJson(result));
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"message\":\"Invalid tournament id\"}");
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"message\":\"Failed to load feedback\"}");
            }
            return;
        }

        // GET /api/public/tournaments
        List<TournamentDTO> list = tournamentService.getAllTournamentsWithCurrentPlayers();
        response.getWriter().write(gson.toJson(list));
    }
}