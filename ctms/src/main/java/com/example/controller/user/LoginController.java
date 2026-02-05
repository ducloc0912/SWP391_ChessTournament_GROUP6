package com.example.controller.user;

import com.example.DAO.UserDAO;
import com.example.model.entity.User;
import com.example.model.entity.UserRole;
import com.example.service.user.LoginService;
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
        try {
            HashMap<String, Object> body =
                    gson.fromJson(request.getReader(), HashMap.class);
            if (body == null) body = new HashMap<>();

            String email = (String) body.get("email");
            String password = (String) body.get("password");

            HashMap<String, Object> result = loginService.login(email, password);

            if (Boolean.TRUE.equals(result.get("success"))) {
                UserRole loginUser = (UserRole) result.get("user");
                User fullUser = new UserDAO().getUserById(loginUser.getUserId());
                if (fullUser == null) {
                    result.put("success", false);
                    result.put("message", "User not found");
                } else {
                    fullUser.setPassword(null);
                    result.put("user", fullUser);
                    HttpSession session = request.getSession();
                    session.setAttribute("user", fullUser);
                    session.setAttribute("role", result.get("role"));
                    session.setMaxInactiveInterval(30 * 60);
                }
            }

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(gson.toJson(result));
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            HashMap<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage() != null ? e.getMessage() : "Server error");
            response.getWriter().write(gson.toJson(err));
        }
    }
}
