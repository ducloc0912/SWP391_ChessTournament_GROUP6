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
        vnp_Params.put("vnp_SecureHashType", "HMACSHA512");

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

        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);

            if (fieldValue != null && !fieldValue.isEmpty()) {

                // QUERY STRING gửi sang VNPay
                String encodedName = URLEncoder.encode(fieldName, StandardCharsets.US_ASCII);
                String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII);
                query.append(encodedName)
                        .append("=")
                        .append(encodedValue);

                if (itr.hasNext()) {
                    query.append("&");
                }
            }
        }

        // HASH DATA: dùng format giống VNPayConfig.hashAllFields (fieldName=fieldValue, không encode)
        // và loại bỏ các field vnp_SecureHash / vnp_SecureHashType theo đúng khuyến nghị VNPay
        Map<String, String> signParams = new HashMap<>(vnp_Params);
        signParams.remove("vnp_SecureHash");
        signParams.remove("vnp_SecureHashType");
        String secureHash = VNPayConfig.hashAllFields(signParams);

        query.append("&vnp_SecureHash=").append(secureHash);
        return VNPayConfig.vnp_PayUrl + "?" + query.toString();
    }

    /* ================= VERIFY & SAVE ================= */

    public Map<String, Object> verifyAndSavePayment(Map<String, String> fields) {

        Map<String, Object> response = new HashMap<>();

        // 1. Verify chữ ký
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

        // 2. Kiểm tra mã kết quả giao dịch
        String vnp_ResponseCode = fields.get("vnp_ResponseCode");
        if (!"00".equals(vnp_ResponseCode)) {
            response.put("success", false);
            response.put("message", "Giao dịch thất bại (mã: " + vnp_ResponseCode + ")");
            response.put("RspCode", "99");
            response.put("Message", "Transaction failed");
            return response;
        }

        // 3. Parse thông tin nghiệp vụ từ vnp_OrderInfo
        // Format đã tạo ở createPaymentUrl:
        // "Thanh toan phi tham gia giai dau_CTMS_" + userId + "_" + tournamentId + "_" + participantId
        String orderInfo = fields.get("vnp_OrderInfo");
        String amountStr = fields.get("vnp_Amount");
        String txnRef = fields.get("vnp_TxnRef");

        if (orderInfo == null || amountStr == null) {
            response.put("success", false);
            response.put("message", "Thiếu dữ liệu đơn hàng từ VNPay");
            response.put("RspCode", "99");
            response.put("Message", "Missing order data");
            return response;
        }

        try {
            int userId = 0;
            int tournamentId = 0;
            int participantId = 0;

            int idx = orderInfo.indexOf("_CTMS_");
            if (idx >= 0) {
                String meta = orderInfo.substring(idx + "_CTMS_".length());
                String[] parts = meta.split("_");
                if (parts.length >= 3) {
                    userId = Integer.parseInt(parts[0]);
                    tournamentId = Integer.parseInt(parts[1]);
                    participantId = Integer.parseInt(parts[2]);
                }
            }

            if (userId <= 0 || tournamentId <= 0 || participantId <= 0) {
                response.put("success", false);
                response.put("message", "Không đọc được thông tin user/tournament/participant từ OrderInfo");
                response.put("RspCode", "99");
                response.put("Message", "Invalid OrderInfo");
                return response;
            }

            // vnp_Amount là số *100, convert về VND thực tế
            BigDecimal amount = new BigDecimal(amountStr).divide(BigDecimal.valueOf(100));

            // 4. Tạo bản ghi PaymentTransaction và cập nhật Participant (is_paid = 1)
            PaymentTransaction tx = new PaymentTransaction();
            tx.setUserId(userId);
            tx.setTournamentId(tournamentId);
            tx.setType("EntryFee");
            tx.setAmount(amount);
            tx.setBalanceAfter(null); // Nếu sau này có ví/balance thì set sau
            tx.setDescription("VNPay entry fee, participantId=" + participantId + ", txnRef=" + txnRef);
            tx.setReferenceId(participantId);

            boolean saved = paymentDAO.insertTransactionAndUpdateParticipant(tx, participantId);
            if (!saved) {
                response.put("success", false);
                response.put("message", "Không lưu được giao dịch thanh toán");
                response.put("RspCode", "99");
                response.put("Message", "Cannot save transaction");
                return response;
            }

            // 5. Thành công
            response.put("success", true);
            response.put("message", "Thanh toán thành công");
            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");
            return response;

        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Lỗi xử lý dữ liệu thanh toán: " + e.getMessage());
            response.put("RspCode", "99");
            response.put("Message", "Exception when saving payment");
            return response;
        }
    }
}