package com.example.controller.admin;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.DAO.MatchDAO;
import com.example.DAO.TournamentDAO;
import com.example.DAO.UserDAO;
import com.google.gson.Gson;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "DashboardSummaryServlet", urlPatterns = {"/api/dashboard/summary"})
public class DashboardSummaryServlet extends HttpServlet {

    private final UserDAO userDAO = new UserDAO();
    private final TournamentDAO tournamentDAO = new TournamentDAO();
    private final MatchDAO matchDAO = new MatchDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json");

        int totalUsers = userDAO.countAllUsers();
        int totalTournaments = tournamentDAO.countAllTournaments();
        int ongoingMatches = matchDAO.countOngoingMatches();
        int cancelledTournaments = tournamentDAO.countCancelledTournaments();

        List<Map<String, Object>> registrations = userDAO.countUserRegistrationsLastNMonths(6);
        List<Map<String, Object>> tournamentStatus = tournamentDAO.countByStatus();

        Map<String, Object> out = new HashMap<>();
        out.put("totalUsers", totalUsers);
        out.put("totalTournaments", totalTournaments);
        out.put("ongoingMatches", ongoingMatches);
        out.put("cancelledTournaments", cancelledTournaments);
        out.put("registrations", registrations);
        out.put("tournamentStatus", tournamentStatus);

        resp.getWriter().write(new Gson().toJson(out));
    }
}
