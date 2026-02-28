package com.example.controller.user;

import com.example.model.dto.PlayerTournamentDTO;
import com.example.service.user.PlayerTournamentService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet("/api/player/tournaments")
public class PlayerTournamentController extends HttpServlet {
    private transient PlayerTournamentService playerTournamentService;
    private transient Gson gson;

    @Override
    public void init() throws ServletException {
        playerTournamentService = new PlayerTournamentService();
        gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd HH:mm:ss")
                .create();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String userIdParam = req.getParameter("userId");
        Integer userId = null;
        if (userIdParam != null && !userIdParam.isBlank()) {
            try {
                userId = Integer.parseInt(userIdParam);
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"message\":\"Invalid userId\"}");
                return;
            }
        }

        String q = req.getParameter("q");
        String format = req.getParameter("format");
        String status = req.getParameter("status");
        String entryType = req.getParameter("entryType");
        String sortBy = req.getParameter("sort");
        boolean registeredOnly = "true".equalsIgnoreCase(req.getParameter("registeredOnly"));

        List<PlayerTournamentDTO> list = playerTournamentService.getPlayerTournamentCards(
                userId,
                q,
                format,
                status,
                entryType,
                registeredOnly,
                sortBy
        );

        resp.getWriter().write(gson.toJson(list));
    }
}
