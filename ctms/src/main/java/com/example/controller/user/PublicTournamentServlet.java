package com.example.controller.user;

import com.example.model.dto.TournamentDTO;
import com.example.service.leader.TournamentService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

// Legacy endpoint: avoid duplicate mapping with PublicTournamentController.
@WebServlet("/api/public/tournaments/legacy")
public class PublicTournamentServlet extends HttpServlet {

    private transient TournamentService tournamentService;
    private transient Gson gson;

    @Override
    public void init() throws ServletException {
        tournamentService = new TournamentService();
        gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd HH:mm:ss")
                .create();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");
        String q = request.getParameter("q");
        String status = request.getParameter("status");

        List<TournamentDTO> publicList = tournamentService.getAllTournamentsWithCurrentPlayers()
                .stream()
                .filter(this::isPublicTournament)
                .filter(t -> matchKeyword(t, q))
                .filter(t -> matchStatus(t, status))
                .toList();

        if ("filters".equalsIgnoreCase(action)) {
            LinkedHashSet<String> statuses = new LinkedHashSet<>();
            LinkedHashSet<String> formats = new LinkedHashSet<>();
            for (TournamentDTO t : publicList) {
                if (t.getStatus() != null && !t.getStatus().isBlank()) {
                    statuses.add(t.getStatus().trim());
                }
                if (t.getFormat() != null && !t.getFormat().isBlank()) {
                    formats.add(t.getFormat().trim());
                }
            }

            Map<String, Object> out = new HashMap<>();
            out.put("statuses", statuses);
            out.put("formats", formats);
            response.getWriter().write(gson.toJson(out));
            return;
        }

        response.getWriter().write(gson.toJson(publicList));
    }

    private boolean isPublicTournament(TournamentDTO t) {
        if (t == null) return false;
        String status = t.getStatus();
        if (status == null) return true;
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        return !"cancelled".equals(normalized) && !"rejected".equals(normalized);
    }

    private boolean matchStatus(TournamentDTO t, String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank()) return true;
        String status = t.getStatus();
        return status != null && status.equalsIgnoreCase(statusFilter.trim());
    }

    private boolean matchKeyword(TournamentDTO t, String keyword) {
        if (keyword == null || keyword.isBlank()) return true;
        String q = keyword.trim().toLowerCase(Locale.ROOT);
        String name = t.getTournamentName() == null ? "" : t.getTournamentName().toLowerCase(Locale.ROOT);
        String location = t.getLocation() == null ? "" : t.getLocation().toLowerCase(Locale.ROOT);
        return name.contains(q) || location.contains(q);
    }
}
