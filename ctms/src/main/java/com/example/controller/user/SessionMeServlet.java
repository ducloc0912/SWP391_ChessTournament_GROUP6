package com.example.controller.user;

import com.example.model.entity.User;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/session/me")
public class SessionMeServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        Map<String, Object> result = new HashMap<>();

        if (session == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            result.put("authenticated", false);
        } else {
            Object userObj = session.getAttribute("user");
            Object roleObj = session.getAttribute("role");

            if (userObj instanceof User) {
                result.put("authenticated", true);
                result.put("user", userObj);
                result.put("role", roleObj);
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                result.put("authenticated", false);
            }
        }

        Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd HH:mm:ss").create();
        response.getWriter().write(gson.toJson(result));
    }
}

