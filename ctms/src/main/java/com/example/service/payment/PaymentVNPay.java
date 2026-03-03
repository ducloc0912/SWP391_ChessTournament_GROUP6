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

    /** Tạo URL thanh toán VNPay. Đăng ký có phí: luôn dùng participantId (đã tạo Participant PendingPayment khi đăng ký). */
    public String createPaymentUrl(int amount, String ipAddress, int userId, int tournamentId, int participantId) {
        return createPaymentUrlInternal(amount, ipAddress, userId, tournamentId, String.valueOf(participantId));
    }

    private String createPaymentUrlInternal(int amount, String ipAddress, int userId, int tournamentId, String orderInfoLastPart) {
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        long amountVal = (long) amount * 100;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", VNPayConfig.vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amountVal));
        vnp_Params.put("vnp_CurrCode", "VND");

        String vnp_TxnRef = VNPayConfig.getRandomNumber(8);
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo",
                "Thanh toan phi tham gia giai dau_CTMS_" + userId + "_" + tournamentId + "_" + orderInfoLastPart);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", VNPayConfig.vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", ipAddress);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        // Build URL data
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(VNPayConfig.secretKey, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = VNPayConfig.vnp_PayUrl + "?" + queryUrl;

        return paymentUrl;
    }

    public Map<String, Object> verifyAndSavePayment(Map<String, String> fields) {
        Map<String, Object> response = new HashMap<>();

        String vnp_SecureHash = fields.get("vnp_SecureHash");
        if (fields.containsKey("vnp_SecureHashType")) {
            fields.remove("vnp_SecureHashType");
        }
        if (fields.containsKey("vnp_SecureHash")) {
            fields.remove("vnp_SecureHash");
        }

        if (vnp_SecureHash == null || vnp_SecureHash.isEmpty()) {
            response.put("success", false);
            response.put("message", "Chữ ký không hợp lệ");
            return response;
        }

        String signValue = VNPayConfig.hashAllFields(fields);
        String signValueEncoded = VNPayConfig.hashAllFieldsEncoded(fields);

        // Kiểm tra chữ ký (VNPay có thể trả hash chữ hoa; một số môi trường dùng chuỗi raw, một số dùng encoded)
        boolean validSignature = signValue.equalsIgnoreCase(vnp_SecureHash) || signValueEncoded.equalsIgnoreCase(vnp_SecureHash);
        if (validSignature) {
            if ("00".equals(fields.get("vnp_ResponseCode"))) {
                // Giao dịch thành công
                String orderInfo = fields.get("vnp_OrderInfo"); // VD: Thanh toan phi tham gia giai dau_CTMS_1_2_3
                String vnp_Amount = fields.get("vnp_Amount");

                int userId = 0;
                int tournamentId = 0;
                int participantId = 0;
                try {
                    String[] parts = orderInfo.split("_CTMS_");
                    if (parts.length > 1) {
                        String[] ids = parts[1].split("_");
                        userId = Integer.parseInt(ids[0]);
                        tournamentId = Integer.parseInt(ids[1]);
                        if (ids.length > 2) participantId = Integer.parseInt(ids[2]);
                    }
                } catch (Exception e) {
                    System.out.println("Lỗi parse order info");
                }

                BigDecimal amountDb = new BigDecimal(vnp_Amount).divide(new BigDecimal(100));

                PaymentTransaction tx = new PaymentTransaction();
                tx.setUserId(userId);
                tx.setTournamentId(tournamentId);
                tx.setType("EntryFee");
                tx.setAmount(amountDb);
                tx.setDescription(orderInfo + " | TxnRef: " + fields.get("vnp_TxnRef"));

                boolean isSaved = paymentDAO.insertTransactionAndUpdateParticipant(tx, participantId);

                if (isSaved) {
                    response.put("success", true);
                    response.put("message", "Thanh toán thành công");
                } else {
                    response.put("success", false);
                    response.put("message", "Lưu thanh toán thất bại tại hệ thống");
                }
            } else {
                response.put("success", false);
                response.put("message", "Giao dịch không thành công hoặc bị hủy");
            }
        } else {
            response.put("success", false);
            response.put("message", "Chữ ký không hợp lệ");
        }

        return response;
    }
}
