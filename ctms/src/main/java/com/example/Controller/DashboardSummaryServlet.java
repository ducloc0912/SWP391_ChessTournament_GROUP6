package com.example.Controller;

import com.example.DAO.UserDAO;
import com.example.DAO.TournamentDAO;
import com.example.DAO.MatchDAO;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;

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

       
        String json = "{"
                + "\"totalUsers\":" + totalUsers + ","
                + "\"totalTournaments\":" + totalTournaments + ","
                + "\"ongoingMatches\":" + ongoingMatches + ","
                + "\"cancelledTournaments\":" + cancelledTournaments
                + "}";

        resp.getWriter().write(json);
    }
}
