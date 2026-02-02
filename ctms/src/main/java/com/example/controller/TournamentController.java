package com.example.controller;

import com.example.model.Tournament;
import com.example.service.TournamentService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.util.List;

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

        String idParam = request.getParameter("id");

        if (idParam == null) {
            List<Tournament> list = tournamentService.getAllTournaments();
            response.getWriter().write(gson.toJson(list));
        } else {
            try {
                int id = Integer.parseInt(idParam);
                Tournament t = tournamentService.getTournamentById(id);

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

        Tournament tournament =
                gson.fromJson(request.getReader(), Tournament.class);

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

        Tournament tournament =
                gson.fromJson(request.getReader(), Tournament.class);

        boolean success = tournamentService.updateTournament(tournament);

        response.getWriter().write("{\"success\": " + success + "}");
    }

    // =======================
    // DELETE: SOFT DELETE
    // =======================
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");

        String idParam = request.getParameter("id");

        if (idParam == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"success\": false}");
            return;
        }

        int id = Integer.parseInt(idParam);
        boolean success = tournamentService.deleteTournament(id);

        response.getWriter().write("{\"success\": " + success + "}");
    }
}
