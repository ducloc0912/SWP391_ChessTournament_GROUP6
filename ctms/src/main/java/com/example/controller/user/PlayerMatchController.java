package com.example.controller.user;

import com.example.DAO.MatchDAO;
import com.example.model.entity.User;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet("/api/player/matches")
public class PlayerMatchController extends HttpServlet {

    private transient MatchDAO matchDAO;
    private transient Gson gson;

    @Override
    public void init() throws ServletException {
        matchDAO = new MatchDAO();
        gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd HH:mm:ss")
                .create();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof User)) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"message\":\"Vui lòng đăng nhập\"}");
            return;
        }

        User user = (User) session.getAttribute("user");
        Integer userId = user.getUserId();
        if (userId == null || userId <= 0) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"message\":\"Tài khoản không hợp lệ\"}");
            return;
        }

        List<Map<String, Object>> matches = matchDAO.getMatchesByPlayer(userId);
        resp.getWriter().write(gson.toJson(matches));
    }
}
