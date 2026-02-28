package com.example.controller.user;

import com.example.service.user.VerifyOTPService;
import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.HashMap;

@WebServlet("/api/verify-otp")
public class VerifyOTPController extends HttpServlet {

    private final VerifyOTPService verifyOTPService =
            new VerifyOTPService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Gson gson = new Gson();
        HashMap<String, Object> body =
                gson.fromJson(request.getReader(), HashMap.class);

        String email = (String) body.get("email");
        String otp = (String) body.get("otp");

        HashMap<String, Object> result =
                verifyOTPService.verifyOTP(email, otp);

        response.getWriter().write(gson.toJson(result));
    }
}
