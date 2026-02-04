package com.example.controller.user;

import com.example.service.user.RegisterService;
import com.google.gson.Gson;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.util.HashMap;

@WebServlet("/api/register")
public class RegisterController extends HttpServlet {

    private final RegisterService registerService = new RegisterService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Gson gson = new Gson();
        HashMap<String, Object> data =
                gson.fromJson(request.getReader(), HashMap.class);

        HashMap<String, Object> result =
                registerService.register(
                        (String) data.get("firstName"),
                        (String) data.get("lastName"),
                        (String) data.get("username"),
                        (String) data.get("phone"),
                        (String) data.get("email"),
                        (String) data.get("address"),
                        (String) data.get("password"),
                        (String) data.get("confirmPassword"),
                        Boolean.TRUE.equals(data.get("agree"))
                );

        response.getWriter().write(gson.toJson(result));
    }
}
