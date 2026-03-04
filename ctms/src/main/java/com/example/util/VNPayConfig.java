package com.example.util;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class VNPayConfig {

    public static String vnp_PayUrl =
            "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    // Return URL: FE đang được expose qua ngrok
    // https://nonsubjective-mayola-radiosymmetrical.ngrok-free.dev -> http://localhost:5173
    public static String vnp_ReturnUrl =
            "https://nonsubjective-mayola-radiosymmetrical.ngrok-free.dev/payment-result";

    // Thông tin sandbox mới từ email VNPay
    public static String vnp_TmnCode = "ZJKWGRX8";
    public static String secretKey = "XAUM9PJRWUAMGON9WTCSNHGBJ1YTHFU6";

    /* ================= HASH ================= */

    public static String hashAllFields(Map<String, String> fields) {

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder sb = new StringBuilder();
        boolean first = true;

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);

            if (fieldValue != null && !fieldValue.isEmpty()
                    && !"vnp_SecureHash".equals(fieldName)
                    && !"vnp_SecureHashType".equals(fieldName)) {
                if (!first) {
                    sb.append("&");
                }
                first = false;
                String encodedName = java.net.URLEncoder.encode(fieldName, StandardCharsets.US_ASCII);
                String encodedValue = java.net.URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII);
                sb.append(encodedName);
                sb.append("=");
                sb.append(encodedValue);
            }
        }

        return hmacSHA512(secretKey, sb.toString());
    }

    public static String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec =
                    new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKeySpec);

            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder();
            for (byte b : bytes) {
                hash.append(String.format("%02x", b & 0xff));
            }
            return hash.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-FORWARDED-FOR");
        if (ip == null) ip = request.getRemoteAddr();
        return ip;
    }

    public static String getRandomNumber(int len) {
        Random rnd = new Random();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}