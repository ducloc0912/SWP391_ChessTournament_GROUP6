package com.example.controller.payment;

import com.example.service.payment.PaymentVNPay;
import com.example.util.BodyUtil;
import com.example.util.VNPayConfig;
import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/vnpay/*")
public class PaymentVNPayServlet extends HttpServlet {

    private PaymentVNPay paymentService = new PaymentVNPay();
    private Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getPathInfo();
        Map<String, Object> responseData = new HashMap<>();

        try {
            if ("/create-payment".equals(path)) {
                Map<String, Object> body = gson.fromJson(BodyUtil.readBody(req), Map.class);

                String ipAddress = VNPayConfig.getIpAddress(req);
                int amount = body.get("amount") instanceof Number ? ((Number) body.get("amount")).intValue() : 0;
                int userId = body.get("userId") instanceof Number ? ((Number) body.get("userId")).intValue() : 0;
                int tournamentId = body.get("tournamentId") instanceof Number ? ((Number) body.get("tournamentId")).intValue() : 0;
                int participantId = body.get("participantId") instanceof Number ? ((Number) body.get("participantId")).intValue() : 0;

                String paymentUrl = paymentService.createPaymentUrl(amount, ipAddress, userId, tournamentId, participantId);

                responseData.put("success", true);
                responseData.put("paymentUrl", paymentUrl);
                resp.getWriter().write(gson.toJson(responseData));
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                responseData.put("success", false);
                responseData.put("message", "Invalid VNPay Endpoint");
                resp.getWriter().write(gson.toJson(responseData));
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            responseData.put("success", false);
            responseData.put("message", "Lỗi Server Payment: " + e.getMessage());
            resp.getWriter().write(gson.toJson(responseData));
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getPathInfo();
        Map<String, Object> responseData = new HashMap<>();

        try {
            if ("/vnpay-return".equals(path)) {
                // Xử lý VNPay trả về
                Map<String, String> fields = new HashMap<>();
                for (Enumeration<String> params = req.getParameterNames(); params.hasMoreElements();) {
                    String fieldName = params.nextElement();
                    String fieldValue = req.getParameter(fieldName);
                    if ((fieldValue != null) && (fieldValue.length() > 0)) {
                        fields.put(fieldName, fieldValue);
                    }
                }

                responseData = paymentService.verifyAndSavePayment(fields);
                resp.getWriter().write(gson.toJson(responseData));
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                responseData.put("success", false);
                responseData.put("message", "Invalid VNPay Return Endpoint");
                resp.getWriter().write(gson.toJson(responseData));
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            responseData.put("success", false);
            responseData.put("message", "Lỗi Server Payment Result: " + e.getMessage());
            resp.getWriter().write(gson.toJson(responseData));
        }
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_OK);
    }
}
