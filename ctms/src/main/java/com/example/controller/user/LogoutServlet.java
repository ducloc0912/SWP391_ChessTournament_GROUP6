package com.example.controller.user;

import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/logout")
public class LogoutServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();
        try {
            HttpSession session = req.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            result.put("success", true);
            result.put("message", "Đã đăng xuất.");
        } catch (Exception e) {
            result.put("success", true);
            result.put("message", "Đã đăng xuất.");
        }
        resp.getWriter().write(gson.toJson(result));
    }
}
