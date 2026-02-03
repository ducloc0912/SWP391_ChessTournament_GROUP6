package com.example.controller.staff;

import java.io.IOException;

import java.util.List;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.example.model.Tournament;
import com.example.service.TournamentService;
import com.google.gson.FieldNamingPolicy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

@WebServlet("/api/staff/tournaments/*")
public class StaffTournamentController extends HttpServlet {

    private final TournamentService tournamentService = new TournamentService();
    private final Gson gson = new GsonBuilder()
            .setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
            .create();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        // Ensure CORS is handled by filter, or add here if missing
        // For now, assuming Global CORS Filter handles it.

        try {
            List<Tournament> tournaments = tournamentService.getAllTournaments();
            String json = gson.toJson(tournaments);
            resp.getWriter().write(json);
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\": \"Unable to fetch tournaments\"}");
            e.printStackTrace();
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo(); // Expected: /{id}/status
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        if (pathInfo == null || pathInfo.equals("/")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        String[] splits = pathInfo.split("/");
        if (splits.length < 3) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        String idStr = splits[1];
        // String actionStr = splits[2]; // Previously 'approve'/'reject', now expecting
        // 'status' or ignoring

        try {
            int id = Integer.parseInt(idStr);

            // Parse JSON body
            com.google.gson.JsonObject jsonBody = gson.fromJson(req.getReader(), com.google.gson.JsonObject.class);
            String newStatus = jsonBody.has("status") ? jsonBody.get("status").getAsString() : null;
            String notes = jsonBody.has("notes") ? jsonBody.get("notes").getAsString() : "";

            if (newStatus == null) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\": \"Status is required\"}");
                return;
            }

            boolean success = tournamentService.updateTournamentStatus(id, newStatus, notes);

            if (success) {
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write("{\"message\": \"Success\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"error\": \"Tournament not found or update failed\"}");
            }

        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\": \"Invalid ID format\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            e.printStackTrace();
        }
    }
}
