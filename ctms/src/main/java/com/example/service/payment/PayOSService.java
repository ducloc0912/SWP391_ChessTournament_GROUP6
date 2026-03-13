package com.example.service.payment;

import com.example.DAO.PaymentDAO;
import com.example.DAO.UserDAO;
import com.example.model.entity.PaymentTransaction;
import com.example.model.entity.User;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.WebhookData;
// Removed invalid WebhookType import

import java.math.BigDecimal;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class PayOSService {

    private final String clientId = "565e3111-45b0-4360-b766-e75a2d02fa6c";
    private final String apiKey = "79558d7b-fc73-4bd2-a9fb-ec1ccea9dece";
    private final String checksumKey = "e2254be46e467a9d2314f0dfa8a2bbdb2f15035cd32453fdfe0d7ad91211f805";
    private final PayOS payOS;
    private final UserDAO userDAO;
    private final PaymentDAO paymentDAO;

    public PayOSService() {
        payOS = new PayOS(clientId, apiKey, checksumKey);
        userDAO = new UserDAO();
        paymentDAO = new PaymentDAO();
    }

    public Map<String, Object> createPaymentLink(int userId, int amount, String returnUrl, String cancelUrl) {
        Map<String, Object> result = new HashMap<>();
        try {
            String currentTimeString = String.valueOf(new Date().getTime());
            long orderCode = Long.parseLong(currentTimeString.substring(currentTimeString.length() - 8));
            String description = "Nap CTMS " + userId;

            PaymentLinkItem item = PaymentLinkItem.builder().name("Nap tien vi CTMS").quantity(1).price((long) amount).build();
            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount((long) amount)
                    .description(description)
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .item(item)
                    .build();

            CreatePaymentLinkResponse data = payOS.paymentRequests().create(paymentData);

            result.put("success", true);
            result.put("checkoutUrl", data.getCheckoutUrl());
            result.put("paymentLinkId", data.getPaymentLinkId());
            result.put("orderCode", orderCode);

        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    public Map<String, Object> handleWebhook(String requestBody) {
        Map<String, Object> result = new HashMap<>();
        try {
            WebhookData data = payOS.webhooks().verify(requestBody);

            if (data != null) {
                // Verified successfully.
                if ("00".equals(data.getCode()) || "PAID".equalsIgnoreCase(data.getCode()) || data.getCode() != null) {
                    // Extract userId from description. Format "Nap CTMS {userId}"
                    String description = data.getDescription();
                    int userId = 0;
                    if (description != null && description.startsWith("Nap CTMS ")) {
                        try {
                            userId = Integer.parseInt(description.replace("Nap CTMS ", "").trim());
                        } catch (Exception e) {
                        }
                    }

                    if (userId > 0) {
                        BigDecimal amount = new BigDecimal(data.getAmount());

                        // Cộng tiền
                        boolean updated = userDAO.addBalance(userId, amount);
                        if (updated) {
                            User currentUser = userDAO.getUserById(userId);
                            PaymentTransaction tx = new PaymentTransaction();
                            tx.setUserId(userId);
                            tx.setType("Deposit");
                            tx.setAmount(amount);
                            tx.setBalanceAfter(currentUser.getBalance());
                            tx.setDescription("Nạp tiền tài khoản CTMS qua PayOS");
                            tx.setReferenceId((int) (data.getOrderCode() % Integer.MAX_VALUE));
                            paymentDAO.insertDepositTransaction(tx);
                        }
                    }
                }
                result.put("success", true);
                result.put("message", "Webhook processed successfully");
            } else {
                result.put("success", false);
                result.put("message", "Verify failed");
            }

        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }
}
