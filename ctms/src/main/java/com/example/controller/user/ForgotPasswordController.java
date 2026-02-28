package com.example.controller.user;

import com.example.service.user.ForgotPasswordService;
import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.HashMap;

@WebServlet("/api/forgot-password")
public class ForgotPasswordController extends HttpServlet {

    private final ForgotPasswordService forgotPasswordService =
            new ForgotPasswordService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Gson gson = new Gson();
        HashMap<String, Object> body =
                gson.fromJson(request.getReader(), HashMap.class);

        String email = (String) body.get("email");

        HashMap<String, Object> result =
                forgotPasswordService.forgotPassword(email);

        response.getWriter().write(gson.toJson(result));
    }
}
