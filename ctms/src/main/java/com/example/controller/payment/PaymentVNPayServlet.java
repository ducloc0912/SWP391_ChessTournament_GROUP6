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

/**
 * API VNPay:
 * - POST /api/vnpay/create-payment  → tạo URL thanh toán, trả JSON { success, paymentUrl }.
 * - GET  /api/vnpay/vnpay-return    → frontend gọi kèm query VNPay để xác thực, trả JSON { success, message }.
 * - GET  /api/vnpay/vnpay-ipn       → VNPay gọi (IPN), trả JSON { RspCode, Message }.
 */
@WebServlet("/api/vnpay/*")
public class PaymentVNPayServlet extends HttpServlet {

    private final PaymentVNPay paymentService = new PaymentVNPay();
    private final Gson gson = new Gson();

    private void addCorsHeaders(HttpServletRequest req, HttpServletResponse resp) {
        String origin = req.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            resp.setHeader("Access-Control-Allow-Origin", "*");
        } else {
            resp.setHeader("Access-Control-Allow-Origin", origin);
            resp.setHeader("Vary", "Origin");
        }
        resp.setHeader("Access-Control-Allow-Credentials", "true");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        addCorsHeaders(req, resp);
        String path = req.getPathInfo();
        Map<String, Object> result = new HashMap<>();

        if ("/create-payment".equals(path)) {
            try {
                String body = BodyUtil.readBody(req);
                Map<?, ?> json = body == null || body.isEmpty() ? null : gson.fromJson(body, Map.class);
                if (json == null) {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    result.put("success", false);
                    result.put("message", "Thiếu dữ liệu.");
                    resp.getWriter().write(gson.toJson(result));
                    return;
                }
                int amount = getInt(json, "amount", 0);
                int userId = getInt(json, "userId", 0);
                int tournamentId = getInt(json, "tournamentId", 0);
                int participantId = getInt(json, "participantId", 0);
                String ip = VNPayConfig.getIpAddress(req);

                if (amount <= 0 || userId <= 0 || tournamentId <= 0 || participantId <= 0) {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    result.put("success", false);
                    result.put("message", "Thiếu hoặc sai amount, userId, tournamentId, participantId.");
                    resp.getWriter().write(gson.toJson(result));
                    return;
                }

                String paymentUrl = paymentService.createPaymentUrl(amount, ip, userId, tournamentId, participantId);
                result.put("success", true);
                result.put("paymentUrl", paymentUrl);
                resp.getWriter().write(gson.toJson(result));
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                result.put("success", false);
                result.put("message", "Lỗi tạo link thanh toán: " + (e.getMessage() != null ? e.getMessage() : ""));
                resp.getWriter().write(gson.toJson(result));
            }
            return;
        }

        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
        result.put("success", false);
        result.put("message", "Invalid endpoint");
        resp.getWriter().write(gson.toJson(result));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        addCorsHeaders(req, resp);
        String path = req.getPathInfo();
        Map<String, String> params = new HashMap<>();
        for (Enumeration<String> names = req.getParameterNames(); names.hasMoreElements(); ) {
            String name = names.nextElement();
            String value = req.getParameter(name);
            if (value != null && !value.isEmpty()) {
                params.put(name, value);
            }
        }

        if ("/vnpay-return".equals(path)) {
            Map<String, Object> data = paymentService.verifyAndSavePayment(params);
            resp.getWriter().write(gson.toJson(data));
            return;
        }

        // VNPay IPN: hỗ trợ cả /vnpay-ipn (cũ) và /ipn (theo URL bạn cấu hình: /ctms/api/vnpay/ipn)
        if ("/vnpay-ipn".equals(path) || "/ipn".equals(path)) {
            Map<String, Object> data = paymentService.verifyAndSavePayment(params);
            String rspCode = data.containsKey("RspCode") ? String.valueOf(data.get("RspCode")) : "99";
            String message = data.containsKey("Message") ? String.valueOf(data.get("Message")) : "Unknown";
            Map<String, String> ipnResponse = new HashMap<>();
            ipnResponse.put("RspCode", rspCode);
            ipnResponse.put("Message", message);
            resp.getWriter().write(gson.toJson(ipnResponse));
            return;
        }

        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
        Map<String, Object> err = new HashMap<>();
        err.put("success", false);
        err.put("message", "Invalid endpoint");
        resp.getWriter().write(gson.toJson(err));
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        addCorsHeaders(req, resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    private static int getInt(Map<?, ?> m, String key, int def) {
        Object v = m == null ? null : m.get(key);
        if (v instanceof Number) return ((Number) v).intValue();
        if (v instanceof String) {
            try { return Integer.parseInt((String) v); } catch (NumberFormatException e) { return def; }
        }
        return def;
    }
}
