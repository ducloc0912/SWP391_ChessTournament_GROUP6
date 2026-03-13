package com.example.controller.user;

import com.example.DAO.PaymentDAO;
import com.example.model.entity.PaymentTransaction;
import com.example.model.entity.User;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/user/transactions")
public class UserTransactionServlet extends HttpServlet {

    private final PaymentDAO paymentDAO = new PaymentDAO();
    private final Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd HH:mm:ss").create();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"success\": false, \"message\": \"Not authenticated\"}");
            return;
        }

        User user = (User) session.getAttribute("user");
        try {
            List<PaymentTransaction> transactions = paymentDAO.getTransactionsByUserId(user.getUserId());
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("data", transactions);
            resp.getWriter().write(gson.toJson(responseData));
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"success\": false, \"message\": \"" + e.getMessage() + "\"}");
        }
    }
}
