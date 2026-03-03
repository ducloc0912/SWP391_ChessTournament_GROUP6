package com.example.service.payment;

import com.example.DAO.PaymentDAO;
import com.example.model.entity.PaymentTransaction;
import com.example.util.VNPayConfig;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

public class PaymentVNPay {

    private PaymentDAO paymentDAO = new PaymentDAO();

    public String createPaymentUrl(int amount, String ipAddress,
                                   int userId, int tournamentId, int participantId) {

        long amountVal = (long) amount * 100;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", VNPayConfig.vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amountVal));
        vnp_Params.put("vnp_CurrCode", "VND");

        String txnRef = VNPayConfig.getRandomNumber(8);
        vnp_Params.put("vnp_TxnRef", txnRef);

        vnp_Params.put("vnp_OrderInfo",
                "Thanh toan phi tham gia giai dau_CTMS_" +
                        userId + "_" + tournamentId + "_" + participantId);

        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", VNPayConfig.vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", ipAddress);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");

        vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));
        cld.add(Calendar.MINUTE, 15);
        vnp_Params.put("vnp_ExpireDate", formatter.format(cld.getTime()));

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);

            if (fieldValue != null) {

                // 🔥 HASH DATA (RAW – không encode)
                hashData.append(fieldName).append("=").append(fieldValue);

                // 🔥 QUERY (encode UTF-8)
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                        .append("=")
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));

                if (itr.hasNext()) {
                    hashData.append("&");
                    query.append("&");
                }
            }
        }

        String secureHash = VNPayConfig.hmacSHA512(
                VNPayConfig.secretKey,
                hashData.toString()
        );

        query.append("&vnp_SecureHash=").append(secureHash);
return VNPayConfig.vnp_PayUrl + "?" + query.toString();
    }

    /* ================= VERIFY & SAVE ================= */

    public Map<String, Object> verifyAndSavePayment(Map<String, String> fields) {

        Map<String, Object> response = new HashMap<>();

        String vnp_SecureHash = fields.get("vnp_SecureHash");
        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String signValue = VNPayConfig.hashAllFields(fields);

        if (!signValue.equalsIgnoreCase(vnp_SecureHash)) {
            response.put("success", false);
            response.put("message", "Invalid signature");
            response.put("RspCode", "97");
            response.put("Message", "Invalid signature");
            return response;
        }

        String vnp_ResponseCode = fields.get("vnp_ResponseCode");
        if (!"00".equals(vnp_ResponseCode)) {
            response.put("success", false);
            response.put("message", "Giao dịch thất bại (mã: " + vnp_ResponseCode + ")");
            response.put("RspCode", "99");
            response.put("Message", "Transaction failed");
            return response;
        }

        // TODO: Update DB tại đây nếu cần (insert transaction, update participant,...)

        response.put("success", true);
        response.put("message", "Thanh toán thành công");
        response.put("RspCode", "00");
        response.put("Message", "Confirm Success");
        return response;
    }
}