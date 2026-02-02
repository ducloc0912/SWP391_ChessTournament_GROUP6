package com.example.controller.user;

import com.example.service.user.ResetPasswordService;
import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.HashMap;

@WebServlet("/api/reset-password")
public class ResetPasswordController extends HttpServlet {

    private final ResetPasswordService resetPasswordService =
            new ResetPasswordService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Gson gson = new Gson();
        HashMap<String, String> body =
                gson.fromJson(request.getReader(), HashMap.class);

        HashMap<String, Object> result =
                resetPasswordService.resetPassword(
                        body.get("email"),
                        body.get("password"),
                        body.get("confirmPassword")
                );

        response.getWriter().write(gson.toJson(result));
    }
}
