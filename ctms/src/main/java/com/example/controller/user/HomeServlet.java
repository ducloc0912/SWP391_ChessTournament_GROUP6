package com.example.controller.user;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.DAO.HomeDAO;
import com.example.model.Tournaments;
import com.example.model.User;
import com.google.gson.Gson;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/home")
public class HomeServlet extends HttpServlet {
    
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // 1. Cấu hình CORS
        resp.setCharacterEncoding("UTF-8");

        try {
            HomeDAO dao = new HomeDAO();
            
            // 2. Lấy dữ liệu từ DAO
            List<Tournaments> upcomingTournaments = dao.getUpcomingTournaments();
            List<User> topPlayers = dao.getTopPlayers();
            
            // 3. Đóng gói vào 1 object Map để trả về 1 lần
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("upcomingTournaments", upcomingTournaments);
            responseData.put("topPlayers", topPlayers);
            
            // 4. Convert sang JSON và gửi về
            Gson gson = new Gson();
            String json = gson.toJson(responseData);
            resp.getWriter().write(json);
            
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}