package com.example.controller.user;

import com.example.DAO.PaymentDAO;
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
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/user/withdraw")
public class UserWithdrawServlet extends HttpServlet {

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
            java.util.List<Map<String, Object>> withdrawals = paymentDAO.getWithdrawalsByUserId(user.getUserId());
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("data", withdrawals);
            resp.getWriter().write(gson.toJson(responseData));
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"success\": false, \"message\": \"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
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
            Map<String, Object> body = gson.fromJson(req.getReader(), Map.class);
            if (body == null || !body.containsKey("amount") || !body.containsKey("bankName") || !body.containsKey("bankAccountNumber") || !body.containsKey("bankAccountName")) {
                resp.getWriter().write("{\"success\": false, \"message\": \"Thiếu thông tin rút tiền\"}");
                return;
            }

            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String bankName = (String) body.get("bankName");
            String bankAccountNumber = (String) body.get("bankAccountNumber");
            String bankAccountName = (String) body.get("bankAccountName");

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                resp.getWriter().write("{\"success\": false, \"message\": \"Số tiền rút không hợp lệ\"}");
                return;
            }

            if (user.getBalance() == null || user.getBalance().compareTo(amount) < 0) {
                resp.getWriter().write("{\"success\": false, \"message\": \"Số dư không đủ để thực hiện rút tiền\"}");
                return;
            }

            boolean success = paymentDAO.createWithdrawalRequest(user.getUserId(), amount, bankName, bankAccountNumber, bankAccountName);
            Map<String, Object> responseData = new HashMap<>();
            if (success) {
                user.setBalance(user.getBalance().subtract(amount)); // Cập nhật balance trên session
                session.setAttribute("user", user);

                responseData.put("success", true);
                responseData.put("message", "Đã gửi yêu cầu rút tiền thành công.");
            } else {
                responseData.put("success", false);
                responseData.put("message", "Số dư không đủ hoặc có lỗi hệ thống.");
            }
            resp.getWriter().write(gson.toJson(responseData));

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"success\": false, \"message\": \"" + e.getMessage() + "\"}");
        }
    }
}
