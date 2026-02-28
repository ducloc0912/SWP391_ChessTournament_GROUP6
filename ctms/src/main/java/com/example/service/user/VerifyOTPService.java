package com.example.service.user;

import com.example.DAO.OTPDAO;
import java.util.HashMap;

public class VerifyOTPService {

    public HashMap<String, Object> verifyOTP(String email, String otp) {

        HashMap<String, Object> result = new HashMap<>();

        if (email == null || email.trim().isEmpty()
                || otp == null || otp.trim().isEmpty()) {

            result.put("success", false);
            result.put("message", "Missing email or OTP");
            return result;
        }

        OTPDAO otpDAO = new OTPDAO();

        boolean valid = otpDAO.verifyOTP(email, otp);

        if (!valid) {
            result.put("success", false);
            result.put("message", "Invalid or expired OTP");
            return result;
        }

        result.put("success", true);
        result.put("message", "OTP verified successfully");

        return result;
    }
}
