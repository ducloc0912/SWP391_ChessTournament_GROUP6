package com.example.service.user;

import com.example.DAO.OTPDAO;
import java.util.HashMap;

public class VerifyOTPService {

    public HashMap<String, Object> verifyOTP(String email, String otp) {
        HashMap<String, Object> result = new HashMap<>();

        if (email == null || otp == null) {
            result.put("success", false);
            result.put("message", "Missing email or OTP");
            return result;
        }

        OTPDAO otpDAO = new OTPDAO();

        if (otpDAO.verifyOTP(email, otp)) {
            otpDAO.deleteOTP(email);
            result.put("success", true);
        } else {
            result.put("success", false);
            result.put("message", "Invalid or expired OTP");
        }

        return result;
    }
}
