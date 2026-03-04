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

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setCharacterEncoding("UTF-8");

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