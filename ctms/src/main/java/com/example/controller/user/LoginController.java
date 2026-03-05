package com.example.controller.user;

import com.example.service.user.LoginService;
import com.example.model.entity.User;
import com.example.model.entity.UserRole;
import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.HashMap;

@WebServlet("/api/login")
public class LoginController extends HttpServlet {

    private final LoginService loginService = new LoginService();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Gson gson = new Gson();
        HashMap<String, Object> info = new HashMap<>();
        info.put("success", true);
        info.put("message", "Login endpoint is running. Use POST to log in.");

        response.getWriter().write(gson.toJson(info));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Gson gson = new Gson();
        HashMap<String, Object> body =
                gson.fromJson(request.getReader(), HashMap.class);

        String email = (String) body.get("email");
        String password = (String) body.get("password");

        HashMap<String, Object> result = loginService.login(email, password);

        if (Boolean.TRUE.equals(result.get("success"))) {
            HttpSession session = request.getSession();

            Object rawUser = result.get("user");
            if (rawUser instanceof UserRole ur) {
                User u = new User();
                u.setUserId(ur.getUserId());
                u.setUsername(ur.getUsername());
                u.setEmail(ur.getEmail());
                u.setAvatar(ur.getAvatar());
                u.setLastLogin(ur.getLastLogin());
                u.setIsActive(ur.getIsActive());
                session.setAttribute("user", u);
            } else if (rawUser instanceof User) {
                session.setAttribute("user", rawUser);
            }

            session.setAttribute("role", result.get("role"));
            session.setMaxInactiveInterval(30 * 60);
        }

        response.getWriter().write(gson.toJson(result));
    }
}
