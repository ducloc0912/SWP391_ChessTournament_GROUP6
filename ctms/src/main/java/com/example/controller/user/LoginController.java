package com.example.controller.user;

import com.example.service.user.LoginService;
import com.example.model.User;
import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.HashMap;

@WebServlet("/api/login")
public class LoginController extends HttpServlet {

    private final LoginService loginService = new LoginService();

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

        HashMap<String, Object> result =
                loginService.login(email, password);

        if (Boolean.TRUE.equals(result.get("success"))) {
            HttpSession session = request.getSession();
            session.setAttribute("user", result.get("user"));
            session.setAttribute("role", result.get("role"));
            session.setMaxInactiveInterval(30 * 60);
        }

        response.getWriter().write(gson.toJson(result));
    }
}
