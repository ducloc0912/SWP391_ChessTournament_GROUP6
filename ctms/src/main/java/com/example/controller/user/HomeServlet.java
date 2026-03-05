package com.example.controller.user;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.DAO.HomeDAO;
import com.example.model.dto.FeedbackDTO;
import com.example.model.dto.TournamentDTO;
import com.example.model.entity.BlogPost;
import com.example.model.entity.User;
import com.example.service.user.FeedbackService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/home")
public class HomeServlet extends HttpServlet {

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
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(req, resp);
        resp.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json");

        try {
            HomeDAO dao = new HomeDAO();
            FeedbackService feedbackService = new FeedbackService();

            List<TournamentDTO> upcomingTournaments = dao.getUpcomingTournaments();
            List<User> topPlayers = dao.getTopPlayers();
            List<FeedbackDTO> topFeedbacks = feedbackService.getHomepageFeedbacks(10);
            List<BlogPost> latestBlogs = dao.getLatestPublicBlogs();

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("upcomingTournaments", upcomingTournaments);
            responseData.put("topPlayers", topPlayers);
            responseData.put("topFeedbacks", topFeedbacks);
            responseData.put("latestBlogs", latestBlogs);

            Gson gson = new GsonBuilder().create();
            String json = gson.toJson(responseData);
            resp.getWriter().write(json);

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}