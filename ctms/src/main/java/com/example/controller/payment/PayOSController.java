package com.example.controller.payment;

import com.example.model.entity.User;
import com.example.service.payment.PayOSService;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/payos/*")
public class PayOSController extends HttpServlet {

    private final PayOSService payOSService = new PayOSService();
    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");
        
        String pathInfo = req.getPathInfo();
        
        if ("/create-payment".equals(pathInfo)) {
            handleCreatePayment(req, resp);
        } else if ("/webhook".equals(pathInfo)) {
            handleWebhook(req, resp);
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"success\": false, \"message\": \"Not found\"}");
        }
    }

    private void handleCreatePayment(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"success\": false, \"message\": \"Not authenticated\"}");
            return;
        }

        User user = (User) session.getAttribute("user");
        
        try {
            JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
            if (body == null || !body.has("amount")) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"success\": false, \"message\": \"Missing amount\"}");
                return;
            }
            
            int amount = body.get("amount").getAsInt();
            String returnUrl = body.has("returnUrl") ? body.get("returnUrl").getAsString() : "http://localhost:5173/wallet";
            String cancelUrl = body.has("cancelUrl") ? body.get("cancelUrl").getAsString() : "http://localhost:5173/wallet";
            
            Map<String, Object> result = payOSService.createPaymentLink(user.getUserId(), amount, returnUrl, cancelUrl);
            resp.getWriter().write(gson.toJson(result));
            
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"success\": false, \"message\": \"" + e.getMessage() + "\"}");
        }
    }

    private void handleWebhook(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        
        String requestBody = sb.toString();
        // Return 2xx immediately as per webhook best practices, but for simplicity here we process synchronously
        Map<String, Object> result = payOSService.handleWebhook(requestBody);
        
        if ((Boolean) result.getOrDefault("success", false)) {
            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().write(gson.toJson(Map.of("success", true)));
        } else {
            // Even if verification failed, we should probably return 200 so PayOS stops retrying,
            // or return 400 if it's completely malformed.
            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().write(gson.toJson(result));
        }
    }
}
